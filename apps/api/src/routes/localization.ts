import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  registerLanguage,
  registerTranslationKeys,
  getTranslations,
  updateUserLanguagePreference,
  createTranslationJob,
  runTranslationJob,
  getTranslationJob,
  listTranslationJobs,
  approveTranslationJob,
  createOrUpdateTranslation,
  getTranslation,
  getTranslationBySlug,
  listTranslationsForEntity,
  addLiveTranslationFeed,
  listLiveTranslationFeeds,
  addMediaCaption,
  listMediaCaptions,
} from '../services/localization';

const router = Router();

// All localization & translation routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// CORE LANGUAGE REGISTRY & TRANSLATIONS
// ─────────────────────────────────────────────────────────────

// GET /api/localization/languages — List all active languages
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const list = await prisma.languageRegistry.findMany({
      where: { isActive: true },
    });
    res.json({ data: list });
  } catch (err: any) {
    console.error('List languages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/localization/languages — Add/Register a new language registry
router.post('/languages', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { id, name, direction } = req.body;

    if (!id || !name) {
      res.status(400).json({ error: 'id and name are required' });
      return;
    }

    const language = await registerLanguage(id, name, direction);
    res.status(201).json({ data: language });
  } catch (err: any) {
    console.error('Register language error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/localization/translations — Fetch translations resolved for specified locale and namespaces
router.get('/translations', async (req: Request, res: Response) => {
  try {
    let locale: string;
    if (req.query.locale && typeof req.query.locale === 'string') {
      locale = req.query.locale.trim().toLowerCase();
    } else if (req.user?.preferredLanguage && req.user.preferredLanguage !== 'en') {
      locale = req.user.preferredLanguage;
    } else {
      locale = req.locale || 'en';
    }
    const namespacesQuery = req.query.namespaces as string | undefined;

    const namespaces = namespacesQuery
      ? namespacesQuery.split(',').map((ns) => ns.trim())
      : ['core'];

    const translations = await getTranslations(locale, namespaces);
    res.json({ data: translations });
  } catch (err: any) {
    console.error('Get translations error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/localization/translations — Upload translation key-value mappings
router.post('/translations', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { locale, namespace, keys } = req.body;

    if (!locale || !namespace || !keys) {
      res.status(400).json({ error: 'locale, namespace, and keys are required' });
      return;
    }

    await registerTranslationKeys(locale, namespace, keys);
    res.json({ success: true, message: 'Translation keys registered successfully' });
  } catch (err: any) {
    console.error('Register translation keys error:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/localization/user/preferred-language — Update user language preference profile setting
router.put('/user/preferred-language', async (req: Request, res: Response) => {
  try {
    const { preferredLanguage } = req.body;
    const userId = req.user!.userId;

    if (!preferredLanguage) {
      res.status(400).json({ error: 'preferredLanguage is required' });
      return;
    }

    const updated = await updateUserLanguagePreference(userId, preferredLanguage);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Update preferred language error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AI TRANSLATION WORKFLOWS (tenant.settings for writes)
// ─────────────────────────────────────────────────────────────

// GET /api/localization/jobs — List all translation jobs for the tenant
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await listTranslationJobs(req.tenantId!);
    res.json({ data: jobs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/localization/jobs — Trigger AI content translation job
router.post('/jobs', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId, targetLanguage } = req.body;
    if (!entityType || !entityId || !targetLanguage) {
      res.status(400).json({ error: 'entityType, entityId, and targetLanguage are required' });
      return;
    }

    const job = await createTranslationJob(req.tenantId!, {
      entityType,
      entityId,
      targetLanguage,
    });

    const processed = await runTranslationJob(req.tenantId!, job.id);
    res.status(201).json({ data: processed });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/localization/jobs/:id — Get job status
router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await getTranslationJob(req.tenantId!, req.params.id as string);
    res.json({ data: job });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/localization/jobs/:id/approve — Approve translation draft
router.post('/jobs/:id/approve', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await approveTranslationJob(req.tenantId!, req.params.id as string);
    res.json({ data: content });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// MULTILINGUAL PUBLISHING & MANUAL TRANSLATIONS
// ─────────────────────────────────────────────────────────────

// POST /api/localization/contents — Create/update translation manually
router.post('/contents', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId, locale, slug, title, content } = req.body;
    if (!entityType || !entityId || !locale || !slug || !title || !content) {
      res.status(400).json({ error: 'entityType, entityId, locale, slug, title, and content are required' });
      return;
    }

    const translation = await createOrUpdateTranslation(req.tenantId!, req.body);
    res.json({ data: translation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/localization/contents/:entityType/:entityId/:locale — Get translation for an entity
router.get('/contents/:entityType/:entityId/:locale', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId, locale } = req.params;
    const translation = await getTranslation(
      req.tenantId!,
      entityType as string,
      entityId as string,
      locale as string
    );
    res.json({ data: translation });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/localization/contents/:entityType/:entityId — List all translations for an entity
router.get('/contents/:entityType/:entityId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, entityId } = req.params;
    const list = await listTranslationsForEntity(
      req.tenantId!,
      entityType as string,
      entityId as string
    );
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/localization/contents/:entityType/slug/:locale/:slug — Get content by localized slug
router.get('/contents/:entityType/slug/:locale/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, locale, slug } = req.params;
    const translation = await getTranslationBySlug(
      req.tenantId!,
      entityType as string,
      locale as string,
      slug as string
    );
    res.json({ data: translation });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// LIVESTREAM INTERPRETATION FEEDS
// ─────────────────────────────────────────────────────────────

// POST /api/localization/livestreams/:livestreamId/feeds — Add feed
router.post('/livestreams/:livestreamId/feeds', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { locale, audioUrl, label, isActive } = req.body;
    if (!locale || !audioUrl || !label) {
      res.status(400).json({ error: 'locale, audioUrl, and label are required' });
      return;
    }

    const feed = await addLiveTranslationFeed(req.tenantId!, {
      livestreamId: req.params.livestreamId as string,
      locale,
      audioUrl,
      label,
      isActive,
    });
    res.status(201).json({ data: feed });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/localization/livestreams/:livestreamId/feeds — List feeds
router.get('/livestreams/:livestreamId/feeds', async (req: Request, res: Response): Promise<void> => {
  try {
    const feeds = await listLiveTranslationFeeds(req.tenantId!, req.params.livestreamId as string);
    res.json({ data: feeds });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// MEDIA CAPTIONS & SUBTITLES
// ─────────────────────────────────────────────────────────────

// POST /api/localization/media/:mediaAssetId/captions — Add caption
router.post('/media/:mediaAssetId/captions', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { locale, fileUrl, content } = req.body;
    if (!locale || !fileUrl || !content) {
      res.status(400).json({ error: 'locale, fileUrl, and content are required' });
      return;
    }

    const caption = await addMediaCaption(req.tenantId!, {
      mediaAssetId: req.params.mediaAssetId as string,
      locale,
      fileUrl,
      content,
    });
    res.status(201).json({ data: caption });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/localization/media/:mediaAssetId/captions — List captions
router.get('/media/:mediaAssetId/captions', async (req: Request, res: Response): Promise<void> => {
  try {
    const captions = await listMediaCaptions(req.tenantId!, req.params.mediaAssetId as string);
    res.json({ data: captions });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOGS (aggregated from translation jobs)
// ─────────────────────────────────────────────────────────────

// GET /api/localization/activity-logs — List recent localization activity
router.get('/activity-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    // Aggregate recent translation job activities as audit log entries
    const jobs = await prisma.translationJob.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const logs = jobs.map((job: any) => ({
      actionType: `ai_translate_${job.status}`,
      metadataJson: JSON.stringify({
        summary: `AI translation job for ${job.entityType} (${job.entityId}) → ${job.targetLanguage}: ${job.status}`,
        entityType: job.entityType,
        entityId: job.entityId,
        targetLanguage: job.targetLanguage,
      }),
      createdAt: job.createdAt.toISOString(),
    }));

    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/localization/jobs/:id/retry — Retry a failed or pending job
router.post('/jobs/:id/retry', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await getTranslationJob(req.tenantId!, req.params.id as string);
    const processed = await runTranslationJob(req.tenantId!, job.id);
    res.json({ data: processed });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
