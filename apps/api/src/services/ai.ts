import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { AiCopilotProvider } from './integrations/interfaces';

export async function createAiJob(
  tenantId: string,
  data: {
    mediaAssetId?: string;
    jobType: string;
    targetLang?: string;
    transcript?: string; // Optional pre-provided transcript to bypass transcription step
  }
): Promise<any> {
  // Validate Job Type
  const validTypes = [
    'transcription',
    'subtitles',
    'summary',
    'clips',
    'blog_draft',
    'devotional',
    'social_caption',
    'translation',
  ];
  if (!validTypes.includes(data.jobType)) {
    throw new Error(`Invalid job type: ${data.jobType}`);
  }

  // Validate MediaAsset if provided
  if (data.mediaAssetId) {
    const asset = await prisma.mediaAsset.findFirst({
      where: { id: data.mediaAssetId, tenantId },
    });
    if (!asset) {
      throw new Error('Media asset not found');
    }
  }

  return await prisma.aiMediaJob.create({
    data: {
      tenantId,
      mediaAssetId: data.mediaAssetId || null,
      status: 'pending',
      jobType: data.jobType,
      targetLang: data.targetLang || null,
      transcript: data.transcript || null,
    },
  });
}

export async function runAiJob(
  jobId: string,
  tenantId: string,
  options?: { numClips?: number; duration?: number; prompt?: string }
): Promise<any> {
  const job = await prisma.aiMediaJob.findFirst({
    where: { id: jobId, tenantId },
  });
  if (!job) {
    throw new Error('AI Job not found');
  }

  // Update status to processing
  await prisma.aiMediaJob.update({
    where: { id: jobId },
    data: { status: 'processing', error: null },
  });

  if (job.jobType === 'clips' && options?.duration !== undefined) {
    if (![30, 45, 60, 90].includes(options.duration)) {
      throw new Error('AI clip duration option must be 30, 45, 60, or 90 seconds');
    }
  }

  try {
    // 1. Resolve the AI driver
    const driver: AiCopilotProvider = await resolveDriver(tenantId, 'ai_copilot');

    // 2. Fetch MediaAsset details if linked
    let mediaAsset = null;
    if (job.mediaAssetId) {
      mediaAsset = await prisma.mediaAsset.findFirst({
        where: { id: job.mediaAssetId, tenantId },
      });
    }

    const sourceUrl = mediaAsset?.sourceUrl || 'https://mock.churchos.io/audio/sermon.mp3';
    const activeTranscript = job.transcript || 'Mock transcript for walking in grace sermon.';

    const updateData: any = {
      status: 'completed',
    };

    // 3. Execute job task depending on jobType
    switch (job.jobType) {
      case 'transcription': {
        const result = await driver.transcribe(sourceUrl);
        if (!result.success) throw new Error(result.error || 'Transcription failed');
        updateData.transcript = result.text;
        break;
      }
      case 'subtitles': {
        const result = await driver.generateSubtitles(activeTranscript, 'srt');
        if (!result.success) throw new Error(result.error || 'Subtitles generation failed');
        updateData.subtitles = result.subtitles;
        break;
      }
      case 'summary': {
        const result = await driver.summarize(activeTranscript);
        if (!result.success) throw new Error(result.error || 'Summarization failed');
        updateData.summary = result.text;
        break;
      }
      case 'clips': {
        const result = await driver.suggestClips(activeTranscript, options);
        if (!result.success) throw new Error(result.error || 'Clips suggestion failed');
        updateData.metadataJson = JSON.stringify(result.clips);
        break;
      }
      case 'blog_draft': {
        const result = await driver.generateBlogDraft(activeTranscript);
        if (!result.success) throw new Error(result.error || 'Blog draft generation failed');
        updateData.blogDraft = result.text;
        break;
      }
      case 'devotional': {
        const result = await driver.generateDevotionalDraft(activeTranscript);
        if (!result.success) throw new Error(result.error || 'Devotional draft generation failed');
        updateData.devotionalDraft = result.text;
        break;
      }
      case 'social_caption': {
        const result = await driver.generateSocialCaptions(activeTranscript);
        if (!result.success) throw new Error(result.error || 'Social caption generation failed');
        updateData.socialCaption = result.text;
        break;
      }
      case 'translation': {
        const targetLang = job.targetLang || 'es';
        const result = await driver.translateText(activeTranscript, targetLang);
        if (!result.success) throw new Error(result.error || 'Translation failed');
        updateData.transcript = result.text; // Store translated output back in transcript field
        break;
      }
      default:
        throw new Error(`Unsupported job type: ${job.jobType}`);
    }

    // 4. Save completed job details
    return await prisma.aiMediaJob.update({
      where: { id: jobId },
      data: updateData,
    });
  } catch (err: any) {
    console.error(`AI Job ${jobId} failed:`, err);
    // Move job to failed state
    return await prisma.aiMediaJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: err.message || 'Internal AI execution error',
      },
    });
  }
}

export async function getAiJob(jobId: string, tenantId: string): Promise<any> {
  const job = await prisma.aiMediaJob.findFirst({
    where: { id: jobId, tenantId },
    include: {
      mediaAsset: true,
    },
  });
  if (!job) {
    throw new Error('AI Job not found');
  }
  return job;
}

export async function listAiJobs(
  tenantId: string,
  filters: {
    status?: string;
    mediaAssetId?: string;
  } = {}
): Promise<any[]> {
  const whereClause: any = {
    tenantId,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  }
  if (filters.mediaAssetId) {
    whereClause.mediaAssetId = filters.mediaAssetId;
  }

  return await prisma.aiMediaJob.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      mediaAsset: true,
    },
  });
}

export async function createManualClip(
  tenantId: string,
  data: {
    parentAssetId: string;
    title?: string;
    clipStartSeconds: number;
    clipEndSeconds: number;
  }
): Promise<any> {
  // 1. Validate parent exists
  const parent = await prisma.mediaAsset.findFirst({
    where: { id: data.parentAssetId, tenantId },
  });
  if (!parent) {
    throw new Error('Parent media asset not found');
  }

  // 2. Validate timing bounds
  if (data.clipStartSeconds < 0) {
    throw new Error('Clip start time must be 0 or greater');
  }
  const duration = data.clipEndSeconds - data.clipStartSeconds;
  if (duration <= 0) {
    throw new Error('Clip start time must be before end time');
  }

  // 3. Create short clip asset
  return await prisma.mediaAsset.create({
    data: {
      tenantId,
      title: data.title || `Clip from ${parent.title}`,
      type: 'short_clip',
      providerType: parent.providerType,
      providerKey: parent.providerKey,
      sourceUrl: parent.sourceUrl,
      thumbnailUrl: parent.thumbnailUrl,
      durationSeconds: duration,
      parentAssetId: parent.id,
      clipStartSeconds: data.clipStartSeconds,
      clipEndSeconds: data.clipEndSeconds,
      status: 'published',
    },
  });
}
