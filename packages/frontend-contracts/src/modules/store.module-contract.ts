import { ModuleUIContract } from '../core/base.types';

export const StoreModuleContract: ModuleUIContract = {
  moduleKey: 'store',
  displayName: 'E-Commerce Store',
  publicRoutes: [
    { path: '/store', type: 'listing', displayName: 'E-Commerce Store Listing' },
    { path: '/store/:id', type: 'detail', displayName: 'E-Commerce Store Detail' }
  ],
  widgets: [
    {
      widgetKey: 'store.widget',
      displayName: 'E-Commerce Store Widget',
      exposedThemeSlots: ["store.productCard","store.productDetail"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'store.dashboard', displayName: 'E-Commerce Store Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View E-Commerce Store', action: 'view', url: '/store' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'store.productCard',
      displayName: 'Store ProductCard',
      expectedDataType: 'StoreProductCardContract'
    },
    {
      slotKey: 'store.productDetail',
      displayName: 'Store ProductDetail',
      expectedDataType: 'StoreProductDetailContract'
    }],
  entitlementRules: [
    { moduleKey: 'store', minBillingTier: 'free' }
  ],
  seo: {
    title: 'E-Commerce Store',
    description: 'Explore the E-Commerce Store module interface.'
  },
  localizationKeys: ['store.title', 'store.empty'],
  analyticsEvents: [
    { eventName: 'store_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
