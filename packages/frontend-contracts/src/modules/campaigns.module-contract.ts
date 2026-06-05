import { ModuleUIContract } from '../core/base.types';

export const CampaignsModuleContract: ModuleUIContract = {
  moduleKey: 'campaigns',
  displayName: 'Capital Campaigns',
  publicRoutes: [
    { path: '/campaigns', type: 'listing', displayName: 'Capital Campaigns Listing' },
    { path: '/campaigns/:id', type: 'detail', displayName: 'Capital Campaigns Detail' }
  ],
  widgets: [
    {
      widgetKey: 'campaigns.widget',
      displayName: 'Capital Campaigns Widget',
      exposedThemeSlots: ["campaign.card","campaign.progress"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'campaigns.dashboard', displayName: 'Capital Campaigns Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Capital Campaigns', action: 'view', url: '/campaigns' }
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
    { moduleKey: 'campaigns', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Capital Campaigns',
    description: 'Explore the Capital Campaigns module interface.'
  },
  localizationKeys: ['campaigns.title', 'campaigns.empty'],
  analyticsEvents: [
    { eventName: 'campaigns_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
