import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { dnsMiddleware } from '../middleware/dns';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { pluginRegistry, resolveSettingsWithDefaults, sanitizeCustomCSS } from '@churchos/frontend-contracts';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT: GET /api/cms/render
// ─────────────────────────────────────────────────────────────
// Resolves website pages by domain / subdomain DNS context.
// No auth required. Enforces 'published' status filter.
// ─────────────────────────────────────────────────────────────
router.get('/render', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const websiteId = (req as any).websiteId as string | undefined;
    const slug = (req.query.slug as string) || ''; // default to home page ""

    if (!tenantId || !websiteId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    // Enforce that the 'website-cms' module is active for the tenant
    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    });

    if (!entitlement || entitlement.status !== 'active') {
      res.status(403).json({ error: 'Website CMS module is inactive' });
      return;
    }

    // Retrieve published page layout
    const page = await prisma.page.findFirst({
      where: {
        websiteId,
        slug,
        status: 'published',
      },
      include: {
        website: {
          include: { theme: true },
        },
      },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    // Fetch active navigation menu for this website
    const navMenu = await prisma.navigationMenu.findFirst({
      where: { websiteId, isActive: true },
    });

    // Fetch footer configuration for this website
    const cmsFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId },
    });

    res.json({
      data: {
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks: JSON.parse(page.content),
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        navigation: navMenu ? {
          id: navMenu.id,
          name: navMenu.name,
          items: JSON.parse(navMenu.items),
        } : null,
        footer: cmsFooter ? {
          id: cmsFooter.id,
          copyrightText: cmsFooter.copyrightText,
          socialLinks: JSON.parse(cmsFooter.socialLinks),
          secondaryLinks: JSON.parse(cmsFooter.secondaryLinks),
        } : null,
        theme: (() => {
          const rawSettings = JSON.parse(page.website.theme.settings);
          const resolved = resolveSettingsWithDefaults(rawSettings);
          if (resolved.customCSS?.customCSS) {
            const { sanitized } = sanitizeCustomCSS(resolved.customCSS.customCSS);
            resolved.customCSS.customCSS = sanitized;
          }
          return {
            name: page.website.theme.name,
            themeKey: page.website.theme.name,
            settings: rawSettings,
            appearanceSettings: resolved,
          };
        })(),
      },
    });
  } catch (err) {
    console.error('Render CMS page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT: GET /api/cms/site-context
// ─────────────────────────────────────────────────────────────
router.get('/site-context', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const websiteId = (req as any).websiteId as string | undefined;

    if (!tenantId || !websiteId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    });

    if (!entitlement || entitlement.status !== 'active') {
      res.status(403).json({ error: 'Website CMS module is inactive' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        status: true,
      }
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenantModules = await prisma.tenantModule.findMany({
      where: {
        tenantId,
        status: { in: ['active', 'trialing'] }
      }
    });

    const activeModuleKeys = tenantModules.map(m => m.moduleKey);

    const navMenu = await prisma.navigationMenu.findFirst({
      where: { websiteId, isActive: true },
    });

    const cmsFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId },
    });

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: { theme: true },
    });

    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const moduleEntitlements: string[] = [];
    const moduleRoutes: any[] = [];

    const mapModule = (dbKey: string, feKey: string, routes: any[]) => {
      if (activeModuleKeys.includes(dbKey)) {
        moduleEntitlements.push(feKey);
        moduleRoutes.push(...routes);
      }
    };

    mapModule('events-registration', 'events-management', [
      { moduleKey: 'events-management', path: '/events', type: 'listing', displayName: 'Events' },
      { moduleKey: 'events-management', path: '/events/:id', type: 'detail', displayName: 'Event Detail' }
    ]);

    mapModule('media', 'sermons-media', [
      { moduleKey: 'sermons-media', path: '/sermons', type: 'listing', displayName: 'Sermons' },
      { moduleKey: 'sermons-media', path: '/sermons/:id', type: 'detail', displayName: 'Sermon Detail' }
    ]);

    mapModule('giving-donations', 'giving-tithes', [
      { moduleKey: 'giving-tithes', path: '/giving', type: 'listing', displayName: 'Giving' }
    ]);

    mapModule('cell-fellowship', 'groups-community', [
      { moduleKey: 'groups-community', path: '/groups', type: 'listing', displayName: 'Groups' },
      { moduleKey: 'groups-community', path: '/groups/:id', type: 'detail', displayName: 'Group Detail' }
    ]);

    mapModule('lms-discipleship-training', 'lms-courses', [
      { moduleKey: 'lms-courses', path: '/courses', type: 'listing', displayName: 'Courses' },
      { moduleKey: 'lms-courses', path: '/courses/:id', type: 'detail', displayName: 'Course Detail' }
    ]);

    mapModule('prayer-testimony', 'prayer-testimony', [
      { moduleKey: 'prayer-testimony', path: '/prayer', type: 'listing', displayName: 'Prayer' }
    ]);

    mapModule('dynamic-blog-publishing-engine', 'blog', [
      { moduleKey: 'blog', path: '/blog', type: 'listing', displayName: 'Blog' },
      { moduleKey: 'blog', path: '/blog/:slug', type: 'detail', displayName: 'Blog Article' }
    ]);

    mapModule('ecommerce-store', 'store', [
      { moduleKey: 'store', path: '/store', type: 'listing', displayName: 'Store' },
      { moduleKey: 'store', path: '/store/:id', type: 'detail', displayName: 'Product Detail' }
    ]);

    mapModule('livestream', 'livestream-broadcasting', [
      { moduleKey: 'livestream-broadcasting', path: '/live', type: 'screen', displayName: 'Live' }
    ]);

    if (activeModuleKeys.includes('member-management')) {
      moduleEntitlements.push('member-portal');
      moduleRoutes.push(
        { moduleKey: 'member-portal', path: '/members', type: 'screen', displayName: 'Member Portal' }
      );
    }

    // Load active/enabled tenant plugins
    const tenantPlugins = await prisma.tenantPlugin.findMany({
      where: {
        tenantId,
        status: { in: ['active', 'enabled'] }
      }
    });

    const enabledPlugins = tenantPlugins.map(tp => tp.pluginId);
    const pluginSettings: Record<string, any> = {};

    for (const tp of tenantPlugins) {
      const parsedSettings = JSON.parse(tp.settings || '{}');
      const manifest = pluginRegistry.getPlugin(tp.pluginId);
      
      const sanitized: Record<string, any> = {};
      const schema = manifest?.settingsSchema || [];
      
      for (const [key, value] of Object.entries(parsedSettings)) {
        const schemaField = schema.find(f => f.name === key);
        const isSecret = schemaField ? schemaField.type === 'secret' : false;
        
        const lowerKey = key.toLowerCase();
        const matchesSecretPattern = ['api', 'key', 'token', 'secret', 'password', 'credential', 'webhook'].some(
          keyword => lowerKey.includes(keyword)
        );

        if (!isSecret && !matchesSecretPattern) {
          sanitized[key] = value;
        }
      }
      pluginSettings[tp.pluginId] = sanitized;
    }

    res.json({
      data: {
        tenant: {
          tenantId: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          customDomain: tenant.customDomain,
          status: tenant.status
        },
        moduleEntitlements,
        navigation: navMenu ? {
          id: navMenu.id,
          name: navMenu.name,
          items: JSON.parse(navMenu.items),
        } : null,
        footer: cmsFooter ? {
          id: cmsFooter.id,
          copyrightText: cmsFooter.copyrightText,
          socialLinks: JSON.parse(cmsFooter.socialLinks),
          secondaryLinks: JSON.parse(cmsFooter.secondaryLinks),
        } : null,
        theme: (() => {
          const rawSettings = JSON.parse(website.theme.settings);
          const resolved = resolveSettingsWithDefaults(rawSettings);
          // Sanitize custom CSS if present
          if (resolved.customCSS?.customCSS) {
            const { sanitized } = sanitizeCustomCSS(resolved.customCSS.customCSS);
            resolved.customCSS.customCSS = sanitized;
          }
          const draftSettings = website.theme.draftSettings
            ? JSON.parse(website.theme.draftSettings)
            : null;
          return {
            name: website.theme.name,
            themeKey: website.theme.name,
            settings: rawSettings,
            draftSettings: draftSettings,
            appearanceSettings: resolved,
          };
        })(),
        moduleRoutes,
        enabledPlugins,
        pluginSettings
      }
    });
  } catch (err) {
    console.error('Site context CMS error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT: GET /api/cms/render/preview
// ─────────────────────────────────────────────────────────────
router.get('/render/preview', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const websiteId = (req as any).websiteId as string | undefined;
    const slug = (req.query.slug as string) || '';
    const token = req.query.token as string;

    if (!tenantId || !websiteId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    if (!token) {
      res.status(401).json({ error: 'Missing preview token' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      if (payload.tenantId !== tenantId) {
        res.status(403).json({ error: 'Token tenant mismatch' });
        return;
      }
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    });

    if (!entitlement || entitlement.status !== 'active') {
      res.status(403).json({ error: 'Website CMS module is inactive' });
      return;
    }

    const page = await prisma.page.findFirst({
      where: {
        websiteId,
        slug,
        status: { in: ['published', 'draft'] },
      },
      include: {
        website: {
          include: { theme: true },
        },
      },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const navMenu = await prisma.navigationMenu.findFirst({
      where: { websiteId, isActive: true },
    });

    const cmsFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId },
    });

    // Load active/enabled tenant plugins
    const tenantPlugins = await prisma.tenantPlugin.findMany({
      where: {
        tenantId,
        status: { in: ['active', 'enabled'] }
      }
    });

    const enabledPlugins = tenantPlugins.map(tp => tp.pluginId);
    const pluginSettings: Record<string, any> = {};

    for (const tp of tenantPlugins) {
      const parsedSettings = JSON.parse(tp.settings || '{}');
      const manifest = pluginRegistry.getPlugin(tp.pluginId);
      
      const sanitized: Record<string, any> = {};
      const schema = manifest?.settingsSchema || [];
      
      for (const [key, value] of Object.entries(parsedSettings)) {
        const schemaField = schema.find(f => f.name === key);
        const isSecret = schemaField ? schemaField.type === 'secret' : false;
        
        const lowerKey = key.toLowerCase();
        const matchesSecretPattern = ['api', 'key', 'token', 'secret', 'password', 'credential', 'webhook'].some(
          keyword => lowerKey.includes(keyword)
        );

        if (!isSecret && !matchesSecretPattern) {
          sanitized[key] = value;
        }
      }
      pluginSettings[tp.pluginId] = sanitized;
    }

    res.json({
      data: {
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks: JSON.parse(page.content),
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        navigation: navMenu ? {
          id: navMenu.id,
          name: navMenu.name,
          items: JSON.parse(navMenu.items),
        } : null,
        footer: cmsFooter ? {
          id: cmsFooter.id,
          copyrightText: cmsFooter.copyrightText,
          socialLinks: JSON.parse(cmsFooter.socialLinks),
          secondaryLinks: JSON.parse(cmsFooter.secondaryLinks),
        } : null,
        theme: (() => {
          const rawSettings = JSON.parse(page.website.theme.settings);
          // In preview mode, merge draft settings if available
          const draftRaw = page.website.theme.draftSettings
            ? JSON.parse(page.website.theme.draftSettings)
            : null;
          const mergedRaw = draftRaw ? { ...rawSettings, ...draftRaw } : rawSettings;
          const resolved = resolveSettingsWithDefaults(mergedRaw);
          // Sanitize custom CSS if present
          if (resolved.customCSS?.customCSS) {
            const { sanitized } = sanitizeCustomCSS(resolved.customCSS.customCSS);
            resolved.customCSS.customCSS = sanitized;
          }
          return {
            name: page.website.theme.name,
            themeKey: page.website.theme.name,
            settings: mergedRaw,
            appearanceSettings: resolved,
          };
        })(),
        isPreviewMode: true,
        enabledPlugins,
        pluginSettings
      },
    });
  } catch (err) {
    console.error('Render CMS page preview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Requires authentication & entitlement locks)
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(requireModule('website-cms'));

const requireCmsPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

// Create a new Website profile
router.post('/websites', requireCmsPermission('core-website-cms.create', 'core-website-cms.manage_settings'), async (req: Request, res: Response) => {
  try {
    const { title, description, domain, themeId } = req.body;
    const tenantId = req.tenantId!;

    if (!title || !themeId) {
      res.status(400).json({ error: 'title and themeId are required' });
      return;
    }

    // Verify theme exists and belongs to this tenant or is global (tenantId === null)
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId as string,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (!theme) {
      res.status(404).json({ error: 'Theme not found' });
      return;
    }

    const website = await prisma.website.create({
      data: {
        tenantId,
        themeId,
        title,
        description: description || null,
        domain: domain || null,
        isActive: true,
      },
    });

    res.status(201).json({ data: website });
  } catch (err) {
    console.error('Create website error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a custom Theme configuration
router.post('/themes', requireCmsPermission('core-website-cms.manage_settings'), async (req: Request, res: Response) => {
  try {
    const { name, settings } = req.body;
    const tenantId = req.tenantId!;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const theme = await prisma.theme.create({
      data: {
        tenantId,
        name,
        settings: settings ? JSON.stringify(settings) : '{}',
        isCustom: true,
      },
    });

    res.status(201).json({ data: theme });
  } catch (err) {
    console.error('Create theme error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to save page revision and enforce 15 revisions limit
async function savePageRevision(tenantId: string, pageId: string, content: string, userId?: string) {
  const lastRevision = await prisma.pageRevision.findFirst({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  const nextVersion = lastRevision ? lastRevision.version + 1 : 1;

  await prisma.pageRevision.create({
    data: {
      tenantId,
      pageId,
      content,
      version: nextVersion,
      createdById: userId || null,
    },
  });

  const revisions = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  if (revisions.length > 15) {
    const oldestToKeep = revisions[14];
    await prisma.pageRevision.deleteMany({
      where: {
        pageId,
        version: { lt: oldestToKeep.version },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// PAGES CRUD & REVISIONS
// ─────────────────────────────────────────────────────────────

// Create a new CMS page
router.post('/pages', requireCmsPermission('core-website-cms.create'), async (req: Request, res: Response) => {
  try {
    const { websiteId, slug, title, content, status, isHome, seoTitle, seoDescription, seoKeywords } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId || slug === undefined || !title) {
      res.status(400).json({ error: 'websiteId, slug, and title are required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId as string, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const duplicate = await prisma.page.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A page with this slug already exists on this website' });
      return;
    }

    const pageContent = content ? (typeof content === 'string' ? content : JSON.stringify(content)) : '[]';

    const page = await prisma.page.create({
      data: {
        tenantId,
        websiteId,
        slug,
        title,
        content: pageContent,
        status: status || 'draft',
        isHome: isHome || false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    });

    // Save initial revision
    await savePageRevision(tenantId, page.id, pageContent, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_create',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug }),
      },
    });

    res.status(201).json({ data: page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all pages (including drafts) for editing
router.get('/pages', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const pages = await prisma.page.findMany({
      where: { tenantId },
      orderBy: { slug: 'asc' },
    });

    res.json({ data: pages });
  } catch (err) {
    console.error('List pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update page layout block content, slug, status, and SEO settings
router.patch('/pages/:id', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    const existing = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const { slug, title, content, status, isHome, seoTitle, seoDescription, seoKeywords } = req.body;

    const pageContent = content !== undefined ? (typeof content === 'string' ? content : JSON.stringify(content)) : undefined;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(pageContent !== undefined && { content: pageContent }),
        ...(status !== undefined && { status }),
        ...(isHome !== undefined && { isHome }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
      },
    });

    // Create a new version revision if content changed
    if (pageContent !== undefined && pageContent !== existing.content) {
      await savePageRevision(tenantId, page.id, pageContent, userId);
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_update',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug, updatedFields: Object.keys(req.body) }),
      },
    });

    res.json({ data: page });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all revisions for a specific page
router.get('/pages/:id/revisions', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const revisions = await prisma.pageRevision.findMany({
      where: { pageId: id, tenantId },
      include: {
        createdBy: {
          select: { email: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    res.json({ data: revisions });
  } catch (err) {
    console.error('List revisions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rollback page content to a specific revision
router.post('/pages/:id/rollback', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { revisionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!revisionId) {
      res.status(400).json({ error: 'revisionId is required' });
      return;
    }

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const revision = await prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId: id, tenantId },
    });
    if (!revision) {
      res.status(404).json({ error: 'Revision not found' });
      return;
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        content: revision.content,
      },
    });

    // Rollback creates a new revision version
    await savePageRevision(tenantId, page.id, revision.content, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_rollback',
        pageId: page.id,
        metadataJson: JSON.stringify({ rollbackToVersion: revision.version, revisionId }),
      },
    });

    res.json({ data: updatedPage });
  } catch (err) {
    console.error('Rollback page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// NAVIGATION MENU MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List navigation menus
router.get('/navigation', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const menus = await prisma.navigationMenu.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ data: menus });
  } catch (err) {
    console.error('List navigation menus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a menu structure
router.post('/navigation', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const { id, websiteId, name, items, isActive } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId || !name) {
      res.status(400).json({ error: 'websiteId and name are required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const menuItems = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : '[]';

    let menu;
    if (id) {
      // ownership check
      const existing = await prisma.navigationMenu.findFirst({
        where: { id, tenantId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Navigation menu not found' });
        return;
      }
      menu = await prisma.navigationMenu.update({
        where: { id },
        data: {
          name,
          items: menuItems,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } else {
      menu = await prisma.navigationMenu.create({
        data: {
          tenantId,
          websiteId,
          name,
          items: menuItems,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'navigation_update',
        metadataJson: JSON.stringify({ menuId: menu.id, name: menu.name }),
      },
    });

    res.json({ data: menu });
  } catch (err) {
    console.error('Save navigation menu error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// FOOTER BUILDER MANAGEMENT
// ─────────────────────────────────────────────────────────────

// Get footer configuration for website
router.get('/footer', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const websiteId = req.query.websiteId as string;
    const tenantId = req.tenantId!;

    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const footer = await prisma.cmsFooter.findFirst({
      where: { websiteId, tenantId },
    });

    res.json({ data: footer });
  } catch (err) {
    console.error('Get footer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update website footer
router.post('/footer', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const { websiteId, copyrightText, socialLinks, secondaryLinks } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const social = socialLinks ? (typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks)) : '[]';
    const secondary = secondaryLinks ? (typeof secondaryLinks === 'string' ? secondaryLinks : JSON.stringify(secondaryLinks)) : '[]';

    const existingFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId, tenantId },
    });

    let footer;
    if (existingFooter) {
      footer = await prisma.cmsFooter.update({
        where: { id: existingFooter.id },
        data: {
          copyrightText: copyrightText || null,
          socialLinks: social,
          secondaryLinks: secondary,
        },
      });
    } else {
      footer = await prisma.cmsFooter.create({
        data: {
          tenantId,
          websiteId,
          copyrightText: copyrightText || null,
          socialLinks: social,
          secondaryLinks: secondary,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'footer_update',
        metadataJson: JSON.stringify({ footerId: footer.id }),
      },
    });

    res.json({ data: footer });
  } catch (err) {
    console.error('Save footer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// REUSABLE BLOCKS MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List reusable blocks
router.get('/reusable-blocks', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const blocks = await prisma.reusableBlock.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ data: blocks });
  } catch (err) {
    console.error('List reusable blocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create reusable block
router.post('/reusable-blocks', requireCmsPermission('core-website-cms.create'), async (req: Request, res: Response) => {
  try {
    const { name, key, content } = req.body;
    const tenantId = req.tenantId!;

    if (!name || !key || !content) {
      res.status(400).json({ error: 'name, key, and content are required' });
      return;
    }

    const duplicate = await prisma.reusableBlock.findFirst({
      where: { tenantId, key },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A block with this key already exists for this tenant' });
      return;
    }

    const block = await prisma.reusableBlock.create({
      data: {
        tenantId,
        name,
        key,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      },
    });

    res.status(201).json({ data: block });
  } catch (err) {
    console.error('Create reusable block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reusable block
router.patch('/reusable-blocks/:id', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const { name, key, content } = req.body;

    const existing = await prisma.reusableBlock.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Reusable block not found' });
      return;
    }

    if (key && key !== existing.key) {
      const duplicate = await prisma.reusableBlock.findFirst({
        where: { tenantId, key, id: { not: id } },
      });
      if (duplicate) {
        res.status(409).json({ error: 'A block with this key already exists for this tenant' });
        return;
      }
    }

    const block = await prisma.reusableBlock.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(key !== undefined && { key }),
        ...(content !== undefined && { content: typeof content === 'string' ? content : JSON.stringify(content) }),
      },
    });

    res.json({ data: block });
  } catch (err) {
    console.error('Update reusable block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS (CMS ACTIVITY LOGS)
// ─────────────────────────────────────────────────────────────

// Get CMS activity logs
router.get('/activity-logs', requireCmsPermission('core-website-cms.view_reports'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const logs = await prisma.cmsActivityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100, // cap to 100 for safety
    });

    res.json({ data: logs });
  } catch (err) {
    console.error('Get CMS activity logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
