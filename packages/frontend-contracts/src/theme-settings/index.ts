/**
 * Theme Settings — Barrel Export
 *
 * Exposes all theme appearance settings types, registries, and utilities.
 */

// ── Category Settings Types ──
export * from './color-settings.types';
export * from './typography-settings.types';
export * from './spacing-settings.types';
export * from './border-settings.types';
export * from './shadow-settings.types';
export * from './animation-settings.types';
export * from './custom-css-settings.types';
export * from './layout-settings.types';

// ── Unified Root Type ──
export * from './theme-appearance-settings.types';

// ── Capabilities ──
export * from './theme-capabilities.types';

// ── Schema ──
export * from './settings-schema.types';

// ── Registries ──
export * from './settings-schema-registry';
export * from './theme-capabilities-registry';

// ── Validation ──
export * from './settings-validation';
