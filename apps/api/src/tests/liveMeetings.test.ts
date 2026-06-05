process.env.JWT_SECRET = process.env.JWT_SECRET || 'live-meetings-test-secret';

import request from 'supertest';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = require('../app').default;
const JWT_SECRET = process.env.JWT_SECRET!;
const MODULE_KEY = 'live-meetings';

const TEST_SUBDOMAINS = [
  'live-meetings-test',
  'live-meetings-other-test',
  'live-meetings-preview-test',
];

const MODULE_PERMISSIONS = [
  'live-meetings.read',
  'live-meetings.create',
  'live-meetings.update',
  'live-meetings.delete',
  'live-meetings.manage_settings',
  'live-meetings.view_reports',
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
    update: { name: 'Live Meetings', category: 'Connect', dependencies: '["media","worship"]' },
    create: { key: MODULE_KEY, name: 'Live Meetings', category: 'Connect', dependencies: '["media","worship"]' },
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
  const user = await prisma.user.create({ data: { tenantId, email, passwordHash } });
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

  const member = await prisma.member.create({
    data: {
      tenantId,
      userId: user.id,
      firstName: email.split('@')[0],
      lastName: 'Tester',
      email,
      membershipStatus: 'leader',
    },
  });

  return {
    user,
    member,
    token: jwt.sign({ userId: user.id, tenantId, email: user.email }, JWT_SECRET),
  };
}

describe('Live Meetings module', () => {
  let tenantId: string;
  let otherTenantId: string;
  let previewTenantId: string;
  let adminToken: string;
  let viewerToken: string;
  let otherAdminToken: string;
  let previewAdminToken: string;
  let hostMemberId: string;
  let previewHostMemberId: string;
  let meetingId: string;
  let previewMeetingId: string;
  let participantId: string;
  let worshipSessionId: string;
  let reminderId: string;

  beforeAll(async () => {
    await cleanTestTenants();
    await ensurePlatformRecords();

    const [tenant, otherTenant, previewTenant] = await Promise.all([
      prisma.tenant.create({ data: { name: 'Live Meetings Test', subdomain: TEST_SUBDOMAINS[0], status: 'active' } }),
      prisma.tenant.create({ data: { name: 'Other Meetings Test', subdomain: TEST_SUBDOMAINS[1], status: 'active' } }),
      prisma.tenant.create({ data: { name: 'Preview Only Meetings Test', subdomain: TEST_SUBDOMAINS[2], status: 'active' } }),
    ]);
    tenantId = tenant.id;
    otherTenantId = otherTenant.id;
    previewTenantId = previewTenant.id;

    await prisma.tenantModule.createMany({
      data: [
        {
          tenantId,
          moduleKey: MODULE_KEY,
          status: 'active',
          billingRule: 'plan_included',
          usageLimits: JSON.stringify({ participantLimit: 20, publicHostingEnabled: true }),
        },
        {
          tenantId: otherTenantId,
          moduleKey: MODULE_KEY,
          status: 'active',
          billingRule: 'plan_included',
          usageLimits: JSON.stringify({ participantLimit: 20, publicHostingEnabled: true }),
        },
      ],
    });

    const admin = await createUserWithRole(tenantId, 'admin@live-meetings.test', MODULE_PERMISSIONS);
    const viewer = await createUserWithRole(tenantId, 'viewer@live-meetings.test', ['live-meetings.read']);
    const otherAdmin = await createUserWithRole(otherTenantId, 'admin@live-meetings-other.test', MODULE_PERMISSIONS);
    const previewAdmin = await createUserWithRole(previewTenantId, 'admin@live-meetings-preview.test', MODULE_PERMISSIONS);
    adminToken = admin.token;
    viewerToken = viewer.token;
    otherAdminToken = otherAdmin.token;
    previewAdminToken = previewAdmin.token;
    hostMemberId = admin.member.id;
    previewHostMemberId = previewAdmin.member.id;

    const song = await prisma.worshipSong.create({
      data: { tenantId, title: 'Amazing Grace', lyrics: 'Amazing grace, how sweet the sound.' },
    });
    const session = await prisma.worshipSession.create({
      data: { tenantId, name: 'Midweek Worship', currentSongId: song.id, status: 'active' },
    });
    worshipSessionId = session.id;
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
      patch: (url: string) => withHeaders(request(app).patch(url)),
      put: (url: string) => withHeaders(request(app).put(url)),
      delete: (url: string) => withHeaders(request(app).delete(url)),
    };
  }

  it('requires authentication for dashboard overview data', async () => {
    const res = await request(app).get('/api/live-meetings/overview').set('x-tenant-id', tenantId);

    expect(res.status).toBe(401);
  });

  it('allows dashboard preview even when the tenant is not publicly entitled', async () => {
    const res = await authorized(previewAdminToken, previewTenantId).get('/api/live-meetings/overview');

    expect(res.status).toBe(200);
    expect(res.body.data.publicAccess.previewOnly).toBe(true);
  });

  it('enforces Live Meetings permissions for writes and reports', async () => {
    const createRes = await authorized(viewerToken).post('/api/live-meetings').send({
      hostMemberId,
      title: 'Viewer Created Meeting',
      scheduledStart: '2026-06-02T19:00:00Z',
    });
    const reportsRes = await authorized(viewerToken).get('/api/live-meetings/reports');

    expect(createRes.status).toBe(403);
    expect(reportsRes.status).toBe(403);
  });

  it('normalizes settings and syncs the module settings record', async () => {
    const defaultsRes = await authorized(viewerToken).get('/api/live-meetings/settings');
    expect(defaultsRes.status).toBe(200);
    expect(defaultsRes.body.data.moduleKey).toBe(MODULE_KEY);

    const res = await authorized().patch('/api/live-meetings/settings').send({
      billingPlan: 'premium',
      providerMode: 'hybrid',
      configJson: {
        defaultProvider: 'jitsi',
        participantLimit: 25,
        enableWaitingRoom: true,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.billingPlan).toBe('premium');
    expect(JSON.parse(res.body.data.configJson).defaultProvider).toBe('jitsi');

    const central = await prisma.moduleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY } },
    });
    expect(central).toBeDefined();
  });

  it('creates a scheduled meeting with waiting room and reports it in overview', async () => {
    const res = await authorized().post('/api/live-meetings').send({
      hostMemberId,
      title: 'Tuesday Midweek Bible Study',
      description: 'Deep study of the epistles.',
      meetingType: 'video',
      provider: 'native',
      scheduledStart: '2026-06-02T19:00:00Z',
      scheduledEnd: '2026-06-02T20:30:00Z',
      enableWaitingRoom: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.meetingUrl).toContain('meet.churchos.org');
    expect(res.body.data.status).toBe('scheduled');
    meetingId = res.body.data.id;

    const overview = await authorized().get('/api/live-meetings/overview');
    expect(overview.status).toBe(200);
    expect(overview.body.data.counts.totalMeetings).toBe(1);
  });

  it('keeps meeting data isolated by tenant', async () => {
    const res = await authorized(otherAdminToken, otherTenantId).get(`/api/live-meetings/${meetingId}`);

    expect(res.status).toBe(404);
  });

  it('blocks public join for unpaid preview tenants until Super Admin enables access', async () => {
    const createRes = await authorized(previewAdminToken, previewTenantId).post('/api/live-meetings').send({
      hostMemberId: previewHostMemberId,
      title: 'Preview Tenant Prayer Room',
      scheduledStart: '2026-06-03T19:00:00Z',
      enableWaitingRoom: true,
    });
    expect(createRes.status).toBe(201);
    previewMeetingId = createRes.body.data.id;

    const blockedJoin = await request(app)
      .post(`/api/live-meetings/${previewMeetingId}/join`)
      .set('x-tenant-id', previewTenantId)
      .send({ firstName: 'Preview', lastName: 'Guest', email: 'preview@guest.test' });
    expect(blockedJoin.status).toBe(403);

    const enabled = await authorized().patch(`/api/live-meetings/platform/tenants/${previewTenantId}`).send({
      status: 'active',
      billingRule: 'plan_included',
      usageLimits: { participantLimit: 10, publicHostingEnabled: true },
    });
    expect(enabled.status).toBe(200);

    const allowedJoin = await request(app)
      .post(`/api/live-meetings/${previewMeetingId}/join`)
      .set('x-tenant-id', previewTenantId)
      .send({ firstName: 'Preview', lastName: 'Guest', email: 'preview@guest.test' });
    expect(allowedJoin.status).toBe(201);
  });

  it('starts the meeting and exposes member-facing meeting context', async () => {
    const startRes = await authorized().post(`/api/live-meetings/${meetingId}/start`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('live');

    const publicRes = await request(app)
      .get(`/api/live-meetings/public/${meetingId}`)
      .set('x-tenant-id', tenantId);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.status).toBe('live');
    expect(publicRes.body.data.meetingUrl).toContain('meet.churchos.org');
  });

  it('supports waiting room, co-host promotion, and room lock controls', async () => {
    const joinRes = await request(app)
      .post(`/api/live-meetings/${meetingId}/join`)
      .set('x-tenant-id', tenantId)
      .send({ firstName: 'Alice', lastName: 'Guest', email: 'alice@guest.test' });

    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.joinStatus).toBe('in_waiting_room');
    participantId = joinRes.body.data.id;

    const approveRes = await authorized()
      .patch(`/api/live-meetings/${meetingId}/participants/${participantId}/status`)
      .send({ status: 'approved' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.joinStatus).toBe('approved');

    const roleRes = await authorized()
      .patch(`/api/live-meetings/${meetingId}/participants/${participantId}/role`)
      .send({ role: 'co_host' });
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.role).toBe('co_host');

    const lockRes = await authorized().post(`/api/live-meetings/${meetingId}/lock`).send({ isLocked: true });
    expect(lockRes.status).toBe(200);
    expect(lockRes.body.data.isLocked).toBe(true);

    const blockedJoin = await request(app)
      .post(`/api/live-meetings/${meetingId}/join`)
      .set('x-tenant-id', tenantId)
      .send({ firstName: 'Late', lastName: 'Guest', email: 'late@guest.test' });
    expect(blockedJoin.status).toBe(400);
    expect(blockedJoin.body.error).toContain('locked');

    await authorized().post(`/api/live-meetings/${meetingId}/lock`).send({ isLocked: false });
  });

  it('supports chat, worship integration, attendance logs, reminders, and recording archive', async () => {
    const chatRes = await authorized(viewerToken)
      .post(`/api/live-meetings/${meetingId}/chat`)
      .send({ senderName: 'Alice Guest', senderEmail: 'alice@guest.test', message: 'Hello everyone!' });
    expect(chatRes.status).toBe(201);

    const worshipRes = await authorized()
      .post(`/api/live-meetings/${meetingId}/worship`)
      .send({ worshipSessionId });
    expect(worshipRes.status).toBe(200);
    expect(worshipRes.body.data.activeWorshipSessionId).toBe(worshipSessionId);

    const joinLogRes = await request(app)
      .post(`/api/live-meetings/${meetingId}/join-log`)
      .set('x-tenant-id', tenantId)
      .send({ email: 'alice@guest.test' });
    expect(joinLogRes.status).toBe(201);

    const leaveLogRes = await request(app)
      .post(`/api/live-meetings/${meetingId}/leave-log`)
      .set('x-tenant-id', tenantId)
      .send({ email: 'alice@guest.test' });
    expect(leaveLogRes.status).toBe(200);
    expect(leaveLogRes.body.data.durationMinutes).toBeGreaterThanOrEqual(1);

    const reminderRes = await authorized()
      .post(`/api/live-meetings/${meetingId}/reminders`)
      .send({ sendBeforeMinutes: 10 });
    expect(reminderRes.status).toBe(201);
    reminderId = reminderRes.body.data.id;

    const triggerRes = await authorized().post(`/api/live-meetings/reminders/${reminderId}/trigger`);
    expect(triggerRes.status).toBe(200);
    expect(triggerRes.body.data.status).toBe('sent');

    const recUrl = 'https://cdn.example.com/meetings/bible-study-rec.mp4';
    const endRes = await authorized()
      .post(`/api/live-meetings/${meetingId}/end`)
      .send({ recordingUrl: recUrl });
    expect(endRes.status).toBe(200);
    expect(endRes.body.data.status).toBe('ended');

    const asset = await prisma.mediaAsset.findFirst({ where: { tenantId, sourceUrl: recUrl } });
    expect(asset).toBeDefined();
    expect(asset!.title).toBe('Recording: Tuesday Midweek Bible Study');
  });

  it('returns reports, activity, and platform tenant usage', async () => {
    const reports = await authorized().get('/api/live-meetings/reports');
    expect(reports.status).toBe(200);
    expect(reports.body.data.providers.length).toBeGreaterThanOrEqual(1);

    const activity = await authorized().get('/api/live-meetings/activity');
    expect(activity.status).toBe(200);
    expect(activity.body.data.some((item: any) => item.actionType === 'meeting_create')).toBe(true);

    const platform = await authorized().get('/api/live-meetings/platform/tenants');
    expect(platform.status).toBe(200);
    expect(platform.body.data.some((tenant: any) => tenant.id === tenantId && tenant.meetingCount >= 1)).toBe(true);
  });

  it('supports the legacy /api/meetings mount for existing meeting links', async () => {
    const res = await authorized().get('/api/meetings');

    expect(res.status).toBe(200);
    expect(res.body.data.some((meeting: any) => meeting.id === meetingId)).toBe(true);
  });
});
