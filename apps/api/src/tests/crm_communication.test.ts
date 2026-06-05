import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS CRM & Communication Engine', () => {
  let tenantId: string;
  let adminToken: string;
  let memberIdOptIn: string;
  let memberIdOptOut: string;
  let memberIdNoConsent: string;
  let smsTemplateId: string;
  let emailTemplateId: string;

  beforeAll(async () => {
    // 1. Clean up database records from prior test runs
    await prisma.communicationLog.deleteMany({});
    await prisma.communicationTemplate.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.memberCrmStage.deleteMany({});
    await prisma.crmStage.deleteMany({});
    await prisma.crmPipeline.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'CRM Grace Church', subdomain: 'grace-crm', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & assign member.update, member.read, tenant.settings permissions
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: ['member.update', 'member.read', 'tenant.settings'] },
      },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace-crm.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // 5. Seed default Twilio integration keys (to allow SMS sending resolver to function)
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'twilio',
        // Encrypt dummy twilio credentials (vault handles it)
        encryptedCredentials: require('../lib/vault').encryptCredentials(
          JSON.stringify({ accountSid: 'AC_test', authToken: 'auth_test', fromNumber: '+1234' }),
          tenantId
        ),
      },
    });

    // 6. Seed a default subscription plan & active subscription
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Standard Plan',
        basePrice: 10.0,
        includedMembers: 100,
        includedSms: 100,
        includedStorageGb: 10.0,
        memberOverageRate: 1.0,
        smsOverageRate: 0.1,
        storageOverageRate: 1.0,
      },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. FAMILY STRUCTURES & RELATIONSHIPS
  // ─────────────────────────────────────────────────────────────
  describe('Family Household Grouping', () => {
    it('should create a Family household and group members together', async () => {
      const family = await prisma.family.create({
        data: { tenantId, name: 'The Miller Family' },
      });

      const head = await prisma.member.create({
        data: {
          tenantId,
          familyId: family.id,
          familyRole: 'head',
          firstName: 'Robert',
          lastName: 'Miller',
          phone: '+1888999000',
        },
      });
      memberIdOptIn = head.id;

      const spouse = await prisma.member.create({
        data: {
          tenantId,
          familyId: family.id,
          familyRole: 'spouse',
          firstName: 'Sarah',
          lastName: 'Miller',
          phone: '+1888999001',
        },
      });
      memberIdOptOut = spouse.id;

      // Verify the grouping
      const members = await prisma.member.findMany({
        where: { familyId: family.id },
      });

      expect(members.length).toBe(2);
      expect(members.find((m) => m.familyRole === 'head')!.firstName).toBe('Robert');
      expect(members.find((m) => m.familyRole === 'spouse')!.firstName).toBe('Sarah');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. MINISTRY CRM PIPELINES & STAGE TRACKING
  // ─────────────────────────────────────────────────────────────
  describe('Ministry CRM Tracking', () => {
    let pipelineId: string;
    let stageFirstVisitId: string;
    let stageCalledId: string;

    it('should create an onboarding pipeline with stages inside a transaction', async () => {
      const res = await request(app)
        .post('/api/crm/pipelines')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'First-time Visitor Tracking',
          description: 'Follow up path for new converts',
          stages: [
            { name: 'First Visit', order: 0 },
            { name: 'Follow-up Call', order: 1 },
            { name: 'Fellowship Connect', order: 2 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('First-time Visitor Tracking');
      expect(res.body.data.stages.length).toBe(3);

      pipelineId = res.body.data.id;
      stageFirstVisitId = res.body.data.stages.find((s: any) => s.name === 'First Visit').id;
      stageCalledId = res.body.data.stages.find((s: any) => s.name === 'Follow-up Call').id;
    });

    it('should track a member moving from Stage A to Stage B successfully', async () => {
      // Move to First Visit stage
      const move1 = await request(app)
        .post('/api/crm/move')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdOptIn,
          stageId: stageFirstVisitId,
          status: 'active',
          notes: 'Met at visitor lounge',
        });

      expect(move1.status).toBe(200);
      expect(move1.body.data.stageId).toBe(stageFirstVisitId);
      expect(move1.body.data.notes).toBe('Met at visitor lounge');

      // Advance to Follow-up Call stage (tracks update)
      const move2 = await request(app)
        .post('/api/crm/move')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdOptIn,
          stageId: stageCalledId,
          status: 'completed',
          notes: 'Called. Had a great conversation!',
        });

      expect(move2.status).toBe(200);
      expect(move2.body.data.stageId).toBe(stageCalledId);
      expect(move2.body.data.status).toBe('completed');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. COMMUNICATION ENGINE & CONSENT PRIVACY GATING
  // ─────────────────────────────────────────────────────────────
  describe('Communication Consent Gates & Template Compiling', () => {
    beforeAll(async () => {
      // 1. Create templates
      const smsTemplate = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Visitor Follow-up SMS',
          type: 'sms',
          body: 'Hello {{first_name}} {{last_name}}, thank you for joining us!',
        });
      smsTemplateId = smsTemplate.body.data.id;

      const emailTemplate = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Weekly Devotion Email',
          type: 'email',
          subject: 'Your Weekly Devotional',
          body: 'Hello {{first_name}}, here is your study file for today.',
        });
      emailTemplateId = emailTemplate.body.data.id;

      // 2. Set consent opt-in for Robert (memberIdOptIn)
      await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdOptIn,
          optInSms: true,
          optInEmail: true,
        });

      // 3. Set consent opt-out for Sarah (memberIdOptOut)
      await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdOptOut,
          optInSms: false,
          optInEmail: false,
        });

      // 4. Create member with no consent records at all
      const stranger = await prisma.member.create({
        data: {
          tenantId,
          firstName: 'John',
          lastName: 'Doe',
        },
      });
      memberIdNoConsent = stranger.id;
    });

    it('should block SMS delivery if user is explicitly opted-out', async () => {
      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdOptOut,
          templateId: smsTemplateId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('opted out');

      // Verify log entry
      const log = await prisma.communicationLog.findUnique({
        where: { id: res.body.logId },
      });
      expect(log!.status).toBe('opted_out');
      expect(log!.errorMsg).toContain('opted out from SMS');
    });

    it('should default to opted-out for SMS if member has NO consent record', async () => {
      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdNoConsent,
          templateId: smsTemplateId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('opted out');
    });

    it('should default to opted-in for Email if member has NO consent record', async () => {
      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdNoConsent,
          templateId: emailTemplateId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('sent');
    });

    it('should successfully compile placeholders and send SMS to opted-in member', async () => {
      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: memberIdOptIn,
          templateId: smsTemplateId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('sent');

      const log = await prisma.communicationLog.findUnique({
        where: { id: res.body.data.logId },
      });
      expect(log!.status).toBe('sent');
      expect(log!.body).toBe('Hello Robert Miller, thank you for joining us!');
    });
  });
});
