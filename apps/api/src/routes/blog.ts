import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createCategory,
  listCategories,
  createTag,
  listTags,
  createPost,
  updatePost,
  deletePost,
  getPost,
  listPosts,
  addComment,
  listComments,
  moderateComment,
} from '../services/blog';

const router = Router();

// All blog routes require authentication in the current architecture
router.use(authMiddleware);

/**
 * ─────────────────────────────────────────────────────────────
 * CATEGORY ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/blog/categories — Create a category (Admin)
router.post('/categories', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, slug, description, parentId } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const category = await createCategory(req.tenantId!, { name, slug, description, parentId });
    res.status(201).json({ data: category });
  } catch (err: any) {
    console.error('Create category error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/blog/categories — List all categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await listCategories(req.tenantId!);
    res.json({ data: categories });
  } catch (err: any) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * TAG ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/blog/tags — Create a tag (Admin)
router.post('/tags', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const tag = await createTag(req.tenantId!, name, slug);
    res.status(201).json({ data: tag });
  } catch (err: any) {
    console.error('Create tag error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/blog/tags — List all tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await listTags(req.tenantId!);
    res.json({ data: tags });
  } catch (err: any) {
    console.error('List tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * BLOG POST ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/blog/posts — Create a post (Admin)
router.post('/posts', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { title, slug, content, excerpt, postType, status, publishedAt, coverImageUrl, authorId, categoryId, scriptures, tags } = req.body;
    if (!title || !content || !postType) {
      res.status(400).json({ error: 'title, content, and postType are required' });
      return;
    }
    const post = await createPost(req.tenantId!, {
      title, slug, content, excerpt, postType, status, publishedAt, coverImageUrl, authorId, categoryId, scriptures, tags
    });
    res.status(201).json({ data: post });
  } catch (err: any) {
    console.error('Create post error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/blog/posts — List posts with filters
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const filters = {
      postType: req.query.postType as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      tagId: req.query.tagId as string | undefined,
      authorId: req.query.authorId as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    // Non-admins should only see published posts unless they specifically request archived/draft,
    // but we restrict that request to admins in the service or here.
    // To be secure, force status to 'published' for non-admins.
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && filters.status && filters.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published posts' });
      return;
    }

    const result = await listPosts(req.tenantId!, filters);
    res.json({
      data: result.posts,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err: any) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blog/posts/:idOrSlug — Get post detail
router.get('/posts/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const post = await getPost(req.params.idOrSlug as string, req.tenantId!);

    // Access check: only admins can view non-published posts
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && post.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published posts' });
      return;
    }

    res.json({ data: post });
  } catch (err: any) {
    console.error('Get post error:', err);
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/blog/posts/:id — Update a post (Admin)
router.put('/posts/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const post = await updatePost(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: post });
  } catch (err: any) {
    console.error('Update post error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/blog/posts/:id — Delete/Archive a post (Admin)
router.delete('/posts/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const post = await deletePost(req.params.id as string, req.tenantId!);
    res.json({ data: post });
  } catch (err: any) {
    console.error('Delete post error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * COMMENT & MODERATION ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/blog/posts/:id/comments — Add a comment to a post
router.post('/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const { displayName, email, content } = req.body;
    if (!displayName || !content) {
      res.status(400).json({ error: 'displayName and content are required' });
      return;
    }

    const userId = req.user?.userId || null;
    const comment = await addComment(req.tenantId!, postId, userId, { displayName, email, content });
    res.status(201).json({ data: comment });
  } catch (err: any) {
    console.error('Add comment error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/blog/posts/:id/comments — List comments for a post
router.get('/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');

    // Admins can see all (including pending), general users/guests only see approved
    const comments = await listComments(postId, req.tenantId!, isAdmin);
    res.json({ data: comments });
  } catch (err: any) {
    console.error('List comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/blog/comments/:id/status — Moderate comment (Admin)
router.put('/comments/:id/status', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id as string;
    const { status } = req.body;
    if (!status || !['approved', 'spam', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Valid status (approved, spam, pending) is required' });
      return;
    }

    const comment = await moderateComment(commentId, req.tenantId!, status);
    res.json({ data: comment });
  } catch (err: any) {
    console.error('Moderate comment error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
