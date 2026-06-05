import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyPluginAccess, dispatchedWebhooksLog } from '../services/plugins';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Plugin & Extensions Engine Module', () => {
  let tenantId: string;
  let adminToken: string;
  let compatiblePluginId = 'whatsapp-helper';
  let incompatiblePluginId = 'future-ai';

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.pluginWebhook.deleteMany({});
    await prisma.tenantPlugin.deleteMany({});
    await prisma.pluginDefinition.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Plugins Test Church', subdomain: 'plugins-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: ['member.create', 'member.read', 'tenant.settings'] },
      },
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
      data: { tenantId, email: 'admin@plugins-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // 5. Seed a default subscription plan & active subscription so member creation isn't blocked by billing limits
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Unlimited Plan',
        basePrice: 10.0,
        includedMembers: 1000,
        includedSms: 1000,
        includedStorageGb: 10.0,
        memberOverageRate: 0.0,
        smsOverageRate: 0.0,
        storageOverageRate: 0.0,
      },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // 6. Seed Plugin Definitions
    await prisma.pluginDefinition.create({
      data: {
        id: compatiblePluginId,
        name: 'WhatsApp Helper Extension',
        description: 'Sends automatic WhatsApp welcome notifications',
        version: '1.0.0',
        requiredPermissions: JSON.stringify(['member.read']),
        requiredOsVersion: '1.0.0',
        price: 5.0,
        isActive: true,
      },
    });

    await prisma.pluginDefinition.create({
      data: {
        id: incompatiblePluginId,
        name: 'Future AI Assistant',
        description: 'Drafts articles and answers emails',
        version: '2.0.0',
        requiredPermissions: JSON.stringify(['member.read']),
        requiredOsVersion: '2.0.0', // Greater than 1.0.0 platform OS
        price: 15.0,
        isActive: true,
      },
    });
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. COMPATIBILITY & INSTALLATION
  // ─────────────────────────────────────────────────────────────
  describe('Plugin Installation and Compatibility', () => {
    it('should block installation if required OS version is incompatible', async () => {
      const res = await request(app)
        .post('/api/plugins/install')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pluginId: incompatiblePluginId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Incompatible platform version');
    });

    it('should install compatible plugin successfully in pending status', async () => {
      const res = await request(app)
        .post('/api/plugins/install')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pluginId: compatiblePluginId });

      expect(res.status).toBe(201);
      expect(res.body.data.pluginId).toBe(compatiblePluginId);
      expect(res.body.data.status).toBe('pending');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. PERMISSIONS GATING SANDBOX
  // ─────────────────────────────────────────────────────────────
  describe('Sandbox Permissions Gating', () => {
    it('should block access before permissions are explicitly granted', async () => {
      const isAllowed = await verifyPluginAccess(tenantId, compatiblePluginId, 'member.read');
      expect(isAllowed).toBe(false);
    });

    it('should block granting unrequested permission scope', async () => {
      const res = await request(app)
        .put(`/api/plugins/${compatiblePluginId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['member.read', 'member.delete'] }); // delete not requested in manifest

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cannot grant unrequested permissions');
    });

    it('should grant requested permission scope and set plugin status active', async () => {
      const res = await request(app)
        .put(`/api/plugins/${compatiblePluginId}/permissions`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: ['member.read'] });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('active');
      expect(JSON.parse(res.body.data.grantedPermissions)).toContain('member.read');

      const isAllowed = await verifyPluginAccess(tenantId, compatiblePluginId, 'member.read');
      expect(isAllowed).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. SETTINGS CONFIGURATION
  // ─────────────────────────────────────────────────────────────
  describe('Custom Settings Configuration', () => {
    it('should save and retrieve custom configuration settings successfully', async () => {
      const res = await request(app)
        .put(`/api/plugins/${compatiblePluginId}/settings`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ settings: { instanceId: 'whatsapp-instance-xyz', autoWelcome: true } });

      expect(res.status).toBe(200);
      expect(JSON.parse(res.body.data.settings).instanceId).toBe('whatsapp-instance-xyz');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // D. WEBHOOKS & EVENT DISPATCHING
  // ─────────────────────────────────────────────────────────────
  describe('Event Trigger Webhooks', () => {
    it('should register a webhook listener', async () => {
      const res = await request(app)
        .post(`/api/plugins/${compatiblePluginId}/webhooks`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventTrigger: 'member.created',
          targetUrl: 'https://whatsapp-thirdparty.com/events',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.eventTrigger).toBe('member.created');
      expect(res.body.data.targetUrl).toBe('https://whatsapp-thirdparty.com/events');
    });

    it('should dispatch webhooks when core member is created', async () => {
      const startCount = dispatchedWebhooksLog.length;

      // Create member (triggers member.created internally)
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Webhook', lastName: 'Subscriber' });

      expect(res.status).toBe(201);

      // Verify webhook triggered
      expect(dispatchedWebhooksLog.length).toBe(startCount + 1);
      const delivery = dispatchedWebhooksLog[dispatchedWebhooksLog.length - 1];
      expect(delivery.eventTrigger).toBe('member.created');
      expect(delivery.url).toBe('https://whatsapp-thirdparty.com/events');
      expect(delivery.payload.firstName).toBe('Webhook');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // E. CLEAN UNINSTALLATION
  // ─────────────────────────────────────────────────────────────
  describe('Clean Uninstallation', () => {
    it('should uninstall the plugin, dropping all configs and webhooks', async () => {
      const res = await request(app)
        .post('/api/plugins/uninstall')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pluginId: compatiblePluginId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify installation is deleted
      const plugin = await prisma.tenantPlugin.findUnique({
        where: {
          tenantId_pluginId: { tenantId, pluginId: compatiblePluginId },
        },
      });
      expect(plugin).toBeNull();

      // Verify webhooks are purged
      const webhooks = await prisma.pluginWebhook.findMany({
        where: { tenantId, eventTrigger: 'member.created' },
      });
      expect(webhooks.length).toBe(0);
    });
  });
});
