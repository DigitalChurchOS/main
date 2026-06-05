import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  createPrayerSession,
  startPrayerSession,
  joinPrayerSession,
  leavePrayerSession,
  confirmPrayed,
  toggleParticipantAudio,
  updateSessionSettings,
  delegateTemporaryLeader,
  revokeTemporaryLeader,
  muteAllParticipants,
  moderateParticipant,
  sendReaction,
  getSessionMetrics,
  createPrayerPoint,
  getPrayerPoints,
  assignPrayerRequest,
  updateRequestStatus,
  createPrayerMedia,
  getRecommendedMedia,
  moderateTestimony,
} from '../services/prayer';

const router = Router();

// Apply auth middleware to all prayer routes
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────

router.post('/sessions', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, startTime, endTime, recurrence, musicUrl, musicVolume, leaderId } = req.body;
    if (!title || !startTime || !endTime) {
      res.status(400).json({ error: 'title, startTime, and endTime are required' });
      return;
    }

    const session = await createPrayerSession(req.tenantId!, leaderId || null, {
      title,
      description,
      startTime,
      endTime,
      recurrence,
      musicUrl,
      musicVolume,
    });
    res.status(201).json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/start', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await startPrayerSession(req.tenantId!, req.params.id as string);
    res.json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/join', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { isPublic, audioEnabled } = req.body;
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const part = await joinPrayerSession(req.tenantId!, req.params.id as string, member.id, {
      isPublic,
      audioEnabled,
    });
    res.json({ data: part });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/leave', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const part = await leavePrayerSession(req.tenantId!, req.params.id as string, member.id);
    res.json({ data: part });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/confirm', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const part = await confirmPrayed(req.tenantId!, req.params.id as string, member.id);
    res.json({ data: part });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/audio', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioEnabled } = req.body;
    if (audioEnabled === undefined) {
      res.status(400).json({ error: 'audioEnabled is required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const part = await toggleParticipantAudio(req.tenantId!, req.params.id as string, member.id, audioEnabled);
    res.json({ data: part });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/settings', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { musicPaused, scrollingPaused, volume, currentPrayerPointId, status } = req.body;
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const updated = await updateSessionSettings(req.tenantId!, req.params.id as string, member.id, {
      musicPaused,
      scrollingPaused,
      volume,
      currentPrayerPointId,
      status,
    });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/delegate', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const updated = await delegateTemporaryLeader(req.tenantId!, req.params.id as string, member.id, memberId);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/revoke', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const updated = await revokeTemporaryLeader(req.tenantId!, req.params.id as string, member.id, memberId);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/mute-all', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const result = await muteAllParticipants(req.tenantId!, req.params.id as string, member.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/moderate-member', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetMemberId, action } = req.body;
    if (!targetMemberId || !action) {
      res.status(400).json({ error: 'targetMemberId and action are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const result = await moderateParticipant(req.tenantId!, req.params.id as string, member.id, targetMemberId, action);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/reaction', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reactionType } = req.body;
    if (!reactionType) {
      res.status(400).json({ error: 'reactionType is required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const rxn = await sendReaction(req.tenantId!, req.params.id as string, member.id, reactionType);
    res.status(201).json({ data: rxn });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sessions/:id/metrics', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await getSessionMetrics(req.tenantId!, req.params.id as string);
    res.json({ data: metrics });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PRAYER POINTS
// ─────────────────────────────────────────────────────────────

router.post('/sessions/:id/points', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, category, duration, scriptureRef, sequenceOrder } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const point = await createPrayerPoint(req.tenantId!, req.params.id as string, {
      title,
      content,
      category,
      duration,
      scriptureRef,
      sequenceOrder,
    });
    res.status(201).json({ data: point });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sessions/:id/points', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const points = await getPrayerPoints(req.tenantId!, req.params.id as string);
    res.json({ data: points });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PRAYER REQUESTS & CRM CARE
// ─────────────────────────────────────────────────────────────

router.post('/requests/:id/assign', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, followUpReminderAt } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const pr = await assignPrayerRequest(req.tenantId!, req.params.id as string, memberId, followUpReminderAt);
    res.json({ data: pr });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/requests/:id/status', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const pr = await updateRequestStatus(req.tenantId!, req.params.id as string, status);
    res.json({ data: pr });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// TESTIMONY MODERATION
// ─────────────────────────────────────────────────────────────

router.patch('/testimonies/:id/feature', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, isFeatured } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const t = await moderateTestimony(req.tenantId!, req.params.id as string, status, isFeatured);
    res.json({ data: t });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// MEDIA & RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────

router.post('/media', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, mediaUrl, mediaType, category, recommendedFor } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const media = await createPrayerMedia(req.tenantId!, {
      title,
      description,
      mediaUrl,
      mediaType,
      category,
      recommendedFor,
    });
    res.status(201).json({ data: media });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sessions/:id/recommendations', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const recs = await getRecommendedMedia(req.tenantId!, req.params.id as string);
    res.json({ data: recs });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
