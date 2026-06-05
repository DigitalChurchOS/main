import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

jest.setTimeout(30000);

describe('ChurchOS Livestream Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;

  let streamId: string;
  let viewerSessionId1: string;
  let viewerSessionId2: string;

  beforeAll(async () => {
    // Clean up
    await prisma.livestreamInteraction.deleteMany({});
    await prisma.livestreamViewer.deleteMany({});
    await prisma.livestreamChat.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.mediaAsset.deleteMany({});

    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Live Church', subdomain: 'live-test', status: 'active' },
    });
    tenantId = tenant.id;

    // Activate Livestream Module Entitlement
    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey: 'livestream',
        status: 'active',
      },
    });

    // Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.create', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@live-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Live',
        lastName: 'Admin',
        membershipStatus: 'leader',
      },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. SCHEDULE STREAM
  // ─────────────────────────────────────────────────────────────
  describe('Schedule Stream', () => {
    it('should create a scheduled stream with countdown and chat enabled', async () => {
      const res = await request(app)
        .post('/api/livestream/streams')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sunday Morning Service',
          description: 'Join us for worship and the Word.',
          scheduledAt: '2026-06-01T10:00:00Z',
          thumbnailUrl: 'https://cdn.church.com/thumbs/sunday.jpg',
          countdownEnabled: true,
          chatEnabled: true,
          multiPlatformLinks: [
            { platform: 'youtube', url: 'https://youtube.com/live/abc123' },
            { platform: 'facebook', url: 'https://facebook.com/church/live' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Sunday Morning Service');
      expect(res.body.data.status).toBe('scheduled');
      expect(res.body.data.streamKey).toBeTruthy();
      expect(res.body.data.rtmpIngestUrl).toContain('rtmp://');
      expect(res.body.data.countdownEnabled).toBe(true);
      expect(res.body.data.chatEnabled).toBe(true);
      streamId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. LIST STREAMS (filtered)
  // ─────────────────────────────────────────────────────────────
  describe('List Streams', () => {
    it('should filter streams by scheduled status', async () => {
      const res = await request(app)
        .get('/api/livestream/streams?status=scheduled')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('scheduled');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. GO LIVE
  // ─────────────────────────────────────────────────────────────
  describe('Go Live', () => {
    it('should transition stream from scheduled to live', async () => {
      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/go-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('live');
      expect(res.body.data.startedAt).toBeTruthy();
    });

    it('should reject going live twice', async () => {
      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/go-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('scheduled');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. LIVE CHAT
  // ─────────────────────────────────────────────────────────────
  describe('Live Chat', () => {
    it('should send chat messages during a live stream', async () => {
      const msg1 = await request(app)
        .post(`/api/livestream/streams/${streamId}/chat`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ displayName: 'Pastor David', message: 'Welcome everyone!' });
      expect(msg1.status).toBe(201);

      const msg2 = await request(app)
        .post(`/api/livestream/streams/${streamId}/chat`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ displayName: 'Sarah J.', message: 'Good morning! God bless!' });
      expect(msg2.status).toBe(201);

      const msg3 = await request(app)
        .post(`/api/livestream/streams/${streamId}/chat`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ displayName: 'Mike T.', message: 'Amen! 🙏' });
      expect(msg3.status).toBe(201);
    });

    it('should retrieve chat history in chronological order', async () => {
      const res = await request(app)
        .get(`/api/livestream/streams/${streamId}/chat`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].displayName).toBe('Pastor David');
      expect(res.body.data[2].message).toContain('Amen');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5 & 6. VIEWER JOIN / LEAVE
  // ─────────────────────────────────────────────────────────────
  describe('Viewer Tracking', () => {
    it('should register viewer sessions', async () => {
      const v1 = await request(app)
        .post(`/api/livestream/streams/${streamId}/viewers/join`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionId: 'session-001' });
      expect(v1.status).toBe(201);
      viewerSessionId1 = v1.body.data.id;

      const v2 = await request(app)
        .post(`/api/livestream/streams/${streamId}/viewers/join`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sessionId: 'session-002' });
      expect(v2.status).toBe(201);
      viewerSessionId2 = v2.body.data.id;
    });

    it('should end a viewer session with duration tracking', async () => {
      // Small delay to have measurable duration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/viewers/leave`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ viewerId: viewerSessionId1 });

      expect(res.status).toBe(200);
      expect(res.body.data.leftAt).toBeTruthy();
      expect(res.body.data.durationSeconds).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. PRAYER REQUEST
  // ─────────────────────────────────────────────────────────────
  describe('Prayer Request', () => {
    it('should submit a prayer request interaction', async () => {
      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/interactions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'prayer_request', content: 'Please pray for my family.' });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('prayer_request');
      expect(res.body.data.content).toBe('Please pray for my family.');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. SALVATION RESPONSE
  // ─────────────────────────────────────────────────────────────
  describe('Salvation Response', () => {
    it('should submit a salvation response interaction', async () => {
      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/interactions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'salvation_response', content: 'I want to accept Christ.' });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('salvation_response');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 10. VIEWER NOTES
  // ─────────────────────────────────────────────────────────────
  describe('Viewer Notes', () => {
    it('should submit a personal note during stream', async () => {
      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/interactions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'note', content: 'Key takeaway: Faith is the substance of things hoped for.' });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('note');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. STREAM ANALYTICS
  // ─────────────────────────────────────────────────────────────
  describe('Stream Analytics', () => {
    it('should compute peak concurrent, total viewers, and watch time', async () => {
      // End the second viewer session first
      await request(app)
        .post(`/api/livestream/streams/${streamId}/viewers/leave`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ viewerId: viewerSessionId2 });

      const res = await request(app)
        .get(`/api/livestream/streams/${streamId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalViewers).toBe(2);
      expect(res.body.data.peakConcurrent).toBe(2);
      expect(res.body.data.totalWatchTimeSeconds).toBeGreaterThanOrEqual(0);
      expect(res.body.data.chatMessages).toBe(3);
      expect(res.body.data.interactions.prayer_request).toBe(1);
      expect(res.body.data.interactions.salvation_response).toBe(1);
      expect(res.body.data.interactions.note).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 11 & 12. END STREAM + REPLAY ARCHIVE
  // ─────────────────────────────────────────────────────────────
  describe('End Stream & Replay Archive', () => {
    it('should end stream and auto-create a replay MediaAsset', async () => {
      const res = await request(app)
        .post(`/api/livestream/streams/${streamId}/end`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ended');
      expect(res.body.data.endedAt).toBeTruthy();
      expect(res.body.data.replayAssetId).toBeTruthy();
      expect(res.body.data.replayAsset).toBeTruthy();
      expect(res.body.data.replayAsset.title).toContain('Replay');
      expect(res.body.data.replayAsset.type).toBe('video');
      expect(res.body.data.replayAsset.status).toBe('published');
    });

    it('should verify replay asset is linked on stream detail', async () => {
      const res = await request(app)
        .get(`/api/livestream/streams/${streamId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.replayAssetId).toBeTruthy();
      expect(res.body.data.replayAsset.title).toContain('Replay');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 13. EMBED GENERATION
  // ─────────────────────────────────────────────────────────────
  describe('Embed Generation', () => {
    it('should generate an embed iframe for the stream', async () => {
      const res = await request(app)
        .get(`/api/livestream/streams/${streamId}/embed`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.embedHtml).toContain('<iframe');
      expect(res.body.data.embedHtml).toContain(`/live/${streamId}`);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 14. MULTI-PLATFORM LINKS
  // ─────────────────────────────────────────────────────────────
  describe('Multi-Platform Links', () => {
    it('should store and return simulcast URLs', async () => {
      const res = await request(app)
        .get(`/api/livestream/streams/${streamId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const links = res.body.data.multiPlatformLinks;
      expect(Array.isArray(links)).toBe(true);
      expect(links.length).toBe(2);
      expect(links[0].platform).toBe('youtube');
      expect(links[1].platform).toBe('facebook');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // EXTRA: Interaction filtering
  // ─────────────────────────────────────────────────────────────
  describe('Interaction Filtering', () => {
    it('should list interactions filtered by type', async () => {
      const res = await request(app)
        .get(`/api/livestream/streams/${streamId}/interactions?type=prayer_request`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('prayer_request');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 15. PUBLIC VISITOR ENDPOINTS
  // ─────────────────────────────────────────────────────────────
  describe('Public Visitor Endpoints', () => {
    let publicStreamId: string;
    let guestViewerId: string;

    it('should schedule a public stream and check countdown page API access', async () => {
      const createRes = await request(app)
        .post('/api/livestream/streams')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Public Youth Gathering',
          description: 'A service for the youth.',
          scheduledAt: '2026-06-02T18:00:00Z',
          thumbnailUrl: 'https://cdn.church.com/thumbs/youth.jpg',
          countdownEnabled: true,
          chatEnabled: true,
        });

      expect(createRes.status).toBe(201);
      publicStreamId = createRes.body.data.id;

      // Update public settings to have public publishing enabled
      await request(app)
        .patch('/api/livestream/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          configJson: {
            publicPublishingEnabled: true,
            enabled: true,
          }
        });

      // Get public detail as guest (no Authorization header, resolves tenant context from stream id)
      const res = await request(app)
        .get(`/api/public/livestream/${publicStreamId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Public Youth Gathering');
      expect(res.body.data.status).toBe('scheduled');
      expect(res.body.data.streamKey).toBeUndefined(); // Sanitize check
      expect(res.body.data.rtmpIngestUrl).toBeUndefined(); // Sanitize check
    });

    it('should register guest viewer joining', async () => {
      const res = await request(app)
        .post(`/api/public/livestream/${publicStreamId}/viewers/join`)
        .send({ sessionId: 'guest-session-123' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.sessionId).toBe('guest-session-123');
      guestViewerId = res.body.data.id;
    });

    it('should submit viewer interactions (prayer, salvation, giving)', async () => {
      const prRes = await request(app)
        .post(`/api/public/livestream/${publicStreamId}/interactions`)
        .send({ type: 'prayer_request', content: 'Prayer for exams.' });
      expect(prRes.status).toBe(201);

      const givRes = await request(app)
        .post(`/api/public/livestream/${publicStreamId}/interactions`)
        .send({ type: 'giving_click', content: 'Offered $50' });
      expect(givRes.status).toBe(201);
    });

    it('should handle guest chat message verification (rejection if offline vs active)', async () => {
      // Stream is scheduled (not live), so chat should be rejected
      const chatRes1 = await request(app)
        .post(`/api/public/livestream/${publicStreamId}/chat`)
        .send({ displayName: 'Guest User', message: 'Hello' });

      expect(chatRes1.status).toBe(400); // Rejects chat when not live

      // Go live
      await request(app)
        .post(`/api/livestream/streams/${publicStreamId}/go-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      // Now chat should be accepted
      const chatRes2 = await request(app)
        .post(`/api/public/livestream/${publicStreamId}/chat`)
        .send({ displayName: 'Guest User', message: 'Hello active stream' });

      expect(chatRes2.status).toBe(201);
      expect(chatRes2.body.data.message).toBe('Hello active stream');
    });

    it('should track viewer leaving', async () => {
      const res = await request(app)
        .post(`/api/public/livestream/${publicStreamId}/viewers/leave`)
        .send({ viewerId: guestViewerId });

      expect(res.status).toBe(200);
      expect(res.body.data.durationSeconds).toBeDefined();
    });
  });
});
