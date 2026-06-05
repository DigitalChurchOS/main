import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createChildProfile,
  getChildProfile,
  listChildProfiles,
  addChildGuardian,
  addPickupAuthorization,
  revokePickupAuthorization,
  createChildrenClass,
  enrollChildInClass,
  listChildrenClasses,
  uploadClassResource,
  getClassResources,
  checkInChild,
  checkOutChild,
  notifyParent,
  getFamilyMinistryReport
} from '../services/children';

const router = Router();

// Apply auth to all Children routes
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// 1. CHILD PROFILE MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.post('/', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await createChildProfile(req.tenantId!, req.body);
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const classId = req.query.classId as string | undefined;
    const list = await listChildProfiles(req.tenantId!, { search, classId });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getChildProfile(req.tenantId!, req.params.id as string);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. GUARDIANS & PICKUP AUTHORIZATIONS
// ─────────────────────────────────────────────────────────────

router.post('/:id/guardians', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const guardian = await addChildGuardian(req.tenantId!, {
      childProfileId: req.params.id as string,
      ...req.body
    });
    res.status(201).json({ data: guardian });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/pickups', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const pickup = await addPickupAuthorization(req.tenantId!, {
      childProfileId: req.params.id as string,
      ...req.body
    });
    res.status(201).json({ data: pickup });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/pickups/:authId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await revokePickupAuthorization(req.tenantId!, req.params.authId as string);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. CLASSROOMS & CURRICULUM
// ─────────────────────────────────────────────────────────────

router.post('/classes', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const classroom = await createChildrenClass(req.tenantId!, req.body);
    res.status(201).json({ data: classroom });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/classes', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const classes = await listChildrenClasses(req.tenantId!);
    res.json({ data: classes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/classes/:classId/enroll', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { childProfileId } = req.body;
    if (!childProfileId) {
      res.status(400).json({ error: 'childProfileId is required' });
      return;
    }

    const enrollment = await enrollChildInClass(req.tenantId!, childProfileId, req.params.classId as string);
    res.status(201).json({ data: enrollment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/classes/:classId/resources', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const resource = await uploadClassResource(req.tenantId!, {
      classId: req.params.classId as string,
      ...req.body
    });
    res.status(201).json({ data: resource });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/classes/:classId/resources', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const resources = await getClassResources(req.tenantId!, req.params.classId as string);
    res.json({ data: resources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. SECURE CHECK-IN / CHECK-OUT & ALERTS
// ─────────────────────────────────────────────────────────────

router.post('/check-ins', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { childProfileId, classId, checkedInByMemberId, notes } = req.body;
    if (!childProfileId || !classId || !checkedInByMemberId) {
      res.status(400).json({ error: 'childProfileId, classId, and checkedInByMemberId are required' });
      return;
    }

    const checkIn = await checkInChild(req.tenantId!, childProfileId, classId, checkedInByMemberId, notes);
    res.status(201).json({ data: checkIn });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/check-ins/:id/checkout', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkingOutAdultId, securityCode } = req.body;
    if (!checkingOutAdultId || !securityCode) {
      res.status(400).json({ error: 'checkingOutAdultId and securityCode are required' });
      return;
    }

    const checkOut = await checkOutChild(req.tenantId!, req.params.id as string, checkingOutAdultId, securityCode);
    res.json({ data: checkOut });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/check-ins/:id/notify', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const result = await notifyParent(req.tenantId!, req.params.id as string, message);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. REPORTING
// ─────────────────────────────────────────────────────────────

router.get('/reports/growth', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getFamilyMinistryReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
