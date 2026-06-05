import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Media Module', () => {
  let tenantId: string;
  let otherTenantId: string;
  let unentitledTenantId: string;
  let adminToken: string;
  let viewerToken: string;
  let otherAdminToken: string;
  let unentitledAdminToken: string;
  let categoryId: string;
  let tagId: string;
  let speakerId: string;
  let seriesId: string;
  let assetId: string;
  let platformAssetId: string;
  let playlistId: string;
  let moduleRecordId: string;

  async function ensurePermissions(keys: string[]) {
    const permissions = [];
    for (const key of keys) {
      permissions.push(await prisma.permission.upsert({
        where: { name: key },
        update: { description: `Test permission ${key}` },
        create: { name: key, description: `Test permission ${key}` },
      }));
    }
    return permissions;
  }

  async function createUserWithRole(tenant: string, email: string, roleName: string, permissionKeys: string[]) {
    const permissions = await ensurePermissions(permissionKeys);
    const role = await prisma.role.create({ data: { tenantId: tenant, name: roleName, isCustom: roleName !== 'Admin' } });
    await prisma.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })) });
    const user = await prisma.user.create({ data: { tenantId: tenant, email, passwordHash: await bcrypt.hash('password123', 12) } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    await prisma.member.create({ data: { tenantId: tenant, userId: user.id, firstName: roleName, lastName: 'User', membershipStatus: 'leader' } });
    return jwt.sign({ userId: user.id, tenantId: tenant, email: user.email }, JWT_SECRET);
  }

  beforeAll(async () => {
    await prisma.mediaPlaylistItem.deleteMany({});
    await prisma.mediaAssetTag.deleteMany({});
    await prisma.mediaCaption.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.mediaPlaylist.deleteMany({});
    await prisma.mediaSeries.deleteMany({});
    await prisma.speaker.deleteMany({});
    await prisma.mediaTag.deleteMany({});
    await prisma.mediaCategory.deleteMany({});
    await prisma.mediaModuleActivity.deleteMany({});
    await prisma.mediaModuleSettings.deleteMany({});
    await prisma.mediaModule.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.moduleSettings.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    await prisma.moduleDefinition.upsert({
      where: { key: 'media' },
      update: { name: 'Media Module', category: 'Content', dependencies: '["website-cms"]' },
      create: { key: 'media', name: 'Media Module', category: 'Content', dependencies: '["website-cms"]' },
    });

    const tenant = await prisma.tenant.create({ data: { name: 'Media Test Church', subdomain: 'media-test', status: 'active' } });
    tenantId = tenant.id;
    const otherTenant = await prisma.tenant.create({ data: { name: 'Other Media Church', subdomain: 'other-media-test', status: 'active' } });
    otherTenantId = otherTenant.id;
    const unentitledTenant = await prisma.tenant.create({ data: { name: 'No Media Church', subdomain: 'no-media-test', status: 'active' } });
    unentitledTenantId = unentitledTenant.id;

    await prisma.tenantModule.createMany({
      data: [
        { tenantId, moduleKey: 'media', status: 'active', billingRule: 'included' },
        { tenantId: otherTenantId, moduleKey: 'media', status: 'active', billingRule: 'included' },
      ],
    });

    const adminPermissions = ['member.read', 'tenant.settings', 'media.read', 'media.create', 'media.update', 'media.delete', 'media.manage_settings', 'media.view_reports'];
    adminToken = await createUserWithRole(tenantId, 'admin@media-test.com', 'Admin', adminPermissions);
    viewerToken = await createUserWithRole(tenantId, 'viewer@media-test.com', 'Viewer', ['member.read', 'media.read']);
    otherAdminToken = await createUserWithRole(otherTenantId, 'admin@other-media-test.com', 'Admin', adminPermissions);
    unentitledAdminToken = await createUserWithRole(unentitledTenantId, 'admin@no-media-test.com', 'Admin', adminPermissions);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Access control and entitlement', () => {
    it('requires authentication for every media route', async () => {
      const res = await request(app).get('/api/media/overview').set('x-tenant-id', tenantId);
      expect(res.status).toBe(401);
    });

    it('requires an active media module entitlement', async () => {
      const res = await request(app).get('/api/media/overview').set('x-tenant-id', unentitledTenantId).set('Authorization', `Bearer ${unentitledAdminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.moduleKey).toBe('media');
    });

    it('blocks write access for read-only users', async () => {
      const res = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Blocked Upload', type: 'video', providerType: 'youtube', sourceUrl: 'https://youtu.be/dQw4w9WgXcQ' });
      expect(res.status).toBe(403);
    });

    it('blocks report access without media.view_reports', async () => {
      const res = await request(app).get('/api/media/reports').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Settings and module records', () => {
    it('returns default settings and syncs updates into centralized settings', async () => {
      const defaults = await request(app).get('/api/media/settings').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`);
      expect(defaults.status).toBe(200);
      expect(defaults.body.data.moduleKey).toBe('media');
      expect(JSON.parse(defaults.body.data.configJson).enableExternalEmbeds).toBe(true);

      const updated = await request(app)
        .patch('/api/media/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enabled: true, billingPlan: 'premium', providerMode: 'hybrid', configJson: { maxUploadSizeMb: 25, defaultVisibility: 'members_only', publishRequiresThumbnail: true } });
      expect(updated.status).toBe(200);
      expect(updated.body.data.billingPlan).toBe('premium');
      expect(JSON.parse(updated.body.data.configJson).publishRequiresThumbnail).toBe(true);

      const centralized = await request(app).get('/api/settings/media').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(centralized.status).toBe(200);
      expect(centralized.body.data.maxUploadSizeMb).toBe(25);
    });

    it('creates and updates tenant-scoped module records', async () => {
      const created = await request(app)
        .post('/api/media')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Grace Media Archive', description: 'Primary sermon, replay, and resource workspace.', visibility: 'private' });
      expect(created.status).toBe(201);
      expect(created.body.data.tenantId).toBe(tenantId);
      moduleRecordId = created.body.data.id;

      const updated = await request(app).patch(`/api/media/${moduleRecordId}`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ title: 'Grace Media Library' });
      expect(updated.status).toBe(200);
      expect(updated.body.data.title).toBe('Grace Media Library');
    });
  });

  describe('Core library workflows', () => {
    it('creates templates for categories, tags, speakers, and series', async () => {
      const category = await request(app).post('/api/media/categories').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Sunday Messages' });
      expect(category.status).toBe(201);
      categoryId = category.body.data.id;
      const tag = await request(app).post('/api/media/tags').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Faith' });
      expect(tag.status).toBe(201);
      tagId = tag.body.data.id;
      const speaker = await request(app).post('/api/media/speakers').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Pastor David', title: 'Senior Pastor', bio: 'Teaches weekly services.' });
      expect(speaker.status).toBe(201);
      speakerId = speaker.body.data.id;
      const series = await request(app).post('/api/media/series').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ title: 'Walking in Faith', description: 'Four-part discipleship series.' });
      expect(series.status).toBe(201);
      seriesId = series.body.data.id;
      const templates = await request(app).get('/api/media/templates').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(templates.status).toBe(200);
      expect(templates.body.data.categories.length).toBe(1);
      expect(templates.body.data.tags.length).toBe(1);
      expect(templates.body.data.speakers.length).toBe(1);
      expect(templates.body.data.series.length).toBe(1);
    });

    it('enforces publishing workflow rules from settings', async () => {
      const res = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'No Thumbnail Published Sermon', type: 'video', providerType: 'youtube', sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', status: 'published' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('thumbnail');
    });

    it('creates, filters, tags, embeds, and plays media assets', async () => {
      const created = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sunday Sermon: Walking in Faith Part 1',
          description: 'The first message in the Walking in Faith series.',
          type: 'video',
          providerType: 'youtube',
          sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnailUrl: 'https://images.example.test/faith.jpg',
          durationSeconds: 2700,
          fileSizeBytes: 524288000,
          mimeType: 'video/mp4',
          categoryId,
          seriesId,
          seriesOrder: 1,
          speakerId,
          status: 'published',
        });
      expect(created.status).toBe(201);
      expect(created.body.data.providerType).toBe('external_link');
      expect(created.body.data.providerKey).toBe('youtube');
      expect(created.body.data.visibility).toBe('members_only');
      expect(created.body.data.publishedAt).toBeTruthy();
      assetId = created.body.data.id;

      const tagRes = await request(app).post(`/api/media/assets/${assetId}/tags`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ tagIds: [tagId] });
      expect(tagRes.status).toBe(200);
      expect(tagRes.body.data.length).toBe(1);

      const filtered = await request(app).get(`/api/media/assets?seriesId=${seriesId}&tagIds=${tagId}&search=Walking`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(filtered.status).toBe(200);
      expect(filtered.body.data.length).toBe(1);

      const embed = await request(app).get(`/api/media/assets/${assetId}/embed`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(embed.status).toBe(200);
      expect(embed.body.data.embedHtml).toContain('youtube.com/embed/dQw4w9WgXcQ');

      const playback = await request(app).post(`/api/media/assets/${assetId}/playback`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(playback.status).toBe(200);
      expect(playback.body.data.assetId).toBe(assetId);
    });

    it('creates upload intents and platform-managed records', async () => {
      const intent = await request(app)
        .post('/api/media/uploads/intent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileName: 'sermon-audio.mp3', fileSizeBytes: 12 * 1024 * 1024, mimeType: 'audio/mpeg', type: 'audio', providerKey: 'platform' });
      expect(intent.status).toBe(201);
      expect(intent.body.data.moduleKey).toBe('media');
      expect(intent.body.data.uploadUrl).toContain('/api/media/uploads/');

      const platformAsset = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Podcast Audio: Walking in Faith', type: 'audio', providerType: 'platform_managed', sourceUrl: '/media/sermon-audio.mp3', thumbnailUrl: 'https://images.example.test/audio.jpg', durationSeconds: 1800, fileSizeBytes: 12 * 1024 * 1024, mimeType: 'audio/mpeg', categoryId, status: 'published' });
      expect(platformAsset.status).toBe(201);
      expect(platformAsset.body.data.providerType).toBe('platform_managed');
      platformAssetId = platformAsset.body.data.id;
    });

    it('creates playlists and keeps items tenant-isolated', async () => {
      const playlist = await request(app).post('/api/media/playlists').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ name: 'Best of 2026', description: 'Top sermons from the year.' });
      expect(playlist.status).toBe(201);
      playlistId = playlist.body.data.id;
      expect((await request(app).post(`/api/media/playlists/${playlistId}/items`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ assetId, order: 2 })).status).toBe(201);
      expect((await request(app).post(`/api/media/playlists/${playlistId}/items`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`).send({ assetId: platformAssetId, order: 1 })).status).toBe(201);
      const items = await request(app).get(`/api/media/playlists/${playlistId}/items`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(items.status).toBe(200);
      expect(items.body.data[0].asset.id).toBe(platformAssetId);
      expect(items.body.data[1].asset.id).toBe(assetId);
      const otherTenantRead = await request(app).get(`/api/media/assets/${assetId}`).set('x-tenant-id', otherTenantId).set('Authorization', `Bearer ${otherAdminToken}`);
      expect(otherTenantRead.status).toBe(404);
    });

    it('archives assets instead of hard-deleting them', async () => {
      const archived = await request(app).delete(`/api/media/assets/${platformAssetId}`).set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`);
      expect(archived.status).toBe(200);
      expect(archived.body.data.status).toBe('archived');
    });
  });

  describe('Dashboard data endpoints and activity history', () => {
    it('returns overview, reports, and activity for the dashboard views', async () => {
      const overview = await request(app).get('/api/media/overview').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${viewerToken}`);
      expect(overview.status).toBe(200);
      expect(overview.body.data.moduleKey).toBe('media');
      expect(overview.body.data.counts.assets).toBeGreaterThanOrEqual(2);
      expect(overview.body.data.recentAssets.length).toBeGreaterThan(0);

      const activity = await request(app).get('/api/media/activity').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`);
      expect(activity.status).toBe(200);
      expect(activity.body.data.some((item: any) => item.actionType === 'asset_created')).toBe(true);

      const reports = await request(app).get('/api/media/reports').set('x-tenant-id', tenantId).set('Authorization', `Bearer ${adminToken}`);
      expect(reports.status).toBe(200);
      expect(reports.body.data.summary.assets).toBeGreaterThanOrEqual(2);
      expect(reports.body.data.summary.plays).toBeGreaterThanOrEqual(1);
    });
  });
});
