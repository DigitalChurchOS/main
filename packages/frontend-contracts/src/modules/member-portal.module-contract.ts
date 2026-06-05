import { ModuleUIContract } from '../core/base.types';

export const MemberPortalModuleContract: ModuleUIContract = {
  moduleKey: 'member-portal',
  displayName: 'Member Portal',
  publicRoutes: [
    { path: '/member-portal', type: 'listing', displayName: 'Member Portal Listing' },
    { path: '/member-portal/:id', type: 'detail', displayName: 'Member Portal Detail' }
  ],
  widgets: [
    {
      widgetKey: 'member-portal.widget',
      displayName: 'Member Portal Widget',
      exposedThemeSlots: ["member.profile","member.dashboard"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'member-portal.dashboard', displayName: 'Member Portal Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Member Portal', action: 'view', url: '/member-portal' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'member.profile',
      displayName: 'Member Profile',
      expectedDataType: 'MemberProfileContract'
    },
    {
      slotKey: 'member.dashboard',
      displayName: 'Member Dashboard',
      expectedDataType: 'MemberDashboardContract'
    }],
  entitlementRules: [
    { moduleKey: 'member-portal', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Member Portal',
    description: 'Explore the Member Portal module interface.'
  },
  localizationKeys: ['member-portal.title', 'member-portal.empty'],
  analyticsEvents: [
    { eventName: 'member-portal_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
