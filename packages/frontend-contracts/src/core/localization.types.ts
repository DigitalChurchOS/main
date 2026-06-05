export interface LocalizationEntry {
  key: string;
  defaultText: string;
  category: string;
  translations?: Record<string, string>; // locale -> text mappings
}

export interface LocalizationBundle {
  locale: string;
  entries: Record<string, string>; // key -> translated text
}
