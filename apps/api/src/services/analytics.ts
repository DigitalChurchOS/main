import prisma from '../lib/prisma';

/**
 * Record a single analytics event in the system.
 */
export async function trackEvent(
  tenantId: string,
  payload: {
    category: string;
    name: string;
    entityId?: string | null;
    value?: number | null;
    userId?: string | null;
    sessionId?: string | null;
    metadata?: any;
  }
): Promise<any> {
  return await prisma.analyticsEvent.create({
    data: {
      tenantId,
      category: payload.category,
      name: payload.name,
      entityId: payload.entityId || null,
      value: payload.value !== undefined ? payload.value : null,
      userId: payload.userId || null,
      sessionId: payload.sessionId || null,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : '{}',
    },
  });
}

/**
 * Aggregate summary statistics for the church dashboard.
 */
export async function getDashboardMetrics(
  tenantId: string,
  period: 'week' | 'month' | 'year' = 'month'
): Promise<any> {
  const now = new Date();
  const startDate = new Date();
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // 1. Unique visitors (sessions)
  const visitors = await prisma.analyticsEvent.groupBy({
    by: ['sessionId'],
    where: {
      tenantId,
      createdAt: { gte: startDate },
      sessionId: { not: null },
    },
  });
  const uniqueVisitors = visitors.length;

  // 2. Page views
  const pageViews = await prisma.analyticsEvent.count({
    where: {
      tenantId,
      category: 'website',
      name: 'page_view',
      createdAt: { gte: startDate },
    },
  });

  // 3. Media plays
  const mediaPlays = await prisma.analyticsEvent.count({
    where: {
      tenantId,
      category: 'media',
      name: 'play',
      createdAt: { gte: startDate },
    },
  });

  // 4. Livestream peak concurrent viewers
  const maxLiveRes = await prisma.analyticsEvent.aggregate({
    _max: { value: true },
    where: {
      tenantId,
      category: 'livestream',
      name: 'attend',
      createdAt: { gte: startDate },
    },
  });
  const peakViewers = maxLiveRes._max.value || 0;

  // 5. Aggregated donations sum
  const sumDonations = await prisma.analyticsEvent.aggregate({
    _sum: { value: true },
    where: {
      tenantId,
      category: 'giving',
      name: 'donate',
      createdAt: { gte: startDate },
    },
  });
  const totalGiving = sumDonations._sum.value || 0.0;

  // 6. Salvation response counts
  const salvationResponses = await prisma.analyticsEvent.count({
    where: {
      tenantId,
      category: 'salvation',
      name: 'response',
      createdAt: { gte: startDate },
    },
  });

  return {
    uniqueVisitors,
    pageViews,
    mediaPlays,
    peakViewers,
    totalGiving: Math.round(totalGiving * 100) / 100,
    salvationResponses,
  };
}

/**
 * Retrieve time-series data for chart rendering.
 */
export async function getTimeSeriesMetrics(
  tenantId: string,
  category: string,
  name: string,
  start: Date,
  end: Date,
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<{ date: string; value: number }[]> {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      tenantId,
      category,
      name,
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'asc' },
  });

  const groups: { [key: string]: number } = {};

  events.forEach((ev) => {
    let key = '';
    const d = new Date(ev.createdAt);
    if (interval === 'day') {
      key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (interval === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      key = startOfWeek.toISOString().slice(0, 10);
    } else if (interval === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    }

    const val = ev.value !== null ? ev.value : 1;
    groups[key] = (groups[key] || 0) + val;
  });

  return Object.keys(groups).map((date) => ({
    date,
    value: Math.round(groups[date] * 100) / 100,
  }));
}

/**
 * Compute sequential conversion steps and drop-off ratios for a funnel.
 */
export async function calculateFunnelConversion(
  tenantId: string,
  steps: { category: string; name: string }[],
  start: Date,
  end: Date
): Promise<{ stepName: string; count: number; rate: number }[]> {
  if (steps.length === 0) return [];

  const events = await prisma.analyticsEvent.findMany({
    where: {
      tenantId,
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: 'asc' },
  });

  const userJourneys: { [key: string]: { category: string; name: string; time: number }[] } = {};

  events.forEach((ev) => {
    const key = ev.userId || ev.sessionId || 'anonymous';
    if (!userJourneys[key]) {
      userJourneys[key] = [];
    }
    userJourneys[key].push({
      category: ev.category,
      name: ev.name,
      time: ev.createdAt.getTime(),
    });
  });

  const stepCounts: number[] = new Array(steps.length).fill(0);

  Object.keys(userJourneys).forEach((userKey) => {
    const journey = userJourneys[userKey];
    
    let currentStepIndex = 0;
    let lastTime = 0;

    while (currentStepIndex < steps.length) {
      const target = steps[currentStepIndex];
      const match = journey.find(
        (item) =>
          item.category === target.category &&
          item.name === target.name &&
          item.time >= lastTime
      );

      if (match) {
        stepCounts[currentStepIndex]++;
        lastTime = match.time;
        currentStepIndex++;
      } else {
        break; // Sequence broken
      }
    }
  });

  return steps.map((step, index) => {
    const count = stepCounts[index];
    const rate = index === 0 ? 1.0 : (stepCounts[index - 1] > 0 ? count / stepCounts[index - 1] : 0.0);
    return {
      stepName: `${step.category}:${step.name}`,
      count,
      rate: Math.round(rate * 10000) / 10000,
    };
  });
}
