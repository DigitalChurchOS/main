import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as volunteerService from '../services/volunteer';
import prisma from '../lib/prisma';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PROFILES, DEPARTMENTS & TEAMS
// ─────────────────────────────────────────────────────────────

// POST /api/volunteer/profiles
router.post('/profiles', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { memberId, skills, status, trainingStatus } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const profile = await volunteerService.upsertVolunteerProfile(req.tenantId!, memberId, {
      skills,
      status,
      trainingStatus,
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    console.error('Upsert volunteer profile error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/volunteer/departments
router.post('/departments', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const dept = await volunteerService.createVolunteerDepartment(req.tenantId!, { name, description });
    res.status(201).json({ data: dept });
  } catch (err: any) {
    console.error('Create department error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/volunteer/teams
router.post('/teams', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { departmentId, name, description } = req.body;
    if (!departmentId || !name) {
      res.status(400).json({ error: 'departmentId and name are required' });
      return;
    }

    const team = await volunteerService.createVolunteerTeam(req.tenantId!, departmentId, { name, description });
    res.status(201).json({ data: team });
  } catch (err: any) {
    console.error('Create team error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/volunteer/teams/:teamId/members
router.post('/teams/:teamId/members', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { profileId, role } = req.body;
    if (!profileId) {
      res.status(400).json({ error: 'profileId is required' });
      return;
    }

    const assignment = await volunteerService.assignTeamMember(req.tenantId!, profileId, teamId as string, role);
    res.status(201).json({ data: assignment });
  } catch (err: any) {
    console.error('Assign team member error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// DELETE /api/volunteer/teams/:teamId/members/:profileId
router.delete('/teams/:teamId/members/:profileId', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { teamId, profileId } = req.params;
    await volunteerService.removeTeamMember(req.tenantId!, profileId as string, teamId as string);
    res.json({ message: 'Team member assignment removed successfully' });
  } catch (err: any) {
    console.error('Remove team member error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// AVAILABILITY CALENDAR BLOCKOUT
// ─────────────────────────────────────────────────────────────

// POST /api/volunteer/availability
router.post('/availability', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { profileId, date, reason } = req.body;
    if (!profileId || !date) {
      res.status(400).json({ error: 'profileId and date are required' });
      return;
    }

    // Security Gate: Check if user is checking their own profile, or has member.update
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });

    const isSelf = member && (await prisma.volunteerProfile.findFirst({
      where: { id: profileId, memberId: member.id },
    }));

    const permissions = (req.user as any).permissions || [];
    const isStaff = permissions.includes('member.update');

    if (!isSelf && !isStaff) {
      res.status(403).json({ error: 'Forbidden: Cannot update availability for another volunteer' });
      return;
    }

    const blocked = await volunteerService.blockOutDate(req.tenantId!, profileId, new Date(date), reason);
    res.status(201).json({ data: blocked });
  } catch (err: any) {
    console.error('Block out date error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/volunteer/availability/:profileId
router.get('/availability/:profileId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const list = await volunteerService.listBlockedDates(req.tenantId!, profileId as string);
    res.json({ data: list });
  } catch (err: any) {
    console.error('List blocked dates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// SHIFTS, ROSTERS & SCHEDULE
// ─────────────────────────────────────────────────────────────

// POST /api/volunteer/shifts
router.post('/shifts', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { title, targetType, targetId, startTime, endTime } = req.body;
    if (!title || !targetType || !targetId || !startTime || !endTime) {
      res.status(400).json({ error: 'title, targetType, targetId, startTime, and endTime are required' });
      return;
    }

    const shift = await volunteerService.createShift(req.tenantId!, {
      title,
      targetType,
      targetId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });
    res.status(201).json({ data: shift });
  } catch (err: any) {
    console.error('Create shift error:', err);
    res.status(err.message.includes('precede') ? 400 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/volunteer/shifts/:shiftId/assignments
router.post('/shifts/:shiftId/assignments', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const { profileId, teamId, role, tasks } = req.body;
    if (!profileId || !teamId || !role) {
      res.status(400).json({ error: 'profileId, teamId, and role are required' });
      return;
    }

    const assignment = await volunteerService.assignVolunteerToShift(
      req.tenantId!,
      profileId,
      shiftId as string,
      teamId,
      role,
      tasks
    );
    res.status(201).json({ data: assignment });
  } catch (err: any) {
    console.error('Assign shift volunteer error:', err);
    const msg = err.message || '';
    if (msg.includes('unavailable') || msg.includes('overlapping')) {
      res.status(400).json({ error: msg });
    } else if (msg.includes('not found')) {
      res.status(404).json({ error: msg });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PATCH /api/volunteer/shifts/:shiftId/assignments/:profileId/respond
router.patch('/shifts/:shiftId/assignments/:profileId/respond', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { shiftId, profileId } = req.params;
    const { status } = req.body;
    if (!status || (status !== 'confirmed' && status !== 'declined')) {
      res.status(400).json({ error: 'status must be either "confirmed" or "declined"' });
      return;
    }

    // Security Gate: Check if user is the volunteer themselves, or has member.update
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });

    const isSelf = member && (await prisma.volunteerProfile.findFirst({
      where: { id: profileId as string, memberId: member.id },
    }));

    const permissions = (req.user as any).permissions || [];
    const isStaff = permissions.includes('member.update');

    if (!isSelf && !isStaff) {
      res.status(403).json({ error: 'Forbidden: Cannot respond to another volunteer\'s shift' });
      return;
    }

    const updated = await volunteerService.respondToShift(req.tenantId!, profileId as string, shiftId as string, status);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Respond to shift error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/volunteer/shifts/:shiftId/assignments/:profileId/checkin
router.post('/shifts/:shiftId/assignments/:profileId/checkin', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { shiftId, profileId } = req.params;
    const checkedIn = await volunteerService.checkInVolunteer(req.tenantId!, profileId as string, shiftId as string);
    res.json({ data: checkedIn });
  } catch (err: any) {
    console.error('Check in volunteer error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/volunteer/shifts/:shiftId/noshows
router.post('/shifts/:shiftId/noshows', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const result = await volunteerService.markNoShows(req.tenantId!, shiftId as string);
    res.json({ data: result });
  } catch (err: any) {
    console.error('Mark no shows error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/volunteer/shifts/:shiftId/assignments
router.get('/shifts/:shiftId/assignments', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const list = await volunteerService.listShiftAssignments(req.tenantId!, shiftId as string);
    res.json({ data: list });
  } catch (err: any) {
    console.error('List shift assignments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// TEAM BROADCAST ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────

// POST /api/volunteer/announcements
router.post('/announcements', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { teamId, departmentId, title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const broadcast = await volunteerService.broadcastAnnouncement(req.tenantId!, req.user!.userId, {
      teamId,
      departmentId,
      title,
      content,
    });
    res.status(201).json({ data: broadcast });
  } catch (err: any) {
    console.error('Broadcast announcement error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// WORKFORCE REPORTS & ANALYTICS
// ─────────────────────────────────────────────────────────────

// GET /api/volunteer/reports
router.get('/reports', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const report = await volunteerService.getVolunteerReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    console.error('Get volunteer report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
