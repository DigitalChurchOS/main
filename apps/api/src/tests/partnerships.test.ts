import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Partnerships & Contributions Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let categoryId: string;
  let transactionId: string;
  let partnershipId: string;
  let recurringId: string;

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.donation.deleteMany({});
    await prisma.recurringGiving.deleteMany({});
    await prisma.givingCategory.deleteMany({});
    await prisma.partnership.deleteMany({});
    await prisma.recurringPartnership.deleteMany({});
    await prisma.partnershipCategory.deleteMany({});
    await prisma.churchService.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Partnership Test Church', subdomain: 'partner-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup payment driver configuration (Stripe connected service)
    await prisma.providerCategory.upsert({
      where: { id: 'payment' },
      update: {},
      create: { id: 'payment', name: 'Payment Gateway' }
    });
    await prisma.provider.upsert({
      where: { id: 'stripe' },
      update: {},
      create: { id: 'stripe', categoryId: 'payment', name: 'Stripe' }
    });

    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'stripe',
        encryptedCredentials: encryptCredentials(JSON.stringify({ secretKey: 'sk_test_partner_mock_key' }), tenantId),
        providerMode: 'bring_your_own',
        isActive: true,
      }
    });

    // 4. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 5. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@partner-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@partner-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. PARTNERSHIP CATEGORIES CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Partnership Categories Management', () => {
    it('should allow admin to create active partnership categories', async () => {
      const res = await request(app)
        .post('/api/partnerships/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Missions & Welfare Vision',
          description: 'Vision fund for international outreach and welfare missions',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Missions & Welfare Vision');
      expect(res.body.data.isActive).toBe(true);
      categoryId = res.body.data.id;
    });

    it('should block non-admins from creating partnership categories', async () => {
      const res = await request(app)
        .post('/api/partnerships/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Media Outreach Vision' });

      expect(res.status).toBe(403);
    });

    it('should list categories publicly', async () => {
      const res = await request(app)
        .get('/api/partnerships/categories')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(categoryId);
    });

    it('should allow admin to update a category', async () => {
      const res = await request(app)
        .patch(`/api/partnerships/categories/${categoryId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated global missions and local community welfare support' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated global missions and local community welfare support');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ONE-TIME CHECKOUT FLOW & TELEMETRY LEDGER INTEGRATION
  // ─────────────────────────────────────────────────────────────
  describe('One-time Partnership Checkout & Analytics Ledger', () => {
    it('should initiate checkout and create a pending partnership record', async () => {
      const res = await request(app)
        .post('/api/partnerships/checkout')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId,
          amount: 250.0,
          currency: 'USD',
          partnerName: 'Vision Supporter',
          partnerEmail: 'partner@example.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.partnership.status).toBe('pending');
      expect(res.body.data.partnership.amount).toBe(250.0);
      expect(res.body.data.clientSecret).toBeDefined();
      expect(res.body.data.transactionId).toBeDefined();

      partnershipId = res.body.data.partnership.id;
      transactionId = res.body.data.transactionId;
    });

    it('should process webhook success, transition status, and track giving telemetry event', async () => {
      // 1. Verify no analytics events exist initially
      const countBefore = await prisma.analyticsEvent.count({
        where: { tenantId, category: 'giving', name: 'donate' },
      });
      expect(countBefore).toBe(0);

      // 2. Fire mock webhook success
      const res = await request(app)
        .post('/api/partnerships/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId,
          status: 'succeeded',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('succeeded');

      // 3. Confirm that an analytics giving event was logged with exact sum
      const eventLogged = await prisma.analyticsEvent.findFirst({
        where: { tenantId, category: 'giving', name: 'donate' },
      });
      expect(eventLogged).toBeDefined();
      expect(eventLogged!.value).toBe(250.0);
      expect(eventLogged!.entityId).toBe(partnershipId);

      const parsedMeta = JSON.parse(eventLogged!.metadata);
      expect(parsedMeta.type).toBe('partnership');
      expect(parsedMeta.categoryId).toBe(categoryId);
    });

    it('should handle mock webhook failure status correctly', async () => {
      const checkoutRes = await request(app)
        .post('/api/partnerships/checkout')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId,
          amount: 100.0,
          partnerEmail: 'fail-partner@example.com',
        });
      const txId = checkoutRes.body.data.transactionId;

      const res = await request(app)
        .post('/api/partnerships/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: txId,
          status: 'failed',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('failed');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. RECURRING PARTNERSHIPS
  // ─────────────────────────────────────────────────────────────
  describe('Recurring Partnership Schedules', () => {
    it('should allow members to setup a recurring partnership', async () => {
      const res = await request(app)
        .post('/api/partnerships/recurring')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          categoryId,
          amount: 50.0,
          frequency: 'weekly',
          partnerEmail: 'partner@giving-test.com',
          partnerName: 'Regular Partner',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.frequency).toBe('weekly');
      expect(res.body.data.amount).toBe(50.0);
      expect(res.body.data.nextDrawDate).toBeDefined();

      recurringId = res.body.data.id;
    });

    it('should support pausing and resuming recurring schedules', async () => {
      // Pause
      const pauseRes = await request(app)
        .post(`/api/partnerships/recurring/${recurringId}/pause`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe('paused');

      // Resume
      const resumeRes = await request(app)
        .post(`/api/partnerships/recurring/${recurringId}/resume`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe('active');
    });

    it('should draw payments and advance nextDrawDate for active overdue cycles', async () => {
      // 1. Manually force the schedule nextDrawDate into the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await prisma.recurringPartnership.update({
        where: { id: recurringId },
        data: { nextDrawDate: pastDate },
      });

      // 2. Trigger the scheduled process endpoint (Admin Only)
      const res = await request(app)
        .post('/api/partnerships/recurring/process')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(1);

      // 3. Verify that a succeeded partnership history was logged
      const historyRecord = await prisma.partnership.findFirst({
        where: { recurringPartnershipId: recurringId },
      });
      expect(historyRecord).toBeDefined();
      expect(historyRecord!.amount).toBe(50.0);
      expect(historyRecord!.status).toBe('succeeded');

      // 4. Verify telemetry logs were captured
      const telemetryLogged = await prisma.analyticsEvent.findFirst({
        where: { entityId: historyRecord!.id },
      });
      expect(telemetryLogged).toBeDefined();
      expect(telemetryLogged!.value).toBe(50.0);

      // 5. Verify nextDrawDate was advanced by exactly 7 days
      const updatedSchedule = await prisma.recurringPartnership.findUnique({
        where: { id: recurringId },
      });
      const expectedDate = new Date(pastDate);
      expectedDate.setDate(expectedDate.getDate() + 7);

      expect(new Date(updatedSchedule!.nextDrawDate).toDateString()).toBe(expectedDate.toDateString());
    });

    it('should support canceling a recurring schedule', async () => {
      const res = await request(app)
        .post(`/api/partnerships/recurring/${recurringId}/cancel`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ended');
    });
  });
});
