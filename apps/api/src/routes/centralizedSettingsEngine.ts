import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { CentralizedSettingsEngineService } from '../services/centralizedSettingsEngine';

const router = Router();

// Apply authentication to all centralized settings engine routes
router.use(authMiddleware);

/**
 * GET /api/centralized-settings-engine
 * List all settings profiles for the tenant.
 */
router.get('/', requirePermission('centralized-settings-engine.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await CentralizedSettingsEngineService.listProfiles(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/centralized-settings-engine/logs
 * Retrieve audit activities history logs.
 */
router.get('/logs', requirePermission('centralized-settings-engine.view_reports'), async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await CentralizedSettingsEngineService.listActivities(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/centralized-settings-engine/:id
 * Retrieve a single tenant-isolated settings profile record.
 */
router.get('/:id', requirePermission('centralized-settings-engine.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const profile = await CentralizedSettingsEngineService.getProfile(id, req.tenantId!);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * POST /api/centralized-settings-engine
 * Create a new settings configuration profile.
 */
router.post('/', requirePermission('centralized-settings-engine.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, settingsJson, visibility } = req.body;
    const userId = req.user?.userId || null;

    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const profile = await CentralizedSettingsEngineService.createProfile(req.tenantId!, userId, {
      title,
      description,
      settingsJson,
      visibility,
    });

    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/centralized-settings-engine/:id
 * Update an existing settings profile.
 */
router.patch('/:id', requirePermission('centralized-settings-engine.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId || null;
    const profile = await CentralizedSettingsEngineService.updateProfile(id, req.tenantId!, userId, req.body);
    res.json({ data: profile });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

/**
 * DELETE /api/centralized-settings-engine/:id
 * Delete a settings profile.
 */
router.delete('/:id', requirePermission('centralized-settings-engine.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId || null;
    const profile = await CentralizedSettingsEngineService.deleteProfile(id, req.tenantId!, userId);
    res.json({ data: profile, message: 'Settings profile deleted successfully' });
  } catch (err: any) {
    const status = err.message?.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

export default router;
