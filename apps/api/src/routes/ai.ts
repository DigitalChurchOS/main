import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { createAiJob, runAiJob, getAiJob, listAiJobs, createManualClip } from '../services/ai';

const router = Router();

router.use(authMiddleware);

// POST /api/ai/jobs — Create and trigger an AI job
router.post('/jobs', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { mediaAssetId, jobType, targetLang, transcript, numClips, duration, prompt } = req.body;
    if (!jobType) {
      res.status(400).json({ error: 'jobType is required' });
      return;
    }

    if (jobType === 'clips' && duration !== undefined) {
      const parsedDuration = typeof duration === 'number' ? duration : parseInt(duration, 10);
      if (![30, 45, 60, 90].includes(parsedDuration)) {
        res.status(400).json({ error: 'AI clip duration option must be 30, 45, 60, or 90 seconds' });
        return;
      }
    }

    // 1. Create job entry in database
    const job = await createAiJob(req.tenantId!, {
      mediaAssetId,
      jobType,
      targetLang,
      transcript,
    });

    // 2. Trigger job execution synchronously, passing options for clip suggestion custom configuration
    const processedJob = await runAiJob(job.id, req.tenantId!, {
      numClips: numClips ? parseInt(numClips, 10) : undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
      prompt,
    });

    res.status(201).json({ data: processedJob });
  } catch (err: any) {
    console.error('Trigger AI job error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/ai/clips/manual — Manually select and register a 30, 60, or 120 second clip
router.post('/clips/manual', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { parentAssetId, title, clipStartSeconds, clipEndSeconds } = req.body;
    if (!parentAssetId || clipStartSeconds === undefined || clipEndSeconds === undefined) {
      res.status(400).json({ error: 'parentAssetId, clipStartSeconds, and clipEndSeconds are required' });
      return;
    }

    const clip = await createManualClip(req.tenantId!, {
      parentAssetId,
      title,
      clipStartSeconds: parseInt(clipStartSeconds, 10),
      clipEndSeconds: parseInt(clipEndSeconds, 10),
    });

    res.status(201).json({ data: clip });
  } catch (err: any) {
    console.error('Manual clip selection error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/ai/jobs — List AI jobs
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const mediaAssetId = req.query.mediaAssetId as string | undefined;

    const jobs = await listAiJobs(req.tenantId!, { status, mediaAssetId });
    res.json({ data: jobs });
  } catch (err: any) {
    console.error('List AI jobs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ai/jobs/:id — Retrieve specific AI job details/results
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const job = await getAiJob(id, req.tenantId!);
    res.json({ data: job });
  } catch (err: any) {
    console.error('Get AI job error:', err);
    res.status(404).json({ error: err.message });
  }
});

export default router;
