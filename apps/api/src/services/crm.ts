import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
//  ENGAGEMENT SCORE WEIGHTS
// ─────────────────────────────────────────────────────────────
const ENGAGEMENT_WEIGHTS: Record<string, number> = {
  email_sent:          2,
  sms_sent:            2,
  call:                5,
  note:                1,
  stage_change:        3,
  event_attended:     10,
  form_submitted:      5,
  salvation_response: 20,
  course_enrolled:    15,
  check_in:            8,
  giving:             12,
};

// ═══════════════════════════════════════════════════════════════
//  CRM CONTACT SERVICE
// ═══════════════════════════════════════════════════════════════

export async function createContact(
  tenantId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    type?: string;
    leadSource?: string;
    leadSourceDetail?: string;
    notes?: string;
    memberId?: string;
  }
) {
  return prisma.crmContact.create({
    data: {
      tenantId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      type: data.type || 'visitor',
      leadSource: data.leadSource || null,
      leadSourceDetail: data.leadSourceDetail || null,
      notes: data.notes || null,
      memberId: data.memberId || null,
      firstContactAt: new Date(),
      lastContactAt: new Date(),
    },
  });
}

export async function updateContact(
  tenantId: string,
  contactId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    type: string;
    status: string;
    leadSource: string;
    leadSourceDetail: string;
    notes: string;
    memberId: string;
  }>
) {
  // Verify contact belongs to tenant
  const contact = await prisma.crmContact.findFirst({
    where: { id: contactId, tenantId },
  });
  if (!contact) return null;

  return prisma.crmContact.update({
    where: { id: contactId },
    data: {
      ...data,
      lastContactAt: new Date(),
    },
  });
}

export async function getContact(tenantId: string, contactId: string) {
  return prisma.crmContact.findFirst({
    where: { id: contactId, tenantId },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, membershipStatus: true } },
      timeline: { orderBy: { occurredAt: 'desc' }, take: 20 },
      tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function listContacts(
  tenantId: string,
  filters: {
    type?: string;
    status?: string;
    leadSource?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.leadSource) where.leadSource = filters.leadSource;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { email: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.crmContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.crmContact.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteContact(tenantId: string, contactId: string) {
  const contact = await prisma.crmContact.findFirst({
    where: { id: contactId, tenantId },
  });
  if (!contact) return null;

  await prisma.crmContact.delete({ where: { id: contactId } });
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
//  CRM TIMELINE SERVICE
// ═══════════════════════════════════════════════════════════════

export async function addTimelineEvent(
  tenantId: string,
  contactId: string,
  data: {
    type: string;
    title: string;
    description?: string;
    metadata?: string;
    occurredAt?: Date;
  }
) {
  // Verify contact belongs to tenant
  const contact = await prisma.crmContact.findFirst({
    where: { id: contactId, tenantId },
  });
  if (!contact) return null;

  const event = await prisma.crmTimelineEvent.create({
    data: {
      tenantId,
      contactId,
      type: data.type,
      title: data.title,
      description: data.description || null,
      metadata: data.metadata || null,
      occurredAt: data.occurredAt || new Date(),
    },
  });

  // Auto-increment engagement score based on event type
  const weight = ENGAGEMENT_WEIGHTS[data.type] || 1;
  await prisma.crmContact.update({
    where: { id: contactId },
    data: {
      engagementScore: { increment: weight },
      lastContactAt: new Date(),
    },
  });

  return event;
}

export async function getTimeline(
  tenantId: string,
  contactId: string,
  filters: { type?: string; page?: number; limit?: number }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 30;
  const skip = (page - 1) * limit;

  const where: any = { tenantId, contactId };
  if (filters.type) where.type = filters.type;

  const [data, total] = await Promise.all([
    prisma.crmTimelineEvent.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.crmTimelineEvent.count({ where }),
  ]);

  return { data, total, page, limit };
}

// ═══════════════════════════════════════════════════════════════
//  CRM FOLLOW-UP TASKS SERVICE
// ═══════════════════════════════════════════════════════════════

export async function createFollowUpTask(
  tenantId: string,
  contactId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    assignedUserId?: string;
    dueDate?: string;
  }
) {
  // Verify contact belongs to tenant
  const contact = await prisma.crmContact.findFirst({
    where: { id: contactId, tenantId },
  });
  if (!contact) return null;

  return prisma.crmFollowUpTask.create({
    data: {
      tenantId,
      contactId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'normal',
      assignedUserId: data.assignedUserId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
}

export async function updateFollowUpTask(
  tenantId: string,
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    priority: string;
    status: string;
    assignedUserId: string;
    dueDate: string;
  }>
) {
  const task = await prisma.crmFollowUpTask.findFirst({
    where: { id: taskId, tenantId },
  });
  if (!task) return null;

  const updateData: any = { ...data };
  if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
  if (data.status === 'completed') updateData.completedAt = new Date();

  return prisma.crmFollowUpTask.update({
    where: { id: taskId },
    data: updateData,
  });
}

export async function listFollowUpTasks(
  tenantId: string,
  filters: {
    contactId?: string;
    assignedUserId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.contactId) where.contactId = filters.contactId;
  if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;

  const [data, total] = await Promise.all([
    prisma.crmFollowUpTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.crmFollowUpTask.count({ where }),
  ]);

  return { data, total, page, limit };
}

// ═══════════════════════════════════════════════════════════════
//  ENGAGEMENT SCORING SERVICE
// ═══════════════════════════════════════════════════════════════

/**
 * Recalculate a contact's engagement score from all their timeline events.
 * Useful when running a batch recalibration.
 */
export async function recalculateEngagementScore(tenantId: string, contactId: string) {
  const contact = await prisma.crmContact.findFirst({
    where: { id: contactId, tenantId },
  });
  if (!contact) return null;

  const events = await prisma.crmTimelineEvent.findMany({
    where: { contactId },
    select: { type: true },
  });

  let score = 0;
  for (const event of events) {
    score += ENGAGEMENT_WEIGHTS[event.type] || 1;
  }

  return prisma.crmContact.update({
    where: { id: contactId },
    data: { engagementScore: score },
  });
}

/**
 * Get engagement leaderboard — contacts sorted by highest engagement score.
 */
export async function getEngagementLeaderboard(
  tenantId: string,
  filters: { type?: string; limit?: number }
) {
  const where: any = { tenantId };
  if (filters.type) where.type = filters.type;

  return prisma.crmContact.findMany({
    where,
    orderBy: { engagementScore: 'desc' },
    take: filters.limit || 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      type: true,
      status: true,
      engagementScore: true,
      leadSource: true,
      lastContactAt: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//  CRM REPORTS SERVICE
// ═══════════════════════════════════════════════════════════════

/**
 * Get a summary report of CRM health.
 */
export async function getCrmReport(tenantId: string) {
  const [
    totalContacts,
    contactsByStatus,
    contactsByType,
    contactsBySource,
    taskSummary,
    overdueTasks,
    pipelineSummary,
  ] = await Promise.all([
    // Total contacts
    prisma.crmContact.count({ where: { tenantId } }),

    // Contacts grouped by status
    prisma.crmContact.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),

    // Contacts grouped by type
    prisma.crmContact.groupBy({
      by: ['type'],
      where: { tenantId },
      _count: { id: true },
    }),

    // Contacts grouped by lead source
    prisma.crmContact.groupBy({
      by: ['leadSource'],
      where: { tenantId, leadSource: { not: null } },
      _count: { id: true },
    }),

    // Task summary
    prisma.crmFollowUpTask.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    }),

    // Overdue tasks (due before now, not completed)
    prisma.crmFollowUpTask.count({
      where: {
        tenantId,
        status: { in: ['pending', 'in_progress'] },
        dueDate: { lt: new Date() },
      },
    }),

    // Pipeline stage distributions
    prisma.crmPipeline.findMany({
      where: { tenantId },
      include: {
        stages: {
          include: {
            memberCrmStages: {
              where: { status: 'active' },
              select: { id: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    }),
  ]);

  return {
    totalContacts,
    contactsByStatus: contactsByStatus.map((g) => ({
      status: g.status,
      count: g._count.id,
    })),
    contactsByType: contactsByType.map((g) => ({
      type: g.type,
      count: g._count.id,
    })),
    contactsBySource: contactsBySource.map((g) => ({
      source: g.leadSource,
      count: g._count.id,
    })),
    taskSummary: taskSummary.map((g) => ({
      status: g.status,
      count: g._count.id,
    })),
    overdueTasks,
    pipelines: pipelineSummary.map((p) => ({
      id: p.id,
      name: p.name,
      stages: p.stages.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        activeMembers: s.memberCrmStages.length,
      })),
    })),
  };
}
