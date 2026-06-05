import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 29: Live Chat, Pastoral Care & Support Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let memberId: string;
  let conversationId: string;
  let livestreamConvId: string;

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.chatFollowUpTask.deleteMany({});
    await prisma.careRequest.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatConversation.deleteMany({});
    await prisma.savedReply.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Hope Care Church', subdomain: 'hope-care', status: 'active' },
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
      data: { tenantId, email: 'admin@hope-care.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // ── Member ────────────────────────────────────────────
    const member = await prisma.member.create({
      data: { tenantId, firstName: 'Grace', lastName: 'Adeyemi', phone: '+2348009990001', email: 'grace@example.com' },
    });
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // A. CHAT CONVERSATIONS  (Chat Conversation API)
  // ═══════════════════════════════════════════════════════════

  describe('Chat Conversations', () => {
    it('should create a website chat from an anonymous visitor', async () => {
      const res = await request(app)
        .post('/api/chat/conversations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visitorName: 'John Doe',
          visitorEmail: 'john@visitor.com',
          channel: 'website',
          subject: 'Service times inquiry',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visitorName).toBe('John Doe');
      expect(res.body.data.channel).toBe('website');
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.priority).toBe('normal');
      conversationId = res.body.data.id;
    });

    it('should create a livestream chat from an identified member', async () => {
      const res = await request(app)
        .post('/api/chat/conversations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId,
          channel: 'livestream',
          subject: 'Prayer request during stream',
          priority: 'high',
          tags: 'prayer,livestream',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.channel).toBe('livestream');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.tags).toBe('prayer,livestream');
      livestreamConvId = res.body.data.id;
    });

    it('should list conversations with status filter', async () => {
      const res = await request(app)
        .get('/api/chat/conversations?status=open')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.total).toBe(2);
    });

    it('should list conversations filtered by channel', async () => {
      const res = await request(app)
        .get('/api/chat/conversations?channel=livestream')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].channel).toBe('livestream');
    });

    it('should get a conversation with messages and member details', async () => {
      const res = await request(app)
        .get(`/api/chat/conversations/${livestreamConvId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(livestreamConvId);
      expect(res.body.data.member.firstName).toBe('Grace');
      expect(Array.isArray(res.body.data.messages)).toBe(true);
    });

    it('should return 404 for non-existent conversation', async () => {
      const res = await request(app)
        .get('/api/chat/conversations/fake-id')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should update conversation tags and internal notes', async () => {
      const res = await request(app)
        .put(`/api/chat/conversations/${conversationId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tags: 'first_visit,needs_follow_up',
          internalNotes: 'Visitor seems interested in joining a small group.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tags).toBe('first_visit,needs_follow_up');
      expect(res.body.data.internalNotes).toContain('small group');
    });

    it('should resolve a conversation and set resolvedAt', async () => {
      const res = await request(app)
        .put(`/api/chat/conversations/${conversationId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
      expect(res.body.data.resolvedAt).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // B. AGENT ASSIGNMENT  (Agent Assignment API)
  // ═══════════════════════════════════════════════════════════

  describe('Agent Assignment', () => {
    it('should assign an agent to a conversation', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/assign`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ agentId: adminUserId });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedAgentId).toBe(adminUserId);
      expect(res.body.data.status).toBe('assigned');
    });

    it('should add a system message on assignment', async () => {
      const res = await request(app)
        .get(`/api/chat/conversations/${livestreamConvId}/messages?includeInternal=true`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const systemMsg = res.body.data.find((m: any) => m.messageType === 'system_event');
      expect(systemMsg).toBeDefined();
      expect(systemMsg.body).toContain('assigned');
    });

    it('should require agentId for assignment', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/assign`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should unassign an agent from a conversation', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/unassign`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.assignedAgentId).toBeNull();
      expect(res.body.data.status).toBe('open');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // C. CHAT MESSAGES  (Chat Message API)
  // ═══════════════════════════════════════════════════════════

  describe('Chat Messages', () => {
    it('should send a visitor message', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'visitor',
          senderName: 'Grace Adeyemi',
          body: 'I would like to give my life to Jesus. How do I begin?',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.senderType).toBe('visitor');
      expect(res.body.data.body).toContain('Jesus');
    });

    it('should send an agent reply', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'agent',
          senderName: 'Pastor Hope',
          senderId: adminUserId,
          body: 'Praise God! We would love to guide you. Let us start with a simple prayer.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.senderType).toBe('agent');
    });

    it('should send an internal staff note invisible to visitors', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'agent',
          senderName: 'Admin',
          body: 'INTERNAL: Schedule a new believer counselling session for this person.',
          isInternal: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isInternal).toBe(true);
    });

    it('should exclude internal notes from default message listing', async () => {
      const res = await request(app)
        .get(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const internal = res.body.data.filter((m: any) => m.isInternal === true);
      expect(internal.length).toBe(0);
    });

    it('should include internal notes when explicitly requested', async () => {
      const res = await request(app)
        .get(`/api/chat/conversations/${livestreamConvId}/messages?includeInternal=true`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const internal = res.body.data.filter((m: any) => m.isInternal === true);
      expect(internal.length).toBe(1);
    });

    it('should reject message without required fields', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ senderType: 'visitor' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // D. CARE REQUESTS  (Care Request + Prayer + Testimony APIs)
  // ═══════════════════════════════════════════════════════════

  describe('Care Requests', () => {
    let careRequestId: string;
    let prayerRequestId: string;

    it('should create a salvation care request linked to a conversation', async () => {
      const res = await request(app)
        .post('/api/chat/care-requests')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          conversationId: livestreamConvId,
          memberId,
          requestType: 'salvation',
          description: 'Grace responded to the salvation call during the livestream.',
          priority: 'urgent',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.requestType).toBe('salvation');
      expect(res.body.data.priority).toBe('urgent');
      expect(res.body.data.status).toBe('pending');
      careRequestId = res.body.data.id;
    });

    it('should create a prayer care request', async () => {
      const res = await request(app)
        .post('/api/chat/care-requests')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId,
          requestType: 'prayer',
          description: 'Please pray for my family during this difficult season.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.requestType).toBe('prayer');
      prayerRequestId = res.body.data.id;
    });

    it('should create a counselling care request', async () => {
      const res = await request(app)
        .post('/api/chat/care-requests')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          requestType: 'counselling',
          description: 'Anonymous visitor requesting marriage counselling.',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.requestType).toBe('counselling');
    });

    it('should reject care request without required fields', async () => {
      const res = await request(app)
        .post('/api/chat/care-requests')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ requestType: 'prayer' });

      expect(res.status).toBe(400);
    });

    it('should list care requests filtered by type', async () => {
      const res = await request(app)
        .get('/api/chat/care-requests?requestType=prayer')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].requestType).toBe('prayer');
    });

    it('should list care requests filtered by priority', async () => {
      const res = await request(app)
        .get('/api/chat/care-requests?priority=urgent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((r: any) => r.priority === 'urgent')).toBe(true);
    });

    it('should get a single care request with member and conversation details', async () => {
      const res = await request(app)
        .get(`/api/chat/care-requests/${careRequestId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.member.firstName).toBe('Grace');
      expect(res.body.data.conversation.channel).toBe('livestream');
    });

    it('should assign an agent and update care request status', async () => {
      const res = await request(app)
        .put(`/api/chat/care-requests/${careRequestId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedAgentId: adminUserId, status: 'assigned' });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedAgentId).toBe(adminUserId);
      expect(res.body.data.status).toBe('assigned');
    });

    it('should resolve a care request and set resolvedAt', async () => {
      const res = await request(app)
        .put(`/api/chat/care-requests/${prayerRequestId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('resolved');
      expect(res.body.data.resolvedAt).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // E. SAVED REPLIES
  // ═══════════════════════════════════════════════════════════

  describe('Saved Replies', () => {
    let replyId: string;

    it('should create saved replies for common responses', async () => {
      const res1 = await request(app)
        .post('/api/chat/saved-replies')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Service Times',
          body: 'Our Sunday services are at 8:00 AM, 10:00 AM, and 12:00 PM.',
          category: 'general',
        });

      expect(res1.status).toBe(201);
      replyId = res1.body.data.id;

      const res2 = await request(app)
        .post('/api/chat/saved-replies')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Salvation Prayer',
          body: 'Dear Lord Jesus, I believe you are the Son of God...',
          category: 'prayer',
        });

      expect(res2.status).toBe(201);
    });

    it('should reject saved reply without required fields', async () => {
      const res = await request(app)
        .post('/api/chat/saved-replies')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing body' });

      expect(res.status).toBe(400);
    });

    it('should list saved replies', async () => {
      const res = await request(app)
        .get('/api/chat/saved-replies')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter saved replies by category', async () => {
      const res = await request(app)
        .get('/api/chat/saved-replies?category=prayer')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('prayer');
    });

    it('should delete a saved reply', async () => {
      const res = await request(app)
        .delete(`/api/chat/saved-replies/${replyId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // F. CHAT FOLLOW-UP TASKS  (Follow-Up Task API)
  // ═══════════════════════════════════════════════════════════

  describe('Chat Follow-Up Tasks', () => {
    let taskId: string;

    it('should create a follow-up task from a conversation', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/tasks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Call Grace for new believer follow-up',
          description: 'Grace accepted Christ during the livestream. Schedule a counselling call.',
          priority: 'high',
          assignedUserId: adminUserId,
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toContain('Grace');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.status).toBe('pending');
      taskId = res.body.data.id;
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/tasks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Missing title' });

      expect(res.status).toBe(400);
    });

    it('should list tasks filtered by status', async () => {
      const res = await request(app)
        .get('/api/chat/tasks?status=pending')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should update task status to completed with completedAt', async () => {
      const res = await request(app)
        .put(`/api/chat/tasks/${taskId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .put('/api/chat/tasks/fake-id')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // G. MEMBER CONVERSATION HISTORY
  // ═══════════════════════════════════════════════════════════

  describe('Member Conversation History', () => {
    it('should retrieve all chat history for a member', async () => {
      const res = await request(app)
        .get(`/api/chat/members/${memberId}/history`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1); // Only the livestream conversation
      expect(res.body.data[0].channel).toBe('livestream');
      expect(res.body.data[0]._count.messages).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // H. PRESENCE & TYPING
  // ═══════════════════════════════════════════════════════════
  describe('Presence & Typing Indicators', () => {
    it('should allow agent to update presence and list active presences', async () => {
      const res1 = await request(app)
        .post('/api/chat/presence')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ presenceState: 'online', customPresence: 'pastor_available' });

      expect(res1.status).toBe(200);
      expect(res1.body.data.presenceState).toBe('online');
      expect(res1.body.data.customPresence).toBe('pastor_available');

      const res2 = await request(app)
        .get('/api/chat/presence')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res2.body.data[0].customPresence).toBe('pastor_available');
    });

    it('should register and return typing indicators', async () => {
      const res1 = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/typing`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isTyping: true, userName: 'Pastor Hope' });

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.data[0].userName).toBe('Pastor Hope');

      const res2 = await request(app)
        .get(`/api/chat/conversations/${livestreamConvId}/typing`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // I. TRANSLATION & AUDIO MESSAGES
  // ═══════════════════════════════════════════════════════════
  describe('Translation & Audio Messages', () => {
    it('should simulate voice note transcription', async () => {
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'visitor',
          audioUrl: 'https://storage.church/audio/prayer123.mp3',
          audioDuration: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.messageType).toBe('audio');
      expect(res.body.data.audioDuration).toBe(45);
      expect(res.body.data.transcript).toContain('crisis support');
    });

    it('should translate message body', async () => {
      // 1. Create a plain text message first
      const msgRes = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'visitor',
          body: 'Hello',
        });
      const messageId = msgRes.body.data.id;

      // 2. Translate it
      const res = await request(app)
        .post(`/api/chat/conversations/${livestreamConvId}/messages/${messageId}/translate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetLang: 'es' });

      expect(res.status).toBe(200);
      expect(res.body.data.translatedLang).toBe('es');
      expect(res.body.data.translatedBody).toContain('[Translated to es]:');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // J. AI SENTIMENT & SAFETY PIPELINE
  // ═══════════════════════════════════════════════════════════
  describe('AI Sentiment & Safety Screening', () => {
    it('should detect distressed sentiment and suggest scriptures', async () => {
      const convRes = await request(app)
        .post('/api/chat/conversations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ visitorName: 'Sad Visitor', channel: 'website' });
      const newConvId = convRes.body.data.id;

      await request(app)
        .post(`/api/chat/conversations/${newConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'visitor',
          body: 'I feel so sad and lonely today.',
        });

      const res = await request(app)
        .get(`/api/chat/conversations/${newConvId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.sentiment).toBe('distressed');
      expect(res.body.data.aiSuggestedScriptures).toContain('Philippians 4:6');
    });

    it('should escalate conversation on crisis self-harm keywords', async () => {
      const convRes = await request(app)
        .post('/api/chat/conversations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ visitorName: 'Crisis Visitor', channel: 'website' });
      const newConvId = convRes.body.data.id;

      await request(app)
        .post(`/api/chat/conversations/${newConvId}/messages`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          senderType: 'visitor',
          body: 'I want to suicide and end my life.',
        });

      const res = await request(app)
        .get(`/api/chat/conversations/${newConvId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.safetyAlert).toBe(true);
      expect(res.body.data.priority).toBe('urgent');
      expect(res.body.data.status).toBe('escalated');
      expect(res.body.data.aiSuggestedScriptures).toContain('Psalm 34:18');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // K. SMART MEMBER CONTEXT PANEL
  // ═══════════════════════════════════════════════════════════
  describe('Smart Member Context Panel', () => {
    it('should return context panel details for member', async () => {
      const res = await request(app)
        .get(`/api/chat/members/${memberId}/context`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.member.id).toBe(memberId);
      expect(res.body.data.attendanceCount).toBeDefined();
      expect(res.body.data.givingSummary.donationsCount).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // L. DIGITAL ALTAR CALL RESPONSES
  // ═══════════════════════════════════════════════════════════
  describe('Digital Altar Call Responses', () => {
    it('should create altar call response and crm contact', async () => {
      const res = await request(app)
        .post('/api/chat/altar-call')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visitorName: 'Altar Convert',
          visitorEmail: 'altar@example.com',
          responseType: 'salvation',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.response.responseType).toBe('salvation');
      expect(res.body.data.crmContact.email).toBe('altar@example.com');
      expect(res.body.data.conversation.subject).toContain('Altar Call');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // M. AI KNOWLEDGE BASE
  // ═══════════════════════════════════════════════════════════
  describe('AI Knowledge Base', () => {
    it('should allow adding articles and asking questions', async () => {
      // 1. Create KB Article
      const kbRes = await request(app)
        .post('/api/chat/kb')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: 'How do I join baptism?',
          answer: 'Register on the events page or talk to a leader.',
          keywords: 'baptism,join,water',
        });

      expect(kbRes.status).toBe(201);

      // 2. Ask conversational question
      const res = await request(app)
        .post('/api/chat/kb/ask')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Can you tell me about baptism join?' });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toContain('events page');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // N. SAFE ANONYMOUS MODE
  // ═══════════════════════════════════════════════════════════
  describe('Anonymous Support Mode', () => {
    it('should mask details for anonymous conversations for non-admins', async () => {
      // 1. Create anonymous conversation
      const convRes = await request(app)
        .post('/api/chat/conversations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId,
          isAnonymous: true,
          channel: 'app',
          subject: 'Confidential request',
        });
      const anonId = convRes.body.data.id;

      // 2. Fetch with admin token -> should NOT mask
      const resAdmin = await request(app)
        .get(`/api/chat/conversations/${anonId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.visitorName).not.toBe('Anonymous Member');

      // 3. Create a non-admin token (no settings permission)
      // Hope Care Church permissions
      const readPerm = await prisma.permission.findFirst({ where: { name: 'member.read' } });
      const memberRole = await prisma.role.create({ data: { tenantId, name: 'NormalMember', isCustom: true } });
      if (readPerm) {
        await prisma.rolePermission.create({ data: { roleId: memberRole.id, permissionId: readPerm.id } });
      }
      const normalUser = await prisma.user.create({
        data: { tenantId, email: 'normal@hope-care.com', passwordHash: 'hash123' },
      });
      await prisma.userRole.create({ data: { userId: normalUser.id, roleId: memberRole.id } });
      const normalToken = jwt.sign({ userId: normalUser.id, tenantId, email: normalUser.email }, JWT_SECRET);

      // 4. Fetch with normal token -> should mask
      const resNormal = await request(app)
        .get(`/api/chat/conversations/${anonId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${normalToken}`);

      expect(resNormal.status).toBe(200);
      expect(resNormal.body.data.visitorName).toBe('Anonymous Member');
      expect(resNormal.body.data.member).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // O. TICKET STATUS LIFE CYCLE
  // ═══════════════════════════════════════════════════════════
  describe('Ticket Status Lifecycle', () => {
    it('should validate conversation and care request status values', async () => {
      const res = await request(app)
        .put(`/api/chat/conversations/${livestreamConvId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status_value' });

      expect(res.status).toBe(500); // throws error -> returns 500
    });
  });
});
