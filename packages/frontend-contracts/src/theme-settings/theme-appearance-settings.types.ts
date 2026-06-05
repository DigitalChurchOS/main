/**
 * Universal Theme Appearance Settings — Unified Root Type
 *
 * Composes all category-specific settings into a single root interface.
 * This is the primary type used by the ThemeAdapter, API responses,
 * CSS injector, and dashboard settings UI.
 */

import { ThemeColorSettings } from './color-settings.types';
import { ThemeTypographySettings } from './typography-settings.types';
import { ThemeSpacingSettings } from './spacing-settings.types';
import { ThemeBorderSettings } from './border-settings.types';
import { ThemeShadowSettings } from './shadow-settings.types';
import { ThemeAnimationSettings } from './animation-settings.types';
import { ThemeLayoutSettings } from './layout-settings.types';
import { ThemeCustomCSSSettings } from './custom-css-settings.types';

/**
 * All recognized settings category keys.
 */
export type ThemeAppearanceSettingsCategory =
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'borders'
  | 'shadows'
  | 'animations'
  | 'layout'
  | 'customCSS';

/**
 * Complete list of all settings categories for iteration.
 */
export const ALL_SETTINGS_CATEGORIES: ThemeAppearanceSettingsCategory[] = [
  'colors',
  'typography',
  'spacing',
  'borders',
  'shadows',
  'animations',
  'layout',
  'customCSS',
];

/**
 * The unified root type for all theme appearance settings.
 * Every field is optional — themes consume only what they support.
 */
export interface ThemeAppearanceSettings {
  colors?: ThemeColorSettings;
  typography?: ThemeTypographySettings;
  spacing?: ThemeSpacingSettings;
  borders?: ThemeBorderSettings;
  shadows?: ThemeShadowSettings;
  animations?: ThemeAnimationSettings;
  layout?: ThemeLayoutSettings;
  customCSS?: ThemeCustomCSSSettings;
}
