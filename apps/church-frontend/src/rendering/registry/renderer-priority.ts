import React from 'react';
import { ThemeSlotKey, ThemeAdapter } from '@churchos/frontend-contracts';
import { defaultRendererRegistry } from './default-renderer-registry';
import { getFallbackSlotKey } from './fallback-slot-map';

export function resolveSlotComponent(
  slotKey: ThemeSlotKey,
  activeTheme: ThemeAdapter
): React.ComponentType<any> | null {
  // 1. Check whether active theme implements this specific slot directly
  if (activeTheme.supportsSlot(slotKey) && activeTheme.slots[slotKey]) {
    return activeTheme.slots[slotKey];
  }

  // 2. Check whether active theme implements a fallback slot
  const fallbackKey = getFallbackSlotKey(slotKey);
  if (fallbackKey && activeTheme.supportsSlot(fallbackKey) && activeTheme.slots[fallbackKey]) {
    return activeTheme.slots[fallbackKey];
  }
  
  if (fallbackKey && activeTheme.getFallbackSlot) {
    const themeFallbackComponent = activeTheme.getFallbackSlot(slotKey);
    if (themeFallbackComponent) return themeFallbackComponent;
  }

  // 3. Fall back to the Default System Specific Renderer
  if (defaultRendererRegistry[slotKey]) {
    return defaultRendererRegistry[slotKey];
  }

  // 4. Fall back to the Default System Fallback Renderer
  if (fallbackKey && defaultRendererRegistry[fallbackKey]) {
    return defaultRendererRegistry[fallbackKey];
  }

  return null;
}
