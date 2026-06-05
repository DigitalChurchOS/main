import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS E-Commerce & Church Store Module (Module 22)', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let categoryId: string;
  let campaignId: string;
  let physicalProductId: string;
  let physicalVariantId: string;
  let digitalProductId: string;
  let couponId: string;
  let transactionId: string;
  let orderId: string;

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.orderItem.deleteMany({});
    await prisma.storeOrder.deleteMany({});
    await prisma.storeCoupon.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.productCategory.deleteMany({});
    await prisma.campaignUpdate.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.recurringGiving.deleteMany({});
    await prisma.givingCategory.deleteMany({});
    await prisma.partnership.deleteMany({});
    await prisma.recurringPartnership.deleteMany({});
    await prisma.partnershipCategory.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Store Test Church', subdomain: 'store-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup Stripe connection
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
        encryptedCredentials: encryptCredentials(JSON.stringify({ secretKey: 'sk_test_store_mock_key' }), tenantId),
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
      data: { tenantId, email: 'admin@store-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@store-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 7. Create a cause campaign to test proceeds attribution
    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        title: 'Missions IFrame Drive',
        slug: 'missions-drive',
        goalAmount: 20000.0,
        currentAmount: 0.0,
      },
    });
    campaignId = campaign.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. PRODUCT CATEGORIES CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Product Categories Administration', () => {
    it('should allow admin to create categories', async () => {
      const res = await request(app)
        .post('/api/store/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Apparel & Merchandise',
          description: 'Church t-shirts, hoodies, caps, and branded bags',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Apparel & Merchandise');
      categoryId = res.body.data.id;
    });

    it('should block members from creating categories', async () => {
      const res = await request(app)
        .post('/api/store/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Books & Bibles' });

      expect(res.status).toBe(403);
    });

    it('should list categories publicly', async () => {
      const res = await request(app)
        .get('/api/store/categories')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(categoryId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PRODUCTS & VARIANTS CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Products Catalog Administration', () => {
    it('should allow admin to define products', async () => {
      // Create a physical product
      const res1 = await request(app)
        .post('/api/store/products')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Branded Grace T-Shirt',
          slug: 'grace-tshirt',
          description: 'Sleek custom premium cotton t-shirt.',
          price: 25.0,
          type: 'physical',
          inventory: 100,
          categoryId,
          campaignId, // product proceeds attribution
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.slug).toBe('grace-tshirt');
      expect(res1.body.data.price).toBe(25.0);
      physicalProductId = res1.body.data.id;

      // Create a digital product
      const res2 = await request(app)
        .post('/api/store/products')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Foundational Truths study guide',
          slug: 'truths-guide',
          description: 'Complete digital theology outline.',
          price: 15.0,
          type: 'digital',
          digitalFileUrl: 'https://grace-library.s3.amazonaws.com/truths-guide.pdf',
          inventory: 99999, // practically unlimited
          categoryId,
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.slug).toBe('truths-guide');
      expect(res2.body.data.digitalFileUrl).toBe('https://grace-library.s3.amazonaws.com/truths-guide.pdf');
      digitalProductId = res2.body.data.id;
    });

    it('should allow admin to add variants to products', async () => {
      const res = await request(app)
        .post(`/api/store/products/${physicalProductId}/variants`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Size: L',
          priceOverride: 28.0, // Large costs slightly extra
          inventory: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Size: L');
      expect(res.body.data.priceOverride).toBe(28.0);
      expect(res.body.data.inventory).toBe(20);
      physicalVariantId = res.body.data.id;
    });

    it('should support listing products with filters & pagination', async () => {
      const res = await request(app)
        .get('/api/store/products')
        .set('x-tenant-id', tenantId)
        .query({ search: 'Grace', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].slug).toBe('grace-tshirt');
      expect(res.body.meta.total).toBe(1);
    });

    it('should allow retrieving a product by slug', async () => {
      const res = await request(app)
        .get('/api/store/products/truths-guide')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(digitalProductId);
    });

    it('should allow admin to update product inventory', async () => {
      const res = await request(app)
        .patch(`/api/store/products/${digitalProductId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventory: 5000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.inventory).toBe(5000);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. COUPONS & CART PRICING ENGINE
  // ─────────────────────────────────────────────────────────────
  describe('Coupons and Pricing Calculations', () => {
    it('should allow admin to register coupons', async () => {
      const res = await request(app)
        .post('/api/store/coupons')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SUMMER20',
          discountType: 'percentage',
          discountValue: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('SUMMER20');
      expect(res.body.data.discountValue).toBe(20);
    });

    it('should calculate correct subtotals, percentages discounts, and flat-rate shipping costs', async () => {
      const res = await request(app)
        .post('/api/store/cart/validate')
        .set('x-tenant-id', tenantId)
        .send({
          items: [
            { productId: physicalProductId, variantId: physicalVariantId, quantity: 2 }, // 28.0 * 2 = 56.0
            { productId: digitalProductId, quantity: 1 }, // 15.0 * 1 = 15.0
          ], // subtotal = 71.0
          couponCode: 'SUMMER20', // 20% of 71.0 = 14.2
          fulfillmentType: 'shipping', // physical requires shipping (+10.0)
        });

      expect(res.status).toBe(200);
      expect(res.body.data.subtotal).toBe(71.0);
      expect(res.body.data.discount).toBe(14.2);
      expect(res.body.data.shipping).toBe(10.0);
      expect(res.body.data.total).toBe(66.8); // 71 - 14.2 + 10 = 66.8
    });

    it('should skip shipping fees when pickup fulfillment option is selected', async () => {
      const res = await request(app)
        .post('/api/store/cart/validate')
        .set('x-tenant-id', tenantId)
        .send({
          items: [
            { productId: physicalProductId, variantId: physicalVariantId, quantity: 2 },
          ], // subtotal = 56.0
          fulfillmentType: 'pickup', // pickup skips shipping
        });

      expect(res.status).toBe(200);
      expect(res.body.data.subtotal).toBe(56.0);
      expect(res.body.data.shipping).toBe(0.0);
      expect(res.body.data.total).toBe(56.0);
    });

    it('should block validation if requested quantity exceeds active stock levels', async () => {
      const res = await request(app)
        .post('/api/store/cart/validate')
        .set('x-tenant-id', tenantId)
        .send({
          items: [
            { productId: physicalProductId, variantId: physicalVariantId, quantity: 50 }, // Variant stock is only 20
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Insufficient inventory');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. CHECKOUT CHECKOUT FLOW & STRIPE PAYMENTS INTEGRATION
  // ─────────────────────────────────────────────────────────────
  describe('Secure Stripe Checkouts & Webhooks', () => {
    it('should initiate checkout and retrieve client secrets', async () => {
      const res = await request(app)
        .post('/api/store/checkout')
        .set('x-tenant-id', tenantId)
        .send({
          items: [
            { productId: physicalProductId, variantId: physicalVariantId, quantity: 2 }, // Large shirt = 28 * 2 = 56
            { productId: digitalProductId, quantity: 1 }, // Guide = 15
          ],
          fulfillmentType: 'pickup',
          customerName: 'Store Customer',
          customerEmail: 'customer@store-test.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.status).toBe('pending');
      expect(res.body.data.order.amount).toBe(71.0); // 56 + 15
      expect(res.body.data.clientSecret).toBeDefined();
      expect(res.body.data.transactionId).toBeDefined();

      orderId = res.body.data.order.id;
      transactionId = res.body.data.transactionId;
    });

    it('should process webhook success, transition order, decrement inventory, and increment campaigns', async () => {
      // 1. Assert initial state: Variant stock = 20, Campaign Amount = 0
      const variantBefore = await prisma.productVariant.findUnique({ where: { id: physicalVariantId } });
      expect(variantBefore!.inventory).toBe(20);

      const campaignBefore = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campaignBefore!.currentAmount).toBe(0.0);

      // 2. Trigger simulation success webhook (Admin only)
      const res = await request(app)
        .post('/api/store/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transactionId,
          status: 'succeeded',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('processing');

      // 3. Assert stock decreased: 20 - 2 = 18
      const variantAfter = await prisma.productVariant.findUnique({ where: { id: physicalVariantId } });
      expect(variantAfter!.inventory).toBe(18);

      // 4. Assert campaign currentAmount is incremented by checkout amount (71.0)
      const campaignAfter = await prisma.campaign.findUnique({ where: { id: campaignId } });
      expect(campaignAfter!.currentAmount).toBe(71.0);

      // 5. Assert giving analytics telemetry logged event
      const analyticsCount = await prisma.analyticsEvent.count({
        where: { tenantId, category: 'giving', name: 'donate', entityId: orderId },
      });
      expect(analyticsCount).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. FULFILLMENT MANAGEMENT & HISTORY
  // ─────────────────────────────────────────────────────────────
  describe('Fulfillments & Purchase History Logs', () => {
    it('should allow admin to manage physical shipping status stages', async () => {
      const res = await request(app)
        .patch(`/api/store/orders/${orderId}/status`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('shipped');
    });

    it('should allow retrieval of customer order purchase histories', async () => {
      const res = await request(app)
        .get('/api/store/history')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`); // retrieves user profile email history (member@store-test.com - initially empty)

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);

      // Let's retrieve specifically the customer email history using query parameters
      const historyRes = await request(app)
        .get('/api/store/history')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ email: 'customer@store-test.com' });

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.length).toBe(1);
      expect(historyRes.body.data[0].id).toBe(orderId);
      expect(historyRes.body.data[0].amount).toBe(71.0);
      expect(historyRes.body.data[0].orderItems[0].product.slug).toBe('grace-tshirt');
    });
  });
});
