import { ModuleUIContract } from '../core/base.types';

export const MultiBranchModuleContract: ModuleUIContract = {
  moduleKey: 'multi-branch',
  displayName: 'Multi-Branch Engine',
  publicRoutes: [
    { path: '/multi-branch', type: 'listing', displayName: 'Multi-Branch Engine Listing' },
    { path: '/multi-branch/:id', type: 'detail', displayName: 'Multi-Branch Engine Detail' }
  ],
  widgets: [
    {
      widgetKey: 'multi-branch.widget',
      displayName: 'Multi-Branch Engine Widget',
      exposedThemeSlots: ["service.card"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'multi-branch.dashboard', displayName: 'Multi-Branch Engine Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Multi-Branch Engine', action: 'view', url: '/multi-branch' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'service.card',
      displayName: 'Service Card',
      expectedDataType: 'ServiceCardContract'
    }],
  entitlementRules: [
    { moduleKey: 'multi-branch', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Multi-Branch Engine',
    description: 'Explore the Multi-Branch Engine module interface.'
  },
  localizationKeys: ['multi-branch.title', 'multi-branch.empty'],
  analyticsEvents: [
    { eventName: 'multi-branch_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
