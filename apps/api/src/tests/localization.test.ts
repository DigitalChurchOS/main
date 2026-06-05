import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { translate } from '../services/localization';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Unified Localization & Translation Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;

  let pageId: string;
  let blogPostId: string;
  let resourceId: string;
  let livestreamId: string;
  let mediaAssetId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.translationJob.deleteMany({});
    await prisma.translatedContent.deleteMany({});
    await prisma.liveTranslationFeed.deleteMany({});
    await prisma.mediaCaption.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.blogPost.deleteMany({});
    await prisma.libraryResource.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.translationKey.deleteMany({});
    await prisma.languageRegistry.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Unified Localization Church', subdomain: 'unified-locale', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: ['member.create', 'member.read', 'tenant.settings'] },
      },
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

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@unified-locale.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@unified-locale.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 6. Create linked Member profiles
    await prisma.member.create({
      data: {
        tenantId,
        userId: adminUserId,
        firstName: 'System',
        lastName: 'Admin',
        membershipStatus: 'leader',
      },
    });

    // 7. Setup default OpenAI integration connected service for AI translations
    const encrypted = encryptCredentials(JSON.stringify({ apiKey: 'sk-mock-openai-key' }), tenantId);
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'openai',
        encryptedCredentials: encrypted,
        providerMode: 'bring_your_own',
        isActive: true,
      },
    });

    // 8. Seed CMS Website & Page
    const theme = await prisma.theme.create({
      data: {
        name: 'Grace Theme',
        settings: JSON.stringify({ primaryColor: '#6200EE', font: 'Inter' }),
        isCustom: true,
      },
    });
    const website = await prisma.website.create({
      data: { tenantId, themeId: theme.id, title: 'Grace Website' },
    });
    const page = await prisma.page.create({
      data: {
        tenantId,
        websiteId: website.id,
        title: 'About Us',
        slug: 'about-us',
        content: 'Welcome to our church!',
        status: 'published',
      },
    });
    pageId = page.id;

    // 9. Seed Blog Post
    const post = await prisma.blogPost.create({
      data: {
        tenantId,
        title: 'Daily Devotional Day 1',
        slug: 'devotional-day-1',
        content: 'Today we discuss faith.',
        excerpt: 'Faith in action.',
        postType: 'devotional',
        status: 'published',
      },
    });
    blogPostId = post.id;

    // 10. Seed Library Resource
    const resource = await prisma.libraryResource.create({
      data: {
        tenantId,
        title: 'Membership Manual',
        slug: 'membership-manual',
        description: 'Guide for new members.',
        fileUrl: 'https://cdn.church.org/manual.pdf',
        status: 'published',
      },
    });
    resourceId = resource.id;

    // 11. Seed Livestream
    const livestream = await prisma.livestream.create({
      data: {
        tenantId,
        title: 'Sunday Morning Broadcast',
        status: 'scheduled',
      },
    });
    livestreamId = livestream.id;

    // 12. Seed Media Asset
    const media = await prisma.mediaAsset.create({
      data: {
        tenantId,
        title: 'Sermon Video',
        type: 'video',
        providerType: 'external_link',
        status: 'published',
      },
    });
    mediaAssetId = media.id;
  });

  afterAll(async () => {
    await prisma.translationJob.deleteMany({});
    await prisma.translatedContent.deleteMany({});
    await prisma.liveTranslationFeed.deleteMany({});
    await prisma.mediaCaption.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.blogPost.deleteMany({});
    await prisma.libraryResource.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // PART 1: CORE LOCALE & KEY REGISTRATION TEST SUITES
  // ═══════════════════════════════════════════════════════════

  describe('Language Registry', () => {
    it('should allow admin to register supported LTR and RTL languages', async () => {
      // Register English (LTR)
      const resEn = await request(app)
        .post('/api/localization/languages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: 'en', name: 'English', direction: 'ltr' });

      expect(resEn.status).toBe(201);
      expect(resEn.body.data.id).toBe('en');
      expect(resEn.body.data.direction).toBe('ltr');

      // Register Spanish (LTR)
      const resEs = await request(app)
        .post('/api/localization/languages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: 'es', name: 'Español', direction: 'ltr' });

      expect(resEs.status).toBe(201);

      // Register Arabic (RTL)
      const resAr = await request(app)
        .post('/api/localization/languages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: 'ar', name: 'العربية', direction: 'rtl' });

      expect(resAr.status).toBe(201);
      expect(resAr.body.data.id).toBe('ar');
      expect(resAr.body.data.direction).toBe('rtl');
    });

    it('should list active registered languages', async () => {
      const res = await request(app)
        .get('/api/localization/languages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Translation Key Registry', () => {
    it('should upload translations for English core namespace', async () => {
      const res = await request(app)
        .post('/api/localization/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'en',
          namespace: 'core',
          keys: {
            'button.give_now': 'Give Now',
            'welcome.heading': 'Welcome {{name}}!',
            'common.error': 'An error occurred',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should upload translations for Spanish core namespace', async () => {
      const res = await request(app)
        .post('/api/localization/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'es',
          namespace: 'core',
          keys: {
            'button.give_now': 'Donar Ahora',
            'welcome.heading': '¡Bienvenido {{name}}!',
          },
        });

      expect(res.status).toBe(200);
    });

    it('should upload translations for a plugin namespace', async () => {
      const res = await request(app)
        .post('/api/localization/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'en',
          namespace: 'whatsapp-helper',
          keys: {
            'notification.sent': 'Notification dispatched to {{phone}}',
          },
        });

      expect(res.status).toBe(200);
    });
  });

  describe('Translation Key Resolver', () => {
    it('should fetch translation list mapped to namespace and locale', async () => {
      const res = await request(app)
        .get('/api/localization/translations?locale=es&namespaces=core')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data['button.give_now']).toBe('Donar Ahora');
    });

    it('should fall back to English values when a key is missing in the target locale', async () => {
      const res = await request(app)
        .get('/api/localization/translations?locale=es&namespaces=core')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data['common.error']).toBe('An error occurred');
    });

    it('should correctly format variables and placeholders', async () => {
      const translatedEn = await translate('en', 'welcome.heading', 'core', { name: 'Pastor Dave' });
      expect(translatedEn).toBe('Welcome Pastor Dave!');

      const translatedEs = await translate('es', 'welcome.heading', 'core', { name: 'Pastor Dave' });
      expect(translatedEs).toBe('¡Bienvenido Pastor Dave!');
    });
  });

  describe('Locale Detection Middleware', () => {
    it('should auto-detect locale from Accept-Language header weighting', async () => {
      const res = await request(app)
        .get('/api/localization/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'es-ES, es;q=0.9, en;q=0.8');

      expect(res.status).toBe(200);
      expect(res.body.data['button.give_now']).toBe('Donar Ahora');
    });

    it('should override browser headers when explicit query param is supplied', async () => {
      const res = await request(app)
        .get('/api/localization/translations?locale=en')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'es-ES, es;q=0.9');

      expect(res.status).toBe(200);
      expect(res.body.data['button.give_now']).toBe('Give Now');
    });

    it('should persist user language preference and resolve it as highest priority override', async () => {
      const putRes = await request(app)
        .put('/api/localization/user/preferred-language')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ preferredLanguage: 'es' });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.preferredLanguage).toBe('es');

      const member = await prisma.member.findUnique({
        where: { userId: adminUserId },
      });
      expect(member?.preferredLanguage).toBe('es');

      const res = await request(app)
        .get('/api/localization/translations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data['button.give_now']).toBe('Donar Ahora');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PART 2: ADVANCED ENTITY-LEVEL TRANSLATION TEST SUITES
  // ═══════════════════════════════════════════════════════════

  describe('AI Translation Jobs', () => {
    let jobId: string;

    it('should allow admin to trigger content translation job', async () => {
      const res = await request(app)
        .post('/api/localization/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entityType: 'page',
          entityId: pageId,
          targetLanguage: 'es',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.targetLanguage).toBe('es');
      expect(res.body.data.translatedContent).toBeDefined();

      const payload = JSON.parse(res.body.data.translatedContent);
      expect(payload.title).toContain('[Translated to es]: About Us');
      expect(payload.content).toContain('[Translated to es]: Welcome to our church!');
      jobId = res.body.data.id;
    });

    it('should allow trigger content translation job for a blog post', async () => {
      const res = await request(app)
        .post('/api/localization/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entityType: 'blog_post',
          entityId: blogPostId,
          targetLanguage: 'fr',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.targetLanguage).toBe('fr');

      const payload = JSON.parse(res.body.data.translatedContent);
      expect(payload.title).toContain('[Translated to fr]: Daily Devotional');
      expect(payload.excerpt).toContain('[Translated to fr]: Faith in action.');
    });

    it('should reject job trigger with missing fields', async () => {
      const res = await request(app)
        .post('/api/localization/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entityType: 'page',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should reject job trigger for non-existent content', async () => {
      const res = await request(app)
        .post('/api/localization/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entityType: 'page',
          entityId: '00000000-0000-0000-0000-000000000000',
          targetLanguage: 'es',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Page not found');
    });

    it('should block standard members from triggering translation jobs', async () => {
      const res = await request(app)
        .post('/api/localization/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          entityType: 'page',
          entityId: pageId,
          targetLanguage: 'es',
        });

      expect(res.status).toBe(403);
    });

    it('should allow admin to query translation job details', async () => {
      const res = await request(app)
        .get(`/api/localization/jobs/${jobId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(jobId);
    });

    it('should return 404 for non-existent job ID', async () => {
      const res = await request(app)
        .get('/api/localization/jobs/00000000-0000-0000-0000-000000000000')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should allow admin to approve and publish a translation draft', async () => {
      const res = await request(app)
        .post(`/api/localization/jobs/${jobId}/approve`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entityId).toBe(pageId);
      expect(res.body.data.locale).toBe('es');
      expect(res.body.data.isPublished).toBe(true);
      expect(res.body.data.slug).toBe('about-us');
    });
  });

  describe('Manual Translations & localized slugs', () => {
    it('should allow admin to manually save/update a translation with SEO tags', async () => {
      const res = await request(app)
        .post('/api/localization/contents')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entityType: 'library_resource',
          entityId: resourceId,
          locale: 'es',
          slug: 'manual-de-membresia',
          title: 'Manual de Membresía',
          content: 'Guía para nuevos miembros.',
          seoTitle: 'Manual de Membresía de la Iglesia',
          seoDescription: 'Esta es la guía oficial para los nuevos miembros.',
          seoKeywords: 'iglesia, membresia, guia',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Manual de Membresía');
      expect(res.body.data.slug).toBe('manual-de-membresia');
      expect(res.body.data.seoKeywords).toBe('iglesia, membresia, guia');
    });

    it('should retrieve translations list for an entity', async () => {
      const res = await request(app)
        .get(`/api/localization/contents/library_resource/${resourceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].locale).toBe('es');
    });

    it('should fetch translation of an entity by locale', async () => {
      const res = await request(app)
        .get(`/api/localization/contents/library_resource/${resourceId}/es`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Manual de Membresía');
    });

    it('should return 404 for non-existent translation locale', async () => {
      const res = await request(app)
        .get(`/api/localization/contents/library_resource/${resourceId}/fr`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should resolve a translated content by its localized slug', async () => {
      const res = await request(app)
        .get(`/api/localization/contents/library_resource/slug/es/manual-de-membresia`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entityId).toBe(resourceId);
      expect(res.body.data.title).toBe('Manual de Membresía');
    });

    it('should return 404 when resolving content by non-existent slug', async () => {
      const res = await request(app)
        .get(`/api/localization/contents/library_resource/slug/es/non-existent-slug`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Livestream Interpretation Feeds', () => {
    it('should allow admin to register interpretation audio feed for a livestream', async () => {
      const res = await request(app)
        .post(`/api/localization/livestreams/${livestreamId}/feeds`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'es',
          audioUrl: 'https://cdn.church.org/live/spanish-feed.mp3',
          label: 'Spanish Audio Feed',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.locale).toBe('es');
      expect(res.body.data.audioUrl).toBe('https://cdn.church.org/live/spanish-feed.mp3');
      expect(res.body.data.label).toBe('Spanish Audio Feed');
    });

    it('should retrieve all interpretation feeds for a livestream', async () => {
      const res = await request(app)
        .get(`/api/localization/livestreams/${livestreamId}/feeds`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].locale).toBe('es');
    });

    it('should reject livestream feed registration if livestream does not exist', async () => {
      const res = await request(app)
        .post('/api/localization/livestreams/00000000-0000-0000-0000-000000000000/feeds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'es',
          audioUrl: 'https://cdn.church.org/live/spanish-feed.mp3',
          label: 'Spanish Audio Feed',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Livestream not found');
    });
  });

  describe('Media Subtitle Tracks', () => {
    it('should allow admin to register caption track for a media asset', async () => {
      const res = await request(app)
        .post(`/api/localization/media/${mediaAssetId}/captions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'fr',
          fileUrl: 'https://cdn.church.org/media/subtitles-fr.vtt',
          content: 'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nBonjour tout le monde.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.locale).toBe('fr');
      expect(res.body.data.fileUrl).toBe('https://cdn.church.org/media/subtitles-fr.vtt');
      expect(res.body.data.content).toContain('Bonjour tout le monde.');
    });

    it('should retrieve all caption tracks for a media asset', async () => {
      const res = await request(app)
        .get(`/api/localization/media/${mediaAssetId}/captions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].locale).toBe('fr');
    });

    it('should reject caption track registration if media asset does not exist', async () => {
      const res = await request(app)
        .post('/api/localization/media/00000000-0000-0000-0000-000000000000/captions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          locale: 'fr',
          fileUrl: 'https://cdn.church.org/media/subtitles-fr.vtt',
          content: 'WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nBonjour tout le monde.',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Media asset not found');
    });
  });
});
