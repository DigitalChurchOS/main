import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// CAMPAIGN CRUD
// ─────────────────────────────────────────────────────────────

export async function createCampaign(
  tenantId: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    goalAmount: number;
    currency?: string;
    coverImageUrl?: string;
    videoUrl?: string;
    endsAt?: Date;
  }
): Promise<any> {
  // Validate unique slug
  const existing = await prisma.campaign.findFirst({
    where: { tenantId, slug: data.slug },
  });
  if (existing) {
    throw new Error('Campaign slug already exists');
  }

  return await prisma.campaign.create({
    data: {
      tenantId,
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      goalAmount: data.goalAmount,
      currency: data.currency || 'USD',
      coverImageUrl: data.coverImageUrl || null,
      videoUrl: data.videoUrl || null,
      endsAt: data.endsAt || null,
      status: 'active',
    },
  });
}

export async function getCampaign(idOrSlug: string, tenantId: string): Promise<any> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      tenantId,
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug },
      ],
    },
  });
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  return campaign;
}

export async function listCampaigns(tenantId: string, status?: string): Promise<any[]> {
  return await prisma.campaign.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateCampaign(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    description?: string;
    goalAmount?: number;
    status?: string;
    coverImageUrl?: string;
    videoUrl?: string;
    endsAt?: Date | null;
  }
): Promise<any> {
  await getCampaign(id, tenantId);

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.goalAmount !== undefined) updateData.goalAmount = data.goalAmount;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
  if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;

  return await prisma.campaign.update({
    where: { id },
    data: updateData,
  });
}

export async function closeCampaign(id: string, tenantId: string): Promise<any> {
  await getCampaign(id, tenantId);
  return await prisma.campaign.update({
    where: { id },
    data: { status: 'ended' },
  });
}

// ─────────────────────────────────────────────────────────────
// CAMPAIGN TIMELINE UPDATES
// ─────────────────────────────────────────────────────────────

export async function addCampaignUpdate(
  tenantId: string,
  campaignId: string,
  data: {
    title: string;
    content: string;
  }
): Promise<any> {
  // Validate campaign exists
  await getCampaign(campaignId, tenantId);

  return await prisma.campaignUpdate.create({
    data: {
      tenantId,
      campaignId,
      title: data.title,
      content: data.content,
    },
  });
}

export async function listCampaignUpdates(campaignId: string, tenantId: string): Promise<any[]> {
  await getCampaign(campaignId, tenantId);
  return await prisma.campaignUpdate.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// SUPPORTER RECORDS LEDGER
// ─────────────────────────────────────────────────────────────

export async function getCampaignSupporters(
  campaignId: string,
  tenantId: string
): Promise<any[]> {
  await getCampaign(campaignId, tenantId);

  // 1. Fetch succeeded donations linked to campaign
  const donations = await prisma.donation.findMany({
    where: { campaignId, status: 'succeeded' },
  });

  // 2. Fetch succeeded partnerships linked to campaign
  const partnerships = await prisma.partnership.findMany({
    where: { campaignId, status: 'succeeded' },
  });

  // 3. Aggregate unique supporter details in JS
  const supportersMap: { [email: string]: { name: string; email: string; totalAmount: number; type: string } } = {};

  donations.forEach((d) => {
    const email = d.donorEmail || 'anonymous@giving-test.com';
    const name = d.donorName || 'Anonymous Donor';
    if (!supportersMap[email]) {
      supportersMap[email] = { name, email, totalAmount: 0, type: 'Donation' };
    }
    supportersMap[email].totalAmount += d.amount;
  });

  partnerships.forEach((p) => {
    const email = p.partnerEmail || 'anonymous@giving-test.com';
    const name = p.partnerName || 'Anonymous Partner';
    if (!supportersMap[email]) {
      supportersMap[email] = { name, email, totalAmount: 0, type: 'Partnership' };
    }
    supportersMap[email].totalAmount += p.amount;
  });

  // Return sorted list by total contribution descending
  return Object.values(supportersMap).sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─────────────────────────────────────────────────────────────
// MOMENTUM ANALYTICS TIMELINE
// ─────────────────────────────────────────────────────────────

export async function getCampaignAnalytics(
  campaignId: string,
  tenantId: string
): Promise<{ date: string; amount: number }[]> {
  await getCampaign(campaignId, tenantId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // 30-day window

  // Fetch succeeded contributions
  const donations = await prisma.donation.findMany({
    where: {
      campaignId,
      status: 'succeeded',
      createdAt: { gte: startDate },
    },
  });

  const partnerships = await prisma.partnership.findMany({
    where: {
      campaignId,
      status: 'succeeded',
      createdAt: { gte: startDate },
    },
  });

  const dailyTotals: { [date: string]: number } = {};

  donations.forEach((d) => {
    const key = d.createdAt.toISOString().slice(0, 10);
    dailyTotals[key] = (dailyTotals[key] || 0) + d.amount;
  });

  partnerships.forEach((p) => {
    const key = p.createdAt.toISOString().slice(0, 10);
    dailyTotals[key] = (dailyTotals[key] || 0) + p.amount;
  });

  // Generate 30 days dates in order to prevent gap voids
  const analytics: { date: string; amount: number }[] = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    analytics.push({
      date: key,
      amount: Math.round((dailyTotals[key] || 0.0) * 100) / 100,
    });
  }

  return analytics;
}
