import { Router, Request, Response } from 'express';
import { requireModule } from '../middleware/entitlements';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createFunnel,
  getFunnel,
  listFunnels,
  updateFunnel,
  deleteFunnel,
  addFunnelStep,
  updateFunnelStep,
  recordView,
  submitStepResponse,
  getFunnelAnalytics,
} from '../services/funnels';

const router = Router();

// ─────────────────────────────────────────────────────────────
// AUTOMATIC QR CODE UTILITIES
// ─────────────────────────────────────────────────────────────

function enrichFunnel(funnel: any): any {
  if (!funnel) return funnel;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://churchos.io/funnels/${funnel.slug}`;
  
  const steps = funnel.steps ? funnel.steps.map((step: any) => ({
    ...step,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://churchos.io/funnels/${funnel.slug}/steps/${step.slug}`
  })) : [];

  return {
    ...funnel,
    qrCodeUrl,
    steps
  };
}

function enrichStep(step: any, funnelSlug: string): any {
  if (!step) return step;
  return {
    ...step,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://churchos.io/funnels/${funnelSlug}/steps/${step.slug}`
  };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (No Auth required, locked by Module subscription only)
// ─────────────────────────────────────────────────────────────

// GET /api/funnels/:id - Get funnel details by ID or slug (public rendering)
router.get('/:id', requireModule('ministry-funnels'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const funnel = await getFunnel(req.tenantId!, id);
    res.json({ data: enrichFunnel(funnel) });
  } catch (err: any) {
    if (err.message === 'Funnel not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// POST /api/funnels/:funnelId/steps/:stepId/view - Record a page traffic view
router.post('/:funnelId/steps/:stepId/view', requireModule('ministry-funnels'), async (req: Request, res: Response): Promise<void> => {
  try {
    const funnelId = req.params.funnelId as string;
    const stepId = req.params.stepId as string;
    const { dateStr } = req.body;
    await recordView(req.tenantId!, funnelId, stepId, dateStr);
    res.json({ success: true, message: 'View recorded' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/funnels/:funnelId/steps/:stepId/submit - Capture lead submission response
router.post('/:funnelId/steps/:stepId/submit', requireModule('ministry-funnels'), async (req: Request, res: Response): Promise<void> => {
  try {
    const funnelId = req.params.funnelId as string;
    const stepId = req.params.stepId as string;
    const { firstName, lastName, email, phone, submittedData, ipAddress, userAgent, dateStr } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ error: 'firstName, lastName, and email are required fields' });
      return;
    }

    const submission = await submitStepResponse(req.tenantId!, funnelId, stepId, {
      firstName,
      lastName,
      email,
      phone,
      submittedData: submittedData || {},
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.headers['user-agent'],
      dateStr,
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Requires authenticated session & module entitlement checks)
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(requireModule('ministry-funnels'));

// GET /api/funnels - List all funnels (staff auth)
router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, type } = req.query;
    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
    const funnels = await listFunnels(req.tenantId!, {
      isActive: activeFilter,
      type: type as string,
    });
    res.json({ data: funnels.map(enrichFunnel) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/funnels - Define/create a new funnel (Admin Only)
router.post('/', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, type, steps } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: 'name and slug are required' });
      return;
    }

    const funnel = await createFunnel(req.tenantId!, {
      name,
      slug,
      description,
      type,
      steps,
    });
    res.status(201).json({ data: enrichFunnel(funnel) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/funnels/:id - Update funnel general parameters (Admin Only)
router.patch('/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const funnel = await updateFunnel(req.tenantId!, id, req.body);
    res.json({ data: enrichFunnel(funnel) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/funnels/:id - Delete a funnel registry (Admin Only)
router.delete('/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await deleteFunnel(req.tenantId!, id);
    res.json({ success: true, message: 'Funnel deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/funnels/:funnelId/steps - Append/add a step (Admin Only)
router.post('/:funnelId/steps', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const funnelId = req.params.funnelId as string;
    const funnel = await getFunnel(req.tenantId!, funnelId);
    const step = await addFunnelStep(req.tenantId!, funnelId, req.body);
    res.status(201).json({ data: enrichStep(step, funnel.slug) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/funnels/:funnelId/steps/:stepId - Update step parameters (Admin Only)
router.patch('/:funnelId/steps/:stepId', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const funnelId = req.params.funnelId as string;
    const stepId = req.params.stepId as string;
    const funnel = await getFunnel(req.tenantId!, funnelId);
    const step = await updateFunnelStep(req.tenantId!, funnelId, stepId, req.body);
    res.json({ data: enrichStep(step, funnel.slug) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/funnels/:id/analytics - View conversion drop-off performance statistics (Admin Only)
router.get('/:id/analytics', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const stats = await getFunnelAnalytics(req.tenantId!, id);
    res.json({ data: stats });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
