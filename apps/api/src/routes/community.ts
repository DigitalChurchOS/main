import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createCommunityPost,
  listCommunityPosts,
  deleteCommunityPost,
  createPrayerRequest,
  listPrayerRequests,
  incrementPrayedCount,
  moderatePrayerRequest,
  deletePrayerRequest,
  createTestimony,
  listTestimonies,
  moderateTestimony,
  deleteTestimony,
  createCommunityComment,
  listComments,
  moderateComment,
  deleteComment,
  toggleCommunityReaction,
  getReactionSummaries,
  getMemberCommunityMetrics,
} from '../services/community';

const router = Router();

// All community routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// 1. COMMUNITY POSTS ENDPOINTS
// ─────────────────────────────────────────────────────────────

router.post('/posts', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, postType, visibility, groupId } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    // Associate with the user's corresponding member profile
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const post = await createCommunityPost(req.tenantId!, member.id, {
      title,
      content,
      postType,
      visibility,
      groupId,
    });

    res.status(201).json({ data: post });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/posts', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, postType, visibility, groupId, search, page, limit } = req.query;
    const results = await listCommunityPosts(req.tenantId!, {
      memberId: memberId as string,
      postType: postType as string,
      visibility: visibility as string,
      groupId: groupId as string,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:id', requirePermission('member.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteCommunityPost(req.tenantId!, req.params.id as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. PRAYER REQUESTS ENDPOINTS
// ─────────────────────────────────────────────────────────────

router.post('/prayers', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, isAnonymous, visibility } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const pr = await createPrayerRequest(req.tenantId!, member.id, {
      title,
      content,
      isAnonymous,
      visibility,
    });

    res.status(201).json({ data: pr });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/prayers', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, visibility, search, page, limit } = req.query;
    const results = await listPrayerRequests(req.tenantId!, {
      status: status as string,
      visibility: visibility as string,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prayers/:id/prayed', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await incrementPrayedCount(req.tenantId!, req.params.id as string);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/prayers/:id/moderate', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const updated = await moderatePrayerRequest(req.tenantId!, req.params.id as string, status);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/prayers/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await deletePrayerRequest(req.tenantId!, req.params.id as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. TESTIMONY ENDPOINTS
// ─────────────────────────────────────────────────────────────

router.post('/testimonies', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const testimony = await createTestimony(req.tenantId!, member.id, { title, content });
    res.status(201).json({ data: testimony });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/testimonies', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page, limit } = req.query;
    const results = await listTestimonies(req.tenantId!, {
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/testimonies/:id/moderate', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const updated = await moderateTestimony(req.tenantId!, req.params.id as string, status);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/testimonies/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteTestimony(req.tenantId!, req.params.id as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. COMMENTS ENDPOINTS
// ─────────────────────────────────────────────────────────────

router.post('/comments', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, postId, prayerRequestId, testimonyId } = req.body;
    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const comment = await createCommunityComment(req.tenantId!, member.id, {
      content,
      postId,
      prayerRequestId,
      testimonyId,
    });

    res.status(201).json({ data: comment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/comments', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId, prayerRequestId, testimonyId, status } = req.query;
    const comments = await listComments(req.tenantId!, {
      postId: postId as string,
      prayerRequestId: prayerRequestId as string,
      testimonyId: testimonyId as string,
      status: status as string,
    });

    res.json({ data: comments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/comments/:id/moderate', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const updated = await moderateComment(req.tenantId!, req.params.id as string, status);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/comments/:id', requirePermission('member.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteComment(req.tenantId!, req.params.id as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. REACTIONS ENDPOINTS
// ─────────────────────────────────────────────────────────────

router.post('/reactions', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reactionType, postId, prayerRequestId, testimonyId } = req.body;
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

    const result = await toggleCommunityReaction(req.tenantId!, member.id, {
      reactionType,
      postId,
      prayerRequestId,
      testimonyId,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reactions/summaries', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId, prayerRequestId, testimonyId } = req.query;
    const summaries = await getReactionSummaries(req.tenantId!, {
      postId: postId as string,
      prayerRequestId: prayerRequestId as string,
      testimonyId: testimonyId as string,
    });

    res.json({ data: summaries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. MEMBER ENGAGEMENT METRICS ENDPOINT
// ─────────────────────────────────────────────────────────────

router.get('/metrics/:memberId', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await getMemberCommunityMetrics(req.tenantId!, req.params.memberId as string);
    res.json({ data: metrics });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
