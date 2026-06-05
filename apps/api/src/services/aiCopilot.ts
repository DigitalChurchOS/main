import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { AiCopilotProvider } from './integrations/interfaces';
import { recordUsage } from './billing';

export async function createAiCopilotJob(
  tenantId: string,
  data: {
    promptType: string;
    inputPrompt: string;
  }
): Promise<any> {
  const { promptType, inputPrompt } = data;

  const validTypes = [
    'announcement',
    'email',
    'sms',
    'push',
    'course_outline',
    'quiz',
    'faq',
    'crm_reply',
    'workflow_suggestions',
  ];

  if (!validTypes.includes(promptType)) {
    throw new Error(`Invalid prompt type: ${promptType}`);
  }

  if (!inputPrompt || inputPrompt.trim() === '') {
    throw new Error('inputPrompt is required');
  }

  return await prisma.aiAssistantJob.create({
    data: {
      tenantId,
      promptType,
      inputPrompt,
      status: 'pending',
    },
  });
}

export async function runAiCopilotJob(
  tenantId: string,
  jobId: string,
  options?: {
    audience?: string;
    durationWeeks?: number;
    numQuestions?: number;
    question?: string;
    tone?: string;
  }
): Promise<any> {
  const job = await prisma.aiAssistantJob.findFirst({
    where: { id: jobId, tenantId },
  });
  if (!job) {
    throw new Error('AI Copilot Job not found');
  }

  await prisma.aiAssistantJob.update({
    where: { id: jobId },
    data: { status: 'processing', error: null },
  });

  try {
    // 1. Resolve AI provider driver
    const driver: AiCopilotProvider = await resolveDriver(tenantId, 'ai_copilot');

    let resultText = '';

    // 2. Dispatch to specific driver method
    switch (job.promptType) {
      case 'announcement': {
        const res = await driver.generateAnnouncement(job.inputPrompt);
        if (!res.success) throw new Error(res.error || 'Announcement drafting failed');
        resultText = res.text!;
        break;
      }
      case 'email': {
        const audience = options?.audience || 'Members';
        const res = await driver.generateEmailDraft(job.inputPrompt, audience);
        if (!res.success) throw new Error(res.error || 'Email newsletter drafting failed');
        resultText = res.text!;
        break;
      }
      case 'sms': {
        const res = await driver.generateSMSDraft(job.inputPrompt);
        if (!res.success) throw new Error(res.error || 'SMS drafting failed');
        resultText = res.text!;
        break;
      }
      case 'push': {
        const res = await driver.generatePushNotification(job.inputPrompt);
        if (!res.success) throw new Error(res.error || 'Push notification drafting failed');
        resultText = res.text!;
        break;
      }
      case 'course_outline': {
        const weeks = options?.durationWeeks || 6;
        const res = await driver.generateCourseOutline(job.inputPrompt, weeks);
        if (!res.success) throw new Error(res.error || 'Course outline generation failed');
        resultText = res.text!;
        break;
      }
      case 'quiz': {
        const qCount = options?.numQuestions || 5;
        const res = await driver.generateQuiz(job.inputPrompt, qCount);
        if (!res.success) throw new Error(res.error || 'Quiz generation failed');
        resultText = res.text!;
        break;
      }
      case 'faq': {
        const q = options?.question || 'What is our policy?';
        const res = await driver.generateFAQ(job.inputPrompt, q);
        if (!res.success) throw new Error(res.error || 'FAQ drafting failed');
        resultText = res.text!;
        break;
      }
      case 'crm_reply': {
        const tone = options?.tone || 'compassionate';
        const res = await driver.generateCrmReply(job.inputPrompt, tone);
        if (!res.success) throw new Error(res.error || 'CRM reply drafting failed');
        resultText = res.text!;
        break;
      }
      case 'workflow_suggestions': {
        const res = await driver.generateWorkflowSuggestions(job.inputPrompt);
        if (!res.success) throw new Error(res.error || 'Workflow suggestion generation failed');
        resultText = res.text!;
        break;
      }
      default:
        throw new Error(`Unsupported prompt type: ${job.promptType}`);
    }

    // 3. Billing tracking - calculate mock token usage based on output size (1 word ~ 1.5 tokens)
    const tokens = Math.max(10, Math.ceil(resultText.split(/\s+/).length * 1.5));

    // Record the usage in the core billing meter
    await recordUsage(tenantId, 'ai_tokens', tokens);

    return await prisma.aiAssistantJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        generatedContent: resultText,
        tokensUsed: tokens,
      },
    });
  } catch (err: any) {
    console.error(`AI Copilot Job ${jobId} failed:`, err);
    return await prisma.aiAssistantJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: err.message || 'Internal AI Copilot execution error',
      },
    });
  }
}

export async function getAiCopilotJob(tenantId: string, jobId: string): Promise<any> {
  const job = await prisma.aiAssistantJob.findFirst({
    where: { id: jobId, tenantId },
  });
  if (!job) {
    throw new Error('AI Copilot Job not found');
  }
  return job;
}

export async function listAiCopilotJobs(
  tenantId: string,
  filters: { status?: string; promptType?: string } = {}
): Promise<any[]> {
  const whereClause: any = { tenantId };

  if (filters.status) {
    whereClause.status = filters.status;
  }
  if (filters.promptType) {
    whereClause.promptType = filters.promptType;
  }

  return await prisma.aiAssistantJob.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });
}
