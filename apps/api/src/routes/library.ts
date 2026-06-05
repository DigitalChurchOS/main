import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import prisma from '../lib/prisma';
import { DigitalLibraryResourceCenterService } from '../services/digitalLibraryResourceCenter';
import {
  createLibraryCategory,
  listLibraryCategories,
  createResource,
  updateResource,
  deleteResource,
  getResource,
  listResources,
  incrementDownloadCount,
  purchaseResource,
  hasAccess,
} from '../services/library';

const router = Router();

// Enforce auth globally for library endpoints and check module activation
router.use(authMiddleware);
router.use(requireModule('digital-library-resource-center'));

/**
 * ─────────────────────────────────────────────────────────────
 * CATEGORY ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/library/categories — Create a category (Admin)
router.post('/categories', requirePermission('digital-library-resource-center.create'), async (req: Request, res: Response) => {
  try {
    const { name, slug, description, parentId } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const category = await createLibraryCategory(req.tenantId!, { name, slug, description, parentId }, req.user?.userId);
    res.status(201).json({ data: category });
  } catch (err: any) {
    console.error('Create library category error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/library/categories — List categories
router.get('/categories', requirePermission('digital-library-resource-center.read'), async (req: Request, res: Response) => {
  try {
    const categories = await listLibraryCategories(req.tenantId!);
    res.json({ data: categories });
  } catch (err: any) {
    console.error('List library categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * RESOURCE ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/library/resources — Create a resource (Admin)
router.post('/resources', requirePermission('digital-library-resource-center.create'), async (req: Request, res: Response) => {
  try {
    const { title, slug, description, author, fileUrl, fileSize, fileType, coverImageUrl, pricingType, price, visibility, status, categoryId } = req.body;
    if (!title || !fileUrl) {
      res.status(400).json({ error: 'title and fileUrl are required' });
      return;
    }
    const resource = await createResource(req.tenantId!, {
      title, slug, description, author, fileUrl, fileSize, fileType, coverImageUrl, pricingType, price, visibility, status, categoryId
    }, req.user?.userId);
    res.status(201).json({ data: resource });
  } catch (err: any) {
    console.error('Create resource error:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/library/resources/:id — Update a resource (Admin)
router.put('/resources/:id', requirePermission('digital-library-resource-center.update'), async (req: Request, res: Response) => {
  try {
    const resource = await updateResource(req.params.id as string, req.tenantId!, req.body, req.user?.userId);
    res.json({ data: resource });
  } catch (err: any) {
    console.error('Update resource error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/library/resources/:id — Delete a resource (Admin)
router.delete('/resources/:id', requirePermission('digital-library-resource-center.delete'), async (req: Request, res: Response) => {
  try {
    const resource = await deleteResource(req.params.id as string, req.tenantId!, req.user?.userId);
    res.json({ data: resource });
  } catch (err: any) {
    console.error('Delete resource error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/library/resources — List resources (with filters)
router.get('/resources', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      pricingType: req.query.pricingType as string | undefined,
      visibility: req.query.visibility as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    // Access control check for statuses
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && filters.status && filters.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published resources' });
      return;
    }

    const result = await listResources(req.tenantId!, filters);

    // Filter resources list by role visibility to hide what they cannot access
    const allowedResources = [];
    for (const r of result.resources) {
      const allowed = await hasAccess(req.tenantId!, r.id, req.user?.userId || null, userPermissions);
      // Wait, paid resources can be listed so the user can purchase them,
      // but they cannot be downloaded.
      // So if it's paid, we still allow it in the list (so it can be purchased),
      // but if they don't have role access (e.g. leaders_only visible to a guest), we hide it!
      const isMember = userPermissions.includes('member.read') || isAdmin;
      const roleAllowed = r.visibility === 'public' ||
        (r.visibility === 'members_only' && isMember) ||
        (r.visibility === 'leaders_only' && (userPermissions.includes('member.create') || isAdmin)) ||
        isAdmin;

      if (roleAllowed) {
        allowedResources.push(r);
      }
    }

    res.json({
      data: allowedResources,
      meta: { total: allowedResources.length, page: result.page, limit: result.limit },
    });
  } catch (err: any) {
    console.error('List resources error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/library/resources/:idOrSlug — Get resource details
router.get('/resources/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const resource = await getResource(req.params.idOrSlug as string, req.tenantId!);
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');

    // Non-admins can't view draft/archived
    if (!isAdmin && resource.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published resources' });
      return;
    }

    // Check role access
    const isMember = userPermissions.includes('member.read') || isAdmin;
    const roleAllowed = resource.visibility === 'public' ||
      (resource.visibility === 'members_only' && isMember) ||
      (resource.visibility === 'leaders_only' && (userPermissions.includes('member.create') || isAdmin)) ||
      isAdmin;

    if (!roleAllowed) {
      res.status(403).json({ error: 'Access denied to this resource' });
      return;
    }

    res.json({ data: resource });
  } catch (err: any) {
    console.error('Get resource error:', err);
    res.status(404).json({ error: err.message });
  }
});

// POST /api/library/resources/:id/download — Download file (increments downloadCount)
router.post('/resources/:id/download', async (req: Request, res: Response) => {
  try {
    const resourceId = req.params.id as string;
    const userPermissions = req.user?.permissions || [];
    const userId = req.user?.userId || null;

    const allowed = await hasAccess(req.tenantId!, resourceId, userId, userPermissions);
    if (!allowed) {
      res.status(403).json({ error: 'You do not have access to download this resource. A purchase may be required.' });
      return;
    }

    const updated = await incrementDownloadCount(resourceId, req.tenantId!, req.user?.userId);
    res.json({
      data: {
        fileUrl: updated.fileUrl,
        downloadCount: updated.downloadCount,
      },
    });
  } catch (err: any) {
    console.error('Download resource error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/library/resources/:id/purchase — Purchase paid resource
router.post('/resources/:id/purchase', async (req: Request, res: Response) => {
  try {
    const resourceId = req.params.id as string;
    const userId = req.user!.userId;

    const purchase = await purchaseResource(req.tenantId!, resourceId, userId);
    res.status(201).json({ data: purchase });
  } catch (err: any) {
    console.error('Purchase resource error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/library/audit — Retrieve activity log audits (view_reports permission)
router.get('/audit', requirePermission('digital-library-resource-center.view_reports'), async (req: Request, res: Response) => {
  try {
    const list = await prisma.digitalLibraryResourceCenterModuleActivity.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    const formatted = list.map(item => {
      let title = 'System Config';
      try {
        const metadata = JSON.parse(item.metadataJson);
        title = metadata.title || metadata.resourceId || title;
      } catch (e) {}

      return {
        timestamp: item.createdAt.toISOString(),
        resource: title,
        user: item.userId,
        role: item.userId === 'admin@demo.churchos.local' ? 'Tenant Owner' : 'Member',
        action: item.actionType.replace('_', ' ').toUpperCase(),
      };
    });

    res.json({ data: formatted });
  } catch (err: any) {
    console.error('List library audit logs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/library/sales — Retrieve purchase records (view_reports permission)
router.get('/sales', requirePermission('digital-library-resource-center.view_reports'), async (req: Request, res: Response) => {
  try {
    const list = await prisma.libraryPurchase.findMany({
      where: { tenantId: req.tenantId! },
      include: {
        resource: true,
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(item => {
      return {
        date: item.createdAt.toISOString().split('T')[0],
        memberName: item.user.email,
        resource: item.resource.title,
        pricePaid: item.amountPaid,
        txId: `TXN-${item.id.slice(0, 8).toUpperCase()}`,
      };
    });

    res.json({ data: formatted });
  } catch (err: any) {
    console.error('List library sales error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
