import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { fetchSiteContext } from './data/cms-client';
import { SiteContextResponse } from './data/types';
import { getRouter } from './router';
import {
  RendererProvider,
  DefaultLoadingState,
  DefaultErrorState,
  DefaultSuspendedPage
} from './rendering';
import { ThemeAdapter } from '@churchos/frontend-contracts';
import { christoTheme, resolveChristoTokens, applyChristoCssVariables } from './themes/christo';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [siteContext, setSiteContext] = useState<SiteContextResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchSiteContext()
      .then((res) => {
        setSiteContext(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load site context');
        setLoading(false);
      });
  }, []);

  // Determine active theme and parse live overrides
  const queryParams = new URLSearchParams(window.location.search);
  const themeParam = queryParams.get('theme');
  const isChristo = siteContext ? (themeParam === 'christo' || siteContext.theme.name?.toLowerCase().includes('christo')) : false;

  const themeSettings = siteContext ? {
    ...siteContext.theme.settings,
    accentPreset: queryParams.get('accentPreset') || siteContext.theme.settings?.accentPreset || 'orange-flame',
    colorMode: queryParams.get('colorMode') || siteContext.theme.settings?.colorMode || 'light',
    edgeStyle: queryParams.get('edgeStyle') || siteContext.theme.settings?.edgeStyle || 'rounded',
    buttonShape: queryParams.get('buttonShape') || siteContext.theme.settings?.buttonShape || 'rounded',
    cardShape: queryParams.get('cardShape') || siteContext.theme.settings?.cardShape || 'rounded',
    imageShape: queryParams.get('imageShape') || siteContext.theme.settings?.imageShape || 'rounded',
    formShape: queryParams.get('formShape') || siteContext.theme.settings?.formShape || 'rounded',
    shadowStyle: queryParams.get('shadowStyle') || siteContext.theme.settings?.shadowStyle || 'soft',
    gradientIntensity: queryParams.get('gradientIntensity') || siteContext.theme.settings?.gradientIntensity || 'medium',
    blobIntensity: queryParams.get('blobIntensity') || siteContext.theme.settings?.blobIntensity || 'medium',
  } : {};

  useEffect(() => {
    if (isChristo && themeSettings) {
      const tokens = resolveChristoTokens(themeSettings);
      applyChristoCssVariables(tokens);
      document.body.classList.add('christo-theme-active');
    } else {
      document.body.classList.remove('christo-theme-active');
    }
  }, [isChristo, themeSettings]);

  if (loading) {
    return React.createElement(DefaultLoadingState);
  }

  if (error || !siteContext) {
    return React.createElement(DefaultErrorState, { message: error || 'Failed to initialize site context' });
  }

  if (siteContext.tenant.status === 'suspended') {
    return React.createElement(DefaultSuspendedPage);
  }

  const systemFallbackTheme: ThemeAdapter = {
    themeKey: 'system-fallback',
    displayName: 'System Fallback Theme',
    version: '1.0.0',
    slots: {},
    supportsSlot: () => false
  };

  const activeTheme: ThemeAdapter = isChristo ? christoTheme : systemFallbackTheme;

  const contextValue: any = {
    tenant: siteContext.tenant,
    preferredLanguage: 'en',
    isPreviewMode: window.location.search.includes('preview=true'),
    activeTheme,
    moduleEntitlements: siteContext.moduleEntitlements,
    themeSettings,
    navigation: siteContext.navigation,
    footer: siteContext.footer,
    memberId,
    enabledPlugins: siteContext.enabledPlugins || [],
    pluginSettings: siteContext.pluginSettings || {},
    analytics: {
      track: (eventName: string, payload?: any) => {
        console.log(`[Analytics Track] ${eventName}:`, payload);
      }
    },
    requestUrl: window.location.href,
    deviceHint: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
  };

  const handleSimulateLogin = () => {
    setMemberId('sim-member-123');
  };

  const router = getRouter(handleSimulateLogin);

  return React.createElement(
    RendererProvider,
    {
      value: contextValue,
      children: React.createElement(RouterProvider, { router })
    }
  );
};
