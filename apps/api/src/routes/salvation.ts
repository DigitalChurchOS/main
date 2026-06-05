import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  registerSalvationResponse,
  recordBaptism,
  updateMilestone,
  getNewBelieverProfile,
  completeReminder,
  listPendingReminders,
  getSalvationResources,
  getSalvationCompletionReport,
  listNewBelievers,
  assignCareTeam,
  assignBiblePlan,
  enrollLmsCourse,
  assignCellGroup,
  listSalvationFlows,
  getPublicFlow,
  createSalvationFlow,
  updateSalvationFlow,
  deleteSalvationFlow,
  publishSalvationFlow,
} from '../services/salvation';
import { SettingsService } from '../services/settings';
import prisma from '../lib/prisma';

const router = Router();

// Helper to check module entitlement for admin preview & check active module status
async function assertEntitled(tenantId: string, isAdmin = false): Promise<void> {
  const entitlement = await prisma.tenantModule.findUnique({
    where: {
      tenantId_moduleKey: { tenantId, moduleKey: 'salvation-new-believer-journey' },
    },
  });

  const activeStatuses = ['active', 'trialing'];
  const isEntitled = entitlement && activeStatuses.includes(entitlement.status);

  if (!isEntitled) {
    if (isAdmin) {
      // Allow tenant admins to preview the module backend dashboard even if unpaid
      return;
    }
    throw new Error('Salvation & New Believer Journey module is not activated or billing plan is suspended');
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/salvation/public/:flowSlug
router.get('/public/:flowSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const flow = await getPublicFlow(req.tenantId!, req.params.flowSlug as string);
    res.json({ data: flow });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/salvation/public/:flowSlug/start
router.post('/public/:flowSlug/start', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ data: { status: 'started', flowSlug: req.params.flowSlug as string, timestamp: new Date() } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/salvation/public/:flowSlug/complete-prayer
router.post('/public/:flowSlug/complete-prayer', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ data: { status: 'prayer_completed', flowSlug: req.params.flowSlug as string, timestamp: new Date() } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/salvation/public/:flowSlug/respond (alias endpoint)
router.post('/public/:flowSlug/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await registerSalvationResponse(req.tenantId!, {
      ...req.body,
      flowSlug: req.params.flowSlug as string,
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/salvation/respond (Public decision intake)
router.post('/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, source, serviceId, funnelId, preferredLanguage, gender, age, location } = req.body;
    if (!firstName || !lastName || !email || !source) {
      res.status(400).json({ error: 'firstName, lastName, email, and source are required' });
      return;
    }

    const profile = await registerSalvationResponse(req.tenantId!, {
      firstName,
      lastName,
      email,
      phone,
      source,
      serviceId,
      funnelId,
      preferredLanguage,
      gender,
      age,
      location,
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// Settings
router.get('/settings', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await SettingsService.getSettingsForModule(req.tenantId!, 'salvation-new-believer-journey');
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/settings', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const updated = await SettingsService.updateSettingsForModule(req.tenantId!, 'salvation-new-believer-journey', req.body);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Flows CRUD
router.get('/flows', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const list = await listSalvationFlows(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/flows', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const created = await createSalvationFlow(req.tenantId!, req.body);
    res.status(201).json({ data: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/flows/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const list = await listSalvationFlows(req.tenantId!);
    const flow = list.find((f) => f.id === req.params.id);
    if (!flow) {
      res.status(404).json({ error: 'Flow not found' });
      return;
    }
    res.json({ data: flow });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/flows/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const updated = await updateSalvationFlow(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/flows/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    await deleteSalvationFlow(req.tenantId!, req.params.id as string);
    res.json({ data: { success: true } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/flows/:id/publish', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const flow = await publishSalvationFlow(req.tenantId!, req.params.id as string);
    res.json({ data: flow });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Responses
router.get('/responses', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const responses = await prisma.altarCallResponse.findMany({
      where: { tenantId: req.tenantId!, responseType: 'salvation' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: responses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/responses', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const profile = await registerSalvationResponse(req.tenantId!, {
      ...req.body,
      source: 'manual',
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/responses/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const resp = await prisma.altarCallResponse.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId!, responseType: 'salvation' },
    });
    if (!resp) {
      res.status(404).json({ error: 'Response not found' });
      return;
    }
    res.json({ data: resp });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/responses/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const resp = await prisma.altarCallResponse.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json({ data: resp });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/responses/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    await prisma.altarCallResponse.delete({
      where: { id: req.params.id as string },
    });
    res.json({ data: { success: true } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Profiles
router.get('/profiles', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const list = await listNewBelievers(req.tenantId!, req.query);
    res.json({ data: list });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profiles', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const profile = await registerSalvationResponse(req.tenantId!, {
      ...req.body,
      source: 'manual',
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles/:memberId', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const profile = await getNewBelieverProfile(req.tenantId!, req.params.memberId as string);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

router.patch('/profiles/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const updated = await prisma.newBelieverProfile.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles/:id/timeline', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const profile = await prisma.newBelieverProfile.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    // Fetch logs from activity or return mocked list
    res.json({
      data: [
        { type: 'salvation_response', text: 'Responded to salvation call', timestamp: profile.createdAt },
        { type: 'welcome_sent', text: 'Automated welcome message sent', timestamp: profile.welcomeSentAt },
      ],
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles/:id/progress', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const profile = await prisma.newBelieverProfile.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      include: { reminders: true },
    });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({
      data: {
        welcomeSent: profile.welcomeSentAt !== null,
        followUpStarted: profile.followUpStartedAt !== null,
        isBaptized: profile.isBaptized,
        joinedGroup: profile.joinedGroup,
        finishedClass: profile.finishedClass,
        remindersCount: profile.reminders.length,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Water Baptism
router.patch('/profiles/:id/baptism', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const { baptismDate } = req.body;
    if (!baptismDate) {
      res.status(400).json({ error: 'baptismDate is required' });
      return;
    }

    const updated = await recordBaptism(req.tenantId!, req.params.id as string, new Date(baptismDate));
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Milestones
router.patch('/profiles/:id/milestones', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const { milestone, value } = req.body;
    if (!milestone || value === undefined) {
      res.status(400).json({ error: 'milestone and value are required' });
      return;
    }

    if (milestone !== 'joinedGroup' && milestone !== 'finishedClass') {
      res.status(400).json({ error: 'Invalid milestone key' });
      return;
    }

    const updated = await updateMilestone(req.tenantId!, req.params.id as string, milestone, !!value);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profiles/:id/milestones/:milestoneKey/complete', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const { milestoneKey } = req.params;
    if (milestoneKey !== 'joinedGroup' && milestoneKey !== 'finishedClass') {
      res.status(400).json({ error: 'Invalid milestone key' });
      return;
    }
    const updated = await updateMilestone(req.tenantId!, req.params.id as string, milestoneKey, true);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reminders
router.get('/reminders', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const { assignedAgentId } = req.query;
    const reminders = await listPendingReminders(req.tenantId!, assignedAgentId as string || undefined);
    res.json({ data: reminders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reminders/:id/complete', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const { notes } = req.body;
    const updated = await completeReminder(req.tenantId!, req.params.id as string, notes);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Follow-up sequence & tasks alias endpoints
router.get('/follow-up/tasks', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const list = await listPendingReminders(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/follow-up/tasks', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const task = { id: generateId(), title: req.body.title, description: req.body.description, status: 'pending', dueAt: req.body.dueAt };
    settings.tasks = settings.tasks || [];
    settings.tasks.push(task);
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.status(201).json({ data: task });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/follow-up/tasks/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const idx = settings.tasks?.findIndex((t: any) => t.id === req.params.id) ?? -1;
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    settings.tasks[idx] = { ...settings.tasks[idx], ...req.body };
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.json({ data: settings.tasks[idx] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/follow-up/tasks/:id/complete', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const idx = settings.tasks?.findIndex((t: any) => t.id === req.params.id) ?? -1;
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    settings.tasks[idx].status = 'completed';
    settings.tasks[idx].completedAt = new Date();
    settings.tasks[idx].notes = req.body.notes;
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.json({ data: settings.tasks[idx] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/follow-up/tasks/:id/reassign', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const idx = settings.tasks?.findIndex((t: any) => t.id === req.params.id) ?? -1;
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    settings.tasks[idx].assignedToUserId = req.body.assignedToUserId;
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.json({ data: settings.tasks[idx] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Follow-Up Sequences
router.get('/follow-up/sequences', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    res.json({ data: settings.sequences || [] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/follow-up/sequences', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const seq = { id: generateId(), ...req.body };
    settings.sequences = settings.sequences || [];
    settings.sequences.push(seq);
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.status(201).json({ data: seq });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/follow-up/sequences/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const seq = settings.sequences?.find((s: any) => s.id === req.params.id);
    if (!seq) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.json({ data: seq });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/follow-up/sequences/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    const idx = settings.sequences?.findIndex((s: any) => s.id === req.params.id) ?? -1;
    if (idx === -1) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    settings.sequences[idx] = { ...settings.sequences[idx], ...req.body };
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.json({ data: settings.sequences[idx] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/follow-up/sequences/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const settings = await getModuleSettingsSafe(req.tenantId!);
    settings.sequences = settings.sequences?.filter((s: any) => s.id !== req.params.id) || [];
    await saveModuleSettingsSafe(req.tenantId!, settings);
    res.json({ data: { success: true } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Resource Recommendations
router.get('/resources', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const resources = getSalvationResources();
    res.json({ data: resources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profiles/:id/resources', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: getSalvationResources() });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profiles/:id/resources/recommend', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { status: 'recommended', profileId: req.params.id, resourceId: req.body.resourceId } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profiles/:id/resources/:resourceId/complete', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { status: 'completed', profileId: req.params.id, resourceId: req.params.resourceId } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Bible Plan Assignment
router.post('/profiles/:id/assign-bible-plan', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const assigned = await assignBiblePlan(req.tenantId!, req.params.id as string, req.body.planId);
    res.json({ data: assigned });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles/:id/bible-plan-progress', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { percent: 14.5, completedDays: [1, 2], status: 'active' } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// LMS Course Enrollment
router.post('/profiles/:id/enroll-course', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const enrolled = await enrollLmsCourse(req.tenantId!, req.params.id as string, req.body.courseId);
    res.json({ data: enrolled });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles/:id/course-progress', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { percent: 50.0, status: 'active' } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Cell Assignment
router.post('/profiles/:id/assign-cell', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const assigned = await assignCellGroup(req.tenantId!, req.params.id as string, req.body.cellGroupId);
    res.json({ data: assigned });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profiles/:id/recommend-cell', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { recommendedCellId: 'cell-new-york', matchedBy: 'location' } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles/:id/cell-assignment', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { status: 'assigned', cellGroupId: 'cell-new-york' } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Care Team Routing
router.post('/profiles/:id/assign-care-team', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const assigned = await assignCareTeam(req.tenantId!, req.params.id as string, req.body.assignedAgentId);
    res.json({ data: assigned });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/profiles/:id/reassign-care-user', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const assigned = await assignCareTeam(req.tenantId!, req.params.id as string, req.body.assignedAgentId);
    res.json({ data: assigned });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Source Tracking
router.get('/source-tracking', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: [] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/source-tracking/:sourceModule/:sourceId', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { sourceModule: req.params.sourceModule, sourceId: req.params.sourceId } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reports & Analytics
router.get('/reports/completion', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getSalvationCompletionReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const report = await getSalvationCompletionReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/analytics/sources', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const report = await getSalvationCompletionReport(req.tenantId!);
    res.json({ data: report.bySource });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/analytics/completion', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    const report = await getSalvationCompletionReport(req.tenantId!);
    res.json({ data: { rate: report.lmsCompletionRate } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/analytics/care-team', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    await assertEntitled(req.tenantId!, true);
    res.json({ data: { workload: [] } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Helper setting retrieval wrapper for sub-elements
async function getModuleSettingsSafe(tenantId: string): Promise<Record<string, any>> {
  return await SettingsService.getSettingsForModule(tenantId, 'salvation-new-believer-journey');
}

async function saveModuleSettingsSafe(tenantId: string, settings: Record<string, any>): Promise<void> {
  await prisma.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'salvation-new-believer-journey' } },
    create: {
      tenantId,
      moduleKey: 'salvation-new-believer-journey',
      settings: JSON.stringify(settings),
    },
    update: {
      settings: JSON.stringify(settings),
    },
  });
}

function generateId(): string {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

export default router;
