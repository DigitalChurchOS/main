import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Worship Experience Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let song1Id: string;
  let song2Id: string;
  let playlistId: string;
  let sessionId: string;
  let screenId: string;

  beforeAll(async () => {
    // 1. Clean up database in dependency order
    await prisma.displayScreen.deleteMany({});
    await prisma.worshipSession.deleteMany({});
    await prisma.worshipPlaylistItem.deleteMany({});
    await prisma.worshipPlaylist.deleteMany({});
    await prisma.worshipSong.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Worship Test Church', subdomain: 'worship-test', status: 'active' },
    });
    tenantId = tenant.id;

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
      data: { tenantId, email: 'admin@worship-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@worship-test.com', passwordHash: passHash },
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
  // 1. WORSHIP SONG CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Worship Song Library CRUD', () => {
    it('should allow admin to create songs with backing tracks and lyrics', async () => {
      const res1 = await request(app)
        .post('/api/worship/songs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Amazing Grace (My Chains Are Gone)',
          artist: 'Chris Tomlin',
          key: 'F',
          tempoBpm: 64,
          audioUrl: 'https://cdn.worship.org/amazing-grace-backing.mp3',
          backgroundUrl: 'https://cdn.worship.org/amazing-grace-bg.jpg',
          lyrics: 'Amazing grace how sweet the sound\nThat saved a wretch like me\n\nI once was lost, but now I\'m found\nWas blind but now I see\n\nMy chains are gone, I\'ve been set free\nMy God, my Savior has ransomed me',
          lyricsTiming: JSON.stringify([
            { startTime: 0, text: 'Amazing grace how sweet the sound...' },
            { startTime: 15, text: 'I once was lost, but now I\'m found...' },
            { startTime: 30, text: 'My chains are gone, I\'ve been set free...' },
          ]),
        });
      expect(res1.status).toBe(201);
      expect(res1.body.data.title).toBe('Amazing Grace (My Chains Are Gone)');
      expect(res1.body.data.artist).toBe('Chris Tomlin');
      expect(res1.body.data.key).toBe('F');
      expect(res1.body.data.tempoBpm).toBe(64);
      song1Id = res1.body.data.id;

      const res2 = await request(app)
        .post('/api/worship/songs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'How Great Is Our God',
          artist: 'Chris Tomlin',
          key: 'G',
          tempoBpm: 76,
          lyrics: 'The splendor of a King, clothed in majesty\nLet all the earth rejoice, all the earth rejoice\n\nHow great is our God, sing with me\nHow great is our God, and all will see how great\nHow great is our God',
        });
      expect(res2.status).toBe(201);
      song2Id = res2.body.data.id;
    });

    it('should list all worship songs for a tenant', async () => {
      const res = await request(app)
        .get('/api/worship/songs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should allow admin to update a song', async () => {
      const res = await request(app)
        .patch(`/api/worship/songs/${song1Id}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tempoBpm: 68,
          key: 'E',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.tempoBpm).toBe(68);
      expect(res.body.data.key).toBe('E');
    });

    it('should block non-admins from creating or modifying songs', async () => {
      const res = await request(app)
        .post('/api/worship/songs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Unauthorized Song', lyrics: 'Test lyrics' });
      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. WORSHIP PLAYLISTS
  // ─────────────────────────────────────────────────────────────
  describe('Worship Playlists & Sequencing', () => {
    it('should allow admin to create a worship playlist', async () => {
      const res = await request(app)
        .post('/api/worship/playlists')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sunday Morning Setlist',
          description: 'Setlist for May 28 service',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Sunday Morning Setlist');
      playlistId = res.body.data.id;
    });

    it('should add songs to the setlist in order', async () => {
      const item1 = await request(app)
        .post(`/api/worship/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ songId: song1Id, order: 1 });
      expect(item1.status).toBe(201);
      expect(item1.body.data.songId).toBe(song1Id);

      const item2 = await request(app)
        .post(`/api/worship/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ songId: song2Id, order: 2 });
      expect(item2.status).toBe(201);
      expect(item2.body.data.songId).toBe(song2Id);
    });

    it('should retrieve setlist with songs sorted by order index', async () => {
      const res = await request(app)
        .get(`/api/worship/playlists/${playlistId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.items[0].songId).toBe(song1Id);
      expect(res.body.data.items[1].songId).toBe(song2Id);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. WORSHIP SESSIONS & REAL-TIME CONTROLS
  // ─────────────────────────────────────────────────────────────
  describe('Worship Sessions & Real-time Live Controls', () => {
    it('should allow admin to create a worship session', async () => {
      const res = await request(app)
        .post('/api/worship/sessions')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Main Auditorium Worship',
          playlistId,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Main Auditorium Worship');
      expect(res.body.data.status).toBe('idle');
      sessionId = res.body.data.id;
    });

    it('should transition status to active and default to first song on start', async () => {
      const res = await request(app)
        .post(`/api/worship/sessions/${sessionId}/start`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.currentSongId).toBe(song1Id);
      expect(res.body.data.currentSlideIndex).toBe(0);
    });

    it('should support switching the active song', async () => {
      const res = await request(app)
        .post(`/api/worship/sessions/${sessionId}/song`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ songId: song2Id });
      expect(res.status).toBe(200);
      expect(res.body.data.currentSongId).toBe(song2Id);
      expect(res.body.data.currentSlideIndex).toBe(0);
    });

    it('should support lyric slide navigation (next, prev, specific index)', async () => {
      // Switch back to Song 1 (which has 3 slide segments separated by double newlines)
      await request(app)
        .post(`/api/worship/sessions/${sessionId}/song`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ songId: song1Id });

      // Navigate next
      const resNext = await request(app)
        .post(`/api/worship/sessions/${sessionId}/navigate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ direction: 'next' });
      expect(resNext.status).toBe(200);
      expect(resNext.body.data.currentSlideIndex).toBe(1);

      // Navigate prev
      const resPrev = await request(app)
        .post(`/api/worship/sessions/${sessionId}/navigate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ direction: 'prev' });
      expect(resPrev.status).toBe(200);
      expect(resPrev.body.data.currentSlideIndex).toBe(0);

      // Navigate to index 2 (Slide 3: Chorus)
      const resIndex = await request(app)
        .post(`/api/worship/sessions/${sessionId}/navigate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ direction: 2 });
      expect(resIndex.status).toBe(200);
      expect(resIndex.body.data.currentSlideIndex).toBe(2);

      // Navigate next when already at max bounds
      const resMax = await request(app)
        .post(`/api/worship/sessions/${sessionId}/navigate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ direction: 'next' });
      expect(resMax.status).toBe(200);
      expect(resMax.body.data.currentSlideIndex).toBe(2); // Retains last slide
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SIGNAGE INTEGRATION
  // ─────────────────────────────────────────────────────────────
  describe('Worship & Signage TV Screen Integration', () => {
    beforeAll(async () => {
      // Create a DisplayScreen linked to this active worship session
      const screen = await prisma.displayScreen.create({
        data: {
          tenantId,
          name: 'Lobby Screen Overlap',
          locationCode: 'lobby',
          status: 'online',
          activeWorshipSessionId: sessionId,
        },
      });
      screenId = screen.id;
    });

    it('should route active worship lyrics to lobby display render endpoint', async () => {
      const res = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.data.worshipSessionActive).toBe(true);
      expect(res.body.data.songTitle).toBe('Amazing Grace (My Chains Are Gone)');
      expect(res.body.data.artist).toBe('Chris Tomlin');
      expect(res.body.data.currentSlideIndex).toBe(2);
      expect(res.body.data.lyricsText).toBe('My chains are gone, I\'ve been set free\nMy God, my Savior has ransomed me');
      expect(res.body.data.slides.length).toBe(0); // Normal signage slides overridden
    });

    it('should fallback once worship session has ended', async () => {
      // End session
      await request(app)
        .post(`/api/worship/sessions/${sessionId}/end`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      // Render endpoint should now return standard signage output (worshipSessionActive absent or false)
      const res = await request(app)
        .get(`/api/signage/screens/${screenId}/render`)
        .send();
      expect(res.status).toBe(200);
      expect(res.body.data.worshipSessionActive).toBeUndefined();
      expect(res.body.data.lyricsText).toBeUndefined();
    });
  });
});
