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
import { ThemeAdapter, resolveSettingsWithDefaults } from '@churchos/frontend-contracts';
import { christoTheme, resolveChristoTokens, applyChristoCssVariables } from './themes/christo';
import { nextChurchTheme, resolveNextChurchTokens, applyNextChurchCssVariables } from './themes/next-church';

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
  const isDraftMode = queryParams.get('draft') === 'true';

  const baseSettings = (isDraftMode && siteContext?.theme.draftSettings)
    ? siteContext.theme.draftSettings
    : (siteContext?.theme.settings || {});

  const isChristo = siteContext ? (themeParam === 'christo' || siteContext.theme.name?.toLowerCase().includes('christo')) : false;
  const isNextChurch = siteContext ? (!isChristo) : false;

  const themeSettings = siteContext ? {
    ...baseSettings,
    accentPreset: queryParams.get('accentPreset') || baseSettings?.accentPreset || 'orange-flame',
    colorMode: queryParams.get('colorMode') || baseSettings?.colorMode || 'light',
    edgeStyle: queryParams.get('edgeStyle') || baseSettings?.edgeStyle || 'rounded',
    buttonShape: queryParams.get('buttonShape') || baseSettings?.buttonShape || 'rounded',
    cardShape: queryParams.get('cardShape') || baseSettings?.cardShape || 'rounded',
    imageShape: queryParams.get('imageShape') || baseSettings?.imageShape || 'rounded',
    formShape: queryParams.get('formShape') || baseSettings?.formShape || 'rounded',
    shadowStyle: queryParams.get('shadowStyle') || baseSettings?.shadowStyle || 'soft',
    gradientIntensity: queryParams.get('gradientIntensity') || baseSettings?.gradientIntensity || 'medium',
    blobIntensity: queryParams.get('blobIntensity') || baseSettings?.blobIntensity || 'medium',
  } : {};

  const isPreviewMode = queryParams.get('preview') === 'true' || isDraftMode;

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (isPreviewMode) {
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex, nofollow');
    } else {
      if (meta) {
        meta.setAttribute('content', 'index, follow');
      }
    }
  }, [isPreviewMode]);

  useEffect(() => {
    if (isChristo && themeSettings) {
      const tokens = resolveChristoTokens(themeSettings);
      applyChristoCssVariables(tokens);
      document.body.classList.add('christo-theme-active');
      document.body.classList.remove('next-church-theme-active');
    } else if (isNextChurch && themeSettings) {
      const tokens = resolveNextChurchTokens(themeSettings);
      applyNextChurchCssVariables(tokens);
      document.body.classList.add('next-church-theme-active');
      document.body.classList.remove('christo-theme-active');
    } else {
      document.body.classList.remove('christo-theme-active');
      document.body.classList.remove('next-church-theme-active');
    }
  }, [isChristo, isNextChurch, themeSettings]);

  if (loading) {
    return React.createElement(DefaultLoadingState);
  }

  if (error || !siteContext) {
    return React.createElement(DefaultErrorState, { message: error || 'Failed to initialize site context' });
  }

  if (siteContext.tenant.status === 'suspended') {
    return React.createElement(DefaultSuspendedPage);
  }

  const activeTheme: ThemeAdapter = isChristo ? christoTheme : nextChurchTheme;

  const contextValue: any = {
    tenant: siteContext.tenant,
    preferredLanguage: 'en',
    isPreviewMode: isPreviewMode,
    activeTheme,
    moduleEntitlements: siteContext.moduleEntitlements,
    themeSettings,
    appearanceSettings: siteContext ? resolveSettingsWithDefaults(baseSettings) : undefined,
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
