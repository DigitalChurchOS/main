/**
 * Settings Validation
 *
 * Validation utilities for theme appearance settings.
 * Includes value validation, custom CSS sanitization, and settings resolution.
 */

import { ThemeAppearanceSettings, ThemeAppearanceSettingsCategory, ALL_SETTINGS_CATEGORIES } from './theme-appearance-settings.types';
import { ThemeCapabilities } from './theme-capabilities.types';
import { CSS_SECURITY_BLOCKED_PATTERNS, CSS_SECURITY_BLOCKED_NAMES } from './custom-css-settings.types';
import { getDefaultValues, getSchemaForCategory } from './settings-schema-registry';

// ─────────────────────────────────────────────────────────────
// Validation Result Types
// ─────────────────────────────────────────────────────────────

export interface SettingsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CSSsanitizationResult {
  sanitized: string;
  blocked: string[];
}

// ─────────────────────────────────────────────────────────────
// Color Validation
// ─────────────────────────────────────────────────────────────

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_REGEX = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+))?\s*\)$/;
const HSL_REGEX = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(?:,\s*(?:0|1|0?\.\d+))?\s*\)$/;

/**
 * Validates a CSS color value string.
 * Supports hex (#rgb, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl(), hsla().
 */
export function validateColorValue(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return HEX_COLOR_REGEX.test(trimmed) || RGB_REGEX.test(trimmed) || HSL_REGEX.test(trimmed);
}

// ─────────────────────────────────────────────────────────────
// Custom CSS Sanitization
// ─────────────────────────────────────────────────────────────

/**
 * Sanitizes tenant-provided custom CSS by stripping dangerous patterns.
 * Returns the sanitized CSS string and a list of blocked pattern names.
 */
export function sanitizeCustomCSS(css: string): CSSsanitizationResult {
  if (!css || typeof css !== 'string') {
    return { sanitized: '', blocked: [] };
  }

  let sanitized = css;
  const blocked: string[] = [];

  for (let i = 0; i < CSS_SECURITY_BLOCKED_PATTERNS.length; i++) {
    const pattern = CSS_SECURITY_BLOCKED_PATTERNS[i];
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      blocked.push(CSS_SECURITY_BLOCKED_NAMES[i]);
      // Reset lastIndex again before replace
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, '/* [blocked] */');
    }
  }

  return { sanitized, blocked };
}

// ─────────────────────────────────────────────────────────────
// Settings Validation
// ─────────────────────────────────────────────────────────────

/**
 * Validates theme appearance settings against their schemas
 * and the theme's declared capabilities.
 *
 * - Errors: invalid values (e.g., bad color format, out-of-range numbers)
 * - Warnings: fields set for categories the theme doesn't support
 */
export function validateThemeSettings(
  settings: ThemeAppearanceSettings,
  capabilities: ThemeCapabilities
): SettingsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const category of ALL_SETTINGS_CATEGORIES) {
    const categorySettings = settings[category];
    if (!categorySettings) continue;

    const isSupported = capabilities.supportedCategories.includes(category);
    if (!isSupported) {
      // Settings provided for unsupported category → warning
      const keys = Object.keys(categorySettings).filter(
        k => (categorySettings as Record<string, unknown>)[k] !== undefined
      );
      if (keys.length > 0) {
        warnings.push(`Category '${category}' is not supported by theme '${capabilities.themeKey}'. Fields: ${keys.join(', ')}`);
      }
      continue;
    }

    // Validate individual fields
    const categorySchemas = getSchemaForCategory(category);
    for (const schema of categorySchemas) {
      const value = (categorySettings as Record<string, unknown>)[schema.key];
      if (value === undefined || value === null) continue;

      // Type-specific validation
      if (schema.type === 'color' && typeof value === 'string') {
        if (!validateColorValue(value)) {
          errors.push(`Invalid color value for ${category}.${schema.key}: '${value}'`);
        }
      }

      if (schema.type === 'number' && typeof value === 'number') {
        if (schema.min !== undefined && value < schema.min) {
          errors.push(`Value for ${category}.${schema.key} (${value}) is below minimum (${schema.min})`);
        }
        if (schema.max !== undefined && value > schema.max) {
          errors.push(`Value for ${category}.${schema.key} (${value}) is above maximum (${schema.max})`);
        }
      }

      if (schema.type === 'select' && schema.options && typeof value === 'string') {
        const validOptions = schema.options.map(o => o.value);
        if (!validOptions.includes(value)) {
          errors.push(`Invalid option for ${category}.${schema.key}: '${value}'. Valid options: ${validOptions.join(', ')}`);
        }
      }

      // Check field-level support
      const specificFields = capabilities.supportedFields[category];
      if (specificFields && specificFields.length > 0 && !specificFields.includes(schema.key)) {
        warnings.push(`Field '${category}.${schema.key}' is not supported by theme '${capabilities.themeKey}'`);
      }
    }
  }

  // Validate custom CSS if present
  if (settings.customCSS?.customCSS) {
    const { blocked } = sanitizeCustomCSS(settings.customCSS.customCSS);
    if (blocked.length > 0) {
      warnings.push(`Custom CSS contains blocked patterns: ${blocked.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────
// Settings Resolution
// ─────────────────────────────────────────────────────────────

/**
 * Merges partial tenant settings with registry defaults,
 * producing a complete ThemeAppearanceSettings object.
 *
 * Explicit values in the input override defaults.
 * Undefined fields receive default values from the schema registry.
 */
export function resolveSettingsWithDefaults(
  settings: Partial<ThemeAppearanceSettings>
): ThemeAppearanceSettings {
  const defaults = getDefaultValues();
  const resolved: ThemeAppearanceSettings = {};

  for (const category of ALL_SETTINGS_CATEGORIES) {
    const defaultCat = defaults[category] as Record<string, unknown> | undefined;
    const inputCat = settings[category] as Record<string, unknown> | undefined;

    if (!defaultCat) continue;

    const mergedCat: Record<string, unknown> = { ...defaultCat };

    if (inputCat) {
      for (const key of Object.keys(inputCat)) {
        if (inputCat[key] !== undefined) {
          mergedCat[key] = inputCat[key];
        }
      }
    }

    (resolved as Record<string, unknown>)[category] = mergedCat;
  }

  return resolved;
}
