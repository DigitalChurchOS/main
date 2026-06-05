import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 44: Dedicated White-Label Church App', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let appConfigId: string;
  let buildId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.whiteLabelBuild.deleteMany({});
    await prisma.whiteLabelApp.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace White-Label Church', subdomain: 'grace-wl', status: 'active' },
    });
    tenantId = tenant.id;

    // Permissions & Roles
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
    const readPerms = permissions.filter((p) => p.name === 'member.read');
    if (readPerms.length > 0) {
      await prisma.rolePermission.createMany({
        data: readPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
      });
    }

    const passHash = await bcrypt.hash('password123', 12);

    // Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace-wl.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET,
    );

    // Standard Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@grace-wl.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign(
      { userId: memberUser.id, tenantId, email: memberUser.email },
      JWT_SECRET,
    );
  });

  afterAll(async () => {
    await prisma.whiteLabelBuild.deleteMany({});
    await prisma.whiteLabelApp.deleteMany({});
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // APP CONFIGURATION
  // ═══════════════════════════════════════════════════════════

  describe('App Configuration', () => {
    it('should create white-label app config (admin)', async () => {
      const res = await request(app)
        .post('/api/whitelabel/config')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appName: 'Grace Church App',
          appDescription: 'Official Grace Church mobile application',
          primaryColor: '#4A90D9',
          accentColor: '#FF6B35',
          iosBundleId: 'com.gracechurch.app',
          androidPackageName: 'com.gracechurch.app',
          logoUrl: 'https://cdn.grace.church/logo.png',
          appIconUrl: 'https://cdn.grace.church/icon.png',
          splashScreenUrl: 'https://cdn.grace.church/splash.png',
        });

      expect(res.status).toBe(200);
      expect(res.body.appName).toBe('Grace Church App');
      expect(res.body.primaryColor).toBe('#4A90D9');
      expect(res.body.accentColor).toBe('#FF6B35');
      expect(res.body.iosBundleId).toBe('com.gracechurch.app');
      expect(res.body.logoUrl).toBe('https://cdn.grace.church/logo.png');
      appConfigId = res.body.id;
    });

    it('should update existing white-label app config (upsert)', async () => {
      const res = await request(app)
        .post('/api/whitelabel/config')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appName: 'Grace Church App V2',
          primaryColor: '#1E3A5F',
          pushCertificatesJson: JSON.stringify({ apns: 'cert_data_here', fcm: 'key_data_here' }),
        });

      expect(res.status).toBe(200);
      expect(res.body.appName).toBe('Grace Church App V2');
      expect(res.body.primaryColor).toBe('#1E3A5F');
      expect(res.body.id).toBe(appConfigId); // same record updated
    });

    it('should fetch white-label app config', async () => {
      const res = await request(app)
        .get('/api/whitelabel/config')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.appName).toBe('Grace Church App V2');
      expect(res.body.tenantId).toBe(tenantId);
    });

    it('should block standard members from configuring app', async () => {
      const res = await request(app)
        .post('/api/whitelabel/config')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ appName: 'Hacked App' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // BUILD PIPELINE
  // ═══════════════════════════════════════════════════════════

  describe('Build Pipeline', () => {
    it('should trigger a new build (queued)', async () => {
      const res = await request(app)
        .post('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appId: appConfigId,
          platform: 'android',
          version: '1.0.0',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('queued');
      expect(res.body.platform).toBe('android');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.buildNumber).toBe(1);
      expect(res.body.logs).toContain('Build queued');
      buildId = res.body.id;
    });

    it('should auto-increment build number', async () => {
      const res = await request(app)
        .post('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appId: appConfigId,
          platform: 'android',
          version: '1.0.1',
        });

      expect(res.status).toBe(201);
      expect(res.body.buildNumber).toBe(2);
    });

    it('should process build: queued → building', async () => {
      const res = await request(app)
        .post(`/api/whitelabel/builds/${buildId}/process`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('building');
      expect(res.body.logs).toContain('Compiling android bundle');
      expect(res.body.logs).toContain('Bundling JavaScript assets');
    });

    it('should process build: building → completed', async () => {
      const res = await request(app)
        .post(`/api/whitelabel/builds/${buildId}/process`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.downloadUrl).toContain('.apk');
      expect(res.body.completedAt).toBeTruthy();
      expect(res.body.logs).toContain('Build completed successfully');
    });

    it('should reject processing an already-completed build', async () => {
      const res = await request(app)
        .post(`/api/whitelabel/builds/${buildId}/process`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot process build');
    });

    it('should list build history', async () => {
      const res = await request(app)
        .get('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should trigger iOS build with separate numbering', async () => {
      const res = await request(app)
        .post('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appId: appConfigId,
          platform: 'ios',
          version: '1.0.0',
        });

      expect(res.status).toBe(201);
      expect(res.body.platform).toBe('ios');
      expect(res.body.buildNumber).toBe(1); // separate numbering per platform
    });

    it('should block standard members from triggering builds', async () => {
      const res = await request(app)
        .post('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          appId: appConfigId,
          platform: 'android',
          version: '1.0.0',
        });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // STORE SUBMISSION
  // ═══════════════════════════════════════════════════════════

  describe('Store Submission', () => {
    it('should submit completed build to app store', async () => {
      const res = await request(app)
        .post(`/api/whitelabel/builds/${buildId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          storeType: 'play_store',
          storeDetailsJson: JSON.stringify({
            title: 'Grace Church App',
            category: 'Lifestyle',
            shortDescription: 'Your church in your pocket',
          }),
        });

      expect(res.status).toBe(200);
      expect(res.body.storeType).toBe('play_store');
      expect(res.body.submittedAt).toBeTruthy();
      expect(res.body.logs).toContain('Submitted to play_store');
    });

    it('should reject submitting a non-completed build', async () => {
      // Trigger a fresh build (queued)
      const triggerRes = await request(app)
        .post('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appId: appConfigId,
          platform: 'android',
          version: '2.0.0',
        });

      const queuedBuildId = triggerRes.body.id;

      const res = await request(app)
        .post(`/api/whitelabel/builds/${queuedBuildId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ storeType: 'app_store' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Only completed builds');
    });

    it('should block standard members from store submission', async () => {
      const res = await request(app)
        .post(`/api/whitelabel/builds/${buildId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ storeType: 'app_store' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // FULL BUILD LIFECYCLE (iOS end-to-end)
  // ═══════════════════════════════════════════════════════════

  describe('Full Build Lifecycle (iOS)', () => {
    let iosBuildId: string;

    it('should run complete iOS build pipeline: queue → build → complete → submit', async () => {
      // 1. Trigger
      const triggerRes = await request(app)
        .post('/api/whitelabel/builds')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ appId: appConfigId, platform: 'ios', version: '2.0.0' });
      expect(triggerRes.status).toBe(201);
      expect(triggerRes.body.status).toBe('queued');
      iosBuildId = triggerRes.body.id;

      // 2. Process: queued → building
      const buildRes = await request(app)
        .post(`/api/whitelabel/builds/${iosBuildId}/process`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(buildRes.status).toBe(200);
      expect(buildRes.body.status).toBe('building');

      // 3. Process: building → completed
      const completeRes = await request(app)
        .post(`/api/whitelabel/builds/${iosBuildId}/process`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.status).toBe('completed');
      expect(completeRes.body.downloadUrl).toContain('.ipa');

      // 4. Submit to App Store
      const submitRes = await request(app)
        .post(`/api/whitelabel/builds/${iosBuildId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          storeType: 'app_store',
          storeDetailsJson: JSON.stringify({
            title: 'Grace Church',
            category: 'Lifestyle',
          }),
        });
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.storeType).toBe('app_store');
      expect(submitRes.body.submittedAt).toBeTruthy();
    });
  });
});
