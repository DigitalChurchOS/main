import { ModuleUIContract } from '../core/base.types';

export const ResourcesModuleContract: ModuleUIContract = {
  moduleKey: 'resources',
  displayName: 'Digital Resources',
  publicRoutes: [
    { path: '/resources', type: 'listing', displayName: 'Digital Resources Listing' },
    { path: '/resources/:id', type: 'detail', displayName: 'Digital Resources Detail' }
  ],
  widgets: [
    {
      widgetKey: 'resources.widget',
      displayName: 'Digital Resources Widget',
      exposedThemeSlots: ["resource.card"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'resources.dashboard', displayName: 'Digital Resources Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Digital Resources', action: 'view', url: '/resources' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'resource.card',
      displayName: 'Resource Card',
      expectedDataType: 'ResourceCardContract'
    }],
  entitlementRules: [
    { moduleKey: 'resources', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Digital Resources',
    description: 'Explore the Digital Resources module interface.'
  },
  localizationKeys: ['resources.title', 'resources.empty'],
  analyticsEvents: [
    { eventName: 'resources_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
