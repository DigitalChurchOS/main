import { ModuleUIContract } from '../core/base.types';

export const PrayerTestimonyModuleContract: ModuleUIContract = {
  moduleKey: 'prayer-testimony',
  displayName: 'Prayers & Testimonies',
  publicRoutes: [
    { path: '/prayer-testimony', type: 'listing', displayName: 'Prayers & Testimonies Listing' },
    { path: '/prayer-testimony/:id', type: 'detail', displayName: 'Prayers & Testimonies Detail' }
  ],
  widgets: [
    {
      widgetKey: 'prayer-testimony.widget',
      displayName: 'Prayers & Testimonies Widget',
      exposedThemeSlots: ["prayer.sessionCard","prayer.room","prayer.requestForm","prayer.wall","testimony.card","testimony.wall"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'prayer-testimony.dashboard', displayName: 'Prayers & Testimonies Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Prayers & Testimonies', action: 'view', url: '/prayer-testimony' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'prayer.sessionCard',
      displayName: 'Prayer SessionCard',
      expectedDataType: 'PrayerSessionCardContract'
    },
    {
      slotKey: 'prayer.room',
      displayName: 'Prayer Room',
      expectedDataType: 'PrayerRoomContract'
    },
    {
      slotKey: 'prayer.requestForm',
      displayName: 'Prayer RequestForm',
      expectedDataType: 'PrayerRequestFormContract'
    },
    {
      slotKey: 'prayer.wall',
      displayName: 'Prayer Wall',
      expectedDataType: 'PrayerWallContract'
    },
    {
      slotKey: 'testimony.card',
      displayName: 'Testimony Card',
      expectedDataType: 'TestimonyCardContract'
    },
    {
      slotKey: 'testimony.wall',
      displayName: 'Testimony Wall',
      expectedDataType: 'TestimonyWallContract'
    }],
  entitlementRules: [
    { moduleKey: 'prayer-testimony', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Prayers & Testimonies',
    description: 'Explore the Prayers & Testimonies module interface.'
  },
  localizationKeys: ['prayer-testimony.title', 'prayer-testimony.empty'],
  analyticsEvents: [
    { eventName: 'prayer-testimony_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
