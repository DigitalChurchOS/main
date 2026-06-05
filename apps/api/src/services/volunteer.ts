import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// PROFILES, DEPARTMENTS & TEAMS
// ─────────────────────────────────────────────────────────────

export async function upsertVolunteerProfile(
  tenantId: string,
  memberId: string,
  data: {
    skills?: string;
    status?: string; // active | inactive | onboarding
    trainingStatus?: string; // untrained | in_training | certified
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.volunteerProfile.upsert({
    where: { memberId },
    update: {
      skills: data.skills,
      status: data.status,
      trainingStatus: data.trainingStatus,
    },
    create: {
      tenantId,
      memberId,
      skills: data.skills,
      status: data.status || 'active',
      trainingStatus: data.trainingStatus || 'untrained',
    },
    include: { member: true },
  });
}

export async function createVolunteerDepartment(
  tenantId: string,
  data: {
    name: string;
    description?: string;
  }
): Promise<any> {
  return await prisma.volunteerDepartment.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description,
    },
  });
}

export async function createVolunteerTeam(
  tenantId: string,
  departmentId: string,
  data: {
    name: string;
    description?: string;
  }
): Promise<any> {
  const dept = await prisma.volunteerDepartment.findFirst({
    where: { id: departmentId, tenantId },
  });
  if (!dept) {
    throw new Error('Volunteer department not found');
  }

  return await prisma.volunteerTeam.create({
    data: {
      tenantId,
      departmentId,
      name: data.name,
      description: data.description,
    },
  });
}

export async function assignTeamMember(
  tenantId: string,
  profileId: string,
  teamId: string,
  role: string = 'volunteer'
): Promise<any> {
  const profile = await prisma.volunteerProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('Volunteer profile not found');
  }

  const team = await prisma.volunteerTeam.findFirst({
    where: { id: teamId, tenantId },
  });
  if (!team) {
    throw new Error('Volunteer team not found');
  }

  return await prisma.volunteerTeamAssignment.upsert({
    where: {
      profileId_teamId: { profileId, teamId },
    },
    update: { role },
    create: {
      tenantId,
      profileId,
      teamId,
      role,
    },
    include: {
      profile: { include: { member: true } },
      team: true,
    },
  });
}

export async function removeTeamMember(
  tenantId: string,
  profileId: string,
  teamId: string
): Promise<any> {
  const assignment = await prisma.volunteerTeamAssignment.findUnique({
    where: {
      profileId_teamId: { profileId, teamId },
    },
  });

  if (!assignment || assignment.tenantId !== tenantId) {
    throw new Error('Team assignment not found');
  }

  return await prisma.volunteerTeamAssignment.delete({
    where: { id: assignment.id },
  });
}

// ─────────────────────────────────────────────────────────────
// AVAILABILITY CALENDAR BLOCKOUT
// ─────────────────────────────────────────────────────────────

export async function blockOutDate(
  tenantId: string,
  profileId: string,
  date: Date,
  reason?: string
): Promise<any> {
  const profile = await prisma.volunteerProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('Volunteer profile not found');
  }

  // Normalize date to day-level resolution (YYYY-MM-DD)
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const blocked = await prisma.volunteerAvailability.upsert({
    where: {
      profileId_blockedDate: {
        profileId,
        blockedDate: normalizedDate,
      },
    },
    update: { reason },
    create: {
      tenantId,
      profileId,
      blockedDate: normalizedDate,
      reason,
    },
  });

  // Auto-decline any scheduled/confirmed assignments on this day
  const startOfDay = new Date(normalizedDate);
  const endOfDay = new Date(normalizedDate);
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.volunteerAssignment.updateMany({
    where: {
      tenantId,
      profileId,
      status: { in: ['scheduled', 'confirmed'] },
      shift: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    },
    data: {
      status: 'declined',
    },
  });

  return blocked;
}

export async function listBlockedDates(tenantId: string, profileId: string): Promise<any[]> {
  return await prisma.volunteerAvailability.findMany({
    where: { tenantId, profileId },
    orderBy: { blockedDate: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// SHIFTS, ROSTERS & SCHEDULE
// ─────────────────────────────────────────────────────────────

export async function createShift(
  tenantId: string,
  data: {
    title: string;
    targetType: string; // service | event | other
    targetId: string;
    startTime: Date;
    endTime: Date;
  }
): Promise<any> {
  if (data.startTime >= data.endTime) {
    throw new Error('Start time must precede end time');
  }

  return await prisma.volunteerShift.create({
    data: {
      tenantId,
      title: data.title,
      targetType: data.targetType.toLowerCase().trim(),
      targetId: data.targetId,
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });
}

export async function assignVolunteerToShift(
  tenantId: string,
  profileId: string,
  shiftId: string,
  teamId: string,
  role: string,
  tasks: string[] = []
): Promise<any> {
  const profile = await prisma.volunteerProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('Volunteer profile not found');
  }

  const shift = await prisma.volunteerShift.findFirst({
    where: { id: shiftId, tenantId },
  });
  if (!shift) {
    throw new Error('Volunteer shift not found');
  }

  const team = await prisma.volunteerTeam.findFirst({
    where: { id: teamId, tenantId },
  });
  if (!team) {
    throw new Error('Volunteer team not found');
  }

  // 1. Check availability blockouts
  const shiftDay = new Date(shift.startTime);
  shiftDay.setHours(0, 0, 0, 0);

  const blocked = await prisma.volunteerAvailability.findUnique({
    where: {
      profileId_blockedDate: {
        profileId,
        blockedDate: shiftDay,
      },
    },
  });

  if (blocked) {
    throw new Error('Volunteer is unavailable on this date');
  }

  // 2. Check double booking / overlaps
  const overlaps = await prisma.volunteerAssignment.findFirst({
    where: {
      tenantId,
      profileId,
      status: { in: ['scheduled', 'confirmed', 'checked_in'] },
      shift: {
        startTime: { lt: shift.endTime },
        endTime: { gt: shift.startTime },
      },
    },
  });

  if (overlaps) {
    throw new Error('Volunteer is already scheduled for an overlapping shift');
  }

  return await prisma.volunteerAssignment.upsert({
    where: {
      profileId_shiftId: { profileId, shiftId },
    },
    update: {
      teamId,
      role,
      status: 'scheduled',
      taskList: JSON.stringify(tasks),
    },
    create: {
      tenantId,
      profileId,
      teamId,
      shiftId,
      role,
      status: 'scheduled',
      taskList: JSON.stringify(tasks),
    },
    include: {
      profile: { include: { member: true } },
      shift: true,
      team: true,
    },
  });
}

export async function respondToShift(
  tenantId: string,
  profileId: string,
  shiftId: string,
  status: 'confirmed' | 'declined'
): Promise<any> {
  const assignment = await prisma.volunteerAssignment.findFirst({
    where: { tenantId, profileId, shiftId },
    include: { shift: true },
  });

  if (!assignment) {
    throw new Error('Shift assignment not found');
  }

  return await prisma.volunteerAssignment.update({
    where: { id: assignment.id },
    data: { status },
    include: {
      profile: { include: { member: true } },
      shift: true,
    },
  });
}

export async function checkInVolunteer(
  tenantId: string,
  profileId: string,
  shiftId: string
): Promise<any> {
  const assignment = await prisma.volunteerAssignment.findFirst({
    where: { tenantId, profileId, shiftId },
  });

  if (!assignment) {
    throw new Error('Shift assignment not found');
  }

  return await prisma.volunteerAssignment.update({
    where: { id: assignment.id },
    data: {
      status: 'checked_in',
      checkedInAt: new Date(),
    },
    include: {
      profile: { include: { member: true } },
      shift: true,
    },
  });
}

/**
 * Sweeps past shifts and updates scheduled/confirmed volunteers who didn't show up to no_show.
 */
export async function markNoShows(tenantId: string, shiftId: string): Promise<any> {
  const shift = await prisma.volunteerShift.findFirst({
    where: { id: shiftId, tenantId },
  });
  if (!shift) {
    throw new Error('Shift not found');
  }

  return await prisma.volunteerAssignment.updateMany({
    where: {
      tenantId,
      shiftId,
      status: { in: ['scheduled', 'confirmed'] },
      checkedInAt: null,
    },
    data: {
      status: 'no_show',
    },
  });
}

export async function listShiftAssignments(tenantId: string, shiftId: string): Promise<any[]> {
  return await prisma.volunteerAssignment.findMany({
    where: { tenantId, shiftId },
    include: {
      profile: { include: { member: true } },
      team: true,
    },
    orderBy: { status: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// TEAM BROADCAST ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────

export async function broadcastAnnouncement(
  tenantId: string,
  authorId: string,
  data: {
    teamId?: string;
    departmentId?: string;
    title: string;
    content: string;
  }
): Promise<any> {
  const author = await prisma.user.findFirst({
    where: { id: authorId, tenantId },
  });
  if (!author) {
    throw new Error('Author not found');
  }

  const announcement = await prisma.volunteerAnnouncement.create({
    data: {
      tenantId,
      teamId: data.teamId,
      departmentId: data.departmentId,
      title: data.title,
      content: data.content,
      sentBy: author.id,
    },
    include: {
      sender: { select: { id: true, email: true } },
    },
  });

  // Simulating the actual broadcast notifications to the volunteers
  let recipientsCount = 0;
  if (data.teamId) {
    recipientsCount = await prisma.volunteerTeamAssignment.count({
      where: { teamId: data.teamId, tenantId },
    });
  } else if (data.departmentId) {
    recipientsCount = await prisma.volunteerTeamAssignment.count({
      where: {
        team: { departmentId: data.departmentId },
        tenantId,
      },
    });
  } else {
    recipientsCount = await prisma.volunteerProfile.count({
      where: { tenantId, status: 'active' },
    });
  }

  console.log(`[VolunteerBroadcast] Sent "${data.title}" to ${recipientsCount} volunteers.`);

  return {
    ...announcement,
    recipientsCount,
  };
}

// ─────────────────────────────────────────────────────────────
// WORKFORCE REPORTS & ANALYTICS
// ─────────────────────────────────────────────────────────────

export interface VolunteerAnalyticsReport {
  leaderboard: {
    profileId: string;
    firstName: string;
    lastName: string;
    shiftsCompleted: number;
    hoursServed: number;
  }[];
  recruitmentRequired: {
    departmentId: string;
    name: string;
    activeVolunteers: number;
  }[];
}

export async function getVolunteerReport(tenantId: string): Promise<VolunteerAnalyticsReport> {
  // 1. serving hours leaderboard
  const checkedInAssignments = await prisma.volunteerAssignment.findMany({
    where: {
      tenantId,
      status: 'checked_in',
    },
    include: {
      profile: { include: { member: true } },
      shift: true,
    },
  });

  const volunteerStats: {
    [profileId: string]: {
      firstName: string;
      lastName: string;
      shiftsCompleted: number;
      hoursServed: number;
    };
  } = {};

  checkedInAssignments.forEach(a => {
    const pid = a.profileId;
    const durMs = a.shift.endTime.getTime() - a.shift.startTime.getTime();
    const hours = Math.round((durMs / (1000 * 60 * 60)) * 10) / 10;

    if (!volunteerStats[pid]) {
      volunteerStats[pid] = {
        firstName: a.profile.member.firstName,
        lastName: a.profile.member.lastName,
        shiftsCompleted: 0,
        hoursServed: 0,
      };
    }

    volunteerStats[pid].shiftsCompleted += 1;
    volunteerStats[pid].hoursServed += hours;
  });

  const leaderboard = Object.keys(volunteerStats).map(pid => ({
    profileId: pid,
    ...volunteerStats[pid],
    hoursServed: Math.round(volunteerStats[pid].hoursServed * 10) / 10,
  })).sort((a, b) => b.hoursServed - a.hoursServed);

  // 2. department recruitment analysis
  const departments = await prisma.volunteerDepartment.findMany({
    where: { tenantId },
    include: {
      teams: {
        include: {
          members: true,
        },
      },
    },
  });

  const recruitmentRequired: { departmentId: string; name: string; activeVolunteers: number }[] = [];

  departments.forEach(d => {
    // Collect unique volunteers assigned to teams in this department
    const uniqueProfiles = new Set<string>();
    d.teams.forEach(t => {
      t.members.forEach(m => uniqueProfiles.add(m.profileId));
    });

    const activeCount = uniqueProfiles.size;
    // Flag if active volunteers < 2
    if (activeCount < 2) {
      recruitmentRequired.push({
        departmentId: d.id,
        name: d.name,
        activeVolunteers: activeCount,
      });
    }
  });

  return {
    leaderboard,
    recruitmentRequired,
  };
}
