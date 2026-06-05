import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 45: Multi-Branch / Multi-Campus Management', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;
  let regionNAId: string;
  let regionEUId: string;
  let branchDowntownId: string;
  let branchUptownId: string;
  let branchLondonId: string;
  let leaderId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.branchLeader.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.branchRegion.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Global Ministry HQ', subdomain: 'global-hq', status: 'active' },
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
      data: { tenantId, email: 'admin@global-hq.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET,
    );

    // Standard Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@global-hq.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign(
      { userId: memberUser.id, tenantId, email: memberUser.email },
      JWT_SECRET,
    );
  });

  afterAll(async () => {
    await prisma.branchLeader.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.branchRegion.deleteMany({});
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // REGIONAL GROUPING
  // ═══════════════════════════════════════════════════════════

  describe('Regional Grouping', () => {
    it('should allow admin to create a region', async () => {
      const res = await request(app)
        .post('/api/branches/regions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'North America', description: 'US and Canada branches' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('North America');
      expect(res.body.data.description).toBe('US and Canada branches');
      regionNAId = res.body.data.id;
    });

    it('should create a second region', async () => {
      const res = await request(app)
        .post('/api/branches/regions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Europe', description: 'European branches' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Europe');
      regionEUId = res.body.data.id;
    });

    it('should reject region creation without a name', async () => {
      const res = await request(app)
        .post('/api/branches/regions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should list regions with branch counts', async () => {
      const res = await request(app)
        .get('/api/branches/regions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].branches).toBeDefined();
    });

    it('should block standard members from creating regions', async () => {
      const res = await request(app)
        .post('/api/branches/regions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Asia Pacific' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // BRANCH / CAMPUS CRUD
  // ═══════════════════════════════════════════════════════════

  describe('Branch & Campus Profiles', () => {
    it('should create a downtown branch with full campus profile', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Downtown Campus',
          timezone: 'America/New_York',
          description: 'Main headquarters campus in downtown Manhattan',
          address: '123 Broadway',
          city: 'New York',
          state: 'NY',
          country: 'US',
          postalCode: '10001',
          phone: '+1-212-555-0100',
          email: 'downtown@global-hq.com',
          logoUrl: 'https://cdn.global-hq.com/downtown-logo.png',
          regionId: regionNAId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Downtown Campus');
      expect(res.body.data.city).toBe('New York');
      expect(res.body.data.country).toBe('US');
      expect(res.body.data.region.name).toBe('North America');
      branchDowntownId = res.body.data.id;
    });

    it('should create an uptown branch in the same region', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Uptown Campus',
          city: 'New York',
          state: 'NY',
          country: 'US',
          regionId: regionNAId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Uptown Campus');
      branchUptownId = res.body.data.id;
    });

    it('should create a London branch in the Europe region', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'London Campus',
          timezone: 'Europe/London',
          city: 'London',
          country: 'GB',
          regionId: regionEUId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.region.name).toBe('Europe');
      branchLondonId = res.body.data.id;
    });

    it('should reject branch creation without a name', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ city: 'Los Angeles' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should list all branches with member counts and leaders', async () => {
      const res = await request(app)
        .get('/api/branches')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0]._count).toBeDefined();
      expect(res.body.data[0]._count.members).toBeDefined();
    });

    it('should filter branches by region', async () => {
      const res = await request(app)
        .get(`/api/branches?regionId=${regionEUId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('London Campus');
    });

    it('should get branch detail', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchDowntownId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Downtown Campus');
      expect(res.body.data.address).toBe('123 Broadway');
      expect(res.body.data.region.name).toBe('North America');
    });

    it('should update branch profile', async () => {
      const res = await request(app)
        .put(`/api/branches/${branchDowntownId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Flagship campus, recently renovated',
          coverImageUrl: 'https://cdn.global-hq.com/downtown-cover.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Flagship campus, recently renovated');
      expect(res.body.data.coverImageUrl).toBe('https://cdn.global-hq.com/downtown-cover.jpg');
    });

    it('should return 404 for non-existent branch', async () => {
      const res = await request(app)
        .get('/api/branches/00000000-0000-0000-0000-000000000000')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should block standard members from creating branches', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Unauthorized Branch' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // BRANCH LEADERSHIP ASSIGNMENTS
  // ═══════════════════════════════════════════════════════════

  describe('Branch Leadership', () => {
    it('should assign a user as branch pastor', async () => {
      const res = await request(app)
        .post(`/api/branches/${branchDowntownId}/leaders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberUserId, role: 'branch_pastor' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('branch_pastor');
      expect(res.body.data.user.email).toBe('member@global-hq.com');
      expect(res.body.data.branch.name).toBe('Downtown Campus');
      leaderId = res.body.data.id;
    });

    it('should update the role on re-assignment (same user + branch)', async () => {
      const res = await request(app)
        .post(`/api/branches/${branchDowntownId}/leaders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberUserId, role: 'branch_admin' });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('branch_admin');
      // Same record updated, not a new one
      expect(res.body.data.id).toBe(leaderId);
    });

    it('should reject invalid leader role', async () => {
      const res = await request(app)
        .post(`/api/branches/${branchDowntownId}/leaders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: memberUserId, role: 'supreme_leader' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid role');
    });

    it('should require userId and role for leader assignment', async () => {
      const res = await request(app)
        .post(`/api/branches/${branchDowntownId}/leaders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should show branch leaders when getting branch detail', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchDowntownId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.branchLeaders.length).toBe(1);
      expect(res.body.data.branchLeaders[0].role).toBe('branch_admin');
    });

    it('should remove a branch leader', async () => {
      const res = await request(app)
        .delete(`/api/branches/leaders/${leaderId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('should return 404 when removing non-existent leader', async () => {
      const res = await request(app)
        .delete('/api/branches/leaders/00000000-0000-0000-0000-000000000000')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // BRANCH-SCOPED MEMBERS
  // ═══════════════════════════════════════════════════════════

  describe('Branch-Scoped Member Queries', () => {
    let memberAId: string;
    let memberBId: string;
    let memberCId: string;

    beforeAll(async () => {
      // Create members assigned to different branches
      const memberA = await prisma.member.create({
        data: {
          tenantId,
          firstName: 'Alice',
          lastName: 'Downtown',
          email: 'alice@global-hq.com',
          branchId: branchDowntownId,
        },
      });
      memberAId = memberA.id;

      const memberB = await prisma.member.create({
        data: {
          tenantId,
          firstName: 'Bob',
          lastName: 'Downtown',
          email: 'bob@global-hq.com',
          branchId: branchDowntownId,
        },
      });
      memberBId = memberB.id;

      const memberC = await prisma.member.create({
        data: {
          tenantId,
          firstName: 'Charlie',
          lastName: 'London',
          email: 'charlie@global-hq.com',
          branchId: branchLondonId,
        },
      });
      memberCId = memberC.id;

      // Unassigned member (no branch)
      await prisma.member.create({
        data: {
          tenantId,
          firstName: 'Dana',
          lastName: 'Unassigned',
          email: 'dana@global-hq.com',
        },
      });

      // Create some donations for analytics
      const givingCategory = await prisma.givingCategory.create({
        data: { tenantId, name: 'Tithe' },
      });

      await prisma.donation.createMany({
        data: [
          { tenantId, donorEmail: 'alice@global-hq.com', categoryId: givingCategory.id, amount: 500, currency: 'USD', paymentMethod: 'card', status: 'succeeded' },
          { tenantId, donorEmail: 'bob@global-hq.com', categoryId: givingCategory.id, amount: 300, currency: 'USD', paymentMethod: 'card', status: 'succeeded' },
          { tenantId, donorEmail: 'charlie@global-hq.com', categoryId: givingCategory.id, amount: 200, currency: 'USD', paymentMethod: 'card', status: 'succeeded' },
        ],
      });
    });

    it('should list only Downtown branch members', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchDowntownId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      const names = res.body.data.map((m: any) => m.firstName);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
      expect(names).not.toContain('Charlie');
      expect(names).not.toContain('Dana');
    });

    it('should list only London branch members', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchLondonId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].firstName).toBe('Charlie');
    });

    it('should return empty for branch with no members', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchUptownId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // BRANCH-LEVEL ANALYTICS
  // ═══════════════════════════════════════════════════════════

  describe('Branch Analytics', () => {
    it('should return analytics for Downtown branch', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchDowntownId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.branchName).toBe('Downtown Campus');
      expect(res.body.data.memberCount).toBe(2);
      expect(res.body.data.totalGiving).toBe(800); // 500 + 300
    });

    it('should return analytics for London branch', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchLondonId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.memberCount).toBe(1);
      expect(res.body.data.totalGiving).toBe(200);
    });

    it('should block standard members from viewing analytics', async () => {
      const res = await request(app)
        .get(`/api/branches/${branchDowntownId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CENTRAL ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════

  describe('Central Admin Dashboard', () => {
    it('should return aggregated cross-branch metrics', async () => {
      const res = await request(app)
        .get('/api/branches/dashboard')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const dashboard = res.body.data;
      expect(dashboard.totalBranches).toBe(3);
      expect(dashboard.totalMembers).toBe(4); // 2 downtown + 1 london + 1 unassigned
      expect(dashboard.unassignedMembers).toBe(1); // Dana
      expect(dashboard.totalGiving).toBe(1000); // 500 + 300 + 200
      expect(dashboard.branches.length).toBe(3);

      // Check branch breakdown
      const downtown = dashboard.branches.find((b: any) => b.name === 'Downtown Campus');
      expect(downtown.memberCount).toBe(2);
      expect(downtown.region).toBe('North America');

      const london = dashboard.branches.find((b: any) => b.name === 'London Campus');
      expect(london.memberCount).toBe(1);
      expect(london.region).toBe('Europe');
    });

    it('should block standard members from accessing the dashboard', async () => {
      const res = await request(app)
        .get('/api/branches/dashboard')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });
});
