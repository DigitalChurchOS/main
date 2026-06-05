import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { DynamicBlogPublishingEngineService } from '../services/dynamicBlogPublishingEngine';

const router = Router();

// Apply authentication and module entitlements check to all routes
router.use(authMiddleware);
router.use(requireModule('dynamic-blog-publishing-engine'));

const requireBlogPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

/**
 * GET /api/dynamic-blog-publishing-engine
 * List all configuration profiles.
 */
router.get('/', requireBlogPermission('dynamic-blog-publishing-engine.read'), async (req: Request, res: Response) => {
  try {
    const list = await DynamicBlogPublishingEngineService.listProfiles(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/dynamic-blog-publishing-engine
 * Create a new profile.
 */
router.post('/', requireBlogPermission('dynamic-blog-publishing-engine.create'), async (req: Request, res: Response) => {
  try {
    const { title, description, visibility } = req.body;
    const userId = req.user?.userId;

    const record = await DynamicBlogPublishingEngineService.createProfile(req.tenantId!, userId || null, {
      title,
      description,
      visibility,
    });
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/dynamic-blog-publishing-engine/overview
 * Dashboard metrics summary.
 */
router.get('/overview', requireBlogPermission('dynamic-blog-publishing-engine.read'), async (req: Request, res: Response) => {
  try {
    const overview = await DynamicBlogPublishingEngineService.getOverview(req.tenantId!);
    res.json({ data: overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dynamic-blog-publishing-engine/settings
 * Fetch settings.
 */
router.get('/settings', requireBlogPermission('dynamic-blog-publishing-engine.read'), async (req: Request, res: Response) => {
  try {
    const settings = await DynamicBlogPublishingEngineService.getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/dynamic-blog-publishing-engine/settings
 * Update settings.
 */
router.patch('/settings', requireBlogPermission('dynamic-blog-publishing-engine.manage_settings'), async (req: Request, res: Response) => {
  try {
    const settings = await DynamicBlogPublishingEngineService.updateSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/dynamic-blog-publishing-engine/reports
 * Fetch activities.
 */
router.get('/reports', requireBlogPermission('dynamic-blog-publishing-engine.view_reports'), async (req: Request, res: Response) => {
  try {
    const logs = await DynamicBlogPublishingEngineService.listActivities(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dynamic-blog-publishing-engine/:id
 * Get single profile.
 */
router.get('/:id', requireBlogPermission('dynamic-blog-publishing-engine.read'), async (req: Request, res: Response) => {
  try {
    const details = await DynamicBlogPublishingEngineService.getProfile(req.params.id as string, req.tenantId!);
    res.json({ data: details });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * PATCH /api/dynamic-blog-publishing-engine/:id
 * Update details.
 */
router.patch('/:id', requireBlogPermission('dynamic-blog-publishing-engine.update'), async (req: Request, res: Response) => {
  try {
    const record = await DynamicBlogPublishingEngineService.updateProfile(
      req.params.id as string,
      req.tenantId!,
      req.user?.userId || null,
      req.body
    );
    res.json({ data: record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/dynamic-blog-publishing-engine/:id
 * Delete profile.
 */
router.delete('/:id', requireBlogPermission('dynamic-blog-publishing-engine.delete'), async (req: Request, res: Response) => {
  try {
    await DynamicBlogPublishingEngineService.deleteProfile(
      req.params.id as string,
      req.tenantId!,
      req.user?.userId || null
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
