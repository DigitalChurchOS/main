import { ClientContextContract, ThemeAdapter } from '@churchos/frontend-contracts';

export interface RendererContextValue extends ClientContextContract {
  activeTheme: ThemeAdapter;
  moduleEntitlements: string[];
  themeSettings?: Record<string, any>;
  analytics?: {
    track: (eventName: string, payload?: any) => void;
  };
  requestUrl?: string;
  deviceHint?: 'mobile' | 'desktop' | 'tablet';
}
