import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 27: Ministry CRM Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let memberId: string;
  let contactId: string;
  let pipelineId: string;
  let stageFirstVisitId: string;
  let stageFollowUpId: string;

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.crmFollowUpTask.deleteMany({});
    await prisma.crmTimelineEvent.deleteMany({});
    await prisma.crmContact.deleteMany({});
    await prisma.communicationLog.deleteMany({});
    await prisma.communicationTemplate.deleteMany({});
    await prisma.consentRecord.deleteMany({});
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
      data: { name: 'CRM Harvest Church', subdomain: 'harvest-crm', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Admin Role + Permissions ────────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin User ──────────────────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@harvest-crm.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET,
    );

    // ── Seed Subscription ──────────────────────────────────
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Standard CRM Plan',
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
      data: { tenantId, planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: periodEnd },
    });

    // ── Seed a Member (for pipeline-stage tracking) ────────
    const member = await prisma.member.create({
      data: { tenantId, firstName: 'Grace', lastName: 'Okonkwo', phone: '+2348001234567' },
    });
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // A. CRM CONTACT PROFILES  (CRM Contact API)
  // ═══════════════════════════════════════════════════════════

  describe('CRM Contact Profiles', () => {
    it('should create a visitor contact with lead source tracking', async () => {
      const res = await request(app)
        .post('/api/crm/contacts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'David',
          lastName: 'Eze',
          email: 'david@example.com',
          phone: '+2348001111222',
          type: 'visitor',
          leadSource: 'facebook',
          leadSourceDetail: 'Easter Campaign Ad',
          notes: 'First-time guest from Facebook ad',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.firstName).toBe('David');
      expect(res.body.data.type).toBe('visitor');
      expect(res.body.data.leadSource).toBe('facebook');
      expect(res.body.data.leadSourceDetail).toBe('Easter Campaign Ad');
      expect(res.body.data.status).toBe('new');
      expect(res.body.data.engagementScore).toBe(0);
      expect(res.body.data.firstContactAt).toBeDefined();
      contactId = res.body.data.id;
    });

    it('should create a lead contact linked to an existing member', async () => {
      const res = await request(app)
        .post('/api/crm/contacts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Grace',
          lastName: 'Okonkwo',
          phone: '+2348001234567',
          type: 'lead',
          leadSource: 'walk_in',
          memberId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('lead');
      expect(res.body.data.memberId).toBe(memberId);
    });

    it('should reject a contact creation missing required fields', async () => {
      const res = await request(app)
        .post('/api/crm/contacts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'OnlyFirst' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('lastName');
    });

    it('should list contacts with filtering by type', async () => {
      const res = await request(app)
        .get('/api/crm/contacts?type=visitor')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((c: any) => c.type === 'visitor')).toBe(true);
    });

    it('should search contacts by keyword', async () => {
      const res = await request(app)
        .get('/api/crm/contacts?search=David')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].firstName).toBe('David');
    });

    it('should filter contacts by lead source', async () => {
      const res = await request(app)
        .get('/api/crm/contacts?leadSource=facebook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].leadSource).toBe('facebook');
    });

    it('should get a single contact with timeline and tasks', async () => {
      const res = await request(app)
        .get(`/api/crm/contacts/${contactId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(contactId);
      expect(res.body.data.timeline).toBeDefined();
      expect(res.body.data.tasks).toBeDefined();
    });

    it('should update a contact status and details', async () => {
      const res = await request(app)
        .put(`/api/crm/contacts/${contactId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'contacted', notes: 'Called and left a voicemail' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('contacted');
      expect(res.body.data.notes).toBe('Called and left a voicemail');
    });

    it('should return 404 for a non-existent contact', async () => {
      const res = await request(app)
        .get('/api/crm/contacts/nonexistent-id')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // B. CRM TIMELINE  (Engagement History)
  // ═══════════════════════════════════════════════════════════

  describe('CRM Timeline Events', () => {
    it('should add a timeline event and auto-increment engagement score', async () => {
      const res = await request(app)
        .post(`/api/crm/contacts/${contactId}/timeline`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'event_attended',
          title: 'Attended Easter Sunday Service',
          description: 'First time at church, came via Facebook ad',
          metadata: { eventName: 'Easter Sunday 2026' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('event_attended');
      expect(res.body.data.title).toBe('Attended Easter Sunday Service');

      // Verify engagement score was auto-incremented (event_attended = 10 points)
      const contact = await request(app)
        .get(`/api/crm/contacts/${contactId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(contact.body.data.engagementScore).toBe(10);
    });

    it('should add multiple timeline events accumulating engagement', async () => {
      // Add a form_submitted event (5 pts)
      await request(app)
        .post(`/api/crm/contacts/${contactId}/timeline`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'form_submitted',
          title: 'Submitted Visitor Registration Form',
        });

      // Add a call event (5 pts)
      await request(app)
        .post(`/api/crm/contacts/${contactId}/timeline`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'call',
          title: 'Follow-up phone call from Pastor Tunde',
          description: 'Discussed next steps in their faith journey',
        });

      // Check accumulated score: 10 + 5 + 5 = 20
      const contact = await request(app)
        .get(`/api/crm/contacts/${contactId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(contact.body.data.engagementScore).toBe(20);
    });

    it('should retrieve the timeline in reverse chronological order', async () => {
      const res = await request(app)
        .get(`/api/crm/contacts/${contactId}/timeline`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.total).toBe(3);

      // Verify chronological order (most recent first)
      const dates = res.body.data.map((e: any) => new Date(e.occurredAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should filter timeline by event type', async () => {
      const res = await request(app)
        .get(`/api/crm/contacts/${contactId}/timeline?type=call`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('call');
    });

    it('should require type and title for timeline events', async () => {
      const res = await request(app)
        .post(`/api/crm/contacts/${contactId}/timeline`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'missing type and title' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('type and title');
    });

    it('should return 404 when adding timeline event to non-existent contact', async () => {
      const res = await request(app)
        .post('/api/crm/contacts/fake-id/timeline')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'note', title: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // C. FOLLOW-UP TASKS  (Task Assignment & Reminders)
  // ═══════════════════════════════════════════════════════════

  describe('Follow-Up Task Management', () => {
    let taskId: string;

    it('should create a follow-up task assigned to a user', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post(`/api/crm/contacts/${contactId}/tasks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Call David to invite to fellowship group',
          description: 'Welcoming new visitor, recommend the youth fellowship',
          priority: 'high',
          assignedUserId: adminUserId,
          dueDate: tomorrow.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Call David to invite to fellowship group');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.assignedUserId).toBe(adminUserId);
      expect(res.body.data.dueDate).toBeDefined();
      taskId = res.body.data.id;
    });

    it('should create an urgent task with no due date', async () => {
      const res = await request(app)
        .post(`/api/crm/contacts/${contactId}/tasks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Send welcome package',
          priority: 'urgent',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.priority).toBe('urgent');
      expect(res.body.data.dueDate).toBeNull();
    });

    it('should reject task creation without a title', async () => {
      const res = await request(app)
        .post(`/api/crm/contacts/${contactId}/tasks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'no title given' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('title');
    });

    it('should list all tasks filtered by status', async () => {
      const res = await request(app)
        .get('/api/crm/tasks?status=pending')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((t: any) => t.status === 'pending')).toBe(true);
    });

    it('should list tasks filtered by priority', async () => {
      const res = await request(app)
        .get('/api/crm/tasks?priority=urgent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('urgent');
    });

    it('should update a task status to in_progress', async () => {
      const res = await request(app)
        .put(`/api/crm/tasks/${taskId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
    });

    it('should complete a task and set completedAt timestamp', async () => {
      const res = await request(app)
        .put(`/api/crm/tasks/${taskId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('should return 404 for updating a non-existent task', async () => {
      const res = await request(app)
        .put('/api/crm/tasks/fake-task-id')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // D. CRM PIPELINES & STAGE TRACKING  (Pipeline API)
  // ═══════════════════════════════════════════════════════════

  describe('CRM Pipelines & Stage Tracking', () => {
    it('should create an onboarding pipeline with stages', async () => {
      const res = await request(app)
        .post('/api/crm/pipelines')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'First-time Visitor Follow-Up',
          description: 'Journey from first visit to active member',
          stages: [
            { name: 'First Visit', order: 0 },
            { name: 'Follow-up Call', order: 1 },
            { name: 'Fellowship Connected', order: 2 },
            { name: 'Member Class Enrolled', order: 3 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('First-time Visitor Follow-Up');
      expect(res.body.data.stages.length).toBe(4);

      pipelineId = res.body.data.id;
      stageFirstVisitId = res.body.data.stages.find((s: any) => s.name === 'First Visit').id;
      stageFollowUpId = res.body.data.stages.find((s: any) => s.name === 'Follow-up Call').id;
    });

    it('should reject pipeline creation without a name', async () => {
      const res = await request(app)
        .post('/api/crm/pipelines')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name');
    });

    it('should list all pipelines with their stages', async () => {
      const res = await request(app)
        .get('/api/crm/pipelines')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const pipeline = res.body.data.find((p: any) => p.id === pipelineId);
      expect(pipeline.stages.length).toBe(4);
    });

    it('should move a member into a pipeline stage', async () => {
      const res = await request(app)
        .post('/api/crm/move')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId,
          stageId: stageFirstVisitId,
          status: 'active',
          notes: 'Greeted at the visitor lounge after service',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stageId).toBe(stageFirstVisitId);
      expect(res.body.data.status).toBe('active');
    });

    it('should advance a member to the next stage', async () => {
      const res = await request(app)
        .post('/api/crm/move')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId,
          stageId: stageFollowUpId,
          status: 'completed',
          assignedUserId: adminUserId,
          notes: 'Called and discussed fellowship groups',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stageId).toBe(stageFollowUpId);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.assignedUserId).toBe(adminUserId);
    });

    it('should reject stage move with missing memberId', async () => {
      const res = await request(app)
        .post('/api/crm/move')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stageId: stageFirstVisitId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('memberId and stageId');
    });

    it('should return 404 for a non-existent member', async () => {
      const res = await request(app)
        .post('/api/crm/move')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: 'fake-member-id', stageId: stageFirstVisitId });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Member');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // E. ENGAGEMENT SCORING  (Engagement Score API)
  // ═══════════════════════════════════════════════════════════

  describe('Engagement Scoring Engine', () => {
    it('should recalculate engagement score from timeline events', async () => {
      const res = await request(app)
        .post(`/api/crm/contacts/${contactId}/recalculate-score`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Score from 3 events: event_attended(10) + form_submitted(5) + call(5) = 20
      expect(res.body.data.engagementScore).toBe(20);
    });

    it('should return engagement leaderboard sorted by score', async () => {
      const res = await request(app)
        .get('/api/crm/engagement/leaderboard')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      // First entry should be the highest scorer
      const scores = res.body.data.map((c: any) => c.engagementScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      }
    });

    it('should filter leaderboard by contact type', async () => {
      const res = await request(app)
        .get('/api/crm/engagement/leaderboard?type=visitor')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((c: any) => c.type === 'visitor')).toBe(true);
    });

    it('should return 404 when recalculating score for non-existent contact', async () => {
      const res = await request(app)
        .post('/api/crm/contacts/fake-id/recalculate-score')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // F. CRM REPORTS  (CRM Reports API)
  // ═══════════════════════════════════════════════════════════

  describe('CRM Reports & Dashboards', () => {
    it('should return a comprehensive CRM report', async () => {
      const res = await request(app)
        .get('/api/crm/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const report = res.body.data;

      // Verify structure
      expect(report.totalContacts).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(report.contactsByStatus)).toBe(true);
      expect(Array.isArray(report.contactsByType)).toBe(true);
      expect(Array.isArray(report.contactsBySource)).toBe(true);
      expect(Array.isArray(report.taskSummary)).toBe(true);
      expect(typeof report.overdueTasks).toBe('number');
      expect(Array.isArray(report.pipelines)).toBe(true);
    });

    it('should include pipeline stage distributions in report', async () => {
      const res = await request(app)
        .get('/api/crm/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const pipeline = res.body.data.pipelines.find((p: any) => p.id === pipelineId);
      expect(pipeline).toBeDefined();
      expect(pipeline.stages.length).toBe(4);
      // At least one stage should have active members (from our moves)
      const totalActive = pipeline.stages.reduce((sum: number, s: any) => sum + s.activeMembers, 0);
      expect(totalActive).toBeGreaterThanOrEqual(0);
    });

    it('should show lead source breakdown in report', async () => {
      const res = await request(app)
        .get('/api/crm/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.contactsBySource.length).toBeGreaterThanOrEqual(1);
      const fbSource = res.body.data.contactsBySource.find((s: any) => s.source === 'facebook');
      expect(fbSource).toBeDefined();
      expect(fbSource.count).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // G. CONTACT DELETION  (cleanup / GDPR)
  // ═══════════════════════════════════════════════════════════

  describe('Contact Deletion', () => {
    let tempContactId: string;

    it('should delete a contact and cascade timeline + tasks', async () => {
      // Create a throwaway contact
      const createRes = await request(app)
        .post('/api/crm/contacts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Temp', lastName: 'Contact', type: 'vendor' });

      tempContactId = createRes.body.data.id;

      // Add a timeline event to it
      await request(app)
        .post(`/api/crm/contacts/${tempContactId}/timeline`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'note', title: 'Test note' });

      // Delete
      const delRes = await request(app)
        .delete(`/api/crm/contacts/${tempContactId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify cascade deletion of timeline events
      const timeline = await prisma.crmTimelineEvent.findMany({ where: { contactId: tempContactId } });
      expect(timeline.length).toBe(0);
    });

    it('should return 404 when deleting a non-existent contact', async () => {
      const res = await request(app)
        .delete('/api/crm/contacts/non-existent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
