import React from 'react';
import { ThemeSlotKey, ThemeAdapter } from '@churchos/frontend-contracts';
import { resolveSlotComponent } from '../registry/renderer-priority';

export interface ResolveOptions {
  slotKey: ThemeSlotKey;
  activeTheme: ThemeAdapter;
  fallbackComponent?: React.ComponentType<any>;
}

export function resolveRenderer({
  slotKey,
  activeTheme,
  fallbackComponent
}: ResolveOptions): React.ComponentType<any> | null {
  const component = resolveSlotComponent(slotKey, activeTheme);
  return component || fallbackComponent || null;
}
