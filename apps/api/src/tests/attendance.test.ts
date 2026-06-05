import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 31: Check-In & Attendance Management Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let parentId: string;
  let child1Id: string;
  let child2Id: string;
  let regularMemberId: string;
  let familyId: string;
  let serviceId: string = 'srv-123-sunday-main';
  let eventId: string = 'evt-999-youth-camp';
  let classId: string = 'cls-777-discipleship';

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.memberCheckIn.deleteMany({});
    await prisma.memberNote.deleteMany({});
    await prisma.memberTagAssignment.deleteMany({});
    await prisma.memberTag.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.family.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Community Church', subdomain: 'grace-church', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Admin Role + Permissions ────────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin User ──────────────────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // ── Regular Member User ─────────────────────────────────
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@grace.com', passwordHash: passHash },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // ── Family / Household ──────────────────────────────────
    const family = await prisma.family.create({
      data: { tenantId, name: 'The Williams Household' },
    });
    familyId = family.id;

    // ── Members ────────────────────────────────────────────
    const parent = await prisma.member.create({
      data: {
        tenantId,
        familyId,
        familyRole: 'head',
        firstName: 'Robert',
        lastName: 'Williams',
        email: 'robert@grace.com',
        phone: '123-456-7890',
        userId: memberUser.id,
      },
    });
    parentId = parent.id;

    const child1 = await prisma.member.create({
      data: {
        tenantId,
        familyId,
        familyRole: 'child',
        firstName: 'Timmy',
        lastName: 'Williams',
        gender: 'male',
      },
    });
    child1Id = child1.id;

    const child2 = await prisma.member.create({
      data: {
        tenantId,
        familyId,
        familyRole: 'child',
        firstName: 'Lily',
        lastName: 'Williams',
        gender: 'female',
      },
    });
    child2Id = child2.id;

    const regularMember = await prisma.member.create({
      data: {
        tenantId,
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'sarah@connor.com',
        phone: '987-654-3210',
      },
    });
    regularMemberId = regularMember.id;

    // ── Allergy Note for Child 1 ───────────────────────────
    await prisma.memberNote.create({
      data: {
        tenantId,
        memberId: child1Id,
        authorId: adminUser.id,
        noteText: 'Timmy has a severe peanut allergy. Carry EpiPen.',
        category: 'counseling',
      },
    });
  });

  describe('QR Check-in Flow', () => {
    let qrToken: string;

    it('should generate a QR check-in token for a member', async () => {
      const res = await request(app)
        .get(`/api/attendance/qr-token/${parentId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      qrToken = res.body.data.token;
    });

    it('should fail to generate token for non-existent member', async () => {
      const res = await request(app)
        .get(`/api/attendance/qr-token/invalid-id`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should check in a member via QR code', async () => {
      const res = await request(app)
        .post('/api/attendance/qr-checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          token: qrToken,
          type: 'service',
          targetId: serviceId,
          kioskId: 'kiosk-main-lobby',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.memberId).toBe(parentId);
      expect(res.body.data.type).toBe('service');
      expect(res.body.data.targetId).toBe(serviceId);
      expect(res.body.data.kioskId).toBe('kiosk-main-lobby');
    });

    it('should be idempotent and return existing check-in if repeated on same day', async () => {
      const res = await request(app)
        .post('/api/attendance/qr-checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          token: qrToken,
          type: 'service',
          targetId: serviceId,
          kioskId: 'kiosk-main-lobby-2',
        });

      expect(res.status).toBe(201);
      // KioskId should remain the first one logged due to daily idempotency
      expect(res.body.data.kioskId).toBe('kiosk-main-lobby');
    });

    it('should reject expired QR tokens', async () => {
      const expiredPayload = {
        memberId: parentId,
        tenantId,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };
      const expiredToken = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');

      const res = await request(app)
        .post('/api/attendance/qr-checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          token: expiredToken,
          type: 'service',
          targetId: serviceId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('expired');
    });

    it('should reject invalid token formats', async () => {
      const res = await request(app)
        .post('/api/attendance/qr-checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          token: 'totally-invalid-base64-string',
          type: 'service',
          targetId: serviceId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Manual Check-in', () => {
    it('should check in a member manually with admin rights', async () => {
      const res = await request(app)
        .post('/api/attendance/checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: regularMemberId,
          type: 'event',
          targetId: eventId,
          allergies: 'None',
          securityCode: 'M-101',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.memberId).toBe(regularMemberId);
      expect(res.body.data.type).toBe('event');
      expect(res.body.data.targetId).toBe(eventId);
      expect(res.body.data.securityCode).toBe('M-101');
    });

    it('should block manual check-in for users lacking member.update permission', async () => {
      const res = await request(app)
        .post('/api/attendance/checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          memberId: regularMemberId,
          type: 'event',
          targetId: eventId,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Family Check-in (Parent checking in children)', () => {
    it('should check in multiple children under parent family scope', async () => {
      const res = await request(app)
        .post('/api/attendance/family-checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          parentId,
          childIds: [child1Id, child2Id],
          type: 'class',
          targetId: classId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveLength(2);

      const checkIn1 = res.body.data.find((c: any) => c.memberId === child1Id);
      const checkIn2 = res.body.data.find((c: any) => c.memberId === child2Id);

      expect(checkIn1).toBeDefined();
      expect(checkIn2).toBeDefined();

      // Allergy warning should be auto-extracted for child1
      expect(checkIn1.allergies).toContain('peanut allergy');
      // Child2 should default to None reported
      expect(checkIn2.allergies).toBe('None reported');

      // Both must share the identical security code
      expect(checkIn1.securityCode).toBeDefined();
      expect(checkIn2.securityCode).toBe(checkIn1.securityCode);
      expect(checkIn1.checkedInById).toBe(parentId);
    });

    it('should block check-in if child does not belong to parent family', async () => {
      const res = await request(app)
        .post('/api/attendance/family-checkin')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          parentId,
          childIds: [regularMemberId], // Sarah Connor not in family
          type: 'class',
          targetId: classId,
        });

      expect(res.status).toBe(404);
    });
  });

  describe('Absence Alerts', () => {
    beforeAll(async () => {
      // Setup member to make them a "consistent" attendee in the past
      // Create 2 check-in logs more than 3 weeks ago
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const fiveWeeksAgo = new Date();
      fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35);

      await prisma.memberCheckIn.create({
        data: {
          tenantId,
          memberId: regularMemberId,
          type: 'service',
          targetId: serviceId,
          checkedInAt: fourWeeksAgo,
        },
      });

      await prisma.memberCheckIn.create({
        data: {
          tenantId,
          memberId: regularMemberId,
          type: 'service',
          targetId: serviceId,
          checkedInAt: fiveWeeksAgo,
        },
      });
    });

    it('should report absence for consistent member missing for 3 weeks', async () => {
      const res = await request(app)
        .get('/api/attendance/absences')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'service', weeksLimit: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();

      // regularMember should be in the list as they checked in twice in past but none recently
      const alert = res.body.data.find((a: any) => a.memberId === regularMemberId);
      expect(alert).toBeDefined();
      expect(alert.weeksAbsent).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Attendance Reports & Charts', () => {
    it('should aggregate attendance numbers and estimate growth rate', async () => {
      const res = await request(app)
        .get('/api/attendance/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          type: 'service',
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.totalCheckIns).toBeGreaterThanOrEqual(3); // parent + 2 seeded historical
      expect(res.body.data.averageCheckIns).toBeDefined();
      expect(res.body.data.growthRate).toBeDefined();
      expect(res.body.data.dailyBreakdown).toBeInstanceOf(Array);
    });
  });

  describe('Attendance CSV Export', () => {
    it('should generate a valid CSV format containing records', async () => {
      const res = await request(app)
        .get('/api/attendance/export')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('CheckIn ID,Member ID,First Name,Last Name,Email,Type,Target ID,Checked In At');
      expect(res.text).toContain('Robert');
      expect(res.text).toContain('Timmy');
    });
  });
});
