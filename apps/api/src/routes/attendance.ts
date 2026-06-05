import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as attendanceService from '../services/attendance';

const router = Router();

// ─────────────────────────────────────────────────────────────
// QR CODE GENERATION & VALIDATION
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/qr-token/:memberId
router.get('/qr-token/:memberId', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const token = await attendanceService.generateCheckInToken(req.tenantId!, memberId as string);
    res.json({ data: { token } });
  } catch (err: any) {
    console.error('Generate QR token error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/attendance/qr-checkin
router.post('/qr-checkin', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { token, type, targetId, kioskId } = req.body;
    if (!token || !type || !targetId) {
      res.status(400).json({ error: 'token, type, and targetId are required' });
      return;
    }

    const checkIn = await attendanceService.qrCheckIn(req.tenantId!, token, { type, targetId, kioskId });
    res.status(201).json({ data: checkIn });
  } catch (err: any) {
    console.error('QR check-in error:', err);
    const msg = err.message || '';
    if (msg.includes('not found') || msg.includes('belongs to a different tenant')) {
      res.status(404).json({ error: err.message });
    } else if (msg.includes('expired') || msg.includes('format')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// MANUAL ADMINISTRATIVE CHECK-IN
// ─────────────────────────────────────────────────────────────

// POST /api/attendance/checkin
router.post('/checkin', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { memberId, type, targetId, checkedInById, allergies, securityCode } = req.body;
    if (!memberId || !type || !targetId) {
      res.status(400).json({ error: 'memberId, type, and targetId are required' });
      return;
    }

    const checkIn = await attendanceService.manualCheckIn(req.tenantId!, memberId, {
      type,
      targetId,
      checkedInById,
      allergies,
      securityCode,
    });
    res.status(201).json({ data: checkIn });
  } catch (err: any) {
    console.error('Manual check-in error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// MOBILE / FAMILY CHECK-IN
// ─────────────────────────────────────────────────────────────

// POST /api/attendance/family-checkin
router.post('/family-checkin', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { parentId, childIds, type, targetId } = req.body;
    if (!parentId || !childIds || !Array.isArray(childIds) || !type || !targetId) {
      res.status(400).json({ error: 'parentId, childIds (array), type, and targetId are required' });
      return;
    }

    const checkIns = await attendanceService.familyCheckIn(req.tenantId!, parentId, childIds, { type, targetId });
    res.status(201).json({ data: checkIns });
  } catch (err: any) {
    console.error('Family check-in error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ANALYTICS & REPORTS
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/reports
router.get('/reports', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, targetId, startDate, endDate } = req.query;

    const report = await attendanceService.getAttendanceReport(req.tenantId!, {
      type: type as string,
      targetId: targetId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ data: report });
  } catch (err: any) {
    console.error('Get attendance report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ABSENCE TRACKING
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/absences
router.get('/absences', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, weeksLimit } = req.query;

    const absences = await attendanceService.getAbsenceAlerts(req.tenantId!, {
      type: type as string,
      weeksLimit: weeksLimit ? parseInt(weeksLimit as string, 10) : undefined,
    });

    res.json({ data: absences });
  } catch (err: any) {
    console.error('Get absences error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ATTENDANCE EXPORT (CSV)
// ─────────────────────────────────────────────────────────────

// GET /api/attendance/export
router.get('/export', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, targetId, startDate, endDate } = req.query;

    const records = await attendanceService.exportAttendance(req.tenantId!, {
      type: type as string,
      targetId: targetId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    // Generate CSV string
    const headers = 'CheckIn ID,Member ID,First Name,Last Name,Email,Type,Target ID,Checked In At,Security Code,Allergies,Checked In By';
    const rows = records.map(r => {
      const escape = (val: string | null) => {
        if (!val) return '';
        return `"${val.replace(/"/g, '""')}"`;
      };
      return [
        r.checkInId,
        r.memberId,
        escape(r.firstName),
        escape(r.lastName),
        escape(r.email),
        r.type,
        r.targetId,
        r.checkedInAt,
        escape(r.securityCode),
        escape(r.allergies),
        escape(r.checkedInByName),
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error('Export attendance error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
