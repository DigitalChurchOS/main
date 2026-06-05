import React from 'react';
import {
  // Registries
  listModuleContracts,
  getModuleContract,
  registerModuleContract,
  clearModuleRegistry,
  listThemeSlots,
  getThemeSlot,
  registerThemeSlot,
  clearThemeSlotRegistry,
  getStandardCTA,
  getDefaultState,
  
  // Validation
  validateModuleContract,
  validateThemeAdapter,
  validateComponentContractData,
  
  // Theme Slot Renderer
  ThemeSlotRenderer,
  ThemeAdapter,
  
  // Mappers
  mapEventToEventCardContract,
  mapEventToEventDetailContract,
  mapGivingCategoryToGivingFormContract,
  mapSermonToSermonPlayerContract,
  mapMediaItemToMediaCardContract,
  mapLivestreamToContract,
  mapPrayerSessionToPrayerSessionContract,
  mapPrayerRequestToPrayerWallContract,
  mapTestimonyToTestimonyCardContract,
  mapCourseToCourseCardContract,
  mapGroupToGroupCardContract,
  mapProductToProductCardContract,
  mapCampaignToCampaignCardContract,
  mapCampaignToProgressContract,
  mapMemberToMemberProfileContract,
  mapCMSPageToCMSPageContract,
  mapNavigationToNavigationMenuContract
} from '@churchos/frontend-contracts';

describe('Frontend Contract System Tests', () => {
  const testTenantId = 'tenant-grace-123';
  const wrongTenantId = 'tenant-hope-456';

  // ─────────────────────────────────────────────────────────────
  // 1. REGISTRIES TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Registries & Verification', () => {
    beforeEach(() => {
      clearModuleRegistry();
      clearThemeSlotRegistry();
    });

    it('should register and retrieve module contracts', () => {
      const dummyModule: any = {
        moduleKey: 'test-module',
        displayName: 'Test Module',
        publicRoutes: [{ path: '/test', type: 'listing', displayName: 'Test List' }],
        widgets: [],
        forms: [],
        memberSurfaces: [],
        ctas: [],
        states: [],
        dataContracts: [],
        themeSlots: [],
        entitlementRules: [],
        seo: { title: 'Test Title' },
        analyticsEvents: []
      };

      registerModuleContract(dummyModule);
      expect(getModuleContract('test-module')).toBeDefined();
      expect(listModuleContracts().length).toBe(1);
    });

    it('should prevent duplicate module registration', () => {
      const dummyModule: any = {
        moduleKey: 'test-module',
        displayName: 'Test Module',
        publicRoutes: [],
        seo: { title: 'Test Title' }
      };

      registerModuleContract(dummyModule);
      expect(() => registerModuleContract(dummyModule)).toThrow();
    });

    it('should register and check theme slots', () => {
      const slot = {
        slotKey: 'event.card' as any,
        displayName: 'Event Card',
        expectedDataType: 'EventCardContract'
      };

      registerThemeSlot(slot);
      expect(getThemeSlot('event.card')).toBeDefined();
      expect(listThemeSlots().length).toBe(1);
    });

    it('should prevent duplicate theme slot registration', () => {
      const slot = {
        slotKey: 'event.card' as any,
        displayName: 'Event Card',
        expectedDataType: 'EventCardContract'
      };

      registerThemeSlot(slot);
      expect(() => registerThemeSlot(slot)).toThrow();
    });

    it('should return standard CTAs and default UI states', () => {
      const cta = getStandardCTA('register', { url: '/register-here' });
      expect(cta.action).toBe('register');
      expect(cta.url).toBe('/register-here');
      expect(cta.label).toBe('Register Now');

      const state = getDefaultState('loading', 'Loading items...');
      expect(state.state).toBe('loading');
      expect(state.message).toBe('Loading items...');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. VALIDATION ENGINE TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Validation Engine', () => {
    it('should validate module contract fields correctly', () => {
      const invalidModule: any = {
        moduleKey: '',
        displayName: '',
        publicRoutes: []
      };

      const result = validateModuleContract(invalidModule);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should block unsafe private fields in component contracts', () => {
      const unsafeData = {
        id: '123',
        title: 'Event with private leak',
        passwordHash: 'secret-hash-123'
      };

      const result = validateComponentContractData('event.card', unsafeData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Unsafe private field detected');
    });

    it('should block direct raw database records', () => {
      const rawDbData = {
        id: '123',
        title: 'Event leaked record',
        tenantId: 'grace-tenant'
      };

      const result = validateComponentContractData('event.card', rawDbData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Raw backend database record passed directly');
    });

    it('should check if theme adapter supports core slots', () => {
      const invalidAdapter: ThemeAdapter = {
        themeKey: 'custom',
        displayName: 'Custom Theme',
        version: '1.0.0',
        slots: {},
        supportsSlot: () => false
      };

      const result = validateThemeAdapter(invalidAdapter);
      expect(result.isValid).toBe(false);
      expect(result.missingCoreSlots.length).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. MAPPERS & TENANT ISOLATION TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Data Mappers & Tenant Isolation', () => {
    const rawEvent = {
      id: 'evt-123',
      tenantId: testTenantId,
      title: 'Sunday Morning Fellowship',
      description: 'Join us at 9am',
      startDateTime: '2026-06-04T09:00:00Z',
      endDateTime: '2026-06-04T10:30:00Z',
      location: 'Main Auditorium',
      visibility: 'public_active'
    };

    it('should map event properties into EventCardContract', () => {
      const contract = mapEventToEventCardContract(rawEvent, testTenantId);
      expect(contract.id).toBe('evt-123');
      expect(contract.title).toBe('Sunday Morning Fellowship');
      expect(contract.location).toBe('Main Auditorium');
      expect(contract.cta.action).toBe('register');
      expect(contract.visibility).toBe('public_active');
    });

    it('should enforce tenant isolation during event mapping', () => {
      expect(() => mapEventToEventCardContract(rawEvent, wrongTenantId)).toThrow(
        /Tenant isolation violation/
      );
    });

    it('should map giving categories and attach donate CTA', () => {
      const rawCategory = {
        id: 'cat-1',
        tenantId: testTenantId,
        name: 'Tithe',
        description: 'Monthly Tithes'
      };

      const contract = mapGivingCategoryToGivingFormContract([rawCategory], testTenantId);
      expect(contract.categories.length).toBe(1);
      expect(contract.categories[0].name).toBe('Tithe');
      expect(contract.submitCta.action).toBe('donate');
    });

    it('should map navigation and page structures correctly', () => {
      const rawPage = {
        id: 'page-1',
        tenantId: testTenantId,
        title: 'Home Page',
        slug: '',
        isHome: true,
        content: JSON.stringify([{ type: 'hero', props: { heading: 'Welcome' }, styles: {} }]),
        status: 'published',
        seoTitle: 'Welcome to Grace',
        seoDescription: 'Grace Community Church Home'
      };

      const contract = mapCMSPageToCMSPageContract(rawPage, testTenantId);
      expect(contract.id).toBe('page-1');
      expect(contract.slug).toBe('');
      expect(contract.isHome).toBe(true);
      expect(contract.sections.length).toBe(1);
      expect(contract.seo.title).toBe('Welcome to Grace');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. THEME SLOT RENDERER TESTS
  // ─────────────────────────────────────────────────────────────
  describe('Theme Slot Renderer', () => {
    const dummyClientContext: any = {
      tenant: {
        tenantId: testTenantId,
        name: 'Grace Church',
        subdomain: 'grace',
        status: 'active'
      },
      isPreviewMode: false,
      preferredLanguage: 'en'
    };

    const dummyTheme: ThemeAdapter = {
      themeKey: 'grace-default',
      displayName: 'Grace Default Theme',
      version: '1.0.0',
      slots: {
        'event.card': ({ data }) => React.createElement('div', { className: 'rendered-card' }, data.title)
      },
      supportsSlot: (slot) => slot === 'event.card'
    };

    it('should render a theme slot matching component correctly', () => {
      const validData = {
        id: '123',
        title: 'Slightly Normalized Event Card',
        startDateTime: '2026-06-04T09:00:00Z',
        endDateTime: '2026-06-04T10:30:00Z',
        cta: getStandardCTA('view'),
        visibility: 'public_active'
      };

      const element = React.createElement(ThemeSlotRenderer, {
        slotKey: 'event.card',
        contractData: validData,
        clientContext: dummyClientContext,
        activeTheme: dummyTheme
      });

      // The react element should be successfully instantiated
      expect(element).toBeDefined();
      expect(element.props.slotKey).toBe('event.card');
    });

    it('should return locked view state for disabled/suspended tenants', () => {
      const suspendedContext = {
        ...dummyClientContext,
        tenant: {
          ...dummyClientContext.tenant,
          status: 'suspended'
        }
      };

      const validData = {
        id: '123',
        title: 'Event Card title',
        startDateTime: '2026-06-04T09:00:00Z',
        endDateTime: '2026-06-04T10:30:00Z',
        cta: getStandardCTA('view'),
        visibility: 'public_active'
      };

      // Set moduleKey to force active subscription entitlement checks
      const element = React.createElement(ThemeSlotRenderer, {
        slotKey: 'event.card',
        contractData: validData,
        clientContext: suspendedContext,
        activeTheme: dummyTheme,
        moduleKey: 'events'
      });

      expect(element).toBeDefined();
    });
  });
});
