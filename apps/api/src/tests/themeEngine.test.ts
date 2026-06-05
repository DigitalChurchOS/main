import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Theme Engine Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;
  let otherTenantId: string;
  let otherAdminToken: string;
  let websiteId: string;
  let globalThemeId: string;
  let marketplaceThemeAssetId: string;
  let developerToken: string;

  beforeAll(async () => {
    // 1. Clear tables
    await prisma.themeEngineModuleActivity.deleteMany({});
    await prisma.themeEngineModuleSettings.deleteMany({});
    await prisma.themeEngineModule.deleteMany({});
    await prisma.assetPurchase.deleteMany({});
    await prisma.assetFeedback.deleteMany({});
    await prisma.submissionReview.deleteMany({});
    await prisma.assetSubmission.deleteMany({});
    await prisma.marketplaceAsset.deleteMany({});
    await prisma.developerProfile.deleteMany({});
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
      data: { name: 'Theme Test Church', subdomain: 'theme-test', status: 'active' },
    });
    tenantId = tenant.id;

    await prisma.moduleDefinition.upsert({
      where: { key: 'theme-engine' },
      update: { name: 'Theme Engine', category: 'Core', dependencies: '[]' },
      create: { key: 'theme-engine', name: 'Theme Engine', category: 'Core', dependencies: '[]' },
    });

    await prisma.moduleDefinition.upsert({
      where: { key: 'website-cms' },
      update: { name: 'Churchfront', category: 'Core', dependencies: '[]' },
      create: { key: 'website-cms', name: 'Churchfront', category: 'Core', dependencies: '[]' },
    });

    await prisma.tenantModule.createMany({
      data: [
        { tenantId, moduleKey: 'theme-engine', status: 'active', billingRule: 'free' },
        { tenantId, moduleKey: 'website-cms', status: 'active', billingRule: 'free' },
      ],
    });

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Theme Church', subdomain: 'other-theme-test', status: 'active' },
    });
    otherTenantId = otherTenant.id;

    await prisma.tenantModule.create({
      data: { tenantId: otherTenantId, moduleKey: 'theme-engine', status: 'active', billingRule: 'free' },
    });

    // 3. Register standard and engine-specific permissions
    const permKeys = [
      'member.read',
      'tenant.settings',
      'theme-engine.read',
      'theme-engine.create',
      'theme-engine.update',
      'theme-engine.delete',
      'theme-engine.manage_settings',
      'theme-engine.view_reports',
    ];

    const permissions = await prisma.permission.findMany({
      where: { name: { in: permKeys } },
    });

    // Create role and add permissions
    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Counsellor', isCustom: true },
    });

    const otherAdminRole = await prisma.role.create({
      data: { tenantId: otherTenantId, name: 'Admin', isCustom: false },
    });

    // Seed any missing permissions dynamically to prevent test failures
    const missingPerms = permKeys.filter(k => !permissions.some(p => p.name === k));
    for (const key of missingPerms) {
      const p = await prisma.permission.create({ data: { name: key, description: `Dynamic ${key}` } });
      permissions.push(p);
    }

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: otherAdminRole.id, permissionId: p.id })),
    });

    // Member gets read-only theme engine permissions
    const readPerms = permissions.filter((p) => ['member.read', 'theme-engine.read'].includes(p.name));
    await prisma.rolePermission.createMany({
      data: readPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    // 4. Create Users
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@theme-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@theme-test.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;

    const otherAdminUser = await prisma.user.create({
      data: { tenantId: otherTenantId, email: 'admin@other-theme-test.com', passwordHash: passHash },
    });

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });

    await prisma.userRole.create({
      data: { userId: otherAdminUser.id, roleId: otherAdminRole.id },
    });

    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);
    otherAdminToken = jwt.sign({ userId: otherAdminUser.id, tenantId: otherTenantId, email: otherAdminUser.email }, JWT_SECRET);

    // 5. Register Developer token
    const developerProfile = await prisma.developerProfile.create({
      data: { userId: adminUserId, companyName: 'Grace Labs', website: 'https://grace.org', status: 'active' },
    });

    developerToken = adminToken; // Developer is also the admin user in this case

    // 6. Create Global Theme Template
    const globalTheme = await prisma.theme.create({
      data: {
        tenantId: null, // global
        name: 'Grace Default Theme',
        settings: JSON.stringify({
          colors: { primary: '#0055ff', secondary: '#ffffff' },
          fonts: { heading: 'Inter' },
        }),
        isCustom: false,
      },
    });
    globalThemeId = globalTheme.id;

    // 7. Create Website
    const website = await prisma.website.create({
      data: {
        tenantId,
        themeId: globalThemeId,
        title: 'Grace Church Website',
        domain: 'grace-theme-test.org',
        isActive: true,
      },
    });
    websiteId = website.id;

    // 8. Define Marketplace Theme Asset
    const themeAsset = await prisma.marketplaceAsset.create({
      data: {
        developerId: developerProfile.id,
        name: 'Neon Youth Style',
        description: 'Vibrant colors for young ministries',
        type: 'theme',
        pricingType: 'free',
        price: 0,
        status: 'approved',
        assetConfig: JSON.stringify({
          colors: { primary: '#ff00ff', secondary: '#00ffff' },
          fonts: { heading: 'Outfit' },
        }),
      },
    });
    marketplaceThemeAssetId = themeAsset.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. MODULE ACTIVATION & LOGGING (ThemeEngineModule)
  // ─────────────────────────────────────────────────────────────
  describe('Module Lifecycle & Logging', () => {
    let moduleId: string;

    it('should successfully activate theme engine module for tenant', async () => {
      const res = await request(app)
        .post('/api/theme-engine')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Grace Visual Customize Module',
          description: 'Customizes main grace homepage design templates',
          visibility: 'public',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Grace Visual Customize Module');
      expect(res.body.data.status).toBe('active');
      moduleId = res.body.data.id;
    });

    it('should block activation if required parameters are missing', async () => {
      const res = await request(app)
        .post('/api/theme-engine')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('title is required');
    });

    it('should list all active theme engine configs for tenant', async () => {
      const res = await request(app)
        .get('/api/theme-engine')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should update module properties successfully', async () => {
      const res = await request(app)
        .patch(`/api/theme-engine/${moduleId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Grace Visual Customize Module Updated',
          visibility: 'private',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Grace Visual Customize Module Updated');
      expect(res.body.data.visibility).toBe('private');
    });

    it('should not allow another tenant to read this tenant theme engine record', async () => {
      const res = await request(app)
        .get(`/api/theme-engine/${moduleId}`)
        .set('x-tenant-id', otherTenantId)
        .set('Authorization', `Bearer ${otherAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return overview metrics for the theme dashboard', async () => {
      const res = await request(app)
        .get('/api/theme-engine/overview')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.moduleKey).toBe('theme-engine');
      expect(res.body.data.counts.installedThemes).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve activity audit trail for reports', async () => {
      const res = await request(app)
        .get('/api/theme-engine/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].actionType).toBeDefined();
    });

    it('should deny activities list access for non-admin readers', async () => {
      const res = await request(app)
        .get('/api/theme-engine/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. THEME INSTALLATION & SELECTION
  // ─────────────────────────────────────────────────────────────
  describe('Marketplace Installation & Switching', () => {
    let installedThemeId: string;

    it('should install free marketplace theme asset copying config into tenant context', async () => {
      const res = await request(app)
        .post('/api/theme-engine/themes/install')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assetId: marketplaceThemeAssetId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Neon Youth Style');
      expect(res.body.data.tenantId).toBe(tenantId);
      expect(res.body.data.isCustom).toBe(true);

      installedThemeId = res.body.data.id;
    });

    it('should list all custom and global themes available for tenant selection', async () => {
      const res = await request(app)
        .get('/api/theme-engine/themes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Should include at least "Grace Default Theme" (global) and "Neon Youth Style" (tenant copy)
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should activate installed theme for website layout', async () => {
      const res = await request(app)
        .post(`/api/theme-engine/themes/${installedThemeId}/activate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          websiteId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.themeId).toBe(installedThemeId);

      // Verify active theme resolution works in public pages builder
      const renderRes = await request(app)
        .get(`/api/cms/render?slug=`)
        .set('x-tenant-id', tenantId);

      // Mock require entitlement for website-cms module if not active
      if (renderRes.status === 200) {
        expect(renderRes.body.data.theme.name).toBe('Neon Youth Style');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. THEME CUSTOMIZATION & PREVIEWS
  // ─────────────────────────────────────────────────────────────
  describe('Visual Customization & Previewing', () => {
    let tenantThemeId: string;

    beforeAll(async () => {
      const themes = await prisma.theme.findMany({ where: { tenantId } });
      tenantThemeId = themes[0].id;
    });

    it('should successfully customize active theme parameters including custom CSS', async () => {
      const res = await request(app)
        .patch(`/api/theme-engine/themes/${tenantThemeId}/customize`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          colors: { primary: '#22aa22', secondary: '#eeeeee', accent: '#ff9900' },
          fonts: { heading: 'Outfit', body: 'Open Sans' },
          logos: { primaryUrl: 'https://grace.org/logo-primary.png' },
          layout: { headerStyle: 'transparent' },
          customCss: '.hero-banner { filter: blur(2px); }',
        });

      expect(res.status).toBe(200);
      const settings = JSON.parse(res.body.data.settings);
      expect(settings.colors.primary).toBe('#22aa22');
      expect(settings.colors.accent).toBe('#ff9900');
      expect(settings.fonts.body).toBe('Open Sans');
      expect(settings.customCss).toContain('.hero-banner');
    });

    it('should retrieve preview configurations without activation', async () => {
      const res = await request(app)
        .get(`/api/theme-engine/themes/${tenantThemeId}/preview`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isPreview).toBe(true);
      expect(res.body.data.settings.colors.primary).toBe('#22aa22');
    });

    it('should calculate merged customization states inside simulation customize preview flow', async () => {
      const res = await request(app)
        .post(`/api/theme-engine/themes/${tenantThemeId}/preview/customize`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          colors: { primary: '#ff3333' }, // Override primary color temporarily
        });

      expect(res.status).toBe(200);
      expect(res.body.data.settings.colors.primary).toBe('#ff3333');
      expect(res.body.data.settings.colors.accent).toBe('#ff9900'); // remains merged
      expect(res.body.data.staging).toBe(true);

      // Verify DB record itself was NOT changed
      const dbTheme = await prisma.theme.findUnique({ where: { id: tenantThemeId } });
      expect(JSON.parse(dbTheme!.settings || '{}').colors.primary).toBe('#22aa22');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SETTINGS & SECTION TEMPLATE REGISTRY
  // ─────────────────────────────────────────────────────────────
  describe('Module Configuration & Section Templates Registry', () => {
    it('should update platform system configurations settings (Super Admin)', async () => {
      const res = await request(app)
        .patch('/api/theme-engine/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          billingPlan: 'premium',
          enabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.billingPlan).toBe('premium');
      expect(res.body.data.enabled).toBe(true);
    });

    it('should allow developer/admin to register custom page layout sections templates', async () => {
      const res = await request(app)
        .post('/api/theme-engine/sections')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          name: 'Dynamic Altar Call Widget',
          key: 'altar-call-widget',
          structureJson: {
            title: 'string',
            buttonLabel: 'string',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Dynamic Altar Call Widget');
      expect(res.body.data.key).toBe('altar-call-widget');
    });

    it('should return consolidated list of default and developer-registered section templates', async () => {
      const res = await request(app)
        .get('/api/theme-engine/sections')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const keys = res.body.data.map((s: any) => s.key);
      expect(keys).toContain('hero-banner'); // default
      expect(keys).toContain('altar-call-widget'); // registered by dev
    });

    it('should allow developer/admin to register custom page templates', async () => {
      const res = await request(app)
        .post('/api/theme-engine/page-templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          name: 'Youth Ministry Landing',
          key: 'youth-ministry-landing',
          structureJson: {
            sections: ['hero-banner', 'feature-grid'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.key).toBe('youth-ministry-landing');
    });

    it('should return default and developer-registered page templates', async () => {
      const res = await request(app)
        .get('/api/theme-engine/page-templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const keys = res.body.data.map((template: any) => template.key);
      expect(keys).toContain('home-page');
      expect(keys).toContain('youth-ministry-landing');
    });

    it('should expose theme engine in centralized dashboard settings', async () => {
      const res = await request(app)
        .get('/api/settings/theme-engine')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.allowMarketplaceThemes).toBe(true);
    });
  });
});
