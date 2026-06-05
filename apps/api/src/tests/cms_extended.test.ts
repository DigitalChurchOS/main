import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS CMS Extended Module - Revisions, Menus, Footers & Blocks', () => {
  let tenantId: string;
  let unauthorizedTenantId: string;
  let adminToken: string;
  let unauthorizedToken: string;
  
  let websiteId: string;
  let themeId: string;
  let testPageId: string;

  beforeAll(async () => {
    // 1. Clean up CMS database models
    await prisma.cmsActivityLog.deleteMany({});
    await prisma.pageRevision.deleteMany({});
    await prisma.navigationMenu.deleteMany({});
    await prisma.cmsFooter.deleteMany({});
    await prisma.reusableBlock.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant Grace
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Community Church', subdomain: 'gracechurch', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Tenant Hope (for unauthorized / cross-tenant testing)
    const otherTenant = await prisma.tenant.create({
      data: { name: 'Hope Chapel', subdomain: 'hopechurch', status: 'active' },
    });
    unauthorizedTenantId = otherTenant.id;

    // 4. Create permissions and roles for Tenant Grace
    const settingsPerm = await prisma.permission.upsert({
      where: { name: 'tenant.settings' },
      update: {},
      create: { name: 'tenant.settings', description: 'Settings' },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: settingsPerm.id },
    });

    const passHash = await bcrypt.hash('secret123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@gracechurch.org', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // 5. Create unauthorized user (member role, no settings permission)
    const unauthorizedUser = await prisma.user.create({
      data: { tenantId, email: 'user@gracechurch.org', passwordHash: passHash },
    });
    // NO settings permissions assigned
    unauthorizedToken = jwt.sign(
      { userId: unauthorizedUser.id, tenantId, email: unauthorizedUser.email },
      JWT_SECRET
    );

    // 6. Activate website-cms module for both tenants
    await prisma.tenantModule.create({
      data: { tenantId, moduleKey: 'website-cms', status: 'active' },
    });
    await prisma.tenantModule.create({
      data: { tenantId: unauthorizedTenantId, moduleKey: 'website-cms', status: 'active' },
    });

    // 7. Create a theme & website for Grace
    const theme = await prisma.theme.create({
      data: { name: 'Default Dark', settings: JSON.stringify({ primary: '#6366f1' }) },
    });
    themeId = theme.id;

    const website = await prisma.website.create({
      data: { tenantId, themeId, title: 'Grace Website', isActive: true, domain: 'gracechurch.org' },
    });
    websiteId = website.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. RBAC GATE CHECKS
  // ─────────────────────────────────────────────────────────────
  describe('RBAC Access Control', () => {
    it('should block administrative requests if the user lacks settings permissions', async () => {
      const res = await request(app)
        .post('/api/cms/pages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({
          websiteId,
          title: 'Unauthorized Page',
          slug: 'unauthorized',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PAGES CRUD & REVISIONS ENGINE
  // ─────────────────────────────────────────────────────────────
  describe('Pages Revisions & Audit Logging', () => {
    it('should create a page, generate the first revision, and log the activity', async () => {
      const res = await request(app)
        .post('/api/cms/pages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          websiteId,
          title: 'Ministries',
          slug: 'ministries',
          content: [{ type: 'text', content: 'Our Youth group is amazing!' }],
          seoTitle: 'Our Ministries | Grace Church',
          seoDescription: 'Find your place to connect and serve.',
          seoKeywords: 'grace, youth, kids, women, men'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Ministries');
      expect(res.body.data.seoTitle).toBe('Our Ministries | Grace Church');
      testPageId = res.body.data.id;

      // Assert first revision exists
      const revision = await prisma.pageRevision.findFirst({
        where: { pageId: testPageId },
      });
      expect(revision).toBeDefined();
      expect(revision!.version).toBe(1);
      expect(JSON.parse(revision!.content)).toEqual([{ type: 'text', content: 'Our Youth group is amazing!' }]);

      // Assert audit log exists
      const log = await prisma.cmsActivityLog.findFirst({
        where: { pageId: testPageId, actionType: 'page_create' },
      });
      expect(log).toBeDefined();
    });

    it('should update page content, generate version 2, and log activity', async () => {
      const res = await request(app)
        .patch(`/api/cms/pages/${testPageId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: [{ type: 'text', content: 'Our Youth group is spectacular!' }],
          seoTitle: 'Ministries updated'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.seoTitle).toBe('Ministries updated');

      // Assert version 2 revision exists
      const revision = await prisma.pageRevision.findFirst({
        where: { pageId: testPageId, version: 2 },
      });
      expect(revision).toBeDefined();
      expect(JSON.parse(revision!.content)).toEqual([{ type: 'text', content: 'Our Youth group is spectacular!' }]);

      // Assert activity log exists
      const log = await prisma.cmsActivityLog.findFirst({
        where: { pageId: testPageId, actionType: 'page_update' },
      });
      expect(log).toBeDefined();
    });

    it('should fetch revision list for the page', async () => {
      const res = await request(app)
        .get(`/api/cms/pages/${testPageId}/revisions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].version).toBe(2);
      expect(res.body.data[1].version).toBe(1);
    });

    it('should rollback page content to version 1, creating a new revision version 3', async () => {
      const revisions = await prisma.pageRevision.findMany({
        where: { pageId: testPageId },
        orderBy: { version: 'asc' },
      });
      const v1 = revisions[0];

      const res = await request(app)
        .post(`/api/cms/pages/${testPageId}/rollback`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ revisionId: v1.id });

      expect(res.status).toBe(200);
      expect(JSON.parse(res.body.data.content)).toEqual([{ type: 'text', content: 'Our Youth group is amazing!' }]);

      // Verify revision 3 exists
      const v3 = await prisma.pageRevision.findFirst({
        where: { pageId: testPageId, version: 3 },
      });
      expect(v3).toBeDefined();
      expect(JSON.parse(v3!.content)).toEqual([{ type: 'text', content: 'Our Youth group is amazing!' }]);

      // Verify activity logs
      const log = await prisma.cmsActivityLog.findFirst({
        where: { pageId: testPageId, actionType: 'page_rollback' },
      });
      expect(log).toBeDefined();
    });

    it('should cap revision history size to maximum 15 items', async () => {
      // Create 15 more updates to page content to trigger revisions eviction
      for (let i = 4; i <= 18; i++) {
        await request(app)
          .patch(`/api/cms/pages/${testPageId}`)
          .set('x-tenant-id', tenantId)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            content: [{ type: 'text', content: `Revision v${i} content` }],
          });
      }

      // Check count of page revisions in database
      const count = await prisma.pageRevision.count({
        where: { pageId: testPageId },
      });
      expect(count).toBe(15);

      // Check that version 1 and 2 are evicted (oldest version kept should be 4)
      const oldestKept = await prisma.pageRevision.findFirst({
        where: { pageId: testPageId },
        orderBy: { version: 'asc' },
      });
      expect(oldestKept!.version).toBe(4);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. NAVIGATION BUILDER API
  // ─────────────────────────────────────────────────────────────
  describe('Navigation Menu Builder', () => {
    let menuId: string;

    it('should create a navigation menu, enforce tenant isolation, and log activity', async () => {
      const res = await request(app)
        .post('/api/cms/navigation')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          websiteId,
          name: 'Main Menu',
          items: [{ label: 'Home', url: '/' }, { label: 'Ministries', url: '/ministries' }],
          isActive: true
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Main Menu');
      menuId = res.body.data.id;

      // Verify activity log
      const log = await prisma.cmsActivityLog.findFirst({
        where: { actionType: 'navigation_update' },
      });
      expect(log).toBeDefined();
    });

    it('should list navigation menus', async () => {
      const res = await request(app)
        .get('/api/cms/navigation')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Main Menu');
    });

    it('should enforce tenant isolation on navigation listing', async () => {
      // Query menu from cross-tenant context
      const res = await request(app)
        .get('/api/cms/navigation')
        .set('x-tenant-id', unauthorizedTenantId)
        .set('Authorization', `Bearer ${adminToken}`); // using same token but cross-tenant header

      expect(res.status).toBe(403); // token tenant mismatch block
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. FOOTER BUILDER API
  // ─────────────────────────────────────────────────────────────
  describe('Cms Footer Builder', () => {
    it('should save the footer configuration, resolve it, and log activity', async () => {
      const res = await request(app)
        .post('/api/cms/footer')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          websiteId,
          copyrightText: '&copy; 2026 Grace Community Church',
          socialLinks: [{ name: 'facebook', url: 'https://fb.com/grace' }],
          secondaryLinks: [{ label: 'Giving', url: '/give' }]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.copyrightText).toBe('&copy; 2026 Grace Community Church');

      // Verify audit logs
      const log = await prisma.cmsActivityLog.findFirst({
        where: { actionType: 'footer_update' },
      });
      expect(log).toBeDefined();
    });

    it('should fetch the footer configuration', async () => {
      const res = await request(app)
        .get(`/api/cms/footer?websiteId=${websiteId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.copyrightText).toBe('&copy; 2026 Grace Community Church');
      expect(JSON.parse(res.body.data.socialLinks)).toEqual([{ name: 'facebook', url: 'https://fb.com/grace' }]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. REUSABLE BLOCKS API
  // ─────────────────────────────────────────────────────────────
  describe('Reusable Blocks Catalog', () => {
    let blockId: string;

    it('should register a reusable block and enforce duplicate key checks', async () => {
      const res = await request(app)
        .post('/api/cms/reusable-blocks')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sunday Signup Banner',
          key: 'sunday-signup',
          content: { type: 'hero', title: 'Sign up for Sunday!' }
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Sunday Signup Banner');
      blockId = res.body.data.id;

      // Duplicate key registration block
      const dupeRes = await request(app)
        .post('/api/cms/reusable-blocks')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Banner',
          key: 'sunday-signup',
          content: { type: 'text', content: 'Duplicated key' }
        });

      expect(dupeRes.status).toBe(409);
    });

    it('should edit the reusable block', async () => {
      const res = await request(app)
        .patch(`/api/cms/reusable-blocks/${blockId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Signup Banner'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Signup Banner');
    });

    it('should list all reusable blocks for the tenant', async () => {
      const res = await request(app)
        .get('/api/cms/reusable-blocks')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].key).toBe('sunday-signup');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. PUBLIC MERGED THEME BEDROCK RENDERING
  // ─────────────────────────────────────────────────────────────
  describe('Public Render Merging Integration', () => {
    beforeAll(async () => {
      // Publish the Ministries page to make it viewable by public
      await prisma.page.update({
        where: { id: testPageId },
        data: { status: 'published', slug: 'ministries' },
      });
    });

    it('should return merged page blocks, active navigation, footer config, and SEO headers on render', async () => {
      const res = await request(app)
        .get('/api/cms/render?slug=ministries')
        .set('Host', 'gracechurch.org'); // DNS maps host header to Grace website

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Ministries');
      expect(res.body.data.seoTitle).toBe('Ministries updated');
      expect(res.body.data.seoDescription).toBe('Find your place to connect and serve.');
      
      // Verify merged navigation menu
      expect(res.body.data.navigation).toBeDefined();
      expect(res.body.data.navigation.name).toBe('Main Menu');
      expect(res.body.data.navigation.items).toEqual([{ label: 'Home', url: '/' }, { label: 'Ministries', url: '/ministries' }]);

      // Verify merged footer configuration
      expect(res.body.data.footer).toBeDefined();
      expect(res.body.data.footer.copyrightText).toBe('&copy; 2026 Grace Community Church');
      expect(res.body.data.footer.socialLinks).toEqual([{ name: 'facebook', url: 'https://fb.com/grace' }]);
    });
  });
});
