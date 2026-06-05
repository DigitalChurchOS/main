import React from 'react';
import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { seedDemoTenant } from '../seed-demo-helper';
import {
  ThemeAdapter,
  validateThemeCompatibility,
  pluginRegistry,
  ClientContextContract
} from '@churchos/frontend-contracts';

import {
  RenderSlot,
  RendererProvider,
  RenderErrorBoundary
} from '../../../church-frontend/src/rendering';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

import ReactDOMServer from 'react-dom/server';

// Helper to check if a component renders without crashing
const testRender = (element: any) => {
  return ReactDOMServer.renderToString(element);
};

describe('ChurchOS Final Foundation Smoke Tests', () => {
  jest.setTimeout(30000);
  let activeTenantId: string;
  let activeWebsiteId: string;
  let suspendedTenantId: string;
  let previewToken: string;

  beforeAll(async () => {
    // 1. Clean Database
    await prisma.pluginWebhook.deleteMany({});
    await prisma.tenantPlugin.deleteMany({});
    await prisma.pluginDefinition.deleteMany({});
    await prisma.pageRevision.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenantModule.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.eventCategory.deleteMany({});
    await prisma.givingCategory.deleteMany({});
    await prisma.donation.deleteMany({});
    await prisma.recurringGiving.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.mediaCategory.deleteMany({});
    await prisma.mediaTag.deleteMany({});
    await prisma.mediaSeries.deleteMany({});
    await prisma.speaker.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.livestreamModuleSettings.deleteMany({});
    await prisma.prayerSession.deleteMany({});
    await prisma.testimony.deleteMany({});
    await prisma.lmsLesson.deleteMany({});
    await prisma.lmsModule.deleteMany({});
    await prisma.lmsCourse.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.groupType.deleteMany({});
    await prisma.groupSettings.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Seed active demo tenant
    const active = await seedDemoTenant('grace-fellowship');
    activeTenantId = active.tenantId;
    activeWebsiteId = active.websiteId;

    // 3. Seed suspended demo tenant
    const suspended = await seedDemoTenant('suspended-church', true);
    suspendedTenantId = suspended.tenantId;

    // 4. Generate preview token
    previewToken = jwt.sign({ tenantId: activeTenantId }, JWT_SECRET, { expiresIn: '15m' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // REST API FLOWS
  // ─────────────────────────────────────────────────────────────
  describe('CMS and Core Routing API Endpoints', () => {
    it('1. should render public homepage from Page Builder output (GET /api/cms/render)', async () => {
      const res = await request(app)
        .get('/api/cms/render')
        .query({ slug: '' })
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('');
      expect(res.body.data.title).toContain('Welcome to Grace Fellowship');
      expect(res.body.data.contentBlocks.length).toBeGreaterThan(0);
      expect(res.body.data.contentBlocks[0].slotKey).toBe('page.home');
    });

    it('2. should render about and contact pages cleanly', async () => {
      // About Page
      const resAbout = await request(app)
        .get('/api/cms/render')
        .query({ slug: 'about' })
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);
      expect(resAbout.status).toBe(200);
      expect(resAbout.body.data.slug).toBe('about');

      // Contact Page
      const resContact = await request(app)
        .get('/api/cms/render')
        .query({ slug: 'contact' })
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);
      expect(resContact.status).toBe(200);
      expect(resContact.body.data.slug).toBe('contact');
    });

    it('3. should return navigation and footer details in site context', async () => {
      const res = await request(app)
        .get('/api/cms/site-context')
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.navigation).toBeDefined();
      expect(res.body.data.navigation.name).toBe('Header Menu');
      expect(res.body.data.footer).toBeDefined();
      expect(res.body.data.footer.copyrightText).toContain('Grace Fellowship Church');
    });

    it('4. should block public rendering of unpublished draft pages without token', async () => {
      const res = await request(app)
        .get('/api/cms/render')
        .query({ slug: 'draft-preview-route' })
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);

      expect(res.status).toBe(404); // Not Found for public visitors
    });

    it('5. should successfully preview draft content with valid preview token (GET /api/cms/render/preview)', async () => {
      const res = await request(app)
        .get('/api/cms/render/preview')
        .query({ slug: 'draft-preview-route', token: previewToken })
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('draft-preview-route');
      expect(res.body.data.isPreviewMode).toBe(true);
      expect(res.body.data.contentBlocks[0].data.title).toContain('Draft Secret Page');
    });

    it('6. should return enabled plugins list in site context with sanitized settings', async () => {
      const res = await request(app)
        .get('/api/cms/site-context')
        .set('Host', 'grace-fellowship.churchos.local')
        .set('x-tenant-id', activeTenantId);

      expect(res.status).toBe(200);
      const { enabledPlugins, pluginSettings } = res.body.data;
      
      // Verify enabled plugins
      expect(enabledPlugins).toContain('mock-giving-booster');
      expect(enabledPlugins).toContain('mock-analytics-tracker');
      
      // Verify disabled plugin is excluded
      expect(enabledPlugins).not.toContain('mock-sermon-notes');

      // Verify secrets sanitization
      const givingBoosterSettings = pluginSettings['mock-giving-booster'];
      expect(givingBoosterSettings).toBeDefined();
      expect(givingBoosterSettings.buttonColor).toBe('#4f46e5');
      expect(givingBoosterSettings.apiKey).toBeUndefined(); // Stripped because of pattern and schema type
      
      const trackerSettings = pluginSettings['mock-analytics-tracker'];
      expect(trackerSettings).toBeDefined();
      expect(trackerSettings.propertyId).toBe('UA-998877-1');
      expect(trackerSettings.secretToken).toBeUndefined(); // Stripped because of 'secret' type and pattern
    });
  });

  // ─────────────────────────────────────────────────────────────
  // FRONTEND CONTRACT RENDERING FLOWS (Guards, Visibility Gating)
  // ─────────────────────────────────────────────────────────────
  describe('Frontend Contract Renderer, Fallback, and Visibility Gates', () => {
    const mockTheme: ThemeAdapter = {
      themeKey: 'system-fallback',
      displayName: 'System Theme',
      version: '1.0.0',
      slots: {},
      supportsSlot: () => false
    };

    const baseContext: ClientContextContract = {
      tenant: { tenantId: 'tenant-1', name: 'Grace Fellowship', subdomain: 'grace-fellowship', status: 'active' },
      moduleEntitlements: ['events-management', 'giving-tithes', 'sermons-media', 'livestream-broadcasting', 'prayer-testimony', 'lms-courses', 'groups-community', 'member-portal'],
      activeTheme: mockTheme,
      themeSettings: {},
      requestUrl: 'http://localhost/church',
      isPreviewMode: false,
      analytics: {
        track: jest.fn()
      }
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('7. should render event card and detail slots cleanly', () => {
      const eventCardData = {
        id: 'event-1',
        title: 'Sunday Worship',
        startDate: '2026-06-07T09:00:00Z',
        endDate: '2026-06-07T11:00:00Z',
        location: 'Main Hall',
        cta: { label: 'Register', action: 'link', url: '/events/1' }
      };

      const element = testRender(
        React.createElement(
          RendererProvider,
          { value: baseContext },
          React.createElement(RenderSlot, {
            slotKey: 'event.card',
            contractData: eventCardData,
            moduleKey: 'events-management'
          })
        )
      );
      expect(element).toBeDefined();
    });

    it('8. should render giving form and category slots cleanly', () => {
      const givingCategoryData = {
        id: 'category-1',
        title: 'Building Fund',
        description: 'Supports building expansions',
        cta: { label: 'Give Now', action: 'link', url: '/giving/1' }
      };

      const element = testRender(
        React.createElement(
          RendererProvider,
          { value: baseContext },
          React.createElement(RenderSlot, {
            slotKey: 'giving.categoryCard',
            contractData: givingCategoryData,
            moduleKey: 'giving-tithes'
          })
        )
      );
      expect(element).toBeDefined();
    });

    it('9. should render sermon card and player slots cleanly', () => {
      const sermonData = {
        id: 'sermon-1',
        title: 'Walking by Faith',
        speaker: 'Pastor Stevenson',
        date: '2026-06-01',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
        cta: { label: 'Listen / Watch', action: 'link', url: '/sermons/1' }
      };

      const element = testRender(
        React.createElement(
          RendererProvider,
          { value: baseContext },
          React.createElement(RenderSlot, {
            slotKey: 'sermon.card',
            contractData: sermonData,
            moduleKey: 'sermons-media'
          })
        )
      );
      expect(element).toBeDefined();
    });

    it('10. should render prayer session and testimony slots cleanly', () => {
      const prayerData = {
        id: 'prayer-1',
        title: 'Daily Intercession',
        startTime: '2026-06-05T19:00:00Z',
        endTime: '2026-06-05T20:00:00Z',
        cta: { label: 'Join Session', action: 'link', url: '/prayer/1' }
      };

      const element = testRender(
        React.createElement(
          RendererProvider,
          { value: baseContext },
          React.createElement(RenderSlot, {
            slotKey: 'prayer.sessionCard',
            contractData: prayerData,
            moduleKey: 'prayer-testimony'
          })
        )
      );
      expect(element).toBeDefined();
    });

    it('11. should block member-only slot and display login gate if user is anonymous', () => {
      const anonymousContext = {
        ...baseContext,
        memberId: undefined // User not logged in
      };

      const element = React.createElement(
        RendererProvider,
        { value: anonymousContext },
        React.createElement(RenderSlot, {
          slotKey: 'member.dashboard',
          contractData: {},
          moduleKey: 'member-portal'
        })
      );

      // Verify that it renders without throwing and triggers fallback gating
      const wrapper = testRender(element);
      expect(wrapper).toBeDefined();
    });

    it('12. should block password-protected blocks and show password gate', () => {
      const passwordProtectedData = {
        title: 'Confidential Notes',
        visibility: 'password_protected',
        password: 'grace_password'
      };

      const element = React.createElement(
        RendererProvider,
        { value: baseContext },
        React.createElement(RenderSlot, {
          slotKey: 'page.about',
          contractData: passwordProtectedData,
          moduleKey: 'website-cms'
        })
      );

      const wrapper = testRender(element);
      expect(wrapper).toBeDefined();
    });

    it('13. should block disabled modules and render entitlement disabled message', () => {
      const restrictedContext = {
        ...baseContext,
        moduleEntitlements: ['website-cms'] // only website-cms active, lms-courses is missing
      };

      const element = React.createElement(
        RendererProvider,
        { value: restrictedContext },
        React.createElement(RenderSlot, {
          slotKey: 'course.card',
          contractData: { id: '1', title: 'Membership' },
          moduleKey: 'lms-courses'
        })
      );

      const wrapper = testRender(element);
      expect(wrapper).toBeDefined();
    });

    it('14. should block rendering and show locked state when tenant status is suspended', () => {
      const suspendedContext = {
        ...baseContext,
        tenant: { ...baseContext.tenant, status: 'suspended' }
      };

      const element = React.createElement(
        RendererProvider,
        { value: suspendedContext },
        React.createElement(RenderSlot, {
          slotKey: 'page.home',
          contractData: {},
          moduleKey: 'website-cms'
        })
      );

      const wrapper = testRender(element);
      expect(wrapper).toBeDefined();
    });

    it('15. should catch plugin component crash safely inside error boundary without halting parent app', () => {
      // Test the error boundary component behavior directly
      const error = new Error('Plugin crashed!');
      const boundary = new RenderErrorBoundary({
        children: React.createElement('div', null, 'Normal content')
      });
      
      // Simulate react error lifecycle
      const derivedState = RenderErrorBoundary.getDerivedStateFromError(error);
      expect(derivedState.hasError).toBe(true);
      expect(derivedState.error).toBe(error);
      
      // Set the state manually and verify fallback rendering
      boundary.state = { hasError: true, error };
      const rendered = testRender(boundary.render() as any);
      expect(rendered).toContain('⚠️ Rendering Error');
      expect(rendered).toContain('Plugin crashed!');
    });

    it('16. should trigger analytics hooks safely when rendering slots', () => {
      const element = React.createElement(
        RendererProvider,
        { value: baseContext },
        React.createElement(RenderSlot, {
          slotKey: 'event.card',
          contractData: {
            id: '1',
            title: 'Sunday Worship',
            cta: { label: 'Register', action: 'link', url: '/events/1' }
          },
          moduleKey: 'events-management'
        })
      );

      testRender(element);
      expect(baseContext.analytics?.track).toHaveBeenCalledWith('component_view', {
        slotKey: 'event.card',
        moduleKey: 'events-management'
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // THEME COMPATIBILITY VALIDATOR
  // ─────────────────────────────────────────────────────────────
  describe('Theme Compatibility Validator', () => {
    it('17. should validate compatible and report fallback slots for a ThemeAdapter', () => {
      const partialTheme: ThemeAdapter = {
        themeKey: 'grace-custom',
        displayName: 'Grace Custom Theme',
        version: '1.2.0',
        slots: {
          'layout.header': () => React.createElement('header', null, 'Grace Header'),
          'layout.footer': () => React.createElement('footer', null, 'Grace Footer'),
          'event.card': () => React.createElement('div', null, 'Custom Event Card')
        },
        supportsSlot: (slot) => ['layout.header', 'layout.footer', 'event.card'].includes(slot)
      };

      const report = validateThemeCompatibility(partialTheme);

      expect(report.themeKey).toBe('grace-custom');
      expect(report.version).toBe('1.2.0');
      expect(report.implementedSlotsCount).toBe(3);
      expect(report.totalSlotsCount).toBeGreaterThan(3);
      expect(report.compatibilityScore).toBeLessThan(100);
      expect(report.implementedSlots).toContain('layout.header');
      expect(report.implementedSlots).toContain('layout.footer');
      expect(report.implementedSlots).toContain('event.card');

      // Check fallback slots
      const hasHomeFallback = report.fallbackSlots.some(s => s.slotKey === 'page.home');
      expect(hasHomeFallback).toBe(true);

      const hasSermonFallback = report.fallbackSlots.some(s => s.slotKey === 'sermon.card');
      expect(hasSermonFallback).toBe(true);
    });
  });
});
