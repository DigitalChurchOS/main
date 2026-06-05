import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import {
  getStream,
  getSettings,
  getChatMessages,
  sendChatMessage,
  trackViewerJoin,
  trackViewerLeave,
  submitInteraction,
} from '../services/livestream';

const router = Router();

// Helper to check module settings before returning data
async function checkPublicAccess(req: Request, res: Response): Promise<boolean> {
  let tenantId = req.tenantId;
  if (!tenantId) {
    const id = req.params.id as string;
    if (id) {
      const stream = await prisma.livestream.findUnique({
        where: { id },
      });
      if (stream) {
        tenantId = stream.tenantId;
        req.tenantId = tenantId;
      }
    }
  }

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required' });
    return false;
  }

  const settings = await getSettings(tenantId);
  if (!settings.enabled) {
    res.status(403).json({ error: 'Livestream Module is disabled for this church.' });
    return false;
  }

  const config = typeof settings.configJson === 'string'
    ? JSON.parse(settings.configJson)
    : settings.configJson || {};

  // Check if public publishing is allowed
  if (config.publicPublishingEnabled === false) {
    // If not enabled publicly, check if user is admin (otherwise reject)
    // For public routes, we assume they are unauthenticated visitors.
    // If they have an admin token, they can view, but general guests cannot.
    if (!req.user || !req.user.userId) {
      res.status(403).json({ error: 'This livestream channel is not published yet.' });
      return false;
    }
  }

  return true;
}

// GET /api/public/livestream/:id — Public stream detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const isAllowed = await checkPublicAccess(req, res);
    if (!isAllowed) return;

    const stream = await prisma.livestream.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      include: { replayAsset: true },
    });

    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }

    // Sanitize stream detail to not leak streamKey or rtmpIngestUrl to public users
    const sanitized = {
      id: stream.id,
      title: stream.title,
      description: stream.description,
      scheduledAt: stream.scheduledAt,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      status: stream.status,
      thumbnailUrl: stream.thumbnailUrl,
      countdownEnabled: stream.countdownEnabled,
      chatEnabled: stream.chatEnabled,
      multiPlatformLinks: JSON.parse(stream.multiPlatformLinks || '[]'),
      replayAsset: stream.replayAsset,
    };

    res.json({ data: sanitized });
  } catch (err: any) {
    console.error('Public get stream error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/livestream/:id/chat — Public chat history
router.get('/:id/chat', async (req: Request, res: Response) => {
  try {
    const isAllowed = await checkPublicAccess(req, res);
    if (!isAllowed) return;

    // Check if stream chat is enabled
    const stream = await prisma.livestream.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });
    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }
    if (!stream.chatEnabled) {
      res.status(403).json({ error: 'Live chat is disabled for this stream.' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const messages = await getChatMessages(req.params.id as string, limit);
    res.json({ data: messages });
  } catch (err: any) {
    console.error('Public get chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/public/livestream/:id/chat — Guest/visitor send chat message
router.post('/:id/chat', async (req: Request, res: Response) => {
  try {
    const isAllowed = await checkPublicAccess(req, res);
    if (!isAllowed) return;

    const stream = await prisma.livestream.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });
    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }
    if (stream.status !== 'live') {
      res.status(400).json({ error: 'Cannot send chat message to an inactive broadcast.' });
      return;
    }
    if (!stream.chatEnabled) {
      res.status(403).json({ error: 'Live chat is disabled for this stream.' });
      return;
    }

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
    console.error('Public send chat error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/public/livestream/:id/viewers/join — Register viewer
router.post('/:id/viewers/join', async (req: Request, res: Response) => {
  try {
    const isAllowed = await checkPublicAccess(req, res);
    if (!isAllowed) return;

    const { sessionId } = req.body;
    const viewer = await trackViewerJoin(
      req.params.id as string,
      req.tenantId!,
      req.user?.userId,
      sessionId
    );

    res.status(201).json({ data: viewer });
  } catch (err: any) {
    console.error('Public viewer join error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/public/livestream/:id/viewers/leave — End viewer session
router.post('/:id/viewers/leave', async (req: Request, res: Response) => {
  try {
    const isAllowed = await checkPublicAccess(req, res);
    if (!isAllowed) return;

    const { viewerId } = req.body;
    if (!viewerId) {
      res.status(400).json({ error: 'viewerId is required' });
      return;
    }

    const viewer = await trackViewerLeave(viewerId as string);
    res.json({ data: viewer });
  } catch (err: any) {
    console.error('Public viewer leave error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/public/livestream/:id/interactions — Submit viewer interaction
router.post('/:id/interactions', async (req: Request, res: Response) => {
  try {
    const isAllowed = await checkPublicAccess(req, res);
    if (!isAllowed) return;

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
    console.error('Public submit interaction error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
