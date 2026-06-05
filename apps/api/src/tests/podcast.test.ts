import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Podcast & Audio Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let guestToken: string;

  let publishedShowId: string;
  let publishedShowSlug: string;
  let draftShowId: string;
  let draftShowSlug: string;

  let publishedEpisodeId: string;
  let draftEpisodeId: string;

  beforeAll(async () => {
    // 1. Clean up database
    await prisma.podcastEpisode.deleteMany({});
    await prisma.podcastChannel.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Podcast Test Church', subdomain: 'podcast-test', status: 'active' },
    });
    tenantId = tenant.id;

    // Ensure ModuleDefinition exists
    await prisma.moduleDefinition.upsert({
      where: { key: 'podcast-audio-broadcasting' },
      update: {},
      create: {
        key: 'podcast-audio-broadcasting',
        name: 'Podcast & Audio Broadcasting',
        category: 'Media',
      },
    });

    // Create TenantModule entitlement mapping
    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey: 'podcast-audio-broadcasting',
        status: 'active',
        billingRule: 'free',
        usageLimits: '{}',
      },
    });

    // 3. Setup permissions & roles
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
    const memberReadPerm = permissions.find((p) => p.name === 'member.read');
    if (memberReadPerm) {
      await prisma.rolePermission.create({
        data: { roleId: memberRole.id, permissionId: memberReadPerm.id },
      });
    }

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@podcast-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@podcast-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'Podcast',
        lastName: 'Member',
        membershipStatus: 'member',
      },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 6. Create Guest User (authenticated but no roles)
    const guestUser = await prisma.user.create({
      data: { tenantId, email: 'guest@podcast-test.com', passwordHash: passHash },
    });
    guestToken = jwt.sign({ userId: guestUser.id, tenantId, email: guestUser.email }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. SHOW MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  describe('Shows Management', () => {
    it('should allow admin to create a published podcast show', async () => {
      const res = await request(app)
        .post('/api/podcast/shows')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sermons & Grace',
          slug: 'sermons-grace',
          description: 'Weekly sermons from Grace Church.',
          author: 'Grace Church Media',
          email: 'media@gracechurch.org',
          coverImageUrl: 'https://cdn.grace.org/podcasts/sermons.jpg',
          category: 'Religion & Spirituality',
          subcategory: 'Christianity',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Sermons & Grace');
      expect(res.body.data.status).toBe('published');
      publishedShowId = res.body.data.id;
      publishedShowSlug = res.body.data.slug;
    });

    it('should allow admin to create a draft podcast show', async () => {
      const res = await request(app)
        .post('/api/podcast/shows')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Grace Devotionals (Draft)',
          slug: 'grace-devotionals',
          author: 'Grace Church Devotionals Team',
          category: 'Religion & Spirituality',
          status: 'draft',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      draftShowId = res.body.data.id;
      draftShowSlug = res.body.data.slug;
    });

    it('should allow member to list only published shows', async () => {
      const res = await request(app)
        .get('/api/podcast/shows')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(publishedShowId);
    });

    it('should allow admin to list all shows, including draft', async () => {
      const res = await request(app)
        .get('/api/podcast/shows?status=draft')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // It should include draft shows if requested
      const draftShow = res.body.data.find((s: any) => s.id === draftShowId);
      expect(draftShow).toBeDefined();
    });

    it('should block non-admins from viewing draft shows via detail endpoint', async () => {
      const res = await request(app)
        .get(`/api/podcast/shows/${draftShowId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to view draft show details', async () => {
      const res = await request(app)
        .get(`/api/podcast/shows/${draftShowId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('(Draft)');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. EPISODE MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  describe('Episodes Management', () => {
    it('should allow admin to create a published episode', async () => {
      const res = await request(app)
        .post('/api/podcast/episodes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          showId: publishedShowId,
          title: 'Walking in Grace',
          slug: 'walking-in-grace',
          description: 'A study on Ephesians 2.',
          audioUrl: 'https://cdn.grace.org/audio/walking-in-grace.mp3',
          durationSeconds: 1800,
          fileSize: 45000000,
          status: 'published',
          episodeType: 'full',
          episodeNumber: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Walking in Grace');
      expect(res.body.data.status).toBe('published');
      publishedEpisodeId = res.body.data.id;
    });

    it('should allow admin to create a draft episode', async () => {
      const res = await request(app)
        .post('/api/podcast/episodes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          showId: publishedShowId,
          title: 'Running in Grace (Draft)',
          slug: 'running-in-grace',
          audioUrl: 'https://cdn.grace.org/audio/running-in-grace.mp3',
          status: 'draft',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      draftEpisodeId = res.body.data.id;
    });

    it('should restrict member to published episodes only when listing', async () => {
      const res = await request(app)
        .get(`/api/podcast/shows/${publishedShowId}/episodes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(publishedEpisodeId);
    });

    it('should allow admin to list draft episodes', async () => {
      const res = await request(app)
        .get(`/api/podcast/shows/${publishedShowId}/episodes?status=draft`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const draftEpisode = res.body.data.find((e: any) => e.id === draftEpisodeId);
      expect(draftEpisode).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. PUBLIC ITUNES RSS FEED GENERATION
  // ─────────────────────────────────────────────────────────────
  describe('Public RSS Feed Endpoint', () => {
    it('should generate a valid RSS XML feed without authentication or tenant header', async () => {
      const res = await request(app)
        .get(`/api/podcast/feeds/${tenantId}/${publishedShowSlug}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');

      const xmlText = res.text;
      // Assert root elements
      expect(xmlText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xmlText).toContain('<rss version="2.0"');
      expect(xmlText).toContain('xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"');

      // Assert channel information
      expect(xmlText).toContain('<title><![CDATA[Sermons & Grace]]></title>');
      expect(xmlText).toContain('<itunes:category text="Religion &amp; Spirituality">');
      expect(xmlText).toContain('<itunes:category text="Christianity" />');
      expect(xmlText).toContain('<itunes:email>media@gracechurch.org</itunes:email>');

      // Assert episode item information
      expect(xmlText).toContain('<title><![CDATA[Walking in Grace]]></title>');
      expect(xmlText).toContain('<enclosure url="https://cdn.grace.org/audio/walking-in-grace.mp3" length="45000000" type="audio/mpeg" />');
      expect(xmlText).toContain('<itunes:duration>1800</itunes:duration>');
      expect(xmlText).toContain('<itunes:episode>1</itunes:episode>');

      // Omissions: draft episodes should not be present
      expect(xmlText).not.toContain('Running in Grace');
    });

    it('should return 404 for draft show feed', async () => {
      const res = await request(app)
        .get(`/api/podcast/feeds/${tenantId}/${draftShowSlug}`);

      expect(res.status).toBe(404);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SOFT DELETE / ARCHIVING FLOW
  // ─────────────────────────────────────────────────────────────
  describe('Soft Delete & Archiving', () => {
    it('should allow admin to soft delete an episode', async () => {
      const res = await request(app)
        .delete(`/api/podcast/episodes/${publishedEpisodeId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });

    it('should omit archived episodes from member listings', async () => {
      const res = await request(app)
        .get(`/api/podcast/shows/${publishedShowId}/episodes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((e: any) => e.id);
      expect(ids).not.toContain(publishedEpisodeId);
    });

    it('should omit archived episodes from public RSS feed', async () => {
      const res = await request(app)
        .get(`/api/podcast/feeds/${tenantId}/${publishedShowSlug}`);

      expect(res.status).toBe(200);
      expect(res.text).not.toContain('Walking in Grace');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. PLAYLISTS CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Playlists Management', () => {
    let playlistId: string;

    it('should allow admin to create a playlist', async () => {
      const res = await request(app)
        .post('/api/podcast/playlists')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Grace Classics',
          slug: 'grace-classics',
          description: 'Timeless grace teachings.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Grace Classics');
      playlistId = res.body.data.id;
    });

    it('should allow admin to add an episode to a playlist', async () => {
      const res = await request(app)
        .post(`/api/podcast/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          episodeId: draftEpisodeId,
          displayOrder: 1,
        });

      expect(res.status).toBe(201);
    });

    it('should list playlists for tenant', async () => {
      const res = await request(app)
        .get('/api/podcast/playlists')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. SPEAKERS & SERIES CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Speakers & Series', () => {
    it('should allow admin to create a speaker', async () => {
      const res = await request(app)
        .post('/api/podcast/speakers')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pastor John Grace',
          slug: 'pastor-john-grace',
          title: 'Senior Pastor',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Pastor John Grace');
    });

    it('should allow admin to create a series', async () => {
      const res = await request(app)
        .post('/api/podcast/series')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'The Grace Series',
          slug: 'grace-series',
          description: 'A study on biblical grace.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('The Grace Series');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. SETTINGS MODIFICATIONS
  // ─────────────────────────────────────────────────────────────
  describe('Settings Modifications', () => {
    it('should allow admin to retrieve settings', async () => {
      const res = await request(app)
        .get('/api/podcast/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enabled).toBe(true);
    });

    it('should allow admin to update settings', async () => {
      const res = await request(app)
        .patch('/api/podcast/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          defaultLanguage: 'fr',
          allowRssFeed: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.defaultLanguage).toBe('fr');
      expect(res.body.data.allowRssFeed).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. STRICT TENANT ISOLATION BOUNDS
  // ─────────────────────────────────────────────────────────────
  describe('Multi-Tenant Isolation Bounds', () => {
    let tenantBId: string;
    let adminBToken: string;

    beforeAll(async () => {
      // Create Tenant B
      const tenantB = await prisma.tenant.create({
        data: { name: 'Podcast Isolation Church B', subdomain: 'podcast-isolation-b', status: 'active' },
      });
      tenantBId = tenantB.id;

      // Enable module for Tenant B
      await prisma.tenantModule.create({
        data: {
          tenantId: tenantBId,
          moduleKey: 'podcast-audio-broadcasting',
          status: 'active',
        },
      });

      const passHash = await bcrypt.hash('password123', 12);
      const adminRoleB = await prisma.role.create({
        data: { tenantId: tenantBId, name: 'Admin', isCustom: false },
      });

      // Seeding Tenant B admin permissions
      const permissions = await prisma.permission.findMany({
        where: { name: { in: ['member.read', 'tenant.settings'] } },
      });
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: adminRoleB.id, permissionId: p.id })),
      });

      const adminUserB = await prisma.user.create({
        data: { tenantId: tenantBId, email: 'admin@isolation-b.com', passwordHash: passHash },
      });
      await prisma.userRole.create({
        data: { userId: adminUserB.id, roleId: adminRoleB.id },
      });

      adminBToken = jwt.sign({ userId: adminUserB.id, tenantId: tenantBId, email: adminUserB.email }, JWT_SECRET);
    });

    it('should block Church B from reading Church A channels', async () => {
      const res = await request(app)
        .get(`/api/podcast/channels/${publishedShowId}`)
        .set('x-tenant-id', tenantBId) // request with Tenant B context
        .set('Authorization', `Bearer ${adminBToken}`);

      expect(res.status).toBe(404);
    });

    it('should block Church B from editing Church A channels', async () => {
      const res = await request(app)
        .put(`/api/podcast/channels/${publishedShowId}`)
        .set('x-tenant-id', tenantBId)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          title: 'Hacked Show Title',
        });

      expect(res.status).toBe(404);
    });
  });
});
