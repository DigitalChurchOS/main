import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as outreachService from '../services/outreach';

const router = Router();

// ═══════════════════════════════════════════════════════════════
//  OUTREACH CAMPAIGNS  (Outreach Campaign API)
// ═══════════════════════════════════════════════════════════════

// POST /api/outreach/campaigns
router.post('/campaigns', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, description, startDate, endDate, hashtags, shareCaptions, ctaLabel, ctaUrl } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const campaign = await outreachService.createCampaign(req.tenantId!, {
      name, description, startDate, endDate, hashtags, shareCaptions, ctaLabel, ctaUrl,
    });
    res.status(201).json({ data: campaign });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/campaigns
router.get('/campaigns', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const campaigns = await outreachService.listCampaigns(req.tenantId!, status as string);
    res.json({ data: campaigns });
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/campaigns/:id
router.get('/campaigns/:id', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const campaign = await outreachService.getCampaign(req.tenantId!, req.params.id as string);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json({ data: campaign });
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/outreach/campaigns/:id
router.put('/campaigns/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const updated = await outreachService.updateCampaign(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update campaign error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  INVITE ASSETS  (Invite Asset API)
// ═══════════════════════════════════════════════════════════════

// POST /api/outreach/campaigns/:id/assets
router.post('/campaigns/:id/assets', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { assetType, title, url, format, fileSize } = req.body;
    if (!assetType || !title || !url) {
      res.status(400).json({ error: 'assetType, title, and url are required' });
      return;
    }
    const asset = await outreachService.addAsset(req.params.id as string, {
      assetType, title, url, format, fileSize,
    });
    res.status(201).json({ data: asset });
  } catch (err) {
    console.error('Add asset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/campaigns/:id/assets
router.get('/campaigns/:id/assets', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { assetType } = req.query;
    const assets = await outreachService.listAssets(req.params.id as string, assetType as string);
    res.json({ data: assets });
  } catch (err) {
    console.error('List assets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/outreach/campaigns/:campaignId/assets/:assetId
router.delete('/campaigns/:campaignId/assets/:assetId', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await outreachService.deleteAsset(req.params.campaignId as string, req.params.assetId as string);
    if (!result) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Delete asset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  PERSONALIZED INVITE PAGES  (Personalized Invite Page API)
// ═══════════════════════════════════════════════════════════════

// POST /api/outreach/invite-pages
router.post('/invite-pages', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { campaignId, memberId, slug, personalMessage, personalVideoUrl, ctaLabel } = req.body;
    if (!campaignId || !memberId || !slug) {
      res.status(400).json({ error: 'campaignId, memberId, and slug are required' });
      return;
    }
    const page = await outreachService.createInvitePage(req.tenantId!, {
      campaignId, memberId, slug, personalMessage, personalVideoUrl, ctaLabel,
    });
    res.status(201).json({ data: page });
  } catch (err) {
    console.error('Create invite page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/invite-pages (list)
router.get('/invite-pages', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { campaignId, memberId } = req.query;
    const pages = await outreachService.listInvitePages(req.tenantId!, {
      campaignId: campaignId as string,
      memberId: memberId as string,
    });
    res.json({ data: pages });
  } catch (err) {
    console.error('List invite pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/invite-pages/:slug (public - for visitors)
router.get('/invite-pages/:slug', async (req: Request, res: Response) => {
  try {
    const page = await outreachService.getInvitePageBySlug(req.params.slug as string);
    if (!page) {
      res.status(404).json({ error: 'Invite page not found' });
      return;
    }
    res.json({ data: page });
  } catch (err) {
    console.error('Get invite page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CLICK & CONVERSION TRACKING  (Invite Link Tracking API)
// ═══════════════════════════════════════════════════════════════

// POST /api/outreach/invite-pages/:pageId/click
router.post('/invite-pages/:pageId/click', async (req: Request, res: Response) => {
  try {
    const { referrer, userAgent } = req.body;
    const click = await outreachService.trackClick(req.params.pageId as string, { referrer, userAgent });
    res.status(201).json({ data: click });
  } catch (err) {
    console.error('Track click error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/outreach/clicks/:clickId/convert
router.post('/clicks/:clickId/convert', async (req: Request, res: Response) => {
  try {
    const result = await outreachService.recordConversion(req.params.clickId as string);
    if (!result) {
      res.status(404).json({ error: 'Click not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Record conversion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/invite-pages/:pageId/clicks
router.get('/invite-pages/:pageId/clicks', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const clicks = await outreachService.getClicksForPage(req.params.pageId as string);
    res.json({ data: clicks });
  } catch (err) {
    console.error('Get clicks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SHARE TRACKING  (Share Tracking API)
// ═══════════════════════════════════════════════════════════════

// POST /api/outreach/invite-pages/:pageId/share
router.post('/invite-pages/:pageId/share', async (req: Request, res: Response) => {
  try {
    const { platform } = req.body;
    if (!platform) {
      res.status(400).json({ error: 'platform is required' });
      return;
    }
    const share = await outreachService.trackShare(req.params.pageId as string, platform);
    res.status(201).json({ data: share });
  } catch (err) {
    console.error('Track share error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/invite-pages/:pageId/shares
router.get('/invite-pages/:pageId/shares', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const shares = await outreachService.getSharesForPage(req.params.pageId as string);
    res.json({ data: shares });
  } catch (err) {
    console.error('Get shares error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  LEADERBOARD & ANALYTICS  (Conversion Attribution API)
// ═══════════════════════════════════════════════════════════════

// GET /api/outreach/campaigns/:id/leaderboard
router.get('/campaigns/:id/leaderboard', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const leaderboard = await outreachService.getLeaderboard(req.tenantId!, req.params.id as string);
    res.json({ data: leaderboard });
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/outreach/campaigns/:id/analytics
router.get('/campaigns/:id/analytics', authMiddleware, requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const analytics = await outreachService.getCampaignAnalytics(req.tenantId!, req.params.id as string);
    res.json({ data: analytics });
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
