import { PluginManifest, PluginCategory } from './plugin-manifest.types';
import { validatePluginManifest } from './plugin-validation';

export class PluginRegistry {
  private plugins = new Map<string, PluginManifest>();
  private slots = new Set<string>();

  public registerPlugin(manifest: PluginManifest): void {
    const errors = validatePluginManifest(manifest);
    if (errors.length > 0) {
      throw new Error(`Plugin validation failed for "${manifest.pluginKey}": ${errors.join(', ')}`);
    }

    if (this.plugins.has(manifest.pluginKey)) {
      throw new Error(`Duplicate pluginKey registered: "${manifest.pluginKey}"`);
    }

    // Prevent duplicate slots registration across plugins
    if (manifest.themeSlots) {
      for (const slot of manifest.themeSlots) {
        if (this.slots.has(slot.slotKey)) {
          throw new Error(`Duplicate theme slot key registered: "${slot.slotKey}"`);
        }
      }
      for (const slot of manifest.themeSlots) {
        this.slots.add(slot.slotKey);
      }
    }

    this.plugins.set(manifest.pluginKey, manifest);
  }

  public unregisterPlugin(pluginKey: string): void {
    const manifest = this.plugins.get(pluginKey);
    if (!manifest) return;

    if (manifest.themeSlots) {
      for (const slot of manifest.themeSlots) {
        this.slots.delete(slot.slotKey);
      }
    }

    this.plugins.delete(pluginKey);
  }

  public getPlugin(pluginKey: string): PluginManifest | null {
    return this.plugins.get(pluginKey) || null;
  }

  public listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public listEnabledPluginsForTenant(tenantId: string, enabledKeys: string[]): PluginManifest[] {
    return this.listPlugins().filter(plugin => {
      // Must be enabled key and status in manifest must be 'enabled'
      return enabledKeys.includes(plugin.pluginKey) && plugin.status === 'enabled';
    });
  }

  public listPluginsByInjectionPoint(point: string): PluginManifest[] {
    return this.listPlugins().filter(plugin =>
      plugin.injectionPoints && plugin.injectionPoints.includes(point)
    );
  }

  public listPluginsByModule(moduleKey: string): PluginManifest[] {
    return this.listPlugins().filter(plugin =>
      plugin.requiredModules && plugin.requiredModules.includes(moduleKey)
    );
  }

  public listPluginsByCategory(category: PluginCategory): PluginManifest[] {
    return this.listPlugins().filter(plugin => plugin.category === category);
  }

  public pluginExists(pluginKey: string): boolean {
    return this.plugins.has(pluginKey);
  }

  public clear(): void {
    this.plugins.clear();
    this.slots.clear();
  }
}

export const pluginRegistry = new PluginRegistry();
export default pluginRegistry;
