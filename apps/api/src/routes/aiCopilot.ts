import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createAiCopilotJob,
  runAiCopilotJob,
  getAiCopilotJob,
  listAiCopilotJobs,
} from '../services/aiCopilot';

const router = Router();

// Require authenticated user context for all copilot calls
router.use(authMiddleware);

// POST /api/ai-copilot/jobs — Create and trigger an AI Assistant copilot job
router.post('/jobs', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptType, inputPrompt, audience, durationWeeks, numQuestions, question, tone } = req.body;

    if (!promptType) {
      res.status(400).json({ error: 'promptType is required' });
      return;
    }
    if (!inputPrompt) {
      res.status(400).json({ error: 'inputPrompt is required' });
      return;
    }

    // 1. Persist pending job
    const job = await createAiCopilotJob(req.tenantId!, {
      promptType,
      inputPrompt,
    });

    // 2. Execute generation job synchronously
    const processed = await runAiCopilotJob(req.tenantId!, job.id, {
      audience,
      durationWeeks: durationWeeks ? parseInt(durationWeeks, 10) : undefined,
      numQuestions: numQuestions ? parseInt(numQuestions, 10) : undefined,
      question,
      tone,
    });

    res.status(201).json({ data: processed });
  } catch (err: any) {
    console.error('Trigger AI Copilot job error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/ai-copilot/jobs — List AI Assistant copilot jobs
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const promptType = req.query.promptType as string | undefined;

    const list = await listAiCopilotJobs(req.tenantId!, { status, promptType });
    res.json({ data: list });
  } catch (err: any) {
    console.error('List AI Copilot jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ai-copilot/jobs/:id — Retrieve specific AI Assistant copilot job results
router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await getAiCopilotJob(req.tenantId!, req.params.id as string);
    res.json({ data: job });
  } catch (err: any) {
    console.error('Get AI Copilot job error:', err);
    res.status(404).json({ error: err.message });
  }
});

export default router;
