import { PluginEntitlementRule } from './plugin-entitlement.types';
import { PluginSettingsSchemaField } from './plugin-settings.types';

export interface PluginWidgetContract {
  widgetKey: string;
  displayName: string;
  description: string;
  expectedDataType: string;
  exposedThemeSlots?: string[];
  allowedInjectionPoints: string[];
  defaultRendererSlot?: string;
  supportedCTAs?: string[];
  visibilityRules?: any;
  entitlementRules?: PluginEntitlementRule[];
  settingsSchema?: PluginSettingsSchemaField[];
  analyticsEvents?: string[];
  localizationKeys?: string[];
}
