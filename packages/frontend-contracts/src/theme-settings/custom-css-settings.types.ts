/**
 * Universal Theme Custom CSS Settings
 *
 * Defines the contract for tenant-provided custom CSS injection.
 * Includes security rules for sanitization before rendering.
 */

export interface ThemeCustomCSSSettings {
  /** Raw CSS string from tenant dashboard (sanitized before injection) */
  customCSS?: string;

  /** Toggle to enable/disable custom CSS injection */
  customCSSEnabled?: boolean;
}

/**
 * Blocked CSS patterns that are stripped during sanitization.
 * Prevents XSS, data exfiltration, and script execution.
 */
export const CSS_SECURITY_BLOCKED_PATTERNS: RegExp[] = [
  /@import\b/gi,
  /@charset\b/gi,
  /url\s*\(\s*['"]?\s*javascript:/gi,
  /url\s*\(\s*['"]?\s*data:\s*text\/html/gi,
  /expression\s*\(/gi,
  /-moz-binding\s*:/gi,
  /behavior\s*:/gi,
  /<script/gi,
  /<\/style/gi,
  /url\s*\(\s*['"]?\s*vbscript:/gi,
];

/**
 * String patterns for readable error messages when blocked.
 */
export const CSS_SECURITY_BLOCKED_NAMES: string[] = [
  '@import',
  '@charset',
  'url(javascript:)',
  'url(data:text/html)',
  'expression()',
  '-moz-binding',
  'behavior:',
  '<script',
  '</style',
  'url(vbscript:)',
];
