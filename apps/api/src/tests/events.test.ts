import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 40: Events & Registration Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberId: string;

  let categoryId: string;
  let freeEventId: string;
  let paidEventId: string;

  let freeTicketToken: string;
  let paidTicketToken: string;
  let paidRegistrationId: string;
  let reminderId: string;

  beforeAll(async () => {
    // 1. Clean up events and registrations related tables
    await prisma.eventReminder.deleteMany({});
    await prisma.eventRsvp.deleteMany({});
    await prisma.eventTicket.deleteMany({});
    await prisma.eventRegistration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.eventCategory.deleteMany({});
    await prisma.crmTimelineEvent.deleteMany({});
    await prisma.crmContact.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Events Church', subdomain: 'grace-events', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup Stripe connection
    await prisma.providerCategory.upsert({
      where: { id: 'payment' },
      update: {},
      create: { id: 'payment', name: 'Payment Gateway' }
    });
    await prisma.provider.upsert({
      where: { id: 'stripe' },
      update: {},
      create: { id: 'stripe', categoryId: 'payment', name: 'Stripe' }
    });

    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'stripe',
        encryptedCredentials: encryptCredentials(JSON.stringify({ secretKey: 'sk_test_events_mock_key' }), tenantId),
        providerMode: 'bring_your_own',
        isActive: true,
      }
    });

    // 4. Setup permissions & roles
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

    // 5. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@grace-events.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Create Member User & Member Record
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@grace-events.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    const member = await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'John',
        lastName: 'Member',
        email: 'member@grace-events.com',
        membershipStatus: 'member',
      },
    });
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. EVENT CATEGORIES CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Event Categories', () => {
    it('should allow admin to create an event category', async () => {
      const res = await request(app)
        .post('/api/events/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Youth & Young Adults' });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Youth & Young Adults');
      categoryId = res.body.data.id;
    });

    it('should allow members to list categories', async () => {
      const res = await request(app)
        .get('/api/events/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(categoryId);
    });

    it('should prevent non-admin from creating categories', async () => {
      const res = await request(app)
        .post('/api/events/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Conferences' });

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. EVENT SETUP & CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Event Setup & Management', () => {
    it('should allow admin to create a free event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          title: 'Youth Fire Night 2026',
          description: 'Encounter night for young leaders.',
          startDate: '2026-07-15T19:00:00Z',
          endDate: '2026-07-15T22:00:00Z',
          pricingType: 'free',
          capacityLimit: 50,
          locationType: 'physical',
          location: 'Youth Chapel',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.pricingType).toBe('free');
      expect(res.body.data.price).toBe(0);
      freeEventId = res.body.data.id;
    });

    it('should allow admin to create a paid event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId,
          title: 'Grace Leadership Summit 2026',
          description: 'Annual church workers and leaders training conference.',
          startDate: '2026-08-20T09:00:00Z',
          endDate: '2026-08-22T17:00:00Z',
          pricingType: 'paid',
          price: 15.0,
          capacityLimit: 100,
          locationType: 'hybrid',
          location: 'Main Auditorium',
          livestreamUrl: 'https://grace-events.com/summit-live',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.pricingType).toBe('paid');
      expect(res.body.data.price).toBe(15.0);
      paidEventId = res.body.data.id;
    });

    it('should list all events with filters', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .query({ search: 'Summit' });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(paidEventId);
    });

    it('should retrieve detail of a specific event', async () => {
      const res = await request(app)
        .get(`/api/events/${freeEventId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(freeEventId);
      expect(res.body.data.tickets).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. REGISTRATIONS, CHECKOUT & WEBHOOK
  // ─────────────────────────────────────────────────────────────
  describe('Registrations & Stripe Checkout Simulation', () => {
    it('should register for free event publicly, generating ticket and CRM contact/timeline', async () => {
      const res = await request(app)
        .post(`/api/events/${freeEventId}/register`)
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'Alice',
          lastName: 'Guest',
          email: 'alice@guest.com',
          phone: '+1555000111',
          customResponsesJson: JSON.stringify({ tShirtSize: 'M' }),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.registration.paymentStatus).toBe('free');
      expect(res.body.data.ticket).toBeDefined();
      expect(res.body.data.ticket.qrCodeToken).toBeDefined();
      freeTicketToken = res.body.data.ticket.qrCodeToken;

      // Verify Member created
      const member = await prisma.member.findFirst({
        where: { email: 'alice@guest.com', tenantId },
      });
      expect(member).toBeDefined();
      expect(member!.firstName).toBe('Alice');

      // Verify CRM contact created
      const contact = await prisma.crmContact.findFirst({
        where: { email: 'alice@guest.com', tenantId },
      });
      expect(contact).toBeDefined();
      expect(contact!.engagementScore).toBe(10);

      // Verify CRM timeline event
      const timeline = await prisma.crmTimelineEvent.findFirst({
        where: { contactId: contact!.id, tenantId },
      });
      expect(timeline).toBeDefined();
      expect(timeline!.type).toBe('event_attended');
    });

    it('should register for paid event publicly, returning checkout intent', async () => {
      const res = await request(app)
        .post(`/api/events/${paidEventId}/register`)
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'Bob',
          lastName: 'Visitor',
          email: 'bob@visitor.com',
          phone: '+1555000222',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.registration.paymentStatus).toBe('pending');
      expect(res.body.data.clientSecret).toBeDefined();
      expect(res.body.data.checkoutUrl).toBeDefined();

      paidRegistrationId = res.body.data.registration.id;
    });

    it('should complete paid registration via mock webhook, generating ticket and telemetry', async () => {
      const res = await request(app)
        .post(`/api/events/registrations/${paidRegistrationId}/payment-webhook`)
        .set('x-tenant-id', tenantId)
        .send({
          simulated: 'success',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.registration.paymentStatus).toBe('paid');
      expect(res.body.data.ticket).toBeDefined();
      paidTicketToken = res.body.data.ticket.qrCodeToken;

      // Verify telemetry event
      const telemetry = await prisma.analyticsEvent.findFirst({
        where: { entityId: paidRegistrationId, tenantId },
      });
      expect(telemetry).toBeDefined();
      expect(telemetry!.category).toBe('giving');
      expect(telemetry!.name).toBe('event_registration');
      expect(telemetry!.value).toBe(15.0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. USHER QR TICKET CHECK-IN VERIFICATION
  // ─────────────────────────────────────────────────────────────
  describe('Usher Check-In Verification', () => {
    it('should verify ticket check-in via QR token and add to CRM score', async () => {
      const res = await request(app)
        .post('/api/events/tickets/verify')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrCodeToken: freeTicketToken });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('checked_in');
      expect(res.body.data.checkedInAt).toBeDefined();

      // CRM check-in score update
      const contact = await prisma.crmContact.findFirst({
        where: { email: 'alice@guest.com', tenantId },
      });
      // Initial score was 10 (registration). Attendance adds another 10. Total = 20.
      expect(contact!.engagementScore).toBe(20);
    });

    it('should block duplicate scans with error status 400', async () => {
      const res = await request(app)
        .post('/api/events/tickets/verify')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrCodeToken: freeTicketToken });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already verified / checked in');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. RSVPS & REMINDERS
  // ─────────────────────────────────────────────────────────────
  describe('RSVPs & Scheduled Reminders', () => {
    it('should allow a member to submit RSVP going status', async () => {
      const res = await request(app)
        .post(`/api/events/${freeEventId}/rsvp`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          memberId,
          status: 'going',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('going');
    });

    it('should allow setting up event reminders', async () => {
      const res = await request(app)
        .post(`/api/events/${freeEventId}/reminders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sendBeforeHours: 24,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('pending');
      reminderId = res.body.data.id;
    });

    it('should allow triggering/dispatching reminder', async () => {
      const res = await request(app)
        .post(`/api/events/reminders/${reminderId}/trigger`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.sentAt).toBeDefined();
    });
  });
});
