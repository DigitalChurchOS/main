import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 35: Salvation & New Believer Journey Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let leaderMemberId: string;
  let memberId: string;
  let profileId: string;
  let reminderId: string;
  let serviceId: string;
  let funnelId: string;

  beforeAll(async () => {
    // ── Clean up related tables ──────────────────────────────
    await prisma.newBelieverReminder.deleteMany({});
    await prisma.newBelieverProfile.deleteMany({});
    await prisma.altarCallResponse.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.churchService.deleteMany({});
    await prisma.ministryFunnel.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.moduleSettings.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Harvest Church', subdomain: 'harvest-church', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Module Definition, TenantModule, & Settings overrides ──
    await prisma.moduleDefinition.upsert({
      where: { key: 'salvation-new-believer-journey' },
      update: {},
      create: {
        key: 'salvation-new-believer-journey',
        name: 'Salvation & New Believer Journey Module',
        category: 'discipleship',
      },
    });

    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey: 'salvation-new-believer-journey',
        status: 'active',
      },
    });

    await prisma.moduleSettings.create({
      data: {
        tenantId,
        moduleKey: 'salvation-new-believer-journey',
        settings: JSON.stringify({
          enabled: true,
          allowPublicSalvationFlow: true,
          allowLivestreamSalvationButton: true,
          allowEventSalvationFlow: true,
          allowGuestResponses: true,
          defaultPrayerText: 'Dear Lord Jesus...',
          defaultCellAssignmentMode: 'manual',
          careTeamRoutingMode: 'manual',
          requireFollowUpConsent: true,
          autoCreateMemberProfile: true,
          autoAssignCareTeam: true,
          autoEnrollLmsCourse: true,
          autoAssignBiblePlan: true,
          autoAssignCellGroup: true,
          journeyDurationDays: 30,
          flows: [],
          sequences: [],
          tasks: [],
        }),
      },
    });

    // ── Admin Role & Permissions ───────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin User & Leader Member ─────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@harvest.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const leaderMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Barnabas',
        lastName: 'Leader',
        email: 'pastor@harvest.com',
        membershipStatus: 'leader',
      },
    });
    leaderMemberId = leaderMember.id;

    // ── Pre-existing Service and Funnel ─────────────────────
    const service = await prisma.churchService.create({
      data: {
        tenantId,
        title: 'Sunday Victory Service',
        serviceType: 'sunday',
        serviceDate: new Date(),
        salvationCount: 0,
        status: 'published',
      },
    });
    serviceId = service.id;

    // Create corresponding livestream with same ID to satisfy AltarCallResponse foreign key
    await prisma.livestream.create({
      data: {
        id: serviceId,
        tenantId,
        title: 'Sunday Victory Service Broadcast',
        status: 'live',
      },
    });

    const funnel = await prisma.ministryFunnel.create({
      data: {
        tenantId,
        name: 'Salvation Call Landing Page',
        slug: 'give-life-to-christ',
        type: 'salvation',
        isActive: true,
      },
    });
    funnelId = funnel.id;
  });

  describe('Salvation Response Intake & Profile Setup', () => {
    it('should register a new convert response publicly, creating Member and NewBelieverProfile', async () => {
      const res = await request(app)
        .post('/api/salvation/respond')
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'Timothy',
          lastName: 'Convert',
          email: 'timothy@convert.com',
          phone: '+1888222333',
          source: 'livestream',
          serviceId,
          funnelId,
          location: 'New York',
          preferredLanguage: 'en',
        });

      if (res.status !== 201) {
        console.log('REGISTRATION FAILED WITH BODY:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.memberId).toBeDefined();
      expect(res.body.data.source).toBe('livestream');
      expect(res.body.data.serviceId).toBe(serviceId);
      expect(res.body.data.funnelId).toBe(funnelId);
      expect(res.body.data.cellId).toBe('cell-new-york');

      profileId = res.body.data.id;
      memberId = res.body.data.memberId;
    });

    it('should increment the salvation count on the linked church service', async () => {
      const svc = await prisma.churchService.findUnique({
        where: { id: serviceId },
      });
      expect(svc!.salvationCount).toBe(1);
    });

    it('should allow authenticated staff to fetch the new convert profile', async () => {
      const res = await request(app)
        .get(`/api/salvation/profiles/${memberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(profileId);
      expect(res.body.data.member.firstName).toBe('Timothy');
      expect(res.body.data.assignedAgentId).toBe(leaderMemberId);
    });
  });

  describe('Onboarding Automations & Resource Recommendations', () => {
    it('should automatically trigger welcome letters, follow-up drip, LMS enrollment, and Bible reading plans', async () => {
      const res = await request(app)
        .get(`/api/salvation/profiles/${memberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.welcomeSentAt).toBeDefined();
      expect(res.body.data.followUpStartedAt).toBeDefined();
      expect(res.body.data.bibleReadingPlanStartedAt).toBeDefined();
      expect(res.body.data.lmsEnrolledAt).toBeDefined();
    });

    it('should fetch recommended new believer digital materials and guides', async () => {
      const res = await request(app)
        .get('/api/salvation/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('Free Digital Holy Bible');
      expect(res.body.data[1].title).toBe('Foundation School Student Guide');
    });
  });

  describe('Care Team Routing & Reminders', () => {
    it('should list scheduled pending reminders for the care agent', async () => {
      const res = await request(app)
        .get('/api/salvation/reminders')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ assignedAgentId: leaderMemberId });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].reminderType).toBe('day7');
      expect(res.body.data[1].reminderType).toBe('day30');
      reminderId = res.body.data[0].id;
    });

    it('should allow staff to complete a follow-up reminder check', async () => {
      const res = await request(app)
        .post(`/api/salvation/reminders/${reminderId}/complete`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Timothy is reading his bible daily and feels welcomed.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.notes).toBe('Timothy is reading his bible daily and feels welcomed.');
      expect(res.body.data.completedAt).toBeDefined();
    });
  });

  describe('Spiritual Milestones Checklist', () => {
    it('should allow staff to record water baptism details', async () => {
      const bDate = new Date();
      const res = await request(app)
        .patch(`/api/salvation/profiles/${profileId}/baptism`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ baptismDate: bDate });

      expect(res.status).toBe(200);
      expect(res.body.data.isBaptized).toBe(true);
      expect(res.body.data.baptismDate).toBeDefined();
    });

    it('should allow staff to update cell group and class completion milestones', async () => {
      // 1. Group membership
      let res = await request(app)
        .patch(`/api/salvation/profiles/${profileId}/milestones`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ milestone: 'joinedGroup', value: true });

      expect(res.status).toBe(200);
      expect(res.body.data.joinedGroup).toBe(true);

      // 2. Class completion (graduation)
      res = await request(app)
        .patch(`/api/salvation/profiles/${profileId}/milestones`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ milestone: 'finishedClass', value: true });

      expect(res.status).toBe(200);
      expect(res.body.data.finishedClass).toBe(true);
      expect(res.body.data.lmsCompletedAt).toBeDefined();
    });
  });

  describe('Analytics & Completion Reports', () => {
    it('should compile new believer journey progress metrics for pastors', async () => {
      const res = await request(app)
        .get('/api/salvation/reports/completion')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalConverts).toBe(1);
      expect(res.body.data.welcomedCount).toBe(1);
      expect(res.body.data.lmsEnrolled).toBe(1);
      expect(res.body.data.lmsCompleted).toBe(1);
      expect(res.body.data.baptized).toBe(1);
      expect(res.body.data.joinedGroup).toBe(1);
      expect(res.body.data.finishedClass).toBe(1);
      expect(res.body.data.lmsCompletionRate).toBe(100);
      expect(res.body.data.baptismRate).toBe(100);
      expect(res.body.data.bySource[0].source).toBe('livestream');
      expect(res.body.data.bySource[0].count).toBe(1);
    });
  });
});
