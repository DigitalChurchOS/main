import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  searchChurches,
  getTenantMobileConfig,
  mobileLogin,
  getMobileContentFeed,
  registerPushToken,
  sendPushNotification,
  generateDeepLink,
  resolveDeepLink,
} from '../services/mobile';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS (No tenant header / JWT required initially)
// ─────────────────────────────────────────────────────────────

// GET /api/mobile/config/search - Directory lookup for church selection
router.get('/config/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string || '';
    const results = await searchChurches(query);
    res.json({ data: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mobile/config/tenant/:subdomain - Load tenant dynamic branding/styles
router.get('/config/tenant/:subdomain', async (req: Request, res: Response): Promise<void> => {
  try {
    const subdomain = req.params.subdomain as string;
    const config = await getTenantMobileConfig(subdomain);
    res.json({ data: config });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/mobile/auth/login - Email or Phone Number login
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Requires x-tenant-id to know which church workspace login scope is targeted
    if (!req.tenantId) {
      res.status(400).json({ error: 'x-tenant-id header is required' });
      return;
    }
    const result = await mobileLogin(req.tenantId, req.body);
    res.status(200).json({ data: result });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// POST /api/mobile/deeplinks/generate - Generate custom deep link schemas
router.post('/deeplinks/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subdomain, path, params } = req.body;
    if (!subdomain || !path) {
      res.status(400).json({ error: 'subdomain and path are required' });
      return;
    }
    const link = generateDeepLink(subdomain, path, params);
    res.json({ data: { link } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/mobile/deeplinks/resolve - Resolve deep link schemas/universal urls
router.get('/deeplinks/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const urlStr = req.query.url as string;
    if (!urlStr) {
      res.status(400).json({ error: 'url parameter is required' });
      return;
    }
    const resolved = resolveDeepLink(urlStr);
    res.json({ data: resolved });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS (Requires valid member session)
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// GET /api/mobile/auth/me - Retrieve current mobile session user & member details
router.get('/auth/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true, preferredLanguage: true },
    });
    const member = await prisma.member.findFirst({
      where: { userId, tenantId: req.tenantId! },
    });
    res.json({ data: { user, member, permissions: req.user!.permissions } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mobile/content/feed - Consolidated content feeds payload
router.get('/content/feed', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const member = await prisma.member.findFirst({
      where: { userId, tenantId: req.tenantId! },
    });
    const feed = await getMobileContentFeed(req.tenantId!, member?.id);
    res.json({ data: feed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mobile/notifications/tokens - Register mobile push notification tokens
router.post('/notifications/tokens', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { token, deviceType } = req.body;
    const result = await registerPushToken(req.tenantId!, userId, token, deviceType);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/mobile/notifications/send - Admin push dispatch tool
router.post('/notifications/send', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, body, data } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const result = await sendPushNotification(req.tenantId!, userId, title, body, data);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
