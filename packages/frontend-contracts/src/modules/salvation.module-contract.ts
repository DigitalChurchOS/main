import { ModuleUIContract } from '../core/base.types';

export const SalvationModuleContract: ModuleUIContract = {
  moduleKey: 'salvation',
  displayName: 'Salvation Journey',
  publicRoutes: [
    { path: '/salvation', type: 'listing', displayName: 'Salvation Journey Listing' },
    { path: '/salvation/:id', type: 'detail', displayName: 'Salvation Journey Detail' }
  ],
  widgets: [
    {
      widgetKey: 'salvation.widget',
      displayName: 'Salvation Journey Widget',
      exposedThemeSlots: ["salvation.responseForm"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'salvation.dashboard', displayName: 'Salvation Journey Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Salvation Journey', action: 'view', url: '/salvation' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'salvation.responseForm',
      displayName: 'Salvation ResponseForm',
      expectedDataType: 'SalvationResponseFormContract'
    }],
  entitlementRules: [
    { moduleKey: 'salvation', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Salvation Journey',
    description: 'Explore the Salvation Journey module interface.'
  },
  localizationKeys: ['salvation.title', 'salvation.empty'],
  analyticsEvents: [
    { eventName: 'salvation_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
