import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createRegion,
  listRegions,
  createBranch,
  updateBranch,
  listBranches,
  getBranch,
  assignBranchLeader,
  removeBranchLeader,
  getBranchMembers,
  getBranchAnalytics,
  getCentralDashboard,
} from '../services/multiBranch';

const router = Router();

// ═══════════════════════════════════════════════════════════
// REGIONS (tenant.settings)
// ═══════════════════════════════════════════════════════════

// POST /api/branches/regions — Create a region
router.post('/regions', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) { res.status(400).json({ error: 'Region name is required' }); return; }
    const region = await createRegion(req.tenantId!, { name, description });
    res.status(201).json({ data: region });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/branches/regions — List regions
router.get('/regions', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const regions = await listRegions(req.tenantId!);
    res.json({ data: regions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// CENTRAL DASHBOARD (tenant.settings)
// ═══════════════════════════════════════════════════════════

// GET /api/branches/dashboard — Central admin dashboard
router.get('/dashboard', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await getCentralDashboard(req.tenantId!);
    res.json({ data: dashboard });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// BRANCH CRUD (tenant.settings for mutating, authenticated for reads)
// ═══════════════════════════════════════════════════════════

// POST /api/branches — Create branch
router.post('/', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Branch name is required' }); return; }
    const branch = await createBranch(req.tenantId!, req.body);
    res.status(201).json({ data: branch });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/branches — List branches
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const regionId = req.query.regionId as string | undefined;
    const branches = await listBranches(req.tenantId!, regionId);
    res.json({ data: branches });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/branches/:id — Get branch detail
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const branch = await getBranch(req.tenantId!, req.params.id as string);
    res.json({ data: branch });
  } catch (err: any) {
    if (err.message === 'Branch not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// PUT /api/branches/:id — Update branch
router.put('/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const branch = await updateBranch(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: branch });
  } catch (err: any) {
    if (err.message === 'Branch not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ═══════════════════════════════════════════════════════════
// BRANCH LEADERSHIP (tenant.settings)
// ═══════════════════════════════════════════════════════════

// POST /api/branches/:id/leaders — Assign leader
router.post('/:id/leaders', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) { res.status(400).json({ error: 'userId and role are required' }); return; }
    const validRoles = ['branch_pastor', 'branch_admin', 'branch_coordinator'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }); return;
    }
    const leader = await assignBranchLeader(req.tenantId!, req.params.id as string, userId, role);
    res.status(201).json({ data: leader });
  } catch (err: any) {
    if (err.message === 'Branch not found' || err.message === 'User not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE /api/branches/leaders/:leaderId — Remove leader
router.delete('/leaders/:leaderId', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeBranchLeader(req.tenantId!, req.params.leaderId as string);
    res.json({ message: 'Branch leader removed successfully' });
  } catch (err: any) {
    if (err.message === 'Branch leader assignment not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ═══════════════════════════════════════════════════════════
// BRANCH-SCOPED DATA (authenticated)
// ═══════════════════════════════════════════════════════════

// GET /api/branches/:id/members — Branch members
router.get('/:id/members', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await getBranchMembers(req.tenantId!, req.params.id as string);
    res.json({ data: members });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/branches/:id/analytics — Branch analytics
router.get('/:id/analytics', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await getBranchAnalytics(req.tenantId!, req.params.id as string);
    res.json({ data: analytics });
  } catch (err: any) {
    if (err.message === 'Branch not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
