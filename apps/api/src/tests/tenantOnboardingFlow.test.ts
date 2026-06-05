import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Tenant Signup, Onboarding Flow and Isolation Integration', () => {
  let tenantAToken: string;
  let tenantAId: string;
  let tenantASubdomain = 'church-onboarding-test-a';

  let tenantBToken: string;
  let tenantBId: string;
  let tenantBSubdomain = 'church-onboarding-test-b';

  let platformUserToken: string;
  let testPlanId: string;

  beforeAll(async () => {
    // 1. Clean up test databases
    await prisma.tenantOnboardingStep.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ['owner-a@onboarding.com', 'owner-b@onboarding.com'] } },
    });
    await prisma.tenant.deleteMany({
      where: { subdomain: { in: [tenantASubdomain, tenantBSubdomain] } },
    });

    // 2. Create platform admin user for testing
    const permRead = await prisma.platformPermission.upsert({
      where: { name: 'platform.read' },
      update: {},
      create: { name: 'platform.read', description: 'Read platform' },
    });
    const permWrite = await prisma.platformPermission.upsert({
      where: { name: 'platform.write' },
      update: {},
      create: { name: 'platform.write', description: 'Write platform' },
    });

    const role = await prisma.platformRole.upsert({
      where: { name: 'Super Admin' },
      update: {},
      create: { name: 'Super Admin', description: 'Super Admin' },
    });

    await prisma.platformRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permRead.id,
        },
      },
      update: {},
      create: { roleId: role.id, permissionId: permRead.id },
    });

    await prisma.platformRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permWrite.id,
        },
      },
      update: {},
      create: { roleId: role.id, permissionId: permWrite.id },
    });

    const passHash = await bcrypt.hash('Password123!', 12);
    const superUser = await prisma.platformUser.upsert({
      where: { email: 'superadmin-onboard@churchos.local' },
      update: {},
      create: {
        email: 'superadmin-onboard@churchos.local',
        passwordHash: passHash,
        status: 'active',
        roleId: role.id,
      },
    });

    platformUserToken = jwt.sign({ platformUserId: superUser.id, email: superUser.email }, JWT_SECRET);

    // Seed test plan
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { slug: 'starter-plan' },
    });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter Plan',
          slug: 'starter-plan',
          basePrice: 29,
          currency: 'USD',
          billingInterval: 'month',
          includedMembers: 100,
          includedStorageGb: 10,
          includedSms: 100,
          memberOverageRate: 0.05,
          smsOverageRate: 0.02,
          storageOverageRate: 0.1,
        },
      });
    }
    testPlanId = plan.id;

    // 3. Register Tenant A
    const signupARes = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Church A',
        subdomain: tenantASubdomain,
        ownerName: 'Pastor A',
        ownerEmail: 'owner-a@onboarding.com',
        ownerPassword: 'Password123!',
      });
    tenantAId = signupARes.body.data.id;
    tenantAToken = signupARes.body.token || jwt.sign({ userId: signupARes.body.data.ownerUserId || 'user-a', tenantId: tenantAId, email: 'owner-a@onboarding.com' }, JWT_SECRET);

    // 4. Register Tenant B
    const signupBRes = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Church B',
        subdomain: tenantBSubdomain,
        ownerName: 'Pastor B',
        ownerEmail: 'owner-b@onboarding.com',
        ownerPassword: 'Password123!',
      });
    tenantBId = signupBRes.body.data.id;
    tenantBToken = signupBRes.body.token || jwt.sign({ userId: signupBRes.body.data.ownerUserId || 'user-b', tenantId: tenantBId, email: 'owner-b@onboarding.com' }, JWT_SECRET);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.tenantOnboardingStep.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { in: ['owner-a@onboarding.com', 'owner-b@onboarding.com'] } },
    });
    await prisma.tenant.deleteMany({
      where: { subdomain: { in: [tenantASubdomain, tenantBSubdomain] } },
    });
    await prisma.$disconnect();
  });

  describe('Subdomain Live Checking & Resolution', () => {
    it('should validate subdomain availability and format correctly', async () => {
      const res = await request(app)
        .post('/api/public/check-subdomain')
        .send({ subdomain: tenantASubdomain });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false); // already taken by Tenant A
      expect(res.body.error).toContain('already taken');
    });

    it('should reject reserved subdomains', async () => {
      const res = await request(app)
        .post('/api/public/check-subdomain')
        .send({ subdomain: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(false);
      expect(res.body.error).toContain('reserved');
    });

    it('should resolve subdomain to tenantId', async () => {
      const res = await request(app)
        .post('/api/public/resolve-subdomain')
        .send({ subdomain: tenantASubdomain });

      expect(res.status).toBe(200);
      expect(res.body.tenantId).toBe(tenantAId);
    });
  });

  describe('Tenant Onboarding API Operations', () => {
    it('should fetch the default onboarding checklist with progress %', async () => {
      const res = await request(app)
        .get('/api/onboarding')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.progressPercent).toBeDefined();
      expect(res.body.data.steps.length).toBeGreaterThanOrEqual(10);
    });

    it('should update onboarding steps: church profile', async () => {
      const res = await request(app)
        .patch('/api/onboarding/church-profile')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId)
        .send({
          country: 'Canada',
          city: 'Toronto',
          address: '123 Grace St',
          phone: '+14165551234',
          email: 'pastor@grace.ca',
          timezone: 'America/Toronto',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify DB change
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantAId } });
      expect(tenant?.city).toBe('Toronto');
      expect(tenant?.country).toBe('Canada');
    });
  });

  describe('Multi-Tenant Isolation Checks', () => {
    it('should reject onboarding step retrieval from another tenant (tenant isolation)', async () => {
      const res = await request(app)
        .get('/api/onboarding')
        .set('Authorization', `Bearer ${tenantAToken}`) // User A token
        .set('x-tenant-id', tenantBId); // Requesting Tenant B context

      // The auth/tenant middleware ensures that the authenticated user's tenantId matches the requested x-tenant-id.
      // If it doesn't match, it returns an access error.
      expect(res.status).toBe(403);
    });

    it('should reject onboarding updates of tenant B by user A', async () => {
      const res = await request(app)
        .patch('/api/onboarding/church-profile')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantBId)
        .send({ city: 'Malicious Update' });

      expect(res.status).toBe(403);
    });
  });

  describe('Tenant Dashboard Home & Setup Checklist', () => {
    it('should fetch the launch progress checklist and details', async () => {
      const res = await request(app)
        .get('/api/dashboard/setup-checklist')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.progressPercent).toBeDefined();
      expect(res.body.data.items.length).toBe(10);
    });

    it('should fetch dashboard home summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/home')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId);

      expect(res.status).toBe(200);
      expect(res.body.data.welcomeHeader).toContain('Welcome');
      expect(res.body.data.progressPercent).toBeDefined();
      expect(res.body.data.planStatus).toBeDefined();
    });

    it('should update setup checklist steps', async () => {
      const res = await request(app)
        .patch('/api/dashboard/setup-checklist/first-service')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fetch quick actions and recent activity', async () => {
      const actionsRes = await request(app)
        .get('/api/dashboard/quick-actions')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId);

      expect(actionsRes.status).toBe(200);
      expect(actionsRes.body.data.length).toBeGreaterThan(0);

      const activityRes = await request(app)
        .get('/api/dashboard/recent-activity')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .set('x-tenant-id', tenantAId);

      expect(activityRes.status).toBe(200);
      expect(activityRes.body.data).toBeDefined();
    });
  });

  describe('Super Admin Operations', () => {
    it('should list tenants with location, onboarding progress and status', async () => {
      const res = await request(app)
        .get('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${platformUserToken}`);

      expect(res.status).toBe(200);
      const tenant = res.body.data.find((t: any) => t.id === tenantAId);
      expect(tenant).toBeDefined();
      expect(tenant.city).toBe('Toronto');
      expect(tenant.country).toBe('Canada');
    });

    it('should extend free trial duration', async () => {
      const res = await request(app)
        .post(`/api/super-admin/tenants/${tenantAId}/extend-trial`)
        .set('Authorization', `Bearer ${platformUserToken}`)
        .send({ days: 14 });

      expect(res.status).toBe(200);
      expect(res.body.data.trialEndsAt).toBeDefined();

      const newDate = new Date(res.body.data.trialEndsAt);
      expect(newDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should override subscription plan', async () => {
      const res = await request(app)
        .patch(`/api/super-admin/tenants/${tenantAId}/subscription`)
        .set('Authorization', `Bearer ${platformUserToken}`)
        .send({ planId: testPlanId });

      expect(res.status).toBe(200);
      expect(res.body.data.planId).toBe(testPlanId);
    });
  });
});
