import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 30: Member Outreach & Invite Campaign Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberId: string;
  let member2Id: string;
  let campaignId: string;
  let assetId: string;
  let invitePageId: string;
  let invitePage2Id: string;
  let slug1: string;
  let slug2: string;

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.shareEvent.deleteMany({});
    await prisma.inviteLinkClick.deleteMany({});
    await prisma.personalizedInvitePage.deleteMany({});
    await prisma.inviteAsset.deleteMany({});
    await prisma.outreachCampaign.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Outreach Church', subdomain: 'outreach-church', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Admin Role + Permissions ────────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin User ──────────────────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@outreach.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // ── Members ────────────────────────────────────────────
    const member1 = await prisma.member.create({
      data: { tenantId, firstName: 'Tunde', lastName: 'Bakare', email: 'tunde@example.com' },
    });
    memberId = member1.id;

    const member2 = await prisma.member.create({
      data: { tenantId, firstName: 'Amara', lastName: 'Okafor', email: 'amara@example.com' },
    });
    member2Id = member2.id;

    slug1 = `tunde-bakare-${Date.now()}`;
    slug2 = `amara-okafor-${Date.now()}`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════
  // A. OUTREACH CAMPAIGNS  (Outreach Campaign API)
  // ═══════════════════════════════════════════════════════════

  describe('Outreach Campaigns', () => {
    it('should create an outreach campaign with CTA and hashtags', async () => {
      const res = await request(app)
        .post('/api/outreach/campaigns')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Easter Invite Drive',
          description: 'Empower members to invite friends and family for Easter service',
          hashtags: '#EasterAtOutreach,#InviteAFriend',
          shareCaptions: 'This Easter, come experience the love of God with me at Outreach Church!',
          ctaLabel: 'Plan a Visit',
          ctaUrl: 'https://outreach-church.com/plan-a-visit',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Easter Invite Drive');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.hashtags).toContain('#EasterAtOutreach');
      expect(res.body.data.ctaLabel).toBe('Plan a Visit');
      campaignId = res.body.data.id;
    });

    it('should reject campaign without name', async () => {
      const res = await request(app)
        .post('/api/outreach/campaigns')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No name given' });

      expect(res.status).toBe(400);
    });

    it('should activate a campaign', async () => {
      const res = await request(app)
        .put(`/api/outreach/campaigns/${campaignId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
    });

    it('should list active campaigns', async () => {
      const res = await request(app)
        .get('/api/outreach/campaigns?status=active')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('active');
    });

    it('should get a campaign with assets count', async () => {
      const res = await request(app)
        .get(`/api/outreach/campaigns/${campaignId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Easter Invite Drive');
      expect(res.body.data._count).toBeDefined();
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await request(app)
        .get('/api/outreach/campaigns/fake-id')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // B. INVITE ASSETS  (Invite Asset API)
  // ═══════════════════════════════════════════════════════════

  describe('Invite Assets', () => {
    it('should add an image asset to the campaign', async () => {
      const res = await request(app)
        .post(`/api/outreach/campaigns/${campaignId}/assets`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assetType: 'image',
          title: 'Easter Square Graphic',
          url: 'https://cdn.outreach.com/easter-square.jpg',
          format: 'square',
          fileSize: 245000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.assetType).toBe('image');
      expect(res.body.data.format).toBe('square');
      assetId = res.body.data.id;
    });

    it('should add a video asset to the campaign', async () => {
      const res = await request(app)
        .post(`/api/outreach/campaigns/${campaignId}/assets`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assetType: 'video',
          title: 'Easter Invite Clip',
          url: 'https://cdn.outreach.com/easter-clip.mp4',
          format: 'vertical',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.assetType).toBe('video');
    });

    it('should reject asset without required fields', async () => {
      const res = await request(app)
        .post(`/api/outreach/campaigns/${campaignId}/assets`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should list all assets for a campaign', async () => {
      const res = await request(app)
        .get(`/api/outreach/campaigns/${campaignId}/assets`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter assets by type', async () => {
      const res = await request(app)
        .get(`/api/outreach/campaigns/${campaignId}/assets?assetType=image`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].assetType).toBe('image');
    });

    it('should delete an asset', async () => {
      const res = await request(app)
        .delete(`/api/outreach/campaigns/${campaignId}/assets/${assetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // C. PERSONALIZED INVITE PAGES (Personalized Invite Page API)
  // ═══════════════════════════════════════════════════════════

  describe('Personalized Invite Pages', () => {
    it('should create a personalized invite page for Tunde', async () => {
      const res = await request(app)
        .post('/api/outreach/invite-pages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          campaignId,
          memberId,
          slug: slug1,
          personalMessage: 'Hey friend! Join me this Easter at our church. You will be blessed!',
          ctaLabel: 'RSVP Now',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe(slug1);
      expect(res.body.data.personalMessage).toContain('Easter');
      expect(res.body.data.member.firstName).toBe('Tunde');
      invitePageId = res.body.data.id;
    });

    it('should create a personalized invite page for Amara', async () => {
      const res = await request(app)
        .post('/api/outreach/invite-pages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          campaignId,
          memberId: member2Id,
          slug: slug2,
          personalMessage: 'Come celebrate Easter with us!',
        });

      expect(res.status).toBe(201);
      invitePage2Id = res.body.data.id;
    });

    it('should reject invite page without required fields', async () => {
      const res = await request(app)
        .post('/api/outreach/invite-pages')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campaignId, memberId });

      expect(res.status).toBe(400);
    });

    it('should list invite pages for a campaign', async () => {
      const res = await request(app)
        .get(`/api/outreach/invite-pages?campaignId=${campaignId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter invite pages by member', async () => {
      const res = await request(app)
        .get(`/api/outreach/invite-pages?memberId=${memberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].member.firstName).toBe('Tunde');
    });

    it('should get a public invite page by slug (no auth needed)', async () => {
      const res = await request(app)
        .get(`/api/outreach/invite-pages/${slug1}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.personalMessage).toContain('Easter');
      expect(res.body.data.member.firstName).toBe('Tunde');
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app)
        .get('/api/outreach/invite-pages/non-existent-slug')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // D. CLICK & CONVERSION TRACKING  (Invite Link Tracking API)
  // ═══════════════════════════════════════════════════════════

  describe('Click & Conversion Tracking', () => {
    let clickId: string;

    it('should track clicks on an invite page', async () => {
      // Simulate 3 clicks
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post(`/api/outreach/invite-pages/${invitePageId}/click`)
          .set('x-tenant-id', tenantId)
          .send({ referrer: 'https://facebook.com', userAgent: 'Mozilla/5.0' });

        expect(res.status).toBe(201);
        if (i === 0) clickId = res.body.data.id;
      }
    });

    it('should track clicks on the second invite page', async () => {
      const res = await request(app)
        .post(`/api/outreach/invite-pages/${invitePage2Id}/click`)
        .set('x-tenant-id', tenantId)
        .send({ referrer: 'https://whatsapp.com' });

      expect(res.status).toBe(201);
    });

    it('should increment click count on the page', async () => {
      const page = await prisma.personalizedInvitePage.findUnique({ where: { id: invitePageId } });
      expect(page!.clickCount).toBe(3);
    });

    it('should list all clicks for a page', async () => {
      const res = await request(app)
        .get(`/api/outreach/invite-pages/${invitePageId}/clicks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].referrer).toBe('https://facebook.com');
    });

    it('should record a conversion from a click', async () => {
      const res = await request(app)
        .post(`/api/outreach/clicks/${clickId}/convert`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should increment conversion count on the page', async () => {
      const page = await prisma.personalizedInvitePage.findUnique({ where: { id: invitePageId } });
      expect(page!.conversionCount).toBe(1);
    });

    it('should return 404 when converting non-existent click', async () => {
      const res = await request(app)
        .post('/api/outreach/clicks/fake-id/convert')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // E. SHARE TRACKING  (Share Tracking API)
  // ═══════════════════════════════════════════════════════════

  describe('Share Tracking', () => {
    it('should track social shares across platforms', async () => {
      const platforms = ['facebook', 'twitter', 'whatsapp', 'copy_link'];
      for (const platform of platforms) {
        const res = await request(app)
          .post(`/api/outreach/invite-pages/${invitePageId}/share`)
          .set('x-tenant-id', tenantId)
          .send({ platform });

        expect(res.status).toBe(201);
        expect(res.body.data.platform).toBe(platform);
      }
    });

    it('should track QR code scan as a share', async () => {
      const res = await request(app)
        .post(`/api/outreach/invite-pages/${invitePage2Id}/share`)
        .set('x-tenant-id', tenantId)
        .send({ platform: 'qr_scan' });

      expect(res.status).toBe(201);
    });

    it('should reject share without platform', async () => {
      const res = await request(app)
        .post(`/api/outreach/invite-pages/${invitePageId}/share`)
        .set('x-tenant-id', tenantId)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should list all shares for a page', async () => {
      const res = await request(app)
        .get(`/api/outreach/invite-pages/${invitePageId}/shares`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(4);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // F. LEADERBOARD & ANALYTICS  (Conversion Attribution API)
  // ═══════════════════════════════════════════════════════════

  describe('Leaderboard & Campaign Analytics', () => {
    it('should return leaderboard ranked by conversions', async () => {
      const res = await request(app)
        .get(`/api/outreach/campaigns/${campaignId}/leaderboard`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      // Tunde should be #1 (1 conversion)
      expect(res.body.data[0].rank).toBe(1);
      expect(res.body.data[0].memberName).toContain('Tunde');
      expect(res.body.data[0].conversions).toBe(1);
      expect(res.body.data[0].clicks).toBe(3);
    });

    it('should return comprehensive campaign analytics', async () => {
      const res = await request(app)
        .get(`/api/outreach/campaigns/${campaignId}/analytics`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.totalPages).toBe(2);
      expect(data.totalClicks).toBe(4);   // 3 Tunde + 1 Amara
      expect(data.totalConversions).toBe(1);
      expect(data.totalShares).toBe(5);    // 4 Tunde + 1 Amara
      expect(data.shareByPlatform.facebook).toBe(1);
      expect(data.shareByPlatform.whatsapp).toBe(1);
      expect(data.shareByPlatform.qr_scan).toBe(1);
      expect(data.conversionRate).toBe('25.0%');
    });
  });
});
