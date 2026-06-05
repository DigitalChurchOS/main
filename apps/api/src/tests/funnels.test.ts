import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Ministry Funnels & Landing Pages Module (Module 24)', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let otherTenantToken: string;

  beforeAll(async () => {
    // 1. Purge database records from prior test runs
    await prisma.funnelAnalytics.deleteMany({});
    await prisma.funnelSubmission.deleteMany({});
    await prisma.funnelStep.deleteMany({});
    await prisma.ministryFunnel.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Funnels Church', subdomain: 'grace-funnels', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Activate 'ministry-funnels' module entitlement
    await prisma.moduleDefinition.upsert({
      where: { key: 'ministry-funnels' },
      update: {},
      create: {
        key: 'ministry-funnels',
        name: 'Ministry Funnels',
        category: 'engagement',
      },
    });

    await prisma.tenantModule.create({
      data: { tenantId, moduleKey: 'ministry-funnels', status: 'active' },
    });

    // 4. Create admin role and user
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['tenant.settings', 'member.read'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace-funnels.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // 5. Create member role and user (no tenant.settings, but has member.read)
    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });

    const memberPermission = await prisma.permission.findFirst({
      where: { name: 'member.read' },
    });
    if (memberPermission) {
      await prisma.rolePermission.create({
        data: { roleId: memberRole.id, permissionId: memberPermission.id },
      });
    }

    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@grace-funnels.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });

    memberToken = jwt.sign(
      { userId: memberUser.id, tenantId, email: memberUser.email },
      JWT_SECRET
    );

    // 6. Create another tenant for isolation testing
    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Church', subdomain: 'other-ch', status: 'active' },
    });
    const otherUser = await prisma.user.create({
      data: { tenantId: otherTenant.id, email: 'other@other.com', passwordHash: passHash },
    });
    otherTenantToken = jwt.sign(
      { userId: otherUser.id, tenantId: otherTenant.id, email: otherUser.email },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. FUNNELS AND STEPS CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Funnels and Steps CRUD Administration', () => {
    let createdFunnelId: string;

    it('should allow admin to create a new funnel with steps in a transactional block', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Salvation Call Funnel',
          slug: 'salvation-call',
          description: 'A guided journey for new converts responding to salvation altar calls',
          type: 'salvation',
          steps: [
            {
              name: 'Landing Page',
              order: 0,
              slug: 'landing',
              layoutType: 'landing',
              title: 'A New Beginning with Christ',
              subtitle: 'Congratulations on your decision!',
              bodyContent: 'We would love to stand in prayer with you...',
              ctaText: 'Next Step',
              scriptureReference: 'Romans 10:9',
              scriptureText: 'That if you confess with your mouth...',
            },
            {
              name: 'Capture Details Form',
              order: 1,
              slug: 'details',
              layoutType: 'form',
              title: 'Share Your Details',
              bodyContent: 'Provide your name and email so we can reach out.',
              ctaText: 'Submit Details',
              formConfig: JSON.stringify([{ label: 'Phone', type: 'tel', required: true }]),
            },
            {
              name: 'Thank You Page',
              order: 2,
              slug: 'thank-you',
              layoutType: 'thank_you',
              title: 'Welcome Home!',
              bodyContent: 'Your record is safe. A pastor will call you soon.',
              ctaText: 'Go to Website',
              ctaLink: 'https://gracechurch.org',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Salvation Call Funnel');
      expect(res.body.data.slug).toBe('salvation-call');
      expect(res.body.data.type).toBe('salvation');
      expect(res.body.data.steps.length).toBe(3);
      expect(res.body.data.steps[0].order).toBe(0);
      expect(res.body.data.steps[2].slug).toBe('thank-you');

      createdFunnelId = res.body.data.id;
    });

    it('should block non-admins from creating funnels', async () => {
      const res = await request(app)
        .post('/api/funnels')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Restricted Funnel',
          slug: 'restricted-funnel',
        });

      expect(res.status).toBe(403);
    });

    it('should list all funnels to staff with member.read permission', async () => {
      const res = await request(app)
        .get('/api/funnels')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].slug).toBe('salvation-call');
    });

    it('should allow public retrieval of active funnels by ID or slug', async () => {
      const res = await request(app)
        .get('/api/funnels/salvation-call')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdFunnelId);
      expect(res.body.data.steps.length).toBe(3);
    });

    it('should permit admin to update general funnel parameters', async () => {
      const res = await request(app)
        .patch(`/api/funnels/${createdFunnelId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Salvation Journey',
          description: 'Refined salvation altar call tracking guide',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Salvation Journey');
      expect(res.body.data.description).toBe('Refined salvation altar call tracking guide');
    });

    it('should permit admin to add an additional step into the funnel', async () => {
      const res = await request(app)
        .post(`/api/funnels/${createdFunnelId}/steps`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pastor Video Greeting',
          order: 3,
          slug: 'video-welcome',
          layoutType: 'media',
          title: 'A Message from Pastor Steve',
          videoUrl: 'https://youtube.com/watch?v=welcome',
          ctaText: 'Join a Small Group',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('video-welcome');
      expect(res.body.data.videoUrl).toBe('https://youtube.com/watch?v=welcome');
    });

    it('should allow admin to edit specific step properties', async () => {
      // Find step details slug
      const funnelRes = await request(app)
        .get(`/api/funnels/${createdFunnelId}`)
        .set('x-tenant-id', tenantId);
      const detailsStepId = funnelRes.body.data.steps.find((s: any) => s.slug === 'details').id;

      const res = await request(app)
        .patch(`/api/funnels/${createdFunnelId}/steps/${detailsStepId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Fill Out Altar Call Card',
          ctaText: 'Complete Card Now',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Fill Out Altar Call Card');
      expect(res.body.data.ctaText).toBe('Complete Card Now');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PAGE TRAFFIC VIEW RECORDING
  // ─────────────────────────────────────────────────────────────
  describe('Page Traffic Tracking Views', () => {
    it('should allow public traffic views to register atomically', async () => {
      const funnelRes = await request(app)
        .get('/api/funnels/salvation-call')
        .set('x-tenant-id', tenantId);

      const landingStepId = funnelRes.body.data.steps.find((s: any) => s.slug === 'landing').id;

      const dateStr = '2026-05-28';

      // Record first view
      const view1 = await request(app)
        .post(`/api/funnels/${funnelRes.body.data.id}/steps/${landingStepId}/view`)
        .set('x-tenant-id', tenantId)
        .send({ dateStr });

      expect(view1.status).toBe(200);
      expect(view1.body.success).toBe(true);

      // Record second view to verify increment
      await request(app)
        .post(`/api/funnels/${funnelRes.body.data.id}/steps/${landingStepId}/view`)
        .set('x-tenant-id', tenantId)
        .send({ dateStr });

      // Verify db counts
      const stats = await prisma.funnelAnalytics.findFirst({
        where: { tenantId, stepId: landingStepId, date: new Date(dateStr) },
      });
      expect(stats!.views).toBe(2);
      expect(stats!.submissions).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SECURE GUEST LEAD CAPTURES & MEMBERS MAPPING
  // ─────────────────────────────────────────────────────────────
  describe('Form Submissions & Member Capture', () => {
    it('should capture lead submission and dynamically register a new Member with visitor status', async () => {
      const funnelRes = await request(app)
        .get('/api/funnels/salvation-call')
        .set('x-tenant-id', tenantId);
      const detailsStepId = funnelRes.body.data.steps.find((s: any) => s.slug === 'details').id;

      const dateStr = '2026-05-28';

      const res = await request(app)
        .post(`/api/funnels/${funnelRes.body.data.id}/steps/${detailsStepId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'James',
          lastName: 'Preston',
          email: 'james.preston@visitors.com',
          phone: '+15554443322',
          submittedData: { phone: '+15554443322', comments: 'I came forward at the end of service' },
          dateStr,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('James');
      expect(res.body.data.lastName).toBe('Preston');
      expect(res.body.data.email).toBe('james.preston@visitors.com');

      // Verify new Member was registered
      const member = await prisma.member.findFirst({
        where: { tenantId, phone: '+15554443322' },
      });
      expect(member).not.toBeNull();
      expect(member!.firstName).toBe('James');
      expect(member!.membershipStatus).toBe('visitor');

      // Verify analytics updated submissions
      const stats = await prisma.funnelAnalytics.findFirst({
        where: { tenantId, stepId: detailsStepId, date: new Date(dateStr) },
      });
      expect(stats!.submissions).toBe(1);
    });

    it('should handle duplicates by finding matching visitor members and recording subsequent conversions', async () => {
      const funnelRes = await request(app)
        .get('/api/funnels/salvation-call')
        .set('x-tenant-id', tenantId);
      const detailsStepId = funnelRes.body.data.steps.find((s: any) => s.slug === 'details').id;

      const dateStr = '2026-05-28';

      const res = await request(app)
        .post(`/api/funnels/${funnelRes.body.data.id}/steps/${detailsStepId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'James',
          lastName: 'Preston',
          email: 'james.preston@visitors.com',
          phone: '+15554443322',
          submittedData: { phone: '+15554443322', secondaryComment: 'Converted again' },
          dateStr,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify members count is still 1
      const count = await prisma.member.count({
        where: { tenantId, phone: '+15554443322' },
      });
      expect(count).toBe(1);

      // Verify analytics submissions updated
      const stats = await prisma.funnelAnalytics.findFirst({
        where: { tenantId, stepId: detailsStepId, date: new Date(dateStr) },
      });
      expect(stats!.submissions).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. CONVERSION PERFORMANCE METRICS
  // ─────────────────────────────────────────────────────────────
  describe('Funnel Analytics Drop-off & Conversions summaries', () => {
    it('should correctly calculate step-by-step and overall conversion rates', async () => {
      const res = await request(app)
        .get('/api/funnels/salvation-call/analytics')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalViews).toBeGreaterThanOrEqual(2);
      expect(res.body.data.totalSubmissions).toBe(2);
      expect(res.body.data.steps.length).toBe(4);

      const landingStep = res.body.data.steps.find((s: any) => s.slug === 'landing');
      expect(landingStep.views).toBe(2);
      expect(landingStep.submissions).toBe(0);
      expect(landingStep.conversionRate).toBe(0.0);

      const detailsStep = res.body.data.steps.find((s: any) => s.slug === 'details');
      expect(detailsStep.submissions).toBe(2);
      expect(res.body.data.overallConversionRate).toBe(100.0); // 2 submissions / 2 views on first step * 100
      expect(res.body.data.dailyMetrics.length).toBe(30);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. TELESCOPIC CASCADE DELETES
  // ─────────────────────────────────────────────────────────────
  describe('Cascade Purges', () => {
    it('should safely delete funnel, cascading cleanup of steps, submissions, and analytics', async () => {
      const funnelRes = await request(app)
        .get('/api/funnels/salvation-call')
        .set('x-tenant-id', tenantId);
      const funnelId = funnelRes.body.data.id;

      const res = await request(app)
        .delete(`/api/funnels/${funnelId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify db is completely clean of related tables
      const stepsCount = await prisma.funnelStep.count({ where: { funnelId } });
      const submissionsCount = await prisma.funnelSubmission.count({ where: { funnelId } });
      const analyticsCount = await prisma.funnelAnalytics.count({ where: { funnelId } });

      expect(stepsCount).toBe(0);
      expect(submissionsCount).toBe(0);
      expect(analyticsCount).toBe(0);
    });
  });
});
