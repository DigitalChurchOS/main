import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  createEventCategory,
  listEventCategories,
  createEvent,
  getEvent,
  listEvents,
  registerForEvent,
  handlePaymentSuccess,
  verifyTicketCheckIn,
  submitRsvp,
  scheduleEventReminder,
  triggerReminder,
} from '../services/events';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/events/:id/register (Public registration endpoint)
router.post('/:id/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id as string;
    const { memberId, firstName, lastName, email, phone, customResponsesJson } = req.body;

    const result = await registerForEvent(req.tenantId!, {
      eventId,
      memberId,
      firstName,
      lastName,
      email,
      phone,
      customResponsesJson,
    });

    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/events/registrations/:id/payment-webhook (Stripe webhook simulation)
router.post('/registrations/:id/payment-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const registrationId = req.params.id as string;
    const { paymentIntentId, simulated } = req.body; // simulated can also come from query

    const finalSimulated = simulated || req.query.simulated;
    if (finalSimulated === 'failure') {
      res.status(400).json({ error: 'Simulated payment failure' });
      return;
    }

    const result = await handlePaymentSuccess(
      req.tenantId!,
      registrationId,
      paymentIntentId || `sim_${Math.random().toString(36).substring(2, 9)}`
    );

    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// GET /api/events/registrations (member.read)
router.get('/registrations', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.eventRegistration.findMany({
      where: { tenantId: req.tenantId! },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/categories (member.read)
router.get('/categories', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await listEventCategories(req.tenantId!);
    res.json({ data: categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/categories (tenant.settings)
router.post('/categories', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const category = await createEventCategory(req.tenantId!, name);
    res.status(201).json({ data: category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/events (member.read)
router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, status, search } = req.query;
    const events = await listEvents(req.tenantId!, {
      categoryId: categoryId as string || undefined,
      status: status as string || undefined,
      search: search as string || undefined,
    });
    res.json({ data: events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events (member.update)
router.post('/', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await createEvent(req.tenantId!, req.body);
    res.status(201).json({ data: event });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/events/:id (member.read)
router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await getEvent(req.tenantId!, req.params.id as string);
    res.json({ data: event });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// POST /api/events/:id/rsvp (member.update)
router.post('/:id/rsvp', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id as string;
    const { memberId, status } = req.body;
    const rsvp = await submitRsvp(req.tenantId!, eventId, memberId, status);
    res.json({ data: rsvp });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/events/tickets/verify (member.update)
router.post('/tickets/verify', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrCodeToken } = req.body;
    const result = await verifyTicketCheckIn(req.tenantId!, qrCodeToken);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/events/:id/reminders (tenant.settings)
router.post('/:id/reminders', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = req.params.id as string;
    const { sendBeforeHours } = req.body;
    const reminder = await scheduleEventReminder(req.tenantId!, eventId, Number(sendBeforeHours));
    res.status(201).json({ data: reminder });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/events/reminders/:id/trigger (tenant.settings)
router.post('/reminders/:id/trigger', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const reminderId = req.params.id as string;
    const result = await triggerReminder(req.tenantId!, reminderId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
