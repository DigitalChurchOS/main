import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 33: Forms & Workflow Automation Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let formId: string;
  let submissionId: string;
  let triggerId: string;

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.formWorkflowAction.deleteMany({});
    await prisma.formWorkflowTrigger.deleteMany({});
    await prisma.formSubmission.deleteMany({});
    await prisma.customForm.deleteMany({});
    await prisma.crmFollowUpTask.deleteMany({});
    await prisma.crmContact.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Automation Church', subdomain: 'auto-church', status: 'active' },
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
      data: { tenantId, email: 'admin@auto.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);
  });

  describe('Form Creation & Configuration', () => {
    it('should allow admin to build a form with conditional logic fields', async () => {
      const fields = [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'text', required: true },
        { name: 'interests', label: 'Serving Interests', type: 'dropdown', required: true, options: ['Youth', 'Media', 'Welfare'] },
        { name: 'hasExperience', label: 'Do you have experience?', type: 'dropdown', required: true, options: ['yes', 'no'] },
        {
          name: 'experienceDetails',
          label: 'Experience Details',
          type: 'text',
          required: true,
          conditionalLogic: {
            dependsOnField: 'hasExperience',
            valueEquals: 'yes',
            show: true,
          },
        },
      ];

      const res = await request(app)
        .post('/api/forms')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Volunteer Application',
          description: 'Apply to join one of our serving teams.',
          fields,
          confirmationMessage: 'Thanks! A coordinator will review your application.',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Volunteer Application');
      formId = res.body.data.id;
    });

    it('should list forms for admin', async () => {
      const res = await request(app)
        .get('/api/forms')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should allow public retrieval of a form', async () => {
      const res = await request(app)
        .get(`/api/forms/${formId}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Volunteer Application');
    });
  });

  describe('Form Submissions & Validation Logic', () => {
    it('should reject submission if a required field is missing', async () => {
      const res = await request(app)
        .post(`/api/forms/${formId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: {
            lastName: 'Williams',
            email: 'tim@auto.com',
            interests: 'Media',
            hasExperience: 'no',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('First Name');
    });

    it('should bypass validation for hidden conditional fields', async () => {
      // experienceDetails is required but only when hasExperience is 'yes'
      // If hasExperience is 'no', it is hidden and should not fail validation when missing
      const res = await request(app)
        .post(`/api/forms/${formId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: {
            firstName: 'Tim',
            lastName: 'Williams',
            email: 'tim@auto.com',
            interests: 'Media',
            hasExperience: 'no',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });

    it('should enforce validation for active conditional fields', async () => {
      // If hasExperience is 'yes', experienceDetails becomes active and required
      const res = await request(app)
        .post(`/api/forms/${formId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: {
            firstName: 'Tim',
            lastName: 'Williams',
            email: 'tim@auto.com',
            interests: 'Media',
            hasExperience: 'yes',
            // experienceDetails is missing
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Experience Details');
    });

    it('should submit successfully, automatically create Member and CRM records', async () => {
      const res = await request(app)
        .post(`/api/forms/${formId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: {
            firstName: 'Sarah',
            lastName: 'Connor',
            email: 'sarah@connor.com',
            interests: 'Youth',
            hasExperience: 'yes',
            experienceDetails: 'Coordinated youth camps for 3 years.',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.memberId).toBeDefined();
      submissionId = res.body.data.id;

      // Verify Member was created
      const member = await prisma.member.findUnique({
        where: { id: res.body.data.memberId },
      });
      expect(member).toBeDefined();
      expect(member!.firstName).toBe('Sarah');
      expect(member!.membershipStatus).toBe('visitor');

      // Verify CRM Contact was created
      const contact = await prisma.crmContact.findFirst({
        where: { memberId: member!.id },
      });
      expect(contact).toBeDefined();
      expect(contact!.leadSource).toBe('form_submission');
    });
  });

  describe('Workflow Triggers & Actions Routing', () => {
    it('should configure a workflow trigger matching condition values', async () => {
      const res = await request(app)
        .post(`/api/forms/${formId}/triggers`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          triggerType: 'submission',
          conditionField: 'interests',
          conditionValue: 'Youth',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.triggerType).toBe('submission');
      triggerId = res.body.data.id;
    });

    it('should link a task creation action to the trigger', async () => {
      const res = await request(app)
        .post(`/api/forms/triggers/${triggerId}/actions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actionType: 'create_task',
          templateText: 'Follow up with Youth Ministry applicant',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.actionType).toBe('create_task');
      expect(res.body.data.templateText).toBe('Follow up with Youth Ministry applicant');
    });

    it('should execute action (create follow-up task) when matching form is submitted', async () => {
      // Create a submission matching "interests: Youth"
      const res = await request(app)
        .post(`/api/forms/${formId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: {
            firstName: 'John',
            lastName: 'Connor',
            email: 'john@connor.com',
            interests: 'Youth',
            hasExperience: 'no',
          },
        });

      expect(res.status).toBe(201);

      // Verify that CRM task was automatically created
      const task = await prisma.crmFollowUpTask.findFirst({
        where: {
          title: 'Follow up with Youth Ministry applicant',
          tenantId,
        },
      });

      expect(task).toBeDefined();
      expect(task!.status).toBe('pending');
    });

    it('should NOT execute action when non-matching form is submitted', async () => {
      // Clean tasks
      await prisma.crmFollowUpTask.deleteMany({});

      // Create a submission with "interests: Media" (does not match condition "Youth")
      await request(app)
        .post(`/api/forms/${formId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: {
            firstName: 'Kyle',
            lastName: 'Reese',
            email: 'kyle@reese.com',
            interests: 'Media',
            hasExperience: 'no',
          },
        });

      // Verify no task was created
      const count = await prisma.crmFollowUpTask.count({
        where: { tenantId },
      });
      expect(count).toBe(0);
    });
  });

  describe('Approval Workflows', () => {
    let approvalFormId: string;
    let pendingSubmissionId: string;

    beforeAll(async () => {
      // 1. Create a form
      const formRes = await request(app)
        .post('/api/forms')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Ordination Form',
          fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
        });
      approvalFormId = formRes.body.data.id;

      // 2. Register an approval trigger on it to force "pending" state
      await prisma.formWorkflowTrigger.create({
        data: {
          tenantId,
          formId: approvalFormId,
          triggerType: 'approval',
        },
      });
    });

    it('should start submission in pending status if approval workflow is configured', async () => {
      const res = await request(app)
        .post(`/api/forms/${approvalFormId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: { name: 'Peter Parker' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.approvalStatus).toBe('pending');
      pendingSubmissionId = res.body.data.id;
    });

    it('should transition status to approved on staff approval', async () => {
      const res = await request(app)
        .post(`/api/forms/submissions/${pendingSubmissionId}/approve`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Candidate passes background checks.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('approved');
      expect(res.body.data.approvedById).toBe(adminUserId);
      expect(res.body.data.approvalNotes).toBe('Candidate passes background checks.');
    });

    it('should transition status to rejected on staff rejection', async () => {
      // Create another submission
      const subRes = await request(app)
        .post(`/api/forms/${approvalFormId}/submit`)
        .set('x-tenant-id', tenantId)
        .send({
          answers: { name: 'Green Goblin' },
        });
      const goblinSubId = subRes.body.data.id;

      const res = await request(app)
        .post(`/api/forms/submissions/${goblinSubId}/reject`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Failed evaluation.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('rejected');
      expect(res.body.data.approvalNotes).toBe('Failed evaluation.');
    });
  });

  describe('Form Reports & Analytics', () => {
    it('should return aggregated counts of submissions and responses', async () => {
      const res = await request(app)
        .get(`/api/forms/${formId}/report`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSubmissions).toBeGreaterThanOrEqual(2);
      expect(res.body.data.approvalStatusCounts).toBeDefined();
      expect(res.body.data.aggregates.interests).toBeDefined();
      expect(res.body.data.aggregates.interests.Youth).toBeGreaterThanOrEqual(1);
    });
  });
});
