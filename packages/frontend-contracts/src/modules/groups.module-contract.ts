import { ModuleUIContract } from '../core/base.types';

export const GroupsModuleContract: ModuleUIContract = {
  moduleKey: 'groups',
  displayName: 'Small Groups',
  publicRoutes: [
    { path: '/groups', type: 'listing', displayName: 'Small Groups Listing' },
    { path: '/groups/:id', type: 'detail', displayName: 'Small Groups Detail' }
  ],
  widgets: [
    {
      widgetKey: 'groups.widget',
      displayName: 'Small Groups Widget',
      exposedThemeSlots: ["group.card","group.detail"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'groups.dashboard', displayName: 'Small Groups Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Small Groups', action: 'view', url: '/groups' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'group.card',
      displayName: 'Group Card',
      expectedDataType: 'GroupCardContract'
    },
    {
      slotKey: 'group.detail',
      displayName: 'Group Detail',
      expectedDataType: 'GroupDetailContract'
    }],
  entitlementRules: [
    { moduleKey: 'groups', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Small Groups',
    description: 'Explore the Small Groups module interface.'
  },
  localizationKeys: ['groups.title', 'groups.empty'],
  analyticsEvents: [
    { eventName: 'groups_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
