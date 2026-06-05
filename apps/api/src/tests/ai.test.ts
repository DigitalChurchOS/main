import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { encryptCredentials } from '../lib/vault';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS AI Media & Content Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let mediaAssetId: string;

  beforeAll(async () => {
    // 1. Clean up database
    await prisma.aiMediaJob.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.tenantConnectedService.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'AI Test Church', subdomain: 'ai-test', status: 'active' },
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
      data: { tenantId, email: 'admin@ai-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@ai-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 6. Create default MediaAsset
    const media = await prisma.mediaAsset.create({
      data: {
        tenantId,
        title: 'Sunday Sermon on Ephesians',
        type: 'video',
        providerType: 'external_link',
        sourceUrl: 'https://cdn.grace.org/video/ephesians-sermon.mp4',
        status: 'published',
      },
    });
    mediaAssetId = media.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. INTEGRATION CONFIGURATION SETUP
  // ─────────────────────────────────────────────────────────────
  describe('AI Service Config & Setup', () => {
    it('should successfully save OpenAI configuration', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerId: 'openai',
          credentials: { apiKey: 'sk-mock-openai-key-12345' },
          providerMode: 'bring_your_own',
          isActive: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providerId).toBe('openai');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. AI CONTENT REPURPOSING JOBS
  // ─────────────────────────────────────────────────────────────
  describe('AI Content Repurposing Jobs', () => {
    it('should run a transcription job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'transcription',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.jobType).toBe('transcription');
      expect(res.body.data.transcript).toContain('walking in grace');
    });

    it('should run a timed subtitles job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'subtitles',
          transcript: 'Custom transcript to convert into subtitles.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.subtitles).toContain('1\n00:00:01');
    });

    it('should run a summary job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'summary',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.summary).toContain('Ephesians 2');
    });

    it('should run a clips suggestion job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'clips',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      
      const clips = JSON.parse(res.body.data.metadataJson);
      expect(clips.length).toBe(3);
      expect(clips[0].start).toBe(60);
    });

    it('should run a blog draft job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'blog_draft',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.blogDraft).toContain('<h1>Walking in Amazing Grace</h1>');
    });

    it('should run a devotional draft job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'devotional',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.devotionalDraft).toContain('Day 1');
    });

    it('should run a social caption job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'social_caption',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.socialCaption).toContain('#Grace');
    });

    it('should run a translation job successfully', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'translation',
          targetLang: 'es',
          transcript: 'This is English text.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.transcript).toBe('[Translated to es]: This is English text.');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SECURE ENDPOINTS & JOB QUERYING
  // ─────────────────────────────────────────────────────────────
  describe('Secured Queries & List Jobs', () => {
    it('should list all executed jobs', async () => {
      const res = await request(app)
        .get('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    });

    it('should restrict job trigger from non-admin users', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          mediaAssetId,
          jobType: 'transcription',
        });

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3.5. CUSTOM CLIP SUGGESTIONS & MANUAL SELECTIONS
  // ─────────────────────────────────────────────────────────────
  describe('Custom Clip Suggestions & Manual Selections', () => {
    it('should support custom AI clip suggestion options', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'clips',
          numClips: 5,
          duration: 45,
          prompt: 'focus on faith',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      
      const clips = JSON.parse(res.body.data.metadataJson);
      expect(clips.length).toBe(5);
      expect(clips[0].end - clips[0].start).toBe(45);
      expect(clips[0].description).toContain('focus on faith');
    });

    it('should reject AI clip suggestions with invalid duration option (e.g. 120 seconds)', async () => {
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'clips',
          numClips: 3,
          duration: 120,
          prompt: 'focus on faith',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('AI clip duration option must be 30, 45, 60, or 90 seconds');
    });

    it('should allow manually creating a 60-second clip', async () => {
      const res = await request(app)
        .post('/api/ai/clips/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentAssetId: mediaAssetId,
          title: 'Manual 60s Clip',
          clipStartSeconds: 10,
          clipEndSeconds: 70,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('short_clip');
      expect(res.body.data.parentAssetId).toBe(mediaAssetId);
      expect(res.body.data.durationSeconds).toBe(60);
      expect(res.body.data.clipStartSeconds).toBe(10);
      expect(res.body.data.clipEndSeconds).toBe(70);
    });

    it('should allow manually creating a 30-second clip', async () => {
      const res = await request(app)
        .post('/api/ai/clips/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentAssetId: mediaAssetId,
          title: 'Manual 30s Clip',
          clipStartSeconds: 20,
          clipEndSeconds: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.durationSeconds).toBe(30);
    });

    it('should allow manually creating a clip with any custom duration (e.g. 45 seconds)', async () => {
      const res = await request(app)
        .post('/api/ai/clips/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentAssetId: mediaAssetId,
          title: 'Manual 45s Clip',
          clipStartSeconds: 0,
          clipEndSeconds: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.durationSeconds).toBe(45);
    });

    it('should reject manually creating a clip with invalid bounds (start >= end)', async () => {
      const res = await request(app)
        .post('/api/ai/clips/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentAssetId: mediaAssetId,
          title: 'Manual Invalid Clip',
          clipStartSeconds: 30,
          clipEndSeconds: 20,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be before end time');
    });

    it('should reject manually creating a clip with negative start time', async () => {
      const res = await request(app)
        .post('/api/ai/clips/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentAssetId: mediaAssetId,
          title: 'Manual Negative Clip',
          clipStartSeconds: -10,
          clipEndSeconds: 20,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be 0 or greater');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. ROBUST ERROR HANDLING
  // ─────────────────────────────────────────────────────────────
  describe('Error Handling', () => {
    it('should fail cleanly when invalid configuration is set', async () => {
      // Overwrite OpenAI configuration to be invalid (empty apiKey)
      await prisma.tenantConnectedService.deleteMany({
        where: { tenantId, providerId: 'openai' },
      });

      const setupRes = await request(app)
        .post('/api/services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerId: 'openai',
          credentials: { apiKey: '' }, // Invalid empty api key
          providerMode: 'bring_your_own',
          isActive: true,
        });
      expect(setupRes.status).toBe(200);

      // Execute job
      const res = await request(app)
        .post('/api/ai/jobs')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mediaAssetId,
          jobType: 'transcription',
        });

      // Status should be 201 because the job is created, but the state should be failed
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('failed');
      expect(res.body.data.error).toContain('apiKey is required');
    });
  });
});
