export type PluginSurfaceType =
  | 'public'
  | 'member'
  | 'dashboard'
  | 'admin'
  | 'page_builder'
  | 'navigation_builder'
  | 'module_extension';

export interface PluginSurfaceContract {
  surfaceKey: string;
  displayName: string;
  surfaceType: PluginSurfaceType;
  injectionPoint?: string;
  themeSlot?: string;
  requiredPermission?: string;
  requiredRole?: string;
  requiredModules?: string[];
  visibilityRules?: any;
}
