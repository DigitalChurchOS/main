/**
 * Universal Theme Typography Settings
 *
 * Defines the shared typography contract that all themes can support.
 * Includes font family declarations, sizing tokens, weight tokens,
 * and font source descriptors for Google Fonts integration.
 */

/** Describes where a font is loaded from */
export type ThemeFontSourceType = 'system' | 'google-fonts' | 'custom-upload';

export interface ThemeFontSource {
  family: string;
  source: ThemeFontSourceType;
  /** URL for google-fonts source (validated against safe list) */
  url?: string;
  /** Font weights to load (e.g., [400, 500, 700]) */
  weights?: number[];
}

export interface ThemeTypographySettings {
  // ── Font Families ──
  fontFamily?: string;
  headingFontFamily?: string;
  monoFontFamily?: string;

  // ── Font Sources (for runtime loading) ──
  bodyFontSource?: ThemeFontSource;
  headingFontSource?: ThemeFontSource;

  // ── Sizing ──
  baseFontSize?: number; // px (e.g., 16)
  baseLineHeight?: number; // unitless (e.g., 1.6)
  headingLineHeight?: number; // unitless (e.g., 1.2)

  // ── Weights ──
  fontWeightNormal?: number; // e.g., 400
  fontWeightMedium?: number; // e.g., 500
  fontWeightBold?: number; // e.g., 700

  // ── Spacing ──
  letterSpacing?: string; // e.g., 'normal', '0.02em'
  headingLetterSpacing?: string; // e.g., '-0.02em'
}

/**
 * Curated safe list of Google Fonts families allowed in theme settings.
 * Prevents arbitrary external font URL injection.
 */
export const SAFE_GOOGLE_FONTS: string[] = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Outfit',
  'Poppins',
  'Raleway',
  'Nunito',
  'Nunito Sans',
  'Source Sans 3',
  'Playfair Display',
  'Merriweather',
  'DM Sans',
  'DM Serif Display',
  'Plus Jakarta Sans',
  'Manrope',
  'Space Grotesk',
  'Sora',
  'Urbanist',
  'Libre Baskerville',
  'Josefin Sans',
  'Quicksand',
  'Rubik',
  'Mulish',
  'Work Sans',
  'Barlow',
  'Oswald',
  'Archivo',
  'Fira Sans',
];
