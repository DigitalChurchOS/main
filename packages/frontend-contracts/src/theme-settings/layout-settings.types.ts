/**
 * Universal Theme Layout Settings
 *
 * Defines the shared structural layout contract.
 * Controls high-level component appearance styles.
 */

export type HeaderStyle = 'solid' | 'transparent' | 'gradient';
export type HeaderPosition = 'static' | 'sticky' | 'fixed';
export type FooterStyle = 'minimal' | 'standard' | 'expanded';
export type LogoPosition = 'left' | 'center';
export type NavigationStyle = 'horizontal' | 'hamburger' | 'sidebar';
export type HeroStyle = 'full-width' | 'contained' | 'split';
export type CardStyle = 'flat' | 'elevated' | 'bordered' | 'glassmorphism';

export interface ThemeLayoutSettings {
  /** Header background style */
  headerStyle?: HeaderStyle;

  /** Header positioning behavior */
  headerPosition?: HeaderPosition;

  /** Footer layout complexity */
  footerStyle?: FooterStyle;

  /** Logo alignment in header */
  logoPosition?: LogoPosition;

  /** Navigation menu presentation */
  navigationStyle?: NavigationStyle;

  /** Hero section presentation */
  heroStyle?: HeroStyle;

  /** Card component presentation */
  cardStyle?: CardStyle;
}
