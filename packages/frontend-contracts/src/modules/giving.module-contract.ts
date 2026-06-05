import { ModuleUIContract } from '../core/base.types';

export const GivingModuleContract: ModuleUIContract = {
  moduleKey: 'giving',
  displayName: 'Giving & Tithing',
  publicRoutes: [
    { path: '/giving', type: 'listing', displayName: 'Giving & Tithing Listing' },
    { path: '/giving/:id', type: 'detail', displayName: 'Giving & Tithing Detail' }
  ],
  widgets: [
    {
      widgetKey: 'giving.widget',
      displayName: 'Giving & Tithing Widget',
      exposedThemeSlots: ["giving.form","giving.categoryCard"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'giving.dashboard', displayName: 'Giving & Tithing Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Giving & Tithing', action: 'view', url: '/giving' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'giving.form',
      displayName: 'Giving Form',
      expectedDataType: 'GivingFormContract'
    },
    {
      slotKey: 'giving.categoryCard',
      displayName: 'Giving CategoryCard',
      expectedDataType: 'GivingCategoryCardContract'
    }],
  entitlementRules: [
    { moduleKey: 'giving', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Giving & Tithing',
    description: 'Explore the Giving & Tithing module interface.'
  },
  localizationKeys: ['giving.title', 'giving.empty'],
  analyticsEvents: [
    { eventName: 'giving_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
