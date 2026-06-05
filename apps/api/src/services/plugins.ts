import prisma from '../lib/prisma';

// Memory log to inspect mock webhook deliveries during test runs
export const dispatchedWebhooksLog: { eventTrigger: string; url: string; payload: any }[] = [];

/**
 * Installs a plugin in the tenant workspace after checking OS compatibility.
 */
export async function installPlugin(tenantId: string, pluginId: string): Promise<any> {
  const definition = await prisma.pluginDefinition.findUnique({
    where: { id: pluginId },
  });

  if (!definition) {
    throw new Error('Plugin definition not found');
  }

  if (!definition.isActive) {
    throw new Error('Plugin is currently disabled on the platform');
  }

  // OS compatibility check (Mock Platform OS version: "1.0.0")
  const PLATFORM_VERSION = '1.0.0';
  if (definition.requiredOsVersion > PLATFORM_VERSION) {
    throw new Error(`Incompatible platform version. Requires: ${definition.requiredOsVersion}`);
  }

  return await prisma.tenantPlugin.upsert({
    where: {
      tenantId_pluginId: { tenantId, pluginId },
    },
    update: {
      status: 'pending',
    },
    create: {
      tenantId,
      pluginId,
      status: 'pending',
      settings: '{}',
      grantedPermissions: '[]',
    },
  });
}

/**
 * Safe uninstallation: drops plugin installation, config, and webhooks.
 */
export async function uninstallPlugin(tenantId: string, pluginId: string): Promise<void> {
  const installed = await prisma.tenantPlugin.findUnique({
    where: {
      tenantId_pluginId: { tenantId, pluginId },
    },
  });

  if (!installed) {
    throw new Error('Plugin is not installed');
  }

  // Purge webhooks linked to this installation
  await prisma.pluginWebhook.deleteMany({
    where: { tenantId, tenantPluginId: installed.id },
  });

  // Drop the installation record
  await prisma.tenantPlugin.delete({
    where: { id: installed.id },
  });
}

/**
 * Update custom configuration settings JSON payload.
 */
export async function updatePluginSettings(
  tenantId: string,
  pluginId: string,
  settings: any
): Promise<any> {
  const installed = await prisma.tenantPlugin.findUnique({
    where: {
      tenantId_pluginId: { tenantId, pluginId },
    },
  });

  if (!installed) {
    throw new Error('Plugin is not installed');
  }

  return await prisma.tenantPlugin.update({
    where: { id: installed.id },
    data: {
      settings: JSON.stringify(settings),
    },
  });
}

/**
 * Grant permission scopes. Enforces that granted permissions are subsets of the requiredPermissions manifest.
 */
export async function grantPluginPermissions(
  tenantId: string,
  pluginId: string,
  permissions: string[]
): Promise<any> {
  const installed = await prisma.tenantPlugin.findUnique({
    where: {
      tenantId_pluginId: { tenantId, pluginId },
    },
    include: { plugin: true },
  });

  if (!installed) {
    throw new Error('Plugin is not installed');
  }

  const required: string[] = JSON.parse(installed.plugin.requiredPermissions);
  const invalid = permissions.filter((p) => !required.includes(p));

  if (invalid.length > 0) {
    throw new Error(`Cannot grant unrequested permissions: ${invalid.join(', ')}`);
  }

  return await prisma.tenantPlugin.update({
    where: { id: installed.id },
    data: {
      grantedPermissions: JSON.stringify(permissions),
      status: 'active', // Mark active once permissions are configured
    },
  });
}

/**
 * Sandbox Access verification: checks if active plugin holds permission scope.
 */
export async function verifyPluginAccess(
  tenantId: string,
  pluginId: string,
  requiredPermission: string
): Promise<boolean> {
  const installed = await prisma.tenantPlugin.findUnique({
    where: {
      tenantId_pluginId: { tenantId, pluginId },
    },
  });

  if (!installed || installed.status !== 'active') {
    return false;
  }

  const granted: string[] = JSON.parse(installed.grantedPermissions);
  return granted.includes(requiredPermission);
}

/**
 * Dispatches event notifications to registered plugin webhooks.
 */
export async function dispatchPluginWebhooks(
  tenantId: string,
  eventTrigger: string,
  payload: any
): Promise<void> {
  const webhooks = await prisma.pluginWebhook.findMany({
    where: {
      tenantId,
      eventTrigger,
      isActive: true,
      plugin: { status: 'active' },
    },
  });

  webhooks.forEach((wh) => {
    console.log(`[PluginWebhook] Dispatching event "${eventTrigger}" to target URL "${wh.targetUrl}"`);
    dispatchedWebhooksLog.push({
      eventTrigger,
      url: wh.targetUrl,
      payload,
    });
  });
}
