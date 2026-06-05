import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 37: Bible & Scripture Engagement Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let adminMemberId: string;

  let studentToken: string;
  let studentUserId: string;
  let studentMemberId: string;

  let translationId: string;
  let planId: string;
  let enrollmentId: string;
  let bookmarkId: string;
  let serviceId: string;
  
  let highlightId: string;
  let audioTrackId: string;
  let graphicId: string;

  beforeAll(async () => {
    // ── Clean up related tables in correct order ──────────────────────────────
    await prisma.bibleVerseHighlight.deleteMany({});
    await prisma.bibleAudioTrack.deleteMany({});
    
    await prisma.bibleVerseNote.deleteMany({});
    await prisma.bibleBookmark.deleteMany({});
    await prisma.bibleReadingPlanEnrollment.deleteMany({});
    await prisma.bibleReadingPlanDay.deleteMany({});
    await prisma.bibleReadingPlan.deleteMany({});
    await prisma.bibleVerse.deleteMany({});
    await prisma.bibleTranslation.deleteMany({});
    await prisma.dailyDevotional.deleteMany({});

    await prisma.serviceScripture.deleteMany({});
    await prisma.churchService.deleteMany({});
    await prisma.newBelieverReminder.deleteMany({});
    await prisma.newBelieverProfile.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Harvest Church', subdomain: 'harvest-church', status: 'active' },
    });
    tenantId = tenant.id;

    // Ensure ModuleDefinition exists for bible
    await prisma.moduleDefinition.upsert({
      where: { key: 'bible' },
      update: {},
      create: {
        key: 'bible',
        name: 'Bible & Scripture Engagement',
        category: 'Discipleship',
      },
    });

    // Create TenantModule entitlement mapping
    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey: 'bible',
        status: 'active',
        billingRule: 'free',
        usageLimits: '{}',
      },
    });

    // ── Roles & Permissions ───────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({ data: { tenantId, name: 'Member', isCustom: false } });
    const memberPerms = permissions.filter((p) => p.name !== 'tenant.settings');
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // ── Admin User (Pastor/Author) ─────────────────────────
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@harvest.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const adminMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Barnabas',
        lastName: 'Leader',
        email: 'pastor@harvest.com',
        membershipStatus: 'leader',
      },
    });
    adminMemberId = adminMember.id;

    // ── Student User ─────────────────────────
    const studentUser = await prisma.user.create({
      data: { tenantId, email: 'student@harvest.com', passwordHash: passHash },
    });
    studentUserId = studentUser.id;
    await prisma.userRole.create({ data: { userId: studentUser.id, roleId: memberRole.id } });
    studentToken = jwt.sign({ userId: studentUser.id, tenantId, email: studentUser.email }, JWT_SECRET);

    const studentMember = await prisma.member.create({
      data: {
        tenantId,
        userId: studentUser.id,
        firstName: 'Timothy',
        lastName: 'Student',
        email: 'student@harvest.com',
        membershipStatus: 'member',
      },
    });
    studentMemberId = studentMember.id;

    // ── New Believer Profile (to verify bible reading plan started at milestone triggers) ──
    await prisma.newBelieverProfile.create({
      data: {
        tenantId,
        memberId: studentMemberId,
        source: 'manual',
        finishedClass: false,
      },
    });

    // ── Pre-existing Church Service & linked Scripture for Sermons testing ──
    const service = await prisma.churchService.create({
      data: {
        tenantId,
        title: 'Sunday Victory Service',
        serviceType: 'sunday',
        serviceDate: new Date(),
        salvationCount: 0,
        status: 'published',
      },
    });
    serviceId = service.id;

    await prisma.serviceScripture.create({
      data: {
        serviceId: service.id,
        reference: 'John 3:16',
        order: 1,
      },
    });
  });

  describe('Translation & Seeding API', () => {
    it('should register a new translation', async () => {
      const res = await request(app)
        .post('/api/bible/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'English Standard Version',
          code: 'esv',
          language: 'en',
          isLicensed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toBe('esv');
      translationId = res.body.data.id;
    });

    it('should retrieve registered translations', async () => {
      const res = await request(app)
        .get('/api/bible/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].code).toBe('esv');
    });

    it('should seed Bible verses', async () => {
      const res = await request(app)
        .post('/api/bible/seed')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verses: [
            { translationCode: 'esv', bookSlug: 'john', chapter: 3, verse: 16, text: 'For God so loved the world...' },
            { translationCode: 'esv', bookSlug: 'john', chapter: 3, verse: 17, text: 'For God did not send his Son into the world to condemn...' },
            { translationCode: 'esv', bookSlug: 'genesis', chapter: 1, verse: 1, text: 'In the beginning, God created the heavens and the earth.' },
            { translationCode: 'esv', bookSlug: 'genesis', chapter: 1, verse: 2, text: 'The earth was without form and void...' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Seeding completed');

      // Verify DB count
      const verseCount = await prisma.bibleVerse.count({ where: { tenantId } });
      expect(verseCount).toBe(4);
    });
  });

  describe('Bible Reading & Searching API', () => {
    it('should read a specific chapter', async () => {
      const res = await request(app)
        .get('/api/bible/read/esv/john/3')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].verse).toBe(16);
      expect(res.body.data[0].text).toContain('For God so loved the world');
      expect(res.body.data[1].verse).toBe(17);
    });

    it('should search for verses containing query keyword', async () => {
      const res = await request(app)
        .get('/api/bible/search')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ translation: 'esv', q: 'beginning' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].bookSlug).toBe('genesis');
      expect(res.body.data[0].chapter).toBe(1);
      expect(res.body.data[0].verse).toBe(1);
      expect(res.body.data[0].text).toContain('In the beginning');
    });

    it('should resolve a scripture reference text into verses', async () => {
      const res = await request(app)
        .get('/api/bible/resolve')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ translation: 'esv', ref: 'John 3:16-17' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].verse).toBe(16);
      expect(res.body.data[1].verse).toBe(17);
    });

    it('should return error for invalid reference format', async () => {
      const res = await request(app)
        .get('/api/bible/resolve')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ translation: 'esv', ref: 'InvalidRefString' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Reading Plans API', () => {
    it('should allow admin to create a reading plan', async () => {
      const res = await request(app)
        .post('/api/bible/plans')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '14-Day New Believer Reading Plan',
          description: 'A study introducing basic Christian fundamentals.',
          coverImageUrl: 'https://cdn.church.org/reading-plan.jpg',
          durationDays: 3,
          days: [
            {
              dayNumber: 1,
              readings: [{ book: 'John', chapter: 3, verses: '16-17' }],
            },
            {
              dayNumber: 2,
              readings: [{ book: 'Genesis', chapter: 1, verses: '1-2' }],
            },
            {
              dayNumber: 3,
              readings: [{ book: 'John', chapter: 3, verses: '16-16' }],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('14-Day New Believer Reading Plan');
      expect(res.body.data.durationDays).toBe(3);
      planId = res.body.data.id;
    });

    it('should retrieve the list of reading plans', async () => {
      const res = await request(app)
        .get('/api/bible/plans')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(planId);
      expect(res.body.data[0].days).toHaveLength(3);
    });

    it('should enroll a member and update the new believer profile milestone', async () => {
      const res = await request(app)
        .post(`/api/bible/plans/${planId}/enroll`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.planId).toBe(planId);
      expect(res.body.data.memberId).toBe(studentMemberId);
      expect(res.body.data.progressPercent).toBe(0);
      enrollmentId = res.body.data.id;

      // Verify that NewBelieverProfile bibleReadingPlanStartedAt is set
      const profile = await prisma.newBelieverProfile.findFirst({
        where: { memberId: studentMemberId },
      });
      expect(profile!.bibleReadingPlanStartedAt).toBeDefined();
    });

    it('should complete days and recalculate progress percentage', async () => {
      // Complete Day 1
      let res = await request(app)
        .post(`/api/bible/enrollments/${enrollmentId}/complete-day`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ dayNumber: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.progressPercent).toBe(33.3);
      expect(res.body.data.completedAt).toBeNull();

      // Complete Day 2
      res = await request(app)
        .post(`/api/bible/enrollments/${enrollmentId}/complete-day`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ dayNumber: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.progressPercent).toBe(66.7);
      expect(res.body.data.completedAt).toBeNull();

      // Complete Day 3 (Finish reading plan)
      res = await request(app)
        .post(`/api/bible/enrollments/${enrollmentId}/complete-day`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ dayNumber: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.progressPercent).toBe(100);
      expect(res.body.data.completedAt).toBeDefined();
    });
  });

  describe('Bookmarks & Personal Notes API', () => {
    it('should add a bookmark on a specific verse', async () => {
      const res = await request(app)
        .post('/api/bible/bookmarks')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          translationCode: 'esv',
          bookSlug: 'john',
          chapter: 3,
          verse: 16,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.bookSlug).toBe('john');
      expect(res.body.data.chapter).toBe(3);
      expect(res.body.data.verse).toBe(16);
      bookmarkId = res.body.data.id;
    });

    it('should retrieve student bookmarks', async () => {
      const res = await request(app)
        .get('/api/bible/bookmarks')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(bookmarkId);
    });

    it('should delete a bookmark', async () => {
      const res = await request(app)
        .delete(`/api/bible/bookmarks/${bookmarkId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Bookmark removed successfully');

      const check = await prisma.bibleBookmark.findUnique({ where: { id: bookmarkId } });
      expect(check).toBeNull();
    });

    it('should save and update personal study notes linked to a verse', async () => {
      let res = await request(app)
        .post('/api/bible/notes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookSlug: 'john',
          chapter: 3,
          verse: 16,
          noteText: "God's sacrificial love for mankind.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.noteText).toBe("God's sacrificial love for mankind.");

      // Update same note
      res = await request(app)
        .post('/api/bible/notes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookSlug: 'john',
          chapter: 3,
          verse: 16,
          noteText: "God's sacrificial love for mankind. This is a updated revelation.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.noteText).toContain('updated revelation');
    });

    it('should retrieve personal study notes with filters', async () => {
      const res = await request(app)
        .get('/api/bible/notes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ bookSlug: 'john', chapter: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].bookSlug).toBe('john');
      expect(res.body.data[0].noteText).toContain('updated revelation');
    });
  });

  describe('Daily Devotionals API', () => {
    it('should allow admin to publish a daily devotional', async () => {
      const res = await request(app)
        .post('/api/bible/devotionals')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: new Date().toISOString(),
          title: 'Walking in Love',
          content: 'God demonstrated His own love for us in this: While we were yet sinners, Christ died for us.',
          scriptureRef: 'John 3:16',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Walking in Love');
      expect(res.body.data.authorId).toBe(adminMemberId);
    });

    it('should retrieve today devotional', async () => {
      const res = await request(app)
        .get('/api/bible/devotionals/today')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Walking in Love');
      expect(res.body.data.scriptureRef).toBe('John 3:16');
      expect(res.body.data.author.firstName).toBe('Barnabas');
    });
  });

  describe('Sermons / Services Cross-Linking API', () => {
    it('should fetch church services/sermons referencing John 3', async () => {
      const res = await request(app)
        .get('/api/bible/linked-sermons')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ book: 'john', chapter: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].serviceId).toBe(serviceId);
      expect(res.body.data[0].title).toBe('Sunday Victory Service');
      expect(res.body.data[0].reference).toBe('John 3:16');
    });
  });

  describe('Verse Highlights API', () => {
    it('should allow student to highlight a verse', async () => {
      const res = await request(app)
        .post('/api/bible/highlights')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          translationCode: 'esv',
          bookSlug: 'john',
          chapter: 3,
          verse: 16,
          color: 'yellow',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.color).toBe('yellow');
      highlightId = res.body.data.id;
    });

    it('should list member highlights', async () => {
      const res = await request(app)
        .get('/api/bible/highlights')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(highlightId);
      expect(res.body.data[0].color).toBe('yellow');
    });

    it('should delete a highlight', async () => {
      const res = await request(app)
        .delete(`/api/bible/highlights/${highlightId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Highlight removed successfully');
    });
  });

  describe('Audio Bible API', () => {
    it('should allow admin to register an audio track for a chapter', async () => {
      const res = await request(app)
        .post('/api/bible/audio')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          translationCode: 'esv',
          bookSlug: 'john',
          chapter: 3,
          audioUrl: 'https://cdn.church.org/audio/esv_john_3.mp3',
          provider: 'custom',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.audioUrl).toBe('https://cdn.church.org/audio/esv_john_3.mp3');
    });

    it('should retrieve the registered audio track for members', async () => {
      const res = await request(app)
        .get('/api/bible/audio/esv/john/3')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.audioUrl).toBe('https://cdn.church.org/audio/esv_john_3.mp3');
    });

    it('should fallback to mock audio URL if not registered', async () => {
      const res = await request(app)
        .get('/api/bible/audio/esv/genesis/1')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.audioUrl).toBe('https://audio.bible.is/tts/esv/genesis/1.mp3');
    });
  });

  describe('Offline Download API', () => {
    it('should download translation verses in bulk', async () => {
      const res = await request(app)
        .get('/api/bible/translations/esv/download')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.translation.code).toBe('esv');
      expect(res.body.verses).toHaveLength(4);
      expect(res.body.verses[0].book).toBe('genesis');
      expect(res.body.verses[2].book).toBe('john');
      expect(res.body.verses[2].text).toContain('For God so loved the world');
    });
  });

  describe('Scripture Graphics & Share Creator API', () => {
    it('should retrieve templates lists', async () => {
      const res = await request(app)
        .get('/api/bible/graphics/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(4);
      expect(res.body.data[0].id).toBe('sunset');
    });

    it('should generate a scripture graphic share request', async () => {
      const res = await request(app)
        .post('/api/bible/graphics/generate')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          text: 'For God so loved the world...',
          reference: 'John 3:16',
          templateId: 'sunset',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.renderedImageUrl).toContain('rendered-');
      expect(res.body.data.template.name).toBe('Sunset Glow');
      graphicId = res.body.data.id;
    });

    it('should render a public scripture graphic bypassing auth', async () => {
      const res = await request(app)
        .get(`/api/bible/graphics/render/${graphicId}`);

      if (res.status !== 200) {
        console.log('Render Error Status:', res.status);
        console.log('Render Error Body:', res.body);
        console.log('Render Error Text:', res.text);
      }

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('image/svg+xml; charset=utf-8');
      const text = res.text || (res.body instanceof Buffer ? res.body.toString() : String(res.body));
      expect(text).toContain('<svg');
      expect(text).toContain('John 3:16');
    });
  });
});
