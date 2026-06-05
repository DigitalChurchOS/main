import { ModuleUIContract } from '../core/base.types';

export const EventsModuleContract: ModuleUIContract = {
  moduleKey: 'events',
  displayName: 'Events & Registration',
  publicRoutes: [
    { path: '/events', type: 'listing', displayName: 'Events & Registration Listing' },
    { path: '/events/:id', type: 'detail', displayName: 'Events & Registration Detail' }
  ],
  widgets: [
    {
      widgetKey: 'events.widget',
      displayName: 'Events & Registration Widget',
      exposedThemeSlots: ["event.card","event.detail","event.registrationForm"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'events.dashboard', displayName: 'Events & Registration Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Events & Registration', action: 'view', url: '/events' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'event.card',
      displayName: 'Event Card',
      expectedDataType: 'EventCardContract'
    },
    {
      slotKey: 'event.detail',
      displayName: 'Event Detail',
      expectedDataType: 'EventDetailContract'
    },
    {
      slotKey: 'event.registrationForm',
      displayName: 'Event RegistrationForm',
      expectedDataType: 'EventRegistrationFormContract'
    }],
  entitlementRules: [
    { moduleKey: 'events', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Events & Registration',
    description: 'Explore the Events & Registration module interface.'
  },
  localizationKeys: ['events.title', 'events.empty'],
  analyticsEvents: [
    { eventName: 'events_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
