import React from 'react';
import { ThemeAppearanceSettings } from '@churchos/frontend-contracts';
import { sanitizeCustomCSS } from '@churchos/frontend-contracts';

/**
 * ThemeCSSInjector
 *
 * Converts resolved ThemeAppearanceSettings into CSS custom properties
 * and injects them into the document via a <style> tag on :root.
 *
 * If customCSS is provided and enabled, sanitizes and injects it
 * as a separate <style> block.
 *
 * Respects reduceMotion and enableAnimations toggles.
 */

export interface ThemeCSSInjectorProps {
  settings?: ThemeAppearanceSettings;
}

/**
 * Converts a camelCase key to a CSS custom property name.
 * e.g., 'primaryColor' → '--theme-primary-color'
 */
function toCSSVar(prefix: string, key: string): string {
  const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `--theme-${prefix}-${kebab}`;
}

/**
 * Generates CSS custom properties string from settings.
 */
function generateCSSVariables(settings: ThemeAppearanceSettings): string {
  const vars: string[] = [];

  // Colors
  if (settings.colors) {
    for (const [key, value] of Object.entries(settings.colors)) {
      if (value !== undefined && value !== null) {
        vars.push(`  ${toCSSVar('color', key)}: ${value};`);
      }
    }
  }

  // Typography
  if (settings.typography) {
    const typo = settings.typography;
    if (typo.fontFamily) vars.push(`  --theme-font-family: ${typo.fontFamily};`);
    if (typo.headingFontFamily) vars.push(`  --theme-heading-font-family: ${typo.headingFontFamily};`);
    if (typo.monoFontFamily) vars.push(`  --theme-mono-font-family: ${typo.monoFontFamily};`);
    if (typo.baseFontSize !== undefined) vars.push(`  --theme-font-size-base: ${typo.baseFontSize}px;`);
    if (typo.baseLineHeight !== undefined) vars.push(`  --theme-line-height-base: ${typo.baseLineHeight};`);
    if (typo.headingLineHeight !== undefined) vars.push(`  --theme-line-height-heading: ${typo.headingLineHeight};`);
    if (typo.fontWeightNormal !== undefined) vars.push(`  --theme-font-weight-normal: ${typo.fontWeightNormal};`);
    if (typo.fontWeightMedium !== undefined) vars.push(`  --theme-font-weight-medium: ${typo.fontWeightMedium};`);
    if (typo.fontWeightBold !== undefined) vars.push(`  --theme-font-weight-bold: ${typo.fontWeightBold};`);
    if (typo.letterSpacing) vars.push(`  --theme-letter-spacing: ${typo.letterSpacing};`);
    if (typo.headingLetterSpacing) vars.push(`  --theme-heading-letter-spacing: ${typo.headingLetterSpacing};`);
  }

  // Spacing
  if (settings.spacing) {
    const sp = settings.spacing;
    if (sp.spacingUnit !== undefined) vars.push(`  --theme-spacing-unit: ${sp.spacingUnit}px;`);
    if (sp.containerMaxWidth) vars.push(`  --theme-container-max-width: ${sp.containerMaxWidth};`);
    if (sp.containerPadding) vars.push(`  --theme-container-padding: ${sp.containerPadding};`);
    if (sp.sectionSpacing) vars.push(`  --theme-section-spacing: ${sp.sectionSpacing};`);
    if (sp.cardPadding) vars.push(`  --theme-card-padding: ${sp.cardPadding};`);
    if (sp.gridGap) vars.push(`  --theme-grid-gap: ${sp.gridGap};`);
  }

  // Borders
  if (settings.borders) {
    const b = settings.borders;
    if (b.borderRadius) vars.push(`  --theme-border-radius: ${b.borderRadius};`);
    if (b.borderRadiusSmall) vars.push(`  --theme-border-radius-sm: ${b.borderRadiusSmall};`);
    if (b.borderRadiusLarge) vars.push(`  --theme-border-radius-lg: ${b.borderRadiusLarge};`);
    if (b.borderWidth) vars.push(`  --theme-border-width: ${b.borderWidth};`);
    if (b.borderStyle) vars.push(`  --theme-border-style: ${b.borderStyle};`);
  }

  // Shadows
  if (settings.shadows) {
    const s = settings.shadows;
    if (s.shadowSmall) vars.push(`  --theme-shadow-sm: ${s.shadowSmall};`);
    if (s.shadowMedium) vars.push(`  --theme-shadow-md: ${s.shadowMedium};`);
    if (s.shadowLarge) vars.push(`  --theme-shadow-lg: ${s.shadowLarge};`);
    if (s.shadowNone) vars.push(`  --theme-shadow-none: ${s.shadowNone};`);
  }

  // Animations
  if (settings.animations) {
    const a = settings.animations;
    if (a.transitionDuration) vars.push(`  --theme-transition-duration: ${a.transitionDuration};`);
    if (a.transitionEasing) vars.push(`  --theme-transition-easing: ${a.transitionEasing};`);
    if (a.enableAnimations === false) {
      vars.push(`  --theme-transition-duration: 0ms;`);
      vars.push(`  --theme-animation-play-state: paused;`);
    }
  }

  if (vars.length === 0) return '';
  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Generates a @media block for reduced motion preference.
 */
function generateReducedMotionCSS(settings: ThemeAppearanceSettings): string {
  if (!settings.animations?.reduceMotion) return '';
  return `@media (prefers-reduced-motion: reduce) {
  :root {
    --theme-transition-duration: 0ms;
    --theme-animation-play-state: paused;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;
}

export const ThemeCSSInjector: React.FC<ThemeCSSInjectorProps> = ({ settings }) => {
  if (!settings) return null;

  const cssVariables = generateCSSVariables(settings);
  const reducedMotionCSS = generateReducedMotionCSS(settings);

  // Custom CSS sanitization
  let customCSSBlock = '';
  if (settings.customCSS?.customCSSEnabled && settings.customCSS?.customCSS) {
    const { sanitized } = sanitizeCustomCSS(settings.customCSS.customCSS);
    customCSSBlock = sanitized;
  }

  const fullCSS = [cssVariables, reducedMotionCSS, customCSSBlock].filter(Boolean).join('\n\n');

  if (!fullCSS) return null;

  return React.createElement('style', {
    'data-theme-settings': 'true',
    dangerouslySetInnerHTML: { __html: fullCSS }
  });
};
