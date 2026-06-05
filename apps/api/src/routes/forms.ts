import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as formsService from '../services/forms';

const router = Router();

// ─────────────────────────────────────────────────────────────
// CUSTOM FORM BUILDER CRUD
// ─────────────────────────────────────────────────────────────

// POST /api/forms
router.post('/', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { title, description, fields, confirmationMessage, status } = req.body;
    if (!title || !fields || !Array.isArray(fields)) {
      res.status(400).json({ error: 'title and fields (array) are required' });
      return;
    }

    const form = await formsService.createForm(req.tenantId!, {
      title,
      description,
      fields,
      confirmationMessage,
      status,
    });
    res.status(201).json({ data: form });
  } catch (err: any) {
    console.error('Create form error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/forms
router.get('/', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const forms = await formsService.listForms(req.tenantId!, status as string);
    res.json({ data: forms });
  } catch (err: any) {
    console.error('List forms error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/forms/:id (Public - for filling out forms)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const form = await formsService.getForm(req.tenantId!, id as string);
    res.json({ data: form });
  } catch (err: any) {
    console.error('Get form error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC SUBMISSIONS & LEAD CAPTURE
// ─────────────────────────────────────────────────────────────

// POST /api/forms/:id/submit (Public - for visitor/member inputs)
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { memberId, answers, fileUrl } = req.body;
    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ error: 'answers object is required' });
      return;
    }

    const submission = await formsService.submitForm(req.tenantId!, id as string, {
      memberId,
      answers,
      fileUrl,
    });
    res.status(201).json({ data: submission });
  } catch (err: any) {
    console.error('Submit form error:', err);
    const msg = err.message || '';
    if (msg.includes('required')) {
      res.status(400).json({ error: msg });
    } else if (msg.includes('not found')) {
      res.status(404).json({ error: msg });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// SUBMISSION RETRIEVALS, APPROVALS & WORKFLOWS
// ─────────────────────────────────────────────────────────────

// GET /api/forms/:id/submissions
router.get('/:id/submissions', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.query;

    const list = await formsService.listFormSubmissions(req.tenantId!, id as string, {
      approvalStatus: approvalStatus as string,
    });
    res.json({ data: list });
  } catch (err: any) {
    console.error('List submissions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/forms/submissions/:submissionId/approve
router.post('/submissions/:submissionId/approve', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { notes } = req.body;

    const result = await formsService.processApproval(req.tenantId!, submissionId as string, req.user!.userId, 'approved', notes);
    res.json({ data: result });
  } catch (err: any) {
    console.error('Approve submission error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/forms/submissions/:submissionId/reject
router.post('/submissions/:submissionId/reject', authMiddleware, requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { notes } = req.body;

    const result = await formsService.processApproval(req.tenantId!, submissionId as string, req.user!.userId, 'rejected', notes);
    res.json({ data: result });
  } catch (err: any) {
    console.error('Reject submission error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// WORKFLOW RULES CONFIG
// ─────────────────────────────────────────────────────────────

// POST /api/forms/:id/triggers
router.post('/:id/triggers', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { triggerType, conditionField, conditionValue } = req.body;
    if (!triggerType) {
      res.status(400).json({ error: 'triggerType is required' });
      return;
    }

    const trigger = await formsService.createWorkflowTrigger(req.tenantId!, id as string, {
      triggerType,
      conditionField,
      conditionValue,
    });
    res.status(201).json({ data: trigger });
  } catch (err: any) {
    console.error('Create trigger error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/forms/triggers/:triggerId/actions
router.post('/triggers/:triggerId/actions', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { triggerId } = req.params;
    const { actionType, target, templateText } = req.body;
    if (!actionType) {
      res.status(400).json({ error: 'actionType is required' });
      return;
    }

    const action = await formsService.addWorkflowAction(req.tenantId!, triggerId as string, {
      actionType,
      target,
      templateText,
    });
    res.status(201).json({ data: action });
  } catch (err: any) {
    console.error('Create action error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// FORM SUBMISSION METRICS REPORT
// ─────────────────────────────────────────────────────────────

// GET /api/forms/:id/report
router.get('/:id/report', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await formsService.getFormReport(req.tenantId!, id as string);
    res.json({ data: report });
  } catch (err: any) {
    console.error('Get form report error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
