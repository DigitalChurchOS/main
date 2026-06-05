import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as crmService from '../services/crm';
import prisma from '../lib/prisma';

const router = Router();

// All CRM routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
//  CRM PIPELINES
// ═══════════════════════════════════════════════════════════════

// GET /api/crm/pipelines
router.get('/pipelines', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const pipelines = await prisma.crmPipeline.findMany({
      where: { tenantId: req.tenantId! },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({ data: pipelines });
  } catch (err) {
    console.error('List pipelines error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crm/pipelines
// Body: { name, description, stages: [ { name, order }, ... ] }
router.post('/pipelines', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, description, stages } = req.body;
    const tenantId = req.tenantId!;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create pipeline
      const pipeline = await tx.crmPipeline.create({
        data: { tenantId, name, description },
      });

      // 2. Create child stages if provided
      if (stages && Array.isArray(stages)) {
        await tx.crmStage.createMany({
          data: stages.map((s: any, idx: number) => ({
            tenantId,
            pipelineId: pipeline.id,
            name: s.name,
            order: s.order !== undefined ? s.order : idx,
          })),
        });
      }

      return pipeline;
    });

    const pipelineWithStages = await prisma.crmPipeline.findUnique({
      where: { id: result.id },
      include: { stages: true },
    });

    res.status(201).json({ data: pipelineWithStages });
  } catch (err) {
    console.error('Create pipeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crm/move
// Body: { memberId, stageId, status, assignedUserId, notes }
router.post('/move', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { memberId, stageId, status, assignedUserId, notes } = req.body;
    const tenantId = req.tenantId!;

    if (!memberId || !stageId) {
      res.status(400).json({ error: 'memberId and stageId are required' });
      return;
    }

    // Verify member belongs to this tenant
    const member = await prisma.member.findFirst({
      where: { id: memberId as string, tenantId },
    });
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Verify stage belongs to this tenant
    const stage = await prisma.crmStage.findFirst({
      where: { id: stageId as string, tenantId },
    });
    if (!stage) {
      res.status(404).json({ error: 'CRM Stage not found' });
      return;
    }

    // Track stage movement: Upsert the active tracking stage for the member
    const currentTracking = await prisma.memberCrmStage.findFirst({
      where: { memberId: memberId as string, tenantId },
    });

    let tracking;
    if (currentTracking) {
      tracking = await prisma.memberCrmStage.update({
        where: { id: currentTracking.id },
        data: {
          stageId,
          status: status || 'active',
          ...(assignedUserId !== undefined && { assignedUserId }),
          ...(notes !== undefined && { notes }),
        },
      });
    } else {
      tracking = await prisma.memberCrmStage.create({
        data: {
          tenantId,
          memberId,
          stageId,
          status: status || 'active',
          assignedUserId: assignedUserId || null,
          notes: notes || null,
        },
      });
    }

    res.json({ data: tracking });
  } catch (err) {
    console.error('Move CRM stage error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CRM CONTACTS
// ═══════════════════════════════════════════════════════════════

// POST /api/crm/contacts
router.post('/contacts', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { firstName, lastName, email, phone, type, leadSource, leadSourceDetail, notes, memberId } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ error: 'firstName and lastName are required' });
      return;
    }

    const contact = await crmService.createContact(tenantId, {
      firstName, lastName, email, phone, type, leadSource, leadSourceDetail, notes, memberId,
    });

    res.status(201).json({ data: contact });
  } catch (err) {
    console.error('Create CRM contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/crm/contacts
router.get('/contacts', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { type, status, leadSource, search, page, limit } = req.query;

    const result = await crmService.listContacts(tenantId, {
      type: type as string,
      status: status as string,
      leadSource: leadSource as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (err) {
    console.error('List CRM contacts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/crm/contacts/:id
router.get('/contacts/:id', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const contact = await crmService.getContact(req.tenantId!, req.params.id as string);
    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ data: contact });
  } catch (err) {
    console.error('Get CRM contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/crm/contacts/:id
router.put('/contacts/:id', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const updated = await crmService.updateContact(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update CRM contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/crm/contacts/:id
router.delete('/contacts/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await crmService.deleteContact(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Delete CRM contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CRM TIMELINE
// ═══════════════════════════════════════════════════════════════

// POST /api/crm/contacts/:id/timeline
router.post('/contacts/:id/timeline', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { type, title, description, metadata, occurredAt } = req.body;

    if (!type || !title) {
      res.status(400).json({ error: 'type and title are required' });
      return;
    }

    const event = await crmService.addTimelineEvent(req.tenantId!, req.params.id as string, {
      type,
      title,
      description,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
    });

    if (!event) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.status(201).json({ data: event });
  } catch (err) {
    console.error('Add timeline event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/crm/contacts/:id/timeline
router.get('/contacts/:id/timeline', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, page, limit } = req.query;

    const result = await crmService.getTimeline(req.tenantId!, req.params.id as string, {
      type: type as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  FOLLOW-UP TASKS
// ═══════════════════════════════════════════════════════════════

// POST /api/crm/contacts/:id/tasks
router.post('/contacts/:id/tasks', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedUserId, dueDate } = req.body;

    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const task = await crmService.createFollowUpTask(req.tenantId!, req.params.id as string, {
      title, description, priority, assignedUserId, dueDate,
    });

    if (!task) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.status(201).json({ data: task });
  } catch (err) {
    console.error('Create follow-up task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/crm/tasks  (global task list with filters)
router.get('/tasks', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { contactId, assignedUserId, status, priority, page, limit } = req.query;

    const result = await crmService.listFollowUpTasks(req.tenantId!, {
      contactId: contactId as string,
      assignedUserId: assignedUserId as string,
      status: status as string,
      priority: priority as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (err) {
    console.error('List follow-up tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/crm/tasks/:id
router.put('/tasks/:id', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const updated = await crmService.updateFollowUpTask(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update follow-up task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ENGAGEMENT SCORING
// ═══════════════════════════════════════════════════════════════

// POST /api/crm/contacts/:id/recalculate-score
router.post('/contacts/:id/recalculate-score', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const result = await crmService.recalculateEngagementScore(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ data: { id: result.id, engagementScore: result.engagementScore } });
  } catch (err) {
    console.error('Recalculate score error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/crm/engagement/leaderboard
router.get('/engagement/leaderboard', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, limit } = req.query;
    const data = await crmService.getEngagementLeaderboard(req.tenantId!, {
      type: type as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ data });
  } catch (err) {
    console.error('Engagement leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CRM REPORTS
// ═══════════════════════════════════════════════════════════════

// GET /api/crm/reports
router.get('/reports', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const report = await crmService.getCrmReport(req.tenantId!);
    res.json({ data: report });
  } catch (err) {
    console.error('CRM report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
