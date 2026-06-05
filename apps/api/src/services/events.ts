import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { trackEvent } from './analytics';

// ─────────────────────────────────────────────────────────────
// 1. EVENT CATEGORIES CRUD
// ─────────────────────────────────────────────────────────────

export async function createEventCategory(
  tenantId: string,
  name: string
): Promise<any> {
  if (!name || name.trim() === '') {
    throw new Error('Category name is required');
  }

  return await prisma.eventCategory.create({
    data: {
      tenantId,
      name: name.trim(),
    },
  });
}

export async function listEventCategories(tenantId: string): Promise<any[]> {
  return await prisma.eventCategory.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. EVENT SETUP & CRUD
// ─────────────────────────────────────────────────────────────

export async function createEvent(
  tenantId: string,
  data: {
    categoryId: string;
    title: string;
    description?: string;
    coverImageUrl?: string;
    startDate: Date | string;
    endDate: Date | string;
    pricingType?: 'free' | 'paid';
    price?: number;
    capacityLimit?: number;
    locationType?: 'physical' | 'virtual' | 'hybrid';
    location?: string;
    livestreamUrl?: string;
    status?: 'draft' | 'published' | 'cancelled';
  }
): Promise<any> {
  if (!data.categoryId || !data.title || !data.startDate || !data.endDate) {
    throw new Error('categoryId, title, startDate, and endDate are required');
  }

  // Verify category belongs to tenant
  const category = await prisma.eventCategory.findFirst({
    where: { id: data.categoryId, tenantId },
  });
  if (!category) {
    throw new Error('Event category not found');
  }

  const sDate = new Date(data.startDate);
  const eDate = new Date(data.endDate);
  if (eDate < sDate) {
    throw new Error('End date cannot be before start date');
  }

  const pricingType = data.pricingType || 'free';
  const price = pricingType === 'free' ? 0.0 : (data.price || 0.0);

  return await prisma.event.create({
    data: {
      tenantId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description || null,
      coverImageUrl: data.coverImageUrl || null,
      startDate: sDate,
      endDate: eDate,
      pricingType,
      price,
      capacityLimit: data.capacityLimit || null,
      locationType: data.locationType || 'physical',
      location: data.location || null,
      livestreamUrl: data.livestreamUrl || null,
      status: data.status || 'draft',
    },
    include: {
      category: true,
    },
  });
}

export async function getEvent(tenantId: string, eventId: string): Promise<any> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    include: {
      category: true,
      registrations: true,
      tickets: true,
      rsvps: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      reminders: true,
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
}

export async function listEvents(
  tenantId: string,
  filters: {
    categoryId?: string;
    status?: string;
    search?: string;
  } = {}
): Promise<any[]> {
  const where: any = { tenantId };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
      { location: { contains: filters.search } },
    ];
  }

  return await prisma.event.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { startDate: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 3. REGISTRATION & CHECKOUT
// ─────────────────────────────────────────────────────────────

export async function registerForEvent(
  tenantId: string,
  data: {
    eventId: string;
    memberId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    customResponsesJson?: string;
  }
): Promise<any> {
  if (!data.eventId || !data.firstName || !data.lastName || !data.email) {
    throw new Error('eventId, firstName, lastName, and email are required');
  }

  // 1. Fetch event
  const event = await prisma.event.findFirst({
    where: { id: data.eventId, tenantId },
  });
  if (!event) {
    throw new Error('Event not found');
  }

  // 2. Check capacity limits (skip failed transactions)
  const registrationCount = await prisma.eventRegistration.count({
    where: { eventId: data.eventId, paymentStatus: { not: 'failed' } },
  });
  if (event.capacityLimit && registrationCount >= event.capacityLimit) {
    throw new Error('Event capacity has been reached');
  }

  // 3. Resolve or create Member record
  let memberId = data.memberId;
  if (!memberId) {
    let member = await prisma.member.findFirst({
      where: { email: data.email.toLowerCase().trim(), tenantId },
    });
    if (!member) {
      member = await prisma.member.create({
        data: {
          tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase().trim(),
          phone: data.phone || null,
          membershipStatus: 'visitor',
        },
      });
    }
    memberId = member.id;
  }

  // 4. Resolve or create CRM contact
  let contact = await prisma.crmContact.findFirst({
    where: { email: data.email.toLowerCase().trim(), tenantId },
  });
  if (!contact) {
    contact = await prisma.crmContact.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        type: 'visitor',
        leadSource: 'event_registration',
        firstContactAt: new Date(),
        lastContactAt: new Date(),
        memberId,
      },
    });
  } else if (!contact.memberId) {
    await prisma.crmContact.update({
      where: { id: contact.id },
      data: { memberId },
    });
  }

  // Write CRM Timeline event: Registered
  await prisma.crmTimelineEvent.create({
    data: {
      tenantId,
      contactId: contact.id,
      type: 'event_attended',
      title: `Registered for Event: ${event.title}`,
      description: `Pending event registration checkout.`,
      occurredAt: new Date(),
    },
  });
  await prisma.crmContact.update({
    where: { id: contact.id },
    data: {
      engagementScore: { increment: 10 },
      lastContactAt: new Date(),
    },
  });

  const isFree = event.pricingType === 'free';

  // 5. Create Event Registration record
  const registration = await prisma.eventRegistration.create({
    data: {
      tenantId,
      eventId: event.id,
      memberId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
      customResponsesJson: data.customResponsesJson || null,
      paymentStatus: isFree ? 'free' : 'pending',
    },
  });

  if (isFree) {
    // Generates ticket immediately for free events
    const ticket = await generateTicket(tenantId, registration.id);
    return {
      registration,
      ticket,
    };
  } else {
    // Resolve payment driver
    const driver = await resolveDriver(tenantId, 'payment', 'giving-donations');
    const paymentResult = await driver.createPaymentIntent(event.price, 'USD', {
      email: data.email,
      type: 'event_registration',
      registrationId: registration.id,
    });

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Mock Payment intent initiation failed');
    }

    // Save transaction ID as paymentIntentId in registration
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        paymentIntentId: paymentResult.clientSecret, // Save clientSecret as intent ID
      },
    });

    return {
      registration: updatedRegistration,
      clientSecret: paymentResult.clientSecret,
      transactionId: paymentResult.transactionId,
      checkoutUrl: `/api/events/registrations/${registration.id}/payment-webhook?simulated=success`,
    };
  }
}

export async function handlePaymentSuccess(
  tenantId: string,
  registrationId: string,
  paymentIntentId?: string
): Promise<any> {
  const registration = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, tenantId },
    include: { event: true },
  });

  if (!registration) {
    throw new Error('Registration record not found');
  }

  // Prevent duplicate hooks processing
  if (registration.paymentStatus === 'paid') {
    return registration;
  }

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id: registration.id },
    data: {
      paymentStatus: 'paid',
      paymentIntentId: paymentIntentId || registration.paymentIntentId,
    },
    include: { event: true },
  });

  // Generate ticket for user
  const ticket = await generateTicket(tenantId, registration.id);

  // Log giving / registrations telemetry event
  await trackEvent(tenantId, {
    category: 'giving',
    name: 'event_registration',
    entityId: registration.id,
    value: registration.event.price,
    metadata: {
      registrationId: registration.id,
      eventId: registration.eventId,
      price: registration.event.price,
    },
  });

  return {
    registration: updatedRegistration,
    ticket,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. TICKETING & USHER CHECK-INS
// ─────────────────────────────────────────────────────────────

export async function generateTicket(
  tenantId: string,
  registrationId: string
): Promise<any> {
  const registration = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, tenantId },
  });

  if (!registration) {
    throw new Error('Registration not found');
  }

  const ticketNumber = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
  const qrCodeToken = 'QR-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  return await prisma.eventTicket.create({
    data: {
      tenantId,
      eventId: registration.eventId,
      registrationId,
      ticketNumber,
      qrCodeToken,
      status: 'issued',
    },
  });
}

export async function verifyTicketCheckIn(
  tenantId: string,
  qrCodeToken: string
): Promise<any> {
  if (!qrCodeToken) {
    throw new Error('QR code token is required');
  }

  const ticket = await prisma.eventTicket.findFirst({
    where: { qrCodeToken, tenantId },
    include: {
      event: true,
      registration: true,
    },
  });

  if (!ticket) {
    throw new Error('Invalid ticket token');
  }

  if (ticket.status === 'checked_in') {
    throw new Error('Ticket already verified / checked in');
  }

  if (ticket.status === 'cancelled') {
    throw new Error('Ticket has been cancelled');
  }

  // Update status to checked_in
  const updatedTicket = await prisma.eventTicket.update({
    where: { id: ticket.id },
    data: {
      status: 'checked_in',
      checkedInAt: new Date(),
    },
  });

  // CRM Timeline engagement increase for physical check-in
  let contact = await prisma.crmContact.findFirst({
    where: { email: ticket.registration.email.toLowerCase().trim(), tenantId },
  });
  if (contact) {
    await prisma.crmTimelineEvent.create({
      data: {
        tenantId,
        contactId: contact.id,
        type: 'event_attended',
        title: `Attended Event: ${ticket.event.title}`,
        description: `Checked in successfully with QR Ticket ${ticket.ticketNumber}`,
        occurredAt: new Date(),
      },
    });

    await prisma.crmContact.update({
      where: { id: contact.id },
      data: {
        engagementScore: { increment: 10 },
        lastContactAt: new Date(),
      },
    });
  }

  return updatedTicket;
}

// ─────────────────────────────────────────────────────────────
// 5. RSVPS & REMINDERS
// ─────────────────────────────────────────────────────────────

export async function submitRsvp(
  tenantId: string,
  eventId: string,
  memberId: string,
  status: 'going' | 'maybe' | 'declined' | string
): Promise<any> {
  const cleanStatus = status.toLowerCase().trim();
  if (!['going', 'maybe', 'declined'].includes(cleanStatus)) {
    throw new Error('Invalid RSVP status. Must be going, maybe, or declined');
  }

  // Validate event
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
  });
  if (!event) {
    throw new Error('Event not found');
  }

  // Validate member
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  // Upsert
  const existingRsvp = await prisma.eventRsvp.findUnique({
    where: {
      eventId_memberId: { eventId, memberId },
    },
  });

  if (existingRsvp) {
    return await prisma.eventRsvp.update({
      where: { id: existingRsvp.id },
      data: { status: cleanStatus },
    });
  } else {
    return await prisma.eventRsvp.create({
      data: {
        tenantId,
        eventId,
        memberId,
        status: cleanStatus,
      },
    });
  }
}

export async function scheduleEventReminder(
  tenantId: string,
  eventId: string,
  sendBeforeHours: number
): Promise<any> {
  if (sendBeforeHours <= 0) {
    throw new Error('sendBeforeHours must be greater than 0');
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
  });
  if (!event) {
    throw new Error('Event not found');
  }

  return await prisma.eventReminder.create({
    data: {
      tenantId,
      eventId,
      sendBeforeHours,
      status: 'pending',
    },
  });
}

export async function triggerReminder(
  tenantId: string,
  reminderId: string
): Promise<any> {
  const reminder = await prisma.eventReminder.findFirst({
    where: { id: reminderId, tenantId },
    include: { event: true },
  });

  if (!reminder) {
    throw new Error('Event reminder not found');
  }

  if (reminder.status === 'sent') {
    return reminder;
  }

  // Update status to sent (simulates dispatching email reminders to registered users)
  return await prisma.eventReminder.update({
    where: { id: reminderId },
    data: {
      status: 'sent',
      sentAt: new Date(),
    },
  });
}
