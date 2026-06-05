import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Tithes & Offerings Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let categoryId: string;
  let churchServiceId: string;
  let transactionId: string;
  let donationId: string;
  let recurringId: string;

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.donation.deleteMany({});
    await prisma.recurringGiving.deleteMany({});
    await prisma.givingCategory.deleteMany({});
    await prisma.churchService.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Giving Test Church', subdomain: 'giving-test', status: 'active' },
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
        encryptedCredentials: encryptCredentials(JSON.stringify({ secretKey: 'sk_test_mock_secret_key' }), tenantId),
        providerMode: 'bring_your_own',
        isActive: true,
      }
    });

    // 4. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['tenant.settings', 'member.read'] } },
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
      data: { tenantId, email: 'admin@giving-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@giving-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 7. Create a published ChurchService to test total giving updates
    const churchService = await prisma.churchService.create({
      data: {
        tenantId,
        title: 'Sunday Celebration Service',
        serviceType: 'sunday',
        serviceDate: new Date(),
        status: 'published',
        givingTotal: 0,
      },
    });
    churchServiceId = churchService.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. GIVING CATEGORIES CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Giving Categories Management', () => {
    it('should allow admin to create active giving categories', async () => {
      const res = await request(app)
        .post('/api/giving/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tithe & General Offering',
          description: 'Regular tithes and general ministry fund',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Tithe & General Offering');
      expect(res.body.data.isActive).toBe(true);
      categoryId = res.body.data.id;
    });

    it('should block non-admins from creating categories', async () => {
      const res = await request(app)
        .post('/api/giving/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Building Fund' });

      expect(res.status).toBe(403);
    });

    it('should list categories publicly', async () => {
      const res = await request(app)
        .get('/api/giving/categories')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(categoryId);
    });

    it('should allow admin to update a category', async () => {
      const res = await request(app)
        .patch(`/api/giving/categories/${categoryId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated general ministry fund' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated general ministry fund');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. ONE-TIME DONATION CHECKOUT FLOW
  // ─────────────────────────────────────────────────────────────
  describe('One-time Donation Checkout Flow', () => {
    it('should initiate checkout and create a pending donation record', async () => {
      const res = await request(app)
        .post('/api/giving/donations')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId,
          amount: 150.0,
          currency: 'USD',
          donorName: 'John Doe',
          donorEmail: 'john@example.com',
          churchServiceId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.donation.status).toBe('pending');
      expect(res.body.data.donation.amount).toBe(150.0);
      expect(res.body.data.clientSecret).toBeDefined();
      expect(res.body.data.transactionId).toBeDefined();

      donationId = res.body.data.donation.id;
      transactionId = res.body.data.transactionId;
    });

    it('should process webhook success, transition status, and update church service total', async () => {
      // 1. Check initial church service total
      const serviceBefore = await prisma.churchService.findUnique({
        where: { id: churchServiceId },
      });
      expect(serviceBefore?.givingTotal).toBe(0);

      // 2. Trigger webhook success simulation
      const res = await request(app)
        .post('/api/giving/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId,
          status: 'succeeded',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('succeeded');

      // 3. Verify church service total increased
      const serviceAfter = await prisma.churchService.findUnique({
        where: { id: churchServiceId },
      });
      expect(serviceAfter?.givingTotal).toBe(150.0);
    });

    it('should handle webhook failure simulation correctly', async () => {
      // Create another donation
      const initRes = await request(app)
        .post('/api/giving/donations')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId,
          amount: 50.0,
          donorEmail: 'fail@example.com',
        });
      const txId = initRes.body.data.transactionId;

      // Fail transaction via webhook
      const res = await request(app)
        .post('/api/giving/webhook')
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
  // 3. RECURRING GIVING AND DRAW CYCLES
  // ─────────────────────────────────────────────────────────────
  describe('Recurring Giving Schedules', () => {
    it('should allow members to setup a recurring giving schedule', async () => {
      const res = await request(app)
        .post('/api/giving/recurring')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          categoryId,
          amount: 30.0,
          frequency: 'weekly',
          donorEmail: 'member@giving-test.com',
          donorName: 'Loyal Donor',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.frequency).toBe('weekly');
      expect(res.body.data.amount).toBe(30.0);
      expect(res.body.data.nextDrawDate).toBeDefined();

      recurringId = res.body.data.id;
    });

    it('should support pausing and resuming recurring schedules', async () => {
      // Pause
      const pauseRes = await request(app)
        .post(`/api/giving/recurring/${recurringId}/pause`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe('paused');

      // Resume
      const resumeRes = await request(app)
        .post(`/api/giving/recurring/${recurringId}/resume`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe('active');
    });

    it('should draw payments and advance nextDrawDate for active overdue cycles', async () => {
      // 1. Manually force the schedule nextDrawDate into the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await prisma.recurringGiving.update({
        where: { id: recurringId },
        data: { nextDrawDate: pastDate },
      });

      // 2. Trigger the scheduled process endpoint (Admin Only)
      const res = await request(app)
        .post('/api/giving/recurring/process')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processedCount).toBe(1);

      // 3. Verify donation was created for this recurring schedule
      const recurringDonation = await prisma.donation.findFirst({
        where: { recurringGivingId: recurringId },
      });
      expect(recurringDonation).toBeDefined();
      expect(recurringDonation!.amount).toBe(30.0);
      expect(recurringDonation!.status).toBe('succeeded');

      // 4. Verify nextDrawDate was advanced by exactly 7 days
      const updatedSchedule = await prisma.recurringGiving.findUnique({
        where: { id: recurringId },
      });
      const expectedDate = new Date(pastDate);
      expectedDate.setDate(expectedDate.getDate() + 7);

      expect(new Date(updatedSchedule!.nextDrawDate).toDateString()).toBe(expectedDate.toDateString());
    });

    it('should support canceling a recurring schedule', async () => {
      const res = await request(app)
        .post(`/api/giving/recurring/${recurringId}/cancel`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ended');
    });
  });
});
