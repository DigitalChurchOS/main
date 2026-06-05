import { ModuleUIContract } from '../core/base.types';

export const BookingAppointmentsModuleContract: ModuleUIContract = {
  moduleKey: 'booking-appointments',
  displayName: 'Booking & Appointments',
  publicRoutes: [
    { path: '/booking-appointments', type: 'listing', displayName: 'Booking & Appointments Listing' },
    { path: '/booking-appointments/:id', type: 'detail', displayName: 'Booking & Appointments Detail' }
  ],
  widgets: [
    {
      widgetKey: 'booking-appointments.widget',
      displayName: 'Booking & Appointments Widget',
      exposedThemeSlots: ["event.registrationForm"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'booking-appointments.dashboard', displayName: 'Booking & Appointments Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Booking & Appointments', action: 'view', url: '/booking-appointments' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'event.registrationForm',
      displayName: 'Event RegistrationForm',
      expectedDataType: 'EventRegistrationFormContract'
    }],
  entitlementRules: [
    { moduleKey: 'booking-appointments', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Booking & Appointments',
    description: 'Explore the Booking & Appointments module interface.'
  },
  localizationKeys: ['booking-appointments.title', 'booking-appointments.empty'],
  analyticsEvents: [
    { eventName: 'booking-appointments_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
