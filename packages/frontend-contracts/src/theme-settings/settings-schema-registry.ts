/**
 * Settings Schema Registry
 *
 * Singleton registry that stores all universal settings field schemas.
 * Initialized with ~50 field definitions covering all 8 categories.
 * Used by the dashboard UI for form generation and by validation for constraint checking.
 */

import { SettingsFieldSchema } from './settings-schema.types';
import { ThemeAppearanceSettings, ThemeAppearanceSettingsCategory } from './theme-appearance-settings.types';

// ─────────────────────────────────────────────────────────────
// Internal state
// ─────────────────────────────────────────────────────────────

const schemas: SettingsFieldSchema[] = [];
let initialized = false;

// ─────────────────────────────────────────────────────────────
// Default field schemas for all categories
// ─────────────────────────────────────────────────────────────

function initializeDefaults(): void {
  if (initialized) return;
  initialized = true;

  // ── Colors ──
  const colorFields: Array<Omit<SettingsFieldSchema, 'category' | 'type'> & { group?: string }> = [
    { key: 'primaryColor', label: 'Primary Color', defaultValue: '#6366f1', group: 'Brand' },
    { key: 'secondaryColor', label: 'Secondary Color', defaultValue: '#8b5cf6', group: 'Brand' },
    { key: 'accentColor', label: 'Accent Color', defaultValue: '#f59e0b', group: 'Brand' },
    { key: 'backgroundColor', label: 'Background Color', defaultValue: '#ffffff', group: 'Surfaces' },
    { key: 'surfaceColor', label: 'Surface Color', defaultValue: '#f8fafc', group: 'Surfaces' },
    { key: 'cardColor', label: 'Card Color', defaultValue: '#ffffff', group: 'Surfaces' },
    { key: 'textColor', label: 'Text Color', defaultValue: '#1e293b', group: 'Text' },
    { key: 'textSecondaryColor', label: 'Secondary Text', defaultValue: '#64748b', group: 'Text' },
    { key: 'textMutedColor', label: 'Muted Text', defaultValue: '#94a3b8', group: 'Text' },
    { key: 'borderColor', label: 'Border Color', defaultValue: '#e2e8f0', group: 'Structure' },
    { key: 'dividerColor', label: 'Divider Color', defaultValue: '#f1f5f9', group: 'Structure' },
    { key: 'successColor', label: 'Success Color', defaultValue: '#22c55e', group: 'Semantic' },
    { key: 'warningColor', label: 'Warning Color', defaultValue: '#f59e0b', group: 'Semantic' },
    { key: 'errorColor', label: 'Error Color', defaultValue: '#ef4444', group: 'Semantic' },
    { key: 'infoColor', label: 'Info Color', defaultValue: '#3b82f6', group: 'Semantic' },
    { key: 'linkColor', label: 'Link Color', defaultValue: '#6366f1', group: 'Interactive' },
    { key: 'linkHoverColor', label: 'Link Hover Color', defaultValue: '#4f46e5', group: 'Interactive' },
    { key: 'headerBackground', label: 'Header Background', defaultValue: '#ffffff', group: 'Header & Footer' },
    { key: 'headerTextColor', label: 'Header Text', defaultValue: '#1e293b', group: 'Header & Footer' },
    { key: 'footerBackground', label: 'Footer Background', defaultValue: '#1e293b', group: 'Header & Footer' },
    { key: 'footerTextColor', label: 'Footer Text', defaultValue: '#f8fafc', group: 'Header & Footer' },
    { key: 'buttonPrimaryBg', label: 'Primary Button Background', defaultValue: '#6366f1', group: 'Buttons' },
    { key: 'buttonPrimaryText', label: 'Primary Button Text', defaultValue: '#ffffff', group: 'Buttons' },
    { key: 'buttonSecondaryBg', label: 'Secondary Button Background', defaultValue: '#f1f5f9', group: 'Buttons' },
    { key: 'buttonSecondaryText', label: 'Secondary Button Text', defaultValue: '#1e293b', group: 'Buttons' },
    { key: 'overlayColor', label: 'Overlay Color', defaultValue: '#000000', group: 'Overlay' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', defaultValue: '0.5', group: 'Overlay' },
  ];
  colorFields.forEach(f => schemas.push({ ...f, category: 'colors', type: 'color' }));

  // ── Typography ──
  schemas.push(
    { key: 'fontFamily', category: 'typography', label: 'Body Font', type: 'font', defaultValue: 'Inter, system-ui, sans-serif', group: 'Fonts' },
    { key: 'headingFontFamily', category: 'typography', label: 'Heading Font', type: 'font', defaultValue: 'Inter, system-ui, sans-serif', group: 'Fonts' },
    { key: 'monoFontFamily', category: 'typography', label: 'Monospace Font', type: 'font', defaultValue: 'ui-monospace, monospace', group: 'Fonts' },
    { key: 'baseFontSize', category: 'typography', label: 'Base Font Size', type: 'number', defaultValue: 16, min: 12, max: 24, unit: 'px', group: 'Sizing' },
    { key: 'baseLineHeight', category: 'typography', label: 'Body Line Height', type: 'number', defaultValue: 1.6, min: 1.0, max: 2.5, group: 'Sizing' },
    { key: 'headingLineHeight', category: 'typography', label: 'Heading Line Height', type: 'number', defaultValue: 1.2, min: 1.0, max: 2.0, group: 'Sizing' },
    { key: 'fontWeightNormal', category: 'typography', label: 'Normal Weight', type: 'number', defaultValue: 400, min: 100, max: 900, group: 'Weights' },
    { key: 'fontWeightMedium', category: 'typography', label: 'Medium Weight', type: 'number', defaultValue: 500, min: 100, max: 900, group: 'Weights' },
    { key: 'fontWeightBold', category: 'typography', label: 'Bold Weight', type: 'number', defaultValue: 700, min: 100, max: 900, group: 'Weights' },
    { key: 'letterSpacing', category: 'typography', label: 'Body Letter Spacing', type: 'text', defaultValue: 'normal', placeholder: 'e.g., normal, 0.02em', group: 'Spacing' },
    { key: 'headingLetterSpacing', category: 'typography', label: 'Heading Letter Spacing', type: 'text', defaultValue: '-0.02em', placeholder: 'e.g., -0.02em', group: 'Spacing' },
  );

  // ── Spacing ──
  schemas.push(
    { key: 'spacingUnit', category: 'spacing', label: 'Spacing Unit', type: 'number', defaultValue: 4, min: 2, max: 12, unit: 'px', group: 'Base' },
    { key: 'containerMaxWidth', category: 'spacing', label: 'Container Max Width', type: 'text', defaultValue: '1200px', placeholder: 'e.g., 1200px, 1440px', group: 'Layout' },
    { key: 'containerPadding', category: 'spacing', label: 'Container Padding', type: 'text', defaultValue: '1rem', placeholder: 'e.g., 1rem, 24px', group: 'Layout' },
    { key: 'sectionSpacing', category: 'spacing', label: 'Section Spacing', type: 'text', defaultValue: '4rem', placeholder: 'e.g., 4rem, 64px', group: 'Layout' },
    { key: 'cardPadding', category: 'spacing', label: 'Card Padding', type: 'text', defaultValue: '1.5rem', placeholder: 'e.g., 1.5rem, 24px', group: 'Components' },
    { key: 'gridGap', category: 'spacing', label: 'Grid Gap', type: 'text', defaultValue: '1.5rem', placeholder: 'e.g., 1.5rem, 24px', group: 'Components' },
  );

  // ── Borders ──
  schemas.push(
    { key: 'borderRadius', category: 'borders', label: 'Border Radius', type: 'text', defaultValue: '8px', placeholder: 'e.g., 8px, 0, 9999px', group: 'Radius' },
    { key: 'borderRadiusSmall', category: 'borders', label: 'Small Radius', type: 'text', defaultValue: '4px', placeholder: 'e.g., 4px', group: 'Radius' },
    { key: 'borderRadiusLarge', category: 'borders', label: 'Large Radius', type: 'text', defaultValue: '16px', placeholder: 'e.g., 16px', group: 'Radius' },
    { key: 'borderWidth', category: 'borders', label: 'Border Width', type: 'text', defaultValue: '1px', placeholder: 'e.g., 1px', group: 'Style' },
    { key: 'borderStyle', category: 'borders', label: 'Border Style', type: 'select', defaultValue: 'solid', options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'none', label: 'None' },
    ], group: 'Style' },
  );

  // ── Shadows ──
  schemas.push(
    { key: 'shadowSmall', category: 'shadows', label: 'Small Shadow', type: 'text', defaultValue: '0 1px 2px rgba(0,0,0,0.05)', placeholder: 'CSS shadow value', group: 'Elevation' },
    { key: 'shadowMedium', category: 'shadows', label: 'Medium Shadow', type: 'text', defaultValue: '0 4px 6px rgba(0,0,0,0.07)', placeholder: 'CSS shadow value', group: 'Elevation' },
    { key: 'shadowLarge', category: 'shadows', label: 'Large Shadow', type: 'text', defaultValue: '0 10px 15px rgba(0,0,0,0.1)', placeholder: 'CSS shadow value', group: 'Elevation' },
    { key: 'shadowNone', category: 'shadows', label: 'No Shadow', type: 'text', defaultValue: 'none', group: 'Elevation' },
  );

  // ── Animations ──
  schemas.push(
    { key: 'transitionDuration', category: 'animations', label: 'Transition Duration', type: 'text', defaultValue: '200ms', placeholder: 'e.g., 200ms, 0.3s', group: 'Timing' },
    { key: 'transitionEasing', category: 'animations', label: 'Transition Easing', type: 'select', defaultValue: 'cubic-bezier(0.4, 0, 0.2, 1)', options: [
      { value: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'Ease (Material)' },
      { value: 'ease-in-out', label: 'Ease In Out' },
      { value: 'ease-out', label: 'Ease Out' },
      { value: 'linear', label: 'Linear' },
      { value: 'cubic-bezier(0.22, 1, 0.36, 1)', label: 'Ease Out Expo' },
    ], group: 'Timing' },
    { key: 'enableAnimations', category: 'animations', label: 'Enable Animations', type: 'toggle', defaultValue: true, description: 'Master toggle for all animations and transitions', group: 'Accessibility' },
    { key: 'reduceMotion', category: 'animations', label: 'Respect Reduced Motion', type: 'toggle', defaultValue: true, description: 'Automatically disable animations when the user prefers reduced motion', group: 'Accessibility' },
  );

  // ── Layout ──
  schemas.push(
    { key: 'headerStyle', category: 'layout', label: 'Header Style', type: 'select', defaultValue: 'solid', options: [
      { value: 'solid', label: 'Solid' },
      { value: 'transparent', label: 'Transparent' },
      { value: 'gradient', label: 'Gradient' },
    ], group: 'Header' },
    { key: 'headerPosition', category: 'layout', label: 'Header Position', type: 'select', defaultValue: 'sticky', options: [
      { value: 'static', label: 'Static' },
      { value: 'sticky', label: 'Sticky' },
      { value: 'fixed', label: 'Fixed' },
    ], group: 'Header' },
    { key: 'footerStyle', category: 'layout', label: 'Footer Style', type: 'select', defaultValue: 'standard', options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'standard', label: 'Standard' },
      { value: 'expanded', label: 'Expanded' },
    ], group: 'Footer' },
    { key: 'logoPosition', category: 'layout', label: 'Logo Position', type: 'select', defaultValue: 'left', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
    ], group: 'Header' },
    { key: 'navigationStyle', category: 'layout', label: 'Navigation Style', type: 'select', defaultValue: 'horizontal', options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'hamburger', label: 'Hamburger Menu' },
      { value: 'sidebar', label: 'Sidebar' },
    ], group: 'Navigation' },
    { key: 'heroStyle', category: 'layout', label: 'Hero Style', type: 'select', defaultValue: 'full-width', options: [
      { value: 'full-width', label: 'Full Width' },
      { value: 'contained', label: 'Contained' },
      { value: 'split', label: 'Split' },
    ], group: 'Content' },
    { key: 'cardStyle', category: 'layout', label: 'Card Style', type: 'select', defaultValue: 'elevated', options: [
      { value: 'flat', label: 'Flat' },
      { value: 'elevated', label: 'Elevated' },
      { value: 'bordered', label: 'Bordered' },
      { value: 'glassmorphism', label: 'Glassmorphism' },
    ], group: 'Content' },
  );

  // ── Custom CSS ──
  schemas.push(
    { key: 'customCSS', category: 'customCSS', label: 'Custom CSS', type: 'css', defaultValue: '', description: 'Add custom CSS rules to override theme styles. Dangerous patterns are automatically stripped.', placeholder: '/* Your custom CSS here */', group: 'Advanced' },
    { key: 'customCSSEnabled', category: 'customCSS', label: 'Enable Custom CSS', type: 'toggle', defaultValue: false, description: 'Toggle custom CSS injection on the public site', group: 'Advanced' },
  );
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Returns all field schemas for a specific category.
 */
export function getSchemaForCategory(category: ThemeAppearanceSettingsCategory): SettingsFieldSchema[] {
  initializeDefaults();
  return schemas.filter(s => s.category === category);
}

/**
 * Returns a single field schema by category and key.
 */
export function getSchemaForField(category: ThemeAppearanceSettingsCategory, key: string): SettingsFieldSchema | undefined {
  initializeDefaults();
  return schemas.find(s => s.category === category && s.key === key);
}

/**
 * Returns all registered field schemas across all categories.
 */
export function listAllSchemas(): SettingsFieldSchema[] {
  initializeDefaults();
  return [...schemas];
}

/**
 * Returns a complete ThemeAppearanceSettings object with all defaults filled in.
 */
export function getDefaultValues(): ThemeAppearanceSettings {
  initializeDefaults();

  const defaults: ThemeAppearanceSettings = {
    colors: {},
    typography: {},
    spacing: {},
    borders: {},
    shadows: {},
    animations: {},
    layout: {},
    customCSS: {},
  };

  for (const schema of schemas) {
    const cat = schema.category as keyof ThemeAppearanceSettings;
    if (defaults[cat]) {
      (defaults[cat] as Record<string, unknown>)[schema.key] = schema.defaultValue;
    }
  }

  return defaults;
}

/**
 * Returns the total count of registered field schemas.
 */
export function getSchemaCount(): number {
  initializeDefaults();
  return schemas.length;
}

/**
 * Resets the registry (for testing purposes only).
 */
export function _resetSchemaRegistry(): void {
  schemas.length = 0;
  initialized = false;
}
