import { ModuleUIContract } from '../core/base.types';

export const DigitalLibraryModuleContract: ModuleUIContract = {
  moduleKey: 'digital-library',
  displayName: 'Digital Library',
  publicRoutes: [
    { path: '/digital-library', type: 'listing', displayName: 'Digital Library Listing' },
    { path: '/digital-library/:id', type: 'detail', displayName: 'Digital Library Detail' }
  ],
  widgets: [
    {
      widgetKey: 'digital-library.widget',
      displayName: 'Digital Library Widget',
      exposedThemeSlots: ["media.card","media.player"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'digital-library.dashboard', displayName: 'Digital Library Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Digital Library', action: 'view', url: '/digital-library' }
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
    { moduleKey: 'digital-library', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Digital Library',
    description: 'Explore the Digital Library module interface.'
  },
  localizationKeys: ['digital-library.title', 'digital-library.empty'],
  analyticsEvents: [
    { eventName: 'digital-library_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
