import { ModuleUIContract } from '../core/base.types';

export const LivestreamModuleContract: ModuleUIContract = {
  moduleKey: 'livestream',
  displayName: 'Live Broadcasting',
  publicRoutes: [
    { path: '/livestream', type: 'listing', displayName: 'Live Broadcasting Listing' },
    { path: '/livestream/:id', type: 'detail', displayName: 'Live Broadcasting Detail' }
  ],
  widgets: [
    {
      widgetKey: 'livestream.widget',
      displayName: 'Live Broadcasting Widget',
      exposedThemeSlots: ["livestream.player","livestream.countdown","livestream.chatSlot"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'livestream.dashboard', displayName: 'Live Broadcasting Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Live Broadcasting', action: 'view', url: '/livestream' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'livestream.player',
      displayName: 'Livestream Player',
      expectedDataType: 'LivestreamPlayerContract'
    },
    {
      slotKey: 'livestream.countdown',
      displayName: 'Livestream Countdown',
      expectedDataType: 'LivestreamCountdownContract'
    },
    {
      slotKey: 'livestream.chatSlot',
      displayName: 'Livestream ChatSlot',
      expectedDataType: 'LivestreamChatSlotContract'
    }],
  entitlementRules: [
    { moduleKey: 'livestream', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Live Broadcasting',
    description: 'Explore the Live Broadcasting module interface.'
  },
  localizationKeys: ['livestream.title', 'livestream.empty'],
  analyticsEvents: [
    { eventName: 'livestream_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
