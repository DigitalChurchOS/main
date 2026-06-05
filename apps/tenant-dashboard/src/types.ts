export type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface ResponsiveStyles {
  desktop: Record<string, string>;
  laptop?: Record<string, string>;
  tablet?: Record<string, string>;
  mobile?: Record<string, string>;
}

export interface ElementSchema {
  id: string;
  type: string;
  props: Record<string, any>;
  styles: ResponsiveStyles;
  children: ElementSchema[];
}

export interface HistoryState {
  elements: ElementSchema[];
  selectedElementId: string | null;
}
