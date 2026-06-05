import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Digital Library Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let guestToken: string;

  let categoryId: string;
  let subCategoryId: string;

  let freeManualId: string;
  let freeManualSlug: string;
  let memberEbookId: string;
  let paidGuideId: string;

  beforeAll(async () => {
    // 1. Clean up database
    await prisma.libraryPurchase.deleteMany({});
    await prisma.libraryResource.deleteMany({});
    await prisma.libraryCategory.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant & Entitlement
    const tenant = await prisma.tenant.create({
      data: { name: 'Library Test Church', subdomain: 'library-test', status: 'active' },
    });
    tenantId = tenant.id;

    await prisma.moduleDefinition.upsert({
      where: { key: 'digital-library-resource-center' },
      update: {},
      create: { key: 'digital-library-resource-center', name: 'Digital Library', category: 'Content' },
    });

    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey: 'digital-library-resource-center',
        status: 'active',
      },
    });

    // 3. Setup permissions & roles
    const permNames = [
      'member.read',
      'tenant.settings',
      'digital-library-resource-center.read',
      'digital-library-resource-center.create',
      'digital-library-resource-center.update',
      'digital-library-resource-center.delete',
      'digital-library-resource-center.view_reports',
      'digital-library-resource-center.manage_settings',
    ];
    for (const pName of permNames) {
      await prisma.permission.upsert({
        where: { name: pName },
        update: {},
        create: { name: pName, description: pName },
      });
    }

    const permissions = await prisma.permission.findMany({
      where: { name: { in: permNames } },
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
    const memberPerms = permissions.filter((p) =>
      ['member.read', 'digital-library-resource-center.read'].includes(p.name)
    );
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@library-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@library-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'Library',
        lastName: 'Member',
        membershipStatus: 'member',
      },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 6. Create Guest User (authenticated but no roles)
    const guestUser = await prisma.user.create({
      data: { tenantId, email: 'guest@library-test.com', passwordHash: passHash },
    });
    guestToken = jwt.sign({ userId: guestUser.id, tenantId, email: guestUser.email }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CATEGORY CREATION & LISTING
  // ─────────────────────────────────────────────────────────────
  describe('Categories', () => {
    it('should allow admin to create a category', async () => {
      const res = await request(app)
        .post('/api/library/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Leadership Manuals',
          slug: 'leadership-manuals',
          description: 'Official guides for leaders.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Leadership Manuals');
      categoryId = res.body.data.id;
    });

    it('should allow admin to create a nested subcategory', async () => {
      const res = await request(app)
        .post('/api/library/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cell Leaders',
          slug: 'cell-leaders',
          parentId: categoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentId).toBe(categoryId);
      subCategoryId = res.body.data.id;
    });

    it('should list categories', async () => {
      const res = await request(app)
        .get('/api/library/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. RESOURCE CREATION
  // ─────────────────────────────────────────────────────────────
  describe('Resource Management', () => {
    it('should allow admin to create a free public resource', async () => {
      const res = await request(app)
        .post('/api/library/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Guest Onboarding Guide',
          slug: 'guest-onboarding-guide',
          description: 'Welcome manual for new visitors.',
          author: 'Pastor Charles',
          fileUrl: 'https://cdn.church.com/manuals/onboarding.pdf',
          fileSize: 102450,
          fileType: 'pdf',
          pricingType: 'free',
          visibility: 'public',
          status: 'published',
          categoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Guest Onboarding Guide');
      expect(res.body.data.visibility).toBe('public');

      freeManualId = res.body.data.id;
      freeManualSlug = res.body.data.slug;
    });

    it('should allow admin to create a members-only resource', async () => {
      const res = await request(app)
        .post('/api/library/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Members Covenant eBook',
          fileUrl: 'https://cdn.church.com/books/covenant.epub',
          fileType: 'epub',
          pricingType: 'free',
          visibility: 'members_only',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visibility).toBe('members_only');

      memberEbookId = res.body.data.id;
    });

    it('should allow admin to create a paid study resource', async () => {
      const res = await request(app)
        .post('/api/library/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Dynamic Faith Workbook',
          fileUrl: 'https://cdn.church.com/books/faith-workbook.pdf',
          fileType: 'pdf',
          pricingType: 'paid',
          price: 4.99,
          visibility: 'public',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.pricingType).toBe('paid');
      expect(res.body.data.price).toBe(4.99);

      paidGuideId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ACCESS CONTROLS AND VISIBILITY LISTING
  // ─────────────────────────────────────────────────────────────
  describe('Access Controls & Listing', () => {
    it('should list member-only resources for members', async () => {
      const res = await request(app)
        .get('/api/library/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3); // free, member-only, and paid are all listed (paid can be purchased)
    });

    it('should hide member-only resources in guest listings', async () => {
      const res = await request(app)
        .get('/api/library/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // member-only is excluded
      const ids = res.body.data.map((r: any) => r.id);
      expect(ids).not.toContain(memberEbookId);
    });

    it('should deny guest details fetch for members-only resource', async () => {
      const res = await request(app)
        .get(`/api/library/resources/${memberEbookId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow members details fetch for members-only resource', async () => {
      const res = await request(app)
        .get(`/api/library/resources/${memberEbookId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(memberEbookId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. DOWNLOAD INCREMENTATION
  // ─────────────────────────────────────────────────────────────
  describe('Downloads', () => {
    it('should download a free public resource successfully, incrementing stats', async () => {
      const res = await request(app)
        .post(`/api/library/resources/${freeManualId}/download`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${guestToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.fileUrl).toBe('https://cdn.church.com/manuals/onboarding.pdf');
      expect(res.body.data.downloadCount).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. PAID RESOURCE PURCHASE FLOW & VERIFICATION
  // ─────────────────────────────────────────────────────────────
  describe('Resource Purchases', () => {
    it('should block downloading paid resource before purchase', async () => {
      const res = await request(app)
        .post(`/api/library/resources/${paidGuideId}/download`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('purchase may be required');
    });

    it('should allow purchasing a paid resource', async () => {
      const res = await request(app)
        .post(`/api/library/resources/${paidGuideId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.amountPaid).toBe(4.99);
    });

    it('should allow downloading paid resource after purchase', async () => {
      const res = await request(app)
        .post(`/api/library/resources/${paidGuideId}/download`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.fileUrl).toBe('https://cdn.church.com/books/faith-workbook.pdf');
      expect(res.body.data.downloadCount).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. ARCHIVING/SOFT DELETE
  // ─────────────────────────────────────────────────────────────
  describe('Resource Archiving', () => {
    it('should allow admin to soft delete a resource', async () => {
      const res = await request(app)
        .delete(`/api/library/resources/${freeManualId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });

    it('should exclude archived resources from lists', async () => {
      const res = await request(app)
        .get('/api/library/resources')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((r: any) => r.id);
      expect(ids).not.toContain(freeManualId);
    });
  });
});
