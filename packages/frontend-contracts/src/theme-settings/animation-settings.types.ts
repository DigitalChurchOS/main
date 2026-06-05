/**
 * Universal Theme Animation Settings
 *
 * Defines the shared motion/transition contract.
 * Provides accessible controls for animation behavior.
 */

export interface ThemeAnimationSettings {
  /** Default transition speed (e.g., '200ms', '300ms') */
  transitionDuration?: string;

  /** Easing function (e.g., 'cubic-bezier(0.4, 0, 0.2, 1)', 'ease-in-out') */
  transitionEasing?: string;

  /** Master toggle to disable all animations */
  enableAnimations?: boolean;

  /** Whether to respect prefers-reduced-motion media query */
  reduceMotion?: boolean;
}
