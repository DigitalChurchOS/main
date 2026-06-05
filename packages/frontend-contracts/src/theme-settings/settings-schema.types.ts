/**
 * Settings Schema Types
 *
 * Defines the schema descriptor for each universal setting field.
 * Used by the dashboard UI to dynamically generate settings forms
 * and by the validation engine to check value constraints.
 */

import { ThemeAppearanceSettingsCategory } from './theme-appearance-settings.types';

/**
 * Input types for settings fields.
 */
export type SettingsFieldType =
  | 'color'
  | 'text'
  | 'number'
  | 'select'
  | 'toggle'
  | 'font'
  | 'css';

/**
 * Schema descriptor for a single settings field.
 * Drives both form generation and validation.
 */
export interface SettingsFieldSchema {
  /** Unique field key within its category (e.g., 'primaryColor') */
  key: string;

  /** Which category this field belongs to */
  category: ThemeAppearanceSettingsCategory;

  /** Human-readable label for the dashboard UI */
  label: string;

  /** Optional description shown below the input */
  description?: string;

  /** Input type determines the dashboard control rendered */
  type: SettingsFieldType;

  /** Default value used when tenant hasn't customized this field */
  defaultValue: string | number | boolean;

  /** Options for 'select' type fields */
  options?: Array<{ value: string; label: string }>;

  /** Minimum value for 'number' type fields */
  min?: number;

  /** Maximum value for 'number' type fields */
  max?: number;

  /** Unit label for 'number' fields (e.g., 'px', 'ms') */
  unit?: string;

  /** Placeholder text for 'text' and 'css' fields */
  placeholder?: string;

  /** Visual grouping label in the dashboard UI */
  group?: string;
}
