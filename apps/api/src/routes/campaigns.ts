import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
  closeCampaign,
  addCampaignUpdate,
  listCampaignUpdates,
  getCampaignSupporters,
  getCampaignAnalytics,
} from '../services/campaigns';

const router = Router();

// ─────────────────────────────────────────────────────────────
// CAMPAIGNS PUBLIC & ADMIN
// ─────────────────────────────────────────────────────────────

// GET /api/campaigns - List all campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined; // e.g. 'active' | 'ended'
    const campaigns = await listCampaigns(req.tenantId!, status);
    res.json({ data: campaigns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:idOrSlug - Get campaign details
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const campaign = await getCampaign(req.params.idOrSlug as string, req.tenantId!);
    res.json({ data: campaign });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/campaigns - Create a campaign (Admin Only)
router.post('/', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const campaign = await createCampaign(req.tenantId!, req.body);
    res.status(201).json({ data: campaign });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/campaigns/:id - Update campaign (Admin Only)
router.patch('/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const campaign = await updateCampaign(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: campaign });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/campaigns/:id/close - Close/end fundraising (Admin Only)
router.post('/:id/close', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const campaign = await closeCampaign(req.params.id as string, req.tenantId!);
    res.json({ data: campaign });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// CAMPAIGN TIMELINE UPDATES (Public & Admin)
// ─────────────────────────────────────────────────────────────

// GET /api/campaigns/:id/updates - List timeline updates for a campaign
router.get('/:id/updates', async (req: Request, res: Response) => {
  try {
    const updates = await listCampaignUpdates(req.params.id as string, req.tenantId!);
    res.json({ data: updates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns/:id/updates - Post timeline update (Admin Only)
router.post('/:id/updates', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const updateRecord = await addCampaignUpdate(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: updateRecord });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUDITS, REPORTS & ANALYTICS (Admin Only)
// ─────────────────────────────────────────────────────────────

// GET /api/campaigns/:id/supporters - List aggregated supporters (Admin Only)
router.get('/:id/supporters', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const supporters = await getCampaignSupporters(req.params.id as string, req.tenantId!);
    res.json({ data: supporters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:id/analytics - Get daily funding momentum analytics (Admin Only)
router.get('/:id/analytics', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const analytics = await getCampaignAnalytics(req.params.id as string, req.tenantId!);
    res.json({ data: analytics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
