import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createConversation, sendMessage, getConversation } from '../services/liveChat';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 44: Centralized Dynamic Settings Engine', () => {
  let tenantId: string;
  let adminUserId: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // ── Clean up related tables ──────────────────────────────
    await prisma.moduleSettings.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatConversation.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Create Tenant ───────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Sovereign Grace Church', subdomain: 'grace-church', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Set up Roles & Permissions ─────────────────────────
    const settingsPermission = await prisma.permission.findUnique({ where: { name: 'tenant.settings' } });
    const readPermission = await prisma.permission.findUnique({ where: { name: 'member.read' } });

    // Admin role (has settings + read permissions)
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    if (settingsPermission && readPermission) {
      await prisma.rolePermission.createMany({
        data: [
          { roleId: adminRole.id, permissionId: settingsPermission.id },
          { roleId: adminRole.id, permissionId: readPermission.id }
        ]
      });
    }

    // Normal staff role (only has read permission)
    const staffRole = await prisma.role.create({ data: { tenantId, name: 'Staff', isCustom: false } });
    if (readPermission) {
      await prisma.rolePermission.create({
        data: { roleId: staffRole.id, permissionId: readPermission.id }
      });
    }

    // ── Create Users & Tokens ──────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'senior.pastor@grace.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const normalUser = await prisma.user.create({
      data: { tenantId, email: 'usher@grace.com', passwordHash: passHash },
    });
    await prisma.userRole.create({ data: { userId: normalUser.id, roleId: staffRole.id } });
    userToken = jwt.sign({ userId: normalUser.id, tenantId, email: normalUser.email }, JWT_SECRET);
  });

  describe('GET /api/settings/schema', () => {
    it('should allow authenticated staff to fetch registered module configurations', async () => {
      const res = await request(app)
        .get('/api/settings/schema')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);

      const chatSchema = res.body.data.find((m: any) => m.moduleKey === 'liveChat');
      expect(chatSchema).toBeDefined();
      expect(chatSchema.moduleName).toBe('Live Chat & Pastoral Care');
      expect(chatSchema.fields).toHaveLength(5);
      
      const screeningField = chatSchema.fields.find((f: any) => f.key === 'enableAiScreening');
      expect(screeningField.type).toBe('boolean');
      expect(screeningField.default).toBe(true);
    });

    it('should reject requests without authentication', async () => {
      const res = await request(app)
        .get('/api/settings/schema')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/settings (All and Specific Module Settings)', () => {
    it('should return merged default settings when no overrides exist in the database', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.liveChat).toBeDefined();
      expect(res.body.data.liveChat.enableAiScreening).toBe(true);
      expect(res.body.data.liveChat.autoEscalateTimer).toBe(15);
      expect(res.body.data.giving.defaultCurrency).toBe('USD');
    });

    it('should return settings for a single specific module', async () => {
      const res = await request(app)
        .get('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enableAiScreening).toBe(true);
      expect(res.body.data.autoEscalateTimer).toBe(15);
    });
  });

  describe('PATCH /api/settings/:moduleKey (Update Settings & Validation Rules)', () => {
    it('should allow admin to update setting overrides with correct types', async () => {
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enableAiScreening: false,
          autoEscalateTimer: 45
        });

      expect(res.status).toBe(200);
      expect(res.body.data.enableAiScreening).toBe(false);
      expect(res.body.data.autoEscalateTimer).toBe(45);

      // Verify persistence in DB
      const record = await prisma.moduleSettings.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'liveChat' } }
      });
      expect(record).toBeDefined();
      const dbVals = JSON.parse(record!.settings);
      expect(dbVals.enableAiScreening).toBe(false);
      expect(dbVals.autoEscalateTimer).toBe(45);
    });

    it('should reject updates from normal staff without tenant.settings permission', async () => {
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enableAiScreening: true
        });

      expect(res.status).toBe(403);
    });

    it('should reject invalid keys not present in the module schema', async () => {
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nonExistentKey: 'arbitrary'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('nonExistentKey');
    });

    it('should reject incorrect data types (e.g. string passed to boolean toggle)', async () => {
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enableAiScreening: 'string-instead-of-boolean'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be a boolean');
    });

    it('should reject numeric values violating min/max bounds (e.g. timer below 5)', async () => {
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          autoEscalateTimer: 2 // min is 5
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be at least 5');
    });

    it('should reject select values that are not in the approved options list', async () => {
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          defaultCounsellorLanguage: 'invalid-lang-code'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('is not a valid option');
    });

    it('should merge updates and preserve existing config keys', async () => {
      // 1. Partial update: change defaultCounsellorLanguage only
      const res = await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          defaultCounsellorLanguage: 'es'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.defaultCounsellorLanguage).toBe('es');
      // Verify other fields set in the previous test are preserved
      expect(res.body.data.enableAiScreening).toBe(false);
      expect(res.body.data.autoEscalateTimer).toBe(45);
    });
  });

  describe('POST /api/settings/:moduleKey/reset', () => {
    it('should allow admin to reset settings back to default values', async () => {
      const res = await request(app)
        .post('/api/settings/liveChat/reset')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.enableAiScreening).toBe(true); // default
      expect(res.body.data.autoEscalateTimer).toBe(15);   // default
      expect(res.body.data.defaultCounsellorLanguage).toBe('en'); // default

      // Verify database entry is deleted
      const record = await prisma.moduleSettings.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: 'liveChat' } }
      });
      expect(record).toBeNull();
    });

    it('should reject resets from normal staff', async () => {
      const res = await request(app)
        .post('/api/settings/liveChat/reset')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Centralized settings dynamic integration on liveChat safety screening', () => {
    it('should escalate conversation on crisis keywords when enableAiScreening is enabled', async () => {
      // 1. Reset to default (AI screening enabled: true)
      await request(app)
        .post('/api/settings/liveChat/reset')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      // 2. Create conversation
      const conv = await createConversation(tenantId, { visitorName: 'John Seeking Help' });
      
      // 3. Send message with self-harm words
      await sendMessage(tenantId, conv.id, {
        senderType: 'visitor',
        body: 'I am totally hopeless and want to end my life now.'
      });

      // 4. Verify conversation is automatically escalated and safety flag set
      const updated = await getConversation(tenantId, conv.id, true);
      expect(updated!.safetyAlert).toBe(true);
      expect(updated!.status).toBe('escalated');
      expect(updated!.priority).toBe('urgent');
      expect(updated!.aiSuggestedReply).toBe('Dear friend, your life is valuable to God and us. A crisis counselor has been alerted. Let’s pray.');
    });

    it('should NOT escalate conversation or trigger AI prompts when enableAiScreening is toggled off', async () => {
      // 1. Update settings to disable AI safety screening
      await request(app)
        .patch('/api/settings/liveChat')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enableAiScreening: false
        });

      // 2. Create another conversation
      const conv = await createConversation(tenantId, { visitorName: 'Dave Seeking Help' });

      // 3. Send message with self-harm words
      await sendMessage(tenantId, conv.id, {
        senderType: 'visitor',
        body: 'I want to kill myself.'
      });

      // 4. Verify conversation is NOT escalated and safety flags are NOT set because screening is disabled
      const updated = await getConversation(tenantId, conv.id, true);
      expect(updated!.safetyAlert).toBe(false);
      expect(updated!.status).not.toBe('escalated');
      expect(updated!.aiSuggestedReply).toBeNull();
    });
  });
});
