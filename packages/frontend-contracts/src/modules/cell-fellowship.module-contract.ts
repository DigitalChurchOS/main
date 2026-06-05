import { ModuleUIContract } from '../core/base.types';

export const CellFellowshipModuleContract: ModuleUIContract = {
  moduleKey: 'cell-fellowship',
  displayName: 'Cell Fellowship',
  publicRoutes: [
    { path: '/cell-fellowship', type: 'listing', displayName: 'Cell Fellowship Listing' },
    { path: '/cell-fellowship/:id', type: 'detail', displayName: 'Cell Fellowship Detail' }
  ],
  widgets: [
    {
      widgetKey: 'cell-fellowship.widget',
      displayName: 'Cell Fellowship Widget',
      exposedThemeSlots: ["group.card","group.detail"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'cell-fellowship.dashboard', displayName: 'Cell Fellowship Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Cell Fellowship', action: 'view', url: '/cell-fellowship' }
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
    { moduleKey: 'cell-fellowship', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Cell Fellowship',
    description: 'Explore the Cell Fellowship module interface.'
  },
  localizationKeys: ['cell-fellowship.title', 'cell-fellowship.empty'],
  analyticsEvents: [
    { eventName: 'cell-fellowship_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
