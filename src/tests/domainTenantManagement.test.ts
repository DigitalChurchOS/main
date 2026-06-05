import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Domain & Tenant Management Module CRUD & Entitlements', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;
  let otherTenantId: string;
  let otherAdminToken: string;
  let otherAdminUserId: string;

  beforeAll(async () => {
    // 1. Clear tables
    await prisma.domainTenantManagementModuleActivity.deleteMany({});
    await prisma.domainTenantManagementModuleSettings.deleteMany({});
    await prisma.domainTenantManagementModule.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenants
    const tenant = await prisma.tenant.create({
      data: { name: 'Alpha Church', subdomain: 'alpha-church', status: 'active' },
    });
    tenantId = tenant.id;

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Beta Church', subdomain: 'beta-church', status: 'active' },
    });
    otherTenantId = otherTenant.id;

    // 3. Register Module definitions
    await prisma.moduleDefinition.upsert({
      where: { key: 'domain-tenant-management' },
      update: {},
      create: { key: 'domain-tenant-management', name: 'Church Details', category: 'Core', dependencies: '[]' },
    });

    // 4. Activate Modules for both tenants
    await prisma.tenantModule.createMany({
      data: [
        { tenantId, moduleKey: 'domain-tenant-management', status: 'active', billingRule: 'free' },
        { tenantId: otherTenantId, moduleKey: 'domain-tenant-management', status: 'active', billingRule: 'free' },
      ],
    });

    // 5. Seed Permissions
    const permKeys = [
      'tenant.settings',
      'domain-tenant-management.read',
      'domain-tenant-management.create',
      'domain-tenant-management.update',
      'domain-tenant-management.delete',
      'domain-tenant-management.manage_settings',
      'domain-tenant-management.view_reports',
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
    const memberPerms = permissions.filter((p) => ['domain-tenant-management.read'].includes(p.name));
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    // 7. Create Users & generate tokens
    const passHash = await bcrypt.hash('password123', 12);
    
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@alpha-church.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@alpha-church.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;

    const otherAdminUser = await prisma.user.create({
      data: { tenantId: otherTenantId, email: 'admin@beta-church.com', passwordHash: passHash },
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

  describe('Module Configuration Profile CRUD & Tenant Isolation', () => {
    let profileId: string;

    it('should allow admin to create a domain-tenant-management module profile', async () => {
      const res = await request(app)
        .post('/api/domain-tenant-management')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Grace Fellowship Primary Workspace',
          description: 'Production workspace for local mappings.',
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('Grace Fellowship Primary Workspace');
      expect(res.body.data.tenantId).toBe(tenantId);
      profileId = res.body.data.id;
    });

    it('should block non-admins from creating a workspace profile', async () => {
      const res = await request(app)
        .post('/api/domain-tenant-management')
        .set('Authorization', `Bearer ${memberToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Unauthorized Profile',
        });

      expect(res.status).toBe(403);
    });

    it('should list only the tenant-isolated module profiles', async () => {
      // Create a profile in Tenant Beta
      await prisma.domainTenantManagementModule.create({
        data: {
          tenantId: otherTenantId,
          title: 'Beta Church Workspace Profile',
          status: 'active',
        },
      });

      // Query listings on Tenant Alpha
      const resAlpha = await request(app)
        .get('/api/domain-tenant-management')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resAlpha.status).toBe(200);
      expect(resAlpha.body.data).toHaveLength(1);
      expect(resAlpha.body.data[0].title).toBe('Grace Fellowship Primary Workspace');

      // Query listings on Tenant Beta
      const resBeta = await request(app)
        .get('/api/domain-tenant-management')
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .set('x-tenant-id', otherTenantId);

      expect(resBeta.status).toBe(200);
      expect(resBeta.body.data).toHaveLength(1);
      expect(resBeta.body.data[0].title).toBe('Beta Church Workspace Profile');
    });

    it('should enforce tenant isolation when fetching a profile', async () => {
      // Attempt to fetch Alpha\'s profile using Beta\'s token
      const res = await request(app)
        .get(`/api/domain-tenant-management/${profileId}`)
        .set('Authorization', `Bearer ${otherAdminToken}`)
        .set('x-tenant-id', otherTenantId);

      expect(res.status).toBe(404);
    });

    it('should allow admin to update a module profile', async () => {
      const res = await request(app)
        .patch(`/api/domain-tenant-management/${profileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Fully Updated Workspace Profile',
          status: 'inactive',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Fully Updated Workspace Profile');
      expect(res.body.data.status).toBe('inactive');
    });

    it('should allow admin to delete a module profile', async () => {
      const res = await request(app)
        .delete(`/api/domain-tenant-management/${profileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);

      // Confirm deleted
      const confirmGet = await request(app)
        .get(`/api/domain-tenant-management/${profileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(confirmGet.status).toBe(404);
    });
  });

  describe('Centralized Settings and Configurations Schema Validation', () => {
    it('should return default settings when no custom configuration exists', async () => {
      const res = await request(app)
        .get('/api/domain-tenant-management/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.billingPlan).toBe('free');
      expect(res.body.data.providerMode).toBe('bring_your_own');
    });

    it('should allow updating settings with valid parameters', async () => {
      const res = await request(app)
        .patch('/api/domain-tenant-management/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          enabled: false,
          billingPlan: 'platform',
          providerMode: 'marketplace',
          configJson: {
            allowCustomDomains: false,
            enableAutoSsl: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(false);
      expect(res.body.data.billingPlan).toBe('platform');
      expect(res.body.data.providerMode).toBe('marketplace');

      const parsedConfig = JSON.parse(res.body.data.configJson);
      expect(parsedConfig.allowCustomDomains).toBe(false);
      expect(parsedConfig.enableAutoSsl).toBe(false);
    });

    it('should block updates with invalid billing plan or provider mode parameters', async () => {
      const resInvalidPlan = await request(app)
        .patch('/api/domain-tenant-management/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          billingPlan: 'invalid-plan-tier',
        });

      expect(resInvalidPlan.status).toBe(400);

      const resInvalidMode = await request(app)
        .patch('/api/domain-tenant-management/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          providerMode: 'invalid-mode',
        });

      expect(resInvalidMode.status).toBe(400);
    });
  });

  describe('Audit Activity Logs and Overview Data Feed', () => {
    it('should record audit activities for critical operations', async () => {
      // Re-trigger an activation to generate activity logs
      await request(app)
        .post('/api/domain-tenant-management')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Logging Audit Workspace',
        });

      const resLogs = await request(app)
        .get('/api/domain-tenant-management/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resLogs.status).toBe(200);
      expect(resLogs.body.data).toBeDefined();
      expect(resLogs.body.data.length).toBeGreaterThanOrEqual(1);
      expect(resLogs.body.data[0].actionType).toBe('create_profile');
    });

    it('should return aggregated metrics inside dashboard overview feed', async () => {
      const resOverview = await request(app)
        .get('/api/domain-tenant-management/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('x-tenant-id', tenantId);

      expect(resOverview.status).toBe(200);
      expect(resOverview.body.data).toBeDefined();
      expect(resOverview.body.data.counts).toBeDefined();
      expect(resOverview.body.data.checklist).toBeDefined();
      expect(resOverview.body.data.domain).toBeDefined();
      expect(resOverview.body.data.branding).toBeDefined();
    });
  });
});
