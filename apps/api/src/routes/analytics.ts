import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  trackEvent,
  getDashboardMetrics,
  getTimeSeriesMetrics,
  calculateFunnelConversion,
} from '../services/analytics';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// POST /api/analytics/track
// ─────────────────────────────────────────────────────────────
// Track a single analytics event (e.g. from client side)
// Body: { category, name, entityId, value, sessionId, metadata }
// ─────────────────────────────────────────────────────────────
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { category, name, entityId, value, sessionId, metadata } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId || null;

    if (!category || !name) {
      res.status(400).json({ error: 'category and name are required' });
      return;
    }

    const event = await trackEvent(tenantId, {
      category,
      name,
      entityId,
      value: value !== undefined ? Number(value) : null,
      userId,
      sessionId,
      metadata,
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    console.error('Track event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/dashboard
// ─────────────────────────────────────────────────────────────
// Fetch dashboard cards metrics aggregates
// Query: ?period=week|month|year
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const period = (req.query.period as 'week' | 'month' | 'year') || 'month';

    if (period !== 'week' && period !== 'month' && period !== 'year') {
      res.status(400).json({ error: 'Invalid period parameter' });
      return;
    }

    const metrics = await getDashboardMetrics(tenantId, period);
    res.json({ data: metrics });
  } catch (err) {
    console.error('Get dashboard metrics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/report
// ─────────────────────────────────────────────────────────────
// Retrieve time-series data for rendering charts
// Query: ?category=website&name=page_view&start=2026-05-01&end=2026-05-28&interval=day
// ─────────────────────────────────────────────────────────────
router.get('/report', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { category, name, start, end, interval } = req.query;

    if (!category || !name || !start || !end) {
      res.status(400).json({ error: 'category, name, start, and end are required' });
      return;
    }

    const startVal = new Date(start as string);
    const endVal = new Date(end as string);
    const intervalVal = (interval as 'day' | 'week' | 'month') || 'day';

    if (isNaN(startVal.getTime()) || isNaN(endVal.getTime())) {
      res.status(400).json({ error: 'Invalid date parameters' });
      return;
    }

    const data = await getTimeSeriesMetrics(
      tenantId,
      category as string,
      name as string,
      startVal,
      endVal,
      intervalVal
    );

    res.json({ data });
  } catch (err) {
    console.error('Get time series metrics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/funnel
// ─────────────────────────────────────────────────────────────
// Retrieve funnel conversion steps
// Query: ?steps=[{"category":"website","name":"page_view"},{"category":"outreach","name":"click"}]&start=2026-05-01&end=2026-05-28
// ─────────────────────────────────────────────────────────────
router.get('/funnel', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { steps, start, end } = req.query;

    if (!steps || !start || !end) {
      res.status(400).json({ error: 'steps, start, and end are required' });
      return;
    }

    let parsedSteps: { category: string; name: string }[] = [];
    try {
      parsedSteps = JSON.parse(steps as string);
    } catch (e) {
      res.status(400).json({ error: 'steps must be a valid JSON array' });
      return;
    }

    const startVal = new Date(start as string);
    const endVal = new Date(end as string);

    if (isNaN(startVal.getTime()) || isNaN(endVal.getTime())) {
      res.status(400).json({ error: 'Invalid date parameters' });
      return;
    }

    const funnel = await calculateFunnelConversion(tenantId, parsedSteps, startVal, endVal);
    res.json({ data: funnel });
  } catch (err) {
    console.error('Get funnel conversion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/export
// ─────────────────────────────────────────────────────────────
// Export raw analytics event logs as a CSV file
// Query: ?category=giving&start=2026-05-01&end=2026-05-28
// ─────────────────────────────────────────────────────────────
router.get('/export', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { category, start, end } = req.query;

    if (!category || !start || !end) {
      res.status(400).json({ error: 'category, start, and end are required' });
      return;
    }

    const startVal = new Date(start as string);
    const endVal = new Date(end as string);

    if (isNaN(startVal.getTime()) || isNaN(endVal.getTime())) {
      res.status(400).json({ error: 'Invalid date parameters' });
      return;
    }

    // Retrieve events matching criteria
    const events = await prisma.analyticsEvent.findMany({
      where: {
        tenantId,
        category: category as string,
        createdAt: { gte: startVal, lte: endVal },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Formulate CSV text payload
    let csv = 'id,category,name,entityId,value,userId,sessionId,createdAt,metadata\n';
    events.forEach((ev) => {
      const sanitizedMeta = ev.metadata.replace(/"/g, '""');
      csv += `"${ev.id}","${ev.category}","${ev.name}","${ev.entityId || ''}",${
        ev.value !== null ? ev.value : ''
      },"${ev.userId || ''}","${ev.sessionId || ''}","${ev.createdAt.toISOString()}","${sanitizedMeta}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics_${category}_export.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
