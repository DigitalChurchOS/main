import { ModuleUIContract } from '../core/base.types';

export const PartnershipsModuleContract: ModuleUIContract = {
  moduleKey: 'partnerships',
  displayName: 'Kingdom Partnerships',
  publicRoutes: [
    { path: '/partnerships', type: 'listing', displayName: 'Kingdom Partnerships Listing' },
    { path: '/partnerships/:id', type: 'detail', displayName: 'Kingdom Partnerships Detail' }
  ],
  widgets: [
    {
      widgetKey: 'partnerships.widget',
      displayName: 'Kingdom Partnerships Widget',
      exposedThemeSlots: ["campaign.card","campaign.progress"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'partnerships.dashboard', displayName: 'Kingdom Partnerships Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Kingdom Partnerships', action: 'view', url: '/partnerships' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'campaign.card',
      displayName: 'Campaign Card',
      expectedDataType: 'CampaignCardContract'
    },
    {
      slotKey: 'campaign.progress',
      displayName: 'Campaign Progress',
      expectedDataType: 'CampaignProgressContract'
    }],
  entitlementRules: [
    { moduleKey: 'partnerships', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Kingdom Partnerships',
    description: 'Explore the Kingdom Partnerships module interface.'
  },
  localizationKeys: ['partnerships.title', 'partnerships.empty'],
  analyticsEvents: [
    { eventName: 'partnerships_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
