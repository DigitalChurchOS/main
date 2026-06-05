import { ModuleUIContract } from '../core/base.types';

export const BibleEngagementModuleContract: ModuleUIContract = {
  moduleKey: 'bible-engagement',
  displayName: 'Bible Engagement',
  publicRoutes: [
    { path: '/bible-engagement', type: 'listing', displayName: 'Bible Engagement Listing' },
    { path: '/bible-engagement/:id', type: 'detail', displayName: 'Bible Engagement Detail' }
  ],
  widgets: [
    {
      widgetKey: 'bible-engagement.widget',
      displayName: 'Bible Engagement Widget',
      exposedThemeSlots: ["media.player"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'bible-engagement.dashboard', displayName: 'Bible Engagement Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Bible Engagement', action: 'view', url: '/bible-engagement' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'media.player',
      displayName: 'Media Player',
      expectedDataType: 'MediaPlayerContract'
    }],
  entitlementRules: [
    { moduleKey: 'bible-engagement', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Bible Engagement',
    description: 'Explore the Bible Engagement module interface.'
  },
  localizationKeys: ['bible-engagement.title', 'bible-engagement.empty'],
  analyticsEvents: [
    { eventName: 'bible-engagement_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
