import { ModuleUIContract } from '../core/base.types';

export const SermonsModuleContract: ModuleUIContract = {
  moduleKey: 'sermons',
  displayName: 'Sermons & Preaching',
  publicRoutes: [
    { path: '/sermons', type: 'listing', displayName: 'Sermons & Preaching Listing' },
    { path: '/sermons/:id', type: 'detail', displayName: 'Sermons & Preaching Detail' }
  ],
  widgets: [
    {
      widgetKey: 'sermons.widget',
      displayName: 'Sermons & Preaching Widget',
      exposedThemeSlots: ["sermon.card","sermon.player"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'sermons.dashboard', displayName: 'Sermons & Preaching Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Sermons & Preaching', action: 'view', url: '/sermons' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'sermon.card',
      displayName: 'Sermon Card',
      expectedDataType: 'SermonCardContract'
    },
    {
      slotKey: 'sermon.player',
      displayName: 'Sermon Player',
      expectedDataType: 'SermonPlayerContract'
    }],
  entitlementRules: [
    { moduleKey: 'sermons', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Sermons & Preaching',
    description: 'Explore the Sermons & Preaching module interface.'
  },
  localizationKeys: ['sermons.title', 'sermons.empty'],
  analyticsEvents: [
    { eventName: 'sermons_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
