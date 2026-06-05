import prisma from '../lib/prisma';
import { SettingsService } from './settings';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function generateId(): string {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

async function getModuleSettingsSafe(tenantId: string): Promise<Record<string, any>> {
  try {
    return await SettingsService.getSettingsForModule(tenantId, 'salvation-new-believer-journey');
  } catch (e) {
    // Fallback if settings registry isn't fully active
    return {
      enabled: true,
      allowPublicSalvationFlow: true,
      allowLivestreamSalvationButton: true,
      allowEventSalvationFlow: true,
      allowGuestResponses: true,
      defaultPrayerText: 'Dear Lord Jesus...',
      defaultCellAssignmentMode: 'manual',
      careTeamRoutingMode: 'manual',
      requireFollowUpConsent: true,
      autoCreateMemberProfile: true,
      autoAssignCareTeam: false,
      autoEnrollLmsCourse: false,
      autoAssignBiblePlan: false,
      autoAssignCellGroup: false,
      journeyDurationDays: 30,
      flows: [],
      sequences: [],
      tasks: [],
    };
  }
}

async function saveModuleSettingsSafe(tenantId: string, settings: Record<string, any>): Promise<void> {
  await prisma.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'salvation-new-believer-journey' } },
    create: {
      tenantId,
      moduleKey: 'salvation-new-believer-journey',
      settings: JSON.stringify(settings),
    },
    update: {
      settings: JSON.stringify(settings),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 1. SALVATION RESPONSE & ONBOARDING AUTOMATIONS
// ─────────────────────────────────────────────────────────────

export async function registerSalvationResponse(
  tenantId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    source: string; // livestream | physical_service | funnel | web
    serviceId?: string;
    funnelId?: string;
    preferredLanguage?: string;
    gender?: string;
    age?: number;
    location?: string;
    consentFollowUp?: boolean;
    flowSlug?: string;
    decisionType?: string;
    prayerCompleted?: boolean;
    notes?: string;
  }
): Promise<any> {
  if (!data.firstName || !data.lastName || !data.email || !data.source) {
    throw new Error('firstName, lastName, email, and source are required');
  }

  // 1. Fetch module settings
  const settings = await getModuleSettingsSafe(tenantId);
  if (settings.enabled === false) {
    throw new Error('Salvation & New Believer Journey module is disabled');
  }

  // If public registration flow, verify gating checks
  if (data.source !== 'manual' && settings.allowPublicSalvationFlow === false) {
    throw new Error('Public salvation flows are not enabled for this church');
  }

  // 2. Find or create Member profile
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
        preferredLanguage: data.preferredLanguage || 'en',
      },
    });
  }

  // 3. Create AltarCallResponse to track response entry
  const response = await prisma.altarCallResponse.create({
    data: {
      tenantId,
      memberId: member.id,
      visitorName: `${data.firstName} ${data.lastName}`,
      visitorEmail: data.email.toLowerCase().trim(),
      visitorPhone: data.phone || null,
      responseType: 'salvation',
      livestreamId: data.source === 'livestream' ? data.serviceId || null : null,
      counselorId: null,
    },
  });

  // Check if they already have a New Believer Profile
  let profile = await prisma.newBelieverProfile.findUnique({
    where: { memberId: member.id },
  });

  if (profile) {
    return profile;
  }

  // 4. Automated Demographic Care Agent Routing
  let agentId = null;
  if (settings.autoAssignCareTeam) {
    const leader = await prisma.member.findFirst({
      where: { tenantId, membershipStatus: 'leader' },
    });
    if (leader) agentId = leader.id;
  }

  // 5. Create New Believer Profile
  profile = await prisma.newBelieverProfile.create({
    data: {
      tenantId,
      memberId: member.id,
      source: data.source,
      serviceId: data.serviceId || null,
      funnelId: data.funnelId || null,
      assignedAgentId: agentId,
      welcomeSentAt: new Date(), // Immediate Pastor Welcome (triggered/mocked)
      followUpStartedAt: new Date(),
      bibleReadingPlanStartedAt: settings.autoAssignBiblePlan ? new Date() : null,
      lmsEnrolledAt: settings.autoEnrollLmsCourse ? new Date() : null,
      cellId: data.location ? `cell-${data.location.toLowerCase().replace(/\s+/g, '-')}` : 'cell-virtual-default',
    },
  });

  // 6. Enforce follow-up sequence rules and task reminder setups
  const day7Date = new Date();
  day7Date.setDate(day7Date.getDate() + 7);

  const day30Date = new Date();
  day30Date.setDate(day30Date.getDate() + 30);

  await prisma.newBelieverReminder.createMany({
    data: [
      {
        profileId: profile.id,
        reminderType: 'day7',
        scheduledFor: day7Date,
        status: 'pending',
      },
      {
        profileId: profile.id,
        reminderType: 'day30',
        scheduledFor: day30Date,
        status: 'pending',
      },
    ],
  });

  // Increment Salvation response count on ChurchService if linked
  if (data.serviceId) {
    try {
      await prisma.churchService.update({
        where: { id: data.serviceId },
        data: {
          salvationCount: { increment: 1 },
        },
      });
    } catch (e) {
      // Ignore if service doesn't exist or is not churchService model
    }
  }

  return await prisma.newBelieverProfile.findUnique({
    where: { id: profile.id },
    include: {
      member: true,
      assignedAgent: true,
      reminders: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. MILESTONE & PROGRESS TRACKING
// ─────────────────────────────────────────────────────────────

export async function recordBaptism(tenantId: string, profileId: string, baptismDate: Date): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  return await prisma.newBelieverProfile.update({
    where: { id: profile.id },
    data: {
      isBaptized: true,
      baptismDate: new Date(baptismDate),
    },
  });
}

export async function updateMilestone(
  tenantId: string,
  profileId: string,
  milestone: 'joinedGroup' | 'finishedClass',
  value: boolean
): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  const updateData: any = {};
  updateData[milestone] = value;

  if (milestone === 'finishedClass' && value) {
    updateData.lmsCompletedAt = new Date();
  } else if (milestone === 'finishedClass' && !value) {
    updateData.lmsCompletedAt = null;
  }

  return await prisma.newBelieverProfile.update({
    where: { id: profile.id },
    data: updateData,
  });
}

export async function getNewBelieverProfile(tenantId: string, memberId: string): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { memberId, tenantId },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      assignedAgent: {
        select: { id: true, firstName: true, lastName: true },
      },
      reminders: true,
    },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  return profile;
}

export async function listNewBelievers(tenantId: string, filters: any = {}): Promise<any[]> {
  const whereClause: any = { tenantId };

  if (filters.source) {
    whereClause.source = filters.source;
  }
  if (filters.assignedAgentId) {
    whereClause.assignedAgentId = filters.assignedAgentId;
  }

  return await prisma.newBelieverProfile.findMany({
    where: whereClause,
    include: {
      member: true,
      assignedAgent: true,
      reminders: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 3. CARE TEAM REMINDERS
// ─────────────────────────────────────────────────────────────

export async function completeReminder(tenantId: string, reminderId: string, notes?: string): Promise<any> {
  const reminder = await prisma.newBelieverReminder.findFirst({
    where: {
      id: reminderId,
      profile: { tenantId },
    },
  });
  if (!reminder) {
    throw new Error('Reminder not found');
  }

  return await prisma.newBelieverReminder.update({
    where: { id: reminder.id },
    data: {
      completedAt: new Date(),
      status: 'completed',
      notes: notes || null,
    },
  });
}

export async function listPendingReminders(tenantId: string, assignedAgentId?: string): Promise<any[]> {
  const whereClause: any = {
    status: 'pending',
    profile: { tenantId },
  };

  if (assignedAgentId) {
    whereClause.profile.assignedAgentId = assignedAgentId;
  }

  return await prisma.newBelieverReminder.findMany({
    where: whereClause,
    include: {
      profile: {
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. RESOURCE RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────

export function getSalvationResources(): any[] {
  return [
    {
      title: 'Free Digital Holy Bible',
      description: 'An introductory guide with translations optimized for new believers.',
      downloadUrl: 'https://cdn.church.org/pdf/new-believer-bible.pdf',
      estimatedReadTime: '14 days reading plan',
    },
    {
      title: 'Foundation School Student Guide',
      description: 'The complete syllabus detailing repentance, grace, faith, and salvation.',
      downloadUrl: 'https://cdn.church.org/pdf/foundation-school-guide.pdf',
      estimatedReadTime: '4 modules',
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// 5. COMPLETION REPORTS & ANALYTICS
// ─────────────────────────────────────────────────────────────

export async function getSalvationCompletionReport(tenantId: string): Promise<any> {
  const profiles = await prisma.newBelieverProfile.findMany({
    where: { tenantId },
  });

  const totalConverts = profiles.length;
  const welcomedCount = profiles.filter((p) => p.welcomeSentAt !== null).length;
  const lmsEnrolled = profiles.filter((p) => p.lmsEnrolledAt !== null).length;
  const lmsCompleted = profiles.filter((p) => p.lmsCompletedAt !== null).length;
  const baptized = profiles.filter((p) => p.isBaptized).length;
  const joinedGroup = profiles.filter((p) => p.joinedGroup).length;
  const finishedClass = profiles.filter((p) => p.finishedClass).length;

  // Source distribution
  const sourceDistribution: Record<string, number> = {};
  profiles.forEach((p) => {
    sourceDistribution[p.source] = (sourceDistribution[p.source] || 0) + 1;
  });

  const bySource = Object.entries(sourceDistribution).map(([source, count]) => ({
    source,
    count,
  }));

  // Calculate conversion rates
  const lmsCompletionRate = lmsEnrolled > 0 ? parseFloat(((lmsCompleted / lmsEnrolled) * 100).toFixed(1)) : 0;
  const baptismRate = totalConverts > 0 ? parseFloat(((baptized / totalConverts) * 100).toFixed(1)) : 0;

  return {
    totalConverts,
    welcomedCount,
    lmsEnrolled,
    lmsCompleted,
    baptized,
    joinedGroup,
    finishedClass,
    lmsCompletionRate,
    baptismRate,
    bySource,
  };
}

// ─────────────────────────────────────────────────────────────
// 6. ADAPTERS (LMS, Bible Plan, Cell, Care Team)
// ─────────────────────────────────────────────────────────────

export async function assignBiblePlan(tenantId: string, profileId: string, planId: string): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  await prisma.newBelieverProfile.update({
    where: { id: profileId },
    data: {
      bibleReadingPlanStartedAt: new Date(),
    },
  });

  // Mock reading plan enrollment
  return {
    status: 'assigned',
    planId,
    profileId,
    assignedAt: new Date(),
  };
}

export async function enrollLmsCourse(tenantId: string, profileId: string, courseId: string): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  await prisma.newBelieverProfile.update({
    where: { id: profileId },
    data: {
      lmsEnrolledAt: new Date(),
    },
  });

  // Create enrollment record if tables exist
  try {
    await prisma.lmsEnrollment.create({
      data: {
        tenantId,
        courseId,
        memberId: profile.memberId,
        status: 'enrolled',
      },
    });
  } catch (e) {
    // Ignore if unique constraint or error
  }

  return {
    status: 'enrolled',
    courseId,
    profileId,
    enrolledAt: new Date(),
  };
}

export async function assignCellGroup(tenantId: string, profileId: string, cellGroupId: string): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  await prisma.newBelieverProfile.update({
    where: { id: profileId },
    data: {
      cellId: cellGroupId,
      joinedGroup: true,
    },
  });

  // Create group member record
  try {
    await prisma.groupMember.create({
      data: {
        tenantId,
        groupId: cellGroupId,
        memberId: profile.memberId,
        role: 'member',
        status: 'active',
      },
    });
  } catch (e) {
    // Ignore
  }

  return {
    status: 'assigned',
    cellGroupId,
    profileId,
    assignedAt: new Date(),
  };
}

export async function assignCareTeam(tenantId: string, profileId: string, assignedAgentId: string): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  return await prisma.newBelieverProfile.update({
    where: { id: profileId },
    data: {
      assignedAgentId,
    },
    include: {
      assignedAgent: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 7. FLOW BUILDER
// ─────────────────────────────────────────────────────────────

export async function listSalvationFlows(tenantId: string): Promise<any[]> {
  const settings = await getModuleSettingsSafe(tenantId);
  return settings.flows || [];
}

export async function getPublicFlow(tenantId: string, flowSlug: string): Promise<any> {
  const settings = await getModuleSettingsSafe(tenantId);
  if (settings.enabled === false || settings.allowPublicSalvationFlow === false) {
    throw new Error('Public salvation flows are not enabled for this church');
  }

  const flows = settings.flows || [];
  const flow = flows.find((f: any) => f.slug === flowSlug);
  if (!flow) {
    throw new Error('Salvation flow not found');
  }

  if (flow.status !== 'published') {
    throw new Error('Salvation flow is not published');
  }

  return flow;
}

export async function createSalvationFlow(tenantId: string, data: any): Promise<any> {
  const settings = await getModuleSettingsSafe(tenantId);
  const flows = settings.flows || [];

  const newFlow = {
    id: generateId(),
    title: data.title || 'Welcome Home',
    slug: data.slug || 'welcome-home',
    description: data.description || '',
    prayerText: data.prayerText || settings.defaultPrayerText || 'Dear Lord Jesus...',
    introText: data.introText || 'We are glad you made this decision.',
    confirmationText: data.confirmationText || 'Thank you for responding!',
    buttonLabel: data.buttonLabel || 'Accept Christ',
    visibility: data.visibility || 'public',
    status: data.status || 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  flows.push(newFlow);
  settings.flows = flows;
  await saveModuleSettingsSafe(tenantId, settings);

  return newFlow;
}

export async function updateSalvationFlow(tenantId: string, id: string, data: any): Promise<any> {
  const settings = await getModuleSettingsSafe(tenantId);
  const flows = settings.flows || [];
  const idx = flows.findIndex((f: any) => f.id === id);
  if (idx === -1) {
    throw new Error('Salvation flow not found');
  }

  flows[idx] = {
    ...flows[idx],
    ...data,
    updatedAt: new Date(),
  };

  settings.flows = flows;
  await saveModuleSettingsSafe(tenantId, settings);

  return flows[idx];
}

export async function deleteSalvationFlow(tenantId: string, id: string): Promise<void> {
  const settings = await getModuleSettingsSafe(tenantId);
  const flows = settings.flows || [];
  const filtered = flows.filter((f: any) => f.id !== id);

  settings.flows = filtered;
  await saveModuleSettingsSafe(tenantId, settings);
}

export async function publishSalvationFlow(tenantId: string, id: string): Promise<any> {
  return await updateSalvationFlow(tenantId, id, { status: 'published', publishedAt: new Date() });
}
