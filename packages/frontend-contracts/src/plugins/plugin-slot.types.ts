export type PluginSlotKey = `plugin.${string}.${string}`;

export interface PluginSlotContract {
  slotKey: PluginSlotKey;
  displayName: string;
  description?: string;
  expectedDataType: string; // Interface or contract name expected by this slot
  fallbackSlotKey?: string;
}
