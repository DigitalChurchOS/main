import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('DigitalChurchOS Member Management Module (Module 25)', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;

  let member1Id: string; // Alice Smith (member, tag: Choir, volunteer)
  let member2Id: string; // Bob Smith (visitor, tag: Choir)
  let member3Id: string; // Charlie Brown (leader)
  
  let choirTagId: string;
  let volunteerTagId: string;

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.memberNote.deleteMany({});
    await prisma.memberCheckIn.deleteMany({});
    await prisma.memberTagAssignment.deleteMany({});
    await prisma.memberTag.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.partnership.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Setup permissions if they do not exist
    const requiredPerms = [
      'member.create',
      'member.read',
      'member.update',
      'member.delete',
      'tenant.settings',
    ];

    for (const name of requiredPerms) {
      await prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // 3. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Member Test Church', subdomain: 'member-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 4. Seed subscription plan & active subscription to bypass active_members limit check
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise Plan',
        basePrice: 50.0,
        includedMembers: 1000,
        includedSms: 1000,
        includedStorageGb: 100.0,
        memberOverageRate: 0.5,
        smsOverageRate: 0.05,
        storageOverageRate: 0.5,
      },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // 5. Setup permissions & roles
    const adminPermissions = await prisma.permission.findMany({
      where: { name: { in: requiredPerms } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.createMany({
      data: adminPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });
    // Member only gets 'member.read'
    const readPermission = await prisma.permission.findFirst({
      where: { name: 'member.read' },
    });
    await prisma.rolePermission.create({
      data: { roleId: memberRole.id, permissionId: readPermission!.id },
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 6. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@member-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 7. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@member-test.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. MEMBER CREATION & BASE PROFILE CONTROLS
  // ─────────────────────────────────────────────────────────────
  describe('Member Creation & Profile Management', () => {
    it('should allow admin to create a member profile', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Alice',
          lastName: 'Smith',
          phone: '1234567890',
          email: 'alice@example.com',
          photoUrl: 'https://example.com/alice.jpg',
          gender: 'female',
          birthday: '1995-04-12',
          address: '123 Grace Street',
          emergencyContact: { name: 'Emergency Contact', phone: '911' },
          membershipStatus: 'member',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.firstName).toBe('Alice');
      expect(res.body.data.lastName).toBe('Smith');
      expect(res.body.data.membershipStatus).toBe('member');
      expect(res.body.data.email).toBe('alice@example.com');
      
      member1Id = res.body.data.id;
    });

    it('should block regular members from creating a member profile', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          firstName: 'Unauthorized',
          lastName: 'User',
        });

      expect(res.status).toBe(403);
    });

    it('should fail member creation if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'MissingLastName',
        });

      expect(res.status).toBe(400);
    });

    it('should seed additional members for search and filters tests', async () => {
      const m2 = await prisma.member.create({
        data: {
          tenantId,
          firstName: 'Bob',
          lastName: 'Smith',
          phone: '2345678901',
          email: 'bob@example.com',
          membershipStatus: 'visitor',
        },
      });
      member2Id = m2.id;

      const m3 = await prisma.member.create({
        data: {
          tenantId,
          firstName: 'Charlie',
          lastName: 'Brown',
          phone: '3456789012',
          email: 'charlie@example.com',
          membershipStatus: 'leader',
        },
      });
      member3Id = m3.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. TAG MANAGEMENT (CRUD & ASSIGNMENTS)
  // ─────────────────────────────────────────────────────────────
  describe('Custom Member Tags & Assignments', () => {
    it('should allow admin to create a member tag', async () => {
      const res = await request(app)
        .post('/api/members/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Choir' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('choir'); // lowercase trim check
      choirTagId = res.body.data.id;
    });

    it('should block regular members (without tenant.settings) from creating tags', async () => {
      const res = await request(app)
        .post('/api/members/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Volunteer' });

      expect(res.status).toBe(403);
    });

    it('should allow admin to assign a tag to a member', async () => {
      const res = await request(app)
        .post(`/api/members/${member1Id}/tags/${choirTagId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.tagId).toBe(choirTagId);
      expect(res.body.data.tag.name).toBe('choir');
    });

    it('should allow assigning another tag and multiple tags to members', async () => {
      // Upsert Volunteer tag as admin
      const tagRes = await request(app)
        .post('/api/members/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Volunteer ' }); // testing trim

      expect(tagRes.status).toBe(201);
      expect(tagRes.body.data.name).toBe('volunteer');
      volunteerTagId = tagRes.body.data.id;

      // Assign Choir and Volunteer to Alice (member1)
      await request(app)
        .post(`/api/members/${member1Id}/tags/${volunteerTagId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assign Choir to Bob (member2)
      await request(app)
        .post(`/api/members/${member2Id}/tags/${choirTagId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ADVANCED DIRECTORIES SEARCH & FILTERS
  // ─────────────────────────────────────────────────────────────
  describe('Advanced Directories Search & Filtration', () => {
    it('should filter members by status', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'member' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(member1Id);
    });

    it('should search members casing-insensitively by keyword (first/last/phone/email)', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: ' sMiTh ' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      const names = res.body.data.map((m: any) => m.firstName);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
    });

    it('should filter members by assigned tags', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ tagName: ' Choir' }); // testing lowercase/trim

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      const names = res.body.data.map((m: any) => m.firstName);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
    });

    it('should search with multiple filters (tag + keyword + status)', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ tagName: 'choir', search: 'alice', status: 'member' });

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(member1Id);
    });

    it('should support pagination (page, limit)', async () => {
      const res = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.count).toBe(3); // Total members in tenant is 3
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. PASTORAL & COUNSELING NOTES
  // ─────────────────────────────────────────────────────────────
  describe('Pastoral & Counseling Notes CRUD', () => {
    it('should allow admin to create pastoral counseling note', async () => {
      const res = await request(app)
        .post(`/api/members/${member1Id}/notes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          noteText: 'Had a counseling session today regarding bereavement.',
          category: 'counseling',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.noteText).toBe('Had a counseling session today regarding bereavement.');
      expect(res.body.data.category).toBe('counseling');
      expect(res.body.data.author.id).toBe(adminUserId);
    });

    it('should block regular members (who lack member.update) from creating counseling notes', async () => {
      const res = await request(app)
        .post(`/api/members/${member1Id}/notes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          noteText: 'Unauthorized notes attempt',
        });

      expect(res.status).toBe(403);
    });

    it('should list chronological notes for admin', async () => {
      // Create a second note to test order
      await prisma.memberNote.create({
        data: {
          tenantId,
          memberId: member1Id,
          authorId: adminUserId,
          noteText: 'Visitations checkup.',
          category: 'visitation',
        },
      });

      const res = await request(app)
        .get(`/api/members/${member1Id}/notes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].category).toBe('visitation'); // order desc by createdAt
    });

    it('should block non-authorized users from viewing counseling notes', async () => {
      // Wait, memberToken user has 'member.read', which router allows.
      // But if we use a user without 'member.read' permission, they are blocked.
      const noPermToken = jwt.sign({ userId: 'random', tenantId, email: 'no-perm@test.com' }, JWT_SECRET);
      const res = await request(app)
        .get(`/api/members/${member1Id}/notes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${noPermToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. CHRONOLOGICAL CHECK-INS
  // ─────────────────────────────────────────────────────────────
  describe('Chronological Check-Ins Logging', () => {
    it('should log a check-in for a member', async () => {
      const res = await request(app)
        .post(`/api/members/${member1Id}/checkins`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: ' Service ',
          targetId: 'sunday-service-id-123',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('service'); // lowercase trim check
      expect(res.body.data.targetId).toBe('sunday-service-id-123');
    });

    it('should get chronological check-ins list for a member', async () => {
      // Add another check-in
      await prisma.memberCheckIn.create({
        data: {
          tenantId,
          memberId: member1Id,
          type: 'event',
          targetId: 'youth-camp-2026',
        },
      });

      const res = await request(app)
        .get(`/api/members/${member1Id}/checkins`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].type).toBe('event'); // sorted desc by checkedInAt
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. CROSS-MODULE FINANCIAL & PARTNERSHIP INTEGRATION
  // ─────────────────────────────────────────────────────────────
  describe('Cross-Module Financial Integration (Giving/Partnership)', () => {
    beforeAll(async () => {
      // Setup mock donation category and donations for Alice's email
      const cat = await prisma.givingCategory.create({
        data: { tenantId, name: 'Tithes', description: 'Tithes description', isActive: true },
      });

      await prisma.donation.create({
        data: {
          tenantId,
          categoryId: cat.id,
          amount: 250.0,
          donorName: 'Alice Smith',
          donorEmail: 'alice@example.com',
          status: 'succeeded',
        },
      });

      // Setup mock partnership category and partnership contributions
      const pCat = await prisma.partnershipCategory.create({
        data: { tenantId, name: 'Missions', description: 'Missions description', isActive: true },
      });

      await prisma.partnership.create({
        data: {
          tenantId,
          categoryId: pCat.id,
          amount: 150.5,
          partnerName: 'Alice Smith',
          partnerEmail: 'alice@example.com',
          status: 'succeeded',
        },
      });

      // Also create a pending donation to ensure it is EXCLUDED from sum
      await prisma.donation.create({
        data: {
          tenantId,
          categoryId: cat.id,
          amount: 1000.0,
          donorName: 'Alice Smith',
          donorEmail: 'alice@example.com',
          status: 'pending',
        },
      });
    });

    it('should resolve and aggregate giving + partnership history for admin', async () => {
      const res = await request(app)
        .get(`/api/members/${member1Id}/finance`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalGiven).toBe(400.5); // 250.0 + 150.5
      expect(res.body.data.donations.length).toBe(1);
      expect(res.body.data.donations[0].amount).toBe(250.0);
      expect(res.body.data.partnerships.length).toBe(1);
      expect(res.body.data.partnerships[0].amount).toBe(150.5);
    });

    it('should block regular members from accessing member financial summaries', async () => {
      const res = await request(app)
        .get(`/api/members/${member1Id}/finance`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. CASCADE DELETION AND TEARDOWN
  // ─────────────────────────────────────────────────────────────
  describe('Cascade Profile Deletion Teardown', () => {
    it('should cascadingly delete check-ins, notes, and tag assignments when member profile is purged', async () => {
      // Verify counts exist before delete
      const noteCountBefore = await prisma.memberNote.count({ where: { memberId: member1Id } });
      const checkinCountBefore = await prisma.memberCheckIn.count({ where: { memberId: member1Id } });
      const tagsCountBefore = await prisma.memberTagAssignment.count({ where: { memberId: member1Id } });

      expect(noteCountBefore).toBe(2);
      expect(checkinCountBefore).toBe(2);
      expect(tagsCountBefore).toBe(2);

      // Perform admin delete
      const res = await request(app)
        .delete(`/api/members/${member1Id}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      // Verify cascading purging
      const noteCountAfter = await prisma.memberNote.count({ where: { memberId: member1Id } });
      const checkinCountAfter = await prisma.memberCheckIn.count({ where: { memberId: member1Id } });
      const tagsCountAfter = await prisma.memberTagAssignment.count({ where: { memberId: member1Id } });
      const memberAfter = await prisma.member.findUnique({ where: { id: member1Id } });

      expect(noteCountAfter).toBe(0);
      expect(checkinCountAfter).toBe(0);
      expect(tagsCountAfter).toBe(0);
      expect(memberAfter).toBeNull();
    });
  });
});
