import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  configureApp,
  getAppConfig,
  triggerBuild,
  processBuild,
  listBuilds,
  submitToStore,
} from '../services/whiteLabel';

const router = Router();

// All white-label routes require authentication
router.use(authMiddleware);

// ─── App Configuration ──────────────────────────────────────

// POST /api/whitelabel/config — Create or update white-label app settings
router.post('/config', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await configureApp(req.tenantId!, req.body);
    res.status(200).json(config);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/whitelabel/config — Fetch active settings
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getAppConfig(req.tenantId!);
    if (!config) {
      res.status(404).json({ error: 'No white-label app configured' });
      return;
    }
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Build Pipeline ──────────────────────────────────────────

// POST /api/whitelabel/builds — Trigger a new compilation build
router.post('/builds', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId, platform, version } = req.body;
    if (!appId || !platform || !version) {
      res.status(400).json({ error: 'appId, platform, and version are required' });
      return;
    }
    const build = await triggerBuild(req.tenantId!, appId, { platform, version });
    res.status(201).json(build);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/whitelabel/builds — List build compilation history
router.get('/builds', async (req: Request, res: Response): Promise<void> => {
  try {
    const builds = await listBuilds(req.tenantId!);
    res.json(builds);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whitelabel/builds/:id/process — Trigger mock compilation state transitions
router.post('/builds/:id/process', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const build = await processBuild(req.tenantId!, req.params.id as string);
    res.json(build);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Store Submission ────────────────────────────────────────

// POST /api/whitelabel/builds/:id/submit — Deploy mock bundle to App Stores
router.post('/builds/:id/submit', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeType, storeDetailsJson } = req.body;
    if (!storeType) {
      res.status(400).json({ error: 'storeType is required' });
      return;
    }
    const result = await submitToStore(req.tenantId!, req.params.id as string, { storeType, storeDetailsJson });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
