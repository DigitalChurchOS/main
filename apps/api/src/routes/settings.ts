import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { SettingsService } from '../services/settings';

const router = Router();

// Apply auth to all Settings routes
router.use(authMiddleware);

/**
 * GET /api/settings/schema
 * ------------------------
 * Returns the dynamic setting schemas defining keys, labels, types, and defaults.
 * Accessible to any member with read permission.
 */
router.get('/schema', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const schemas = await SettingsService.getSchemas();
    res.json({ data: schemas });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/settings
 * -----------------
 * Returns the current compiled settings values for all registered modules.
 * Scoped by tenant.
 */
router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SettingsService.getAllSettings(req.tenantId as string);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/settings/:moduleKey
 * ----------------------------
 * Returns the compiled setting values for a specific module under the requester's tenant.
 */
router.get('/:moduleKey', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleKey } = req.params;
    const settings = await SettingsService.getSettingsForModule(req.tenantId as string, moduleKey as string);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/settings/:moduleKey
 * -----------------------------
 * Performs a type-validated update to the tenant's settings overrides for a module.
 * Restricted to senior church administrators or tenants with 'tenant.settings' permission.
 */
router.patch('/:moduleKey', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleKey } = req.params;
    const updated = await SettingsService.updateSettingsForModule(req.tenantId as string, moduleKey as string, req.body);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/settings/:moduleKey/reset
 * -----------------------------------
 * Deletes custom database settings for a module under the tenant, restoring defaults.
 * Restricted to tenants with 'tenant.settings' permission.
 */
router.post('/:moduleKey/reset', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleKey } = req.params;
    const defaults = await SettingsService.resetSettingsForModule(req.tenantId as string, moduleKey as string);
    res.json({ data: defaults, message: `Module '${moduleKey}' settings have been reset to defaults.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
