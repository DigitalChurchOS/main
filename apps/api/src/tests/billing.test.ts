import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Billing & Subscription Management Module', () => {
  let tenantId: string;
  let adminToken: string;
  let readOnlyToken: string;
  let freePlanId: string;
  let growthPlanId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.billingSubscriptionManagementModuleActivity.deleteMany({});
    await prisma.billingSubscriptionManagementModuleSettings.deleteMany({});
    await prisma.billingSubscriptionManagementModule.deleteMany({});
    await prisma.tenantSubscriptionAddOn.deleteMany({});
    await prisma.billingAddOn.deleteMany({});
    await prisma.billingCoupon.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.usageMeter.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Billing Test Church', subdomain: 'billing-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const permKeys = [
      'member.create',
      'member.read',
      'member.update',
      'tenant.settings',
      'billing-subscription-management.read',
      'billing-subscription-management.create',
      'billing-subscription-management.update',
      'billing-subscription-management.delete',
      'billing-subscription-management.manage_settings',
      'billing-subscription-management.view_reports',
    ];

    const permissions = [];
    for (const key of permKeys) {
      permissions.push(await prisma.permission.upsert({
        where: { name: key },
        update: {},
        create: { name: key, description: `Billing test permission ${key}` },
      }));
    }

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    const billingReaderRole = await prisma.role.create({
      data: { tenantId, name: 'Billing Reader', isCustom: true },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });
    const readPermission = permissions.find((p) => p.name === 'billing-subscription-management.read')!;
    await prisma.rolePermission.create({
      data: { roleId: billingReaderRole.id, permissionId: readPermission.id },
    });

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@billing-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    const readerUser = await prisma.user.create({
      data: { tenantId, email: 'reader@billing-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: readerUser.id, roleId: billingReaderRole.id },
    });
    readOnlyToken = jwt.sign(
      { userId: readerUser.id, tenantId, email: readerUser.email },
      JWT_SECRET
    );

    // 5. Seed default Twilio integration keys (to allow SMS sending resolver to function)
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'twilio',
        encryptedCredentials: require('../lib/vault').encryptCredentials(
          JSON.stringify({ accountSid: 'AC_test', authToken: 'auth_test', fromNumber: '+1234' }),
          tenantId
        ),
      },
    });

    // 6. Seed Plans
    const freePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Free Plan',
        basePrice: 0.0,
        includedMembers: 1,
        includedSms: 2,
        includedStorageGb: 1.0,
        memberOverageRate: 0.0, // Hard limit, no overage allowed
        smsOverageRate: 0.0,
        storageOverageRate: 0.0,
      },
    });
    freePlanId = freePlan.id;

    const growthPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Growth Plan',
        basePrice: 49.0,
        includedMembers: 2,
        includedSms: 5,
        includedStorageGb: 10.0,
        memberOverageRate: 5.0, // Overage cost per extra member
        smsOverageRate: 0.1,    // Overage cost per extra SMS
        storageOverageRate: 2.0, // Overage cost per extra GB
      },
    });
    growthPlanId = growthPlan.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. PLANS LISTING & SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────
  describe('Subscription Plans Management', () => {
    it('should list all active plans successfully', async () => {
      const res = await request(app)
        .get('/api/billing/plans')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.find((p: any) => p.name === 'Free Plan')).toBeDefined();
    });

    it('should subscribe the tenant to the Free Plan', async () => {
      const res = await request(app)
        .post('/api/billing/subscribe')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: freePlanId });

      expect(res.status).toBe(201);
      expect(res.body.data.planId).toBe(freePlanId);
      expect(res.body.data.status).toBe('active');
    });

    it('should expose the documented module overview and alias route', async () => {
      const overview = await request(app)
        .get('/api/billing/overview')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(overview.status).toBe(200);
      expect(overview.body.data.plans.length).toBe(2);
      expect(overview.body.data.subscription.planId).toBe(freePlanId);
      expect(overview.body.data.settings.moduleKey).toBe('billing-subscription-management');

      const alias = await request(app)
        .post('/api/billing-subscription-management')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Billing control profile', visibility: 'private' });

      expect(alias.status).toBe(201);
      expect(alias.body.data.tenantId).toBe(tenantId);
    });

    it('should enforce granular billing permissions on write endpoints', async () => {
      const res = await request(app)
        .post('/api/billing/coupons')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${readOnlyToken}`)
        .send({ code: 'READONLY', discountType: 'percent', discountValue: 10 });

      expect(res.status).toBe(403);
      expect(res.body.missing).toContain('billing-subscription-management.create');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. LIMIT ENFORCEMENT (HARD LIMIT ON FREE PLAN)
  // ─────────────────────────────────────────────────────────────
  describe('Strict Limit Enforcement (Free Plan)', () => {
    it('should allow creating first member (within limit)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'One' });

      expect(res.status).toBe(201);
    });

    it('should block creating second member (exceeds hard limit)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'Two' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('limit of 1 reached');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. PLAN UPGRADE & SOFT LIMIT OVERAGE
  // ─────────────────────────────────────────────────────────────
  describe('Plan Upgrades & Overage Billing (Growth Plan)', () => {
    it('should upgrade the tenant to the Growth Plan', async () => {
      const res = await request(app)
        .post('/api/billing/subscribe')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: growthPlanId });

      expect(res.status).toBe(201);
      expect(res.body.data.planId).toBe(growthPlanId);
    });

    it('should now allow creating second member (allowed with overage)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'Two' });

      expect(res.status).toBe(201);
    });

    it('should allow creating third member (allowed with overage)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'Three' });

      expect(res.status).toBe(201);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // D. METERED DISPATCH USAGE
  // ─────────────────────────────────────────────────────────────
  describe('Metered Usage Tracking', () => {
    it('should compile template and dispatch SMS, incrementing usage', async () => {
      const template = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Verification Code',
          type: 'sms',
          body: 'Code: 9999',
        });
      const templateId = template.body.data.id;

      // Seed consent
      const member = await prisma.member.findFirst({ where: { firstName: 'Member', lastName: 'One' } });
      await prisma.member.update({ where: { id: member!.id }, data: { phone: '+1999888777' } });
      await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: member!.id,
          optInSms: true,
        });

      // Send 6 SMS (limit is 5, 6th causes overage)
      for (let i = 0; i < 6; i++) {
        const sendRes = await request(app)
          .post('/api/communication/send')
          .set('x-tenant-id', tenantId)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ memberId: member!.id, templateId });
        expect(sendRes.status).toBe(200);
      }

      // Check usage stats
      const usageRes = await request(app)
        .get('/api/billing/usage')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.data.usage.sms_sent).toBe(6);
      expect(usageRes.body.data.usage.active_members).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // E. INVOICING & WEBHOOK GATING
  // ─────────────────────────────────────────────────────────────
  describe('Invoice Calculation & Webhook Suspensions', () => {
    let invoiceId: string;

    it('should generate invoice with base rate + overages', async () => {
      const res = await request(app)
        .post('/api/billing/invoice/trigger')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      
      // Expected Cost Calculation:
      // Base: $49.00
      // Member count: 3. Included: 2. Overage: 1 * $5.00 = $5.00
      // SMS count: 6. Included: 5. Overage: 1 * $0.10 = $0.10
      // Total Expected = $54.10
      expect(res.body.data.amount).toBe(54.10);
      expect(res.body.data.status).toBe('open');
      invoiceId = res.body.data.id;
    });

    it('should suspend tenant account upon invoice payment failure webhook', async () => {
      const webhookRes = await request(app)
        .post('/api/billing/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId, event: 'payment_intent.payment_failed' });

      expect(webhookRes.status).toBe(200);
      expect(webhookRes.body.success).toBe(true);

      // Verify tenant has been suspended
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant!.status).toBe('suspended');

      // Verify that member queries are blocked due to suspension
      const membersQuery = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      // Gated by tenant status verification in tenantMiddleware
      expect(membersQuery.status).toBe(403);
      expect(membersQuery.body.error).toContain('suspended');
    });

    it('should restore tenant account upon invoice payment success webhook', async () => {
      const webhookRes = await request(app)
        .post('/api/billing/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId, event: 'payment_intent.succeeded' });

      expect(webhookRes.status).toBe(200);

      // Verify tenant has been activated
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant!.status).toBe('active');

      // Verify queries are allowed again
      const membersQuery = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(membersQuery.status).toBe(200);
      expect(membersQuery.body.data.length).toBe(3);
    });
  });

  describe('Add-ons, Coupons, Settings, and Reports', () => {
    let couponId: string;
    let addOnId: string;
    let activeAddOnId: string;

    it('should create a coupon and apply it to the active subscription', async () => {
      const createRes = await request(app)
        .post('/api/billing/coupons')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'WELCOME10',
          discountType: 'percent',
          discountValue: 10,
          maxRedemptions: 5,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.code).toBe('WELCOME10');
      couponId = createRes.body.data.id;

      const applyRes = await request(app)
        .post('/api/billing/coupons/apply')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'WELCOME10' });

      expect(applyRes.status).toBe(200);
      expect(applyRes.body.data.couponCode).toBe('WELCOME10');
    });

    it('should create and activate an add-on with tenant-scoped entitlement sync', async () => {
      const createRes = await request(app)
        .post('/api/billing/add-ons')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'test-live-meetings',
          name: 'Test Live Meetings',
          moduleKey: 'live-meetings',
          price: 20,
          billingMode: 'monthly',
          usageMetricKey: 'meeting_participant_hours',
          includedQuantity: 50,
          overageRate: 1,
        });

      expect(createRes.status).toBe(201);
      addOnId = createRes.body.data.id;

      const activateRes = await request(app)
        .post(`/api/billing/add-ons/${addOnId}/activate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 2 });

      expect(activateRes.status).toBe(201);
      expect(activateRes.body.data.quantity).toBe(2);
      activeAddOnId = activateRes.body.data.id;

      const entitlement = await prisma.tenantModule.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'live-meetings' } },
      });
      expect(entitlement?.status).toBe('active');
      expect(entitlement?.billingRule).toBe('add_on');
    });

    it('should update billing settings and expose reports/activity', async () => {
      const settingsRes = await request(app)
        .patch('/api/billing/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerMode: 'bring_your_own',
          configJson: { invoicePrefix: 'TEST', publicPublishingRequiresPaidAccess: true },
        });

      expect(settingsRes.status).toBe(200);
      expect(settingsRes.body.data.providerMode).toBe('bring_your_own');
      expect(JSON.parse(settingsRes.body.data.configJson).invoicePrefix).toBe('TEST');

      const reportsRes = await request(app)
        .get('/api/billing/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reportsRes.status).toBe(200);
      expect(reportsRes.body.data.activeCoupons).toBe(1);
      expect(reportsRes.body.data.activeAddOns).toBeGreaterThanOrEqual(1);

      const activityRes = await request(app)
        .get('/api/billing/activity')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(activityRes.status).toBe(200);
      expect(activityRes.body.data.length).toBeGreaterThan(0);
    });

    it('should generate a discounted invoice with add-on line items after coupon application', async () => {
      const res = await request(app)
        .post('/api/billing/invoice/trigger')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.invoiceNumber).toContain('TEST-');
      expect(res.body.data.subtotal).toBe(94.0);
      expect(res.body.data.discount).toBe(9.4);
      expect(res.body.data.amount).toBe(84.6);
      expect(JSON.parse(res.body.data.lineItemsJson).some((item: any) => item.type === 'add_on')).toBe(true);

      const coupon = await prisma.billingCoupon.findUnique({ where: { id: couponId } });
      expect(coupon?.redeemedCount).toBe(1);
    });

    it('should deactivate an active add-on', async () => {
      const res = await request(app)
        .post(`/api/billing/subscription-add-ons/${activeAddOnId}/deactivate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('inactive');
    });
  });
});
