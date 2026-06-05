import React, { useEffect } from 'react';
import { RenderSlot } from '../../../rendering/core/render-slot';
import { PluginInjectionRenderer } from '../../../rendering/plugins';
import { resolveChristoTokens, applyChristoCssVariables } from '../tokens/apply-christo-tokens';

export interface ChristoPublicShellProps {
  announcementData?: any;
  navigationData?: any;
  footerData?: any;
  children: React.ReactNode;
  context?: any;
}

export const ChristoPublicShell: React.FC<ChristoPublicShellProps> = ({
  announcementData,
  navigationData,
  footerData,
  children,
  context
}) => {
  const themeSettings = context?.themeSettings || {};

  useEffect(() => {
    const tokens = resolveChristoTokens(themeSettings);
    applyChristoCssVariables(tokens);
  }, [themeSettings]);

  return React.createElement(
    'div',
    { className: 'christo-theme-active min-h-screen flex flex-col font-sans' },
    
    // Top Bar
    React.createElement(RenderSlot, {
      slotKey: 'layout.announcementBar',
      contractData: announcementData
    }),
    
    // Sticky Header
    React.createElement(RenderSlot, {
      slotKey: 'layout.header',
      contractData: navigationData
    }),
    
    // page.before anchor
    React.createElement(PluginInjectionRenderer, { point: 'page.before' }),
    
    // Core Main Body
    React.createElement(
      'main',
      { className: 'flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative' },
      // Subtle background blobs for layout glow
      React.createElement('div', { className: 'christo-blob-1' }),
      React.createElement('div', { className: 'christo-blob-2' }),
      
      React.createElement('div', { className: 'relative z-10' }, children)
    ),
    
    // page.after anchor
    React.createElement(PluginInjectionRenderer, { point: 'page.after' }),
    
    // Footer
    React.createElement(RenderSlot, {
      slotKey: 'layout.footer',
      contractData: footerData
    })
  );
};
