/**
 * Universal Theme Shadow Settings
 *
 * Defines the shared elevation/shadow contract.
 * Provides consistent depth levels across all theme components.
 */

export interface ThemeShadowSettings {
  /** Subtle shadow for hover states, small elements (e.g., '0 1px 2px rgba(0,0,0,0.05)') */
  shadowSmall?: string;

  /** Card-level shadow (e.g., '0 4px 6px rgba(0,0,0,0.07)') */
  shadowMedium?: string;

  /** Elevated shadow for modals, dropdowns (e.g., '0 10px 15px rgba(0,0,0,0.1)') */
  shadowLarge?: string;

  /** Explicit no-shadow token (e.g., 'none') */
  shadowNone?: string;
}
