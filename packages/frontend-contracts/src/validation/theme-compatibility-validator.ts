import { ThemeAdapter } from '../renderer/theme-adapter';
import { ThemeSlotKey } from '../core/theme-slot.types';
import { listThemeSlots } from '../registry/theme-slot-registry';

export interface ThemeCompatibilityReport {
  themeKey: string;
  displayName: string;
  version: string;
  compatibilityScore: number; // Percentage of slots implemented (0-100)
  implementedSlotsCount: number;
  totalSlotsCount: number;
  implementedSlots: string[];
  fallbackSlots: Array<{
    slotKey: string;
    displayName: string;
    expectedDataType: string;
  }>;
}

/**
 * Checks whether a theme adapter implements the required slots from the registry.
 * Returns a detailed report of implemented slots and missing slots that will
 * fall back to the Default System Renderer.
 */
export function validateThemeCompatibility(adapter: ThemeAdapter): ThemeCompatibilityReport {
  const registeredSlots = listThemeSlots();
  const totalSlotsCount = registeredSlots.length;
  
  const implementedSlots: string[] = [];
  const fallbackSlots: ThemeCompatibilityReport['fallbackSlots'] = [];

  for (const slot of registeredSlots) {
    const isSupported = adapter.supportsSlot(slot.slotKey) && (adapter.slots[slot.slotKey] !== undefined);
    if (isSupported) {
      implementedSlots.push(slot.slotKey);
    } else {
      fallbackSlots.push({
        slotKey: slot.slotKey,
        displayName: slot.displayName,
        expectedDataType: slot.expectedDataType
      });
    }
  }

  const implementedSlotsCount = implementedSlots.length;
  const compatibilityScore = totalSlotsCount > 0 
    ? Math.round((implementedSlotsCount / totalSlotsCount) * 100) 
    : 100;

  return {
    themeKey: adapter.themeKey,
    displayName: adapter.displayName,
    version: adapter.version,
    compatibilityScore,
    implementedSlotsCount,
    totalSlotsCount,
    implementedSlots,
    fallbackSlots
  };
}
