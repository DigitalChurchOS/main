import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Developer Marketplace Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;
  let otherTenantId: string;
  let otherAdminToken: string;
  let otherAdminUserId: string;

  beforeAll(async () => {
    // 1. Clear tables in correct order
    await prisma.developerMarketplaceModuleActivity.deleteMany({});
    await prisma.developerMarketplaceModuleSettings.deleteMany({});
    await prisma.developerMarketplaceModule.deleteMany({});
    await prisma.assetPurchase.deleteMany({});
    await prisma.assetFeedback.deleteMany({});
    await prisma.submissionReview.deleteMany({});
    await prisma.assetSubmission.deleteMany({});
    await prisma.marketplaceAsset.deleteMany({});
    await prisma.developerProfile.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenants
    const tenant = await prisma.tenant.create({
      data: { name: 'Alpha Dev Church', subdomain: 'alpha-dev', status: 'active' },
    });
    tenantId = tenant.id;

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Beta Dev Church', subdomain: 'beta-dev', status: 'active' },
    });
    otherTenantId = otherTenant.id;

    // 3. Register Module definitions
    await prisma.moduleDefinition.upsert({
      where: { key: 'developer-marketplace' },
      update: { name: 'Developer Marketplace', category: 'Admin', dependencies: '[]' },
      create: { key: 'developer-marketplace', name: 'Developer Marketplace', category: 'Admin', dependencies: '[]' },
    });

    // 4. Activate Modules for both tenants
    await prisma.tenantModule.createMany({
      data: [
        { tenantId, moduleKey: 'developer-marketplace', status: 'active', billingRule: 'free' },
        { tenantId: otherTenantId, moduleKey: 'developer-marketplace', status: 'active', billingRule: 'free' },
      ],
    });

    // 5. Seed Permissions
    const permKeys = [
      'member.read',
      'tenant.settings',
      'developer-marketplace.read',
      'developer-marketplace.create',
      'developer-marketplace.update',
      'developer-marketplace.delete',
      'developer-marketplace.manage_settings',
      'developer-marketplace.view_reports',
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
    const memberPerms = permissions.filter((p) => ['member.read', 'developer-marketplace.read'].includes(p.name));
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    // 7. Create Users & generate tokens
    const passHash = await bcrypt.hash('password123', 12);
    
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@alpha-dev.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@alpha-dev.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;

    const otherAdminUser = await prisma.user.create({
      data: { tenantId: otherTenantId, email: 'admin@beta-dev.com', passwordHash: passHash },
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
    // Teardown database connections
    await prisma.$disconnect();
  });

  describe('Module Configuration Profile CRUD & Tenant Isolation', () => {
    let moduleId: string;

    it('should allow admin to create a Developer Marketplace module profile', async () => {
      const res = await request(app)
        .post('/api/developer-marketplace')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Custom Plugins Marketplace',
          description: 'Custom portal enabling approved extensions.',
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('Custom Plugins Marketplace');
      expect(res.body.data.tenantId).toBe(tenantId);
      moduleId = res.body.data.id;
    });

    it('should block non-admins from creating a module profile', async () => {
      const res = await request(app)
        .post('/api/developer-marketplace')
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Hacker Store',
        });

      expect(res.status).toBe(403);
    });

    it('should list only the tenant-isolated module profiles', async () => {
      // Create a profile in Tenant Beta
      await prisma.developerMarketplaceModule.create({
        data: {
          tenantId: otherTenantId,
          title: 'Beta Internal Store',
          status: 'active',
        },
      });

      // Query listings on Tenant Alpha
      const resAlpha = await request(app)
        .get('/api/developer-marketplace')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resAlpha.status).toBe(200);
      expect(resAlpha.body.data).toHaveLength(1);
      expect(resAlpha.body.data[0].title).toBe('Custom Plugins Marketplace');

      // Query listings on Tenant Beta
      const resBeta = await request(app)
        .get('/api/developer-marketplace')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .set('x-tenant-id', otherTenantId);

      expect(resBeta.status).toBe(200);
      expect(resBeta.body.data).toHaveLength(1);
      expect(resBeta.body.data[0].title).toBe('Beta Internal Store');
    });

    it('should enforce tenant isolation when fetching a profile', async () => {
      // Attempt to fetch Alpha\'s profile using Beta\'s token
      const res = await request(app)
        .get(`/api/developer-marketplace/${moduleId}`)
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .set('x-tenant-id', otherTenantId);

      expect(res.status).toBe(404);
    });

    it('should allow admin to update a module profile', async () => {
      const res = await request(app)
        .patch(`/api/developer-marketplace/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Fully Updated Marketplace Portal',
          status: 'inactive',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Fully Updated Marketplace Portal');
      expect(res.body.data.status).toBe('inactive');
    });

    it('should allow admin to delete a module profile', async () => {
      const res = await request(app)
        .delete(`/api/developer-marketplace/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);

      // Confirm deleted
      const confirmGet = await request(app)
        .get(`/api/developer-marketplace/${moduleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(confirmGet.status).toBe(404);
    });
  });

  describe('Centralized Settings and Configurations Schema Validation', () => {
    it('should return default settings when no custom configuration exists', async () => {
      const res = await request(app)
        .get('/api/developer-marketplace/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.billingPlan).toBe('free');
      expect(res.body.data.providerMode).toBe('bring_your_own');
    });

    it('should allow updating settings with valid parameters', async () => {
      const res = await request(app)
        .patch('/api/developer-marketplace/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          enabled: false,
          billingPlan: 'platform',
          providerMode: 'marketplace',
          configJson: {
            allowThirdPartyDevelopers: false,
            revenueShareSplit: 45,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(false);
      expect(res.body.data.billingPlan).toBe('platform');
      expect(res.body.data.providerMode).toBe('marketplace');

      const parsedConfig = JSON.parse(res.body.data.configJson);
      expect(parsedConfig.allowThirdPartyDevelopers).toBe(false);
      expect(parsedConfig.revenueShareSplit).toBe(45);
    });

    it('should block updates with invalid billing plan or provider mode parameters', async () => {
      const resInvalidPlan = await request(app)
        .patch('/api/developer-marketplace/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          billingPlan: 'unsupported-plan-tier',
        });

      expect(resInvalidPlan.status).toBe(400);

      const resInvalidMode = await request(app)
        .patch('/api/developer-marketplace/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          providerMode: 'invalid-provider-mode',
        });

      expect(resInvalidMode.status).toBe(400);
    });
  });

  describe('Audit Activity Logs and Overview Data Feed', () => {
    it('should record audit activities for critical operations', async () => {
      // Re-trigger an activation to generate activity logs
      await request(app)
        .post('/api/developer-marketplace')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Audit Logging Test Store',
        });

      const resLogs = await request(app)
        .get('/api/developer-marketplace/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resLogs.status).toBe(200);
      expect(resLogs.body.data).toBeDefined();
      expect(resLogs.body.data.length).toBeGreaterThanOrEqual(1);
      expect(resLogs.body.data[0].actionType).toBe('activate_module');
    });

    it('should return aggregated metrics inside dashboard overview feed', async () => {
      const resOverview = await request(app)
        .get('/api/developer-marketplace/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resOverview.status).toBe(200);
      expect(resOverview.body.data).toBeDefined();
      expect(resOverview.body.data.counts).toBeDefined();
      expect(resOverview.body.data.financials).toBeDefined();
      expect(resOverview.body.data.submissions).toBeDefined();
      expect(resOverview.body.data.sandboxes).toBeDefined();
    });
  });
});
