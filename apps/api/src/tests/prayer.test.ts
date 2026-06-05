import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 34: Prayer & Testimony Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let leaderMemberId: string;
  let volunteerMemberId: string;
  let volunteerToken: string;
  let sessionId: string;
  let prayerRequestId: string;
  let testimonyId: string;
  let prayerPointId: string;

  beforeAll(async () => {
    // ── Clean up tables related to module 34 ────────────────
    await prisma.prayerSessionReaction.deleteMany({});
    await prisma.prayerSessionParticipation.deleteMany({});
    await prisma.prayerPoint.deleteMany({});
    await prisma.prayerSession.deleteMany({});
    await prisma.prayerMedia.deleteMany({});
    await prisma.communityComment.deleteMany({});
    await prisma.communityReaction.deleteMany({});
    await prisma.prayerRequest.deleteMany({});
    await prisma.testimony.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Prayer Cathedral', subdomain: 'prayer-cathedral', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Admin Role & Permissions ───────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings', 'member.delete'] } },
    });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin/Leader User & Member ─────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@prayer.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const leaderMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Paul',
        lastName: 'Apostle',
        email: 'pastor@prayer.com',
        membershipStatus: 'leader',
      },
    });
    leaderMemberId = leaderMember.id;

    // ── Volunteer/Intercessor User & Member ─────────────────
    const volunteerUser = await prisma.user.create({
      data: { tenantId, email: 'intercessor@prayer.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: volunteerUser.id, roleId: adminRole.id } });
    volunteerToken = jwt.sign({ userId: volunteerUser.id, tenantId, email: volunteerUser.email }, JWT_SECRET);

    const volunteerMember = await prisma.member.create({
      data: {
        tenantId,
        userId: volunteerUser.id,
        firstName: 'Silas',
        lastName: 'Preacher',
        email: 'intercessor@prayer.com',
        membershipStatus: 'member',
      },
    });
    volunteerMemberId = volunteerMember.id;

    // ── Create pre-existing prayer requests and testimonies for testing
    const pr = await prisma.prayerRequest.create({
      data: {
        tenantId,
        memberId: volunteerMemberId,
        title: 'Healing for Timothy',
        content: 'Please pray for Timothy who is suffering from a stomach ailment.',
        visibility: 'public',
        status: 'approved',
      },
    });
    prayerRequestId = pr.id;

    const t = await prisma.testimony.create({
      data: {
        tenantId,
        memberId: volunteerMemberId,
        title: 'Delivered from Prison',
        content: 'At midnight we sang praises, and the doors flew open!',
        status: 'pending',
      },
    });
    testimonyId = t.id;
  });

  describe('Corporate Prayer Sessions & Lifecycle', () => {
    it('should allow admin to create a corporate prayer session', async () => {
      const res = await request(app)
        .post('/api/prayer/sessions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Midnight Praise & Intercession',
          description: 'A dedicated chain of intercessory prayers.',
          startTime: new Date(Date.now() + 3600000), // in 1 hour
          endTime: new Date(Date.now() + 7200000), // in 2 hours
          recurrence: 'daily',
          musicUrl: 'https://cdn.church.org/audio/midnight-worship.mp3',
          musicVolume: 40,
          leaderId: leaderMemberId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('scheduled');
      expect(res.body.data.leader.firstName).toBe('Paul');
      sessionId = res.body.data.id;
    });

    it('should allow leader to start the session', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/start`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });
  });

  describe('Dedicated Prayer Room & Participation', () => {
    it('should allow a member to join the session', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/join`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          isPublic: true,
          audioEnabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sessionId).toBe(sessionId);
      expect(res.body.data.memberId).toBe(volunteerMemberId);
      expect(res.body.data.audioEnabled).toBe(true);
    });

    it('should allow the leader to fetch metrics showing live counters and participation', async () => {
      const res = await request(app)
        .get(`/api/prayer/sessions/${sessionId}/metrics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.liveCount).toBe(1);
      expect(res.body.data.publicParticipants).toHaveLength(1);
      expect(res.body.data.publicParticipants[0].firstName).toBe('Silas');
      expect(res.body.data.publicParticipants[0].audioEnabled).toBe(true);
    });

    it('should allow a participant to confirm "I Prayed"', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/confirm`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasConfirmed).toBe(true);

      const metricsRes = await request(app)
        .get(`/api/prayer/sessions/${sessionId}/metrics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metricsRes.body.data.confirmedCount).toBe(1);
    });

    it('should allow a member to send live reactions and register counts', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/reaction`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ reactionType: 'amen' });

      expect(res.status).toBe(201);
      expect(res.body.data.reactionType).toBe('amen');

      // Send another reaction
      await request(app)
        .post(`/api/prayer/sessions/${sessionId}/reaction`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ reactionType: 'praying' });

      const metricsRes = await request(app)
        .get(`/api/prayer/sessions/${sessionId}/metrics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metricsRes.body.data.reactionsSummary).toHaveLength(2);
    });
  });

  describe('Leader Control & Moderation Loops', () => {
    it('should allow leader to configure volume and pause music', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/settings`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          musicPaused: true,
          volume: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isMusicPaused).toBe(true);
      expect(res.body.data.musicVolume).toBe(20);
    });

    it('should allow leader to delegate temporary leadership to an intercessor', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/delegate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: volunteerMemberId });

      expect(res.status).toBe(200);
      expect(res.body.data.isTempLeader).toBe(true);
    });

    it('should allow delegated temporary leader to adjust volume settings', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/settings`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ volume: 75 });

      expect(res.status).toBe(200);
      expect(res.body.data.musicVolume).toBe(75);
    });

    it('should allow leader to revoke temporary leadership status', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/revoke`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: volunteerMemberId });

      expect(res.status).toBe(200);
      expect(res.body.data.isTempLeader).toBe(false);
    });

    it('should block revoked leader from modifying session settings', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/settings`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ volume: 90 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should allow leader to mute all participant audios', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/mute-all`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const metrics = await request(app)
        .get(`/api/prayer/sessions/${sessionId}/metrics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metrics.body.data.publicParticipants[0].audioEnabled).toBe(false);
      expect(metrics.body.data.publicParticipants[0].isMuted).toBe(true);
    });

    it('should moderate a specific member to unmute and mute back', async () => {
      // Unmute member Silas
      let res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/moderate-member`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetMemberId: volunteerMemberId, action: 'unmute' });

      expect(res.status).toBe(200);
      expect(res.body.data.isMuted).toBe(false);

      // Mute Silas
      res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/moderate-member`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetMemberId: volunteerMemberId, action: 'mute' });

      expect(res.status).toBe(200);
      expect(res.body.data.isMuted).toBe(true);
    });
  });

  describe('Prayer Points & Scriptures', () => {
    it('should allow adding scripture-based prayer points to a session', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/points`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Pray for Unity in Leadership',
          content: 'A call to love one another sincerely.',
          category: 'missions',
          duration: 300,
          scriptureRef: 'Ephesians 4:3, John 17:21',
          sequenceOrder: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Pray for Unity in Leadership');
      expect(res.body.data.scriptureRef).toBe('Ephesians 4:3, John 17:21');
      prayerPointId = res.body.data.id;
    });

    it('should list prayer points for a session', async () => {
      const res = await request(app)
        .get(`/api/prayer/sessions/${sessionId}/points`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category).toBe('missions');
    });

    it('should allow leader to control the active displayed prayer point', async () => {
      const res = await request(app)
        .post(`/api/prayer/sessions/${sessionId}/settings`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currentPrayerPointId: prayerPointId });

      expect(res.status).toBe(200);
      expect(res.body.data.currentPrayerPointId).toBe(prayerPointId);
    });
  });

  describe('Prayer Requests Assignment & Testimonies Featured Wall', () => {
    it('should allow admin to assign a prayer request to an intercessor and set reminder', async () => {
      const res = await request(app)
        .post(`/api/prayer/requests/${prayerRequestId}/assign`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: volunteerMemberId,
          followUpReminderAt: new Date(Date.now() + 86400000), // in 24 hours
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assignedToId).toBe(volunteerMemberId);
      expect(res.body.data.status).toBe('assigned');
      expect(res.body.data.followUpReminderAt).toBeDefined();
    });

    it('should allow updating the prayer request follow-up status', async () => {
      const res = await request(app)
        .patch(`/api/prayer/requests/${prayerRequestId}/status`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'followed_up' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('followed_up');
    });

    it('should allow pastors to vet testimonies, approve, and feature them', async () => {
      const res = await request(app)
        .patch(`/api/prayer/testimonies/${testimonyId}/feature`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          isFeatured: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.isFeatured).toBe(true);
    });
  });

  describe('Prayer Media & Recommendations Engine', () => {
    beforeAll(async () => {
      // Create some media library teachings
      await prisma.prayerMedia.create({
        data: {
          tenantId,
          title: 'Introduction to Fasting & Intercession',
          description: 'Learn the basics of corporate intercession and scriptural alignment.',
          mediaType: 'video',
          category: 'basics',
          recommendedFor: 'missions',
        },
      });

      await prisma.prayerMedia.create({
        data: {
          tenantId,
          title: 'Unlocking Answers',
          description: 'A study on petition and thanksgiving.',
          mediaType: 'article',
          category: 'scripture',
          recommendedFor: 'general',
        },
      });
    });

    it('should recommend media matched to session categories and prayer points', async () => {
      const res = await request(app)
        .get(`/api/prayer/sessions/${sessionId}/recommendations`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      // 'Introduction to Fasting & Intercession' should rank higher or first because recommendedFor matches 'missions'
      expect(res.body.data[0].title).toBe('Introduction to Fasting & Intercession');
    });
  });
});
