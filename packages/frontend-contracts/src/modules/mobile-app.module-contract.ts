import { ModuleUIContract } from '../core/base.types';

export const MobileAppModuleContract: ModuleUIContract = {
  moduleKey: 'mobile-app',
  displayName: 'Mobile App Management',
  publicRoutes: [
    { path: '/mobile-app', type: 'listing', displayName: 'Mobile App Management Listing' },
    { path: '/mobile-app/:id', type: 'detail', displayName: 'Mobile App Management Detail' }
  ],
  widgets: [
    {
      widgetKey: 'mobile-app.widget',
      displayName: 'Mobile App Management Widget',
      exposedThemeSlots: ["layout.mobileNav"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'mobile-app.dashboard', displayName: 'Mobile App Management Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Mobile App Management', action: 'view', url: '/mobile-app' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'layout.mobileNav',
      displayName: 'Layout MobileNav',
      expectedDataType: 'LayoutMobileNavContract'
    }],
  entitlementRules: [
    { moduleKey: 'mobile-app', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Mobile App Management',
    description: 'Explore the Mobile App Management module interface.'
  },
  localizationKeys: ['mobile-app.title', 'mobile-app.empty'],
  analyticsEvents: [
    { eventName: 'mobile-app_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
