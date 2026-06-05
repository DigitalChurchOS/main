import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// REGION MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function createRegion(
  tenantId: string,
  data: { name: string; description?: string }
) {
  return prisma.branchRegion.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
    },
  });
}

export async function listRegions(tenantId: string) {
  return prisma.branchRegion.findMany({
    where: { tenantId },
    include: { branches: { select: { id: true, name: true, status: true } } },
    orderBy: { name: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// BRANCH / CAMPUS CRUD
// ─────────────────────────────────────────────────────────────

export async function createBranch(
  tenantId: string,
  data: {
    name: string;
    timezone?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    regionId?: string;
  }
) {
  return prisma.branch.create({
    data: {
      tenantId,
      name: data.name,
      timezone: data.timezone || 'UTC',
      description: data.description || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      postalCode: data.postalCode || null,
      phone: data.phone || null,
      email: data.email || null,
      logoUrl: data.logoUrl || null,
      coverImageUrl: data.coverImageUrl || null,
      regionId: data.regionId || null,
    },
    include: { region: true },
  });
}

export async function updateBranch(
  tenantId: string,
  branchId: string,
  data: Record<string, any>
) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId },
  });
  if (!branch) throw new Error('Branch not found');

  return prisma.branch.update({
    where: { id: branchId },
    data,
    include: { region: true, branchLeaders: true },
  });
}

export async function listBranches(tenantId: string, regionId?: string) {
  const where: any = { tenantId };
  if (regionId) where.regionId = regionId;

  return prisma.branch.findMany({
    where,
    include: {
      region: true,
      branchLeaders: { include: { user: { select: { id: true, email: true } } } },
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getBranch(tenantId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId },
    include: {
      region: true,
      branchLeaders: {
        include: { user: { select: { id: true, email: true } } },
      },
      _count: { select: { members: true } },
    },
  });
  if (!branch) throw new Error('Branch not found');
  return branch;
}

// ─────────────────────────────────────────────────────────────
// BRANCH LEADERSHIP
// ─────────────────────────────────────────────────────────────

export async function assignBranchLeader(
  tenantId: string,
  branchId: string,
  userId: string,
  role: string
) {
  // Verify branch exists
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId },
  });
  if (!branch) throw new Error('Branch not found');

  // Verify user exists
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
  if (!user) throw new Error('User not found');

  // Check for existing assignment (unique constraint: branchId + userId)
  const existing = await prisma.branchLeader.findUnique({
    where: { branchId_userId: { branchId, userId } },
  });
  if (existing) {
    // Update the role
    return prisma.branchLeader.update({
      where: { id: existing.id },
      data: { role },
      include: { user: { select: { id: true, email: true } }, branch: { select: { id: true, name: true } } },
    });
  }

  return prisma.branchLeader.create({
    data: { tenantId, branchId, userId, role },
    include: { user: { select: { id: true, email: true } }, branch: { select: { id: true, name: true } } },
  });
}

export async function removeBranchLeader(tenantId: string, leaderId: string) {
  const leader = await prisma.branchLeader.findFirst({
    where: { id: leaderId, tenantId },
  });
  if (!leader) throw new Error('Branch leader assignment not found');

  return prisma.branchLeader.delete({ where: { id: leaderId } });
}

// ─────────────────────────────────────────────────────────────
// BRANCH-SCOPED MEMBER QUERIES
// ─────────────────────────────────────────────────────────────

export async function getBranchMembers(tenantId: string, branchId: string) {
  return prisma.member.findMany({
    where: { tenantId, branchId },
    orderBy: { lastName: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// BRANCH-LEVEL ANALYTICS
// ─────────────────────────────────────────────────────────────

export async function getBranchAnalytics(tenantId: string, branchId: string) {
  // Verify branch exists
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, tenantId },
  });
  if (!branch) throw new Error('Branch not found');

  const memberCount = await prisma.member.count({
    where: { tenantId, branchId },
  });

  // Count donations linked to members of this branch
  const branchMembers = await prisma.member.findMany({
    where: { tenantId, branchId, email: { not: null } },
    select: { email: true },
  });
  const memberEmails = branchMembers.map((m) => m.email).filter(Boolean) as string[];

  let totalGiving = 0;
  if (memberEmails.length > 0) {
    const donations = await prisma.donation.aggregate({
      where: { tenantId, donorEmail: { in: memberEmails }, status: 'succeeded' },
      _sum: { amount: true },
    });
    totalGiving = donations._sum.amount || 0;
  }

  // Count events (if events have branchId — fallback to tenant-level count)
  const eventCount = await prisma.event.count({
    where: { tenantId },
  });

  return {
    branchId,
    branchName: branch.name,
    memberCount,
    totalGiving,
    eventCount,
  };
}

// ─────────────────────────────────────────────────────────────
// CENTRAL ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────

export async function getCentralDashboard(tenantId: string) {
  // Get all branches with member counts
  const branches = await prisma.branch.findMany({
    where: { tenantId },
    include: {
      region: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Total members across all branches
  const totalMembers = await prisma.member.count({ where: { tenantId } });

  // Unassigned members (no branchId)
  const unassignedMembers = await prisma.member.count({
    where: { tenantId, branchId: null },
  });

  // Total giving across entire ministry
  const totalGivingResult = await prisma.donation.aggregate({
    where: { tenantId, status: 'succeeded' },
    _sum: { amount: true },
  });
  const totalGiving = totalGivingResult._sum.amount || 0;

  // Branch summary breakdown
  const branchSummaries = branches.map((b) => ({
    id: b.id,
    name: b.name,
    status: b.status,
    region: b.region ? b.region.name : null,
    memberCount: b._count.members,
  }));

  return {
    totalBranches: branches.length,
    totalMembers,
    unassignedMembers,
    totalGiving,
    branches: branchSummaries,
  };
}
