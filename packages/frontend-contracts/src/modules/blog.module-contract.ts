import { ModuleUIContract } from '../core/base.types';

export const BlogModuleContract: ModuleUIContract = {
  moduleKey: 'blog',
  displayName: 'Dynamic Blog',
  publicRoutes: [
    { path: '/blog', type: 'listing', displayName: 'Dynamic Blog Listing' },
    { path: '/blog/:id', type: 'detail', displayName: 'Dynamic Blog Detail' }
  ],
  widgets: [
    {
      widgetKey: 'blog.widget',
      displayName: 'Dynamic Blog Widget',
      exposedThemeSlots: ["blog.articleCard"],
      supportedCTAs: ['view']
    }
  ],
  forms: [],
  memberSurfaces: [
    { screenKey: 'blog.dashboard', displayName: 'Dynamic Blog Member Portal', requiredRoles: ['member'] }
  ],
  ctas: [
    { label: 'View Dynamic Blog', action: 'view', url: '/blog' }
  ],
  states: [
    { state: 'loading', message: 'Loading content...' },
    { state: 'empty', message: 'No content found at this time.' },
    { state: 'error', message: 'An unexpected error occurred.' }
  ],
  dataContracts: [],
  themeSlots: [
    {
      slotKey: 'blog.articleCard',
      displayName: 'Blog ArticleCard',
      expectedDataType: 'BlogArticleCardContract'
    }],
  entitlementRules: [
    { moduleKey: 'blog', minBillingTier: 'free' }
  ],
  seo: {
    title: 'Dynamic Blog',
    description: 'Explore the Dynamic Blog module interface.'
  },
  localizationKeys: ['blog.title', 'blog.empty'],
  analyticsEvents: [
    { eventName: 'blog_view', eventType: 'page_view', payloadKeys: [] }
  ],
  dependencies: []
};
