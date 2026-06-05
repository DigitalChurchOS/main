import { ModuleUIContract } from '../core/base.types';

export const LiveMeetingsModuleContract: ModuleUIContract = {
  moduleKey: 'live-meetings',
  displayName: 'Live Meetings',
  publicRoutes: [
    { path: '/live-meetings', type: 'listing', displayName: 'Live Meetings Listing' },
    { path: '/live-meetings/:id', type: 'detail', displayName: 'Live Meetings Detail' }
  ],
  widgets: [
    {
      widgetKey: 'live-meetings.widget',
      displayName: 'Live Meetings Widget',
      exposedThemeSlots: ["prayer.room"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'live-meetings.dashboard', displayName: 'Live Meetings Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Live Meetings', action: 'view', url: '/live-meetings' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'prayer.room',
      displayName: 'Prayer Room',
      expectedDataType: 'PrayerRoomContract'
    }],
  entitlementRules: [
    { moduleKey: 'live-meetings', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Live Meetings',
    description: 'Explore the Live Meetings module interface.'
  },
  localizationKeys: ['live-meetings.title', 'live-meetings.empty'],
  analyticsEvents: [
    { eventName: 'live-meetings_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
