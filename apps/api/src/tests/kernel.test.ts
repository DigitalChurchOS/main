import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Security Kernel & Database Isolation', () => {
  let tenantAId: string;
  let tenantBId: string;

  let userAToken: string;
  let userBToken: string;

  let memberAId: string;

  beforeAll(async () => {
    // 1. Clean up database from prior test runs
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Re-seed permissions if missing
    const permissions = await prisma.permission.findMany();
    if (permissions.length === 0) {
      const PERMS = [
        { name: 'member.create' },
        { name: 'member.read' },
        { name: 'member.update' },
        { name: 'member.delete' },
      ];
      await prisma.permission.createMany({ data: PERMS });
    }

    // 3. Create Tenant A
    const tenantA = await prisma.tenant.create({
      data: { name: 'Grace Church', subdomain: 'grace' },
    });
    tenantAId = tenantA.id;

    // 4. Create Tenant B
    const tenantB = await prisma.tenant.create({
      data: { name: 'Hope Chapel', subdomain: 'hope' },
    });
    tenantBId = tenantB.id;

    // 5. Create Admin Role for Tenant A
    const adminRoleA = await prisma.role.create({
      data: { tenantId: tenantAId, name: 'Admin', isCustom: false },
    });
    const allPerms = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ roleId: adminRoleA.id, permissionId: p.id })),
    });

    // 6. Create User A (Admin of Tenant A)
    const passHash = await bcrypt.hash('password123', 12);
    const userA = await prisma.user.create({
      data: { tenantId: tenantAId, email: 'admin@grace.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: userA.id, roleId: adminRoleA.id },
    });

    // Generate token for User A
    userAToken = jwt.sign(
      { userId: userA.id, tenantId: tenantAId, email: userA.email },
      JWT_SECRET
    );

    // 7. Create User B (Regular user of Tenant B with NO permissions)
    const userB = await prisma.user.create({
      data: { tenantId: tenantBId, email: 'user@hope.com', passwordHash: passHash },
    });
    // User B has no roles, hence no permissions

    // Generate token for User B
    userBToken = jwt.sign(
      { userId: userB.id, tenantId: tenantBId, email: userB.email },
      JWT_SECRET
    );

    // 8. Create a Member profile in Tenant A
    const memberA = await prisma.member.create({
      data: {
        tenantId: tenantAId,
        firstName: 'John',
        lastName: 'Doe',
        membershipStatus: 'member',
      },
    });
    memberAId = memberA.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. TENANT HEADERS AND ISOLATION
  // ─────────────────────────────────────────────────────────────
  describe('Tenant Verification Middleware', () => {
    it('should reject requests missing x-tenant-id header', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing x-tenant-id');
    });

    it('should reject requests with non-existent tenant ID', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', 'invalid-uuid')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Tenant not found');
    });

    it('should block tokens belonging to a different tenant (tenant mismatch)', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantBId) // Asking for Tenant B data
        .set('Authorization', `Bearer ${userAToken}`); // But using Tenant A's token

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Token tenant mismatch');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. RBAC & PERMISSION CHECKING
  // ─────────────────────────────────────────────────────────────
  describe('Role-Based Access Control (RBAC)', () => {
    it('should block actions if user lacks appropriate permissions', async () => {
      // User B has no roles/permissions
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantBId)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Insufficient permissions');
      expect(res.body.missing).toContain('member.read');
    });

    it('should allow actions if user has required permissions', async () => {
      // User A is Admin of Tenant A, has member.read
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantAId)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].firstName).toBe('John');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. DATA ISOLATION (CROSS-TENANT ACCESS)
  // ─────────────────────────────────────────────────────────────
  describe('Database Tenant Isolation', () => {
    it('should hide Tenant A members from Tenant B requests', async () => {
      // We will temporarily grant user B the "member.read" permission by creating
      // a role for Tenant B, assigning it to User B, and linking the permission.
      const adminRoleB = await prisma.role.create({
        data: { tenantId: tenantBId, name: 'Admin', isCustom: false },
      });
      const readPerm = await prisma.permission.findUnique({ where: { name: 'member.read' } });
      await prisma.rolePermission.create({
        data: { roleId: adminRoleB.id, permissionId: readPerm!.id },
      });
      const user = await prisma.user.findFirst({ where: { tenantId: tenantBId } });
      await prisma.userRole.create({
        data: { userId: user!.id, roleId: adminRoleB.id },
      });

      // Now request Tenant B's members using Tenant B token. Should return empty array,
      // NOT John Doe (who is in Tenant A).
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantBId)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(0); // Cannot see Tenant A's member
    });

    it('should prevent retrieving or modifying Tenant A member using a Tenant B authenticated session', async () => {
      // Tenant B user tries to fetch Tenant A's member ID directly via GET /api/members/:id
      const res = await request(app)
        .get(`/api/members/${memberAId}`)
        .set('x-tenant-id', tenantBId)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404); // Returns 404 Member not found due to tenantId check
    });
  });
});
