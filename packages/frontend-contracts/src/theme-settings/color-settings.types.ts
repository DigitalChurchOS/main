/**
 * Universal Theme Color Settings
 *
 * Defines the shared color palette contract that all themes can support.
 * All fields are optional — themes omit fields they don't support.
 * Values must be valid CSS color strings (hex, rgb, rgba, hsl, hsla).
 */

export interface ThemeColorSettings {
  // ── Brand Palette ──
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;

  // ── Surface Layers ──
  backgroundColor?: string;
  surfaceColor?: string;
  cardColor?: string;

  // ── Text Hierarchy ──
  textColor?: string;
  textSecondaryColor?: string;
  textMutedColor?: string;

  // ── Structural Lines ──
  borderColor?: string;
  dividerColor?: string;

  // ── Semantic Status ──
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  infoColor?: string;

  // ── Interactive Text ──
  linkColor?: string;
  linkHoverColor?: string;

  // ── Header Overrides ──
  headerBackground?: string;
  headerTextColor?: string;

  // ── Footer Overrides ──
  footerBackground?: string;
  footerTextColor?: string;

  // ── Button Palette ──
  buttonPrimaryBg?: string;
  buttonPrimaryText?: string;
  buttonSecondaryBg?: string;
  buttonSecondaryText?: string;

  // ── Overlay/Modal ──
  overlayColor?: string;
  overlayOpacity?: string;
}
