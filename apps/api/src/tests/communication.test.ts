import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 28: Communication, Notification & Follow-Up Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberId: string;
  let memberIdNoPhone: string;
  let smsTemplateId: string;
  let emailTemplateId: string;

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.followUpStep.deleteMany({});
    await prisma.followUpSequence.deleteMany({});
    await prisma.automationWorkflow.deleteMany({});
    await prisma.scheduledMessage.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.communicationLog.deleteMany({});
    await prisma.communicationTemplate.deleteMany({});
    await prisma.consentRecord.deleteMany({});
    await prisma.crmFollowUpTask.deleteMany({});
    await prisma.crmTimelineEvent.deleteMany({});
    await prisma.crmContact.deleteMany({});
    await prisma.memberCrmStage.deleteMany({});
    await prisma.crmStage.deleteMany({});
    await prisma.crmPipeline.deleteMany({});
    await prisma.memberTagAssignment.deleteMany({});
    await prisma.memberTag.deleteMany({});
    await prisma.memberNote.deleteMany({});
    await prisma.memberCheckIn.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Comms Beacon Church', subdomain: 'beacon-comms', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Admin Role + Permissions ────────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin User ──────────────────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@beacon-comms.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // ── Seed Subscription ──────────────────────────────────
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Standard Comms Plan', basePrice: 10.0, includedMembers: 100, includedSms: 100,
        includedStorageGb: 10.0, memberOverageRate: 1.0, smsOverageRate: 0.1, storageOverageRate: 1.0,
      },
    });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.tenantSubscription.create({
      data: { tenantId, planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd },
    });

    // ── Seed Twilio credentials ────────────────────────────
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'twilio',
        encryptedCredentials: require('../lib/vault').encryptCredentials(
          JSON.stringify({ accountSid: 'AC_test', authToken: 'auth_test', fromNumber: '+1234' }),
          tenantId,
        ),
      },
    });

    // ── Members ────────────────────────────────────────────
    const member = await prisma.member.create({
      data: { tenantId, firstName: 'Chidi', lastName: 'Okoro', phone: '+2348001111111', email: 'chidi@example.com' },
    });
    memberId = member.id;

    const memberNoPhone = await prisma.member.create({
      data: { tenantId, firstName: 'Emeka', lastName: 'Nwosu' },
    });
    memberIdNoPhone = memberNoPhone.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // A. MESSAGE TEMPLATES (Message Template API)
  // ═══════════════════════════════════════════════════════════

  describe('Message Templates', () => {
    it('should create an SMS template with placeholders', async () => {
      const res = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Visitor Follow-up SMS',
          type: 'sms',
          body: 'Hello {{first_name}} {{last_name}}, welcome to our church!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Visitor Follow-up SMS');
      expect(res.body.data.type).toBe('sms');
      smsTemplateId = res.body.data.id;
    });

    it('should create an email template with subject', async () => {
      const res = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Weekly Devotional',
          type: 'email',
          subject: 'Your Weekly Devotional',
          body: 'Dear {{first_name}}, here is your devotion for this week.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.subject).toBe('Your Weekly Devotional');
      emailTemplateId = res.body.data.id;
    });

    it('should reject template creation without required fields', async () => {
      const res = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should list templates', async () => {
      const res = await request(app)
        .get('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter templates by type', async () => {
      const res = await request(app)
        .get('/api/communication/templates?type=sms')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('sms');
    });

    it('should get a single template', async () => {
      const res = await request(app)
        .get(`/api/communication/templates/${smsTemplateId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(smsTemplateId);
    });

    it('should update a template body', async () => {
      const res = await request(app)
        .put(`/api/communication/templates/${emailTemplateId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'Updated: Dear {{first_name}}, your weekly study is ready.' });

      expect(res.status).toBe(200);
      expect(res.body.data.body).toContain('Updated');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // B. CONSENT MANAGEMENT & SEND
  // ═══════════════════════════════════════════════════════════

  describe('Consent Gates & Send', () => {
    it('should set consent opt-in for a member', async () => {
      const res = await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId, optInSms: true, optInEmail: true });

      expect(res.status).toBe(200);
      expect(res.body.data.optInSms).toBe(true);
    });

    it('should successfully send SMS to opted-in member', async () => {
      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId, templateId: smsTemplateId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block SMS to opted-out member', async () => {
      await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId, optInSms: false });

      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId, templateId: smsTemplateId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('opted out');

      // Reset for future tests
      await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId, optInSms: true });
    });

    it('should default to email opt-in if no consent record exists', async () => {
      const res = await request(app)
        .post('/api/communication/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: memberIdNoPhone, templateId: emailTemplateId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // C. NOTIFICATION PREFERENCES (Notification Preference API)
  // ═══════════════════════════════════════════════════════════

  describe('Notification Preferences', () => {
    it('should set notification preferences with quiet hours', async () => {
      const res = await request(app)
        .post('/api/communication/preferences')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId,
          preferEmail: true,
          preferSms: true,
          preferPush: true,
          preferWhatsapp: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.preferEmail).toBe(true);
      expect(res.body.data.preferSms).toBe(true);
      expect(res.body.data.preferPush).toBe(true);
      expect(res.body.data.preferWhatsapp).toBe(false);
      expect(res.body.data.quietHoursStart).toBe('22:00');
    });

    it('should update existing preferences (upsert)', async () => {
      const res = await request(app)
        .post('/api/communication/preferences')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId, preferWhatsapp: true });

      expect(res.status).toBe(200);
      expect(res.body.data.preferWhatsapp).toBe(true);
      // Other preferences should remain unchanged
      expect(res.body.data.preferEmail).toBe(true);
    });

    it('should retrieve notification preferences for a member', async () => {
      const res = await request(app)
        .get(`/api/communication/preferences/${memberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferSms).toBe(true);
      expect(res.body.data.quietHoursEnd).toBe('07:00');
    });

    it('should return default message for member with no preferences', async () => {
      const res = await request(app)
        .get(`/api/communication/preferences/${memberIdNoPhone}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message || res.body.data.preferEmail).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // D. DELIVERY LOGS (Delivery Log API)
  // ═══════════════════════════════════════════════════════════

  describe('Delivery Logs & Stats', () => {
    it('should list delivery logs', async () => {
      const res = await request(app)
        .get('/api/communication/logs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter delivery logs by status', async () => {
      const res = await request(app)
        .get('/api/communication/logs?status=sent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((l: any) => l.status === 'sent')).toBe(true);
    });

    it('should filter delivery logs by member', async () => {
      const res = await request(app)
        .get(`/api/communication/logs?memberId=${memberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((l: any) => l.memberId === memberId)).toBe(true);
    });

    it('should get delivery statistics grouped by status and channel', async () => {
      const res = await request(app)
        .get('/api/communication/stats')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.byStatus)).toBe(true);
      expect(Array.isArray(res.body.data.byChannel)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // E. SCHEDULED MESSAGES
  // ═══════════════════════════════════════════════════════════

  describe('Scheduled Messages', () => {
    let scheduledMsgId: string;

    it('should schedule a future message', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const res = await request(app)
        .post('/api/communication/scheduled')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: emailTemplateId,
          scheduledAt: futureDate.toISOString(),
          audienceType: 'all',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.audienceType).toBe('all');
      scheduledMsgId = res.body.data.id;
    });

    it('should schedule an individual targeted message', async () => {
      // Schedule for the past so it processes immediately
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 5);

      const res = await request(app)
        .post('/api/communication/scheduled')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateId: emailTemplateId,
          scheduledAt: pastDate.toISOString(),
          audienceType: 'individual',
          audienceFilter: memberIdNoPhone,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.audienceType).toBe('individual');
    });

    it('should reject scheduled message without required fields', async () => {
      const res = await request(app)
        .post('/api/communication/scheduled')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ templateId: emailTemplateId });

      expect(res.status).toBe(400);
    });

    it('should list pending scheduled messages', async () => {
      const res = await request(app)
        .get('/api/communication/scheduled?status=pending')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should cancel a pending scheduled message', async () => {
      const res = await request(app)
        .post(`/api/communication/scheduled/${scheduledMsgId}/cancel`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('should return 404 when cancelling non-existent message', async () => {
      const res = await request(app)
        .post('/api/communication/scheduled/fake-id/cancel')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should process due scheduled messages', async () => {
      const res = await request(app)
        .post('/api/communication/scheduled/process')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.processed).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // F. AUTOMATION WORKFLOWS (Automation Workflow API)
  // ═══════════════════════════════════════════════════════════

  describe('Automation Workflows', () => {
    let workflowId: string;

    it('should create an automation workflow for member.created events', async () => {
      const res = await request(app)
        .post('/api/communication/automations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Welcome New Member',
          triggerEvent: 'member.created',
          templateId: emailTemplateId,
          channel: 'email',
          delayMinutes: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Welcome New Member');
      expect(res.body.data.triggerEvent).toBe('member.created');
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.executionCount).toBe(0);
      workflowId = res.body.data.id;
    });

    it('should create a salvation follow-up automation', async () => {
      const res = await request(app)
        .post('/api/communication/automations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Salvation Response Follow-Up',
          triggerEvent: 'salvation.response',
          templateId: smsTemplateId,
          channel: 'sms',
          delayMinutes: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.delayMinutes).toBe(30);
    });

    it('should reject automation without required fields', async () => {
      const res = await request(app)
        .post('/api/communication/automations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should list all automation workflows', async () => {
      const res = await request(app)
        .get('/api/communication/automations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should trigger automations for an event and increment execution count', async () => {
      const res = await request(app)
        .post('/api/communication/automations/trigger')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ triggerEvent: 'member.created' });

      expect(res.status).toBe(200);
      expect(res.body.data.triggered).toBe(1);
      expect(res.body.data.workflows[0].name).toBe('Welcome New Member');

      // Verify execution count was incremented
      const list = await request(app)
        .get('/api/communication/automations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const wf = list.body.data.find((w: any) => w.id === workflowId);
      expect(wf.executionCount).toBe(1);
      expect(wf.lastExecutedAt).toBeDefined();
    });

    it('should deactivate an automation workflow', async () => {
      const res = await request(app)
        .put(`/api/communication/automations/${workflowId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should not trigger deactivated workflows', async () => {
      const res = await request(app)
        .post('/api/communication/automations/trigger')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ triggerEvent: 'member.created' });

      expect(res.status).toBe(200);
      expect(res.body.data.triggered).toBe(0);
    });

    it('should delete an automation workflow', async () => {
      const res = await request(app)
        .delete(`/api/communication/automations/${workflowId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // G. FOLLOW-UP SEQUENCES / DRIP CAMPAIGNS
  // ═══════════════════════════════════════════════════════════

  describe('Follow-Up Sequences (Drip Campaigns)', () => {
    let sequenceId: string;

    it('should create a multi-step follow-up sequence', async () => {
      const res = await request(app)
        .post('/api/communication/sequences')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Visitor 30-Day Drip',
          description: 'Automated follow-up over 30 days for first-time visitors',
          triggerEvent: 'first_visit',
          steps: [
            { templateId: emailTemplateId, channel: 'email', delayDays: 1, order: 0 },
            { templateId: smsTemplateId, channel: 'sms', delayDays: 3, order: 1 },
            { templateId: emailTemplateId, channel: 'email', delayDays: 7, order: 2 },
            { templateId: emailTemplateId, channel: 'email', delayDays: 14, order: 3 },
            { templateId: emailTemplateId, channel: 'email', delayDays: 30, order: 4 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Visitor 30-Day Drip');
      expect(res.body.data.triggerEvent).toBe('first_visit');
      expect(res.body.data.steps.length).toBe(5);
      expect(res.body.data.steps[0].delayDays).toBe(1);
      expect(res.body.data.steps[1].channel).toBe('sms');
      expect(res.body.data.steps[4].delayDays).toBe(30);
      sequenceId = res.body.data.id;
    });

    it('should reject sequence creation without steps', async () => {
      const res = await request(app)
        .post('/api/communication/sequences')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Empty Sequence', triggerEvent: 'first_visit', steps: [] });

      expect(res.status).toBe(400);
    });

    it('should list all follow-up sequences with steps', async () => {
      const res = await request(app)
        .get('/api/communication/sequences')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].steps.length).toBe(5);
    });

    it('should get a single sequence with steps ordered', async () => {
      const res = await request(app)
        .get(`/api/communication/sequences/${sequenceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(sequenceId);
      // Verify steps are ordered by `order` field
      const orders = res.body.data.steps.map((s: any) => s.order);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
      }
    });

    it('should return 404 for non-existent sequence', async () => {
      const res = await request(app)
        .get('/api/communication/sequences/fake-id')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should delete a sequence and cascade steps', async () => {
      const res = await request(app)
        .delete(`/api/communication/sequences/${sequenceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cascade deletion
      const steps = await prisma.followUpStep.findMany({ where: { sequenceId } });
      expect(steps.length).toBe(0);
    });
  });
});
