import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module: Centralized Settings Engine', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let adminToken1: string;
  let staffToken1: string;
  let adminToken2: string;

  beforeAll(async () => {
    // ── Clean up related tables ──────────────────────────────
    await prisma.centralizedSettingsEngineModuleActivity.deleteMany({});
    await prisma.centralizedSettingsEngineModule.deleteMany({});
    await prisma.centralizedSettingsEngineModuleSettings.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Create Tenants ───────────────────────────────────────
    const tenant1 = await prisma.tenant.create({
      data: { name: 'First Baptist Church', subdomain: 'baptist-church', status: 'active' },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: { name: 'Grace Community Church', subdomain: 'grace-church', status: 'active' },
    });
    tenant2Id = tenant2.id;

    // ── Set up Permissions ─────────────────────────
    const readPermission = await prisma.permission.upsert({
      where: { name: 'centralized-settings-engine.read' },
      update: {},
      create: { name: 'centralized-settings-engine.read', description: 'Read settings profiles' }
    });

    const createPermission = await prisma.permission.upsert({
      where: { name: 'centralized-settings-engine.create' },
      update: {},
      create: { name: 'centralized-settings-engine.create', description: 'Create settings profiles' }
    });

    const updatePermission = await prisma.permission.upsert({
      where: { name: 'centralized-settings-engine.update' },
      update: {},
      create: { name: 'centralized-settings-engine.update', description: 'Update settings profiles' }
    });

    const deletePermission = await prisma.permission.upsert({
      where: { name: 'centralized-settings-engine.delete' },
      update: {},
      create: { name: 'centralized-settings-engine.delete', description: 'Delete settings profiles' }
    });

    const reportsPermission = await prisma.permission.upsert({
      where: { name: 'centralized-settings-engine.view_reports' },
      update: {},
      create: { name: 'centralized-settings-engine.view_reports', description: 'View settings engine reports' }
    });

    // ── Tenant 1 Roles ──
    const adminRole1 = await prisma.role.create({ data: { tenantId: tenant1Id, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: [
        { roleId: adminRole1.id, permissionId: readPermission.id },
        { roleId: adminRole1.id, permissionId: createPermission.id },
        { roleId: adminRole1.id, permissionId: updatePermission.id },
        { roleId: adminRole1.id, permissionId: deletePermission.id },
        { roleId: adminRole1.id, permissionId: reportsPermission.id }
      ]
    });

    const staffRole1 = await prisma.role.create({ data: { tenantId: tenant1Id, name: 'Staff', isCustom: false } });
    await prisma.rolePermission.create({
      data: { roleId: staffRole1.id, permissionId: readPermission.id }
    });

    // ── Tenant 2 Roles ──
    const adminRole2 = await prisma.role.create({ data: { tenantId: tenant2Id, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: [
        { roleId: adminRole2.id, permissionId: readPermission.id },
        { roleId: adminRole2.id, permissionId: createPermission.id },
        { roleId: adminRole2.id, permissionId: updatePermission.id },
        { roleId: adminRole2.id, permissionId: deletePermission.id }
      ]
    });

    // ── Create Users & Tokens ──────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    
    // User 1: Tenant 1 Admin
    const adminUser1 = await prisma.user.create({
      data: { tenantId: tenant1Id, email: 'admin1@baptist.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: adminUser1.id, roleId: adminRole1.id } });
    adminToken1 = jwt.sign({ userId: adminUser1.id, tenantId: tenant1Id, email: adminUser1.email }, JWT_SECRET);

    // User 2: Tenant 1 Staff
    const staffUser1 = await prisma.user.create({
      data: { tenantId: tenant1Id, email: 'staff1@baptist.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: staffUser1.id, roleId: staffRole1.id } });
    staffToken1 = jwt.sign({ userId: staffUser1.id, tenantId: tenant1Id, email: staffUser1.email }, JWT_SECRET);

    // User 3: Tenant 2 Admin
    const adminUser2 = await prisma.user.create({
      data: { tenantId: tenant2Id, email: 'admin2@grace.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: adminUser2.id, roleId: adminRole2.id } });
    adminToken2 = jwt.sign({ userId: adminUser2.id, tenantId: tenant2Id, email: adminUser2.email }, JWT_SECRET);
  });

  describe('CRUD Operations on Settings Profiles', () => {
    let profileId: string;

    it('should allow Admin to create a new settings profile', async () => {
      const res = await request(app)
        .post('/api/centralized-settings-engine')
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${adminToken1}`)
        .send({
          title: 'Baptist General Settings Preset',
          description: 'Production layout configuration rules',
          settingsJson: { cellSizeLimit: 30, autoNamingRuleEnabled: false },
          visibility: 'private'
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Baptist General Settings Preset');
      profileId = res.body.data.id;

      // Verify activity logs created
      const logs = await prisma.centralizedSettingsEngineModuleActivity.findMany({
        where: { tenantId: tenant1Id, actionType: 'profile_create' }
      });
      expect(logs.length).toBe(1);
    });

    it('should allow Staff to read settings profiles', async () => {
      const res = await request(app)
        .get('/api/centralized-settings-engine')
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${staffToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(profileId);
    });

    it('should reject profile creations by staff lacking create permission', async () => {
      const res = await request(app)
        .post('/api/centralized-settings-engine')
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${staffToken1}`)
        .send({
          title: 'Staff Profile'
        });

      expect(res.status).toBe(403);
    });

    it('should allow fetching a single settings profile by ID', async () => {
      const res = await request(app)
        .get(`/api/centralized-settings-engine/${profileId}`)
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${staffToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Baptist General Settings Preset');
    });

    it('should allow Admin to update settings profiles', async () => {
      const res = await request(app)
        .patch(`/api/centralized-settings-engine/${profileId}`)
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${adminToken1}`)
        .send({
          title: 'Updated Preset Title',
          description: 'Updated description'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Preset Title');

      // Verify in DB
      const dbProfile = await prisma.centralizedSettingsEngineModule.findUnique({
        where: { id: profileId }
      });
      expect(dbProfile!.title).toBe('Updated Preset Title');
    });

    it('should allow Admin to retrieve activity logs reports', async () => {
      const res = await request(app)
        .get('/api/centralized-settings-engine/logs')
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${adminToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow Admin to delete settings profiles', async () => {
      const res = await request(app)
        .delete(`/api/centralized-settings-engine/${profileId}`)
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${adminToken1}`);

      expect(res.status).toBe(200);

      // Verify deletion in DB
      const dbProfile = await prisma.centralizedSettingsEngineModule.findUnique({
        where: { id: profileId }
      });
      expect(dbProfile).toBeNull();
    });
  });

  describe('Multi-Tenant Isolation Safeguards', () => {
    it('should isolate settings profiles and prevent Tenant 2 from reading Tenant 1 resources', async () => {
      // 1. Tenant 1 Admin creates profile
      const createRes = await request(app)
        .post('/api/centralized-settings-engine')
        .set('x-tenant-id', tenant1Id)
        .set('Authorization', `Bearer ${adminToken1}`)
        .send({
          title: 'Private Tenant 1 Profile'
        });
      const t1ProfileId = createRes.body.data.id;

      // 2. Tenant 2 Admin tries to fetch Tenant 1 profile by ID
      const fetchRes = await request(app)
        .get(`/api/centralized-settings-engine/${t1ProfileId}`)
        .set('x-tenant-id', tenant2Id)
        .set('Authorization', `Bearer ${adminToken2}`);

      expect(fetchRes.status).toBe(404); // Scoped isolation returns 404/not found

      // 3. Tenant 2 Admin tries to update Tenant 1 profile by ID
      const updateRes = await request(app)
        .patch(`/api/centralized-settings-engine/${t1ProfileId}`)
        .set('x-tenant-id', tenant2Id)
        .set('Authorization', `Bearer ${adminToken2}`)
        .send({
          title: 'Hacked Title'
        });

      expect(updateRes.status).toBe(404);

      // 4. Tenant 2 Admin tries to delete Tenant 1 profile by ID
      const deleteRes = await request(app)
        .delete(`/api/centralized-settings-engine/${t1ProfileId}`)
        .set('x-tenant-id', tenant2Id)
        .set('Authorization', `Bearer ${adminToken2}`);

      expect(deleteRes.status).toBe(404);
    });
  });
});
