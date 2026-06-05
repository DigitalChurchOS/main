import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('DigitalChurchOS Community & Engagement Module (Module 26)', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  
  let adminMemberId: string;
  let regularMemberId: string;

  let postId: string;
  let prayerId: string;
  let testimonyId: string;
  let commentId: string;

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.communityReaction.deleteMany({});
    await prisma.communityComment.deleteMany({});
    await prisma.communityPost.deleteMany({});
    await prisma.prayerRequest.deleteMany({});
    await prisma.testimony.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Setup permissions if they do not exist
    const requiredPerms = [
      'member.create',
      'member.read',
      'member.update',
      'member.delete',
      'tenant.settings',
    ];

    for (const name of requiredPerms) {
      await prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // 3. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Community Test Church', subdomain: 'community-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 4. Seed subscription plan & active subscription
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Standard Plan',
        basePrice: 20.0,
        includedMembers: 500,
        includedSms: 500,
        includedStorageGb: 50.0,
        memberOverageRate: 0.5,
        smsOverageRate: 0.05,
        storageOverageRate: 0.5,
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

    // 5. Setup permissions & roles
    const adminPermissions = await prisma.permission.findMany({
      where: { name: { in: requiredPerms } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.createMany({
      data: adminPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });
    const readPermission = await prisma.permission.findFirst({
      where: { name: 'member.read' },
    });
    await prisma.rolePermission.create({
      data: { roleId: memberRole.id, permissionId: readPermission!.id },
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 6. Create Admin User & matching Member profile
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@community.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const adminMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Pastor',
        lastName: 'Admin',
        membershipStatus: 'leader',
      },
    });
    adminMemberId = adminMember.id;

    // 7. Create Regular Member User & matching Member profile
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@community.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    const regMember = await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'Jane',
        lastName: 'Member',
        membershipStatus: 'member',
      },
    });
    regularMemberId = regMember.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. COMMUNITY POSTS (DISCUSSION FEED)
  // ─────────────────────────────────────────────────────────────
  describe('Community Posts (Discussion Feed) CRUD', () => {
    it('should allow admin user to create a community post', async () => {
      const res = await request(app)
        .post('/api/community/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Welcome to our Community Feed!',
          content: 'This is where we discuss recent sermons, share scriptures, and connect.',
          postType: 'discussion',
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Welcome to our Community Feed!');
      expect(res.body.data.content).toBe('This is where we discuss recent sermons, share scriptures, and connect.');
      expect(res.body.data.member.id).toBe(adminMemberId);

      postId = res.body.data.id;
    });

    it('should block regular members (who lack member.update) from creating posts', async () => {
      const res = await request(app)
        .post('/api/community/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: 'Unauthorized discussion attempt',
        });

      expect(res.status).toBe(403);
    });

    it('should list and search community posts casing-insensitively', async () => {
      const res = await request(app)
        .get('/api/community/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: '  FeEd ' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(postId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PRAYER REQUESTS BOARD
  // ─────────────────────────────────────────────────────────────
  describe('Prayer Requests Board & Interactions', () => {
    it('should allow admin user to create a prayer request', async () => {
      const res = await request(app)
        .post('/api/community/prayers')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Healing for Brother John',
          content: 'John was hospitalized today. Let us pray for visual strength and restoration.',
          isAnonymous: false,
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Healing for Brother John');
      expect(res.body.data.prayedCount).toBe(0);

      prayerId = res.body.data.id;
    });

    it('should support anonymous prayer request submission masking member detail', async () => {
      const res = await request(app)
        .post('/api/community/prayers')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Personal struggles',
          content: 'Praying for guidance in financial situations.',
          isAnonymous: true,
        });

      expect(res.status).toBe(201);

      // Now list prayer requests and verify it returns "Anonymous" for the anonymous request
      const listRes = await request(app)
        .get('/api/community/prayers')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      const anonPr = listRes.body.data.find((p: any) => p.id === res.body.data.id);
      expect(anonPr.member.firstName).toBe('Anonymous');
      expect(anonPr.member.lastName).toBe('Believer');
    });

    it('should support incrementing prayed count ("I prayed for this")', async () => {
      // Alice clicks "I prayed"
      const res = await request(app)
        .post(`/api/community/prayers/${prayerId}/prayed`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prayedCount).toBe(1);
    });

    it('should support moderation updates by admins', async () => {
      const res = await request(app)
        .patch(`/api/community/prayers/${prayerId}/moderate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'answered' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('answered');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. TESTIMONY SUBMISSIONS FLOW
  // ─────────────────────────────────────────────────────────────
  describe('Testimony Praise Reports Workflow', () => {
    it('should allow testimony submission defaulting status to pending', async () => {
      const res = await request(app)
        .post('/api/community/testimonies')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Healed from Cancer!',
          content: 'After months of prayer, the doctors confirmed I am completely cancer-free!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending'); // Testimony review gate check

      testimonyId = res.body.data.id;
    });

    it('should allow pastor to moderate and approve testimony', async () => {
      const res = await request(app)
        .patch(`/api/community/testimonies/${testimonyId}/moderate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. COMMENTS & REPLIES
  // ─────────────────────────────────────────────────────────────
  describe('Comments & Replies Thread', () => {
    it('should create a comment replying to a post', async () => {
      const res = await request(app)
        .post('/api/community/comments')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Amen! Praise God for this feed.',
          postId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Amen! Praise God for this feed.');
      expect(res.body.data.postId).toBe(postId);

      commentId = res.body.data.id;
    });

    it('should list comments for a post', async () => {
      const res = await request(app)
        .get('/api/community/comments')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ postId });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(commentId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. ENGAGEMENT REACTIONS
  // ─────────────────────────────────────────────────────────────
  describe('Unified Engagement Reactions', () => {
    it('should add a reaction to a post', async () => {
      const res = await request(app)
        .post('/api/community/reactions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reactionType: ' praying_hands ',
          postId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.action).toBe('added');
      expect(res.body.data.reactionType).toBe('praying_hands');
    });

    it('should toggle and remove reaction if clicked again', async () => {
      const res = await request(app)
        .post('/api/community/reactions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reactionType: 'praying_hands',
          postId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.action).toBe('removed');
    });

    it('should summarize reaction counts correctly', async () => {
      // Add Amen and Heart reactions
      await request(app)
        .post('/api/community/reactions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reactionType: 'amen', postId });

      await request(app)
        .post('/api/community/reactions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reactionType: 'heart', postId });

      const res = await request(app)
        .get('/api/community/reactions/summaries')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ postId });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      const types = res.body.data.map((r: any) => r.reactionType);
      expect(types).toContain('amen');
      expect(types).toContain('heart');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. MEMBER ENGAGEMENT SCORING METRICS
  // ─────────────────────────────────────────────────────────────
  describe('Automated Member Engagement Scoring Metrics', () => {
    it('should resolve consolidated community metrics for the admin member', async () => {
      // Let's create an additional post to verify count
      await prisma.communityPost.create({
        data: {
          tenantId,
          memberId: adminMemberId,
          content: 'Additional post.',
        },
      });

      const res = await request(app)
        .get(`/api/community/metrics/${adminMemberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.postsCount).toBe(2); // 1 welcome + 1 additional
      expect(res.body.data.prayersCount).toBe(2); // 1 John + 1 anonymous
      expect(res.body.data.testimoniesCount).toBe(1); // 1 cancer testimony
      expect(res.body.data.commentsCount).toBe(1); // 1 comment
      expect(res.body.data.reactionsCount).toBe(2); // 1 amen + 1 heart

      // EngagementScore = (2 posts * 5) + (2 prayers * 3) + (1 testimony * 10) + (1 comment * 2) + (2 reactions * 1) = 10 + 6 + 10 + 2 + 2 = 30 points
      expect(res.body.data.engagementScore).toBe(30);
    });
  });
});
