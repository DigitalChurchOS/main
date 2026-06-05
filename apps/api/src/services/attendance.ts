import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// QR CODE GENERATION & VALIDATION
// ─────────────────────────────────────────────────────────────

/**
 * Generates a base64 encoded check-in token for a member.
 */
export async function generateCheckInToken(tenantId: string, memberId: string): Promise<string> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const payload = {
    memberId: member.id,
    tenantId,
    timestamp: Date.now(),
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decodes a scanned QR token and logs the member check-in.
 */
export async function qrCheckIn(
  tenantId: string,
  token: string,
  options: {
    type: string; // service | event | cell | class | volunteer | other
    targetId: string;
    kioskId?: string;
  }
): Promise<any> {
  let payload: { memberId: string; tenantId: string; timestamp: number };
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    payload = JSON.parse(decoded);
  } catch (err) {
    throw new Error('Invalid QR token format');
  }

  if (payload.tenantId !== tenantId) {
    throw new Error('Token belongs to a different tenant');
  }

  // Token freshness check: 24 hour expiry window
  const expirationMs = 24 * 60 * 60 * 1000;
  if (Date.now() - payload.timestamp > expirationMs) {
    throw new Error('QR token has expired');
  }

  const member = await prisma.member.findFirst({
    where: { id: payload.memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  // Check if they are already checked in to the exact target on this day to avoid duplicates
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await prisma.memberCheckIn.findFirst({
    where: {
      tenantId,
      memberId: member.id,
      type: options.type.toLowerCase().trim(),
      targetId: options.targetId,
      checkedInAt: {
        gte: startOfDay,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.memberCheckIn.create({
    data: {
      tenantId,
      memberId: member.id,
      type: options.type.toLowerCase().trim(),
      targetId: options.targetId,
      kioskId: options.kioskId,
    },
    include: {
      member: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// MANUAL CHECK-IN
// ─────────────────────────────────────────────────────────────

export async function manualCheckIn(
  tenantId: string,
  memberId: string,
  options: {
    type: string;
    targetId: string;
    checkedInById?: string;
    allergies?: string;
    securityCode?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.memberCheckIn.create({
    data: {
      tenantId,
      memberId: member.id,
      type: options.type.toLowerCase().trim(),
      targetId: options.targetId,
      checkedInById: options.checkedInById,
      allergies: options.allergies,
      securityCode: options.securityCode,
    },
    include: {
      member: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// MOBILE / FAMILY CHECK-IN
// ─────────────────────────────────────────────────────────────

export async function familyCheckIn(
  tenantId: string,
  parentId: string,
  childIds: string[],
  options: {
    type: string;
    targetId: string;
  }
): Promise<any[]> {
  // Verify parent exists
  const parent = await prisma.member.findFirst({
    where: { id: parentId, tenantId },
  });
  if (!parent) {
    throw new Error('Parent member not found');
  }

  if (!parent.familyId) {
    throw new Error('Parent is not associated with any family');
  }

  // Generate matching security code
  const codeSuffix = Math.floor(1000 + Math.random() * 9000);
  const securityCode = `SEC-${codeSuffix}`;

  const checkIns: any[] = [];

  for (const childId of childIds) {
    const child = await prisma.member.findFirst({
      where: {
        id: childId,
        tenantId,
        familyId: parent.familyId,
      },
    });

    if (!child) {
      throw new Error(`Child member ${childId} not found or does not belong to the same family`);
    }

    // Try to auto-detect allergies from child's notes
    // Scan child's MemberNotes for any general/counseling/other log mentioning allergy/allergies
    const notes = await prisma.memberNote.findMany({
      where: {
        tenantId,
        memberId: child.id,
      },
    });

    let allergyWarning: string | undefined;
    const allergyNote = notes.find(n => 
      n.noteText.toLowerCase().includes('allergy') || 
      n.noteText.toLowerCase().includes('allergies') || 
      n.noteText.toLowerCase().includes('allergic')
    );

    if (allergyNote) {
      allergyWarning = allergyNote.noteText;
    }

    const checkIn = await prisma.memberCheckIn.create({
      data: {
        tenantId,
        memberId: child.id,
        type: options.type.toLowerCase().trim(),
        targetId: options.targetId,
        securityCode,
        checkedInById: parent.id,
        allergies: allergyWarning || 'None reported',
      },
      include: {
        member: true,
      },
    });

    checkIns.push(checkIn);
  }

  return checkIns;
}

// ─────────────────────────────────────────────────────────────
// ABSENCE TRACKING
// ─────────────────────────────────────────────────────────────

export interface AbsenceAlert {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  lastCheckedIn: Date | null;
  weeksAbsent: number;
}

/**
 * Identifies consistent members who have missed the last 3 weeks.
 * Consistent is defined as having checked in at least twice prior to the 3-week window.
 */
export async function getAbsenceAlerts(
  tenantId: string,
  options: {
    type?: string;
    weeksLimit?: number;
  }
): Promise<AbsenceAlert[]> {
  const weeksLimit = options.weeksLimit || 3;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeksLimit * 7);

  // 1. Fetch all members in tenant
  const members = await prisma.member.findMany({
    where: { tenantId },
  });

  const alerts: AbsenceAlert[] = [];

  for (const m of members) {
    const typeFilter = options.type ? options.type.toLowerCase().trim() : undefined;

    // Build query for checkins of type (if specified)
    const checkInFilter: any = {
      tenantId,
      memberId: m.id,
    };
    if (typeFilter) {
      checkInFilter.type = typeFilter;
    }

    // Query past check-ins (before cutoff) to see if they were consistent
    const priorCheckIns = await prisma.memberCheckIn.count({
      where: {
        ...checkInFilter,
        checkedInAt: {
          lt: cutoffDate,
        },
      },
    });

    // Consistent = checked in at least twice in the past
    if (priorCheckIns >= 2) {
      // Check if they checked in within the active window (since cutoffDate)
      const recentCheckInCount = await prisma.memberCheckIn.count({
        where: {
          ...checkInFilter,
          checkedInAt: {
            gte: cutoffDate,
          },
        },
      });

      if (recentCheckInCount === 0) {
        // Find their absolute last check-in date
        const lastCheckIn = await prisma.memberCheckIn.findFirst({
          where: checkInFilter,
          orderBy: {
            checkedInAt: 'desc',
          },
        });

        const lastDate = lastCheckIn ? lastCheckIn.checkedInAt : null;
        let weeksAbsent = weeksLimit;
        if (lastDate) {
          const diffMs = Date.now() - lastDate.getTime();
          weeksAbsent = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
        }

        alerts.push({
          memberId: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          lastCheckedIn: lastDate,
          weeksAbsent,
        });
      }
    }
  }

  // Sort by weeks absent descending
  return alerts.sort((a, b) => b.weeksAbsent - a.weeksAbsent);
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE REPORTS
// ─────────────────────────────────────────────────────────────

export interface AttendanceReport {
  totalCheckIns: number;
  averageCheckIns: number;
  growthRate: number; // percentage growth comparing current period to previous period of same length
  dailyBreakdown: { date: string; count: number }[];
}

export async function getAttendanceReport(
  tenantId: string,
  options: {
    type?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<AttendanceReport> {
  const endDate = options.endDate || new Date();
  const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days default

  const durationMs = endDate.getTime() - startDate.getTime();
  const prevPeriodStartDate = new Date(startDate.getTime() - durationMs);

  const whereClause: any = {
    tenantId,
    checkedInAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (options.type) {
    whereClause.type = options.type.toLowerCase().trim();
  }
  if (options.targetId) {
    whereClause.targetId = options.targetId;
  }

  // Get current period check-ins
  const checkIns = await prisma.memberCheckIn.findMany({
    where: whereClause,
    orderBy: { checkedInAt: 'asc' },
  });

  // Group by day YYYY-MM-DD
  const dailyMap: { [key: string]: number } = {};
  checkIns.forEach(c => {
    const dayStr = c.checkedInAt.toISOString().split('T')[0];
    dailyMap[dayStr] = (dailyMap[dayStr] || 0) + 1;
  });

  const dailyBreakdown = Object.keys(dailyMap).map(date => ({
    date,
    count: dailyMap[date],
  }));

  const totalCheckIns = checkIns.length;
  const uniqueDays = Object.keys(dailyMap).length;
  const averageCheckIns = uniqueDays > 0 ? Math.round((totalCheckIns / uniqueDays) * 10) / 10 : 0;

  // Get previous period check-ins to compute growth
  const prevWhereClause = {
    ...whereClause,
    checkedInAt: {
      gte: prevPeriodStartDate,
      lt: startDate,
    },
  };

  const prevCheckInCount = await prisma.memberCheckIn.count({
    where: prevWhereClause,
  });

  let growthRate = 0;
  if (prevCheckInCount > 0) {
    growthRate = Math.round(((totalCheckIns - prevCheckInCount) / prevCheckInCount) * 1000) / 10;
  } else if (totalCheckIns > 0) {
    growthRate = 100.0;
  }

  return {
    totalCheckIns,
    averageCheckIns,
    growthRate,
    dailyBreakdown,
  };
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE EXPORT (CSV DATA SOURCE)
// ─────────────────────────────────────────────────────────────

export interface ExportedCheckIn {
  checkInId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  type: string;
  targetId: string;
  checkedInAt: string;
  securityCode: string | null;
  allergies: string | null;
  checkedInByName: string | null;
}

export async function exportAttendance(
  tenantId: string,
  options: {
    type?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ExportedCheckIn[]> {
  const whereClause: any = { tenantId };

  if (options.type) {
    whereClause.type = options.type.toLowerCase().trim();
  }
  if (options.targetId) {
    whereClause.targetId = options.targetId;
  }
  if (options.startDate || options.endDate) {
    whereClause.checkedInAt = {};
    if (options.startDate) {
      whereClause.checkedInAt.gte = options.startDate;
    }
    if (options.endDate) {
      whereClause.checkedInAt.lte = options.endDate;
    }
  }

  const checkIns = await prisma.memberCheckIn.findMany({
    where: whereClause,
    include: {
      member: true,
    },
    orderBy: { checkedInAt: 'desc' },
  });

  // Pull parent names if checkedInById exists
  const parentIds = checkIns.map(c => c.checkedInById).filter(Boolean) as string[];
  const parents = parentIds.length > 0 ? await prisma.member.findMany({
    where: { id: { in: parentIds }, tenantId },
  }) : [];

  const parentMap = new Map(parents.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

  return checkIns.map(c => {
    return {
      checkInId: c.id,
      memberId: c.memberId,
      firstName: c.member.firstName,
      lastName: c.member.lastName,
      email: c.member.email,
      type: c.type,
      targetId: c.targetId,
      checkedInAt: c.checkedInAt.toISOString(),
      securityCode: c.securityCode,
      allergies: c.allergies,
      checkedInByName: c.checkedInById ? (parentMap.get(c.checkedInById) || 'Unknown Parent') : null,
    };
  });
}
