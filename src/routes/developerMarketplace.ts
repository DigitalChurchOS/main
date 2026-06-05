import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { DeveloperMarketplaceService } from '../services/developerMarketplace';

const router = Router();

// Apply authentication and module entitlements check to all routes
router.use(authMiddleware);
router.use(requireModule('developer-marketplace'));

const requireMarketplacePermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

/**
 * GET /api/developer-marketplace
 * List all developer marketplace module configuration profiles for the tenant.
 */
router.get('/', requireMarketplacePermission('developer-marketplace.read'), async (req: Request, res: Response) => {
  try {
    const list = await DeveloperMarketplaceService.listDeveloperMarketplaceModules(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/developer-marketplace
 * Create a new developer marketplace module configuration profile.
 */
router.post('/', requireMarketplacePermission('developer-marketplace.create'), async (req: Request, res: Response) => {
  try {
    const { title, description, visibility } = req.body;
    const userId = req.user?.userId;

    const moduleRecord = await DeveloperMarketplaceService.createDeveloperMarketplaceModule(req.tenantId!, {
      title,
      description,
      visibility,
      createdBy: userId,
    });

    await DeveloperMarketplaceService.logActivity(req.tenantId!, userId!, 'activate_module', {
      moduleId: moduleRecord.id,
      title,
    });

    res.status(201).json({ data: moduleRecord });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/developer-marketplace/overview
 * Dashboard summary for active metrics, financials, settings, and activity.
 */
router.get('/overview', requireMarketplacePermission('developer-marketplace.read'), async (req: Request, res: Response) => {
  try {
    const overview = await DeveloperMarketplaceService.getOverview(req.tenantId!);
    res.json({ data: overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/developer-marketplace/settings
 * Fetch settings configurations of the developer marketplace.
 */
router.get('/settings', requireMarketplacePermission('developer-marketplace.read'), async (req: Request, res: Response) => {
  try {
    const settings = await DeveloperMarketplaceService.getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/developer-marketplace/settings
 * Update billing plan/configurations.
 */
router.patch('/settings', requireMarketplacePermission('developer-marketplace.manage_settings'), async (req: Request, res: Response) => {
  try {
    const settings = await DeveloperMarketplaceService.updateSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/developer-marketplace/reports
 * Fetch activity audit logs for reports.
 */
router.get('/reports', requireMarketplacePermission('developer-marketplace.view_reports'), async (req: Request, res: Response) => {
  try {
    const logs = await DeveloperMarketplaceService.listActivities(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/developer-marketplace/:id
 * Fetch single tenant-isolated record details.
 */
router.get('/:id', requireMarketplacePermission('developer-marketplace.read'), async (req: Request, res: Response) => {
  try {
    const details = await DeveloperMarketplaceService.getDeveloperMarketplaceModule(req.params.id as string, req.tenantId!);
    res.json({ data: details });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * PATCH /api/developer-marketplace/:id
 * Edit config settings details.
 */
router.patch('/:id', requireMarketplacePermission('developer-marketplace.update'), async (req: Request, res: Response) => {
  try {
    const record = await DeveloperMarketplaceService.updateDeveloperMarketplaceModule(
      req.params.id as string,
      req.tenantId!,
      req.body
    );

    await DeveloperMarketplaceService.logActivity(req.tenantId!, req.user!.userId, 'update_module', {
      moduleId: record.id,
      fields: Object.keys(req.body),
    });

    res.json({ data: record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/developer-marketplace/:id
 * Delete developer marketplace module registration.
 */
router.delete('/:id', requireMarketplacePermission('developer-marketplace.delete'), async (req: Request, res: Response) => {
  try {
    await DeveloperMarketplaceService.deleteDeveloperMarketplaceModule(req.params.id as string, req.tenantId!);

    await DeveloperMarketplaceService.logActivity(req.tenantId!, req.user!.userId, 'delete_module', {
      moduleId: req.params.id,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
