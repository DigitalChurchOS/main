import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import {
  LiveMeetingsService,
  createMeeting,
  deleteMeeting,
  endMeeting,
  getMeeting,
  getPublicMeeting,
  joinMeetingLobby,
  linkWorshipSession,
  listMeetings,
  postMeetingChat,
  scheduleMeetingReminder,
  startMeeting,
  toggleMeetingLock,
  trackParticipantJoin,
  trackParticipantLeave,
  triggerMeetingReminder,
  updateMeeting,
  updateParticipantRole,
  updateParticipantStatus,
} from '../services/liveMeetings';

const router = Router();

const requireLiveMeetingsPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

function statusFor(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes('not found')) return 404;
  if (
    message.includes('disabled') ||
    message.includes('restricted') ||
    message.includes('not enabled') ||
    message.includes('members-only') ||
    message.includes('guest access')
  ) return 403;
  if (message.includes('limit')) return 409;
  return 400;
}

function meetingFilters(req: Request) {
  return {
    hostMemberId: req.query.hostMemberId as string | undefined,
    status: req.query.status as string | undefined,
    provider: req.query.provider as string | undefined,
    search: req.query.search as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };
}

function sendError(res: Response, err: any) {
  const error = err instanceof Error ? err : new Error(err?.message || 'Internal server error');
  res.status(statusFor(error)).json({ error: error.message });
}

// Public and member-facing endpoints. Tenant context still comes from x-tenant-id
// or the platform tenant resolver, while entitlement gates prevent unpaid public use.
router.get('/public/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ data: await getPublicMeeting(req.tenantId!, req.params.id as string) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await joinMeetingLobby(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: result });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/join-log', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await trackParticipantJoin(req.tenantId!, req.params.id as string, req.body.email);
    res.status(201).json({ data: result });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/leave-log', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await trackParticipantLeave(req.tenantId!, req.params.id as string, req.body.email);
    res.json({ data: result });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.use(authMiddleware);

router.get('/platform/tenants', requireLiveMeetingsPermission('live-meetings.manage_settings', 'live-meetings.view_reports'), async (_req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.getPlatformOverview() });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/platform/tenants/:tenantId', requireLiveMeetingsPermission('live-meetings.manage_settings'), async (req, res) => {
  try {
    res.json({
      data: await LiveMeetingsService.updateTenantAccess(req.params.tenantId as string, req.body, req.user?.userId),
    });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/overview', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.getOverview(req.tenantId!) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/settings', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.getSettings(req.tenantId!) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/settings', requireLiveMeetingsPermission('live-meetings.manage_settings'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.updateSettings(req.tenantId!, req.body, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/reports', requireLiveMeetingsPermission('live-meetings.view_reports'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.getReports(req.tenantId!) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/activity', requireLiveMeetingsPermission('live-meetings.view_reports'), async (req, res) => {
  try {
    res.json({
      data: await LiveMeetingsService.listActivities(req.tenantId!, {
        actionType: req.query.actionType as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/profiles', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.listProfiles(req.tenantId!) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/profiles', requireLiveMeetingsPermission('live-meetings.create'), async (req, res) => {
  try {
    res.status(201).json({ data: await LiveMeetingsService.createProfile(req.tenantId!, req.body, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/profiles/:id', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.getProfile(req.tenantId!, req.params.id as string) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/profiles/:id', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.updateProfile(req.tenantId!, req.params.id as string, req.body, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.delete('/profiles/:id', requireLiveMeetingsPermission('live-meetings.delete'), async (req, res) => {
  try {
    res.json({ data: await LiveMeetingsService.deleteProfile(req.tenantId!, req.params.id as string, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/reminders/:id/trigger', requireLiveMeetingsPermission('live-meetings.manage_settings'), async (req, res) => {
  try {
    res.json({ data: await triggerMeetingReminder(req.tenantId!, req.params.id as string, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.json({ data: await listMeetings(req.tenantId!, meetingFilters(req)) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/', requireLiveMeetingsPermission('live-meetings.create'), async (req, res) => {
  try {
    res.status(201).json({ data: await createMeeting(req.tenantId!, req.body, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/:id', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.json({ data: await getMeeting(req.tenantId!, req.params.id as string) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.put('/:id', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({ data: await updateMeeting(req.tenantId!, req.params.id as string, req.body, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/:id', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({ data: await updateMeeting(req.tenantId!, req.params.id as string, req.body, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.delete('/:id', requireLiveMeetingsPermission('live-meetings.delete'), async (req, res) => {
  try {
    res.json({ data: await deleteMeeting(req.tenantId!, req.params.id as string, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/start', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({ data: await startMeeting(req.tenantId!, req.params.id as string, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/end', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({
      data: await endMeeting(req.tenantId!, req.params.id as string, { recordingUrl: req.body.recordingUrl }, req.user?.userId),
    });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/:id/participants/:pId/status', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ error: 'Status must be approved or rejected' });
      return;
    }
    res.json({ data: await updateParticipantStatus(req.tenantId!, req.params.id as string, req.params.pId as string, status) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/:id/participants/:pId/role', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== 'host' && role !== 'co_host' && role !== 'participant') {
      res.status(400).json({ error: 'Role must be host, co_host, or participant' });
      return;
    }
    res.json({ data: await updateParticipantRole(req.tenantId!, req.params.id as string, req.params.pId as string, role) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/lock', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({ data: await toggleMeetingLock(req.tenantId!, req.params.id as string, Boolean(req.body.isLocked), req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/chat', requireLiveMeetingsPermission('live-meetings.read'), async (req, res) => {
  try {
    res.status(201).json({ data: await postMeetingChat(req.tenantId!, req.params.id as string, req.body) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/worship', requireLiveMeetingsPermission('live-meetings.update'), async (req, res) => {
  try {
    res.json({ data: await linkWorshipSession(req.tenantId!, req.params.id as string, req.body.worshipSessionId, req.user?.userId) });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/reminders', requireLiveMeetingsPermission('live-meetings.manage_settings'), async (req, res) => {
  try {
    res.status(201).json({
      data: await scheduleMeetingReminder(req.tenantId!, req.params.id as string, Number(req.body.sendBeforeMinutes), req.user?.userId),
    });
  } catch (err: any) {
    sendError(res, err);
  }
});

export default router;
