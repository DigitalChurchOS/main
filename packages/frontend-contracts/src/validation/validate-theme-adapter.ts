import { ThemeAdapter } from '../renderer/theme-adapter';
import { ThemeSlotKey } from '../core/theme-slot.types';

const CORE_SLOTS: ThemeSlotKey[] = [
  'layout.header',
  'layout.footer',
  'state.loading',
  'state.error',
  'state.empty'
];

export interface ThemeAdapterValidationResult {
  isValid: boolean;
  missingCoreSlots: ThemeSlotKey[];
  errors: string[];
}

export function validateThemeAdapter(adapter: ThemeAdapter): ThemeAdapterValidationResult {
  const errors: string[] = [];
  const missingCoreSlots: ThemeSlotKey[] = [];

  if (!adapter.themeKey) {
    errors.push('Missing themeKey');
  }
  if (!adapter.displayName) {
    errors.push('Missing displayName');
  }
  if (!adapter.version) {
    errors.push('Missing version');
  }

  CORE_SLOTS.forEach(slot => {
    if (!adapter.supportsSlot(slot) || !adapter.slots[slot]) {
      missingCoreSlots.push(slot);
      errors.push('Missing core theme slot implementation: ' + slot);
    }
  });

  return {
    isValid: errors.length === 0,
    missingCoreSlots,
    errors
  };
}
