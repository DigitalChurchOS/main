import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Analytics & Reporting Module', () => {
  let tenantId: string;
  let adminToken: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.analyticsEvent.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Analytics Test Church', subdomain: 'analytics-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: ['member.read', 'tenant.settings'] },
      },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@analytics-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. TELEMETRY EVENT CAPTURE
  // ─────────────────────────────────────────────────────────────
  describe('Telemetry Event Capture', () => {
    it('should successfully record page view, media play, giving, and livestream events', async () => {
      // 1. Page view
      const pvRes = await request(app)
        .post('/api/analytics/track')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'website',
          name: 'page_view',
          sessionId: 'session-visitor-1',
          metadata: { page: 'home' },
        });
      expect(pvRes.status).toBe(201);
      expect(pvRes.body.success).toBe(true);

      // 2. Media play
      const mpRes = await request(app)
        .post('/api/analytics/track')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'media',
          name: 'play',
          entityId: 'sermon-uuid-1',
          sessionId: 'session-visitor-1',
        });
      expect(mpRes.status).toBe(201);

      // 3. Donation
      const dnRes = await request(app)
        .post('/api/analytics/track')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'giving',
          name: 'donate',
          value: 250.0,
          sessionId: 'session-visitor-2',
        });
      expect(dnRes.status).toBe(201);

      // 4. Livestream attendance
      const lsRes = await request(app)
        .post('/api/analytics/track')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'livestream',
          name: 'attend',
          value: 120.0,
          sessionId: 'session-visitor-3',
        });
      expect(lsRes.status).toBe(201);

      // 5. Salvation response
      const svRes = await request(app)
        .post('/api/analytics/track')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'salvation',
          name: 'response',
          value: 1,
          sessionId: 'session-visitor-4',
        });
      expect(svRes.status).toBe(201);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. DASHBOARD SUMMARY AGGREGATION
  // ─────────────────────────────────────────────────────────────
  describe('Dashboard Metrics Aggregation', () => {
    it('should aggregate unique visitors, page views, plays, peak live views, and total giving', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard?period=month')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.uniqueVisitors).toBe(4); // 4 unique sessions: 1, 2, 3, 4
      expect(res.body.data.pageViews).toBe(1);
      expect(res.body.data.mediaPlays).toBe(1);
      expect(res.body.data.peakViewers).toBe(120);
      expect(res.body.data.totalGiving).toBe(250.0);
      expect(res.body.data.salvationResponses).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. TIME-SERIES CHART DATA GENERATION
  // ─────────────────────────────────────────────────────────────
  describe('Time-Series Report API', () => {
    it('should return grouped time-series values for charts', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date();
      start.setDate(start.getDate() - 2);
      const end = new Date();
      end.setDate(end.getDate() + 2);

      const res = await request(app)
        .get(`/api/analytics/report?category=giving&name=donate&start=${start.toISOString()}&end=${end.toISOString()}&interval=day`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].date).toBe(today);
      expect(res.body.data[0].value).toBe(250.0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // D. FUNNEL CONVERSION RATIOS
  // ─────────────────────────────────────────────────────────────
  describe('Sequential Funnel Conversion Engine', () => {
    it('should calculate accurate conversion step drop-offs', async () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      const end = new Date();
      end.setDate(end.getDate() + 1);

      // Clean events for fresh funnel test
      await prisma.analyticsEvent.deleteMany({});

      // Session A: Viewed Page -> Clicked Link -> Registered Event (100% conversion)
      const t = new Date().getTime();
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'website', name: 'page_view', sessionId: 'session-a', createdAt: new Date(t) } });
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'outreach', name: 'click', sessionId: 'session-a', createdAt: new Date(t + 10) } });
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'event', name: 'register', sessionId: 'session-a', createdAt: new Date(t + 20) } });

      // Session B: Viewed Page -> Clicked Link (50% conversion at click, 0% at register)
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'website', name: 'page_view', sessionId: 'session-b', createdAt: new Date(t) } });
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'outreach', name: 'click', sessionId: 'session-b', createdAt: new Date(t + 10) } });

      // Session C: Viewed Page only (25% conversion at click)
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'website', name: 'page_view', sessionId: 'session-c', createdAt: new Date(t) } });

      // Session D: Viewed Page -> Registered Event (out of order, missing step 2 Click)
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'website', name: 'page_view', sessionId: 'session-d', createdAt: new Date(t) } });
      await prisma.analyticsEvent.create({ data: { tenantId, category: 'event', name: 'register', sessionId: 'session-d', createdAt: new Date(t + 20) } });

      const stepsQuery = JSON.stringify([
        { category: 'website', name: 'page_view' },
        { category: 'outreach', name: 'click' },
        { category: 'event', name: 'register' },
      ]);

      const res = await request(app)
        .get(`/api/analytics/funnel?steps=${stepsQuery}&start=${start.toISOString()}&end=${end.toISOString()}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const funnel = res.body.data;
      expect(funnel.length).toBe(3);

      // Step 0: page_view
      expect(funnel[0].stepName).toBe('website:page_view');
      expect(funnel[0].count).toBe(4); // A, B, C, D
      expect(funnel[0].rate).toBe(1.0);

      // Step 1: click
      expect(funnel[1].stepName).toBe('outreach:click');
      expect(funnel[1].count).toBe(2); // A, B (C didn't click, D clicked none)
      expect(funnel[1].rate).toBe(0.5); // 2 / 4

      // Step 2: register
      expect(funnel[2].stepName).toBe('event:register');
      expect(funnel[2].count).toBe(1); // Only Session A completed all 3 sequentially
      expect(funnel[2].rate).toBe(0.5); // 1 / 2 (relative to previous step)
    });
  });

  // ─────────────────────────────────────────────────────────────
  // E. EXPORT REPORTS (CSV FORMAT)
  // ─────────────────────────────────────────────────────────────
  describe('CSV Report Export Download', () => {
    it('should generate a CSV file containing event logs', async () => {
      // Re-seed donation event to export
      await prisma.analyticsEvent.create({
        data: {
          tenantId,
          category: 'giving',
          name: 'donate',
          value: 500.0,
          sessionId: 'session-export-donor',
          metadata: JSON.stringify({ campaign: 'Missions' }),
        },
      });

      const start = new Date();
      start.setDate(start.getDate() - 1);
      const end = new Date();
      end.setDate(end.getDate() + 1);

      const res = await request(app)
        .get(`/api/analytics/export?category=giving&start=${start.toISOString()}&end=${end.toISOString()}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('analytics_giving_export.csv');
      
      const csvLines = res.text.split('\n');
      expect(csvLines[0]).toBe('id,category,name,entityId,value,userId,sessionId,createdAt,metadata');
      
      // Verify donation row data
      const dataRow = csvLines.find((line) => line.includes('"giving","donate"'));
      expect(dataRow).toBeDefined();
      expect(dataRow).toContain('500');
      expect(dataRow).toContain('session-export-donor');
      expect(dataRow).toContain('Missions');
    });
  });
});
