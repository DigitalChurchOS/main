/**
 * Theme Capabilities Registry
 *
 * Registry for theme capability declarations.
 * Themes register what universal settings they support.
 * The dashboard UI queries this to render only relevant controls.
 */

import { ThemeCapabilities } from './theme-capabilities.types';
import { SettingsFieldSchema } from './settings-schema.types';
import { ThemeAppearanceSettingsCategory } from './theme-appearance-settings.types';
import { getSchemaForCategory, listAllSchemas } from './settings-schema-registry';

// ─────────────────────────────────────────────────────────────
// Internal state
// ─────────────────────────────────────────────────────────────

const capabilitiesMap = new Map<string, ThemeCapabilities>();

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Register capabilities for a theme.
 * Throws if the themeKey is already registered.
 */
export function registerThemeCapabilities(capabilities: ThemeCapabilities): void {
  if (capabilitiesMap.has(capabilities.themeKey)) {
    throw new Error(`Theme capabilities already registered for key: ${capabilities.themeKey}`);
  }
  capabilitiesMap.set(capabilities.themeKey, capabilities);
}

/**
 * Retrieve capabilities for a specific theme.
 * Returns undefined if the theme has not registered capabilities.
 */
export function getThemeCapabilities(themeKey: string): ThemeCapabilities | undefined {
  return capabilitiesMap.get(themeKey);
}

/**
 * Returns only the universal field schemas that a theme supports.
 * Intersects registered schemas with the theme's declared capabilities.
 *
 * If a theme supports a category but provides no specific field list,
 * all fields in that category are included.
 *
 * If the theme is not registered, returns an empty array.
 */
export function getSettingsForTheme(themeKey: string): SettingsFieldSchema[] {
  const caps = capabilitiesMap.get(themeKey);
  if (!caps) return [];

  const result: SettingsFieldSchema[] = [];

  for (const category of caps.supportedCategories) {
    const categorySchemas = getSchemaForCategory(category);
    const specificFields = caps.supportedFields[category];

    if (specificFields && specificFields.length > 0) {
      // Only include fields explicitly listed
      for (const schema of categorySchemas) {
        if (specificFields.includes(schema.key)) {
          result.push(schema);
        }
      }
    } else {
      // Category supported without field filter → include all fields
      result.push(...categorySchemas);
    }
  }

  return result;
}

/**
 * List all themes with registered capabilities.
 */
export function listRegisteredThemes(): ThemeCapabilities[] {
  return Array.from(capabilitiesMap.values());
}

/**
 * Check if a theme has registered capabilities.
 */
export function hasThemeCapabilities(themeKey: string): boolean {
  return capabilitiesMap.has(themeKey);
}

/**
 * Resets the registry (for testing purposes only).
 */
export function _resetCapabilitiesRegistry(): void {
  capabilitiesMap.clear();
}
