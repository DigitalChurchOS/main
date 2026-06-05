import { ModuleUIContract } from '../core/base.types';

export const ServicesModuleContract: ModuleUIContract = {
  moduleKey: 'services',
  displayName: 'Church Services',
  publicRoutes: [
    { path: '/services', type: 'listing', displayName: 'Church Services Listing' },
    { path: '/services/:id', type: 'detail', displayName: 'Church Services Detail' }
  ],
  widgets: [
    {
      widgetKey: 'services.widget',
      displayName: 'Church Services Widget',
      exposedThemeSlots: ["service.card"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'services.dashboard', displayName: 'Church Services Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Church Services', action: 'view', url: '/services' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'service.card',
      displayName: 'Service Card',
      expectedDataType: 'ServiceCardContract'
    }],
  entitlementRules: [
    { moduleKey: 'services', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Church Services',
    description: 'Explore the Church Services module interface.'
  },
  localizationKeys: ['services.title', 'services.empty'],
  analyticsEvents: [
    { eventName: 'services_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
