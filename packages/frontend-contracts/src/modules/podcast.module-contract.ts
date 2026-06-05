import { ModuleUIContract } from '../core/base.types';

export const PodcastModuleContract: ModuleUIContract = {
  moduleKey: 'podcast',
  displayName: 'Audio Podcasts',
  publicRoutes: [
    { path: '/podcast', type: 'listing', displayName: 'Audio Podcasts Listing' },
    { path: '/podcast/:id', type: 'detail', displayName: 'Audio Podcasts Detail' }
  ],
  widgets: [
    {
      widgetKey: 'podcast.widget',
      displayName: 'Audio Podcasts Widget',
      exposedThemeSlots: ["media.card","media.player"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'podcast.dashboard', displayName: 'Audio Podcasts Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Audio Podcasts', action: 'view', url: '/podcast' }
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
    { moduleKey: 'podcast', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Audio Podcasts',
    description: 'Explore the Audio Podcasts module interface.'
  },
  localizationKeys: ['podcast.title', 'podcast.empty'],
  analyticsEvents: [
    { eventName: 'podcast_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
