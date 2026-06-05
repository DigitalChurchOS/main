import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// ADVANCED DIRECTORIES SEARCH
// ─────────────────────────────────────────────────────────────

export async function searchMembers(
  tenantId: string,
  options: {
    search?: string;
    status?: string;
    tagName?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ data: any[]; count: number }> {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    tenantId,
  };

  if (options.status) {
    whereClause.membershipStatus = options.status;
  }

  if (options.tagName) {
    whereClause.tagAssignments = {
      some: {
        tag: {
          name: options.tagName.toLowerCase().trim(),
        },
      },
    };
  }

  if (options.search) {
    const searchClean = options.search.toLowerCase().trim();
    whereClause.OR = [
      { firstName: { contains: searchClean } },
      { lastName: { contains: searchClean } },
      { phone: { contains: searchClean } },
      { email: { contains: searchClean } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.member.findMany({
      where: whereClause,
      include: {
        family: true,
        tagAssignments: {
          include: { tag: true },
        },
      },
      orderBy: { lastName: 'asc' },
      skip,
      take: limit,
    }),
    prisma.member.count({ where: whereClause }),
  ]);

  return { data, count };
}

// ─────────────────────────────────────────────────────────────
// PASTORAL NOTES
// ─────────────────────────────────────────────────────────────

export async function createMemberNote(
  tenantId: string,
  memberId: string,
  authorId: string,
  data: {
    noteText: string;
    category?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.memberNote.create({
    data: {
      tenantId,
      memberId: member.id,
      authorId,
      noteText: data.noteText,
      category: data.category || 'general',
    },
    include: { author: { select: { id: true, email: true } } },
  });
}

export async function listMemberNotes(tenantId: string, memberId: string): Promise<any[]> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.memberNote.findMany({
    where: { tenantId, memberId: member.id },
    include: { author: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// CHRONOLOGICAL CHECK-INS
// ─────────────────────────────────────────────────────────────

export async function createMemberCheckIn(
  tenantId: string,
  memberId: string,
  data: {
    type: string; // service | event | cell | class | other
    targetId: string;
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
      type: data.type.toLowerCase().trim(),
      targetId: data.targetId,
    },
  });
}

export async function listMemberCheckIns(tenantId: string, memberId: string): Promise<any[]> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.memberCheckIn.findMany({
    where: { tenantId, memberId: member.id },
    orderBy: { checkedInAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// CUSTOM MEMBER TAGS
// ─────────────────────────────────────────────────────────────

export async function upsertMemberTag(tenantId: string, name: string): Promise<any> {
  const nameClean = name.toLowerCase().trim();
  
  return await prisma.memberTag.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name: nameClean,
      },
    },
    update: {},
    create: {
      tenantId,
      name: nameClean,
    },
  });
}

export async function assignTagToMember(
  tenantId: string,
  memberId: string,
  tagId: string
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const tag = await prisma.memberTag.findFirst({
    where: { id: tagId, tenantId },
  });
  if (!tag) {
    throw new Error('Member tag not found');
  }

  return await prisma.memberTagAssignment.upsert({
    where: {
      memberId_tagId: {
        memberId: member.id,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      memberId: member.id,
      tagId: tag.id,
    },
    include: { tag: true },
  });
}

export async function removeTagFromMember(
  tenantId: string,
  memberId: string,
  tagId: string
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const assignment = await prisma.memberTagAssignment.findUnique({
    where: {
      memberId_tagId: {
        memberId: member.id,
        tagId,
      },
    },
  });

  if (!assignment) {
    throw new Error('Tag assignment not found');
  }

  return await prisma.memberTagAssignment.delete({
    where: { id: assignment.id },
  });
}

// ─────────────────────────────────────────────────────────────
// FINANCIAL HISTORY INTEGRATION
// ─────────────────────────────────────────────────────────────

export async function getMemberFinancialHistory(
  tenantId: string,
  email: string
): Promise<{
  donations: any[];
  partnerships: any[];
  totalGiven: number;
}> {
  const emailClean = email.toLowerCase().trim();

  const [donations, partnerships] = await Promise.all([
    prisma.donation.findMany({
      where: {
        tenantId,
        donorEmail: emailClean,
        status: 'succeeded',
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partnership.findMany({
      where: {
        tenantId,
        partnerEmail: emailClean,
        status: 'succeeded',
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const donationsSum = donations.reduce((sum, d) => sum + d.amount, 0);
  const partnershipsSum = partnerships.reduce((sum, p) => sum + p.amount, 0);
  const totalGiven = donationsSum + partnershipsSum;

  return {
    donations,
    partnerships,
    totalGiven: Math.round(totalGiven * 100) / 100,
  };
}
