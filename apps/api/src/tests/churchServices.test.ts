process.env.JWT_SECRET = process.env.JWT_SECRET || 'church-services-test-secret';

import request from 'supertest';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = require('../app').default;
const JWT_SECRET = process.env.JWT_SECRET!;

const MODULE_KEY = 'church-services';
const TEST_SUBDOMAINS = [
  'church-services-test',
  'church-services-other-test',
  'church-services-unentitled-test',
];

const MODULE_PERMISSIONS = [
  'church-services.read',
  'church-services.create',
  'church-services.update',
  'church-services.delete',
  'church-services.manage_settings',
  'church-services.view_reports',
];

async function cleanTestTenants() {
  const tenants = await prisma.tenant.findMany({
    where: { subdomain: { in: TEST_SUBDOMAINS } },
    select: { id: true },
  });
  if (tenants.length) {
    await prisma.tenant.deleteMany({ where: { id: { in: tenants.map((tenant) => tenant.id) } } });
  }
}

async function ensurePlatformRecords() {
  await prisma.moduleDefinition.upsert({
    where: { key: MODULE_KEY },
    update: { name: 'Church Services', category: 'Content', dependencies: '["media"]' },
    create: { key: MODULE_KEY, name: 'Church Services', category: 'Content', dependencies: '["media"]' },
  });

  for (const name of ['tenant.settings', ...MODULE_PERMISSIONS]) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: `Test permission ${name}` },
    });
  }
}

async function createUserWithRole(tenantId: string, email: string, permissions: string[]) {
  const role = await prisma.role.create({
    data: {
      tenantId,
      name: `Role ${email}`,
      isCustom: false,
    },
  });
  const permissionRecords = await prisma.permission.findMany({ where: { name: { in: permissions } } });
  await prisma.rolePermission.createMany({
    data: permissionRecords.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
  });

  const passwordHash = await bcrypt.hash('password123', 8);
  const user = await prisma.user.create({
    data: { tenantId, email, passwordHash },
  });
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
  await prisma.member.create({
    data: {
      tenantId,
      userId: user.id,
      firstName: email.split('@')[0],
      lastName: 'Tester',
      membershipStatus: 'leader',
    },
  });

  return {
    user,
    token: jwt.sign({ userId: user.id, tenantId, email: user.email }, JWT_SECRET),
  };
}

describe('Church Services module', () => {
  let tenantId: string;
  let otherTenantId: string;
  let unentitledTenantId: string;
  let adminToken: string;
  let viewerToken: string;
  let otherAdminToken: string;
  let unentitledAdminToken: string;
  let adminUserId: string;
  let speakerId: string;
  let otherSpeakerId: string;
  let sermonMediaId: string;
  let audioMediaId: string;
  let livestreamId: string;
  let sundayServiceId: string;
  let midweekServiceId: string;
  let draftServiceId: string;

  beforeAll(async () => {
    await cleanTestTenants();
    await ensurePlatformRecords();

    const [tenant, otherTenant, unentitledTenant] = await Promise.all([
      prisma.tenant.create({ data: { name: 'Church Services Test', subdomain: TEST_SUBDOMAINS[0], status: 'active' } }),
      prisma.tenant.create({ data: { name: 'Other Services Test', subdomain: TEST_SUBDOMAINS[1], status: 'active' } }),
      prisma.tenant.create({ data: { name: 'No Services Entitlement', subdomain: TEST_SUBDOMAINS[2], status: 'active' } }),
    ]);
    tenantId = tenant.id;
    otherTenantId = otherTenant.id;
    unentitledTenantId = unentitledTenant.id;

    await prisma.tenantModule.createMany({
      data: [
        { tenantId, moduleKey: MODULE_KEY, status: 'active', billingRule: 'included' },
        { tenantId: otherTenantId, moduleKey: MODULE_KEY, status: 'active', billingRule: 'included' },
      ],
    });

    const admin = await createUserWithRole(tenantId, 'admin@church-services.test', MODULE_PERMISSIONS);
    const viewer = await createUserWithRole(tenantId, 'viewer@church-services.test', ['church-services.read']);
    const otherAdmin = await createUserWithRole(otherTenantId, 'admin@church-services-other.test', MODULE_PERMISSIONS);
    const unentitledAdmin = await createUserWithRole(unentitledTenantId, 'admin@church-services-unentitled.test', MODULE_PERMISSIONS);
    adminToken = admin.token;
    viewerToken = viewer.token;
    otherAdminToken = otherAdmin.token;
    unentitledAdminToken = unentitledAdmin.token;
    adminUserId = admin.user.id;

    const [speaker, otherSpeaker, sermonMedia, audioMedia, livestream] = await Promise.all([
      prisma.speaker.create({ data: { tenantId, name: 'Pastor Grace', title: 'Lead Pastor' } }),
      prisma.speaker.create({ data: { tenantId: otherTenantId, name: 'Pastor Other', title: 'Guest Pastor' } }),
      prisma.mediaAsset.create({
        data: {
          tenantId,
          title: 'Sunday Sermon Video',
          type: 'video',
          providerType: 'platform_managed',
          sourceUrl: 'https://cdn.example.com/sermons/sunday.mp4',
          status: 'published',
        },
      }),
      prisma.mediaAsset.create({
        data: {
          tenantId,
          title: 'Sunday Sermon Audio',
          type: 'audio',
          providerType: 'platform_managed',
          sourceUrl: 'https://cdn.example.com/sermons/sunday.mp3',
          mimeType: 'audio/mpeg',
          status: 'published',
        },
      }),
      prisma.livestream.create({
        data: {
          tenantId,
          title: 'Sunday Live',
          status: 'ended',
          startedAt: new Date('2026-06-07T10:00:00Z'),
          endedAt: new Date('2026-06-07T12:00:00Z'),
        },
      }),
    ]);
    speakerId = speaker.id;
    otherSpeakerId = otherSpeaker.id;
    sermonMediaId = sermonMedia.id;
    audioMediaId = audioMedia.id;
    livestreamId = livestream.id;
  });

  afterAll(async () => {
    await cleanTestTenants();
    await prisma.$disconnect();
  });

  function authorized(token = adminToken, activeTenantId = tenantId) {
    const withHeaders = (testRequest: request.Test) =>
      testRequest.set('x-tenant-id', activeTenantId).set('Authorization', `Bearer ${token}`);

    return {
      get: (url: string) => withHeaders(request(app).get(url)),
      post: (url: string) => withHeaders(request(app).post(url)),
      put: (url: string) => withHeaders(request(app).put(url)),
      patch: (url: string) => withHeaders(request(app).patch(url)),
      delete: (url: string) => withHeaders(request(app).delete(url)),
    };
  }

  it('requires authentication before returning dashboard data', async () => {
    const res = await request(app).get('/api/church-services/overview').set('x-tenant-id', tenantId);

    expect(res.status).toBe(401);
  });

  it('blocks tenants that do not have the Church Services entitlement', async () => {
    const res = await authorized(unentitledAdminToken, unentitledTenantId).get('/api/church-services/overview');

    expect(res.status).toBe(403);
    expect(res.body.moduleKey).toBe(MODULE_KEY);
  });

  it('enforces module permissions for writes and reports', async () => {
    const createRes = await authorized(viewerToken)
      .post('/api/church-services')
      .send({
        title: 'Viewer Created Service',
        serviceType: 'sunday',
        serviceDate: '2026-06-07T10:00:00Z',
      });
    const reportsRes = await authorized(viewerToken).get('/api/church-services/reports');

    expect(createRes.status).toBe(403);
    expect(reportsRes.status).toBe(403);
  });

  it('normalizes settings and syncs the centralized module settings record', async () => {
    const defaultsRes = await authorized(viewerToken).get('/api/church-services/settings');
    expect(defaultsRes.status).toBe(200);
    expect(defaultsRes.body.data.moduleKey).toBe(MODULE_KEY);
    expect(JSON.parse(defaultsRes.body.data.configJson).enableSundayServices).toBe(true);

    const res = await authorized().patch('/api/church-services/settings').send({
      billingPlan: 'premium',
      providerMode: 'bring_your_own',
      configJson: {
        defaultVisibility: 'members_only',
        defaultLocationMode: 'online',
        recurringMaxBatchSize: 3,
        publishRequiresSpeaker: true,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.billingPlan).toBe('premium');
    expect(res.body.data.providerMode).toBe('bring_your_own');
    const config = JSON.parse(res.body.data.configJson);
    expect(config.defaultVisibility).toBe('members_only');
    expect(config.defaultLocationMode).toBe('online');
    expect(config.recurringMaxBatchSize).toBe(3);
    expect(config.publishRequiresSpeaker).toBe(true);

    const centralized = await prisma.moduleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY } },
    });
    expect(centralized).not.toBeNull();
    expect(JSON.parse(centralized!.settings).defaultVisibility).toBe('members_only');

    const activity = await prisma.churchServicesModuleActivity.findFirst({
      where: { tenantId, actionType: 'settings_updated' },
    });
    expect(activity).not.toBeNull();
    expect(activity!.userId).toBe(adminUserId);
  });

  it('creates, updates, and archives module profile records within the tenant', async () => {
    const createRes = await authorized()
      .post('/api/church-services/profiles')
      .send({
        title: 'Weekly Service Archive',
        description: 'Primary profile for weekly services.',
        visibility: 'private',
        settingsJson: { archivePage: '/watch' },
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.tenantId).toBe(tenantId);

    const profileId = createRes.body.data.id;
    const updateRes = await authorized()
      .patch(`/api/church-services/profiles/${profileId}`)
      .send({ title: 'Main Weekly Archive', status: 'active' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Main Weekly Archive');

    const deleteRes = await authorized().delete(`/api/church-services/profiles/${profileId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.status).toBe('archived');
  });

  it('creates service records with normalized fields, related media, and activity logging', async () => {
    const res = await authorized()
      .post('/api/church-services')
      .send({
        title: 'Sunday Morning Service - Walking in Faith',
        serviceType: 'Sunday Main',
        serviceDate: '2026-06-07T10:00:00Z',
        description: 'Regular Sunday worship service.',
        notes: 'Walking in faith together.',
        thumbnailUrl: 'https://cdn.example.com/thumbs/sunday.jpg',
        speakerId,
        sermonMediaId,
        serviceAudioId: audioMediaId,
        livestreamId,
        attendanceCount: '325',
        givingTotal: '8425.50',
        salvationCount: 4,
        status: 'published',
        settingsJson: { replayEnabled: true },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.serviceType).toBe('sunday');
    expect(res.body.data.visibility).toBe('members_only');
    expect(res.body.data.locationMode).toBe('online');
    expect(res.body.data.speaker.name).toBe('Pastor Grace');
    expect(res.body.data.sermonMedia.id).toBe(sermonMediaId);
    expect(res.body.data.serviceAudio.id).toBe(audioMediaId);
    expect(res.body.data.livestream.id).toBe(livestreamId);
    expect(res.body.data.createdById).toBe(adminUserId);
    sundayServiceId = res.body.data.id;

    const activity = await prisma.churchServicesModuleActivity.findFirst({
      where: { tenantId, actionType: 'service_created' },
      orderBy: { createdAt: 'desc' },
    });
    expect(activity).not.toBeNull();
    expect(JSON.parse(activity!.metadataJson).serviceId).toBe(sundayServiceId);
  });

  it('prevents cross-tenant relation assignment', async () => {
    const res = await authorized()
      .put(`/api/church-services/${sundayServiceId}`)
      .send({ speakerId: otherSpeakerId });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Speaker not found');
  });

  it('respects service-type feature settings', async () => {
    const disableRes = await authorized().patch('/api/church-services/settings').send({
      configJson: { enableMidweekServices: false },
    });
    expect(disableRes.status).toBe(200);

    const blockedRes = await authorized()
      .post('/api/church-services')
      .send({
        title: 'Blocked Midweek Service',
        serviceType: 'midweek',
        serviceDate: '2026-06-10T19:00:00Z',
        speakerId,
      });
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error).toContain('disabled');

    const enableRes = await authorized().patch('/api/church-services/settings').send({
      configJson: { enableMidweekServices: true },
    });
    expect(enableRes.status).toBe(200);
  });

  it('lists tenant-scoped records with filters, search, and sorting', async () => {
    const createRes = await authorized()
      .post('/api/church-services')
      .send({
        title: 'Wednesday Bible Study',
        serviceType: 'mid-week service',
        serviceDate: '2026-06-10T19:00:00Z',
        description: 'Midweek Bible study and prayer.',
        speakerId,
        status: 'scheduled',
      });
    expect(createRes.status).toBe(201);
    midweekServiceId = createRes.body.data.id;

    const typeRes = await authorized().get('/api/church-services?serviceType=sunday');
    const searchRes = await authorized().get('/api/church-services?search=Bible');
    const ascRes = await authorized().get('/api/church-services?sortOrder=asc');
    const dateRes = await authorized().get('/api/church-services?dateFrom=2026-06-07&dateTo=2026-06-07');

    expect(typeRes.status).toBe(200);
    expect(typeRes.body.data).toHaveLength(1);
    expect(typeRes.body.data[0].id).toBe(sundayServiceId);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data).toHaveLength(1);
    expect(searchRes.body.data[0].id).toBe(midweekServiceId);

    expect(ascRes.status).toBe(200);
    expect(ascRes.body.data[0].id).toBe(sundayServiceId);
    expect(dateRes.status).toBe(200);
    expect(dateRes.body.data).toHaveLength(1);
  });

  it('does not expose records across tenants', async () => {
    const res = await authorized(otherAdminToken, otherTenantId).get(`/api/church-services/${sundayServiceId}`);

    expect(res.status).toBe(404);
  });

  it('links scriptures and handouts after tenant-checking the parent service', async () => {
    const scriptureRes = await authorized()
      .post(`/api/church-services/${sundayServiceId}/scriptures`)
      .send({ references: [{ reference: 'Hebrews 11:1', order: 1 }, { reference: 'Romans 10:17', order: 2 }] });
    expect(scriptureRes.status).toBe(201);
    expect(scriptureRes.body.data).toHaveLength(2);

    const attachmentRes = await authorized()
      .post(`/api/church-services/${sundayServiceId}/attachments`)
      .send({
        title: 'Sermon Notes',
        fileUrl: 'https://cdn.example.com/notes/sunday.pdf',
        fileType: 'pdf',
      });
    expect(attachmentRes.status).toBe(201);

    const listScriptures = await authorized().get(`/api/church-services/${sundayServiceId}/scriptures`);
    const listAttachments = await authorized().get(`/api/church-services/${sundayServiceId}/attachments`);
    expect(listScriptures.body.data.map((item: any) => item.reference)).toEqual(['Hebrews 11:1', 'Romans 10:17']);
    expect(listAttachments.body.data[0].title).toBe('Sermon Notes');

    const otherTenantRes = await authorized(otherAdminToken, otherTenantId)
      .post(`/api/church-services/${sundayServiceId}/attachments`)
      .send({ title: 'Other Tenant Notes', fileUrl: 'https://cdn.example.com/notes/other.pdf' });
    expect(otherTenantRes.status).toBe(404);
  });

  it('generates recurring services within the configured batch limit', async () => {
    const res = await authorized()
      .post('/api/church-services/recurring')
      .send({
        serviceType: 'prayer',
        titleTemplate: 'Friday Prayer Service',
        dayOfWeek: 5,
        startDate: '2026-06-01T00:00:00Z',
        count: 2,
        frequency: 'weekly',
        speakerId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].status).toBe('draft');

    const tooManyRes = await authorized()
      .post('/api/church-services/recurring')
      .send({
        serviceType: 'prayer',
        titleTemplate: 'Too Many Prayer Services',
        dayOfWeek: 5,
        startDate: '2026-06-01T00:00:00Z',
        count: 4,
      });
    expect(tooManyRes.status).toBe(400);
    expect(tooManyRes.body.error).toContain('count must be between 1 and 3');
  });

  it('returns overview, report, template, and activity dashboard payloads', async () => {
    const [overviewRes, reportsRes, templatesRes, activityRes] = await Promise.all([
      authorized().get('/api/church-services/overview'),
      authorized().get('/api/church-services/reports'),
      authorized().get('/api/church-services/templates'),
      authorized().get('/api/church-services/activity'),
    ]);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.counts.services).toBeGreaterThanOrEqual(4);
    expect(overviewRes.body.data.totals.attendance).toBeGreaterThanOrEqual(325);

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body.data.summary.published).toBeGreaterThanOrEqual(1);
    expect(reportsRes.body.data.charts.serviceVolumeByMonth.length).toBeGreaterThan(0);

    expect(templatesRes.status).toBe(200);
    expect(templatesRes.body.data.serviceTypes.some((type: any) => type.key === 'sunday')).toBe(true);
    expect(templatesRes.body.data.integrations.speakers.length).toBeGreaterThan(0);

    expect(activityRes.status).toBe(200);
    expect(activityRes.body.data.some((item: any) => item.actionType === 'service_created')).toBe(true);
  });

  it('enforces publishing rules and records replay activity', async () => {
    const settingsRes = await authorized().patch('/api/church-services/settings').send({
      configJson: { publishRequiresMedia: true },
    });
    expect(settingsRes.status).toBe(200);

    const draftRes = await authorized()
      .post('/api/church-services')
      .send({
        title: 'Draft Service Without Media',
        serviceType: 'special',
        serviceDate: '2026-06-20T18:00:00Z',
        speakerId,
        status: 'draft',
      });
    expect(draftRes.status).toBe(201);
    draftServiceId = draftRes.body.data.id;

    const publishRes = await authorized().post(`/api/church-services/${draftServiceId}/publish`);
    expect(publishRes.status).toBe(403);
    expect(publishRes.body.error).toContain('sermon media asset or livestream');

    const replayRes = await authorized().post(`/api/church-services/${sundayServiceId}/replay`);
    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.replayAvailable).toBe(true);

    const event = await prisma.analyticsEvent.findFirst({
      where: { tenantId, category: 'church_services', name: 'replay_requested', entityId: sundayServiceId },
    });
    expect(event).not.toBeNull();
  });

  it('archives service records instead of hard deleting them', async () => {
    const res = await authorized().delete(`/api/church-services/${midweekServiceId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('archived');

    const stored = await prisma.churchService.findFirst({ where: { id: midweekServiceId, tenantId } });
    expect(stored).not.toBeNull();
    expect(stored!.status).toBe('archived');
  });
});
