import { PluginSlotContract } from './plugin-slot.types';

export class PluginSlotRegistry {
  private slots = new Map<string, PluginSlotContract>();

  public registerPluginSlot(slot: PluginSlotContract): void {
    const errors = this.validatePluginSlot(slot);
    if (errors.length > 0) {
      throw new Error(`Plugin slot validation failed for "${slot.slotKey}": ${errors.join(', ')}`);
    }

    if (this.slots.has(slot.slotKey)) {
      throw new Error(`Duplicate plugin slot key registered: "${slot.slotKey}"`);
    }

    this.slots.set(slot.slotKey, slot);
  }

  public unregisterPluginSlot(slotKey: string): void {
    this.slots.delete(slotKey);
  }

  public getPluginSlot(slotKey: string): PluginSlotContract | null {
    return this.slots.get(slotKey) || null;
  }

  public listPluginSlots(): PluginSlotContract[] {
    return Array.from(this.slots.values());
  }

  public listSlotsByPlugin(pluginKey: string): PluginSlotContract[] {
    const prefix = `plugin.${pluginKey}.`;
    return this.listPluginSlots().filter(slot => slot.slotKey.startsWith(prefix));
  }

  public validatePluginSlot(slot: PluginSlotContract): string[] {
    const errors: string[] = [];

    if (!slot.slotKey) {
      errors.push('Missing slotKey');
    } else if (!slot.slotKey.startsWith('plugin.')) {
      errors.push(`Slot key "${slot.slotKey}" must start with "plugin." prefix`);
    }

    if (!slot.displayName) {
      errors.push('Missing displayName');
    }

    if (!slot.expectedDataType) {
      errors.push('Missing expectedDataType');
    }

    if (slot.fallbackSlotKey) {
      if (!slot.fallbackSlotKey.startsWith('plugin.') && !slot.fallbackSlotKey.includes('.')) {
        errors.push(`Fallback slot key "${slot.fallbackSlotKey}" must be a valid theme slot or plugin slot`);
      }
    }

    return errors;
  }

  public clear(): void {
    this.slots.clear();
  }
}

export const pluginSlotRegistry = new PluginSlotRegistry();
export default pluginSlotRegistry;
