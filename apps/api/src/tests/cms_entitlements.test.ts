import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Module Entitlements, CMS, and Domain Router', () => {
  let tenantGraceId: string;
  let tenantHopeId: string;

  let graceToken: string;

  let themeId: string;
  let graceWebsiteId: string;
  let hopeWebsiteId: string;

  let pageDraftId: string;
  let pagePublishedId: string;

  beforeAll(async () => {
    // 1. Clean up database CMS & Entitlements tables from prior runs
    await prisma.page.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant Grace (subdomain: grace)
    const tenantGrace = await prisma.tenant.create({
      data: { name: 'Grace Church', subdomain: 'grace', status: 'active' },
    });
    tenantGraceId = tenantGrace.id;

    // 3. Create Tenant Hope (subdomain: hope)
    const tenantHope = await prisma.tenant.create({
      data: { name: 'Hope Chapel', subdomain: 'hope', status: 'active' },
    });
    tenantHopeId = tenantHope.id;

    // 4. Create Admin for Tenant Grace with tenant.settings permission
    const settingsPerm = await prisma.permission.findFirst({
      where: { name: 'tenant.settings' },
    });
    const graceAdminRole = await prisma.role.create({
      data: { tenantId: tenantGraceId, name: 'Admin', isCustom: false },
    });
    if (settingsPerm) {
      await prisma.rolePermission.create({
        data: { roleId: graceAdminRole.id, permissionId: settingsPerm.id },
      });
    }

    const passHash = await bcrypt.hash('password123', 12);
    const graceAdmin = await prisma.user.create({
      data: { tenantId: tenantGraceId, email: 'admin@grace.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: graceAdmin.id, roleId: graceAdminRole.id },
    });

    graceToken = jwt.sign(
      { userId: graceAdmin.id, tenantId: tenantGraceId, email: graceAdmin.email },
      JWT_SECRET
    );

    // 5. Create a shared system theme (tenantId: null)
    const systemTheme = await prisma.theme.create({
      data: {
        name: 'System Default Light',
        settings: JSON.stringify({ primaryColor: '#3b82f6', font: 'Inter' }),
        isCustom: false,
      },
    });
    themeId = systemTheme.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. MODULE ENTITLEMENTS GATING
  // ─────────────────────────────────────────────────────────────
  describe('Module Entitlements Gating (requireModule)', () => {
    it('should block CMS API access if website-cms module is NOT active', async () => {
      const res = await request(app)
        .post('/api/cms/websites')
        .set('x-tenant-id', tenantGraceId)
        .set('Authorization', `Bearer ${graceToken}`)
        .send({
          title: 'Grace Church Website',
          themeId,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Module not activated');
      expect(res.body.moduleKey).toBe('website-cms');
    });

    it('should allow CMS API access once website-cms is set to Active', async () => {
      // Activate the module for Tenant Grace
      await prisma.tenantModule.create({
        data: {
          tenantId: tenantGraceId,
          moduleKey: 'website-cms',
          status: 'active',
        },
      });

      const res = await request(app)
        .post('/api/cms/websites')
        .set('x-tenant-id', tenantGraceId)
        .set('Authorization', `Bearer ${graceToken}`)
        .send({
          title: 'Grace Church Website',
          themeId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Grace Church Website');
      graceWebsiteId = res.body.data.id;
    });

    it('should block CMS API access if website-cms is suspended', async () => {
      // Suspend the module subscription
      await prisma.tenantModule.update({
        where: {
          tenantId_moduleKey: { tenantId: tenantGraceId, moduleKey: 'website-cms' },
        },
        data: { status: 'suspended' },
      });

      const res = await request(app)
        .post('/api/cms/pages')
        .set('x-tenant-id', tenantGraceId)
        .set('Authorization', `Bearer ${graceToken}`)
        .send({
          websiteId: graceWebsiteId,
          slug: 'about',
          title: 'About Us',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Module suspended');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. DNS DOMAIN RESOLUTION (SUBDOMAINS & CUSTOM DOMAINS)
  // ─────────────────────────────────────────────────────────────
  describe('DNS & Domain Routing', () => {
    beforeAll(async () => {
      // Re-activate website-cms module for Grace
      await prisma.tenantModule.update({
        where: {
          tenantId_moduleKey: { tenantId: tenantGraceId, moduleKey: 'website-cms' },
        },
        data: { status: 'active' },
      });

      // Activate website-cms for Hope
      await prisma.tenantModule.create({
        data: {
          tenantId: tenantHopeId,
          moduleKey: 'website-cms',
          status: 'active',
        },
      });

      // Create primary website for Tenant Hope
      const hopeWebsite = await prisma.website.create({
        data: {
          tenantId: tenantHopeId,
          themeId,
          title: 'Hope Chapel Site',
          isActive: true,
        },
      });
      hopeWebsiteId = hopeWebsite.id;

      // Create a published home page for Grace (slug: "")
      const blocks = [{ type: 'hero', title: 'Welcome to Grace' }];
      const graceHome = await prisma.page.create({
        data: {
          tenantId: tenantGraceId,
          websiteId: graceWebsiteId,
          slug: '',
          title: 'Grace Home',
          content: JSON.stringify(blocks),
          status: 'published',
          isHome: true,
        },
      });
      pagePublishedId = graceHome.id;

      // Create a published home page for Hope (slug: "")
      const hopeHome = await prisma.page.create({
        data: {
          tenantId: tenantHopeId,
          websiteId: hopeWebsiteId,
          slug: '',
          title: 'Hope Home',
          content: JSON.stringify([{ type: 'hero', title: 'Welcome to Hope' }]),
          status: 'published',
          isHome: true,
        },
      });
    });

    it('should resolve Grace website via subdomain host header', async () => {
      const res = await request(app)
        .get('/api/cms/render')
        .set('Host', 'grace.churchos.local'); // Simulates grace subdomain public request

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Grace Home');
      expect(res.body.data.contentBlocks[0].title).toBe('Welcome to Grace');
    });

    it('should resolve Hope website via subdomain host header', async () => {
      const res = await request(app)
        .get('/api/cms/render')
        .set('Host', 'hope.churchos.local');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Hope Home');
      expect(res.body.data.contentBlocks[0].title).toBe('Welcome to Hope');
    });

    it('should resolve website via custom domain host header mapping', async () => {
      // Map custom domain to Grace website
      await prisma.website.update({
        where: { id: graceWebsiteId },
        data: { domain: 'mygracechurch.org' },
      });

      const res = await request(app)
        .get('/api/cms/render')
        .set('Host', 'mygracechurch.org');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Grace Home');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. CMS RENDER GATING (DRAFT VS PUBLISHED)
  // ─────────────────────────────────────────────────────────────
  describe('CMS Gating (Draft vs Published)', () => {
    beforeAll(async () => {
      // Create a draft page for Grace website (slug: "devotionals")
      const draft = await prisma.page.create({
        data: {
          tenantId: tenantGraceId,
          websiteId: graceWebsiteId,
          slug: 'devotionals',
          title: 'Daily Devotionals',
          content: JSON.stringify([{ type: 'text', content: 'Today we discuss faith' }]),
          status: 'draft',
        },
      });
      pageDraftId = draft.id;
    });

    it('should hide draft pages from public rendering endpoint', async () => {
      const res = await request(app)
        .get('/api/cms/render?slug=devotionals')
        .set('Host', 'grace.churchos.local');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Page not found');
    });

    it('should return page successfully once page is published', async () => {
      // Publish the page
      await request(app)
        .patch(`/api/cms/pages/${pageDraftId}`)
        .set('x-tenant-id', tenantGraceId)
        .set('Authorization', `Bearer graceToken`)
        .set('Authorization', `Bearer ${graceToken}`)
        .send({ status: 'published' });

      const res = await request(app)
        .get('/api/cms/render?slug=devotionals')
        .set('Host', 'grace.churchos.local');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Daily Devotionals');
      expect(res.body.data.contentBlocks[0].content).toBe('Today we discuss faith');
    });
  });
});
