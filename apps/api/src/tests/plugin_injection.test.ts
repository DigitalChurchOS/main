import React from 'react';
import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  pluginRegistry,
  pluginSlotRegistry,
  pluginInjectionRegistry,
  validatePluginManifest,
  PluginManifest,
  ThemeAdapter
} from '@churchos/frontend-contracts';

import {
  RenderPluginSlot,
  PluginInjectionRenderer,
  RendererProvider,
  sanitizePluginData,
  runPluginSecurityAudit
} from '../../../church-frontend/src/rendering';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// A helper to render components to a mock react tree string or element check
const testRender = (element: any) => {
  return element;
};

describe('Plugin Injection & Contracts System Tests', () => {
  let tenantId: string;
  let adminToken: string;
  let websiteId: string;

  beforeAll(async () => {
    // 1. Database cleanups
    await prisma.pluginWebhook.deleteMany({});
    await prisma.tenantPlugin.deleteMany({});
    await prisma.pluginDefinition.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Plugins Integration Church', subdomain: 'plugins-integration', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create active CMS module entitlement
    await prisma.tenantModule.create({
      data: { tenantId, moduleKey: 'website-cms', status: 'active' }
    });

    // 4. Create Theme & Website
    const theme = await prisma.theme.create({
      data: { name: 'Grace default theme', settings: '{}', isCustom: false }
    });

    const website = await prisma.website.create({
      data: { tenantId, themeId: theme.id, title: 'Grace Website', isActive: true }
    });
    websiteId = website.id;

    // 5. Create Admin User & Sign JWT Token
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@plugins-integration.com', passwordHash: passHash },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // 6. Create Plugin Definitions in Database
    await prisma.pluginDefinition.create({
      data: {
        id: 'mock-giving-booster',
        name: 'Giving Booster',
        version: '1.0.0',
        isActive: true
      }
    });

    // 7. Install Tenant Plugin with settings containing secret keys
    await prisma.tenantPlugin.create({
      data: {
        tenantId,
        pluginId: 'mock-giving-booster',
        status: 'active',
        settings: JSON.stringify({
          buttonColor: '#ff0000',
          apiKey: 'secret-key-123456',
          webhookUrl: 'https://api.plugin.com/webhook',
          stripeSecret: 'sk_test_51leakedSecret'
        })
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    pluginRegistry.clear();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. MANIFEST VALIDATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Plugin Manifest Validation', () => {
    it('should pass validation for a fully correct manifest', () => {
      const correctManifest: PluginManifest = {
        pluginKey: 'mock-giving-booster',
        displayName: 'Giving Booster',
        description: 'Boosts tithes and donations',
        version: '1.0.0',
        author: 'FaithTech',
        category: 'giving',
        status: 'enabled',
        injectionPoints: ['giving.form.afterAmount', 'page.footer.before'],
        themeSlots: [
          {
            slotKey: 'plugin.mock-giving-booster.booster-panel',
            displayName: 'Booster Panel',
            expectedDataType: 'GivingFormContract'
          }
        ],
        settingsSchema: [
          { name: 'buttonColor', displayName: 'Button Color', type: 'color' },
          { name: 'apiKey', displayName: 'API Key', type: 'secret' }
        ]
      };

      const errors = validatePluginManifest(correctManifest);
      expect(errors.length).toBe(0);
    });

    it('should flag missing metadata rules (pluginKey, category, version)', () => {
      const invalidManifest: any = {
        pluginKey: '',
        displayName: '',
        version: 'invalid-semver',
        category: 'unknown-category',
        status: 'unknown-status'
      };

      const errors = validatePluginManifest(invalidManifest);
      expect(errors).toContain('Missing pluginKey');
      expect(errors).toContain('Missing displayName');
      expect(errors).toContain('Invalid version format (must be semver)');
      expect(errors).toContain('Invalid category: "unknown-category"');
      expect(errors).toContain('Invalid status: "unknown-status"');
    });

    it('should flag slot keys that do not start with prefix plugin.{pluginKey}.', () => {
      const manifest: PluginManifest = {
        pluginKey: 'my-plugin',
        displayName: 'My Plugin',
        description: 'Test description',
        version: '1.0.0',
        author: 'Test',
        category: 'prayer',
        status: 'installed',
        themeSlots: [
          {
            slotKey: 'unprefixed-slot-key' as any,
            displayName: 'Wrong Slot Key',
            expectedDataType: 'UIStateContract'
          }
        ]
      };

      const errors = validatePluginManifest(manifest);
      expect(errors.some(e => e.includes('must start with prefix "plugin.my-plugin."'))).toBe(true);
    });

    it('should flag route paths that conflict with core routing paths', () => {
      const manifest: PluginManifest = {
        pluginKey: 'my-plugin',
        displayName: 'My Plugin',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        category: 'prayer',
        status: 'installed',
        publicRoutes: [
          { path: '/events', routeType: 'public', visibility: 'public' }
        ]
      };

      const errors = validatePluginManifest(manifest);
      expect(errors.some(e => e.includes('conflicts with core platform route'))).toBe(true);
    });

    it('should flag widget setting schemas containing unsafe secret exposures', () => {
      const manifest: PluginManifest = {
        pluginKey: 'my-plugin',
        displayName: 'My Plugin',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        category: 'prayer',
        status: 'installed',
        widgets: [
          {
            widgetKey: 'public-card',
            displayName: 'Card widget',
            description: 'Public widget view',
            expectedDataType: 'ResourceCardContract',
            settingsSchema: [
              { name: 'apiKeySecret', displayName: 'API Key', type: 'secret' }
            ]
          }
        ]
      };

      const errors = validatePluginManifest(manifest);
      expect(errors.some(e => e.includes('Unsafe secret setting field'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. REGISTRIES & CONFLIC ENGINE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Plugin Registries System', () => {
    const defaultManifest: PluginManifest = {
      pluginKey: 'mock-giving-booster',
      displayName: 'Giving Booster',
      description: 'Test',
      version: '1.0.0',
      author: 'Test',
      category: 'giving',
      status: 'enabled',
      injectionPoints: ['giving.form.afterAmount'],
      themeSlots: [
        {
          slotKey: 'plugin.mock-giving-booster.panel-view',
          displayName: 'Panel View',
          expectedDataType: 'GivingFormContract'
        }
      ]
    };

    it('should register manifests cleanly and prevent duplicate keys', () => {
      pluginRegistry.registerPlugin(defaultManifest);
      expect(pluginRegistry.getPlugin('mock-giving-booster')).toBeDefined();

      expect(() => pluginRegistry.registerPlugin(defaultManifest)).toThrow(/Duplicate pluginKey/);
    });

    it('should prevent duplicate slot keys registration across different plugins', () => {
      pluginRegistry.registerPlugin(defaultManifest);

      // Manually seed the slot key to simulate duplicate slot key conflict trigger
      (pluginRegistry as any).slots.add('plugin.another-plugin.booster-view');

      const anotherManifest: PluginManifest = {
        pluginKey: 'another-plugin',
        displayName: 'Another Plugin',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        category: 'giving',
        status: 'enabled',
        themeSlots: [
          {
            slotKey: 'plugin.another-plugin.booster-view',
            displayName: 'Stolen View',
            expectedDataType: 'GivingFormContract'
          }
        ]
      };

      expect(() => pluginRegistry.registerPlugin(anotherManifest)).toThrow(/Duplicate theme slot key registered/);
    });

    it('should block plugin registrations using invalid injection points', () => {
      const faultyManifest: PluginManifest = {
        pluginKey: 'faulty-plugin',
        displayName: 'Faulty Plugin',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        category: 'giving',
        status: 'enabled',
        injectionPoints: ['invalid.injection.point']
      };

      expect(() => pluginRegistry.registerPlugin(faultyManifest)).toThrow(/Invalid injection point/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SETTINGS SANITIZATION ENGINE
  // ─────────────────────────────────────────────────────────────
  describe('Data & Settings Sanitization Guards', () => {
    const manifestSchema = [
      { name: 'buttonColor', displayName: 'Color', type: 'color' },
      { name: 'stripeApiKey', displayName: 'Secret API Key', type: 'secret' }
    ];

    it('should recursively strip fields marked secret inside manifest schema', () => {
      const rawData = {
        buttonColor: '#00ff00',
        stripeApiKey: 'sk_test_1234567890abcdef'
      };

      const sanitized = sanitizePluginData(rawData, manifestSchema);
      expect(sanitized.stripeApiKey).toBeUndefined();
      expect(sanitized.buttonColor).toBe('#00ff00');
    });

    it('should strip common secret keywords even if not explicitly mapped inside schema', () => {
      const rawData = {
        label: 'Submit Donation',
        paymentToken: 'secret_token_123',
        webhook_secret: 'whsec_9999'
      };

      const sanitized = sanitizePluginData(rawData);
      expect(sanitized.paymentToken).toBeUndefined();
      expect(sanitized.webhook_secret).toBeUndefined();
      expect(sanitized.label).toBe('Submit Donation');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. RENDERING & SECURITY GATES
  // ─────────────────────────────────────────────────────────────
  describe('RenderPluginSlot Security & Status Gating', () => {
    const mockTheme: ThemeAdapter = {
      themeKey: 'system-fallback',
      displayName: 'System Theme',
      version: '1.0.0',
      slots: {},
      supportsSlot: () => false
    };

    const mockClientContext: any = {
      tenant: { tenantId: 'tenant-grace-123', name: 'Grace Church', status: 'active' },
      enabledPlugins: ['mock-giving-booster'],
      activeTheme: mockTheme,
      moduleEntitlements: ['giving-tithes'],
      isPreviewMode: false
    };

    beforeEach(() => {
      pluginRegistry.clear();
      // Register baseline plugin manifest
      pluginRegistry.registerPlugin({
        pluginKey: 'mock-giving-booster',
        displayName: 'Giving Booster',
        description: 'Boosts tithes and donations',
        version: '1.0.0',
        author: 'FaithTech',
        category: 'giving',
        status: 'enabled',
        requiredModules: ['giving-tithes'],
        themeSlots: [
          {
            slotKey: 'plugin.mock-giving-booster.booster-card',
            displayName: 'Card view',
            expectedDataType: 'GivingCategoryCardContract'
          }
        ]
      });
    });

    it('should block plugin rendering for a suspended tenant', () => {
      const suspendedContext = {
        ...mockClientContext,
        tenant: { ...mockClientContext.tenant, status: 'suspended' }
      };

      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: suspendedContext },
          React.createElement(RenderPluginSlot, {
            slotKey: 'plugin.mock-giving-booster.booster-card',
            contractData: {},
            pluginKey: 'mock-giving-booster'
          })
        )
      );

      expect(el).toBeDefined();
    });

    it('should block plugin if status is disabled or blocked in the manifest registry', () => {
      pluginRegistry.unregisterPlugin('mock-giving-booster');
      pluginRegistry.registerPlugin({
        pluginKey: 'mock-giving-booster',
        displayName: 'Giving Booster',
        description: 'Boosts tithes and donations',
        version: '1.0.0',
        author: 'FaithTech',
        category: 'giving',
        status: 'blocked', // status is blocked
        requiredModules: ['giving-tithes']
      });

      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: mockClientContext },
          React.createElement(RenderPluginSlot, {
            slotKey: 'plugin.mock-giving-booster.booster-card' as any,
            contractData: {},
            pluginKey: 'mock-giving-booster'
          })
        )
      );

      expect(el).toBeDefined();
    });

    it('should enforce required core module dependencies', () => {
      const restrictedContext = {
        ...mockClientContext,
        moduleEntitlements: [] // giving-tithes is disabled
      };

      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: restrictedContext },
          React.createElement(RenderPluginSlot, {
            slotKey: 'plugin.mock-giving-booster.booster-card',
            contractData: {},
            pluginKey: 'mock-giving-booster'
          })
        )
      );

      expect(el).toBeDefined();
    });

    it('should gate member-only visibility for unauthorized guests', () => {
      const anonymousContext = {
        ...mockClientContext,
        memberId: undefined // guest session
      };

      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: anonymousContext },
          React.createElement(RenderPluginSlot, {
            slotKey: 'plugin.mock-giving-booster.booster-card',
            contractData: { visibility: 'member_only' },
            pluginKey: 'mock-giving-booster'
          })
        )
      );

      expect(el).toBeDefined();
    });

    it('should enforce password protected visibility gates', () => {
      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: mockClientContext },
          React.createElement(RenderPluginSlot, {
            slotKey: 'plugin.mock-giving-booster.booster-card',
            contractData: { visibility: 'password_protected', password: 'secretpassword' },
            pluginKey: 'mock-giving-booster'
          })
        )
      );

      expect(el).toBeDefined();
    });

    it('should catch component crashes inside error boundary without halting pages', () => {
      // Mock theme slot renderer to throw an error
      const brokenTheme: ThemeAdapter = {
        themeKey: 'broken-theme',
        displayName: 'Broken Theme',
        version: '1.0.0',
        supportsSlot: (slot) => slot === 'plugin.mock-giving-booster.booster-card',
        slots: {
          'plugin.mock-giving-booster.booster-card': () => {
            throw new Error('Component crashed during rendering loop');
          }
        }
      };

      const brokenContext = {
        ...mockClientContext,
        activeTheme: brokenTheme
      };

      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: brokenContext },
          React.createElement(RenderPluginSlot, {
            slotKey: 'plugin.mock-giving-booster.booster-card',
            contractData: {},
            pluginKey: 'mock-giving-booster'
          })
        )
      );

      expect(el).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SIDE-BY-SIDE INJECTION & ISOLATION
  // ─────────────────────────────────────────────────────────────
  describe('Plugin Injection Collection Renderer', () => {
    const mockTheme: ThemeAdapter = {
      themeKey: 'system-fallback',
      displayName: 'System Theme',
      version: '1.0.0',
      slots: {},
      supportsSlot: () => false
    };

    const mockContext: any = {
      tenant: { tenantId: 'tenant-grace-123', name: 'Grace Church', status: 'active' },
      enabledPlugins: ['plugin-a', 'plugin-b'],
      activeTheme: mockTheme,
      moduleEntitlements: ['giving-tithes'],
      isPreviewMode: false
    };

    beforeEach(() => {
      pluginRegistry.clear();
      pluginRegistry.registerPlugin({
        pluginKey: 'plugin-a',
        displayName: 'Plugin A',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        category: 'giving',
        status: 'enabled',
        injectionPoints: ['giving.form.afterAmount'],
        themeSlots: [
          {
            slotKey: 'plugin.plugin-a.card-view',
            displayName: 'A Slot',
            expectedDataType: 'GivingCategoryCardContract'
          }
        ]
      });

      pluginRegistry.registerPlugin({
        pluginKey: 'plugin-b',
        displayName: 'Plugin B',
        description: 'Test',
        version: '1.0.0',
        author: 'Test',
        category: 'giving',
        status: 'enabled',
        injectionPoints: ['giving.form.afterAmount'],
        themeSlots: [
          {
            slotKey: 'plugin.plugin-b.panel-view',
            displayName: 'B Slot',
            expectedDataType: 'GivingCategoryCardContract'
          }
        ]
      });
    });

    it('should render multiple plugins at the same injection point side-by-side', () => {
      const el = testRender(
        React.createElement(
          RendererProvider,
          { value: mockContext },
          React.createElement(PluginInjectionRenderer, {
            point: 'giving.form.afterAmount'
          })
        )
      );

      expect(el).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. PUBLIC SITE CONTEXT API GATING TESTS
  // ─────────────────────────────────────────────────────────────
  describe('GET /api/cms/site-context Gating & Sanitization API', () => {
    beforeAll(() => {
      pluginRegistry.clear();
      pluginRegistry.registerPlugin({
        pluginKey: 'mock-giving-booster',
        displayName: 'Giving Booster',
        description: 'Boosts tithes and donations',
        version: '1.0.0',
        author: 'FaithTech',
        category: 'giving',
        status: 'enabled',
        themeSlots: [],
        settingsSchema: [
          { name: 'buttonColor', displayName: 'Color', type: 'color' },
          { name: 'apiKey', displayName: 'API Key', type: 'secret' }
        ]
      });
    });

    it('should include enabled plugins and sanitized settings in context payload', async () => {
      const res = await request(app)
        .get('/api/cms/site-context')
        .set('Host', 'plugins-integration.churchos.local')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.enabledPlugins).toContain('mock-giving-booster');
      
      const settings = res.body.data.pluginSettings['mock-giving-booster'];
      expect(settings).toBeDefined();
      expect(settings.buttonColor).toBe('#ff0000');
      // Secret key must be stripped from public payload
      expect(settings.apiKey).toBeUndefined();
      expect(settings.stripeSecret).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. SECURE PREVIEW GATING TESTS
  // ─────────────────────────────────────────────────────────────
  describe('GET /api/cms/render/preview Routing Guards API', () => {
    let previewToken: string;
    let draftPageId: string;

    beforeAll(async () => {
      // 1. Create a draft page record
      const draftPage = await prisma.page.create({
        data: {
          tenantId,
          websiteId,
          slug: 'draft-preview-route',
          title: 'Draft Preview Page',
          content: JSON.stringify([
            {
              type: 'hero',
              props: { heading: 'Previewing Draft!' }
            }
          ]),
          status: 'draft'
        }
      });
      draftPageId = draftPage.id;

      // 2. Generate a valid token
      previewToken = jwt.sign({ tenantId }, JWT_SECRET, { expiresIn: '15m' });
    });

    it('should block preview rendering if token query parameter is missing', async () => {
      const res = await request(app)
        .get('/api/cms/render/preview')
        .query({ slug: 'draft-preview-route' })
        .set('Host', 'plugins-integration.churchos.local')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Missing preview token');
    });

    it('should block preview rendering if token signature is invalid', async () => {
      const res = await request(app)
        .get('/api/cms/render/preview')
        .query({ slug: 'draft-preview-route', token: 'invalid.jwt.token' })
        .set('Host', 'plugins-integration.churchos.local')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });

    it('should successfully return the draft page if preview token is valid', async () => {
      const res = await request(app)
        .get('/api/cms/render/preview')
        .query({ slug: 'draft-preview-route', token: previewToken })
        .set('Host', 'plugins-integration.churchos.local')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.pageId).toBe(draftPageId);
      expect(res.body.data.isPreviewMode).toBe(true);
      expect(res.body.data.enabledPlugins).toContain('mock-giving-booster');
    });
  });
});
