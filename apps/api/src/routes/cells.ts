import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import {
  upsertGroupSettings,
  getGroupSettings,
  createGroupType,
  ensureDefaultGroupTypes,
  listGroupTypes,
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  assignGroupRoles,
  addMemberToGroup,
  transferMemberToGroup,
  removeMemberFromGroup,
  scheduleMeeting,
  logMeetingAttendance,
  submitMeetingReport,
  listMeetings,
  listNoticePosts,
  postNotice,
  delegateNoticeBoardWrite,
  createInviteLink,
  listInviteLinks,
  getInviteLanding,
  recordInviteClick,
  convertInvite,
  calculateScorecard,
  getPromotionRecommendations,
  promoteGroup,
  getCellOverview,
  getHierarchyTree,
  getCellMapData,
  getCellAnalytics,
  getPublicCellFinder,
  getMemberCellPortal,
  getLeaderDashboard,
  getCellMinistryManual,
  updateCellMinistryManual,
  publishCellMinistryManual,
  buildCellMinistryManualPdf,
  listWeeklyOutlines,
  getWeeklyOutline,
  getActiveWeeklyOutline,
  createWeeklyOutline,
  updateWeeklyOutline,
  publishWeeklyOutline,
  buildWeeklyOutlinePdf,
} from '../services/cells';

const router = Router();

const requireCellRead = requireAnyPermission('cell-fellowship.read', 'member.read');
const requireCellCreate = requireAnyPermission('cell-fellowship.create', 'member.update');
const requireCellUpdate = requireAnyPermission('cell-fellowship.update', 'member.update');
const requireCellReports = requireAnyPermission('cell-fellowship.view_reports', 'member.read');
const requireCellSettings = requireAnyPermission('cell-fellowship.manage_settings', 'tenant.settings');

function tenantIdFrom(req: Request) {
  if (!req.tenantId) {
    throw new Error('Tenant context required');
  }
  return req.tenantId;
}

function sendError(res: Response, err: any, fallbackStatus = 400) {
  const message = err?.message || 'Internal server error';
  const status =
    message.includes('not enabled') || message.includes('not activated') ? 403 :
    message.includes('not found') || message.includes('not configured') ? 404 :
    fallbackStatus;
  res.status(status).json({ error: message });
}

function sendPdf(res: Response, pdf: { filename: string; buffer: Buffer }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
  res.send(pdf.buffer);
}

// Public and visitor-facing routes. Tenant middleware already resolved x-tenant-id.
router.get('/public/finder', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getPublicCellFinder(tenantIdFrom(req));
    res.json({ data });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/public/manual', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getCellMinistryManual(tenantIdFrom(req), true);
    res.json({ data });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/public/manual.pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const pdf = await buildCellMinistryManualPdf(tenantIdFrom(req), true);
    sendPdf(res, pdf);
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/invite/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await getInviteLanding(tenantIdFrom(req), req.params.token as string);
    res.json({ data });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/invite/:token/click', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await recordInviteClick(tenantIdFrom(req), req.params.token as string, req.body?.sessionId || null);
    res.json({ data });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/invite/:token/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await convertInvite(tenantIdFrom(req), req.params.token as string, req.body?.visitorDetails || req.body);
    res.status(200).json({ data: result });
  } catch (err: any) {
    sendError(res, err);
  }
});

// Backward-compatible public conversion endpoint used by the existing tests.
router.post('/invites/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, visitorDetails } = req.body;
    if (!token || !visitorDetails || !visitorDetails.email) {
      res.status(400).json({ error: 'token and visitorDetails (containing email) are required' });
      return;
    }

    const result = await convertInvite(tenantIdFrom(req), token, visitorDetails);
    res.status(200).json({ data: result });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.use(authMiddleware);

router.get('/overview', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const overview = await getCellOverview(tenantIdFrom(req));
    res.json({ data: overview });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.get('/hierarchy', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const tree = await getHierarchyTree(tenantIdFrom(req));
    res.json({ data: tree });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.get('/map', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const pins = await getCellMapData(tenantIdFrom(req));
    res.json({ data: pins });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.get('/analytics', requireCellReports, async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await getCellAnalytics(tenantIdFrom(req));
    res.json({ data: analytics });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.get('/promotions/recommendations', requireCellReports, async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendations = await getPromotionRecommendations(tenantIdFrom(req));
    res.json({ data: recommendations });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.get('/me', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const portal = await getMemberCellPortal(tenantIdFrom(req), req.user!.userId);
    res.json({ data: portal });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/leader', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await getLeaderDashboard(tenantIdFrom(req), req.user!.userId);
    res.json({ data: dashboard });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/manual', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const manual = await getCellMinistryManual(tenantIdFrom(req));
    res.json({ data: manual });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/manual', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const manual = await updateCellMinistryManual(tenantIdFrom(req), req.body, req.user?.userId);
    res.json({ data: manual });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/manual/publish', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const manual = await publishCellMinistryManual(tenantIdFrom(req), req.user?.userId);
    res.json({ data: manual });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/manual/pdf', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const pdf = await buildCellMinistryManualPdf(tenantIdFrom(req));
    sendPdf(res, pdf);
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/outlines', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const outlines = await listWeeklyOutlines(tenantIdFrom(req), {
      status: req.query.status as string | undefined,
    });
    res.json({ data: outlines });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/outlines', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const outline = await createWeeklyOutline(tenantIdFrom(req), req.body, req.user?.userId);
    res.status(201).json({ data: outline });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/outlines/active', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const outline = await getActiveWeeklyOutline(tenantIdFrom(req));
    res.json({ data: outline });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/outlines/:outlineId', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const outline = await getWeeklyOutline(tenantIdFrom(req), req.params.outlineId as string);
    res.json({ data: outline });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/outlines/:outlineId', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const outline = await updateWeeklyOutline(tenantIdFrom(req), req.params.outlineId as string, req.body, req.user?.userId);
    res.json({ data: outline });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/outlines/:outlineId/publish', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const outline = await publishWeeklyOutline(tenantIdFrom(req), req.params.outlineId as string, req.user?.userId);
    res.json({ data: outline });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/outlines/:outlineId/pdf', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const pdf = await buildWeeklyOutlinePdf(tenantIdFrom(req), req.params.outlineId as string);
    sendPdf(res, pdf);
  } catch (err: any) {
    sendError(res, err);
  }
});

// Settings and type setup.
router.post('/settings', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await upsertGroupSettings(tenantIdFrom(req), req.body);
    res.json({ data: settings });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/settings', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await upsertGroupSettings(tenantIdFrom(req), req.body);
    res.json({ data: settings });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/settings', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getGroupSettings(tenantIdFrom(req));
    res.json({ data: settings });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.post('/types/defaults', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await ensureDefaultGroupTypes(tenantIdFrom(req));
    res.status(201).json({ data: types });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/types', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, tierLevel } = req.body;
    if (!name || tierLevel === undefined) {
      res.status(400).json({ error: 'name and tierLevel are required' });
      return;
    }

    const groupType = await createGroupType(tenantIdFrom(req), req.body);
    res.status(201).json({ data: groupType });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/types', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listGroupTypes(tenantIdFrom(req));
    res.json({ data: list });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

async function createGroupHandler(req: Request, res: Response) {
  try {
    const group = await createGroup(tenantIdFrom(req), req.body, req.user?.userId);
    res.status(201).json({ data: group });
  } catch (err: any) {
    sendError(res, err);
  }
}

async function listGroupsHandler(req: Request, res: Response) {
  try {
    const parentId = req.query.parentId as string | undefined;
    const groupTypeId = req.query.groupTypeId as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const list = await listGroups(tenantIdFrom(req), { parentId, groupTypeId, status, search });
    res.json({ data: list });
  } catch (err: any) {
    sendError(res, err, 500);
  }
}

router.post('/groups', requireCellCreate, createGroupHandler);
router.get('/groups', requireCellRead, listGroupsHandler);
router.post('/', requireCellCreate, createGroupHandler);
router.get('/', requireCellRead, listGroupsHandler);

router.get('/:id', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await getGroup(tenantIdFrom(req), req.params.id as string);
    res.json({ data: group });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.patch('/:id', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await updateGroup(tenantIdFrom(req), req.params.id as string, req.body, req.user?.userId);
    res.json({ data: updated });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/roles', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await assignGroupRoles(tenantIdFrom(req), req.params.id as string, req.body, req.user?.userId);
    res.json({ data: updated });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/members', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, role } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const membership = await addMemberToGroup(tenantIdFrom(req), req.params.id as string, memberId, role, req.user?.userId);
    res.status(201).json({ data: membership });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/members/transfer', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, targetGroupId } = req.body;
    if (!memberId || !targetGroupId) {
      res.status(400).json({ error: 'memberId and targetGroupId are required' });
      return;
    }

    const membership = await transferMemberToGroup(
      tenantIdFrom(req),
      req.params.id as string,
      targetGroupId,
      memberId,
      req.user?.userId
    );
    res.status(201).json({ data: membership });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.delete('/:id/members/:memberId', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    await removeMemberFromGroup(tenantIdFrom(req), req.params.id as string, req.params.memberId as string, req.user?.userId);
    res.json({ message: 'Member removed from cell roster successfully' });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/meetings', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const meeting = await scheduleMeeting(tenantIdFrom(req), req.params.id as string, req.body, req.user?.userId);
    res.status(201).json({ data: meeting });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/:id/meetings', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listMeetings(tenantIdFrom(req), req.params.id as string);
    res.json({ data: list });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.post('/meetings/:meetingId/attendance', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { attendances } = req.body;
    if (!attendances || !Array.isArray(attendances)) {
      res.status(400).json({ error: 'attendances list is required' });
      return;
    }

    const updatedMeeting = await logMeetingAttendance(
      tenantIdFrom(req),
      req.params.meetingId as string,
      attendances,
      req.user!.userId
    );
    res.json({ data: updatedMeeting });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/meetings/:meetingId/report', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await submitMeetingReport(tenantIdFrom(req), req.params.meetingId as string, req.body, req.user?.userId);
    res.json({ data: report });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/:id/notice-board', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await listNoticePosts(tenantIdFrom(req), req.params.id as string, req.user?.userId);
    res.json({ data: posts });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/notice-board', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await postNotice(tenantIdFrom(req), req.params.id as string, req.user!.userId, req.body);
    res.status(201).json({ data: post });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/notice-board/delegate', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const delegated = await delegateNoticeBoardWrite(tenantIdFrom(req), req.params.id as string, memberId, req.user?.userId);
    res.json({ data: delegated });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/invites', requireCellUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { createdByMemberId, customMessage } = req.body;
    if (!createdByMemberId) {
      res.status(400).json({ error: 'createdByMemberId is required' });
      return;
    }

    const inviteLink = await createInviteLink(tenantIdFrom(req), req.params.id as string, createdByMemberId, customMessage, req.user?.userId);
    res.status(201).json({ data: inviteLink });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.get('/:id/invites', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const inviteLinks = await listInviteLinks(tenantIdFrom(req), req.params.id as string);
    res.json({ data: inviteLinks });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

router.get('/:id/scorecard', requireCellRead, async (req: Request, res: Response): Promise<void> => {
  try {
    const scorecard = await calculateScorecard(tenantIdFrom(req), req.params.id as string);
    res.json({ data: scorecard });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/scorecard/recalculate', requireCellReports, async (req: Request, res: Response): Promise<void> => {
  try {
    const scorecard = await calculateScorecard(tenantIdFrom(req), req.params.id as string);
    res.json({ data: scorecard });
  } catch (err: any) {
    sendError(res, err);
  }
});

router.post('/:id/promote', requireCellSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const promotion = await promoteGroup(tenantIdFrom(req), req.params.id as string, req.user!.userId);
    res.json({ data: promotion });
  } catch (err: any) {
    sendError(res, err);
  }
});

export default router;
