import { VisibilityState } from '../core/visibility.types';
import { SEOContract } from '../core/seo.types';

export interface PluginRouteContract {
  path: string;
  routeType: 'public' | 'member' | 'dashboard' | 'api' | 'preview';
  visibility: VisibilityState;
  requiredPermission?: string;
  requiredRole?: string;
  requiredModules?: string[];
  requiresAuth?: boolean;
  requiresPreviewToken?: boolean;
  seo?: SEOContract;
  themeSlot?: string;
  fallbackSlot?: string;
}
