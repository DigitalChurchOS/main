/**
 * Universal Theme Spacing Settings
 *
 * Defines the shared spacing/layout measurement contract.
 * Controls the spatial rhythm across all theme components.
 */

export interface ThemeSpacingSettings {
  /** Base spacing multiplier in px (e.g., 4 → 4px grid) */
  spacingUnit?: number;

  /** Max content width (e.g., '1200px', '1440px') */
  containerMaxWidth?: string;

  /** Horizontal page padding (e.g., '1rem', '24px') */
  containerPadding?: string;

  /** Vertical gap between page sections (e.g., '4rem', '64px') */
  sectionSpacing?: string;

  /** Internal card padding (e.g., '1.5rem', '24px') */
  cardPadding?: string;

  /** Gap between grid items (e.g., '1.5rem', '24px') */
  gridGap?: string;
}
