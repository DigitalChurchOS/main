import prisma from '../lib/prisma';

/**
 * Member Outreach & Invite Campaign Service
 * ------------------------------------------
 * Manages outreach campaigns, invite assets, personalized
 * invite pages, link tracking, share events, and conversion
 * attribution.
 */

// ═══════════════════════════════════════════════════════════════
//  OUTREACH CAMPAIGNS  (Outreach Campaign API)
// ═══════════════════════════════════════════════════════════════

export async function createCampaign(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    hashtags?: string;
    shareCaptions?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  }
) {
  return prisma.outreachCampaign.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      hashtags: data.hashtags || null,
      shareCaptions: data.shareCaptions || null,
      ctaLabel: data.ctaLabel || null,
      ctaUrl: data.ctaUrl || null,
    },
    include: { assets: true },
  });
}

export async function listCampaigns(tenantId: string, status?: string) {
  const where: any = { tenantId };
  if (status) where.status = status;

  return prisma.outreachCampaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { invitePages: true, assets: true } },
    },
  });
}

export async function getCampaign(tenantId: string, campaignId: string) {
  return prisma.outreachCampaign.findFirst({
    where: { id: campaignId, tenantId },
    include: {
      assets: true,
      _count: { select: { invitePages: true } },
    },
  });
}

export async function updateCampaign(
  tenantId: string,
  campaignId: string,
  data: Partial<{
    name: string;
    description: string;
    status: string;
    hashtags: string;
    shareCaptions: string;
    ctaLabel: string;
    ctaUrl: string;
  }>
) {
  const campaign = await prisma.outreachCampaign.findFirst({ where: { id: campaignId, tenantId } });
  if (!campaign) return null;

  return prisma.outreachCampaign.update({
    where: { id: campaignId },
    data,
  });
}

// ═══════════════════════════════════════════════════════════════
//  INVITE ASSETS  (Invite Asset API)
// ═══════════════════════════════════════════════════════════════

export async function addAsset(
  campaignId: string,
  data: {
    assetType: string;
    title: string;
    url: string;
    format?: string;
    fileSize?: number;
  }
) {
  return prisma.inviteAsset.create({
    data: {
      campaignId,
      assetType: data.assetType,
      title: data.title,
      url: data.url,
      format: data.format || null,
      fileSize: data.fileSize || null,
    },
  });
}

export async function listAssets(campaignId: string, assetType?: string) {
  const where: any = { campaignId };
  if (assetType) where.assetType = assetType;
  return prisma.inviteAsset.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function deleteAsset(campaignId: string, assetId: string) {
  const asset = await prisma.inviteAsset.findFirst({ where: { id: assetId, campaignId } });
  if (!asset) return null;
  await prisma.inviteAsset.delete({ where: { id: assetId } });
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
//  PERSONALIZED INVITE PAGES  (Personalized Invite Page API)
// ═══════════════════════════════════════════════════════════════

export async function createInvitePage(
  tenantId: string,
  data: {
    campaignId: string;
    memberId: string;
    slug: string;
    personalMessage?: string;
    personalVideoUrl?: string;
    ctaLabel?: string;
  }
) {
  return prisma.personalizedInvitePage.create({
    data: {
      tenantId,
      campaignId: data.campaignId,
      memberId: data.memberId,
      slug: data.slug,
      personalMessage: data.personalMessage || null,
      personalVideoUrl: data.personalVideoUrl || null,
      ctaLabel: data.ctaLabel || null,
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getInvitePageBySlug(slug: string) {
  return prisma.personalizedInvitePage.findUnique({
    where: { slug },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
      campaign: {
        include: { assets: true },
      },
    },
  });
}

export async function listInvitePages(
  tenantId: string,
  filters: { campaignId?: string; memberId?: string }
) {
  const where: any = { tenantId };
  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.memberId) where.memberId = filters.memberId;

  return prisma.personalizedInvitePage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//  INVITE LINK TRACKING  (Invite Link Tracking API)
// ═══════════════════════════════════════════════════════════════

export async function trackClick(
  pageId: string,
  data: { referrer?: string; userAgent?: string }
) {
  // Increment click count on page and record click event
  return prisma.$transaction(async (tx) => {
    await tx.personalizedInvitePage.update({
      where: { id: pageId },
      data: { clickCount: { increment: 1 } },
    });

    return tx.inviteLinkClick.create({
      data: {
        pageId,
        referrer: data.referrer || null,
        userAgent: data.userAgent || null,
      },
    });
  });
}

export async function recordConversion(clickId: string) {
  // Mark click as converted and increment conversion counter on page
  const click = await prisma.inviteLinkClick.findUnique({
    where: { id: clickId },
    include: { page: true },
  });
  if (!click) return null;

  return prisma.$transaction(async (tx) => {
    await tx.inviteLinkClick.update({
      where: { id: clickId },
      data: { converted: true },
    });

    await tx.personalizedInvitePage.update({
      where: { id: click.pageId },
      data: { conversionCount: { increment: 1 } },
    });

    return { success: true, pageId: click.pageId };
  });
}

export async function getClicksForPage(pageId: string) {
  return prisma.inviteLinkClick.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
  });
}

// ═══════════════════════════════════════════════════════════════
//  SHARE EVENTS  (Share Tracking API)
// ═══════════════════════════════════════════════════════════════

export async function trackShare(pageId: string, platform: string) {
  return prisma.shareEvent.create({
    data: { pageId, platform },
  });
}

export async function getSharesForPage(pageId: string) {
  return prisma.shareEvent.findMany({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
  });
}

// ═══════════════════════════════════════════════════════════════
//  LEADERBOARD & ANALYTICS  (Conversion Attribution API)
// ═══════════════════════════════════════════════════════════════

export async function getLeaderboard(tenantId: string, campaignId: string) {
  const pages = await prisma.personalizedInvitePage.findMany({
    where: { tenantId, campaignId },
    orderBy: { conversionCount: 'desc' },
    take: 20,
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return pages.map((p, index) => ({
    rank: index + 1,
    memberId: p.memberId,
    memberName: `${p.member.firstName} ${p.member.lastName}`,
    clicks: p.clickCount,
    conversions: p.conversionCount,
    slug: p.slug,
  }));
}

export async function getCampaignAnalytics(tenantId: string, campaignId: string) {
  const pages = await prisma.personalizedInvitePage.findMany({
    where: { tenantId, campaignId },
  });

  const totalClicks = pages.reduce((sum, p) => sum + p.clickCount, 0);
  const totalConversions = pages.reduce((sum, p) => sum + p.conversionCount, 0);
  const totalPages = pages.length;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';

  // Share breakdown
  const shares = await prisma.shareEvent.findMany({
    where: { page: { campaignId } },
  });
  const shareByPlatform: Record<string, number> = {};
  shares.forEach((s) => {
    shareByPlatform[s.platform] = (shareByPlatform[s.platform] || 0) + 1;
  });

  return {
    totalPages,
    totalClicks,
    totalConversions,
    conversionRate: `${conversionRate}%`,
    totalShares: shares.length,
    shareByPlatform,
  };
}
