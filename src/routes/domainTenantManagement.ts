import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { DomainTenantManagementService } from '../services/domainTenantManagement';

const router = Router();

// Apply authentication and module entitlements check to all routes
router.use(authMiddleware);
router.use(requireModule('domain-tenant-management'));

const requireDtPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

/**
 * GET /api/domain-tenant-management
 * List all domain tenant module configuration profiles for the tenant.
 */
router.get('/', requireDtPermission('domain-tenant-management.read'), async (req: Request, res: Response) => {
  try {
    const list = await DomainTenantManagementService.listProfiles(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/domain-tenant-management
 * Create a new domain tenant module configuration profile.
 */
router.post('/', requireDtPermission('domain-tenant-management.create'), async (req: Request, res: Response) => {
  try {
    const { title, description, visibility } = req.body;
    const userId = req.user?.userId;

    const moduleRecord = await DomainTenantManagementService.createProfile(req.tenantId!, userId || null, {
      title,
      description,
      visibility,
    });

    res.status(201).json({ data: moduleRecord });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/domain-tenant-management/overview
 * Dashboard summary for active metrics, settings, checklist, and activities.
 */
router.get('/overview', requireDtPermission('domain-tenant-management.read'), async (req: Request, res: Response) => {
  try {
    const overview = await DomainTenantManagementService.getOverview(req.tenantId!);
    res.json({ data: overview });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/domain-tenant-management/settings
 * Fetch settings configurations of the domain tenant management.
 */
router.get('/settings', requireDtPermission('domain-tenant-management.read'), async (req: Request, res: Response) => {
  try {
    const settings = await DomainTenantManagementService.getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/domain-tenant-management/settings
 * Update configurations.
 */
router.patch('/settings', requireDtPermission('domain-tenant-management.manage_settings'), async (req: Request, res: Response) => {
  try {
    const settings = await DomainTenantManagementService.updateSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/domain-tenant-management/reports
 * Fetch activity audit logs for reports.
 */
router.get('/reports', requireDtPermission('domain-tenant-management.view_reports'), async (req: Request, res: Response) => {
  try {
    const logs = await DomainTenantManagementService.listActivities(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/domain-tenant-management/:id
 * Fetch single tenant-isolated record details.
 */
router.get('/:id', requireDtPermission('domain-tenant-management.read'), async (req: Request, res: Response) => {
  try {
    const details = await DomainTenantManagementService.getProfile(req.params.id as string, req.tenantId!);
    res.json({ data: details });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * PATCH /api/domain-tenant-management/:id
 * Edit config settings details securely.
 */
router.patch('/:id', requireDtPermission('domain-tenant-management.update'), async (req: Request, res: Response) => {
  try {
    const record = await DomainTenantManagementService.updateProfile(
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
 * DELETE /api/domain-tenant-management/:id
 * Delete domain tenant management registration.
 */
router.delete('/:id', requireDtPermission('domain-tenant-management.delete'), async (req: Request, res: Response) => {
  try {
    await DomainTenantManagementService.deleteProfile(
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
