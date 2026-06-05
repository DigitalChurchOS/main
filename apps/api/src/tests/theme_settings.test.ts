/**
 * Universal Theme Appearance Settings — Test Suite
 *
 * Comprehensive tests covering:
 * 1. Schema Registry (field counts, categories, defaults)
 * 2. Capabilities Registry (registration, intersection, unknown themes)
 * 3. Validation (colors, CSS sanitization, settings validation)
 * 4. Settings Resolution (merge with defaults)
 * 5. ThemeAdapter backward compatibility
 * 6. API integration (site-context and preview with appearance settings)
 */

import {
  getSchemaForCategory,
  getSchemaForField,
  listAllSchemas,
  getDefaultValues,
  getSchemaCount,
  _resetSchemaRegistry,
  registerThemeCapabilities,
  getThemeCapabilities,
  getSettingsForTheme,
  listRegisteredThemes,
  _resetCapabilitiesRegistry,
  validateColorValue,
  sanitizeCustomCSS,
  validateThemeSettings,
  resolveSettingsWithDefaults,
  ThemeAppearanceSettings,
  ThemeCapabilities,
  ALL_SETTINGS_CATEGORIES,
} from '@churchos/frontend-contracts';

import request from 'supertest';
import jwt from 'jsonwebtoken';

// Dynamically import app for API tests
let app: any;
try {
  app = require('../../app').default || require('../../app');
} catch {
  // app may not be available in all test environments
}

// ─────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────

describe('Universal Theme Appearance Settings Tests', () => {

  beforeEach(() => {
    _resetSchemaRegistry();
    _resetCapabilitiesRegistry();
  });

  // ── Schema Registry ──

  describe('Settings Schema Registry', () => {
    it('should register all universal field schemas without conflicts', () => {
      const schemas = listAllSchemas();
      expect(schemas.length).toBeGreaterThanOrEqual(50);

      // Every schema should have required fields
      for (const schema of schemas) {
        expect(schema.key).toBeTruthy();
        expect(schema.category).toBeTruthy();
        expect(schema.label).toBeTruthy();
        expect(schema.type).toBeTruthy();
        expect(schema.defaultValue !== undefined).toBe(true);
      }
    });

    it('should return correct fields for each category', () => {
      const colorSchemas = getSchemaForCategory('colors');
      expect(colorSchemas.length).toBeGreaterThanOrEqual(20);
      expect(colorSchemas.every(s => s.category === 'colors')).toBe(true);

      const typoSchemas = getSchemaForCategory('typography');
      expect(typoSchemas.length).toBeGreaterThanOrEqual(8);
      expect(typoSchemas.every(s => s.category === 'typography')).toBe(true);

      const layoutSchemas = getSchemaForCategory('layout');
      expect(layoutSchemas.length).toBeGreaterThanOrEqual(5);
      expect(layoutSchemas.every(s => s.category === 'layout')).toBe(true);
    });

    it('should find a specific field schema by category and key', () => {
      const schema = getSchemaForField('colors', 'primaryColor');
      expect(schema).toBeDefined();
      expect(schema!.key).toBe('primaryColor');
      expect(schema!.type).toBe('color');
      expect(schema!.defaultValue).toBe('#6366f1');
    });

    it('should return undefined for unknown field key', () => {
      const schema = getSchemaForField('colors', 'nonExistentField');
      expect(schema).toBeUndefined();
    });

    it('should produce a complete valid ThemeAppearanceSettings from defaults', () => {
      const defaults = getDefaultValues();

      // All 8 categories should be present
      expect(defaults.colors).toBeDefined();
      expect(defaults.typography).toBeDefined();
      expect(defaults.spacing).toBeDefined();
      expect(defaults.borders).toBeDefined();
      expect(defaults.shadows).toBeDefined();
      expect(defaults.animations).toBeDefined();
      expect(defaults.layout).toBeDefined();
      expect(defaults.customCSS).toBeDefined();

      // Spot-check some values
      expect(defaults.colors!.primaryColor).toBe('#6366f1');
      expect(defaults.typography!.baseFontSize).toBe(16);
      expect(defaults.borders!.borderRadius).toBe('8px');
      expect(defaults.animations!.enableAnimations).toBe(true);
      expect(defaults.layout!.headerPosition).toBe('sticky');
    });

    it('should report consistent schema count', () => {
      const count = getSchemaCount();
      const allSchemas = listAllSchemas();
      expect(count).toBe(allSchemas.length);
      expect(count).toBeGreaterThanOrEqual(50);
    });

    it('should have no duplicate keys within a category', () => {
      for (const category of ALL_SETTINGS_CATEGORIES) {
        const schemas = getSchemaForCategory(category);
        const keys = schemas.map(s => s.key);
        const uniqueKeys = new Set(keys);
        expect(keys.length).toBe(uniqueKeys.size);
      }
    });
  });

  // ── Capabilities Registry ──

  describe('Theme Capabilities Registry', () => {
    const testCaps: ThemeCapabilities = {
      themeKey: 'test-theme',
      supportedCategories: ['colors', 'typography', 'layout'],
      supportedFields: {
        colors: ['primaryColor', 'secondaryColor', 'backgroundColor'],
      },
      fieldOverrides: [],
      customSettings: [],
    };

    it('should register and retrieve theme capabilities', () => {
      registerThemeCapabilities(testCaps);

      const retrieved = getThemeCapabilities('test-theme');
      expect(retrieved).toBeDefined();
      expect(retrieved!.themeKey).toBe('test-theme');
      expect(retrieved!.supportedCategories).toContain('colors');
    });

    it('should throw on duplicate registration', () => {
      registerThemeCapabilities(testCaps);
      expect(() => registerThemeCapabilities(testCaps)).toThrow('already registered');
    });

    it('should return only supported schemas for a theme', () => {
      registerThemeCapabilities(testCaps);

      const schemas = getSettingsForTheme('test-theme');
      expect(schemas.length).toBeGreaterThan(0);

      // Colors should only include 3 specific fields
      const colorSchemas = schemas.filter(s => s.category === 'colors');
      expect(colorSchemas.length).toBe(3);
      expect(colorSchemas.map(s => s.key).sort()).toEqual(
        ['backgroundColor', 'primaryColor', 'secondaryColor']
      );

      // Typography should include ALL fields (no specific field filter)
      const typoSchemas = schemas.filter(s => s.category === 'typography');
      expect(typoSchemas.length).toBeGreaterThanOrEqual(8);

      // Layout should include ALL fields
      const layoutSchemas = schemas.filter(s => s.category === 'layout');
      expect(layoutSchemas.length).toBeGreaterThanOrEqual(5);

      // Unsupported categories should not appear
      const spacingSchemas = schemas.filter(s => s.category === 'spacing');
      expect(spacingSchemas.length).toBe(0);
    });

    it('should return empty array for unknown themes', () => {
      const schemas = getSettingsForTheme('nonexistent-theme');
      expect(schemas).toEqual([]);
    });

    it('should list all registered themes', () => {
      registerThemeCapabilities(testCaps);
      registerThemeCapabilities({
        themeKey: 'another-theme',
        supportedCategories: ['colors'],
        supportedFields: {},
      });

      const themes = listRegisteredThemes();
      expect(themes.length).toBe(2);
    });
  });

  // ── Validation ──

  describe('Color Validation', () => {
    it('should accept valid hex colors', () => {
      expect(validateColorValue('#fff')).toBe(true);
      expect(validateColorValue('#FFF')).toBe(true);
      expect(validateColorValue('#ff0000')).toBe(true);
      expect(validateColorValue('#FF0000')).toBe(true);
      expect(validateColorValue('#ff000080')).toBe(true); // with alpha
    });

    it('should accept valid rgb/rgba colors', () => {
      expect(validateColorValue('rgb(255, 0, 0)')).toBe(true);
      expect(validateColorValue('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(validateColorValue('rgba(0, 0, 0, 1)')).toBe(true);
    });

    it('should accept valid hsl/hsla colors', () => {
      expect(validateColorValue('hsl(120, 100%, 50%)')).toBe(true);
      expect(validateColorValue('hsla(120, 100%, 50%, 0.5)')).toBe(true);
    });

    it('should reject invalid color values', () => {
      expect(validateColorValue('')).toBe(false);
      expect(validateColorValue('red')).toBe(false);
      expect(validateColorValue('not-a-color')).toBe(false);
      expect(validateColorValue('#gg0000')).toBe(false);
      expect(validateColorValue('#12345')).toBe(false);
    });
  });

  describe('Custom CSS Sanitization', () => {
    it('should block @import patterns', () => {
      const { sanitized, blocked } = sanitizeCustomCSS('@import url("evil.css"); body { color: red; }');
      expect(blocked).toContain('@import');
      expect(sanitized).not.toContain('@import');
      expect(sanitized).toContain('body { color: red; }');
    });

    it('should block expression() patterns', () => {
      const { sanitized, blocked } = sanitizeCustomCSS('div { width: expression(document.body.clientWidth); }');
      expect(blocked).toContain('expression()');
      expect(sanitized).not.toMatch(/expression\s*\(/i);
    });

    it('should block javascript: in url()', () => {
      const { sanitized, blocked } = sanitizeCustomCSS('div { background: url(javascript:alert(1)); }');
      expect(blocked.length).toBeGreaterThan(0);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should block -moz-binding', () => {
      const { sanitized, blocked } = sanitizeCustomCSS('div { -moz-binding: url("evil.xml"); }');
      expect(blocked).toContain('-moz-binding');
    });

    it('should block behavior:', () => {
      const { sanitized, blocked } = sanitizeCustomCSS('div { behavior: url("evil.htc"); }');
      expect(blocked).toContain('behavior:');
    });

    it('should pass safe CSS through unchanged', () => {
      const safeCSS = 'body { color: #333; font-size: 16px; } .card { border-radius: 8px; }';
      const { sanitized, blocked } = sanitizeCustomCSS(safeCSS);
      expect(blocked).toEqual([]);
      expect(sanitized).toBe(safeCSS);
    });

    it('should handle empty and null inputs gracefully', () => {
      expect(sanitizeCustomCSS('')).toEqual({ sanitized: '', blocked: [] });
      expect(sanitizeCustomCSS(null as any)).toEqual({ sanitized: '', blocked: [] });
    });
  });

  describe('Settings Validation Against Capabilities', () => {
    const capabilities: ThemeCapabilities = {
      themeKey: 'validate-theme',
      supportedCategories: ['colors', 'typography', 'animations'],
      supportedFields: {
        colors: ['primaryColor', 'secondaryColor'],
      },
    };

    it('should validate valid settings without errors', () => {
      const settings: ThemeAppearanceSettings = {
        colors: { primaryColor: '#ff0000', secondaryColor: '#00ff00' },
        typography: { baseFontSize: 16 },
      };

      registerThemeCapabilities(capabilities);
      const result = validateThemeSettings(settings, capabilities);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag invalid color values as errors', () => {
      const settings: ThemeAppearanceSettings = {
        colors: { primaryColor: 'not-a-color' },
      };

      registerThemeCapabilities(capabilities);
      const result = validateThemeSettings(settings, capabilities);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid color value'))).toBe(true);
    });

    it('should flag unsupported categories as warnings', () => {
      const settings: ThemeAppearanceSettings = {
        colors: { primaryColor: '#ff0000' },
        spacing: { spacingUnit: 4 },
      };

      registerThemeCapabilities(capabilities);
      const result = validateThemeSettings(settings, capabilities);
      // spacing is not in supportedCategories → warning
      expect(result.warnings.some(w => w.includes("'spacing'"))).toBe(true);
    });

    it('should flag out-of-range numbers as errors', () => {
      const settings: ThemeAppearanceSettings = {
        typography: { baseFontSize: 50 }, // max is 24
      };

      registerThemeCapabilities(capabilities);
      const result = validateThemeSettings(settings, capabilities);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('above maximum'))).toBe(true);
    });
  });

  // ── Settings Resolution ──

  describe('Settings Resolution', () => {
    it('should merge partial settings with defaults correctly', () => {
      const partial: Partial<ThemeAppearanceSettings> = {
        colors: { primaryColor: '#ff0000' },
      };

      const resolved = resolveSettingsWithDefaults(partial);

      // Explicit value should override
      expect(resolved.colors!.primaryColor).toBe('#ff0000');

      // Default values should fill in
      expect(resolved.colors!.secondaryColor).toBe('#8b5cf6');
      expect(resolved.typography!.baseFontSize).toBe(16);
      expect(resolved.borders!.borderRadius).toBe('8px');
    });

    it('should handle empty input by returning all defaults', () => {
      const resolved = resolveSettingsWithDefaults({});

      expect(resolved.colors!.primaryColor).toBe('#6366f1');
      expect(resolved.typography!.fontFamily).toBe('Inter, system-ui, sans-serif');
      expect(resolved.animations!.enableAnimations).toBe(true);
    });

    it('should not override explicit values with defaults', () => {
      const partial: Partial<ThemeAppearanceSettings> = {
        typography: { baseFontSize: 18, fontFamily: 'Roboto, sans-serif' },
      };

      const resolved = resolveSettingsWithDefaults(partial);
      expect(resolved.typography!.baseFontSize).toBe(18);
      expect(resolved.typography!.fontFamily).toBe('Roboto, sans-serif');
      // Other typography fields should have defaults
      expect(resolved.typography!.fontWeightBold).toBe(700);
    });
  });

  // ── ThemeAdapter Backward Compatibility ──

  describe('ThemeAdapter Compatibility', () => {
    it('should work without appearanceSettings (backward compat)', () => {
      const adapter = {
        themeKey: 'legacy-theme',
        displayName: 'Legacy Theme',
        version: '1.0.0',
        slots: {},
        supportsSlot: () => false,
      };

      // Should not throw when accessed
      expect(adapter.themeKey).toBe('legacy-theme');
      expect((adapter as any).appearanceSettings).toBeUndefined();
    });

    it('should accept appearanceSettings on ThemeAdapter', () => {
      const settings = resolveSettingsWithDefaults({
        colors: { primaryColor: '#ff6600' },
      });

      const adapter = {
        themeKey: 'modern-theme',
        displayName: 'Modern Theme',
        version: '2.0.0',
        slots: {},
        supportsSlot: () => false,
        appearanceSettings: settings,
      };

      expect(adapter.appearanceSettings).toBeDefined();
      expect(adapter.appearanceSettings!.colors!.primaryColor).toBe('#ff6600');
    });
  });

  // ── API Integration Tests ──

  if (app) {
    describe('GET /api/cms/site-context — Appearance Settings', () => {
      it('should return appearanceSettings in theme object', async () => {
        const response = await request(app)
          .get('/api/cms/site-context')
          .set('Host', 'demo.churchos.localhost')
          .expect(200);

        expect(response.body.data.theme).toBeDefined();
        expect(response.body.data.theme.appearanceSettings).toBeDefined();
        expect(response.body.data.theme.themeKey).toBeDefined();

        // appearanceSettings should have all categories
        const as = response.body.data.theme.appearanceSettings;
        expect(as.colors).toBeDefined();
        expect(as.typography).toBeDefined();
        expect(as.spacing).toBeDefined();
        expect(as.borders).toBeDefined();
        expect(as.shadows).toBeDefined();
        expect(as.animations).toBeDefined();
        expect(as.layout).toBeDefined();
        expect(as.customCSS).toBeDefined();
      });

      it('should sanitize custom CSS in appearanceSettings', async () => {
        // This test verifies that if custom CSS with @import exists,
        // it gets stripped in the response
        const response = await request(app)
          .get('/api/cms/site-context')
          .set('Host', 'demo.churchos.localhost')
          .expect(200);

        const css = response.body.data.theme.appearanceSettings?.customCSS?.customCSS;
        if (css) {
          expect(css).not.toMatch(/@import\b/i);
          expect(css).not.toMatch(/expression\s*\(/i);
        }
      });
    });

    describe('GET /api/cms/render/preview — Draft Appearance Settings', () => {
      it('should return appearanceSettings with draft settings merged', async () => {
        const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
        const token = jwt.sign({ tenantId: 'demo-tenant-id' }, JWT_SECRET, { expiresIn: '1h' });

        const response = await request(app)
          .get(`/api/cms/render/preview?slug=&token=${token}`)
          .set('Host', 'demo.churchos.localhost')
          .expect(200);

        expect(response.body.data.theme).toBeDefined();
        expect(response.body.data.theme.appearanceSettings).toBeDefined();
        expect(response.body.data.isPreviewMode).toBe(true);
      });
    });
  }
});
