import { ThemeSlotKey } from '../core/theme-slot.types';
import { ThemeAppearanceSettings } from '../theme-settings/theme-appearance-settings.types';

export interface ThemeAdapter {
  themeKey: string;
  displayName: string;
  version: string;
  slots: Partial<Record<ThemeSlotKey, any>>; // Maps theme slots to React component types
  supportsSlot: (slot: ThemeSlotKey) => boolean;
  getFallbackSlot?: (slot: ThemeSlotKey) => any | null;
  /** Resolved universal appearance settings (optional, backward-compatible) */
  appearanceSettings?: ThemeAppearanceSettings;
}
