import { ModuleUIContract } from '../core/base.types';

export const MediaModuleContract: ModuleUIContract = {
  moduleKey: 'media',
  displayName: 'Media Library',
  publicRoutes: [
    { path: '/media', type: 'listing', displayName: 'Media Library Listing' },
    { path: '/media/:id', type: 'detail', displayName: 'Media Library Detail' }
  ],
  widgets: [
    {
      widgetKey: 'media.widget',
      displayName: 'Media Library Widget',
      exposedThemeSlots: ["media.card","media.player"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'media.dashboard', displayName: 'Media Library Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Media Library', action: 'view', url: '/media' }
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
    { moduleKey: 'media', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Media Library',
    description: 'Explore the Media Library module interface.'
  },
  localizationKeys: ['media.title', 'media.empty'],
  analyticsEvents: [
    { eventName: 'media_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
