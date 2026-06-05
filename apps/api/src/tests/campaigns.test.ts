import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Campaigns & Causes Module (Module 21)', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let givingCategoryId: string;
  let partnershipCategoryId: string;
  let campaignId: string;
  let campaignSlug = 'building-project-2026';

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.campaignUpdate.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.recurringGiving.deleteMany({});
    await prisma.givingCategory.deleteMany({});
    await prisma.partnership.deleteMany({});
    await prisma.recurringPartnership.deleteMany({});
    await prisma.partnershipCategory.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.churchService.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Campaigns Test Church', subdomain: 'campaigns-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup payment driver configuration (Stripe connected service)
    await prisma.providerCategory.upsert({
      where: { id: 'payment' },
      update: {},
      create: { id: 'payment', name: 'Payment Gateway' }
    });
    await prisma.provider.upsert({
      where: { id: 'stripe' },
      update: {},
      create: { id: 'stripe', categoryId: 'payment', name: 'Stripe' }
    });

    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'stripe',
        encryptedCredentials: encryptCredentials(JSON.stringify({ secretKey: 'sk_test_campaign_mock_key' }), tenantId),
        providerMode: 'bring_your_own',
        isActive: true,
      }
    });

    // 4. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 5. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@campaigns-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@campaigns-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 7. Create giving and partnership categories
    const gCat = await prisma.givingCategory.create({
      data: { tenantId, name: 'Building Offerings', isActive: true },
    });
    givingCategoryId = gCat.id;

    const pCat = await prisma.partnershipCategory.create({
      data: { tenantId, name: 'Building Partner', isActive: true },
    });
    partnershipCategoryId = pCat.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CAMPAIGN CRUD & STATUS TESTING
  // ─────────────────────────────────────────────────────────────
  describe('Campaigns Management CRUD', () => {
    it('should allow admin to create a new campaign', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Sanctuary Building Project',
          slug: campaignSlug,
          description: 'Expanding our main auditorium to support our growing congregation.',
          goalAmount: 500000.0,
          currency: 'USD',
          coverImageUrl: 'https://images.unsplash.com/photo-1548625361-155de0cbb55a',
          videoUrl: 'https://www.youtube.com/watch?v=mockvideo',
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('New Sanctuary Building Project');
      expect(res.body.data.slug).toBe(campaignSlug);
      expect(res.body.data.goalAmount).toBe(500000.0);
      expect(res.body.data.currentAmount).toBe(0.0);
      expect(res.body.data.status).toBe('active');

      campaignId = res.body.data.id;
    });

    it('should block duplicate campaign slugs', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Duplicate Building Project',
          slug: campaignSlug,
          goalAmount: 100000.0,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('slug already exists');
    });

    it('should block member from creating a campaign', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Youth Hall Upgrade',
          slug: 'youth-upgrade',
          goalAmount: 15000.0,
        });

      expect(res.status).toBe(403);
    });

    it('should list all campaigns publicly', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(campaignId);
    });

    it('should allow retrieval of a single campaign by ID', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(campaignId);
    });

    it('should allow retrieval of a single campaign by slug', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignSlug}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(campaignId);
    });

    it('should return 404 for non-existent campaigns', async () => {
      const res = await request(app)
        .get('/api/campaigns/non-existent-campaign')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(404);
    });

    it('should allow admin to update a campaign', async () => {
      const res = await request(app)
        .patch(`/api/campaigns/${campaignId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Modern sanctuary building campaign',
          goalAmount: 600000.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Modern sanctuary building campaign');
      expect(res.body.data.goalAmount).toBe(600000.0);
    });

    it('should block members from updating a campaign', async () => {
      const res = await request(app)
        .patch(`/api/campaigns/${campaignId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Hacked title',
        });

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. TIMELINE VISION & MILESTONES UPDATES
  // ─────────────────────────────────────────────────────────────
  describe('Campaign Timeline Updates', () => {
    it('should allow admin to post timeline updates', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/updates`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Foundation Poured!',
          content: 'We successfully poured the foundation for the new sanctuary today! Thank you to everyone who contributed!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Foundation Poured!');
      expect(res.body.data.content).toBe('We successfully poured the foundation for the new sanctuary today! Thank you to everyone who contributed!');
    });

    it('should block members from posting timeline updates', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/updates`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Fake milestone',
          content: 'Member posted something without permission',
        });

      expect(res.status).toBe(403);
    });

    it('should list timeline updates publicly', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/updates`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Foundation Poured!');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. INTEGRATED FUNDING & THERMOMETER PROGRESS
  // ─────────────────────────────────────────────────────────────
  describe('Integrated Campaign Funding (Donations & Partnerships)', () => {
    it('should increment currentAmount when a linked donation webhook succeeds', async () => {
      // 1. Check current campaign details
      const campBefore = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campBefore?.currentAmount).toBe(0.0);

      // 2. Initiate checkout for a linked donation
      const initRes = await request(app)
        .post('/api/giving/donations')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId: givingCategoryId,
          amount: 1500.0,
          donorName: 'Generous Donor A',
          donorEmail: 'donor.a@giving.com',
          campaignId: campaignId,
        });

      expect(initRes.status).toBe(201);
      const txId = initRes.body.data.transactionId;

      // 3. Fire the donation webhook success
      const hookRes = await request(app)
        .post('/api/giving/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: txId,
          status: 'succeeded',
        });

      expect(hookRes.status).toBe(200);
      expect(hookRes.body.success).toBe(true);

      // 4. Verify that campaign currentAmount incremented by donation amount
      const campAfter = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campAfter?.currentAmount).toBe(1500.0);
    });

    it('should increment currentAmount when a linked partnership webhook succeeds', async () => {
      // 1. Initiate checkout for a linked partnership
      const initRes = await request(app)
        .post('/api/partnerships/checkout')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId: partnershipCategoryId,
          amount: 2500.0,
          partnerName: 'Generous Partner B',
          partnerEmail: 'partner.b@partnership.com',
          campaignId: campaignId,
        });

      expect(initRes.status).toBe(201);
      const txId = initRes.body.data.transactionId;

      // 2. Fire the partnership webhook success
      const hookRes = await request(app)
        .post('/api/partnerships/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: txId,
          status: 'succeeded',
        });

      expect(hookRes.status).toBe(200);
      expect(hookRes.body.success).toBe(true);

      // 3. Verify that campaign currentAmount is now 1500 + 2500 = 4000
      const campAfter = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campAfter?.currentAmount).toBe(4000.0);
    });

    it('should NOT increment campaign currentAmount if donation fails', async () => {
      // 1. Initiate a failing donation checkout
      const initRes = await request(app)
        .post('/api/giving/donations')
        .set('x-tenant-id', tenantId)
        .send({
          categoryId: givingCategoryId,
          amount: 500.0,
          donorName: 'Failing Donor C',
          donorEmail: 'donor.c@giving.com',
          campaignId: campaignId,
        });

      expect(initRes.status).toBe(201);
      const txId = initRes.body.data.transactionId;

      // 2. Trigger webhook failure
      const hookRes = await request(app)
        .post('/api/giving/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId: txId,
          status: 'failed',
        });

      expect(hookRes.status).toBe(200);

      // 3. Verify currentAmount remains 4000
      const campAfter = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campAfter?.currentAmount).toBe(4000.0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SUPPORTERS LEDGER & MOMENTUM CHART TRENDS
  // ─────────────────────────────────────────────────────────────
  describe('Audits, Reports & Funding Trends', () => {
    it('should return aggregated list of unique campaign supporters sorted by contribution', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/supporters`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);

      // Generous Partner B contributed 2500, Generous Donor A contributed 1500
      // Due to descending sorting, B should be first
      expect(res.body.data[0].email).toBe('partner.b@partnership.com');
      expect(res.body.data[0].name).toBe('Generous Partner B');
      expect(res.body.data[0].totalAmount).toBe(2500.0);

      expect(res.body.data[1].email).toBe('donor.a@giving.com');
      expect(res.body.data[1].name).toBe('Generous Donor A');
      expect(res.body.data[1].totalAmount).toBe(1500.0);
    });

    it('should block non-admins from retrieving supporters list', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/supporters`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });

    it('should return daily momentum chart data over 30-day window', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify that today's date exists and has the combined successful amount of 4000
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayEntry = res.body.data.find((item: any) => item.date === todayKey);
      expect(todayEntry).toBeDefined();
      expect(todayEntry.amount).toBe(4000.0);
    });

    it('should block non-admins from retrieving analytics trends', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. CLOSING fundraising
  // ─────────────────────────────────────────────────────────────
  describe('Campaign Closing fundraising', () => {
    it('should allow admin to close campaign fundraising', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/close`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ended');
    });

    it('should block members from closing campaign fundraising', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/close`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });
});
