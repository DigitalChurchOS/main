/**
 * Theme Capabilities Declaration
 *
 * Each theme registers a ThemeCapabilities object declaring which universal
 * settings it supports. The dashboard UI uses this to show only relevant
 * settings controls. The validation engine uses it to flag unsupported fields.
 */

import { ThemeAppearanceSettingsCategory } from './theme-appearance-settings.types';

/**
 * Allows a theme to customize metadata for a specific universal field.
 */
export interface ThemeFieldOverride {
  /** The category the field belongs to */
  category: ThemeAppearanceSettingsCategory;
  /** The field key within the category */
  fieldKey: string;
  /** Custom label override */
  label?: string;
  /** Custom description override */
  description?: string;
  /** Minimum value for number fields */
  min?: number;
  /** Maximum value for number fields */
  max?: number;
  /** Custom options for select fields */
  options?: Array<{ value: string; label: string }>;
}

/**
 * Schema type for custom settings that themes can define beyond universal settings.
 */
export type ThemeCustomSettingType = 'text' | 'number' | 'color' | 'select' | 'toggle';

export interface ThemeCustomSettingDefinition {
  /** Unique key within this theme's custom settings */
  key: string;
  /** Human-readable label */
  label: string;
  /** Optional description */
  description?: string;
  /** Input type */
  type: ThemeCustomSettingType;
  /** Default value */
  defaultValue: string | number | boolean;
  /** Options for select type */
  options?: Array<{ value: string; label: string }>;
  /** Display group in the dashboard UI */
  group?: string;
}

/**
 * Declaration of what universal settings a theme supports.
 * Registered via the ThemeCapabilitiesRegistry.
 */
export interface ThemeCapabilities {
  /** Matches the ThemeAdapter.themeKey */
  themeKey: string;

  /** Which top-level categories this theme supports */
  supportedCategories: ThemeAppearanceSettingsCategory[];

  /**
   * Granular field support within each category.
   * If a category is supported but this map is empty for it,
   * ALL fields in that category are assumed supported.
   * If specific fields are listed, ONLY those fields are supported.
   */
  supportedFields: Partial<Record<ThemeAppearanceSettingsCategory, string[]>>;

  /** Optional field metadata overrides */
  fieldOverrides?: ThemeFieldOverride[];

  /** Custom theme-specific settings beyond the universal set */
  customSettings?: ThemeCustomSettingDefinition[];
}
