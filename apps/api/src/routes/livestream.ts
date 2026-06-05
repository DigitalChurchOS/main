import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import {
  LIVESTREAM_MODULE_KEY,
  scheduleStream,
  getStream,
  listStreams,
  goLive,
  endStream,
  sendChatMessage,
  getChatMessages,
  trackViewerJoin,
  trackViewerLeave,
  getStreamAnalytics,
  submitInteraction,
  getInteractions,
  generateStreamEmbed,
  getSettings,
  updateSettings,
  listActivities,
  getOverview,
  createProfile,
  listProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
} from '../services/livestream';

const router = Router();

// All livestream routes require authentication
router.use(authMiddleware);
router.use(requireModule(LIVESTREAM_MODULE_KEY));

const requireLivestreamPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

// Helper for status codes matching standard module errors
function statusFor(error: Error) {
  const msg = error.message.toLowerCase();
  if (msg.includes('not found')) return 404;
  if (msg.includes('disabled')) return 403;
  return 400;
}

// ─────────────────────────────────────────────────────────────
// STREAM CRUD & LIFECYCLE
// ─────────────────────────────────────────────────────────────

// GET /api/livestream/overview — Get module overview counts & status
router.get('/overview', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const overview = await getOverview(req.tenantId!);
    res.json({ data: overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/livestream/settings — Retrieve centralized module settings
router.get('/settings', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const settings = await getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/livestream/settings — Update centralized module settings
router.patch('/settings', requireLivestreamPermission('livestream.manage_settings'), async (req: Request, res: Response) => {
  try {
    const settings = await updateSettings(req.tenantId!, req.body, req.user?.userId);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// GET /api/livestream/activity — List module audit history activities
router.get('/activity', requireLivestreamPermission('livestream.view_reports'), async (req: Request, res: Response) => {
  try {
    const logs = await listActivities(req.tenantId!, {
      actionType: req.query.actionType as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PROFILES CRUD (Module Activation State)
// ─────────────────────────────────────────────────────────────

// GET /api/livestream/profiles — List profiles
router.get('/profiles', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const list = await listProfiles(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/livestream/profiles — Create profile
router.post('/profiles', requireLivestreamPermission('livestream.create'), async (req: Request, res: Response) => {
  try {
    const profile = await createProfile(req.tenantId!, req.body, req.user?.userId);
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// GET /api/livestream/profiles/:id — Get single profile
router.get('/profiles/:id', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const profile = await getProfile(req.params.id as string, req.tenantId!);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// PATCH /api/livestream/profiles/:id — Update profile
router.patch('/profiles/:id', requireLivestreamPermission('livestream.update'), async (req: Request, res: Response) => {
  try {
    const profile = await updateProfile(req.params.id as string, req.tenantId!, req.body, req.user?.userId);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// DELETE /api/livestream/profiles/:id — Delete profile
router.delete('/profiles/:id', requireLivestreamPermission('livestream.delete'), async (req: Request, res: Response) => {
  try {
    const profile = await deleteProfile(req.params.id as string, req.tenantId!, req.user?.userId);
    res.json({ data: profile, success: true });
  } catch (err: any) {
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// STREAM CRUD & LIFECYCLE
// ─────────────────────────────────────────────────────────────

// POST /api/livestream/streams — Schedule a new stream
router.post('/streams', requireLivestreamPermission('livestream.create'), async (req: Request, res: Response) => {
  try {
    const { title, description, scheduledAt, thumbnailUrl, countdownEnabled, chatEnabled, multiPlatformLinks } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const stream = await scheduleStream(req.tenantId!, {
      title, description, scheduledAt, thumbnailUrl, countdownEnabled, chatEnabled, multiPlatformLinks,
    });
    res.status(201).json({ data: stream });
  } catch (err: any) {
    console.error('Schedule stream error:', err);
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// GET /api/livestream/streams — List streams
router.get('/streams', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const streams = await listStreams(req.tenantId!, status);
    res.json({ data: streams });
  } catch (err: any) {
    console.error('List streams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/livestream/streams/:id — Get stream detail
router.get('/streams/:id', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const stream = await getStream(req.params.id as string, req.tenantId!);
    if (!stream) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }
    res.json({ data: stream });
  } catch (err: any) {
    console.error('Get stream error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/livestream/streams/:id/go-live — Transition to live
router.post('/streams/:id/go-live', requireLivestreamPermission('livestream.update'), async (req: Request, res: Response) => {
  try {
    const stream = await goLive(req.params.id as string, req.tenantId!);
    res.json({ data: stream });
  } catch (err: any) {
    console.error('Go live error:', err);
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// POST /api/livestream/streams/:id/end — End stream
router.post('/streams/:id/end', requireLivestreamPermission('livestream.update'), async (req: Request, res: Response) => {
  try {
    const stream = await endStream(req.params.id as string, req.tenantId!);
    res.json({ data: stream });
  } catch (err: any) {
    console.error('End stream error:', err);
    res.status(statusFor(err)).json({ error: err.message });
  }
});

// GET /api/livestream/streams/:id/embed — Get embed code
router.get('/streams/:id/embed', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const stream = await getStream(req.params.id as string, req.tenantId!);
    if (!stream) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }
    const embedHtml = generateStreamEmbed(stream);
    res.json({ data: { embedHtml } });
  } catch (err: any) {
    console.error('Get embed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────

// POST /api/livestream/streams/:id/chat — Send chat message
router.post('/streams/:id/chat', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const { displayName, message } = req.body;
    if (!displayName || !message) {
      res.status(400).json({ error: 'displayName and message are required' });
      return;
    }
    const chat = await sendChatMessage(
      req.params.id as string,
      req.tenantId!,
      req.user?.userId || null,
      displayName,
      message
    );
    res.status(201).json({ data: chat });
  } catch (err: any) {
    console.error('Send chat error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/livestream/streams/:id/chat — Get chat history
router.get('/streams/:id/chat', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const messages = await getChatMessages(req.params.id as string, limit);
    res.json({ data: messages });
  } catch (err: any) {
    console.error('Get chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// VIEWER TRACKING
// ─────────────────────────────────────────────────────────────

// POST /api/livestream/streams/:id/viewers/join — Register viewer
router.post('/streams/:id/viewers/join', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const viewer = await trackViewerJoin(
      req.params.id as string,
      req.tenantId!,
      req.user?.userId,
      sessionId
    );
    res.status(201).json({ data: viewer });
  } catch (err: any) {
    console.error('Viewer join error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/livestream/streams/:id/viewers/leave — End viewer session
router.post('/streams/:id/viewers/leave', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const { viewerId } = req.body;
    if (!viewerId) {
      res.status(400).json({ error: 'viewerId is required' });
      return;
    }
    const viewer = await trackViewerLeave(viewerId);
    res.json({ data: viewer });
  } catch (err: any) {
    console.error('Viewer leave error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/livestream/streams/:id/analytics — Stream analytics
router.get('/streams/:id/analytics', requireLivestreamPermission('livestream.view_reports'), async (req: Request, res: Response) => {
  try {
    const analytics = await getStreamAnalytics(req.params.id as string);
    res.json({ data: analytics });
  } catch (err: any) {
    console.error('Stream analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// INTERACTIONS
// ─────────────────────────────────────────────────────────────

// POST /api/livestream/streams/:id/interactions — Submit interaction
router.post('/streams/:id/interactions', requireLivestreamPermission('livestream.read'), async (req: Request, res: Response) => {
  try {
    const { type, content } = req.body;
    if (!type) {
      res.status(400).json({ error: 'type is required' });
      return;
    }
    const validTypes = ['prayer_request', 'salvation_response', 'note', 'giving_click'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
      return;
    }
    const interaction = await submitInteraction(
      req.params.id as string,
      req.tenantId!,
      type,
      req.user?.userId,
      content
    );
    res.status(201).json({ data: interaction });
  } catch (err: any) {
    console.error('Submit interaction error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/livestream/streams/:id/interactions — List interactions
router.get('/streams/:id/interactions', requireLivestreamPermission('livestream.view_reports'), async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const interactions = await getInteractions(req.params.id as string, type);
    res.json({ data: interactions });
  } catch (err: any) {
    console.error('Get interactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
