import { ModuleUIContract } from '../core/base.types';

export const CoursesModuleContract: ModuleUIContract = {
  moduleKey: 'courses',
  displayName: 'LMS Academy',
  publicRoutes: [
    { path: '/courses', type: 'listing', displayName: 'LMS Academy Listing' },
    { path: '/courses/:id', type: 'detail', displayName: 'LMS Academy Detail' }
  ],
  widgets: [
    {
      widgetKey: 'courses.widget',
      displayName: 'LMS Academy Widget',
      exposedThemeSlots: ["course.card","course.detail"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'courses.dashboard', displayName: 'LMS Academy Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View LMS Academy', action: 'view', url: '/courses' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'course.card',
      displayName: 'Course Card',
      expectedDataType: 'CourseCardContract'
    },
    {
      slotKey: 'course.detail',
      displayName: 'Course Detail',
      expectedDataType: 'CourseDetailContract'
    }],
  entitlementRules: [
    { moduleKey: 'courses', minBillingTier: 'free' }
  ],
  seo: {
    title: 'LMS Academy',
    description: 'Explore the LMS Academy module interface.'
  },
  localizationKeys: ['courses.title', 'courses.empty'],
  analyticsEvents: [
    { eventName: 'courses_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
