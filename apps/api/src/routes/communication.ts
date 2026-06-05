import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as commService from '../services/communication';

const router = Router();

// All communication routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
//  MESSAGE TEMPLATES  (Message Template API)
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/templates
router.post('/templates', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, type, subject, body } = req.body;
    const tenantId = req.tenantId!;

    if (!name || !type || !body) {
      res.status(400).json({ error: 'name, type (sms|email), and body are required' });
      return;
    }

    const template = await prisma.communicationTemplate.create({
      data: {
        tenantId,
        name,
        type: type.toLowerCase(),
        subject: subject || null,
        body,
      },
    });

    res.status(201).json({ data: template });
  } catch (err) {
    console.error('Create template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/templates
router.get('/templates', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const templates = await commService.listTemplates(req.tenantId!, { type: type as string });
    res.json({ data: templates });
  } catch (err) {
    console.error('List templates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/templates/:id
router.get('/templates/:id', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const template = await commService.getTemplate(req.tenantId!, req.params.id as string);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ data: template });
  } catch (err) {
    console.error('Get template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/communication/templates/:id
router.put('/templates/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const updated = await commService.updateTemplate(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CONSENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/consent
router.post('/consent', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { memberId, optInSms, optInEmail, gdprConsent } = req.body;
    const tenantId = req.tenantId!;

    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    // Verify member exists
    const member = await prisma.member.findFirst({
      where: { id: memberId as string, tenantId },
    });
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Upsert consent record
    const consent = await prisma.consentRecord.upsert({
      where: { memberId: memberId as string },
      update: {
        ...(optInSms !== undefined && { optInSms }),
        ...(optInEmail !== undefined && { optInEmail }),
        ...(gdprConsent !== undefined && { gdprConsent }),
      },
      create: {
        tenantId,
        memberId,
        optInSms: optInSms !== undefined ? optInSms : true,
        optInEmail: optInEmail !== undefined ? optInEmail : true,
        gdprConsent: gdprConsent !== undefined ? gdprConsent : true,
      },
    });

    res.json({ data: consent });
  } catch (err) {
    console.error('Update consent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SEND MESSAGE (Email & SMS API)
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/send
router.post('/send', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { memberId, templateId, moduleKey } = req.body;
    const tenantId = req.tenantId!;

    if (!memberId || !templateId) {
      res.status(400).json({ error: 'memberId and templateId are required' });
      return;
    }

    const outcome = await commService.sendNotification(tenantId, memberId, templateId, moduleKey);

    if (outcome.success) {
      res.json({ success: true, data: outcome });
    } else {
      res.status(outcome.status === 'opted_out' ? 400 : 500).json({
        success: false,
        error: outcome.error,
        status: outcome.status,
        logId: outcome.logId,
      });
    }
  } catch (err) {
    console.error('Send communication error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATION PREFERENCES  (Notification Preference API)
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/preferences
router.post('/preferences', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { memberId, preferEmail, preferSms, preferPush, preferWhatsapp, quietHoursStart, quietHoursEnd } = req.body;
    const tenantId = req.tenantId!;

    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const prefs = await commService.upsertNotificationPreferences(tenantId, memberId, {
      preferEmail, preferSms, preferPush, preferWhatsapp, quietHoursStart, quietHoursEnd,
    });

    res.json({ data: prefs });
  } catch (err) {
    console.error('Update preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/preferences/:memberId
router.get('/preferences/:memberId', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const prefs = await commService.getNotificationPreferences(req.tenantId!, req.params.memberId as string);
    res.json({ data: prefs || { message: 'No preferences set, using defaults' } });
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  DELIVERY LOGS  (Delivery Log API)
// ═══════════════════════════════════════════════════════════════

// GET /api/communication/logs
router.get('/logs', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { memberId, type, status, page, limit } = req.query;
    const result = await commService.getDeliveryLogs(req.tenantId!, {
      memberId: memberId as string,
      type: type as string,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error('Get delivery logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/stats
router.get('/stats', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const stats = await commService.getDeliveryStats(req.tenantId!);
    res.json({ data: stats });
  } catch (err) {
    console.error('Get delivery stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SCHEDULED MESSAGES
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/scheduled
router.post('/scheduled', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { templateId, scheduledAt, audienceType, audienceFilter } = req.body;

    if (!templateId || !scheduledAt) {
      res.status(400).json({ error: 'templateId and scheduledAt are required' });
      return;
    }

    const msg = await commService.scheduleMessage(req.tenantId!, {
      templateId, scheduledAt, audienceType, audienceFilter,
    });

    res.status(201).json({ data: msg });
  } catch (err) {
    console.error('Schedule message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/scheduled
router.get('/scheduled', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const messages = await commService.listScheduledMessages(req.tenantId!, status as string);
    res.json({ data: messages });
  } catch (err) {
    console.error('List scheduled messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communication/scheduled/:id/cancel
router.post('/scheduled/:id/cancel', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await commService.cancelScheduledMessage(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Pending scheduled message not found' });
      return;
    }
    res.json({ data: result });
  } catch (err) {
    console.error('Cancel scheduled message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communication/scheduled/process  (cron job endpoint)
router.post('/scheduled/process', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await commService.processScheduledMessages(req.tenantId!);
    res.json({ data: result });
  } catch (err) {
    console.error('Process scheduled messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AUTOMATION WORKFLOWS  (Automation Workflow API)
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/automations
router.post('/automations', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, triggerEvent, templateId, channel, delayMinutes } = req.body;

    if (!name || !triggerEvent || !templateId) {
      res.status(400).json({ error: 'name, triggerEvent, and templateId are required' });
      return;
    }

    const workflow = await commService.createAutomationWorkflow(req.tenantId!, {
      name, triggerEvent, templateId, channel, delayMinutes,
    });

    res.status(201).json({ data: workflow });
  } catch (err) {
    console.error('Create automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/automations
router.get('/automations', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const workflows = await commService.listAutomationWorkflows(req.tenantId!);
    res.json({ data: workflows });
  } catch (err) {
    console.error('List automations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/communication/automations/:id
router.put('/automations/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const updated = await commService.updateAutomationWorkflow(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Automation workflow not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/communication/automations/:id
router.delete('/automations/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await commService.deleteAutomationWorkflow(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Automation workflow not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Delete automation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communication/automations/trigger
router.post('/automations/trigger', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { triggerEvent } = req.body;
    if (!triggerEvent) {
      res.status(400).json({ error: 'triggerEvent is required' });
      return;
    }
    const result = await commService.triggerAutomations(req.tenantId!, triggerEvent);
    res.json({ data: result });
  } catch (err) {
    console.error('Trigger automations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  FOLLOW-UP SEQUENCES  (Drip Campaign API)
// ═══════════════════════════════════════════════════════════════

// POST /api/communication/sequences
router.post('/sequences', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, description, triggerEvent, steps } = req.body;

    if (!name || !triggerEvent || !steps || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({ error: 'name, triggerEvent, and at least one step are required' });
      return;
    }

    const sequence = await commService.createFollowUpSequence(req.tenantId!, {
      name, description, triggerEvent, steps,
    });

    res.status(201).json({ data: sequence });
  } catch (err) {
    console.error('Create sequence error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/sequences
router.get('/sequences', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const sequences = await commService.listFollowUpSequences(req.tenantId!);
    res.json({ data: sequences });
  } catch (err) {
    console.error('List sequences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communication/sequences/:id
router.get('/sequences/:id', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const sequence = await commService.getFollowUpSequence(req.tenantId!, req.params.id as string);
    if (!sequence) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.json({ data: sequence });
  } catch (err) {
    console.error('Get sequence error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/communication/sequences/:id
router.delete('/sequences/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await commService.deleteFollowUpSequence(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Delete sequence error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
