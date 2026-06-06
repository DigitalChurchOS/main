import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Developer Marketplace Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.sandboxTenant.deleteMany({});
    await prisma.assetPurchase.deleteMany({});
    await prisma.assetFeedback.deleteMany({});
    await prisma.submissionReview.deleteMany({});
    await prisma.assetSubmission.deleteMany({});
    await prisma.marketplaceAsset.deleteMany({});
    await prisma.developerProfile.deleteMany({});
    await prisma.tenantPlugin.deleteMany({});
    await prisma.pluginDefinition.deleteMany({});
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
      data: { name: 'Marketplace Test Church', subdomain: 'market-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const requiredKeys = ['member.create', 'member.read', 'tenant.settings'];
    const permissions = [];
    for (const name of requiredKeys) {
      let p = await prisma.permission.findFirst({ where: { name } });
      if (!p) {
        p = await prisma.permission.create({ data: { name, description: name } });
      }
      permissions.push(p);
    }

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@market-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. DEVELOPER REGISTRATION
  // ─────────────────────────────────────────────────────────────
  describe('Developer Registration', () => {
    it('should successfully register a developer profile for the user', async () => {
      const res = await request(app)
        .post('/api/marketplace/developer/register')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyName: 'Acme Devs',
          website: 'https://acme.org',
          payoutEmail: 'payouts@acme.org',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.companyName).toBe('Acme Devs');
      expect(res.body.data.status).toBe('active');
    });

    it('should fail if user tries to register developer profile again', async () => {
      const res = await request(app)
        .post('/api/marketplace/developer/register')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyName: 'Duplicate Acme Devs',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Developer profile already exists');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SANDBOX PROVISIONING
  // ─────────────────────────────────────────────────────────────
  describe('Sandbox Provisioning', () => {
    it('should provision a sandbox tenant workspace for the developer', async () => {
      const res = await request(app)
        .post('/api/marketplace/developer/sandbox')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.tenant.subdomain).toContain('sandbox-dev-');
      expect(res.body.data.tenant.status).toBe('trialing');
      expect(res.body.data.sandbox.expiresAt).toBeDefined();

      const dbSandbox = await prisma.sandboxTenant.findUnique({
        where: { tenantId: res.body.data.tenant.id },
      });
      expect(dbSandbox).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ASSET SUBMISSION & REVIEW WORKFLOW (PLUGINS & THEMES)
  // ─────────────────────────────────────────────────────────────
  describe('Asset Submission & Review Workflow', () => {
    let pluginAssetId: string;
    let pluginSubmissionId: string;
    let themeAssetId: string;
    let themeSubmissionId: string;

    it('should allow developer to define a new draft plugin asset', async () => {
      const res = await request(app)
        .post('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'WhatsApp Notify Extra',
          description: 'Custom notifier integration',
          type: 'plugin',
          pricingType: 'paid',
          price: 15.0,
          assetConfig: {
            requiredPermissions: ['member.read'],
            requiredOsVersion: '1.0.0',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('WhatsApp Notify Extra');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.price).toBe(15.0);

      pluginAssetId = res.body.data.id;
    });

    it('should submit plugin version for review', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: '1.0.1',
          changelog: 'Initial release',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.version).toBe('1.0.1');

      pluginSubmissionId = res.body.data.id;

      const asset = await prisma.marketplaceAsset.findUnique({
        where: { id: pluginAssetId },
      });
      expect(asset?.status).toBe('under_review');
    });

    it('should allow admin to review and approve plugin submission, creating global PluginDefinition', async () => {
      const res = await request(app)
        .post(`/api/marketplace/submissions/${pluginSubmissionId}/review`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'approved',
          notes: 'Meets quality standards',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.decision).toBe('approved');

      // Verify asset updated to approved
      const asset = await prisma.marketplaceAsset.findUnique({
        where: { id: pluginAssetId },
      });
      expect(asset?.status).toBe('approved');
      expect(asset?.version).toBe('1.0.1');

      // Verify PluginDefinition upserted
      const definition = await prisma.pluginDefinition.findUnique({
        where: { id: pluginAssetId },
      });
      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('WhatsApp Notify Extra');
      expect(definition?.price).toBe(15.0);
    });

    it('should allow developer to define a new draft theme asset', async () => {
      const res = await request(app)
        .post('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Modern Grace Theme',
          description: 'A beautiful sleek dark theme template',
          type: 'theme',
          pricingType: 'paid',
          price: 9.99,
          assetConfig: {
            id: 'modern-grace-theme',
            name: 'Modern Grace Theme',
            version: '1.0.0',
            author: 'Acme Devs',
            description: 'A beautiful sleek dark theme template',
            archiveFile: 'modern-grace-theme.zip',
            themeCoverImage: 'screenshot.png',
            settingsSchema: {
              type: 'object',
              properties: {
                colors: { primary: '#1a1a1a', secondary: '#ffffff' },
                font: 'Outfit'
              }
            },
            templates: ['homepage', 'about'],
            sections: ['hero', 'footer'],
            font: 'Outfit'
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Modern Grace Theme');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.type).toBe('theme');
      expect(res.body.data.price).toBe(9.99);

      themeAssetId = res.body.data.id;
    });

    it('should submit theme version for review', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${themeAssetId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: '1.0.0',
          changelog: 'First theme layout version',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');

      themeSubmissionId = res.body.data.id;
    });

    it('should allow admin to approve theme submission, registering it as a global Theme template', async () => {
      const res = await request(app)
        .post(`/api/marketplace/submissions/${themeSubmissionId}/review`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'approved',
          notes: 'Theme layout approved',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.decision).toBe('approved');

      // Verify Theme upserted in global database (tenantId = null)
      const globalTheme = await prisma.theme.findUnique({
        where: { id: themeAssetId },
      });
      expect(globalTheme).not.toBeNull();
      expect(globalTheme?.tenantId).toBeNull();
      expect(globalTheme?.name).toBe('Modern Grace Theme');
      expect(JSON.parse(globalTheme?.settings || '{}').font).toBe('Outfit');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. STOREFRONT BROWSING
  // ─────────────────────────────────────────────────────────────
  describe('Storefront Listing', () => {
    it('should return approved assets in the marketplace browse feed', async () => {
      const res = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // WhatsApp Notify Extra + Modern Grace Theme
    });

    it('should return detailed info for a specific approved asset', async () => {
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const assetId = browse.body.data[0].id;

      const res = await request(app)
        .get(`/api/marketplace/assets/${assetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.averageRating).toBe(5); // default
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. PURCHASE & REVENUE SHARE CALCULATIONS (THEMES & PLUGINS)
  // ─────────────────────────────────────────────────────────────
  describe('Purchase & Revenue Split', () => {
    let pluginAssetId: string;
    let themeAssetId: string;

    beforeAll(async () => {
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const plugin = browse.body.data.find((a: any) => a.type === 'plugin');
      const theme = browse.body.data.find((a: any) => a.type === 'theme');
      pluginAssetId = plugin.id;
      themeAssetId = theme.id;
    });

    it('should successfully purchase plugin asset, calculating 70/30 developer/platform split', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.amountPaid).toBe(15.0);
      expect(res.body.data.developerShare).toBe(10.5); // 15 * 0.70
      expect(res.body.data.platformShare).toBe(4.5);   // 15 * 0.30

      // Verify auto-installed in TenantPlugin
      const installed = await prisma.tenantPlugin.findUnique({
        where: {
          tenantId_pluginId: { tenantId, pluginId: pluginAssetId },
        },
      });
      expect(installed).not.toBeNull();
      expect(installed?.status).toBe('pending');
    });

    it('should successfully purchase theme asset, generating a tenant-scoped copy', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${themeAssetId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.amountPaid).toBe(9.99);
      expect(res.body.data.developerShare).toBe(6.99); // 9.99 * 0.70 rounded
      expect(res.body.data.platformShare).toBe(3.00);  // 9.99 * 0.30 rounded

      // Verify tenant-scoped Theme record is created
      const tenantTheme = await prisma.theme.findFirst({
        where: { tenantId, name: 'Modern Grace Theme' },
      });
      expect(tenantTheme).not.toBeNull();
      expect(tenantTheme?.isCustom).toBe(true);
      expect(JSON.parse(tenantTheme?.settings || '{}').font).toBe('Outfit');
    });

    it('should reject purchase if asset was already purchased/installed', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already been purchased/installed');
    });

    it('should reflect total consolidated earnings inside the developer payouts report', async () => {
      const res = await request(app)
        .get('/api/marketplace/developer/payouts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSales).toBe(24.99); // 15.00 + 9.99
      expect(res.body.data.totalDeveloperShare).toBe(17.49); // 10.50 + 6.99
      expect(res.body.data.totalPlatformShare).toBe(7.50);   // 4.50 + 3.00
      expect(res.body.data.purchases.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. RATINGS & RATINGS FEEDBACK
  // ─────────────────────────────────────────────────────────────
  describe('Feedback & Ratings', () => {
    let pluginAssetId: string;

    beforeAll(async () => {
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const plugin = browse.body.data.find((a: any) => a.type === 'plugin');
      pluginAssetId = plugin.id;
    });

    it('should submit feedback rating successfully', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/feedback`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 4,
          comment: 'Works well but needs better layout.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe('Works well but needs better layout.');
    });

    it('should compute updated average rating in asset details', async () => {
      const res = await request(app)
        .get(`/api/marketplace/assets/${pluginAssetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.averageRating).toBe(4);
      expect(res.body.data.totalFeedback).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. RUNTIME ENGINE: INSTALL, UPDATE, DISABLE, ROLLBACK, UNINSTALL & ENFORCEMENT
  // ─────────────────────────────────────────────────────────────
  describe('Runtime Engine Operations & Security Enforcements', () => {
    let pluginAssetId: string;
    let version101Id: string;
    let version102Id: string;
    let themeAssetId: string;
    let themeVersionId: string;
    let otherTenantId: string;
    let otherAdminToken: string;

    beforeAll(async () => {
      // Find the assets we registered and approved in previous tests
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const plugin = browse.body.data.find((a: any) => a.type === 'plugin');
      const theme = browse.body.data.find((a: any) => a.type === 'theme');
      pluginAssetId = plugin.id;
      themeAssetId = theme.id;

      // Retrieve version IDs
      const pluginVersions = await prisma.marketplaceAssetVersion.findMany({
        where: { assetId: pluginAssetId },
      });
      const v101 = pluginVersions.find(v => v.version === '1.0.1');
      version101Id = v101!.id;

      const themeVersions = await prisma.marketplaceAssetVersion.findMany({
        where: { assetId: themeAssetId },
      });
      themeVersionId = themeVersions[0].id;

      // Setup other tenant for isolation checks
      const otherTenant = await prisma.tenant.create({
        data: { name: 'Other Isolation Church', subdomain: 'other-iso', status: 'active' },
      });
      otherTenantId = otherTenant.id;

      const otherPassHash = await bcrypt.hash('password123', 12);
      const otherAdminUser = await prisma.user.create({
        data: { tenantId: otherTenantId, email: 'admin@other-iso.com', passwordHash: otherPassHash },
      });

      const otherAdminRole = await prisma.role.create({
        data: { tenantId: otherTenantId, name: 'Admin', isCustom: false },
      });

      const permissions = await prisma.permission.findMany({
        where: { name: { in: ['member.create', 'member.read', 'tenant.settings'] } },
      });

      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: otherAdminRole.id, permissionId: p.id })),
      });

      await prisma.userRole.create({
        data: { userId: otherAdminUser.id, roleId: otherAdminRole.id },
      });

      otherAdminToken = jwt.sign(
        { userId: otherAdminUser.id, tenantId: otherTenantId, email: otherAdminUser.email },
        JWT_SECRET
      );
    });

    it('should successfully install the approved theme asset version', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${themeAssetId}/install`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ versionId: themeVersionId });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('active'); // themes start active because they don't require permissions

      const inst = await prisma.marketplaceInstallation.findUnique({
        where: { tenantId_assetId: { tenantId, assetId: themeAssetId } },
      });
      expect(inst).not.toBeNull();
      expect(inst?.status).toBe('active');
    });

    it('should successfully install the approved plugin version, starting as pending_permissions', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/install`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ versionId: version101Id });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending_permissions'); // starts pending because it requires member.read scope

      const inst = await prisma.marketplaceInstallation.findUnique({
        where: { tenantId_assetId: { tenantId, assetId: pluginAssetId } },
      });
      expect(inst).not.toBeNull();
      expect(inst?.status).toBe('pending_permissions');
    });

    it('should allow approving permissions to activate the plugin', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['member.read'] });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');

      const inst = await prisma.marketplaceInstallation.findUnique({
        where: { tenantId_assetId: { tenantId, assetId: pluginAssetId } },
      });
      expect(inst?.status).toBe('active');
      expect(JSON.parse(inst?.grantedPermissions || '[]')).toContain('member.read');
    });

    it('should block permissions activation if required permissions are omitted', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('All required permissions must be approved');
    });

    it('should allow disabling and enabling an installed plugin', async () => {
      // 1. Disable
      const resDisable = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/disable`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resDisable.status).toBe(200);
      expect(resDisable.body.data.status).toBe('disabled');

      // 2. Enable
      const resEnable = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/enable`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resEnable.status).toBe(200);
      expect(resEnable.body.data.status).toBe('active');
    });

    it('should enforce tenant isolation on asset operations', async () => {
      // Tenant Beta trying to disable Tenant Alpha\'s plugin should fail
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/disable`)
        .set('x-tenant-id', otherTenantId)
        .set('Authorization', `Bearer ${otherAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Asset is not installed');
    });

    it('should handle version upgrade, prompting for permission re-approval if new permissions are declared', async () => {
      // Update the asset configuration to include the new required permission before submission
      await prisma.marketplaceAsset.update({
        where: { id: pluginAssetId },
        data: {
          assetConfig: JSON.stringify({
            requiredPermissions: ['member.read', 'member.create'],
            requiredOsVersion: '1.0.0',
          }),
        },
      });

      // 1. Create a newer version of the plugin asset declaring a new permission scope (e.g. member.create)
      const submitRes = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: '1.0.2',
          changelog: 'Added new features requiring member.create scope',
        });
      
      const newSubmissionId = submitRes.body.data.id;

      // Approve version 1.0.2
      await request(app)
        .post(`/api/marketplace/submissions/${newSubmissionId}/review`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'approved', notes: 'Approved v1.0.2' });

      // Find the approved version 1.0.2 ID
      const versions = await prisma.marketplaceAssetVersion.findMany({
        where: { assetId: pluginAssetId },
      });
      const v102 = versions.find(v => v.version === '1.0.2');
      version102Id = v102!.id;

      // 2. Perform Upgrade
      const upgradeRes = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/update`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ versionId: version102Id });

      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.data.versionId).toBe(version102Id);
      expect(upgradeRes.body.data.status).toBe('pending_permissions'); // goes to pending because of new permission scope

      // 3. Approve new permissions set
      await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['member.read', 'member.create'] });
    });

    it('should successfully rollback to an older version', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/rollback`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ versionId: version101Id });

      expect(res.status).toBe(200);
      expect(res.body.data.versionId).toBe(version101Id);
      expect(res.body.data.status).toBe('active'); // rollbacks to previously approved are auto-active
    });

    it('should enforce security scans and block installs of suspended assets', async () => {
      // 1. Suspend the asset
      await prisma.marketplaceAsset.update({
        where: { id: pluginAssetId },
        data: { status: 'suspended' },
      });

      // 2. Try to install the suspended asset
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/install`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ versionId: version101Id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('suspended');

      // Unsuspend for clean teardown
      await prisma.marketplaceAsset.update({
        where: { id: pluginAssetId },
        data: { status: 'approved' },
      });
    });

    it('should record audit logs for critical operations', async () => {
      const logs = await prisma.marketplaceAuditLog.findMany({
        where: { tenantId, assetId: pluginAssetId },
        orderBy: { createdAt: 'desc' },
      });

      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.map(l => l.action)).toContain('install');
      expect(logs.map(l => l.action)).toContain('rollback');
    });

    it('should allow uninstalling installed assets', async () => {
      // Uninstall Theme
      const resTheme = await request(app)
        .post(`/api/marketplace/assets/${themeAssetId}/uninstall`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resTheme.status).toBe(200);

      // Uninstall Plugin
      const resPlugin = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/uninstall`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resPlugin.status).toBe(200);

      // Confirm deleted from DB
      const themeCount = await prisma.marketplaceInstallation.count({
        where: { tenantId, assetId: themeAssetId },
      });
      expect(themeCount).toBe(0);

      const pluginCount = await prisma.marketplaceInstallation.count({
        where: { tenantId, assetId: pluginAssetId },
      });
      expect(pluginCount).toBe(0);
    });
  });
});
