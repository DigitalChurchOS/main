import React from 'react';
import { RenderSlot } from '../../core/render-slot';
import { PluginInjectionRenderer } from '../../plugins';
import { ThemeCSSInjector } from '../../core/theme-css-injector';
import { ThemeAppearanceSettings } from '@churchos/frontend-contracts';

export interface DefaultPublicShellProps {
  announcementData?: any;
  navigationData?: any;
  footerData?: any;
  themeSettings?: ThemeAppearanceSettings;
  children: React.ReactNode;
}

export const DefaultPublicShell: React.FC<DefaultPublicShellProps> = ({
  announcementData,
  navigationData,
  footerData,
  themeSettings,
  children
}) => {
  return React.createElement(
    'div',
    { className: 'min-h-screen flex flex-col bg-slate-50 font-sans' },
    // Theme CSS Variables Injection
    React.createElement(ThemeCSSInjector, { settings: themeSettings }),
    // Top Bar
    React.createElement(RenderSlot, { slotKey: 'layout.announcementBar', contractData: announcementData }),
    // Sticky Header
    React.createElement(RenderSlot, { slotKey: 'layout.header', contractData: navigationData }),
    
    // page.before anchor
    React.createElement(PluginInjectionRenderer, { point: 'page.before' }),
    
    // Core Main Body
    React.createElement(
      'main',
      { className: 'flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' },
      children
    ),
    
    // page.after anchor
    React.createElement(PluginInjectionRenderer, { point: 'page.after' }),
    
    // page.footer.before anchor
    React.createElement(PluginInjectionRenderer, { point: 'page.footer.before' }),
    
    // Footer
    React.createElement(RenderSlot, { slotKey: 'layout.footer', contractData: footerData })
  );
};
