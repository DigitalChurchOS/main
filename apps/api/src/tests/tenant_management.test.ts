import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Domain & Tenant Management Module', () => {
  let tenantId: string;
  let adminToken: string;
  let websiteId: string;

  beforeAll(async () => {
    // 1. Clean up database tables
    await prisma.moduleSettings.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Fellowship', subdomain: 'grace-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const settingsPermission = await prisma.permission.findUnique({ where: { name: 'tenant.settings' } });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    if (settingsPermission) {
      await prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: settingsPermission.id }
      });
    }

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Theme & primary Website
    const theme = await prisma.theme.create({
      data: { name: 'Minimal Swatch Theme', settings: '{}', isCustom: true, tenantId }
    });
    const website = await prisma.website.create({
      data: { tenantId, themeId: theme.id, title: 'Grace Website', isActive: true }
    });
    websiteId = website.id;

    // 6. Ensure at least one module definition exists in the database
    await prisma.moduleDefinition.upsert({
      where: { key: 'website-cms' },
      update: {},
      create: { key: 'website-cms', name: 'Website CMS', category: 'Core', dependencies: '[]' }
    });
    await prisma.moduleDefinition.upsert({
      where: { key: 'giving-donations' },
      update: {},
      create: { key: 'giving-donations', name: 'Tithes & Offerings', category: 'Finance', dependencies: '[]' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/tenant/branding', () => {
    it('should retrieve tenant details and default branding settings', async () => {
      const res = await request(app)
        .get('/api/tenant/branding')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.tenant.name).toBe('Grace Fellowship');
      expect(res.body.data.tenant.subdomain).toBe('grace-test');
      expect(res.body.data.branding.timezone).toBe('UTC');
      expect(res.body.data.branding.accent).toBe('#4f46e5');
    });
  });

  describe('PATCH /api/tenant/branding', () => {
    it('should update the church tenant name and customized branding presets', async () => {
      const res = await request(app)
        .patch('/api/tenant/branding')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Grace Fellowship Global',
          accent: '#0f766e',
          timezone: 'Africa/Lagos',
          logo: 'https://example.com/mock-logo.png'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Grace Fellowship Global');
      expect(res.body.data.branding.accent).toBe('#0f766e');
      expect(res.body.data.branding.timezone).toBe('Africa/Lagos');
      expect(res.body.data.branding.logo).toBe('https://example.com/mock-logo.png');

      // Verify db persistence
      const updatedTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(updatedTenant?.name).toBe('Grace Fellowship Global');

      const brandingRec = await prisma.moduleSettings.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'domain-tenant-management' } }
      });
      const parsed = JSON.parse(brandingRec!.settings);
      expect(parsed.accent).toBe('#0f766e');
      expect(parsed.timezone).toBe('Africa/Lagos');
    });
  });

  describe('GET /api/tenant/domain', () => {
    it('should retrieve domain mapping details', async () => {
      const res = await request(app)
        .get('/api/tenant/domain')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.subdomain).toBe('grace-test');
      expect(res.body.data.customDomain).toBeNull();
      expect(res.body.data.dnsStatus.verified).toBe(false);
    });
  });

  describe('PATCH /api/tenant/domain', () => {
    it('should update custom domain on both Tenant and Website records', async () => {
      const res = await request(app)
        .patch('/api/tenant/domain')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customDomain: 'graceglobal.org' });

      expect(res.status).toBe(200);
      expect(res.body.data.customDomain).toBe('graceglobal.org');

      // Verify db Tenant
      const dbTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(dbTenant?.customDomain).toBe('graceglobal.org');

      // Verify db Website
      const dbWebsite = await prisma.website.findUnique({ where: { id: websiteId } });
      expect(dbWebsite?.domain).toBe('graceglobal.org');
    });

    it('should reject a custom domain if it is already registered to another tenant', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: { name: 'Other Church', subdomain: 'other-church', customDomain: 'alreadyused.org' }
      });

      const res = await request(app)
        .patch('/api/tenant/domain')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customDomain: 'alreadyused.org' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('POST /api/tenant/domain/verify', () => {
    it('should return simulated verification check results', async () => {
      const res = await request(app)
        .post('/api/tenant/domain/verify')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.verified).toBe(true);
      expect(res.body.data.sslStatus).toBe('active');
    });
  });

  describe('GET /api/tenant/modules', () => {
    it('should return all module definitions and their activation status', async () => {
      const res = await request(app)
        .get('/api/tenant/modules')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      
      const cms = res.body.data.find((m: any) => m.key === 'website-cms');
      expect(cms).toBeDefined();
      expect(cms.status).toBe('inactive');
    });
  });

  describe('PATCH /api/tenant/modules/:moduleKey', () => {
    it('should toggle and activate modules in the TenantModule table', async () => {
      // 1. Activate website-cms
      const res1 = await request(app)
        .patch('/api/tenant/modules/website-cms')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res1.status).toBe(200);
      expect(res1.body.data.status).toBe('active');

      const tm = await prisma.tenantModule.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } }
      });
      expect(tm).toBeDefined();
      expect(tm?.status).toBe('active');

      // 2. Suspend website-cms
      const res2 = await request(app)
        .patch('/api/tenant/modules/website-cms')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.status).toBe('suspended');

      const tm2 = await prisma.tenantModule.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } }
      });
      expect(tm2?.status).toBe('suspended');
    });
  });

  describe('GET /api/tenant/checklist', () => {
    it('should calculate launching readiness checklist variables', async () => {
      // Reactivate website-cms to active
      await prisma.tenantModule.update({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
        data: { status: 'active' }
      });

      // Make sure giving-donations is active
      await prisma.tenantModule.create({
        data: { tenantId, moduleKey: 'giving-donations', status: 'active' }
      });

      const res = await request(app)
        .get('/api/tenant/checklist')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.domainSetup).toBe(true);      // Mapped graceglobal.org earlier
      expect(res.body.data.brandingSetup).toBe(true);    // Configured logo earlier
      expect(res.body.data.moduleRegistry).toBe(true);   // active count > 1 (giving-donations + suspended cms)
      expect(res.body.data.inviteTeam).toBe(false);      // no team invites
    });
  });
});
