import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 39: Children & Family Ministry Module', () => {
  let tenantId: string;
  
  // Tokens
  let adminToken: string;
  let adminUserId: string;
  let adminMemberId: string;
  
  let regularToken: string;
  let regularUserId: string;
  let regularMemberId: string;

  let secondaryParentToken: string;
  let secondaryParentUserId: string;
  let secondaryParentMemberId: string;

  let unauthorizedToken: string;
  let unauthorizedUserId: string;
  let unauthorizedMemberId: string;

  // Resource IDs
  let childProfileId: string;
  let childMemberId: string;
  let classId: string;
  let checkInId: string;

  beforeAll(async () => {
    // ── Clean up related tables in correct order ──────────────────────────────
    await prisma.childrenCheckIn.deleteMany({});
    await prisma.childrenClassResource.deleteMany({});
    await prisma.childrenClassEnrollment.deleteMany({});
    await prisma.childrenClass.deleteMany({});
    await prisma.pickupAuthorization.deleteMany({});
    await prisma.childGuardian.deleteMany({});
    await prisma.childProfile.deleteMany({});
    
    await prisma.memberCheckIn.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Dunamis Kids Church', subdomain: 'dunamis-kids', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Roles & Permissions ───────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({ data: { tenantId, name: 'Member', isCustom: false } });
    const memberPerms = permissions.filter((p) => p.name !== 'tenant.settings');
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });
    const restrictedRole = await prisma.role.create({ data: { tenantId, name: 'RestrictedMember', isCustom: false } });
    const restrictedPerms = permissions.filter((p) => p.name === 'member.read');
    await prisma.rolePermission.createMany({
      data: restrictedPerms.map((p) => ({ roleId: restrictedRole.id, permissionId: p.id })),
    });
    const passHash = await bcrypt.hash('password123', 12);

    // ── Admin (Teacher/Staff) User ─────────────────────────
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'teacher@dunamis.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const adminMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Sarah',
        lastName: 'Teacher',
        email: 'teacher@dunamis.com',
        membershipStatus: 'leader',
      },
    });
    adminMemberId = adminMember.id;

    // ── Primary Parent (Regular Member) User ─────────────────────────
    const parentUser = await prisma.user.create({
      data: { tenantId, email: 'mother@dunamis.com', passwordHash: passHash },
    });
    regularUserId = parentUser.id;
    await prisma.userRole.create({ data: { userId: parentUser.id, roleId: memberRole.id } });
    regularToken = jwt.sign({ userId: parentUser.id, tenantId, email: parentUser.email }, JWT_SECRET);

    const parentMember = await prisma.member.create({
      data: {
        tenantId,
        userId: parentUser.id,
        firstName: 'Mary',
        lastName: 'Smith',
        email: 'mother@dunamis.com',
        phone: '+15550001111',
        membershipStatus: 'member',
      },
    });
    regularMemberId = parentMember.id;

    // Seed phone consent for parent to allow SMS notifications
    await prisma.consentRecord.create({
      data: {
        tenantId,
        memberId: parentMember.id,
        optInSms: true,
        optInEmail: true,
      }
    });

    // ── Secondary Parent (Authorized to pickup) User ─────────────────────────
    const fatherUser = await prisma.user.create({
      data: { tenantId, email: 'father@dunamis.com', passwordHash: passHash },
    });
    secondaryParentUserId = fatherUser.id;
    await prisma.userRole.create({ data: { userId: fatherUser.id, roleId: memberRole.id } });
    secondaryParentToken = jwt.sign({ userId: fatherUser.id, tenantId, email: fatherUser.email }, JWT_SECRET);

    const fatherMember = await prisma.member.create({
      data: {
        tenantId,
        userId: fatherUser.id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'father@dunamis.com',
        phone: '+15550002222',
        membershipStatus: 'member',
      },
    });
    secondaryParentMemberId = fatherMember.id;

    // ── Unauthorized/Stranger User ─────────────────────────
    const unauthorizedUser = await prisma.user.create({
      data: { tenantId, email: 'stranger@dunamis.com', passwordHash: passHash },
    });
    unauthorizedUserId = unauthorizedUser.id;
    await prisma.userRole.create({ data: { userId: unauthorizedUser.id, roleId: restrictedRole.id } });
    unauthorizedToken = jwt.sign({ userId: unauthorizedUser.id, tenantId, email: unauthorizedUser.email }, JWT_SECRET);

    const unauthorizedMember = await prisma.member.create({
      data: {
        tenantId,
        userId: unauthorizedUser.id,
        firstName: 'Bob',
        lastName: 'Stranger',
        email: 'stranger@dunamis.com',
        phone: '+15559999999',
        membershipStatus: 'member',
      },
    });
    unauthorizedMemberId = unauthorizedMember.id;

    // Seed SMS configuration credentials for tenant SMS dispatch tests
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'twilio',
        encryptedCredentials: require('../lib/vault').encryptCredentials(
          JSON.stringify({ accountSid: 'AC123', authToken: 'xyz', fromNumber: '+1234567890' }),
          tenantId
        ),
        isActive: true,
      }
    });
  });

  describe('1. Child Profile & Guardian Management', () => {
    it('should allow staff to create a child profile with primary guardian', async () => {
      const res = await request(app)
        .post('/api/children')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Timmy',
          lastName: 'Smith',
          birthday: '2020-05-15T00:00:00.000Z',
          allergies: 'Peanut allergy',
          medicalNotes: 'Carries EpiPen',
          consentWaiverSigned: true,
          primaryGuardianId: regularMemberId,
          relationship: 'mother',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.member.firstName).toBe('Timmy');
      expect(res.body.data.allergies).toBe('Peanut allergy');

      childProfileId = res.body.data.id;
      childMemberId = res.body.data.member.id;
    });

    it('should reject child creation requests from regular members', async () => {
      const res = await request(app)
        .post('/api/children')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({
          firstName: 'Unauthorized',
          lastName: 'Child',
          birthday: '2021-01-01T00:00:00.000Z',
          primaryGuardianId: regularMemberId,
          relationship: 'mother',
        });

      expect(res.status).toBe(403);
    });

    it('should link secondary parent to child profile', async () => {
      const res = await request(app)
        .post(`/api/children/${childProfileId}/guardians`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          guardianMemberId: secondaryParentMemberId,
          relationship: 'father',
          isPrimary: false,
          isAuthorizedPickup: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.guardianMemberId).toBe(secondaryParentMemberId);
    });

    it('should retrieve a child profile in detail including guardians', async () => {
      const res = await request(app)
        .get(`/api/children/${childProfileId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.allergies).toBe('Peanut allergy');
      expect(res.body.data.guardians).toHaveLength(2);
      expect(res.body.data.guardians.find((g: any) => g.isPrimary).guardianMember.firstName).toBe('Mary');
    });

    it('should list child profiles matching search keywords', async () => {
      const res = await request(app)
        .get('/api/children?search=Timmy')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].member.firstName).toBe('Timmy');
    });
  });

  describe('2. Classroom Setup & Curriculum Resources', () => {
    it('should allow admins to create a child class', async () => {
      const res = await request(app)
        .post('/api/children/classes')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Toddlers Room 3',
          minAgeMonths: 24,
          maxAgeMonths: 72,
          roomNumber: 'Room 3',
          capacityLimit: 1, // small limit to test constraints
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Toddlers Room 3');
      classId = res.body.data.id;
    });

    it('should enroll child in the created class', async () => {
      const res = await request(app)
        .post(`/api/children/classes/${classId}/enroll`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ childProfileId });

      expect(res.status).toBe(201);
      expect(res.body.data.classId).toBe(classId);
      expect(res.body.data.childProfileId).toBe(childProfileId);
    });

    it('should upload a weekly curriculum lesson PDF for teachers', async () => {
      const res = await request(app)
        .post(`/api/children/classes/${classId}/resources`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Noah\'s Ark Craft Sheet',
          description: 'Fun coloring and cut-out sheets',
          fileUrl: 'https://dunamis.com/curriculum/noah.pdf',
          publishDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Noah\'s Ark Craft Sheet');
    });

    it('should retrieve curriculum resources list for enrolled classroom', async () => {
      const res = await request(app)
        .get(`/api/children/classes/${classId}/resources`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Noah\'s Ark Craft Sheet');
    });
  });

  describe('3. Secure Check-In, Check-Out & Alerts', () => {
    it('should block check-in by unauthorized stranger', async () => {
      const res = await request(app)
        .post('/api/children/check-ins')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          childProfileId,
          classId,
          checkedInByMemberId: unauthorizedMemberId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not authorized to check in');
    });

    it('should check in child successfully and return security code', async () => {
      const res = await request(app)
        .post('/api/children/check-ins')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          childProfileId,
          classId,
          checkedInByMemberId: regularMemberId,
          notes: 'Drop-off by Mother Mary',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.securityCode).toBeDefined();
      expect(res.body.data.securityCode).toContain('KIDS-');
      checkInId = res.body.data.id;
    });

    it('should block subsequent check-ins to class when capacity is reached', async () => {
      // Create another child profile to attempt check-in
      const secondRes = await request(app)
        .post('/api/children')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Little',
          lastName: 'Sibling',
          birthday: '2021-08-01T00:00:00.000Z',
          primaryGuardianId: regularMemberId,
          relationship: 'mother',
        });
      const siblingProfileId = secondRes.body.data.id;

      // Try check-in sibling (capacity limit of classroom = 1)
      const res = await request(app)
        .post('/api/children/check-ins')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          childProfileId: siblingProfileId,
          classId,
          checkedInByMemberId: regularMemberId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('capacity limit reached');
    });

    it('should send SMS notifications to parent', async () => {
      const res = await request(app)
        .post(`/api/children/check-ins/${checkInId}/notify`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Please come to Room 3, Timmy is crying.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.recipient).toBe('+15550001111');
    });

    it('should block check-out if security code is incorrect', async () => {
      const res = await request(app)
        .post(`/api/children/check-ins/${checkInId}/checkout`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          checkingOutAdultId: regularMemberId,
          securityCode: 'WRONG-CODE',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid security code');
    });

    it('should block check-out if picker-up adult is unauthorized', async () => {
      // Find actual check-in to get security code
      const checkInDetails = await prisma.childrenCheckIn.findUnique({ where: { id: checkInId } });

      const res = await request(app)
        .post(`/api/children/check-ins/${checkInId}/checkout`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          checkingOutAdultId: unauthorizedMemberId,
          securityCode: checkInDetails!.securityCode,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not authorized to pick up');
    });

    it('should check out child successfully if code and picker-up are correct (Father)', async () => {
      const checkInDetails = await prisma.childrenCheckIn.findUnique({ where: { id: checkInId } });

      const res = await request(app)
        .post(`/api/children/check-ins/${checkInId}/checkout`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          checkingOutAdultId: secondaryParentMemberId,
          securityCode: checkInDetails!.securityCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('checked_out');
      expect(res.body.data.checkOutTime).toBeDefined();
    });
  });

  describe('4. Reports & Growth Analytics', () => {
    it('should calculate children ministry check-in aggregates vs adult services attendance', async () => {
      // Seed some adult service check-ins
      await prisma.memberCheckIn.create({
        data: {
          tenantId,
          memberId: regularMemberId,
          type: 'service',
          targetId: 'service-target-id',
          checkedInAt: new Date(),
        }
      });

      const res = await request(app)
        .get('/api/children/reports/growth')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalChildrenCheckIns).toBe(1);
      expect(res.body.data.classDistribution).toHaveLength(1);
      expect(res.body.data.comparison.totalAdultCheckIns).toBe(1);
      expect(res.body.data.comparison.ratioPercent).toBe(100.0);
    });
  });
});
