// src/services/pluginExtensionsEngine/moduleService.ts
import {
  installPlugin,
  uninstallPlugin,
  updatePluginSettings,
  grantPluginPermissions,
  verifyPluginAccess,
  dispatchPluginWebhooks,
} from '../../services/plugins';

/**
 * High‑level service for the Plugin & Extensions Engine module.
 * Mirrors the patterns used in other service files (e.g., cms.ts) and
 * delegates core logic to the shared plugins service.
 */
export const pluginEngineService = {
  /** Install a plugin for a tenant after entitlement checks */
  async install(tenantId: string, pluginId: string) {
    // Additional validation or logging can be inserted here
    return await installPlugin(tenantId, pluginId);
  },

  /** Uninstall a plugin and clean up related data */
  async uninstall(tenantId: string, pluginId: string) {
    return await uninstallPlugin(tenantId, pluginId);
  },

  /** Update plugin configuration settings */
  async updateSettings(tenantId: string, pluginId: string, settings: any) {
    return await updatePluginSettings(tenantId, pluginId, settings);
  },

  /** Grant permission scopes to a plugin */
  async grantPermissions(tenantId: string, pluginId: string, permissions: string[]) {
    return await grantPluginPermissions(tenantId, pluginId, permissions);
  },

  /** Verify sandbox access for a plugin */
  async verifyAccess(tenantId: string, pluginId: string, permission: string) {
    return await verifyPluginAccess(tenantId, pluginId, permission);
  },

  /** Dispatch an event to all registered webhooks for active plugins */
  async dispatchEvent(tenantId: string, eventTrigger: string, payload: any) {
    await dispatchPluginWebhooks(tenantId, eventTrigger, payload);
  },
};

export type PluginEngineService = typeof pluginEngineService;
