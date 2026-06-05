import { PluginRouteContract } from './plugin-route.types';
import { PluginWidgetContract } from './plugin-widget.types';
import { PluginFormContract } from './plugin-form.types';
import { PluginSurfaceContract } from './plugin-surface.types';
import { PluginSlotContract } from './plugin-slot.types';
import { PluginSettingsSchemaField } from './plugin-settings.types';
import { PluginEntitlementRule } from './plugin-entitlement.types';
import { PluginAnalyticsEventContract } from './plugin-analytics.types';
import { SEOContract } from '../core/seo.types';

export type PluginCategory =
  | 'communication'
  | 'giving'
  | 'media'
  | 'livestream'
  | 'prayer'
  | 'testimony'
  | 'events'
  | 'groups'
  | 'courses'
  | 'commerce'
  | 'analytics'
  | 'seo'
  | 'localization'
  | 'forms'
  | 'automation'
  | 'integration'
  | 'member-portal'
  | 'dashboard'
  | 'theme-extension'
  | 'custom';

export type PluginStatus =
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'suspended'
  | 'incompatible'
  | 'pending_setup'
  | 'update_required'
  | 'deprecated'
  | 'blocked';

export interface PluginManifest {
  pluginKey: string;
  displayName: string;
  description: string;
  version: string;
  author: string;
  category: PluginCategory;
  status: PluginStatus;
  icon?: string;
  documentationUrl?: string;
  publicRoutes?: PluginRouteContract[];
  widgets?: PluginWidgetContract[];
  forms?: PluginFormContract[];
  memberSurfaces?: PluginSurfaceContract[];
  dashboardSurfaces?: PluginSurfaceContract[];
  adminSurfaces?: PluginSurfaceContract[];
  themeSlots?: PluginSlotContract[];
  injectionPoints?: string[];
  settingsSchema?: PluginSettingsSchemaField[];
  permissions?: string[];
  dependencies?: string[];
  requiredModules?: string[];
  entitlementRules?: PluginEntitlementRule[];
  localizationKeys?: string[];
  analyticsEvents?: PluginAnalyticsEventContract[];
  seo?: SEOContract;
  compatibility?: string;
  installConfig?: any;
  uninstallBehavior?: string;
  dataAccessPolicy?: any;
}
