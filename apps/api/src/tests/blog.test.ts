import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Dynamic Blog Engine Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let memberToken: string;

  let authorId: string;
  let categoryId: string;
  let childCategoryId: string;
  let tagId1: string;
  let tagId2: string;

  let articlePostId: string;
  let articlePostSlug: string;
  let devotionalPostId: string;
  let guestCommentId: string;

  beforeAll(async () => {
    // 1. Clean up database tables
    await prisma.blogPostComment.deleteMany({});
    await prisma.blogPostScripture.deleteMany({});
    await prisma.blogPostTag.deleteMany({});
    await prisma.blogPost.deleteMany({});
    await prisma.blogCategory.deleteMany({});
    await prisma.blogTag.deleteMany({});
    await prisma.speaker.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Blog Test Church', subdomain: 'blog-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.create', 'member.read', 'tenant.settings'] } },
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
      data: { tenantId, email: 'admin@blog-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Blog',
        lastName: 'Admin',
        membershipStatus: 'leader',
      },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // Create Member Role, User & Token
    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });
    
    const memberPerm = permissions.find(p => p.name === 'member.read');
    if (memberPerm) {
      await prisma.rolePermission.create({
        data: { roleId: memberRole.id, permissionId: memberPerm.id },
      });
    }

    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@blog-test.com', passwordHash: passHash },
    });

    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });

    memberToken = jwt.sign(
      { userId: memberUser.id, tenantId, email: memberUser.email },
      JWT_SECRET
    );

    // 5. Create Speaker/Author
    const speaker = await prisma.speaker.create({
      data: { tenantId, name: 'Pastor Charles', title: 'Senior Pastor', bio: 'Teaches grace.' },
    });
    authorId = speaker.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CATEGORY CREATION & LISTING
  // ─────────────────────────────────────────────────────────────
  describe('Categories', () => {
    it('should allow admin to create a parent category', async () => {
      const res = await request(app)
        .post('/api/blog/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Faith & Life',
          slug: 'faith-life',
          description: 'Devotionals and reflections on faith.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Faith & Life');
      expect(res.body.data.slug).toBe('faith-life');
      categoryId = res.body.data.id;
    });

    it('should allow admin to create a nested child category', async () => {
      const res = await request(app)
        .post('/api/blog/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Daily Prayers',
          slug: 'daily-prayers',
          parentId: categoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentId).toBe(categoryId);
      childCategoryId = res.body.data.id;
    });

    it('should return categories with parent-child relationships', async () => {
      const res = await request(app)
        .get('/api/blog/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      const parentCat = res.body.data.find((c: any) => c.id === categoryId);
      expect(parentCat.children.length).toBe(1);
      expect(parentCat.children[0].id).toBe(childCategoryId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. TAG CREATION & LISTING
  // ─────────────────────────────────────────────────────────────
  describe('Tags', () => {
    it('should allow admin to create blog tags', async () => {
      const res1 = await request(app)
        .post('/api/blog/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grace' });

      const res2 = await request(app)
        .post('/api/blog/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Discipleship' });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      tagId1 = res1.body.data.id;
      tagId2 = res2.body.data.id;
    });

    it('should list all tags for the tenant', async () => {
      const res = await request(app)
        .get('/api/blog/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].slug).toBe('discipleship');
      expect(res.body.data[1].slug).toBe('grace');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. BLOG POST CREATION (ARTICLE & DEVOTIONAL)
  // ─────────────────────────────────────────────────────────────
  describe('Blog Post Registration', () => {
    it('should allow admin to create a published article post with author, category, and tags', async () => {
      const res = await request(app)
        .post('/api/blog/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Understanding God\'s Grace',
          slug: 'understanding-gods-grace',
          content: '<p>Grace is unmerited favor...</p>',
          excerpt: 'An in-depth article about Grace.',
          postType: 'article',
          status: 'published',
          authorId,
          categoryId,
          tags: [tagId1, tagId2],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Understanding God\'s Grace');
      expect(res.body.data.slug).toBe('understanding-gods-grace');
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.category.id).toBe(categoryId);
      expect(res.body.data.author.id).toBe(authorId);
      expect(res.body.data.tags.length).toBe(2);

      articlePostId = res.body.data.id;
      articlePostSlug = res.body.data.slug;
    });

    it('should allow admin to create a draft devotional post with scriptures', async () => {
      const res = await request(app)
        .post('/api/blog/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Daily Walk in Peace',
          content: 'Keep your mind stayed on Him.',
          postType: 'devotional',
          status: 'draft',
          scriptures: ['Isaiah 26:3', 'Philippians 4:7'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.scriptures.length).toBe(2);
      expect(res.body.data.scriptures[0].reference).toBe('Isaiah 26:3');

      devotionalPostId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. GET BY SLUG & SECURITY BOUNDARIES
  // ─────────────────────────────────────────────────────────────
  describe('Get Post Detail', () => {
    it('should retrieve a published post by slug for any user', async () => {
      const res = await request(app)
        .get(`/api/blog/posts/${articlePostSlug}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(articlePostId);
      expect(res.body.data.title).toBe('Understanding God\'s Grace');
    });

    it('should allow admin to retrieve a draft post by ID', async () => {
      const res = await request(app)
        .get(`/api/blog/posts/${devotionalPostId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(devotionalPostId);
      expect(res.body.data.status).toBe('draft');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SEARCH & FILTERS
  // ─────────────────────────────────────────────────────────────
  describe('Asset Filtering & Search', () => {
    it('should list only published posts for public view by default', async () => {
      const res = await request(app)
        .get('/api/blog/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1); // Only 'Understanding God\'s Grace' (published)
      expect(res.body.data[0].id).toBe(articlePostId);
    });

    it('should list draft posts when explicitly requested by an admin', async () => {
      const res = await request(app)
        .get('/api/blog/posts?status=draft')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(devotionalPostId);
    });

    it('should filter posts by postType', async () => {
      const res = await request(app)
        .get('/api/blog/posts?postType=article')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].postType).toBe('article');
    });

    it('should filter posts by category', async () => {
      const res = await request(app)
        .get(`/api/blog/posts?categoryId=${categoryId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].categoryId).toBe(categoryId);
    });

    it('should search posts by title keyword', async () => {
      const res = await request(app)
        .get('/api/blog/posts?search=Grace')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Grace');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. COMMENTS AND MODERATION
  // ─────────────────────────────────────────────────────────────
  describe('Comments & Moderation', () => {
    it('should allow leaving a comment on a published post', async () => {
      const res = await request(app)
        .post(`/api/blog/posts/${articlePostId}/comments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'John Doe',
          email: 'john@gmail.com',
          content: 'This was a wonderful read. Thank you!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.displayName).toBe('John Doe');
      expect(res.body.data.status).toBe('pending'); // default is pending

      guestCommentId = res.body.data.id;
    });

    it('should allow members to comment', async () => {
      const res = await request(app)
        .post(`/api/blog/posts/${articlePostId}/comments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          displayName: 'Jane Admin',
          content: 'I agree. Very clear article.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
    });

    it('should hide pending comments from standard listings', async () => {
      const res = await request(app)
        .get(`/api/blog/posts/${articlePostId}/comments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`); // use memberToken

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // public/member doesn't see pending comments
    });

    it('should allow admin to approve a comment', async () => {
      const res = await request(app)
        .put(`/api/blog/comments/${guestCommentId}/status`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('should return approved comments in standard listings', async () => {
      const res = await request(app)
        .get(`/api/blog/posts/${articlePostId}/comments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`); // use memberToken

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1); // 1 approved comment
      expect(res.body.data[0].id).toBe(guestCommentId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. ARCHIVING/SOFT DELETE
  // ─────────────────────────────────────────────────────────────
  describe('Post Archiving', () => {
    it('should allow admin to archive/delete a post', async () => {
      const res = await request(app)
        .delete(`/api/blog/posts/${articlePostId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('archived');
    });

    it('should exclude archived posts from standard listings', async () => {
      const res = await request(app)
        .get('/api/blog/posts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // None are published now
    });
  });
});
