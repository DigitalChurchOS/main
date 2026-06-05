import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Super Admin Module Platform Operations', () => {
  let platformUserToken: string;
  let tenantId: string;
  let testPlanId: string;
  let platformUserId: string;

  beforeAll(async () => {
    // 1. Clean up platform admin tables
    await prisma.platformAuditLog.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.platformSetting.deleteMany({});
    await prisma.platformUser.deleteMany({});
    await prisma.platformRolePermission.deleteMany({});
    await prisma.platformRole.deleteMany({});
    await prisma.platformPermission.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});

    // 2. Create Platform Permissions
    const permRead = await prisma.platformPermission.create({
      data: { name: 'platform.read', description: 'Read platform state' }
    });
    const permWrite = await prisma.platformPermission.create({
      data: { name: 'platform.write', description: 'Write platform configurations' }
    });
    const permAdmin = await prisma.platformPermission.create({
      data: { name: 'platform.admin', description: 'Admin platform actions' }
    });

    // 3. Create Super Admin Platform Role
    const role = await prisma.platformRole.create({
      data: { name: 'Super Admin', description: 'Total system access' }
    });

    // 4. Link permissions
    await prisma.platformRolePermission.createMany({
      data: [
        { roleId: role.id, permissionId: permRead.id },
        { roleId: role.id, permissionId: permWrite.id },
        { roleId: role.id, permissionId: permAdmin.id }
      ]
    });

    // 5. Create default Platform User
    const passHash = await bcrypt.hash('Password123!', 12);
    const superUser = await prisma.platformUser.create({
      data: {
        email: 'superadmin@churchos.local',
        passwordHash: passHash,
        status: 'active',
        roleId: role.id
      }
    });
    platformUserId = superUser.id;

    // 6. Generate Platform Admin Token
    platformUserToken = jwt.sign({ platformUserId: superUser.id, email: superUser.email }, JWT_SECRET);

    // 7. Seed Subscription Plans for test
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Growth Plan',
        slug: 'growth-plan',
        basePrice: 49,
        currency: 'USD',
        billingInterval: 'month',
        includedMembers: 500,
        includedStorageGb: 100,
        includedSms: 500,
        memberOverageRate: 0.05,
        smsOverageRate: 0.02,
        storageOverageRate: 0.10
      }
    });
    testPlanId = plan.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Route Gating & Authentication', () => {
    it('should reject a request with no auth token (401)', async () => {
      const res = await request(app).get('/api/super-admin/overview');
      expect(res.status).toBe(401);
    });

    it('should reject a request with a standard tenant-level user JWT (403)', async () => {
      const tenantUserToken = jwt.sign({ userId: 'some-user', tenantId: 'some-tenant', email: 'user@tenant.org' }, JWT_SECRET);
      const res = await request(app)
        .get('/api/super-admin/overview')
        .set('Authorization', `Bearer ${tenantUserToken}`);
      expect(res.status).toBe(403);
    });

    it('should authenticate correctly with a platform user token (200)', async () => {
      const res = await request(app)
        .get('/api/super-admin/overview')
        .set('Authorization', `Bearer ${platformUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should fail login with incorrect passwords (401)', async () => {
      const res = await request(app)
        .post('/api/super-admin/login')
        .send({ email: 'superadmin@churchos.local', password: 'WrongPassword' });
      expect(res.status).toBe(401);
    });

    it('should generate token on login with correct credentials (200)', async () => {
      const res = await request(app)
        .post('/api/super-admin/login')
        .send({ email: 'superadmin@churchos.local', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('Tenants Provisioning & Management', () => {
    it('should provision a new church tenant environment and create platform audit log', async () => {
      const res = await request(app)
        .post('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${platformUserToken}`)
        .send({
          name: 'First Baptist Test',
          subdomain: 'baptist-test',
          planId: testPlanId,
          trialDays: 14,
          ownerName: 'Pastor Mark',
          ownerEmail: 'mark@baptist-test.com',
          ownerPassword: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      tenantId = res.body.data.id;

      // Verify DB record exists
      const dbTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(dbTenant).toBeDefined();
      expect(dbTenant?.name).toBe('First Baptist Test');
      expect(dbTenant?.subdomain).toBe('baptist-test');

      // Verify Audit log exists
      const audit = await prisma.platformAuditLog.findFirst({
        where: { action: 'tenant.onboard' }
      });
      expect(audit).toBeDefined();
      expect(audit?.actorEmail).toBe('superadmin@churchos.local');
    });

    it('should retrieve a listing of tenants', async () => {
      const res = await request(app)
        .get('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${platformUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should retrieve detail data of a specific tenant', async () => {
      const res = await request(app)
        .get(`/api/super-admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${platformUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('First Baptist Test');
    });

    it('should update tenant profile configuration', async () => {
      const res = await request(app)
        .patch(`/api/super-admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${platformUserToken}`)
        .send({ name: 'First Baptist Global' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('First Baptist Global');
    });

    it('should archive a tenant using delete endpoint', async () => {
      const res = await request(app)
        .delete(`/api/super-admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${platformUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });
  });

  describe('Module Entitlements Overrides', () => {
    it('should read tenant module entitlements list', async () => {
      const res = await request(app)
        .get(`/api/super-admin/tenants/${tenantId}/modules`)
        .set('Authorization', `Bearer ${platformUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should modify and upsert module entitlements rules', async () => {
      // Ensure the module catalog has website-cms defined
      await prisma.moduleDefinition.upsert({
        where: { key: 'website-cms' },
        update: {},
        create: { key: 'website-cms', name: 'Website Builder CMS', category: 'Core' }
      });

      const res = await request(app)
        .patch(`/api/super-admin/tenants/${tenantId}/modules`)
        .set('Authorization', `Bearer ${platformUserToken}`)
        .send({
          moduleKey: 'website-cms',
          status: 'preview',
          billingRule: 'add_on'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('preview');
      expect(res.body.data.billingRule).toBe('add_on');
    });
  });

  describe('Global Platform Settings Override', () => {
    it('should read platform settings configurations defaults', async () => {
      const res = await request(app)
        .get('/api/super-admin/settings')
        .set('Authorization', `Bearer ${platformUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.platformName).toBe('ChurchOS Platform Engine');
    });

    it('should patch write override settings parameters in database transaction', async () => {
      const res = await request(app)
        .patch('/api/super-admin/settings')
        .set('Authorization', `Bearer ${platformUserToken}`)
        .send({
          platformName: 'Kingdom SaaS OS',
          accentColor: '#10b981'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.platformName).toBe('Kingdom SaaS OS');
      expect(res.body.data.accentColor).toBe('#10b981');
    });
  });
});
