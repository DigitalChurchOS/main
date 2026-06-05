import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createPartnershipCategory,
  listPartnershipCategories,
  updatePartnershipCategory,
  initiatePartnership,
  handlePartnershipSuccess,
  handlePartnershipFailure,
  createRecurringPartnership,
  pauseRecurringPartnership,
  resumeRecurringPartnership,
  cancelRecurringPartnership,
  processRecurringPartnerships,
} from '../services/partnerships';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PARTNERSHIP CATEGORIES (Public & Admin)
// ─────────────────────────────────────────────────────────────

// GET /api/partnerships/categories - List categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.onlyActive === 'true' || req.query.onlyActive === undefined;
    const categories = await listPartnershipCategories(req.tenantId!, onlyActive);
    res.json({ data: categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/partnerships/categories - Create category (Admin Only)
router.post('/categories', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const category = await createPartnershipCategory(req.tenantId!, req.body);
    res.status(201).json({ data: category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/partnerships/categories/:id - Update category (Admin Only)
router.patch('/categories/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const category = await updatePartnershipCategory(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PARTNERSHIPS / ONE-TIME FLOW (Public & Webhook Admin)
// ─────────────────────────────────────────────────────────────

// POST /api/partnerships/checkout - Initiate partnership checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { categoryId, amount, currency, partnerName, partnerEmail, campaignId } = req.body;
    if (!categoryId || !amount) {
      res.status(400).json({ error: 'categoryId and amount are required' });
      return;
    }
    const result = await initiatePartnership(req.tenantId!, {
      categoryId,
      amount,
      currency,
      partnerName,
      partnerEmail,
      campaignId,
    });
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/partnerships/webhook - Simulate webhook transition (Admin Only)
router.post('/webhook', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { transactionId, status } = req.body; // status: 'succeeded' | 'failed'
    if (!transactionId || !status) {
      res.status(400).json({ error: 'transactionId and status are required' });
      return;
    }

    let updated;
    if (status === 'succeeded') {
      updated = await handlePartnershipSuccess(req.tenantId!, transactionId);
    } else if (status === 'failed') {
      updated = await handlePartnershipFailure(req.tenantId!, transactionId);
    } else {
      res.status(400).json({ error: 'Invalid partnership status trigger' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// RECURRING PARTNERSHIPS (Authenticated & Process Admin)
// ─────────────────────────────────────────────────────────────

// POST /api/partnerships/recurring - Setup recurring partnership
router.post('/recurring', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { categoryId, amount, currency, frequency, partnerName, partnerEmail } = req.body;
    if (!categoryId || !amount || !frequency || !partnerEmail) {
      res.status(400).json({ error: 'categoryId, amount, frequency, and partnerEmail are required' });
      return;
    }
    const recurring = await createRecurringPartnership(req.tenantId!, {
      categoryId,
      amount,
      currency,
      frequency,
      partnerName,
      partnerEmail,
    });
    res.status(201).json({ data: recurring });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/partnerships/recurring/:id/pause - Pause recurring schedule
router.post('/recurring/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await pauseRecurringPartnership(req.params.id as string, req.tenantId!);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/partnerships/recurring/:id/resume - Resume recurring schedule
router.post('/recurring/:id/resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await resumeRecurringPartnership(req.params.id as string, req.tenantId!);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/partnerships/recurring/:id/cancel - Cancel recurring schedule
router.post('/recurring/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await cancelRecurringPartnership(req.params.id as string, req.tenantId!);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/partnerships/recurring/process - Batch process recurring draws (Admin Only)
router.post('/recurring/process', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await processRecurringPartnerships();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
