import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  createGivingCategory,
  listGivingCategories,
  updateGivingCategory,
  initiateDonation,
  handleDonationSuccess,
  handleDonationFailure,
  createRecurringGiving,
  pauseRecurringGiving,
  resumeRecurringGiving,
  cancelRecurringGiving,
  processRecurringGivings,
} from '../services/giving';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GIVING CATEGORIES (Public & Admin)
// ─────────────────────────────────────────────────────────────

// GET /api/giving/categories - List categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.onlyActive === 'true' || req.query.onlyActive === undefined;
    const categories = await listGivingCategories(req.tenantId!, onlyActive);
    res.json({ data: categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/giving/categories - Create category (Admin Only)
router.post('/categories', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const category = await createGivingCategory(req.tenantId!, req.body);
    res.status(201).json({ data: category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/giving/categories/:id - Update category (Admin Only)
router.patch('/categories/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const category = await updateGivingCategory(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DONATIONS / ONE-TIME GIVING (Public & Admin Webhook)
// ─────────────────────────────────────────────────────────────

// GET /api/giving/donations - List donations (Admin/Staff Only)
router.get('/donations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { tenantId: req.tenantId! },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: donations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/giving/donations - Initiate donation
router.post('/donations', async (req: Request, res: Response) => {
  try {
    const { categoryId, amount, currency, paymentMethod, donorName, donorEmail, churchServiceId, campaignId } = req.body;
    if (!categoryId || !amount) {
      res.status(400).json({ error: 'categoryId and amount are required' });
      return;
    }
    const result = await initiateDonation(req.tenantId!, {
      categoryId,
      amount,
      currency,
      paymentMethod,
      donorName,
      donorEmail,
      churchServiceId,
      campaignId,
    });
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/giving/webhook - Simulate payment gateway webhook for success/failure
router.post('/webhook', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { transactionId, status } = req.body; // status: 'succeeded' | 'failed'
    if (!transactionId || !status) {
      res.status(400).json({ error: 'transactionId and status are required' });
      return;
    }

    let updated;
    if (status === 'succeeded') {
      updated = await handleDonationSuccess(req.tenantId!, transactionId);
    } else if (status === 'failed') {
      updated = await handleDonationFailure(req.tenantId!, transactionId);
    } else {
      res.status(400).json({ error: 'Invalid donation status trigger' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// RECURRING GIVING (Authenticated Users & Admin Process)
// ─────────────────────────────────────────────────────────────

// GET /api/giving/recurring - List recurring schedules
router.get('/recurring', authMiddleware, async (req: Request, res: Response) => {
  try {
    const recurring = await prisma.recurringGiving.findMany({
      where: { tenantId: req.tenantId! },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: recurring });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/giving/recurring - Setup recurring giving
router.post('/recurring', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { categoryId, amount, currency, frequency, donorName, donorEmail } = req.body;
    if (!categoryId || !amount || !frequency || !donorEmail) {
      res.status(400).json({ error: 'categoryId, amount, frequency, and donorEmail are required' });
      return;
    }
    const recurring = await createRecurringGiving(req.tenantId!, {
      categoryId,
      amount,
      currency,
      frequency,
      donorName,
      donorEmail,
    });
    res.status(201).json({ data: recurring });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/giving/recurring/:id/pause - Pause recurring schedule
router.post('/recurring/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await pauseRecurringGiving(req.params.id as string, req.tenantId!);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/giving/recurring/:id/resume - Resume recurring schedule
router.post('/recurring/:id/resume', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await resumeRecurringGiving(req.params.id as string, req.tenantId!);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/giving/recurring/:id/cancel - Cancel recurring schedule
router.post('/recurring/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const updated = await cancelRecurringGiving(req.params.id as string, req.tenantId!);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/giving/recurring/process - Manually process due recurring cycles (Admin Only)
router.post('/recurring/process', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await processRecurringGivings();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
