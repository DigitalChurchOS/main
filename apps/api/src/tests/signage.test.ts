import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Digital Signage & TV Display Module', () => {
  let tenantId: string;
  let branchId: string;
  let adminToken: string;
  let memberToken: string;
  let screenId: string;
  let playlistId: string;
  let slide1Id: string;
  let slide2Id: string;
  let slide3Id: string;

  beforeAll(async () => {
    // 1. Clean up database in dependency order
    await prisma.displayScreen.deleteMany({});
    await prisma.signagePlaylistItem.deleteMany({});
    await prisma.signagePlaylist.deleteMany({});
    await prisma.signageSlide.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant & Branch (using UTC to ensure strict predictable test time)
    const tenant = await prisma.tenant.create({
      data: { name: 'Signage Test Church', subdomain: 'signage-test', status: 'active' },
    });
    tenantId = tenant.id;

    const branch = await prisma.branch.create({
      data: { tenantId, name: 'Main Campus', timezone: 'UTC', status: 'active' },
    });
    branchId = branch.id;

    // 3. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.read', 'tenant.settings'] } },
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
    const memberReadPerm = permissions.find((p) => p.name === 'member.read');
    if (memberReadPerm) {
      await prisma.rolePermission.create({
        data: { roleId: memberRole.id, permissionId: memberReadPerm.id },
      });
    }

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@signage-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@signage-test.com', passwordHash: passHash },
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
  // 1. SIGNAGE SLIDES CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Signage Slides Admin CRUD', () => {
    it('should allow admin to create slides of different types', async () => {
      const res1 = await request(app)
        .post('/api/signage/slides')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Welcome Announcement Slide',
          type: 'announcement',
          durationSeconds: 15,
          content: JSON.stringify({ title: 'Welcome to Church!', body: 'Service starts soon.' }),
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.name).toBe('Welcome Announcement Slide');
      expect(res1.body.data.durationSeconds).toBe(15);
      slide1Id = res1.body.data.id;

      const res2 = await request(app)
        .post('/api/signage/slides')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Service Countdown Slide',
          type: 'countdown',
          durationSeconds: 10,
          content: JSON.stringify({ targetTime: '10:00' }),
        });
      expect(res2.status).toBe(201);
      slide2Id = res2.body.data.id;

      const res3 = await request(app)
        .post('/api/signage/slides')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Main Video Promo',
          type: 'media',
          durationSeconds: 30,
          content: JSON.stringify({ mediaUrl: 'https://cdn.church.org/promo.mp4' }),
        });
      expect(res3.status).toBe(201);
      slide3Id = res3.body.data.id;
    });

    it('should list all slides for a tenant', async () => {
      const res = await request(app)
        .get('/api/signage/slides')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should allow admin to update a slide', async () => {
      const res = await request(app)
        .patch(`/api/signage/slides/${slide1Id}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          durationSeconds: 20,
          name: 'Welcome Announcement Slide v2',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.durationSeconds).toBe(20);
      expect(res.body.data.name).toBe('Welcome Announcement Slide v2');
    });

    it('should block non-admins from creating or modifying slides', async () => {
      const res = await request(app)
        .post('/api/signage/slides')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Unauthorized Slide', type: 'announcement' });
      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SIGNAGE PLAYLISTS & ITEMS
  // ─────────────────────────────────────────────────────────────
  describe('Signage Playlists & Slide Ordering', () => {
    it('should allow admin to create a playlist', async () => {
      const res = await request(app)
        .post('/api/signage/playlists')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lobby Screen Rotation',
          description: 'Default lobby TV announcements',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Lobby Screen Rotation');
      playlistId = res.body.data.id;
    });

    it('should add slides to the playlist in a specific sequence order', async () => {
      const item1 = await request(app)
        .post(`/api/signage/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slideId: slide1Id, order: 1 });
      expect(item1.status).toBe(201);

      const item2 = await request(app)
        .post(`/api/signage/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slideId: slide2Id, order: 2 });
      expect(item2.status).toBe(201);

      const item3 = await request(app)
        .post(`/api/signage/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slideId: slide3Id, order: 3 });
      expect(item3.status).toBe(201);
    });

    it('should retrieve playlist with items sorted by order', async () => {
      const res = await request(app)
        .get(`/api/signage/playlists/${playlistId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(3);
      expect(res.body.data.items[0].slideId).toBe(slide1Id);
      expect(res.body.data.items[1].slideId).toBe(slide2Id);
      expect(res.body.data.items[2].slideId).toBe(slide3Id);
    });

    it('should support reordering playlist slides', async () => {
      // Fetch playlist to get list item IDs
      const getRes = await request(app)
        .get(`/api/signage/playlists/${playlistId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      const items = getRes.body.data.items;

      // Reorder items: swap first and second slide
      const res = await request(app)
        .put(`/api/signage/playlists/${playlistId}/items/order`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemOrders: [
            { id: items[0].id, order: 2 },
            { id: items[1].id, order: 1 },
          ],
        });
      expect(res.status).toBe(200);

      // Verify new order
      const checkRes = await request(app)
        .get(`/api/signage/playlists/${playlistId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.body.data.items[0].slideId).toBe(slide2Id); // Now first
      expect(checkRes.body.data.items[1].slideId).toBe(slide1Id); // Now second
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DISPLAY SCREENS & RENDERING
  // ─────────────────────────────────────────────────────────────
  describe('Display Screens & Render Endpoints', () => {
    it('should allow admin to create and configure a screen', async () => {
      const res = await request(app)
        .post('/api/signage/screens')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Main Lobby TV',
          locationCode: 'lobby',
          branchId,
          activePlaylistId: playlistId,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Main Lobby TV');
      expect(res.body.data.status).toBe('offline');
      screenId = res.body.data.id;
    });

    it('should allow public ping endpoint to update screen health check', async () => {
      const res = await request(app)
        .post(`/api/signage/screens/${screenId}/ping`)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.lastPingAt).toBeDefined();

      // Check via admin that screen reflects online status
      const getRes = await request(app)
        .get(`/api/signage/screens/${screenId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.body.data.status).toBe('online');
    });

    it('should allow public render endpoint to return current slides list', async () => {
      const res = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.data.screenName).toBe('Main Lobby TV');
      expect(res.body.data.active).toBe(true);
      expect(res.body.data.emergencyOverrideActive).toBe(false);
      expect(res.body.data.slides.length).toBe(3);
      expect(res.body.data.slides[0].id).toBe(slide2Id); // Sorted by order
    });

    it('should support emergency override overlays', async () => {
      // Trigger override
      const overrideRes = await request(app)
        .post(`/api/signage/screens/${screenId}/override`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'FIRE ALERT! PLEASE EVACUATE THE LOBBY.' });
      expect(overrideRes.status).toBe(200);

      // Render endpoint should now show override active and empty slides
      const renderRes = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(renderRes.status).toBe(200);
      expect(renderRes.body.data.emergencyOverrideActive).toBe(true);
      expect(renderRes.body.data.emergencyOverrideText).toBe('FIRE ALERT! PLEASE EVACUATE THE LOBBY.');
      expect(renderRes.body.data.slides.length).toBe(0);

      // Clear override
      const clearRes = await request(app)
        .post(`/api/signage/screens/${screenId}/override`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: null });
      expect(clearRes.status).toBe(200);

      // Verify normal rendering resumed
      const normalRes = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(normalRes.body.data.emergencyOverrideActive).toBe(false);
      expect(normalRes.body.data.slides.length).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. TIMEZONE SCHEDULING RULES
  // ─────────────────────────────────────────────────────────────
  describe('Timezone Playlist Scheduling Rules', () => {
    it('should return empty slides if playlist is scheduled out-of-bounds', async () => {
      // Calculate day of week other than today
      const now = new Date();
      const currentDay = now.getUTCDay();
      const otherDay = (currentDay + 1) % 7; // Tomorrow

      // Update playlist scheduleRules to only run tomorrow (inactive today)
      const inactiveRule = [
        {
          dayOfWeek: otherDay,
          startTime: '00:00',
          endTime: '23:59',
        },
      ];

      const patchRes = await request(app)
        .patch(`/api/signage/playlists/${playlistId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduleRules: JSON.stringify(inactiveRule),
        });
      expect(patchRes.status).toBe(200);

      // Render screen - should be inactive
      const renderRes = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(renderRes.status).toBe(200);
      expect(renderRes.body.data.active).toBe(false);
      expect(renderRes.body.data.slides.length).toBe(0);
    });

    it('should return slides list if playlist scheduling rule matches current time in branch timezone', async () => {
      // Calculate day of week of today in UTC
      const now = new Date();
      const currentDay = now.getUTCDay();

      // Update playlist scheduleRules to run today (active today)
      const activeRule = [
        {
          dayOfWeek: currentDay,
          startTime: '00:00',
          endTime: '23:59',
        },
      ];

      const patchRes = await request(app)
        .patch(`/api/signage/playlists/${playlistId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduleRules: JSON.stringify(activeRule),
        });
      expect(patchRes.status).toBe(200);

      // Render screen - should be active and return slides
      const renderRes = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(renderRes.status).toBe(200);
      expect(renderRes.body.data.active).toBe(true);
      expect(renderRes.body.data.slides.length).toBe(3);
    });
  });
});
