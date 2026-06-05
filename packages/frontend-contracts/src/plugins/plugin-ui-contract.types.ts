import { PluginRouteContract } from './plugin-route.types';
import { PluginWidgetContract } from './plugin-widget.types';
import { PluginFormContract } from './plugin-form.types';
import { PluginSlotContract } from './plugin-slot.types';
import { PluginSurfaceContract } from './plugin-surface.types';
import { PluginEntitlementRule } from './plugin-entitlement.types';

export interface PluginUIContract {
  pluginKey: string;
  providedRoutes: PluginRouteContract[];
  providedWidgets: PluginWidgetContract[];
  providedForms: PluginFormContract[];
  providedThemeSlots: PluginSlotContract[];
  providedInjectionPoints: string[]; // actual injection point keys provided
  providedMemberSurfaces: PluginSurfaceContract[];
  providedDashboardSurfaces: PluginSurfaceContract[];
  dataContracts?: string[];
  ctas?: any[];
  states?: any[];
  visibilityRules?: any;
  entitlementRules?: PluginEntitlementRule[];
  permissions?: string[];
  dependencies?: string[];
  analyticsEvents?: string[];
  localizationKeys?: string[];
}
