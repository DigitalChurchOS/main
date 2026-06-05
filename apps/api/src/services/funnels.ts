import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

// ─────────────────────────────────────────────────────────────
// FUNNEL CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────

export async function createFunnel(
  tenantId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    type?: string;
    steps?: Array<{
      name: string;
      order: number;
      slug: string;
      title: string;
      subtitle?: string;
      layoutType?: string;
      bodyContent?: string;
      ctaText?: string;
      ctaLink?: string;
      formConfig?: string;
      countdownEnd?: Date;
      videoUrl?: string;
      testimonialText?: string;
      testimonialAuthor?: string;
      scriptureReference?: string;
      scriptureText?: string;
    }>;
  }
): Promise<any> {
  const existing = await prisma.ministryFunnel.findFirst({
    where: { tenantId, slug: data.slug.toLowerCase().trim() },
  });
  if (existing) {
    throw new Error('Funnel slug already exists');
  }

  return await prisma.$transaction(async (tx) => {
    const funnel = await tx.ministryFunnel.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug.toLowerCase().trim(),
        description: data.description || null,
        type: data.type || 'general',
        isActive: true,
      },
    });

    if (data.steps && data.steps.length > 0) {
      for (const s of data.steps) {
        await tx.funnelStep.create({
          data: {
            funnelId: funnel.id,
            name: s.name,
            order: s.order,
            slug: s.slug.toLowerCase().trim(),
            layoutType: s.layoutType || 'landing',
            title: s.title,
            subtitle: s.subtitle || null,
            bodyContent: s.bodyContent || null,
            ctaText: s.ctaText || null,
            ctaLink: s.ctaLink || null,
            formConfig: s.formConfig || null,
            countdownEnd: s.countdownEnd || null,
            videoUrl: s.videoUrl || null,
            testimonialText: s.testimonialText || null,
            testimonialAuthor: s.testimonialAuthor || null,
            scriptureReference: s.scriptureReference || null,
            scriptureText: s.scriptureText || null,
          },
        });
      }
    }

    return await tx.ministryFunnel.findUnique({
      where: { id: funnel.id },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  });
}

export async function getFunnel(tenantId: string, idOrSlug: string): Promise<any> {
  const funnel = await prisma.ministryFunnel.findFirst({
    where: {
      tenantId,
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug.toLowerCase().trim() },
      ],
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  if (!funnel) {
    throw new Error('Funnel not found');
  }
  return funnel;
}

export async function listFunnels(
  tenantId: string,
  filter?: { isActive?: boolean; type?: string }
): Promise<any[]> {
  return await prisma.ministryFunnel.findMany({
    where: {
      tenantId,
      ...(filter && filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter && filter.type ? { type: filter.type } : {}),
    },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateFunnel(
  tenantId: string,
  funnelId: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    type?: string;
    isActive?: boolean;
  }
): Promise<any> {
  const funnel = await getFunnel(tenantId, funnelId);

  if (data.slug) {
    const slugLower = data.slug.toLowerCase().trim();
    if (slugLower !== funnel.slug) {
      const existing = await prisma.ministryFunnel.findFirst({
        where: { tenantId, slug: slugLower },
      });
      if (existing) {
        throw new Error('Funnel slug already exists');
      }
    }
  }

  return await prisma.ministryFunnel.update({
    where: { id: funnel.id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.slug ? { slug: data.slug.toLowerCase().trim() } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  });
}

export async function deleteFunnel(tenantId: string, funnelId: string): Promise<any> {
  const funnel = await getFunnel(tenantId, funnelId);

  return await prisma.$transaction(async (tx) => {
    // Purge downstream analytics, submissions, and steps first to guarantee SQLite integrity
    await tx.funnelAnalytics.deleteMany({ where: { funnelId: funnel.id } });
    await tx.funnelSubmission.deleteMany({ where: { funnelId: funnel.id } });
    await tx.funnelStep.deleteMany({ where: { funnelId: funnel.id } });
    return await tx.ministryFunnel.delete({
      where: { id: funnel.id },
    });
  });
}

// ─────────────────────────────────────────────────────────────
// FUNNEL STEP CONTROLS
// ─────────────────────────────────────────────────────────────

export async function addFunnelStep(
  tenantId: string,
  funnelId: string,
  data: {
    name: string;
    order: number;
    slug: string;
    title: string;
    subtitle?: string;
    layoutType?: string;
    bodyContent?: string;
    ctaText?: string;
    ctaLink?: string;
    formConfig?: string;
    countdownEnd?: Date;
    videoUrl?: string;
    testimonialText?: string;
    testimonialAuthor?: string;
    scriptureReference?: string;
    scriptureText?: string;
    pageId?: string;
  }
): Promise<any> {
  const funnel = await getFunnel(tenantId, funnelId);

  const existingStep = await prisma.funnelStep.findFirst({
    where: { funnelId: funnel.id, slug: data.slug.toLowerCase().trim() },
  });
  if (existingStep) {
    throw new Error('Step slug already exists inside this funnel');
  }

  if (data.pageId) {
    const page = await prisma.page.findFirst({
      where: { id: data.pageId, tenantId },
    });
    if (!page) {
      throw new Error('Linked page not found');
    }
  }

  return await prisma.funnelStep.create({
    data: {
      funnelId: funnel.id,
      name: data.name,
      order: data.order,
      slug: data.slug.toLowerCase().trim(),
      layoutType: data.layoutType || 'landing',
      title: data.title,
      subtitle: data.subtitle || null,
      bodyContent: data.bodyContent || null,
      ctaText: data.ctaText || null,
      ctaLink: data.ctaLink || null,
      formConfig: data.formConfig || null,
      countdownEnd: data.countdownEnd || null,
      videoUrl: data.videoUrl || null,
      testimonialText: data.testimonialText || null,
      testimonialAuthor: data.testimonialAuthor || null,
      scriptureReference: data.scriptureReference || null,
      scriptureText: data.scriptureText || null,
      pageId: data.pageId || null,
    },
  });
}

export async function updateFunnelStep(
  tenantId: string,
  funnelId: string,
  stepId: string,
  data: {
    name?: string;
    order?: number;
    slug?: string;
    title?: string;
    subtitle?: string;
    layoutType?: string;
    bodyContent?: string;
    ctaText?: string;
    ctaLink?: string;
    formConfig?: string;
    countdownEnd?: Date;
    videoUrl?: string;
    testimonialText?: string;
    testimonialAuthor?: string;
    scriptureReference?: string;
    scriptureText?: string;
    pageId?: string;
  }
): Promise<any> {
  const funnel = await getFunnel(tenantId, funnelId);

  const step = await prisma.funnelStep.findFirst({
    where: { id: stepId, funnelId: funnel.id },
  });
  if (!step) {
    throw new Error('Funnel step not found');
  }

  if (data.slug) {
    const slugLower = data.slug.toLowerCase().trim();
    if (slugLower !== step.slug) {
      const existing = await prisma.funnelStep.findFirst({
        where: { funnelId: funnel.id, slug: slugLower },
      });
      if (existing) {
        throw new Error('Step slug already exists inside this funnel');
      }
    }
  }

  if (data.pageId) {
    const page = await prisma.page.findFirst({
      where: { id: data.pageId, tenantId },
    });
    if (!page) {
      throw new Error('Linked page not found');
    }
  }

  return await prisma.funnelStep.update({
    where: { id: step.id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
      ...(data.slug ? { slug: data.slug.toLowerCase().trim() } : {}),
      ...(data.title ? { title: data.title } : {}),
      ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
      ...(data.layoutType ? { layoutType: data.layoutType } : {}),
      ...(data.bodyContent !== undefined ? { bodyContent: data.bodyContent } : {}),
      ...(data.ctaText !== undefined ? { ctaText: data.ctaText } : {}),
      ...(data.ctaLink !== undefined ? { ctaLink: data.ctaLink } : {}),
      ...(data.formConfig !== undefined ? { formConfig: data.formConfig } : {}),
      ...(data.countdownEnd !== undefined ? { countdownEnd: data.countdownEnd } : {}),
      ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
      ...(data.testimonialText !== undefined ? { testimonialText: data.testimonialText } : {}),
      ...(data.testimonialAuthor !== undefined ? { testimonialAuthor: data.testimonialAuthor } : {}),
      ...(data.scriptureReference !== undefined ? { scriptureReference: data.scriptureReference } : {}),
      ...(data.scriptureText !== undefined ? { scriptureText: data.scriptureText } : {}),
      ...(data.pageId !== undefined ? { pageId: data.pageId || null } : {}),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PAGE TRAFFIC VIEW RECORDING
// ─────────────────────────────────────────────────────────────

export async function recordView(
  tenantId: string,
  funnelId: string,
  stepId: string,
  dateStr?: string
): Promise<any> {
  const funnel = await getFunnel(tenantId, funnelId);

  const step = await prisma.funnelStep.findFirst({
    where: { id: stepId, funnelId: funnel.id },
  });
  if (!step) {
    throw new Error('Step not found');
  }

  const today = dateStr ? new Date(dateStr) : new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dateId = `${tenantId}_${funnel.id}_${step.id}_${today.getTime()}`;

  return await prisma.funnelAnalytics.upsert({
    where: {
      tenantId_funnelId_stepId_date: {
        tenantId,
        funnelId: funnel.id,
        stepId: step.id,
        date: today,
      },
    },
    update: { views: { increment: 1 } },
    create: {
      tenantId,
      funnelId: funnel.id,
      stepId: step.id,
      date: today,
      views: 1,
      submissions: 0,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// FORM SUBMISSIONS & MEMBER CAPTURE
// ─────────────────────────────────────────────────────────────

export async function submitStepResponse(
  tenantId: string,
  funnelId: string,
  stepId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    submittedData: any;
    ipAddress?: string;
    userAgent?: string;
    dateStr?: string;
  }
): Promise<any> {
  const funnel = await getFunnel(tenantId, funnelId);
  if (!funnel.isActive) {
    throw new Error('Funnel is inactive');
  }

  const step = await prisma.funnelStep.findFirst({
    where: { id: stepId, funnelId: funnel.id },
  });
  if (!step) {
    throw new Error('Step not found');
  }

  const emailClean = data.email.toLowerCase().trim();

  // Run in transaction to resolve member, submit data, and increment daily submissions atomically
  return await prisma.$transaction(async (tx) => {
    // 1. Resolve or create Member
    let member = await tx.member.findFirst({
      where: { tenantId, user: { email: emailClean } },
    });

    if (!member) {
      // Also check members directory by phone or plain email fields
      const existingMembers = await tx.member.findMany({
        where: { tenantId },
      });
      // Fallback match email if plain fields exist, or create new visitor
      member = existingMembers.find((m) => m.firstName.toLowerCase() === data.firstName.toLowerCase() && m.lastName.toLowerCase() === data.lastName.toLowerCase()) || null;
    }

    if (!member) {
      member = await tx.member.create({
        data: {
          tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          membershipStatus: 'visitor',
        },
      });
    }

    // 2. Register Funnel Submission
    const submission = await tx.funnelSubmission.create({
      data: {
        tenantId,
        funnelId: funnel.id,
        stepId: step.id,
        memberId: member.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: emailClean,
        phone: data.phone || null,
        submittedData: JSON.stringify(data.submittedData),
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        converted: true,
      },
    });

    // 3. Atomically increment daily submissions in analytics
    const today = data.dateStr ? new Date(data.dateStr) : new Date();
    today.setUTCHours(0, 0, 0, 0);

    await tx.funnelAnalytics.upsert({
      where: {
        tenantId_funnelId_stepId_date: {
          tenantId,
          funnelId: funnel.id,
          stepId: step.id,
          date: today,
        },
      },
      update: { submissions: { increment: 1 } },
      create: {
        tenantId,
        funnelId: funnel.id,
        stepId: step.id,
        date: today,
        views: 0,
        submissions: 1,
      },
    });

    // 4. Log conversion telemetry analytics event
    await trackEvent(tenantId, {
      category: 'funnel',
      name: 'convert',
      entityId: funnel.id,
      userId: null,
      value: 1,
      metadata: {
        funnelId: funnel.id,
        stepId: step.id,
        email: emailClean,
      },
    });

    return submission;
  });
}

// ─────────────────────────────────────────────────────────────
// CONVERSION PERFORMANCE METRICS
// ─────────────────────────────────────────────────────────────

export async function getFunnelAnalytics(
  tenantId: string,
  funnelId: string
): Promise<{
  steps: Array<{
    id: string;
    name: string;
    slug: string;
    order: number;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
  totalViews: number;
  totalSubmissions: number;
  overallConversionRate: number;
  dailyMetrics: Array<{
    date: string;
    views: number;
    submissions: number;
  }>;
}> {
  const funnel = await getFunnel(tenantId, funnelId);

  // Fetch all analytics events for this funnel
  const dbAnalytics = await prisma.funnelAnalytics.findMany({
    where: { tenantId, funnelId: funnel.id },
  });

  // Aggregate stats per step
  const stepStats = funnel.steps.map((st: any) => {
    const stepRecords = dbAnalytics.filter((r) => r.stepId === st.id);
    const views = stepRecords.reduce((sum, r) => sum + r.views, 0);
    const submissions = stepRecords.reduce((sum, r) => sum + r.submissions, 0);
    const conversionRate = views > 0 ? (submissions / views) * 100 : 0.0;

    return {
      id: st.id,
      name: st.name,
      slug: st.slug,
      order: st.order,
      views,
      submissions,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  });

  // Calculate overall performance totals
  const totalViews = stepStats.reduce((sum: number, s: any) => sum + s.views, 0);
  const totalSubmissions = stepStats.reduce((sum: number, s: any) => sum + s.submissions, 0);

  // Overall conversion is submissions divided by views of the first step (index 0) if available
  const firstStepViews = stepStats.length > 0 ? stepStats[0].views : 0;
  const overallConversionRate = firstStepViews > 0 ? (totalSubmissions / firstStepViews) * 100 : 0.0;

  // Chronological daily timeline for the past 30 days
  const dailyMap: Record<string, { views: number; submissions: number }> = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = { views: 0, submissions: 0 };
  }

  dbAnalytics.forEach((record) => {
    const key = record.date.toISOString().split('T')[0];
    if (dailyMap[key] !== undefined) {
      dailyMap[key].views += record.views;
      dailyMap[key].submissions += record.submissions;
    }
  });

  const dailyMetrics = Object.keys(dailyMap).map((date) => ({
    date,
    views: dailyMap[date].views,
    submissions: dailyMap[date].submissions,
  }));

  return {
    steps: stepStats,
    totalViews,
    totalSubmissions,
    overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    dailyMetrics,
  };
}
