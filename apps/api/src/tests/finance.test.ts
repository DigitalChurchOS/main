import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Financial Management & Accounting Module (Module 23)', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let accountId: string;
  let budgetId: string;
  let expenseId: string;

  beforeAll(async () => {
    // 1. Clean up database in order of dependencies
    await prisma.reconciliationRecord.deleteMany({});
    await prisma.expenseRequest.deleteMany({});
    await prisma.financialTransaction.deleteMany({});
    await prisma.financialBudget.deleteMany({});
    await prisma.financialAccount.deleteMany({});
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
      data: { name: 'Finance Test Church', subdomain: 'finance-test', status: 'active' },
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
        encryptedCredentials: encryptCredentials(JSON.stringify({ secretKey: 'sk_test_finance_mock_key' }), tenantId),
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
      data: { tenantId, email: 'admin@finance-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 6. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@finance-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. FINANCIAL ACCOUNTS & BUDGETS CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Financial Accounts and Departmental Budgets CRUD', () => {
    it('should allow admin to define operating accounts', async () => {
      const res = await request(app)
        .post('/api/finance/accounts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Main Operating Bank Account',
          accountType: 'asset',
          balance: 10000.0,
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Main Operating Bank Account');
      expect(res.body.data.balance).toBe(10000.0);
      accountId = res.body.data.id;
    });

    it('should allow admin to define departmental budgets', async () => {
      const res = await request(app)
        .post('/api/finance/budgets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Media Outreach Budget 2026',
          amountLimit: 5000.0,
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-12-31T23:59:59.000Z',
          category: 'media',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Media Outreach Budget 2026');
      expect(res.body.data.amountLimit).toBe(5000.0);
      budgetId = res.body.data.id;
    });

    it('should list budgets publicly to authenticated staff/members', async () => {
      const res = await request(app)
        .get('/api/finance/budgets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].utilizationRatio).toBe(0); // initially 0.0
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. EXPENSES REQUESTS & APPROVALS WORKFLOW
  // ─────────────────────────────────────────────────────────────
  describe('Expense Outflows & Approvals Workflow', () => {
    it('should allow staff/members to submit expense requests', async () => {
      const res = await request(app)
        .post('/api/finance/expenses')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          accountId,
          budgetId,
          amount: 800.0,
          category: 'media',
          description: 'Purchased wireless lapel microphones for streaming.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.amount).toBe(800.0);
      expenseId = res.body.data.id;
    });

    it('should allow admin to approve expense request, debiting account and updating budget', async () => {
      // 1. Approve the request
      const approveRes = await request(app)
        .post(`/api/finance/expenses/${expenseId}/approve`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('approved');

      // 2. Assert that account balance decreased: 10000 - 800 = 9200
      const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
      expect(account!.balance).toBe(9200.0);

      // 3. Assert budget spentAmount increased: 0 + 800 = 800
      const budget = await prisma.financialBudget.findUnique({ where: { id: budgetId } });
      expect(budget!.spentAmount).toBe(800.0);

      // 4. Assert transaction log creation
      const ledger = await prisma.financialTransaction.findFirst({
        where: { tenantId, accountId, type: 'debit', reference: expenseId },
      });
      expect(ledger).toBeDefined();
      expect(ledger!.amount).toBe(800.0);
    });

    it('should block approval if expense exceeds the budget limit capacity', async () => {
      // 1. Submit another request for 4500 (microphones already took 800, so remaining is 4200. 4500 exceeds 5000 limit)
      const res = await request(app)
        .post('/api/finance/expenses')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          accountId,
          budgetId,
          amount: 4500.0,
          category: 'media',
          description: 'High-end camera lenses upgrade.',
        });
      const hugeExpenseId = res.body.data.id;

      // 2. Try to approve
      const approveRes = await request(app)
        .post(`/api/finance/expenses/${hugeExpenseId}/approve`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.status).toBe(400);
      expect(approveRes.body.error).toContain('Budget limit exceeded');
    });

    it('should support rejecting expense requests', async () => {
      const res = await request(app)
        .post('/api/finance/expenses')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          accountId,
          amount: 150.0,
          category: 'travel',
          description: 'Taxi fares for outreach team.',
        });
      const rejectId = res.body.data.id;

      const rejectRes = await request(app)
        .post(`/api/finance/expenses/${rejectId}/reject`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('rejected');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DYNAMIC REVENUE AUDITS
  // ─────────────────────────────────────────────────────────────
  describe('Dynamic Revenue summaries', () => {
    it('should calculate overall revenue combining tithes, partnerships, and commerce sales', async () => {
      // A. Create succeeded Donation (tithe) of 150
      const gCat = await prisma.givingCategory.create({ data: { tenantId, name: 'Tithes' } });
      await prisma.donation.create({
        data: {
          tenantId,
          categoryId: gCat.id,
          amount: 150.0,
          status: 'succeeded',
          paymentMethod: 'card',
        },
      });

      // B. Create succeeded Partnership of 250
      const pCat = await prisma.partnershipCategory.create({ data: { tenantId, name: 'Missions' } });
      await prisma.partnership.create({
        data: {
          tenantId,
          categoryId: pCat.id,
          amount: 250.0,
          status: 'succeeded',
          paymentMethod: 'card',
        },
      });

      // C. Create succeeded StoreOrder (sale) of 300
      await prisma.storeOrder.create({
        data: {
          tenantId,
          amount: 300.0,
          status: 'completed', // completed order is counted!
          customerName: 'Loyal Customer',
          customerEmail: 'customer@revenue-test.com',
          fulfillmentType: 'pickup',
        },
      });

      // D. Query report revenue summaries
      const res = await request(app)
        .get('/api/finance/reports/revenue')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.givingTotal).toBe(150.0);
      expect(res.body.data.partnershipTotal).toBe(250.0);
      expect(res.body.data.storeTotal).toBe(300.0);
      expect(res.body.data.overallTotal).toBe(700.0); // 150 + 250 + 300
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. BANK ACCOUNT RECONCILIATIONS
  // ─────────────────────────────────────────────────────────────
  describe('Reconciliation Audits', () => {
    it('should evaluate ledger balance against bank statement balance and flag discrepancies', async () => {
      // Current ledger balance is 9200. Let's send 9200 (should be matched)
      const res1 = await request(app)
        .post('/api/finance/reconcile')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          accountId,
          bankStatementBalance: 9200.0,
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.status).toBe('matched');

      // Send 9000 (should record a discrepancy status)
      const res2 = await request(app)
        .post('/api/finance/reconcile')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          accountId,
          bankStatementBalance: 9000.0,
        });

      expect(res2.status).toBe(201);
      expect(res2.body.data.status).toBe('discrepancy');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. EXPORTS REPORTS CSV STREAMING
  // ─────────────────────────────────────────────────────────────
  describe('Reports Exporting', () => {
    it('should generate and stream a structured CSV report', async () => {
      const res = await request(app)
        .get('/api/finance/reports/export')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('FINANCIAL BUDGETS UTILIZATION REPORT');
      expect(res.text).toContain('Main Operating Bank Account');
      expect(res.text).toContain('Media Outreach Budget 2026');
    });
  });
});
