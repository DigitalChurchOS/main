import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createAppointmentType,
  getAppointmentType,
  listAppointmentTypes,
  updateAppointmentType,
  deleteAppointmentType,
  setStaffAvailability,
  getStaffAvailabilities,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  updatePrivateNotes,
  getAppointmentDetails,
  createAppointmentReminder,
  triggerAppointmentReminder,
  getBookingReport,
} from '../services/bookings';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const router = Router();

// Helper to check token for public endpoints without blocking requests
async function getRequesterInfo(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isSystemAdmin: false, memberId: null };
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; tenantId: string };
    
    // Fetch permissions
    const userRoles = await prisma.userRole.findMany({
      where: { userId: payload.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    const permissions = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );
    const isSystemAdmin = permissions.includes('tenant.settings');

    const member = await prisma.member.findFirst({
      where: { userId: payload.userId, tenantId: payload.tenantId },
    });

    return {
      isSystemAdmin,
      memberId: member?.id || null,
    };
  } catch {
    return { isSystemAdmin: false, memberId: null };
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/bookings (Public booking intake form)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await bookAppointment(req.tenantId!, req.body);
    res.status(201).json({ data: appointment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/bookings/:id/reschedule (Public / Staff rescheduling)
router.post('/:id/reschedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { isSystemAdmin, memberId } = await getRequesterInfo(req);
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });
    
    const requestedByAdminOrHost = isSystemAdmin || (memberId && appointment && appointment.hostMemberId === memberId);
    
    const result = await rescheduleAppointment(
      req.tenantId!,
      req.params.id as string,
      req.body.startAt,
      !!requestedByAdminOrHost
    );
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/bookings/:id/cancel (Public / Staff cancellation)
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { isSystemAdmin, memberId } = await getRequesterInfo(req);
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    const requestedByAdminOrHost = isSystemAdmin || (memberId && appointment && appointment.hostMemberId === memberId);

    const result = await cancelAppointment(
      req.tenantId!,
      req.params.id as string,
      !!requestedByAdminOrHost
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

// GET /api/bookings/types (member.read)
router.get('/types', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await listAppointmentTypes(req.tenantId!, req.query.activeOnly === 'true');
    res.json({ data: types });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/types (tenant.settings)
router.post('/types', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await createAppointmentType(req.tenantId!, req.body);
    res.status(201).json({ data: type });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/bookings/types/:id (tenant.settings)
router.patch('/types/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await updateAppointmentType(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: type });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/bookings/types/:id (tenant.settings)
router.delete('/types/:id', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteAppointmentType(req.tenantId!, req.params.id as string);
    res.json({ message: 'Appointment type deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/bookings/availabilities/:memberId (member.update)
router.post('/availabilities/:memberId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await setStaffAvailability(req.tenantId!, req.params.memberId as string, req.body.availabilities);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookings/availabilities/:memberId (member.read)
router.get('/availabilities/:memberId', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getStaffAvailabilities(req.tenantId!, req.params.memberId as string);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookings/:id (member.read)
router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterUserId = req.user!.userId;
    const isSystemAdmin = req.user!.permissions.includes('tenant.settings');

    const member = await prisma.member.findFirst({
      where: { userId: requesterUserId, tenantId: req.tenantId! },
    });

    const appointment = await getAppointmentDetails(
      req.tenantId!,
      req.params.id as string,
      member?.id,
      isSystemAdmin
    );
    res.json({ data: appointment });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/notes (member.update)
router.patch('/:id/notes', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterUserId = req.user!.userId;
    const isSystemAdmin = req.user!.permissions.includes('tenant.settings');

    const member = await prisma.member.findFirst({
      where: { userId: requesterUserId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(403).json({ error: 'Member profile not found for user' });
      return;
    }

    const { notes } = req.body;
    const result = await updatePrivateNotes(
      req.tenantId!,
      req.params.id as string,
      member.id,
      isSystemAdmin,
      notes
    );
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/bookings/:id/reminders (tenant.settings)
router.post('/:id/reminders', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { sendBeforeHours } = req.body;
    const reminder = await createAppointmentReminder(req.tenantId!, {
      appointmentId: req.params.id as string,
      sendBeforeHours: Number(sendBeforeHours),
    });
    res.status(201).json({ data: reminder });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/bookings/reminders/:id/trigger (tenant.settings)
router.post('/reminders/:id/trigger', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await triggerAppointmentReminder(req.tenantId!, req.params.id as string);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookings/reports/summary (tenant.settings)
router.get('/reports/summary', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getBookingReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
