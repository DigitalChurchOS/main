import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 42: Booking & Appointment Management Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;

  let hostMemberId: string;
  let otherMemberId: string;

  let appointmentTypeId: string;
  let virtualAppointmentTypeId: string;
  let appointmentId: string;
  let reminderId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.appointmentReminder.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.staffAvailability.deleteMany({});
    await prisma.appointmentType.deleteMany({});
    await prisma.crmTimelineEvent.deleteMany({});
    await prisma.crmContact.deleteMany({});
    await prisma.liveMeetingReminder.deleteMany({});
    await prisma.liveMeetingAttendance.deleteMany({});
    await prisma.liveMeetingChat.deleteMany({});
    await prisma.liveMeetingParticipant.deleteMany({});
    await prisma.liveMeeting.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Booking Church', subdomain: 'grace-book', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.read', 'member.update', 'tenant.settings'] } },
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
    const memberPermissions = permissions.filter((p) => ['member.read', 'member.update'].includes(p.name));
    await prisma.rolePermission.createMany({
      data: memberPermissions.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User (Host Pastor)
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor-book@grace.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const hostMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Paul',
        lastName: 'Apostle',
        email: 'pastor-book@grace.com',
        membershipStatus: 'leader',
      },
    });
    hostMemberId = hostMember.id;

    // 5. Create Normal Member User (Unrelated Booker/Standard user)
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'booker@grace.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    const otherMember = await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'Timothy',
        lastName: 'Disciple',
        email: 'booker@grace.com',
        membershipStatus: 'member',
      },
    });
    otherMemberId = otherMember.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. APPOINTMENT TYPE CRUD TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Appointment Type CRUD API', () => {
    it('should block non-admins from creating appointment types', async () => {
      const res = await request(app)
        .post('/api/bookings/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Pastoral Counseling',
          durationMinutes: 45,
          isVirtual: false,
        });
      expect(res.status).toBe(403);
    });

    it('should allow admins to create physical & virtual appointment types', async () => {
      // Create Physical
      const res1 = await request(app)
        .post('/api/bookings/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pastoral Counseling (In-Person)',
          description: 'One-on-one counseling session.',
          durationMinutes: 45,
          isVirtual: false,
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.name).toBe('Pastoral Counseling (In-Person)');
      appointmentTypeId = res1.body.data.id;

      // Create Virtual
      const res2 = await request(app)
        .post('/api/bookings/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Youth Leadership (Virtual)',
          description: 'Virtual guidance and prayer.',
          durationMinutes: 30,
          isVirtual: true,
        });
      expect(res2.status).toBe(201);
      expect(res2.body.data.isVirtual).toBe(true);
      virtualAppointmentTypeId = res2.body.data.id;
    });

    it('should allow reading active appointment types', async () => {
      const res = await request(app)
        .get('/api/bookings/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow admins to update and toggle status of appointment types', async () => {
      const res = await request(app)
        .patch(`/api/bookings/types/${appointmentTypeId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          durationMinutes: 60,
          isActive: false,
        });
      expect(res.status).toBe(200);
      expect(res.body.data.durationMinutes).toBe(60);
      expect(res.body.data.isActive).toBe(false);

      // Re-enable for subsequent booking tests
      await request(app)
        .patch(`/api/bookings/types/${appointmentTypeId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. STAFF AVAILABILITIES TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Staff Availability API', () => {
    it('should allow staff/host to configure their weekly availability times', async () => {
      const res = await request(app)
        .post(`/api/bookings/availabilities/${hostMemberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          availabilities: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }, // Monday Morning
            { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' }, // Monday Afternoon
            { dayOfWeek: 3, startTime: '10:00', endTime: '15:00' }, // Wednesday
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should return availability configs', async () => {
      const res = await request(app)
        .get(`/api/bookings/availabilities/${hostMemberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should reject invalid hour ranges or formats', async () => {
      const res = await request(app)
        .post(`/api/bookings/availabilities/${hostMemberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          availabilities: [
            { dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }, // Start after End
          ],
        });
      expect(res.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. APPOINTMENT BOOKING & INTEGRATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Appointment Booking intake & integrations', () => {
    it('should reject bookings outside staff availability times', async () => {
      // Try Monday at 8 AM (Availability starts at 9 AM)
      const mondaySlot = new Date('2026-06-01T08:00:00Z'); // Monday morning
      
      const res = await request(app)
        .post('/api/bookings')
        .set('x-tenant-id', tenantId)
        .send({
          appointmentTypeId,
          hostMemberId,
          bookerName: 'Jane Smith',
          bookerEmail: 'janesmith@external.com',
          startAt: mondaySlot.toISOString(),
          intakeResponsesJson: { reason: 'Grief counselling' },
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('outside');
    });

    it('should successfully book a physical appointment and create/link CRM contacts', async () => {
      const validMondaySlot = new Date('2026-06-01T10:00:00Z'); // Monday 10:00 AM (Duration: 60m, fits in 9-12)
      
      const res = await request(app)
        .post('/api/bookings')
        .set('x-tenant-id', tenantId)
        .send({
          appointmentTypeId,
          hostMemberId,
          bookerName: 'Jane Smith',
          bookerEmail: 'janesmith@external.com',
          bookerPhone: '+1234567890',
          startAt: validMondaySlot.toISOString(),
          intakeResponsesJson: { reason: 'Grief counselling' },
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      appointmentId = res.body.data.id;

      // Verify CRM contact was created automatically
      const contact = await prisma.crmContact.findFirst({
        where: { email: 'janesmith@external.com', tenantId },
      });
      expect(contact).not.toBeNull();
      expect(contact?.firstName).toBe('Jane');
      expect(contact?.lastName).toBe('Smith');

      // Verify CRM Timeline Event was registered
      const event = await prisma.crmTimelineEvent.findFirst({
        where: { contactId: contact?.id },
      });
      expect(event?.title).toBe('Appointment Booked');
    });

    it('should reject double-booking overlapping slot schedules', async () => {
      const overlapMondaySlot = new Date('2026-06-01T10:30:00Z'); // Overlaps 10:00-11:00 appointment
      
      const res = await request(app)
        .post('/api/bookings')
        .set('x-tenant-id', tenantId)
        .send({
          appointmentTypeId,
          hostMemberId,
          bookerName: 'Bob Builder',
          bookerEmail: 'bob@builder.com',
          startAt: overlapMondaySlot.toISOString(),
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('conflict');
    });

    it('should book virtual appointments and auto-generate virtual Jitsi LiveMeeting link', async () => {
      const virtualWednesdaySlot = new Date('2026-06-03T11:00:00Z'); // Wednesday 11:00 AM (Fits 10-15 slot)

      const res = await request(app)
        .post('/api/bookings')
        .set('x-tenant-id', tenantId)
        .send({
          appointmentTypeId: virtualAppointmentTypeId,
          hostMemberId,
          bookerName: 'Timothy Member',
          bookerEmail: 'booker@grace.com', // matches registered member Tim
          startAt: virtualWednesdaySlot.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.liveMeetingId).not.toBeNull();
      expect(res.body.data.liveMeeting.meetingUrl).toContain('meet.churchos.org');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. RESCHEDULING & CANCELLATION BUFFER WINDOWS
  // ─────────────────────────────────────────────────────────────
  describe('Rescheduling & Cancellation Workflows', () => {
    it('should allow rescheduling to an available slot', async () => {
      const newMondaySlot = new Date('2026-06-08T13:30:00Z'); // Monday afternoon (13:00 - 17:00 slot)

      const res = await request(app)
        .post(`/api/bookings/${appointmentId}/reschedule`)
        .set('x-tenant-id', tenantId)
        .send({
          startAt: newMondaySlot.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('should block cancellations within the 2-hour buffer window for general bookers', async () => {
      // Create a booking starting in 1 hour
      const nearFutureSlot = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Temporarily bypass availability by inserting directly to mock buffer condition
      const mockAppointment = await prisma.appointment.create({
        data: {
          tenantId,
          appointmentTypeId,
          hostMemberId,
          bookerName: 'Quick Booker',
          bookerEmail: 'quick@book.com',
          startAt: nearFutureSlot,
          endAt: new Date(nearFutureSlot.getTime() + 30 * 60 * 1000),
          status: 'pending',
        },
      });

      const res = await request(app)
        .post(`/api/bookings/${mockAppointment.id}/cancel`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cancellations must be done at least 2 hours prior');
    });

    it('should allow staff and admins to override the 2-hour buffer cancellation block', async () => {
      const nearFutureSlot = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      const mockAppointment = await prisma.appointment.create({
        data: {
          tenantId,
          appointmentTypeId,
          hostMemberId,
          bookerName: 'Quick Booker Override',
          bookerEmail: 'quick@override.com',
          startAt: nearFutureSlot,
          endAt: new Date(nearFutureSlot.getTime() + 30 * 60 * 1000),
          status: 'pending',
        },
      });

      const res = await request(app)
        .post(`/api/bookings/${mockAppointment.id}/cancel`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`); // Admin token bypasses buffer

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('cancelled');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SECURITY & NOTES PRIVACY
  // ─────────────────────────────────────────────────────────────
  describe('Counseling Notes Security & Access Controls', () => {
    it('should allow authorized host pastor or admin to update counseling notes', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${appointmentId}/notes`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`) // host pastor has admin access here
        .send({
          notes: 'Sensitive pastoral guidance discussion log.',
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.privateNotes).toBe('Sensitive pastoral guidance discussion log.');
    });

    it('should redact counseling notes from general lookups by unauthorized members', async () => {
      const res = await request(app)
        .get(`/api/bookings/${appointmentId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`); // not host/admin

      expect(res.status).toBe(200);
      expect(res.body.data.privateNotes).toBeNull(); // Redacted!
    });

    it('should display counseling notes to the authorized host pastor', async () => {
      const res = await request(app)
        .get(`/api/bookings/${appointmentId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`); // authorized host

      expect(res.status).toBe(200);
      expect(res.body.data.privateNotes).toBe('Sensitive pastoral guidance discussion log.');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. SCHEDULING REMINDERS & ALERTS
  // ─────────────────────────────────────────────────────────────
  describe('Scheduled Reminders API', () => {
    it('should allow setting an appointment reminder', async () => {
      const res = await request(app)
        .post(`/api/bookings/${appointmentId}/reminders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sendBeforeHours: 24,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      reminderId = res.body.data.id;
    });

    it('should allow triggering/dispatching a reminder', async () => {
      const res = await request(app)
        .post(`/api/bookings/reminders/${reminderId}/trigger`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.sentAt).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. ANALYTICAL REPORT METRICS
  // ─────────────────────────────────────────────────────────────
  describe('Analytics & Reports API', () => {
    it('should calculate correct metrics on the booking summary dashboard', async () => {
      // Update our reschedule-confirmed appointment to 'completed'
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'completed' },
      });

      // Mark one appointment as 'no_show'
      await prisma.appointment.create({
        data: {
          tenantId,
          appointmentTypeId,
          hostMemberId,
          bookerName: 'No Show Person',
          bookerEmail: 'noshow@person.com',
          startAt: new Date(),
          endAt: new Date(),
          status: 'no_show',
        },
      });

      const res = await request(app)
        .get('/api/bookings/reports/summary')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalBookings).toBeGreaterThanOrEqual(3);
      expect(res.body.data.completedCount).toBe(1);
      expect(res.body.data.noShowCount).toBe(1);
      expect(res.body.data.noShowRate).toBeGreaterThan(0);
      expect(res.body.data.typeDistribution).toBeInstanceOf(Array);
    });
  });
});
