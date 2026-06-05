import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  registerDeveloper,
  createAsset,
  submitAssetVersion,
  reviewSubmission,
  listMarketplaceAssets,
  getAssetDetails,
  purchaseMarketplaceAsset,
  submitAssetFeedback,
  createSandboxTenant,
  getDeveloperPayouts,
  installMarketplaceAsset,
  approvePluginPermissions,
  updateMarketplaceAsset,
  rollbackMarketplaceAssetVersion,
  disableMarketplaceAsset,
  enableMarketplaceAsset,
  uninstallMarketplaceAsset,
  logMarketplaceAudit,
} from '../services/marketplace';

const router = Router();

// All marketplace routes require authentication
router.use(authMiddleware);

// Helper helper middleware to retrieve developer profile for the user
async function requireDeveloper(req: Request, res: Response, next: any) {
  try {
    const developer = await prisma.developerProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!developer) {
      res.status(403).json({ error: 'Developer profile required' });
      return;
    }

    if (developer.status !== 'active') {
      res.status(403).json({ error: 'Developer profile is suspended' });
      return;
    }

    req.developer = developer;
    next();
  } catch (err) {
    next(err);
  }
}

// Extend Request interface to support developer payload within this file context
declare global {
  namespace Express {
    interface Request {
      developer?: any;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Developer Accounts APIs
// ─────────────────────────────────────────────────────────────

// Register Developer
router.post('/developer/register', async (req: Request, res: Response) => {
  try {
    const { companyName, website, payoutEmail } = req.body;
    const userId = req.user!.userId;

    const profile = await registerDeveloper(userId, companyName, website, payoutEmail);
    res.status(201).json({ data: profile });
  } catch (err: any) {
    console.error('Register developer error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Create Sandbox Tenant
router.post('/developer/sandbox', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const result = await createSandboxTenant(req.developer.id);
    res.status(201).json({ data: result });
  } catch (err: any) {
    console.error('Sandbox creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// View Developer Payouts & Earnings Report
router.get('/developer/payouts', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const report = await getDeveloperPayouts(req.developer.id);
    res.json({ data: report });
  } catch (err: any) {
    console.error('Get payouts error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Submissions & Assets Management (Developer Actions)
// ─────────────────────────────────────────────────────────────

// Create Asset Definition (Draft)
router.post('/assets', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const { name, description, type, pricingType, price, assetConfig } = req.body;
    const asset = await createAsset(
      req.developer.id,
      name,
      description,
      type,
      pricingType,
      price,
      assetConfig
    );
    res.status(201).json({ data: asset });
  } catch (err: any) {
    console.error('Create asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Submit Asset Version for Review
router.post('/assets/:assetId/submit', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const { version, changelog } = req.body;

    if (!version) {
      res.status(400).json({ error: 'version is required' });
      return;
    }

    const submission = await submitAssetVersion(assetId, version, changelog);
    res.status(201).json({ data: submission });
  } catch (err: any) {
    console.error('Submit version error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Admin Review API
// ─────────────────────────────────────────────────────────────

// Review Submission
router.post(
  '/submissions/:submissionId/review',
  requirePermission('tenant.settings'), // Admin permission equivalent
  async (req: Request, res: Response) => {
    try {
      const submissionId = req.params.submissionId as string;
      const { decision, notes } = req.body;
      const reviewerId = req.user!.userId;

      if (!decision) {
        res.status(400).json({ error: 'decision is required' });
        return;
      }

      const review = await reviewSubmission(submissionId, reviewerId, decision, notes);
      res.status(201).json({ data: review });
    } catch (err: any) {
      console.error('Review submission error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Storefront & Client APIs (Tenant / User Actions)
// ─────────────────────────────────────────────────────────────

// Browse/List Marketplace Assets
router.get('/assets', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, pricingType, query } = req.query;
    const assets = await listMarketplaceAssets({
      type: type as string,
      pricingType: pricingType as string,
      query: query as string,
    });
    res.json({ data: assets });
  } catch (err: any) {
    console.error('List assets error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get Asset Details
router.get('/assets/:assetId', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const details = await getAssetDetails(assetId);
    res.json({ data: details });
  } catch (err: any) {
    console.error('Get asset details error:', err);
    res.status(404).json({ error: err.message });
  }
});

// Purchase/Install Asset
router.post(
  '/assets/:assetId/purchase',
  requirePermission('tenant.settings'), // Admin action
  async (req: Request, res: Response) => {
    try {
      const assetId = req.params.assetId as string;
      const tenantId = req.tenantId!;

      const purchase = await purchaseMarketplaceAsset(tenantId, assetId);
      res.status(201).json({ data: purchase });
    } catch (err: any) {
      console.error('Purchase asset error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Leave Feedback/Rating
router.post(
  '/assets/:assetId/feedback',
  requirePermission('member.read'),
  async (req: Request, res: Response) => {
    try {
      const assetId = req.params.assetId as string;
      const tenantId = req.tenantId!;
      const userId = req.user!.userId;
      const { rating, comment } = req.body;

      if (rating === undefined) {
        res.status(400).json({ error: 'rating is required' });
        return;
      }

      const feedback = await submitAssetFeedback(tenantId, assetId, userId, Number(rating), comment);
      res.status(201).json({ data: feedback });
    } catch (err: any) {
      console.error('Feedback error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// Tenant Installation & Operations (Runtime Marketplace Engine)
// ─────────────────────────────────────────────────────────────

// Get all installed marketplace assets for the tenant
router.get('/installed', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const installations = await prisma.marketplaceInstallation.findMany({
      where: { tenantId },
      include: {
        asset: {
          include: {
            developer: {
              select: {
                companyName: true,
                website: true,
              },
            },
            versions: true,
          },
        },
        version: true,
      },
    });
    res.json({ data: installations });
  } catch (err: any) {
    console.error('List installed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Install a marketplace asset version
router.post('/assets/:assetId/install', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const { versionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    if (!versionId) {
      res.status(400).json({ error: 'versionId is required' });
      return;
    }

    const installation = await installMarketplaceAsset(tenantId, assetId, versionId, userId);
    res.status(201).json({ data: installation });
  } catch (err: any) {
    console.error('Install asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Approve permissions for a plugin
router.post('/assets/:assetId/permissions', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const { permissions } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    if (!permissions || !Array.isArray(permissions)) {
      res.status(400).json({ error: 'permissions array is required' });
      return;
    }

    const updated = await approvePluginPermissions(tenantId, assetId, permissions, userId);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Approve permissions error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update asset installation to a new version
router.post('/assets/:assetId/update', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const { versionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    if (!versionId) {
      res.status(400).json({ error: 'versionId is required' });
      return;
    }

    const updated = await updateMarketplaceAsset(tenantId, assetId, versionId, userId);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Update asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Rollback asset installation to an older version
router.post('/assets/:assetId/rollback', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const { versionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    if (!versionId) {
      res.status(400).json({ error: 'versionId is required' });
      return;
    }

    const updated = await rollbackMarketplaceAssetVersion(tenantId, assetId, versionId, userId);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Rollback asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Disable asset
router.post('/assets/:assetId/disable', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    const updated = await disableMarketplaceAsset(tenantId, assetId, userId);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Disable asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Enable asset
router.post('/assets/:assetId/enable', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    const updated = await enableMarketplaceAsset(tenantId, assetId, userId);
    res.json({ data: updated });
  } catch (err: any) {
    console.error('Enable asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Uninstall asset
router.post('/assets/:assetId/uninstall', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;

    const result = await uninstallMarketplaceAsset(tenantId, assetId, userId);
    res.json(result);
  } catch (err: any) {
    console.error('Uninstall asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Developer Logs & Audits
// ─────────────────────────────────────────────────────────────

// Get developer portal activity audit logs
router.get('/developer/logs', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const logs = await prisma.marketplaceAuditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: logs });
  } catch (err: any) {
    console.error('Get developer logs error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get submissions (developer's own)
router.get('/submissions', async (req: Request, res: Response) => {
  try {
    const developer = await prisma.developerProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!developer) {
      res.json({ data: [] });
      return;
    }

    const submissions = await prisma.assetSubmission.findMany({
      where: {
        asset: { developerId: developer.id },
      },
      include: {
        asset: {
          include: { developer: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json({ data: submissions });
  } catch (err: any) {
    console.error('Get submissions error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
