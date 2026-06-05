export type PluginSettingsFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'toggle'
  | 'checkbox'
  | 'radio'
  | 'color'
  | 'image'
  | 'file'
  | 'number'
  | 'url'
  | 'secret'
  | 'json'
  | 'connection'
  | 'webhook'
  | 'permission_map';

export interface PluginSettingsSchemaField {
  name: string;
  displayName: string;
  type: PluginSettingsFieldType;
  description?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  required?: boolean;
}
