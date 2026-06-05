import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { DigitalLibraryResourceCenterService } from '../services/digitalLibraryResourceCenter';

const router = Router();

// Apply authentication and module entitlements check to all routes
router.use(authMiddleware);
router.use(requireModule('digital-library-resource-center'));

const requireLibraryPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

/**
 * GET /api/digital-library-resource-center
 * List all configuration profiles.
 */
router.get('/', requireLibraryPermission('digital-library-resource-center.read'), async (req: Request, res: Response) => {
  try {
    const list = await DigitalLibraryResourceCenterService.listProfiles(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/digital-library-resource-center
 * Create a new profile.
 */
router.post('/', requireLibraryPermission('digital-library-resource-center.create'), async (req: Request, res: Response) => {
  try {
    const { title, description, visibility } = req.body;
    const userId = req.user?.userId;

    const record = await DigitalLibraryResourceCenterService.createProfile(req.tenantId!, userId || null, {
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
 * GET /api/digital-library-resource-center/overview
 * Dashboard metrics summary.
 */
router.get('/overview', requireLibraryPermission('digital-library-resource-center.read'), async (req: Request, res: Response) => {
  try {
    const overview = await DigitalLibraryResourceCenterService.getOverview(req.tenantId!);
    res.json({ data: overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/digital-library-resource-center/settings
 * Fetch settings.
 */
router.get('/settings', requireLibraryPermission('digital-library-resource-center.read'), async (req: Request, res: Response) => {
  try {
    const settings = await DigitalLibraryResourceCenterService.getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/digital-library-resource-center/settings
 * Update settings.
 */
router.patch('/settings', requireLibraryPermission('digital-library-resource-center.manage_settings'), async (req: Request, res: Response) => {
  try {
    const settings = await DigitalLibraryResourceCenterService.updateSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/digital-library-resource-center/reports
 * Fetch activities.
 */
router.get('/reports', requireLibraryPermission('digital-library-resource-center.view_reports'), async (req: Request, res: Response) => {
  try {
    const logs = await DigitalLibraryResourceCenterService.listActivities(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/digital-library-resource-center/:id
 * Get single profile.
 */
router.get('/:id', requireLibraryPermission('digital-library-resource-center.read'), async (req: Request, res: Response) => {
  try {
    const details = await DigitalLibraryResourceCenterService.getProfile(req.params.id as string, req.tenantId!);
    res.json({ data: details });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * PATCH /api/digital-library-resource-center/:id
 * Update details.
 */
router.patch('/:id', requireLibraryPermission('digital-library-resource-center.update'), async (req: Request, res: Response) => {
  try {
    const record = await DigitalLibraryResourceCenterService.updateProfile(
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
 * DELETE /api/digital-library-resource-center/:id
 * Delete profile.
 */
router.delete('/:id', requireLibraryPermission('digital-library-resource-center.delete'), async (req: Request, res: Response) => {
  try {
    await DigitalLibraryResourceCenterService.deleteProfile(
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
