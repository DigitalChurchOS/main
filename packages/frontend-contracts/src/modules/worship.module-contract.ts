import { ModuleUIContract } from '../core/base.types';

export const WorshipModuleContract: ModuleUIContract = {
  moduleKey: 'worship',
  displayName: 'Worship Media',
  publicRoutes: [
    { path: '/worship', type: 'listing', displayName: 'Worship Media Listing' },
    { path: '/worship/:id', type: 'detail', displayName: 'Worship Media Detail' }
  ],
  widgets: [
    {
      widgetKey: 'worship.widget',
      displayName: 'Worship Media Widget',
      exposedThemeSlots: ["media.card","media.player"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'worship.dashboard', displayName: 'Worship Media Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Worship Media', action: 'view', url: '/worship' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'media.card',
      displayName: 'Media Card',
      expectedDataType: 'MediaCardContract'
    },
    {
      slotKey: 'media.player',
      displayName: 'Media Player',
      expectedDataType: 'MediaPlayerContract'
    }],
  entitlementRules: [
    { moduleKey: 'worship', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Worship Media',
    description: 'Explore the Worship Media module interface.'
  },
  localizationKeys: ['worship.title', 'worship.empty'],
  analyticsEvents: [
    { eventName: 'worship_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
