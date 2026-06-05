import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { checkSubscriptionLimit } from '../services/billing';
import { dispatchPluginWebhooks } from '../services/plugins';
import {
  searchMembers,
  createMemberNote,
  listMemberNotes,
  createMemberCheckIn,
  listMemberCheckIns,
  upsertMemberTag,
  assignTagToMember,
  removeTagFromMember,
  getMemberFinancialHistory,
} from '../services/members';

const router = Router();

// All member routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// GET /api/members - List members (advanced search & filters)
// ─────────────────────────────────────────────────────────────
router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, tagName, page, limit } = req.query;

    const options = {
      search: search as string,
      status: status as string,
      tagName: tagName as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    };

    const results = await searchMembers(req.tenantId!, options);
    res.json({ data: results.data, count: results.count });
  } catch (err: any) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/members/:id - Get specific member profile
// ─────────────────────────────────────────────────────────────
router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
      include: {
        family: true,
        tagAssignments: { include: { tag: true } },
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    res.json({ data: member });
  } catch (err: any) {
    console.error('Get member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/members - Create a member profile
// ─────────────────────────────────────────────────────────────
router.post('/', requirePermission('member.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      photoUrl,
      gender,
      birthday,
      address,
      emergencyContact,
      membershipStatus,
    } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ error: 'firstName and lastName are required' });
      return;
    }

    // Verify billing limit for members
    const limitCheck = await checkSubscriptionLimit(req.tenantId!, 'active_members', 1);
    if (!limitCheck.allowed) {
      res.status(403).json({ error: limitCheck.reason });
      return;
    }

    const member = await prisma.member.create({
      data: {
        tenantId: req.tenantId!,
        firstName,
        lastName,
        phone: phone || null,
        email: email || null,
        photoUrl: photoUrl || null,
        gender: gender || null,
        birthday: birthday ? new Date(birthday) : null,
        address: address || null,
        emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
        membershipStatus: membershipStatus || 'visitor',
      },
    });

    // Dispatch webhook trigger
    await dispatchPluginWebhooks(req.tenantId!, 'member.created', member);

    res.status(201).json({ data: member });
  } catch (err: any) {
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/members/:id - Update member profile details
// ─────────────────────────────────────────────────────────────
router.patch('/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const {
      firstName,
      lastName,
      phone,
      email,
      photoUrl,
      gender,
      birthday,
      address,
      emergencyContact,
      membershipStatus,
    } = req.body;

    const member = await prisma.member.update({
      where: { id: req.params.id as string },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(gender !== undefined && { gender }),
        ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
        ...(address !== undefined && { address }),
        ...(emergencyContact !== undefined && {
          emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
        }),
        ...(membershipStatus !== undefined && { membershipStatus }),
      },
    });

    res.json({ data: member });
  } catch (err: any) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/members/:id - Purge member profile
// ─────────────────────────────────────────────────────────────
router.delete('/:id', requirePermission('member.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Cascade deletes notes, check-ins, tag assignments in transaction
    await prisma.$transaction([
      prisma.memberNote.deleteMany({ where: { memberId: existing.id } }),
      prisma.memberCheckIn.deleteMany({ where: { memberId: existing.id } }),
      prisma.memberTagAssignment.deleteMany({ where: { memberId: existing.id } }),
      prisma.member.delete({ where: { id: existing.id } }),
    ]);

    res.status(204).send();
  } catch (err: any) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PASTORAL NOTES ROUTES
// ─────────────────────────────────────────────────────────────

router.post('/:id/notes', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await createMemberNote(req.tenantId!, req.params.id as string, req.user!.userId, req.body);
    res.status(201).json({ data: note });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/notes', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const notes = await listMemberNotes(req.tenantId!, req.params.id as string);
    res.json({ data: notes });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// CHRONOLOGICAL CHECK-INS ROUTES
// ─────────────────────────────────────────────────────────────

router.post('/:id/checkins', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIn = await createMemberCheckIn(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: checkIn });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/checkins', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIns = await listMemberCheckIns(req.tenantId!, req.params.id as string);
    res.json({ data: checkIns });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// CUSTOM MEMBER TAGS ROUTES
// ─────────────────────────────────────────────────────────────

router.post('/tags', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const tag = await upsertMemberTag(req.tenantId!, name);
    res.status(201).json({ data: tag });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/tags/:tagId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await assignTagToMember(req.tenantId!, req.params.id as string, req.params.tagId as string);
    res.status(201).json({ data: assignment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/tags/:tagId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeTagFromMember(req.tenantId!, req.params.id as string, req.params.tagId as string);
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// CROSS-MODULE FINANCIAL INTEGRATION ROUTE
// ─────────────────────────────────────────────────────────────

router.get('/:id/finance', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (!member.email) {
      res.status(400).json({ error: 'Member profile does not contain an email address' });
      return;
    }

    const history = await getMemberFinancialHistory(req.tenantId!, member.email);
    res.json({ data: history });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
