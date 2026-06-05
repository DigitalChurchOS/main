import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Dynamic Blog & Publishing Engine Module CRUD, Isolation, Settings & Reports', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;
  let otherTenantId: string;
  let otherAdminToken: string;
  let otherAdminUserId: string;

  beforeAll(async () => {
    // 1. Clear database tables
    await prisma.dynamicBlogPublishingEngineModuleActivity.deleteMany({});
    await prisma.dynamicBlogPublishingEngineModuleSettings.deleteMany({});
    await prisma.dynamicBlogPublishingEngineModule.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenants
    const tenant = await prisma.tenant.create({
      data: { name: 'Alpha Church Blog', subdomain: 'alpha-blog', status: 'active' },
    });
    tenantId = tenant.id;

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Beta Church Blog', subdomain: 'beta-blog', status: 'active' },
    });
    otherTenantId = otherTenant.id;

    // 3. Register Module definition
    await prisma.moduleDefinition.upsert({
      where: { key: 'dynamic-blog-publishing-engine' },
      update: {},
      create: { key: 'dynamic-blog-publishing-engine', name: 'Dynamic Blog & Publishing Engine', category: 'Media', dependencies: '[]' },
    });

    // 4. Activate Modules for both tenants
    await prisma.tenantModule.createMany({
      data: [
        { tenantId, moduleKey: 'dynamic-blog-publishing-engine', status: 'active', billingRule: 'free' },
        { tenantId: otherTenantId, moduleKey: 'dynamic-blog-publishing-engine', status: 'active', billingRule: 'free' },
      ],
    });

    // 5. Seed Permissions
    const permKeys = [
      'tenant.settings',
      'dynamic-blog-publishing-engine.read',
      'dynamic-blog-publishing-engine.create',
      'dynamic-blog-publishing-engine.update',
      'dynamic-blog-publishing-engine.delete',
      'dynamic-blog-publishing-engine.manage_settings',
      'dynamic-blog-publishing-engine.view_reports',
    ];

    const permissions: any[] = [];
    for (const key of permKeys) {
      let p = await prisma.permission.findFirst({ where: { name: key } });
      if (!p) {
        p = await prisma.permission.create({ data: { name: key, description: `Dynamic ${key}` } });
      }
      permissions.push(p);
    }

    // 6. Create Roles
    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Guest', isCustom: true },
    });

    const otherAdminRole = await prisma.role.create({
      data: { tenantId: otherTenantId, name: 'Admin', isCustom: false },
    });

    // Add permissions to Roles
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: otherAdminRole.id, permissionId: p.id })),
    });

    // Members get read-only access
    const memberPerms = permissions.filter((p) => ['dynamic-blog-publishing-engine.read'].includes(p.name));
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    // 7. Create Users & generate tokens
    const passHash = await bcrypt.hash('password123', 12);
    
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@alpha-blog.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@alpha-blog.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;

    const otherAdminUser = await prisma.user.create({
      data: { tenantId: otherTenantId, email: 'admin@beta-blog.com', passwordHash: passHash },
    });
    otherAdminUserId = otherAdminUser.id;

    // Map user roles
    await prisma.userRole.createMany({
      data: [
        { userId: adminUserId, roleId: adminRole.id },
        { userId: memberUserId, roleId: memberRole.id },
        { userId: otherAdminUserId, roleId: otherAdminRole.id },
      ],
    });

    // Generate JWT Tokens
    adminToken = jwt.sign({ userId: adminUserId, tenantId }, JWT_SECRET);
    memberToken = jwt.sign({ userId: memberUserId, tenantId }, JWT_SECRET);
    otherAdminToken = jwt.sign({ userId: otherAdminUserId, tenantId: otherTenantId }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Blog Profiles / Channels CRUD & Tenant Isolation', () => {
    let profileId: string;

    it('should allow admin to create a blog profile', async () => {
      const res = await request(app)
        .post('/api/dynamic-blog-publishing-engine')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Daily Devotionals Channel',
          description: 'Faith building teachings published daily.',
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('Daily Devotionals Channel');
      expect(res.body.data.tenantId).toBe(tenantId);
      profileId = res.body.data.id;
    });

    it('should block non-admins from creating a blog profile', async () => {
      const res = await request(app)
        .post('/api/dynamic-blog-publishing-engine')
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Unauthorized Blog Profile',
        });

      expect(res.status).toBe(403);
    });

    it('should list only the tenant-isolated blog profiles', async () => {
      // Create a profile in Tenant Beta
      await prisma.dynamicBlogPublishingEngineModule.create({
        data: {
          tenantId: otherTenantId,
          title: 'Beta Announcements',
          status: 'active',
        },
      });

      // Query listings on Tenant Alpha
      const resAlpha = await request(app)
        .get('/api/dynamic-blog-publishing-engine')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resAlpha.status).toBe(200);
      expect(resAlpha.body.data).toHaveLength(1);
      expect(resAlpha.body.data[0].title).toBe('Daily Devotionals Channel');

      // Query listings on Tenant Beta
      const resBeta = await request(app)
        .get('/api/dynamic-blog-publishing-engine')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .set('x-tenant-id', otherTenantId);

      expect(resBeta.status).toBe(200);
      expect(resBeta.body.data).toHaveLength(1);
      expect(resBeta.body.data[0].title).toBe('Beta Announcements');
    });

    it('should enforce tenant isolation when fetching a blog profile detail', async () => {
      // Attempt to fetch Alpha's profile using Beta's credentials
      const res = await request(app)
        .get(`/api/dynamic-blog-publishing-engine/${profileId}`)
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .set('x-tenant-id', otherTenantId);

      expect(res.status).toBe(404);
    });

    it('should allow admin to update a blog profile details', async () => {
      const res = await request(app)
        .patch(`/api/dynamic-blog-publishing-engine/${profileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Updated Daily Devotionals Title',
          status: 'inactive',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Daily Devotionals Title');
      expect(res.body.data.status).toBe('inactive');
    });

    it('should allow admin to delete a blog profile config', async () => {
      const res = await request(app)
        .delete(`/api/dynamic-blog-publishing-engine/${profileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);

      // Confirm deletion
      const checkGet = await request(app)
        .get(`/api/dynamic-blog-publishing-engine/${profileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(checkGet.status).toBe(404);
    });
  });

  describe('Central Settings Configurations Schema Logic', () => {
    it('should return default settings if no custom settings exist yet', async () => {
      const res = await request(app)
        .get('/api/dynamic-blog-publishing-engine/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.billingPlan).toBe('free');
      expect(res.body.data.providerMode).toBe('bring_your_own');
    });

    it('should allow updating settings with valid parameters', async () => {
      const res = await request(app)
        .patch('/api/dynamic-blog-publishing-engine/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          enabled: false,
          billingPlan: 'premium',
          providerMode: 'platform_managed',
          configJson: {
            enableMultipleBlogs: false,
            enableComments: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(false);
      expect(res.body.data.billingPlan).toBe('premium');
      expect(res.body.data.providerMode).toBe('platform_managed');

      const parsedConfig = JSON.parse(res.body.data.configJson);
      expect(parsedConfig.enableMultipleBlogs).toBe(false);
      expect(parsedConfig.enableComments).toBe(false);
    });

    it('should throw validation error for invalid settings options', async () => {
      const resInvalidPlan = await request(app)
        .patch('/api/dynamic-blog-publishing-engine/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          billingPlan: 'enterprise-custom-tier',
        });

      expect(resInvalidPlan.status).toBe(400);

      const resInvalidMode = await request(app)
        .patch('/api/dynamic-blog-publishing-engine/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          providerMode: 'invalid_mode',
        });

      expect(resInvalidMode.status).toBe(400);
    });
  });

  describe('Overview Statistics compiling and Reports audit trail logs', () => {
    it('should automatically record audit activity logs for critical operations', async () => {
      // Re-trigger an activation to generate activity logs
      await request(app)
        .post('/api/dynamic-blog-publishing-engine')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Logging Test Devotionals',
        });

      const resLogs = await request(app)
        .get('/api/dynamic-blog-publishing-engine/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resLogs.status).toBe(200);
      expect(resLogs.body.data).toBeDefined();
      expect(resLogs.body.data.length).toBeGreaterThanOrEqual(1);
      expect(resLogs.body.data[0].actionType).toBe('create_profile');
    });

    it('should compile aggregated metrics and active profiles list for dashboard overview feed', async () => {
      const resOverview = await request(app)
        .get('/api/dynamic-blog-publishing-engine/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resOverview.status).toBe(200);
      expect(resOverview.body.data).toBeDefined();
      expect(resOverview.body.data.counts).toBeDefined();
      expect(resOverview.body.data.counts.profilesCount).toBe(1);
      expect(resOverview.body.data.profiles).toHaveLength(1);
      expect(resOverview.body.data.recentActivity).toBeDefined();
      expect(resOverview.body.data.settings).toBeDefined();
    });
  });
});
