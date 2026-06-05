export type PluginPermissionAction = 'read' | 'configure' | 'render' | 'manage' | 'install' | 'uninstall';

export type PluginPermission = `plugin.${string}.${PluginPermissionAction}`;

export function buildPluginPermission(pluginKey: string, action: PluginPermissionAction): PluginPermission {
  return `plugin.${pluginKey}.${action}`;
}
