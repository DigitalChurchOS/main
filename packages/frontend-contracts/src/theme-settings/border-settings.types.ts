/**
 * Universal Theme Border Settings
 *
 * Defines the shared border/radius contract.
 * Controls rounding, border width, and border style across components.
 */

export interface ThemeBorderSettings {
  /** Global border radius token (e.g., '8px', '0', '9999px') */
  borderRadius?: string;

  /** Small radius for inputs, badges (e.g., '4px') */
  borderRadiusSmall?: string;

  /** Large radius for cards, modals (e.g., '16px') */
  borderRadiusLarge?: string;

  /** Default border width (e.g., '1px') */
  borderWidth?: string;

  /** Default border style (e.g., 'solid', 'dashed') */
  borderStyle?: string;
}
