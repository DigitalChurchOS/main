import { Router, Request, Response } from 'express';

const router = Router();

function trackingId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

router.post('/:slug/submit', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const { answers, surfaceKey, surfaceTitle, moduleKey, metadata } = req.body || {};

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    res.status(400).json({ error: 'answers object is required' });
    return;
  }

  res.status(201).json({
    data: {
      id: trackingId('surf'),
      tenantId: req.tenantId,
      slug,
      surfaceKey,
      surfaceTitle,
      moduleKey,
      metadata,
      status: 'accepted',
      receivedAt: new Date().toISOString(),
    },
  });
});

router.post('/:slug/action', async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  res.json({
    data: {
      id: trackingId('act'),
      tenantId: req.tenantId,
      slug,
      action: req.body?.action || 'inspect',
      status: 'handled',
      receivedAt: new Date().toISOString(),
    },
  });
});

export default router;
