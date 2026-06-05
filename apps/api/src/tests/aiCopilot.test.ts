import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 47: AI Assistant / Ministry Copilot Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    // 1. Clean up database
    await prisma.aiAssistantJob.deleteMany({});
    await prisma.usageMeter.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.moduleDefinition.deleteMany({
      where: { key: 'ai-assistant-ministry-copilot' },
    });
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Copilot Test Church', subdomain: 'copilot-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Register Module Definition
    await prisma.moduleDefinition.create({
      data: {
        key: 'ai-assistant-ministry-copilot',
        name: 'AI Assistant / Ministry Copilot Module',
        category: 'AI',
        dependencies: '[]',
      },
    });

    // 4. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.read', 'tenant.settings'] } },
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
    const readPerm = permissions.find((p) => p.name === 'member.read');
    if (readPerm) {
      await prisma.rolePermission.create({
        data: { roleId: memberRole.id, permissionId: readPerm.id },
      });
    }

    const passHash = await bcrypt.hash('password123', 12);

    // 5. Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@copilot-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Standard Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@copilot-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 7. Setup Connected Service for OpenAI AI Translations/Generation
    const encrypted = encryptCredentials(JSON.stringify({ apiKey: 'sk-mock-openai-copilot-key' }), tenantId);
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'openai',
        encryptedCredentials: encrypted,
        providerMode: 'bring_your_own',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.aiAssistantJob.deleteMany({});
    await prisma.usageMeter.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.moduleDefinition.deleteMany({
      where: { key: 'ai-assistant-ministry-copilot' },
    });
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // 1. ENTITLEMENT GATING
  // ═══════════════════════════════════════════════════════════
  describe('Module Entitlements Gating', () => {
    it('should block trigger requests if module is not active', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: 'Sunday youth meeting at 5pm.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Module not activated');
    });

    it('should allow trigger requests once module is activated', async () => {
      // Activate the module
      await prisma.tenantModule.create({
        data: {
          tenantId,
          moduleKey: 'ai-assistant-ministry-copilot',
          status: 'active',
        },
      });

      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: 'Sunday youth meeting at 5pm.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.generatedContent).toContain('[AI Announcement]:');
    });

    it('should block trigger requests if module is suspended', async () => {
      // Suspend the module
      await prisma.tenantModule.update({
        where: {
          tenantId_moduleKey: { tenantId, moduleKey: 'ai-assistant-ministry-copilot' },
        },
        data: { status: 'suspended' },
      });

      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: 'Sunday youth meeting at 5pm.',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Module suspended');
    });

    it('should allow requests again when status is trialing', async () => {
      // Set to trialing
      await prisma.tenantModule.update({
        where: {
          tenantId_moduleKey: { tenantId, moduleKey: 'ai-assistant-ministry-copilot' },
        },
        data: { status: 'trialing' },
      });

      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: 'Sunday youth meeting at 5pm.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. PROMPT TYPES & CONTENT GENERATION
  // ═══════════════════════════════════════════════════════════
  describe('AI Content Generation Prompt Types', () => {
    it('should draft email newsletters', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'email',
          inputPrompt: 'Community outreach plans for June.',
          audience: 'Volunteers',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI Email Draft]:');
      expect(res.body.data.generatedContent).toContain('Dear Volunteers');
      expect(res.body.data.generatedContent).toContain('Community outreach plans for June.');
    });

    it('should draft condensed SMS messages (under 160 characters)', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'sms',
          inputPrompt: 'We are organizing a special prayer service this Friday evening at 7:00 PM in the main auditorium. Everyone is welcome to join us for a powerful time of worship and intercession.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI SMS]:');
      expect(res.body.data.generatedContent.length).toBeLessThanOrEqual(160);
    });

    it('should draft catchy push notifications', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'push',
          inputPrompt: 'Read the pastor recap of yesterday sermon about grace.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI Push]:');
      expect(res.body.data.generatedContent).toContain('Click to read!');
    });

    it('should generate weekly course outlines', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'course_outline',
          inputPrompt: 'Discipleship foundations',
          durationWeeks: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI Course Outline for Discipleship foundations]:');
      expect(res.body.data.generatedContent).toContain('Week 4:');
      expect(res.body.data.generatedContent).not.toContain('Week 5:');
    });

    it('should generate quizzes for lesson content', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'quiz',
          inputPrompt: 'Ephesians chapter 2 states salvation is a free gift.',
          numQuestions: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI Quiz based on: Ephesians chapter 2 states salvation is a free gift.]:');
      expect(res.body.data.generatedContent).toContain('Q3:');
      expect(res.body.data.generatedContent).not.toContain('Q4:');
    });

    it('should draft FAQ responses based on policy text', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'faq',
          inputPrompt: 'Policy: Kids drop-off starts 15 minutes before the main service starts.',
          question: 'What time can I drop my children off?',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI FAQ Reply]:');
      expect(res.body.data.generatedContent).toContain('What time can I drop my children off?');
    });

    it('should draft pastoral CRM follow-up replies', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'crm_reply',
          inputPrompt: 'I visited Grace Church yesterday and loved the music.',
          tone: 'warm',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI CRM Follow-up - Tone: warm]:');
      expect(res.body.data.generatedContent).toContain('I visited Grace Church yesterday and loved the music.');
    });

    it('should suggest automated workflows based on church data', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'workflow_suggestions',
          inputPrompt: '{ "newMembers": 12, "lastWeekAttendance": 150 }',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.generatedContent).toContain('[AI Workflow Suggestions]:');
    });

    it('should reject requests with invalid promptType', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'invalid_type',
          inputPrompt: 'test prompt',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid prompt type');
    });

    it('should reject requests with empty inputPrompt', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: '   ',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('inputPrompt is required');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. RBAC SECURITY
  // ═══════════════════════════════════════════════════════════
  describe('RBAC Gating & Authorization Checks', () => {
    it('should restrict trigger requests from non-admin roles', async () => {
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: 'Sunday youth meeting at 5pm.',
        });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. BILLING & USAGE ACCOUNTING
  // ═══════════════════════════════════════════════════════════
  describe('AI Copilot Metered Billing Verification', () => {
    it('should successfully record token usage under ai_tokens metric key', async () => {
      // 1. Check current tokens usage count
      const meterBefore = await prisma.usageMeter.findFirst({
        where: { tenantId, metricKey: 'ai_tokens' },
      });
      const usageBefore = meterBefore ? meterBefore.quantity : 0;

      // 2. Trigger a job
      const res = await request(app)
        .post('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          promptType: 'announcement',
          inputPrompt: 'Special seminar announcement.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      const tokensRecorded = res.body.data.tokensUsed;
      expect(tokensRecorded).toBeGreaterThan(0);

      // 3. Verify usage meter matches
      const meterAfter = await prisma.usageMeter.findFirst({
        where: { tenantId, metricKey: 'ai_tokens' },
      });
      expect(meterAfter).toBeDefined();
      expect(meterAfter!.quantity).toBe(usageBefore + tokensRecorded);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. QUERYING & HISTORY
  // ═══════════════════════════════════════════════════════════
  describe('Querying & List History', () => {
    it('should list all executed copilot jobs', async () => {
      const res = await request(app)
        .get('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter jobs by status', async () => {
      const res = await request(app)
        .get('/api/ai-copilot/jobs?status=completed')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((j: any) => j.status === 'completed')).toBe(true);
    });

    it('should fetch single job details', async () => {
      // Get all jobs first to find a valid ID
      const listRes = await request(app)
        .get('/api/ai-copilot/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const jobId = listRes.body.data[0].id;

      const res = await request(app)
        .get(`/api/ai-copilot/jobs/${jobId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(jobId);
    });

    it('should return 404 for non-existent job ID', async () => {
      const res = await request(app)
        .get('/api/ai-copilot/jobs/00000000-0000-0000-0000-000000000000')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
