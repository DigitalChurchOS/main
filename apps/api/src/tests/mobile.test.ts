import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 43: Mobile App Access Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;

  let memberToken: string;
  let memberUserId: string;
  let memberId: string;

  let phoneOnlyMemberId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.mobilePushToken.deleteMany({});
    await prisma.lmsEnrollment.deleteMany({});
    await prisma.lmsCourse.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.mediaPlaylist.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Mobile Church', subdomain: 'grace-mob', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.read', 'member.update', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@grace-mob.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Dynamic Theme settings
    await prisma.theme.create({
      data: {
        tenantId,
        name: 'Grace Mobile Theme',
        isCustom: true,
        settings: JSON.stringify({ primaryColor: '#3490dc', fontFamily: 'Inter' }),
      },
    });

    // 6. Create Standard Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@grace-mob.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    const member = await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'Philip',
        lastName: 'Evangelist',
        email: 'member@grace-mob.com',
        phone: '+1555123456',
        membershipStatus: 'member',
      },
    });
    memberId = member.id;

    // 7. Create a Member with phone number but NO user record linked yet
    const phoneMember = await prisma.member.create({
      data: {
        tenantId,
        firstName: 'Silas',
        lastName: 'Fellow',
        phone: '+1555987654',
        membershipStatus: 'visitor',
      },
    });
    phoneOnlyMemberId = phoneMember.id;

    // 8. Seed content records for feed checks
    await prisma.mediaPlaylist.create({
      data: {
        tenantId,
        name: 'Sunday Sermon Series',
        description: 'Sunday morning messages.',
      },
    });

    await prisma.livestream.create({
      data: {
        tenantId,
        title: 'Sunday Service Live Stream',
        scheduledAt: new Date(),
        status: 'live',
      },
    });

    const eventCategory = await prisma.eventCategory.create({
      data: { tenantId, name: 'Youth Conferences' },
    });

    await prisma.event.create({
      data: {
        tenantId,
        categoryId: eventCategory.id,
        title: 'Youth Summer Conference',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        endDate: new Date(Date.now() + 26 * 60 * 60 * 1000),
        status: 'published',
        pricingType: 'free',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. DIRECTORY LOOKUP & TENANT CONFIG
  // ─────────────────────────────────────────────────────────────
  describe('Church selection & configuration directory lookup', () => {
    it('should allow public searching for church workspaces', async () => {
      const res = await request(app)
        .get('/api/mobile/config/search')
        .query({ q: 'Grace' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].subdomain).toBe('grace-mob');
    });

    it('should return empty array for search with no matches', async () => {
      const res = await request(app)
        .get('/api/mobile/config/search')
        .query({ q: 'NonExistentChurch' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should load tenant Dynamic Branding styling and settings via subdomain', async () => {
      const res = await request(app)
        .get('/api/mobile/config/tenant/grace-mob');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Grace Mobile Church');
      expect(res.body.data.theme.primaryColor).toBe('#3490dc');
    });

    it('should return 404 error if church subdomain is invalid', async () => {
      const res = await request(app)
        .get('/api/mobile/config/tenant/invalid-subdomain');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. MOBILE AUTHENTICATION
  // ─────────────────────────────────────────────────────────────
  describe('Mobile Session Authentication', () => {
    it('should authenticate user with email and password', async () => {
      const res = await request(app)
        .post('/api/mobile/auth/login')
        .set('x-tenant-id', tenantId)
        .send({
          emailOrPhone: 'member@grace-mob.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.member.id).toBe(memberId);
    });

    it('should block login with invalid password', async () => {
      const res = await request(app)
        .post('/api/mobile/auth/login')
        .set('x-tenant-id', tenantId)
        .send({
          emailOrPhone: 'member@grace-mob.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should authenticate using passwordless Phone Number lookup', async () => {
      const res = await request(app)
        .post('/api/mobile/auth/login')
        .set('x-tenant-id', tenantId)
        .send({
          emailOrPhone: '+1555123456',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.member.id).toBe(memberId);
    });

    it('should auto-create a user account when phone login matches a member without a linked user', async () => {
      // Silas has no user link
      const res = await request(app)
        .post('/api/mobile/auth/login')
        .set('x-tenant-id', tenantId)
        .send({
          emailOrPhone: '+1555987654',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      
      // Check that Silas is now linked to a user profile
      const silas = await prisma.member.findUnique({
        where: { id: phoneOnlyMemberId },
      });
      expect(silas?.userId).not.toBeNull();
    });

    it('should allow fetching authenticated user details via session token', async () => {
      const res = await request(app)
        .get('/api/mobile/auth/me')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('member@grace-mob.com');
      expect(res.body.data.member.firstName).toBe('Philip');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. CONSOLIDATED CONTENT FEEDS
  // ─────────────────────────────────────────────────────────────
  describe('Consolidated Mobile Content Feed API', () => {
    it('should aggregate media, livestreams, events, and courses in a single payload', async () => {
      // Enroll member in a course
      const course = await prisma.lmsCourse.create({
        data: {
          tenantId,
          title: 'Foundations of Faith',
          slug: 'foundations-of-faith',
          status: 'published',
        },
      });

      await prisma.lmsEnrollment.create({
        data: {
          tenantId,
          memberId,
          courseId: course.id,
        },
      });

      const res = await request(app)
        .get('/api/mobile/content/feed')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.playlists.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.playlists[0].name).toBe('Sunday Sermon Series');
      expect(res.body.data.activeLivestream.title).toBe('Sunday Service Live Stream');
      expect(res.body.data.upcomingEvents.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.enrolledCourses.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.enrolledCourses[0].title).toBe('Foundations of Faith');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. PUSH NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  describe('Push Notifications Registration & Sending API', () => {
    it('should register mobile device push tokens', async () => {
      const res = await request(app)
        .post('/api/mobile/notifications/tokens')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          token: 'ExponentPushToken[xxxx-yyyy-zzzz]',
          deviceType: 'ios',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBe('ExponentPushToken[xxxx-yyyy-zzzz]');
    });

    it('should reject invalid device types during token registration', async () => {
      const res = await request(app)
        .post('/api/mobile/notifications/tokens')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          token: 'ExponentPushToken[xxxx-yyyy-zzzz]',
          deviceType: 'windows_phone',
        });

      expect(res.status).toBe(400);
    });

    it('should allow admin to trigger/dispatch push notifications', async () => {
      const res = await request(app)
        .post('/api/mobile/notifications/send')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: memberUserId,
          title: 'Special Announcement',
          body: 'Midweek fellowship has been moved to 7 PM.',
          data: { screen: 'notifications' },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.dispatchedCount).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. DEEP LINKS
  // ─────────────────────────────────────────────────────────────
  describe('Mobile Deep Links Engine API', () => {
    it('should generate deep link schemes', async () => {
      const res = await request(app)
        .post('/api/mobile/deeplinks/generate')
        .send({
          subdomain: 'grace-mob',
          path: '/events/youth-camp',
          params: { ref: 'sms' },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.link).toBe('churchos://grace-mob/events/youth-camp?ref=sms');
    });

    it('should resolve deep link url schemes and query paths', async () => {
      const res = await request(app)
        .get('/api/mobile/deeplinks/resolve')
        .query({ url: 'churchos://grace-mob/events/123-uuid?promo=true' });

      expect(res.status).toBe(200);
      expect(res.body.data.subdomain).toBe('grace-mob');
      expect(res.body.data.route).toBe('events');
      expect(res.body.data.id).toBe('123-uuid');
      expect(res.body.data.params.promo).toBe('true');
    });

    it('should resolve universal links redirecting to app paths', async () => {
      const res = await request(app)
        .get('/api/mobile/deeplinks/resolve')
        .query({ url: 'https://grace-mob.churchos.org/deeplink?path=/media/sermon-1&source=email' });

      expect(res.status).toBe(200);
      expect(res.body.data.subdomain).toBe('grace-mob');
      expect(res.body.data.route).toBe('media');
      expect(res.body.data.id).toBe('sermon-1');
      expect(res.body.data.params.source).toBe('email');
    });
  });
});
