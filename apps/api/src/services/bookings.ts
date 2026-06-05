import prisma from '../lib/prisma';
import { createMeeting } from './liveMeetings';

// ────────────────────────────────────────────────────────────
// 1. APPOINTMENT TYPES CRUD
// ────────────────────────────────────────────────────────────

export async function createAppointmentType(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    durationMinutes: number;
    isVirtual?: boolean;
    isActive?: boolean;
  }
): Promise<any> {
  if (!data.name || !data.durationMinutes) {
    throw new Error('Name and durationMinutes are required');
  }

  return await prisma.appointmentType.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
      durationMinutes: data.durationMinutes,
      isVirtual: data.isVirtual ?? false,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getAppointmentType(
  tenantId: string,
  id: string
): Promise<any> {
  const type = await prisma.appointmentType.findFirst({
    where: { id, tenantId },
  });
  if (!type) {
    throw new Error('Appointment type not found');
  }
  return type;
}

export async function listAppointmentTypes(
  tenantId: string,
  isActiveOnly = false
): Promise<any[]> {
  const where: any = { tenantId };
  if (isActiveOnly) {
    where.isActive = true;
  }
  return await prisma.appointmentType.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function updateAppointmentType(
  tenantId: string,
  id: string,
  data: {
    name?: string;
    description?: string;
    durationMinutes?: number;
    isVirtual?: boolean;
    isActive?: boolean;
  }
): Promise<any> {
  // Ensure it exists in this tenant
  await getAppointmentType(tenantId, id);

  return await prisma.appointmentType.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      isVirtual: data.isVirtual,
      isActive: data.isActive,
    },
  });
}

export async function deleteAppointmentType(
  tenantId: string,
  id: string
): Promise<any> {
  await getAppointmentType(tenantId, id);

  return await prisma.appointmentType.delete({
    where: { id },
  });
}

// ────────────────────────────────────────────────────────────
// 2. STAFF AVAILABILITIES
// ────────────────────────────────────────────────────────────

export async function setStaffAvailability(
  tenantId: string,
  memberId: string,
  availabilities: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
): Promise<any> {
  // Verify member exists in the tenant
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  // Validate all inputs
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  for (const entry of availabilities) {
    if (entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
      throw new Error('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }
    if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
      throw new Error('Times must be in HH:MM format');
    }
    const [sh, sm] = entry.startTime.split(':').map(Number);
    const [eh, em] = entry.endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      throw new Error('startTime must be before endTime');
    }
  }

  // Transaction to drop existing and add new to prevent drift
  return await prisma.$transaction(async (tx) => {
    await tx.staffAvailability.deleteMany({
      where: { tenantId, memberId },
    });

    const creations = availabilities.map((entry) =>
      tx.staffAvailability.create({
        data: {
          tenantId,
          memberId,
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        },
      })
    );

    return await Promise.all(creations);
  });
}

export async function getStaffAvailabilities(
  tenantId: string,
  memberId: string
): Promise<any[]> {
  return await prisma.staffAvailability.findMany({
    where: { tenantId, memberId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

// ────────────────────────────────────────────────────────────
// 3. APPOINTMENT BOOKING & VALIDATIONS
// ────────────────────────────────────────────────────────────

export async function bookAppointment(
  tenantId: string,
  data: {
    appointmentTypeId: string;
    hostMemberId: string;
    bookerMemberId?: string;
    bookerName: string;
    bookerEmail: string;
    bookerPhone?: string;
    startAt: Date | string;
    intakeResponsesJson?: any;
  }
): Promise<any> {
  const startAt = new Date(data.startAt);
  if (isNaN(startAt.getTime())) {
    throw new Error('Invalid startAt date');
  }

  // Retrieve details
  const type = await prisma.appointmentType.findFirst({
    where: { id: data.appointmentTypeId, tenantId },
  });
  if (!type) {
    throw new Error('Appointment type not found');
  }
  if (!type.isActive) {
    throw new Error('Appointment type is not active');
  }

  const host = await prisma.member.findFirst({
    where: { id: data.hostMemberId, tenantId },
  });
  if (!host) {
    throw new Error('Host member not found');
  }

  // Compute endAt based on duration
  const endAt = new Date(startAt.getTime() + type.durationMinutes * 60 * 1000);

  // A. Check weekly availability of host
  const dayOfWeek = startAt.getDay(); // 0-6
  const hostAvailabilities = await prisma.staffAvailability.findMany({
    where: { tenantId, memberId: data.hostMemberId, dayOfWeek },
  });

  if (hostAvailabilities.length === 0) {
    throw new Error('Host is not available on this day of the week');
  }

  // Convert time to minutes since midnight
  const startMin = startAt.getHours() * 60 + startAt.getMinutes();
  const endMin = endAt.getHours() * 60 + endAt.getMinutes();

  const isCovered = hostAvailabilities.some((avail) => {
    const [sh, sm] = avail.startTime.split(':').map(Number);
    const [eh, em] = avail.endTime.split(':').map(Number);
    const windowStartMin = sh * 60 + sm;
    const windowEndMin = eh * 60 + em;
    return startMin >= windowStartMin && endMin <= windowEndMin;
  });

  if (!isCovered) {
    throw new Error('Requested time slot is outside the host\'s configured availability windows');
  }

  // B. Check double-booking conflicts (ignore cancelled appointments)
  const overlapping = await prisma.appointment.findFirst({
    where: {
      tenantId,
      hostMemberId: data.hostMemberId,
      status: { not: 'cancelled' },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (overlapping) {
    throw new Error('Host has a double-booking conflict at this time slot');
  }

  // C. Handle Virtual Meet (Module 41)
  let liveMeetingId: string | null = null;
  if (type.isVirtual) {
    const meeting = await createMeeting(tenantId, {
      hostMemberId: data.hostMemberId,
      title: `Virtual Appointment: ${data.bookerName} - ${type.name}`,
      description: `Virtual meeting session scheduled automatically.`,
      scheduledStart: startAt,
      scheduledEnd: endAt,
      meetingType: 'video',
      provider: 'native',
    });
    liveMeetingId = meeting.id;
  }

  // D. CRM Contact Linking & Creation
  let bookerMemberId = data.bookerMemberId || null;
  if (!bookerMemberId) {
    // Check if bookerEmail matches an existing registered member
    const existingMember = await prisma.member.findFirst({
      where: { tenantId, email: data.bookerEmail },
    });
    if (existingMember) {
      bookerMemberId = existingMember.id;
    }
  }

  // Look up or create CRM Contact
  let crmContact = await prisma.crmContact.findFirst({
    where: { tenantId, email: { equals: data.bookerEmail } },
  });

  if (!crmContact) {
    const nameParts = data.bookerName.split(' ');
    const firstName = nameParts[0] || 'Visitor';
    const lastName = nameParts.slice(1).join(' ') || 'Visitor';

    crmContact = await prisma.crmContact.create({
      data: {
        tenantId,
        memberId: bookerMemberId,
        firstName,
        lastName,
        email: data.bookerEmail.toLowerCase().trim(),
        phone: data.bookerPhone || null,
        type: 'visitor',
        status: 'new',
        leadSource: 'website',
        leadSourceDetail: 'Self-scheduled booking',
        firstContactAt: new Date(),
        lastContactAt: new Date(),
      },
    });
  } else {
    // Update CRM contact if member has now been linked
    if (bookerMemberId && !crmContact.memberId) {
      crmContact = await prisma.crmContact.update({
        where: { id: crmContact.id },
        data: { memberId: bookerMemberId, lastContactAt: new Date() },
      });
    } else {
      await prisma.crmContact.update({
        where: { id: crmContact.id },
        data: { lastContactAt: new Date() },
      });
    }
  }

  // Log CRM Timeline Event
  await prisma.crmTimelineEvent.create({
    data: {
      tenantId,
      contactId: crmContact.id,
      type: 'form_submitted',
      title: 'Appointment Booked',
      description: `Booked "${type.name}" with host member ${host.firstName} ${host.lastName}`,
      metadata: JSON.stringify({
        appointmentTypeId: type.id,
        hostMemberId: host.id,
        startAt: startAt.toISOString(),
      }),
    },
  });

  // Create the appointment
  return await prisma.appointment.create({
    data: {
      tenantId,
      appointmentTypeId: type.id,
      hostMemberId: data.hostMemberId,
      bookerMemberId,
      bookerName: data.bookerName,
      bookerEmail: data.bookerEmail.toLowerCase().trim(),
      bookerPhone: data.bookerPhone || null,
      startAt,
      endAt,
      status: 'pending',
      intakeResponsesJson: data.intakeResponsesJson ? JSON.stringify(data.intakeResponsesJson) : null,
      liveMeetingId,
    },
    include: {
      appointmentType: true,
      hostMember: true,
      liveMeeting: true,
    },
  });
}

// ────────────────────────────────────────────────────────────
// 4. RESCHEDULING & CANCELLATIONS
// ────────────────────────────────────────────────────────────

export async function rescheduleAppointment(
  tenantId: string,
  appointmentId: string,
  startAtStr: Date | string,
  requestedByAdminOrHost = false
): Promise<any> {
  const startAt = new Date(startAtStr);
  if (isNaN(startAt.getTime())) {
    throw new Error('Invalid startAt date');
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: { appointmentType: true },
  });
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  if (appointment.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled appointment');
  }

  // Enforce future time for general reschedule requests
  if (!requestedByAdminOrHost && startAt.getTime() < Date.now()) {
    throw new Error('Reschedule date must be in the future');
  }

  const endAt = new Date(startAt.getTime() + appointment.appointmentType.durationMinutes * 60 * 1000);

  // Check Availability
  const dayOfWeek = startAt.getDay();
  const hostAvailabilities = await prisma.staffAvailability.findMany({
    where: { tenantId, memberId: appointment.hostMemberId, dayOfWeek },
  });

  if (hostAvailabilities.length === 0) {
    throw new Error('Host is not available on this day of the week');
  }

  const startMin = startAt.getHours() * 60 + startAt.getMinutes();
  const endMin = endAt.getHours() * 60 + endAt.getMinutes();

  const isCovered = hostAvailabilities.some((avail) => {
    const [sh, sm] = avail.startTime.split(':').map(Number);
    const [eh, em] = avail.endTime.split(':').map(Number);
    const windowStartMin = sh * 60 + sm;
    const windowEndMin = eh * 60 + em;
    return startMin >= windowStartMin && endMin <= windowEndMin;
  });

  if (!isCovered) {
    throw new Error('Requested time slot is outside the host\'s availability windows');
  }

  // Check Overlaps excluding self
  const overlapping = await prisma.appointment.findFirst({
    where: {
      tenantId,
      hostMemberId: appointment.hostMemberId,
      status: { not: 'cancelled' },
      id: { not: appointmentId },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (overlapping) {
    throw new Error('Host has a double-booking conflict at this time slot');
  }

  // Update virtual meeting if exists
  if (appointment.liveMeetingId) {
    await prisma.liveMeeting.update({
      where: { id: appointment.liveMeetingId },
      data: {
        scheduledStart: startAt,
        scheduledEnd: endAt,
      },
    });
  }

  // Update appointment
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      startAt,
      endAt,
      status: 'confirmed', // confirm upon successful rescheduling
    },
    include: {
      appointmentType: true,
      hostMember: true,
      liveMeeting: true,
    },
  });
}

export async function cancelAppointment(
  tenantId: string,
  appointmentId: string,
  requestedByAdminOrHost: boolean
): Promise<any> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
  });
  if (!appointment) {
    throw new Error('Appointment not found');
  }
  if (appointment.status === 'cancelled') {
    return appointment;
  }

  // Check 2-hour window buffer restrict for general bookers
  if (!requestedByAdminOrHost) {
    const timeDiffMs = appointment.startAt.getTime() - Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (timeDiffMs < twoHoursMs) {
      throw new Error('Cancellations must be done at least 2 hours prior to the appointment.');
    }
  }

  // Update virtual meeting status if linked
  if (appointment.liveMeetingId) {
    await prisma.liveMeeting.update({
      where: { id: appointment.liveMeetingId },
      data: { status: 'cancelled' },
    });
  }

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'cancelled' },
  });
}

// ────────────────────────────────────────────────────────────
// 5. SECURITY & PRIVATE COUNSELING NOTES
// ────────────────────────────────────────────────────────────

export async function updatePrivateNotes(
  tenantId: string,
  appointmentId: string,
  requestingMemberId: string,
  isSystemAdmin: boolean,
  notes: string
): Promise<any> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
  });
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Only host pastor or admin can write
  if (!isSystemAdmin && appointment.hostMemberId !== requestingMemberId) {
    throw new Error('Unauthorized to update private counseling notes');
  }

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: { privateNotes: notes },
  });
}

export async function getAppointmentDetails(
  tenantId: string,
  appointmentId: string,
  requestingMemberId?: string,
  isSystemAdmin?: boolean
): Promise<any> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      appointmentType: true,
      hostMember: true,
      liveMeeting: true,
    },
  });
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Redact private notes unless requesting user is host or admin
  const hasAccess = isSystemAdmin || (requestingMemberId && appointment.hostMemberId === requestingMemberId);
  if (!hasAccess) {
    appointment.privateNotes = null;
  }

  return appointment;
}

// ────────────────────────────────────────────────────────────
// 6. SCHEDULING ALERTS / REMINDERS
// ────────────────────────────────────────────────────────────

export async function createAppointmentReminder(
  tenantId: string,
  data: {
    appointmentId: string;
    sendBeforeHours: number;
  }
): Promise<any> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: data.appointmentId, tenantId },
  });
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  return await prisma.appointmentReminder.create({
    data: {
      tenantId,
      appointmentId: data.appointmentId,
      sendBeforeHours: data.sendBeforeHours,
      status: 'pending',
    },
  });
}

export async function triggerAppointmentReminder(
  tenantId: string,
  reminderId: string
): Promise<any> {
  const reminder = await prisma.appointmentReminder.findFirst({
    where: { id: reminderId, tenantId },
  });
  if (!reminder) {
    throw new Error('Reminder not found');
  }

  return await prisma.appointmentReminder.update({
    where: { id: reminderId },
    data: {
      status: 'sent',
      sentAt: new Date(),
    },
  });
}

// ────────────────────────────────────────────────────────────
// 7. ANALYTICAL REPORTING
// ────────────────────────────────────────────────────────────

export async function getBookingReport(tenantId: string): Promise<any> {
  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { appointmentType: true },
  });

  const totalBookings = appointments.length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
  const noShowCount = appointments.filter((a) => a.status === 'no_show').length;

  const noShowRate = totalBookings > 0 ? (noShowCount / totalBookings) * 100 : 0;

  // Type distributions
  const typeMap = new Map<string, number>();
  for (const appt of appointments) {
    const name = appt.appointmentType?.name || 'Unknown';
    typeMap.set(name, (typeMap.get(name) || 0) + 1);
  }

  const typeDistribution = Array.from(typeMap.entries()).map(([typeName, count]) => ({
    typeName,
    count,
  }));

  return {
    totalBookings,
    completedCount,
    cancelledCount,
    noShowCount,
    noShowRate: parseFloat(noShowRate.toFixed(2)),
    typeDistribution,
  };
}
