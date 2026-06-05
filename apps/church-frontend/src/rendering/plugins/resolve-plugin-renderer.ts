import React from 'react';
import { PluginSlotKey } from '@churchos/frontend-contracts';
import * as Defaults from './default-plugin-renderer';

export interface ResolvePluginOptions {
  slotKey: PluginSlotKey;
  activeTheme?: any;
  fallbackComponent?: React.ComponentType<any>;
}

export function resolvePluginRenderer({
  slotKey,
  activeTheme,
  fallbackComponent
}: ResolvePluginOptions): React.ComponentType<any> {
  // 1. Check if theme has an override for this plugin slot key
  if (activeTheme && activeTheme.slots && activeTheme.slots[slotKey]) {
    return activeTheme.slots[slotKey];
  }

  // 2. Explicit prop fallback component
  if (fallbackComponent) {
    return fallbackComponent;
  }

  // 3. System fallback component mapping based on slotKey suffix
  if (slotKey.endsWith('.widget')) {
    return Defaults.DefaultPluginWidget;
  }
  if (slotKey.endsWith('.panel')) {
    return Defaults.DefaultPluginPanel;
  }
  if (slotKey.endsWith('.card')) {
    return Defaults.DefaultPluginCard;
  }
  if (slotKey.endsWith('.form')) {
    return Defaults.DefaultPluginForm;
  }
  if (slotKey.endsWith('.action') || slotKey.endsWith('.inline')) {
    return Defaults.DefaultPluginInlineAction;
  }

  // Generic fallback widget
  return Defaults.DefaultPluginWidget;
}
