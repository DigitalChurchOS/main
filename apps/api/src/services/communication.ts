import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { SMSProvider } from './integrations/interfaces';
import { checkSubscriptionLimit, recordUsage } from './billing';

/**
 * Communication Dispatch Engine
 * -----------------------------
 * Fetches member, template, compiles placeholders, checks privacy opt-in consent gates,
 * resolves integration drivers dynamically, and logs the outcome.
 */
export async function sendNotification(
  tenantId: string,
  memberId: string,
  templateId: string,
  moduleKey?: string
): Promise<{ success: boolean; status: string; error?: string; logId?: string; data?: any }> {
  // 1. Fetch member and template
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });

  const template = await prisma.communicationTemplate.findFirst({
    where: { id: templateId, tenantId },
  });

  if (!member) {
    return { success: false, status: 'failed', error: 'Member not found' };
  }

  if (!template) {
    return { success: false, status: 'failed', error: 'Template not found' };
  }

  // 2. Consent Check
  const consent = await prisma.consentRecord.findUnique({
    where: { memberId },
  });

  const channel = template.type.toLowerCase(); // "sms" | "email"
  let isAllowed = false;

  if (channel === 'sms') {
    // SMS requires strict consent. Default to OPTED-OUT if no record exists.
    isAllowed = consent ? consent.optInSms : false;
  } else if (channel === 'email') {
    // Email defaults to OPTED-IN if no record exists.
    isAllowed = consent ? consent.optInEmail : true;
  } else {
    return { success: false, status: 'failed', error: `Unsupported channel: ${channel}` };
  }

  // Handle opt-out block
  if (!isAllowed) {
    // Log blocked attempt to audit log
    const log = await prisma.communicationLog.create({
      data: {
        tenantId,
        memberId,
        templateId,
        type: channel,
        recipient: member.phone || 'unknown',
        body: template.body,
        status: 'opted_out',
        errorMsg: `Recipient has opted out from ${channel.toUpperCase()}`,
      },
    });

    return {
      success: false,
      status: 'opted_out',
      error: 'Recipient has opted out of this channel',
      logId: log.id,
    };
  }

  // Check if recipient contact info exists
  const recipient = channel === 'sms' ? member.phone : 'email_placeholder@grace.com'; // Fallback email
  if (channel === 'sms' && !member.phone) {
    return { success: false, status: 'failed', error: 'Member is missing a phone number' };
  }

  // 3. Compile placeholders
  // Compiles: {{first_name}} and {{last_name}}
  let compiledBody = template.body
    .replace(/\{\{\s*first_name\s*\}\}/g, member.firstName)
    .replace(/\{\{\s*last_name\s*\}\}/g, member.lastName);

  // Create pending log
  const commLog = await prisma.communicationLog.create({
    data: {
      tenantId,
      memberId,
      templateId,
      type: channel,
      recipient: recipient!,
      subject: template.subject,
      body: compiledBody,
      status: 'pending',
    },
  });

  try {
    // 4. Dispatch using driver
    if (channel === 'sms') {
      const limitCheck = await checkSubscriptionLimit(tenantId, 'sms_sent', 1);
      if (!limitCheck.allowed) {
        await prisma.communicationLog.update({
          where: { id: commLog.id },
          data: { status: 'failed', errorMsg: limitCheck.reason },
        });
        return { success: false, status: 'failed', error: limitCheck.reason, logId: commLog.id };
      }

      const driver: SMSProvider = await resolveDriver(tenantId, 'sms', moduleKey);
      const result = await driver.sendSMS(recipient!, compiledBody);

      if (result.success) {
        // Record SMS usage
        await recordUsage(tenantId, 'sms_sent', 1);

        await prisma.communicationLog.update({
          where: { id: commLog.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        return { success: true, status: 'sent', logId: commLog.id };
      } else {
        await prisma.communicationLog.update({
          where: { id: commLog.id },
          data: { status: 'failed', errorMsg: result.error || 'Driver failed to deliver' },
        });
        return { success: false, status: 'failed', error: result.error, logId: commLog.id };
      }
    } else {
      // Email mock delivery (direct dispatch logs)
      console.log(`[MockEmail] Dispatching Email to ${recipient}: Subject: "${template.subject}" Body: "${compiledBody}"`);
      await prisma.communicationLog.update({
        where: { id: commLog.id },
        data: { status: 'sent', sentAt: new Date() },
      });
      return { success: true, status: 'sent', logId: commLog.id };
    }
  } catch (err: any) {
    await prisma.communicationLog.update({
      where: { id: commLog.id },
      data: { status: 'failed', errorMsg: err.message },
    });
    return { success: false, status: 'failed', error: err.message, logId: commLog.id };
  }
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE CRUD
// ═══════════════════════════════════════════════════════════════

export async function listTemplates(tenantId: string, filters: { type?: string }) {
  const where: any = { tenantId };
  if (filters.type) where.type = filters.type;
  return prisma.communicationTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getTemplate(tenantId: string, templateId: string) {
  return prisma.communicationTemplate.findFirst({ where: { id: templateId, tenantId } });
}

export async function updateTemplate(
  tenantId: string,
  templateId: string,
  data: Partial<{ name: string; subject: string; body: string }>
) {
  const template = await prisma.communicationTemplate.findFirst({ where: { id: templateId, tenantId } });
  if (!template) return null;
  return prisma.communicationTemplate.update({ where: { id: templateId }, data });
}

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════

export async function upsertNotificationPreferences(
  tenantId: string,
  memberId: string,
  data: {
    preferEmail?: boolean;
    preferSms?: boolean;
    preferPush?: boolean;
    preferWhatsapp?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }
) {
  return prisma.notificationPreference.upsert({
    where: { memberId },
    update: {
      ...(data.preferEmail !== undefined && { preferEmail: data.preferEmail }),
      ...(data.preferSms !== undefined && { preferSms: data.preferSms }),
      ...(data.preferPush !== undefined && { preferPush: data.preferPush }),
      ...(data.preferWhatsapp !== undefined && { preferWhatsapp: data.preferWhatsapp }),
      ...(data.quietHoursStart !== undefined && { quietHoursStart: data.quietHoursStart }),
      ...(data.quietHoursEnd !== undefined && { quietHoursEnd: data.quietHoursEnd }),
    },
    create: {
      tenantId,
      memberId,
      preferEmail: data.preferEmail !== undefined ? data.preferEmail : true,
      preferSms: data.preferSms !== undefined ? data.preferSms : false,
      preferPush: data.preferPush !== undefined ? data.preferPush : true,
      preferWhatsapp: data.preferWhatsapp !== undefined ? data.preferWhatsapp : false,
      quietHoursStart: data.quietHoursStart || null,
      quietHoursEnd: data.quietHoursEnd || null,
    },
  });
}

export async function getNotificationPreferences(tenantId: string, memberId: string) {
  return prisma.notificationPreference.findUnique({ where: { memberId } });
}

// ═══════════════════════════════════════════════════════════════
//  DELIVERY LOGS
// ═══════════════════════════════════════════════════════════════

export async function getDeliveryLogs(
  tenantId: string,
  filters: { memberId?: string; type?: string; status?: string; page?: number; limit?: number }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.memberId) where.memberId = filters.memberId;
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.communicationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.communicationLog.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getDeliveryStats(tenantId: string) {
  const stats = await prisma.communicationLog.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: { id: true },
  });

  const channelStats = await prisma.communicationLog.groupBy({
    by: ['type'],
    where: { tenantId },
    _count: { id: true },
  });

  return {
    byStatus: stats.map((s) => ({ status: s.status, count: s._count.id })),
    byChannel: channelStats.map((c) => ({ channel: c.type, count: c._count.id })),
  };
}

// ═══════════════════════════════════════════════════════════════
//  SCHEDULED MESSAGES
// ═══════════════════════════════════════════════════════════════

export async function scheduleMessage(
  tenantId: string,
  data: {
    templateId: string;
    scheduledAt: string;
    audienceType?: string;
    audienceFilter?: string;
  }
) {
  return prisma.scheduledMessage.create({
    data: {
      tenantId,
      templateId: data.templateId,
      scheduledAt: new Date(data.scheduledAt),
      audienceType: data.audienceType || 'all',
      audienceFilter: data.audienceFilter || null,
    },
  });
}

export async function listScheduledMessages(tenantId: string, status?: string) {
  const where: any = { tenantId };
  if (status) where.status = status;
  return prisma.scheduledMessage.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function cancelScheduledMessage(tenantId: string, messageId: string) {
  const msg = await prisma.scheduledMessage.findFirst({
    where: { id: messageId, tenantId, status: 'pending' },
  });
  if (!msg) return null;
  return prisma.scheduledMessage.update({
    where: { id: messageId },
    data: { status: 'cancelled' },
  });
}

export async function processScheduledMessages(tenantId: string) {
  // Find all due messages
  const dueMessages = await prisma.scheduledMessage.findMany({
    where: { tenantId, status: 'pending', scheduledAt: { lte: new Date() } },
  });

  const results = [];
  for (const msg of dueMessages) {
    try {
      // For individual audience, send to the specific member
      if (msg.audienceType === 'individual' && msg.audienceFilter) {
        const outcome = await sendNotification(tenantId, msg.audienceFilter, msg.templateId);
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: outcome.success ? 'sent' : 'failed', sentAt: new Date(), errorMsg: outcome.error },
        });
        results.push({ id: msg.id, success: outcome.success });
      } else {
        // Broadcast: mark as sent (actual send would iterate members)
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        results.push({ id: msg.id, success: true });
      }
    } catch (err: any) {
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { status: 'failed', errorMsg: err.message },
      });
      results.push({ id: msg.id, success: false });
    }
  }

  return { processed: results.length, results };
}

// ═══════════════════════════════════════════════════════════════
//  AUTOMATION WORKFLOWS
// ═══════════════════════════════════════════════════════════════

export async function createAutomationWorkflow(
  tenantId: string,
  data: {
    name: string;
    triggerEvent: string;
    templateId: string;
    channel?: string;
    delayMinutes?: number;
  }
) {
  return prisma.automationWorkflow.create({
    data: {
      tenantId,
      name: data.name,
      triggerEvent: data.triggerEvent,
      templateId: data.templateId,
      channel: data.channel || 'email',
      delayMinutes: data.delayMinutes || 0,
    },
  });
}

export async function listAutomationWorkflows(tenantId: string) {
  return prisma.automationWorkflow.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAutomationWorkflow(
  tenantId: string,
  workflowId: string,
  data: Partial<{ name: string; isActive: boolean; delayMinutes: number; channel: string }>
) {
  const workflow = await prisma.automationWorkflow.findFirst({ where: { id: workflowId, tenantId } });
  if (!workflow) return null;
  return prisma.automationWorkflow.update({ where: { id: workflowId }, data });
}

export async function deleteAutomationWorkflow(tenantId: string, workflowId: string) {
  const workflow = await prisma.automationWorkflow.findFirst({ where: { id: workflowId, tenantId } });
  if (!workflow) return null;
  await prisma.automationWorkflow.delete({ where: { id: workflowId } });
  return { success: true };
}

export async function triggerAutomations(tenantId: string, triggerEvent: string) {
  const workflows = await prisma.automationWorkflow.findMany({
    where: { tenantId, triggerEvent, isActive: true },
  });

  const triggered = [];
  for (const wf of workflows) {
    await prisma.automationWorkflow.update({
      where: { id: wf.id },
      data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() },
    });
    triggered.push({ id: wf.id, name: wf.name, channel: wf.channel, delayMinutes: wf.delayMinutes });
  }

  return { triggered: triggered.length, workflows: triggered };
}

// ═══════════════════════════════════════════════════════════════
//  FOLLOW-UP SEQUENCES (Drip Campaigns)
// ═══════════════════════════════════════════════════════════════

export async function createFollowUpSequence(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    triggerEvent: string;
    steps: Array<{
      templateId: string;
      channel?: string;
      delayDays: number;
      order?: number;
    }>;
  }
) {
  return prisma.$transaction(async (tx) => {
    const sequence = await tx.followUpSequence.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description || null,
        triggerEvent: data.triggerEvent,
      },
    });

    if (data.steps && data.steps.length > 0) {
      await tx.followUpStep.createMany({
        data: data.steps.map((step, idx) => ({
          sequenceId: sequence.id,
          templateId: step.templateId,
          channel: step.channel || 'email',
          delayDays: step.delayDays,
          order: step.order !== undefined ? step.order : idx,
        })),
      });
    }

    return tx.followUpSequence.findUnique({
      where: { id: sequence.id },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  });
}

export async function listFollowUpSequences(tenantId: string) {
  return prisma.followUpSequence.findMany({
    where: { tenantId },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFollowUpSequence(tenantId: string, sequenceId: string) {
  return prisma.followUpSequence.findFirst({
    where: { id: sequenceId, tenantId },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
}

export async function deleteFollowUpSequence(tenantId: string, sequenceId: string) {
  const seq = await prisma.followUpSequence.findFirst({ where: { id: sequenceId, tenantId } });
  if (!seq) return null;
  await prisma.followUpSequence.delete({ where: { id: sequenceId } });
  return { success: true };
}
