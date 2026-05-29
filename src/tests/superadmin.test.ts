import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Super Admin Backend API', () => {
  let superAdminToken: string;
  let normalUserToken: string;
  let systemTenantId: string;
  let normalTenantId: string;

  beforeAll(async () => {
    // ── Clean up related tables ──────────────────────────────
    await prisma.observabilityLog.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Seed basic subscription plan ──────────────────────────
    await prisma.subscriptionPlan.upsert({
      where: { id: 'demo-plan' },
      update: {},
      create: {
        id: 'demo-plan',
        name: 'Standard Free',
        basePrice: 0,
        includedMembers: 500,
        includedSms: 100,
        includedStorageGb: 5,
        memberOverageRate: 0,
        smsOverageRate: 0,
        storageOverageRate: 0,
        isActive: true,
      },
    });

    // ── Create System Tenant ──────────────────────────────────
    const systemTenant = await prisma.tenant.create({
      data: { name: 'System Platform', subdomain: 'platform-admin', status: 'active' },
    });
    systemTenantId = systemTenant.id;

    // ── Create SuperAdmin Role (tenantId is null) ────────────
    const superAdminRole = await prisma.role.create({
      data: { tenantId: null, name: 'SuperAdmin', isCustom: false },
    });

    const passHash = await bcrypt.hash('superpass123', 12);

    // ── Create Super Admin User & Token ──────────────────────
    const superUser = await prisma.user.create({
      data: { tenantId: systemTenantId, email: 'admin@platform.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: superUser.id, roleId: superAdminRole.id },
    });
    superAdminToken = jwt.sign(
      { userId: superUser.id, tenantId: systemTenantId, email: superUser.email },
      JWT_SECRET
    );

    // ── Create Normal Tenant, User, and Token ────────────────
    const normalTenant = await prisma.tenant.create({
      data: { name: 'Normal Church', subdomain: 'normal-church', status: 'active' },
    });
    normalTenantId = normalTenant.id;

    const normalUser = await prisma.user.create({
      data: { tenantId: normalTenantId, email: 'pastor@normal.com', passwordHash: passHash },
    });
    normalUserToken = jwt.sign(
      { userId: normalUser.id, tenantId: normalTenantId, email: normalUser.email },
      JWT_SECRET
    );
  });

  describe('Authorization Rules', () => {
    it('should reject requests without authentication', async () => {
      const res = await request(app).get('/api/super-admin/tenants');
      expect(res.status).toBe(401);
    });

    it('should reject requests from normal users who do not have the SuperAdmin role', async () => {
      const res = await request(app)
        .get('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${normalUserToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Super Admin access required');
    });

    it('should allow request from authorized Super Admin', async () => {
      const res = await request(app)
        .get('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Tenant Management API', () => {
    let createdTenantId: string;

    it('should create a new tenant workspace with default modules and active plan', async () => {
      const res = await request(app)
        .post('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Hope Fellowship',
          subdomain: 'hope-fellowship',
          customDomain: 'hopefellowship.org',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Hope Fellowship');
      expect(res.body.data.subdomain).toBe('hope-fellowship');
      expect(res.body.data.customDomain).toBe('hopefellowship.org');
      expect(res.body.data.status).toBe('active');

      createdTenantId = res.body.data.id;

      // Verify that tenant modules are provisioned
      const activeModules = await prisma.tenantModule.findMany({
        where: { tenantId: createdTenantId },
      });
      expect(activeModules.length).toBeGreaterThanOrEqual(1);
    });

    it('should prevent creating a duplicate subdomain', async () => {
      const res = await request(app)
        .post('/api/super-admin/tenants')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Another Hope',
          subdomain: 'hope-fellowship', // Dupe
        });

      expect(res.status).toBe(409);
    });

    it('should patch a tenant (e.g. suspend tenant)', async () => {
      const res = await request(app)
        .patch(`/api/super-admin/tenants/${createdTenantId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'suspended',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('suspended');

      // Verify DB updated
      const tenant = await prisma.tenant.findUnique({ where: { id: createdTenantId } });
      expect(tenant?.status).toBe('suspended');
    });
  });

  describe('Modules and Entitlements API', () => {
    it('should fetch global module definitions', async () => {
      const res = await request(app)
        .get('/api/super-admin/modules')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should upsert tenant module entitlement', async () => {
      const res = await request(app)
        .post('/api/super-admin/entitlements')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          tenantId: normalTenantId,
          moduleKey: 'website-cms',
          status: 'suspended',
          billingRule: 'flat_rate',
          usageLimits: { maxPages: 25 },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.moduleKey).toBe('website-cms');
      expect(res.body.data.status).toBe('suspended');
      expect(JSON.parse(res.body.data.usageLimits).maxPages).toBe(25);
    });
  });

  describe('Observability Logs API', () => {
    beforeAll(async () => {
      // Seed test observability logs
      await prisma.observabilityLog.createMany({
        data: [
          { logLevel: 'error', scope: 'webhook_delivery', message: 'Stripe signature failure', contextJson: '{}' },
          { logLevel: 'info', scope: 'billing_cron', message: 'Cron processed successfully', contextJson: '{}' },
          { logLevel: 'warning', scope: 'payment_gateway', message: 'Slight delay in response', contextJson: '{}' },
        ],
      });
    });

    it('should fetch observability logs and filter by level', async () => {
      const res = await request(app)
        .get('/api/super-admin/logs?level=error')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].scope).toBe('webhook_delivery');
      expect(res.body.meta.total).toBe(1);
    });

    it('should filter logs by scope substring', async () => {
      const res = await request(app)
        .get('/api/super-admin/logs?scope=billing')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].scope).toBe('billing_cron');
    });
  });
});
