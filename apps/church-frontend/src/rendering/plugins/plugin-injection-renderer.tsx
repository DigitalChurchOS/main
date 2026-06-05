import React from 'react';
import {
  PluginInjectionPoint,
  pluginRegistry,
  pluginInjectionRegistry,
  ClientContextContract
} from '@churchos/frontend-contracts';
import { useRendererContext } from '../core/renderer-context';
import { RenderPluginSlot } from './render-plugin-slot';

export interface PluginInjectionRendererProps {
  point: PluginInjectionPoint;
  parentData?: any;
}

export const PluginInjectionRenderer: React.FC<PluginInjectionRendererProps> = ({
  point,
  parentData
}) => {
  const context = useRendererContext();
  const clientContext = context as ClientContextContract & {
    enabledPlugins?: string[];
    pluginSettings?: Record<string, any>;
  };

  if (!clientContext) return null;

  // 1. Get all enabled plugins for the tenant
  const enabledPlugins = pluginRegistry.listEnabledPluginsForTenant(
    clientContext.tenant?.tenantId || '',
    clientContext.enabledPlugins || []
  );

  // 2. Filter plugins that are registered for this injection point
  const pointPlugins = pluginInjectionRegistry.listPluginsForInjectionPoint(
    point,
    enabledPlugins
  );

  if (pointPlugins.length === 0) {
    return null;
  }

  // 3. Render all eligible plugins
  return React.createElement(
    React.Fragment,
    null,
    pointPlugins.map(plugin => {
      // Find plugin specific settings or config
      const pluginSettings = clientContext.pluginSettings?.[plugin.pluginKey] || {};
      const combinedData = {
        ...pluginSettings,
        ...parentData,
        visibility: pluginSettings.visibility || 'public'
      };

      // Determine slot key to use (prefix with plugin key)
      const slotKey = `plugin.${plugin.pluginKey}.${point}` as any;

      return React.createElement(RenderPluginSlot, {
        key: plugin.pluginKey,
        slotKey,
        contractData: combinedData,
        pluginKey: plugin.pluginKey
      });
    })
  );
};
