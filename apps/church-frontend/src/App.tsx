/* ── App Root Entry & Router ────────────────────────── */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import type { SiteContext, ThemeSettings, PageRenderResponse } from './types';
import { fetchSiteContext, fetchPageRender, fetchPreviewPage } from './api';
import { EcclesiaProvider } from './themes/ecclesia/EcclesiaContext';
import EcclesiaLayout from './themes/ecclesia/EcclesiaLayout';
import StaticHtmlPage from './themes/ecclesia/StaticHtmlPage';
import GenericPage from './themes/ecclesia/GenericPage';
import { routeFromHref, slugFromPathname } from './routing';
import { httpRequest } from './http';

// Extract query parameters helper
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    previewToken: params.get('previewToken') || params.get('token') || '',
    preview: params.get('preview') === 'true',
  };
}

function getBlockContent(block: any): string {
  if (block && typeof block.html === 'string') return block.html;
  if (block && typeof block.content === 'string') return block.content;
  const data = block?.data || {};
  return typeof data.content === 'string' ? data.content : '';
}

function isFullHtmlContent(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.startsWith('<!doctype') ||
    normalized.startsWith('<html') ||
    normalized.includes('<body') ||
    (normalized.includes('<header') && normalized.includes('<footer'))
  );
}

// Check if content blocks contain a full HTML document (e.g. from seeded template index.html)
function getFullHtml(blocks?: any[]): string | null {
  if (!blocks || blocks.length === 0) return null;
  const match = blocks.map(getBlockContent).find(isFullHtmlContent);
  return match || null;
}

const OFFLINE_PREFETCH_LIMIT = 80;

function collectOfflineUrls(html: string, slug: string): string[] {
  const urls = new Set<string>([
    '/manifest.json',
    '/api/cms/site-context',
    `/api/cms/render?slug=${encodeURIComponent(slug)}`,
  ]);

  const addUrl = (rawValue: string | null) => {
    const value = rawValue?.trim();
    if (!value || value.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(value)) return;

    try {
      const url = new URL(value, window.location.href);
      if (!/^https?:$/i.test(url.protocol)) return;
      urls.add(url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.href);
    } catch {
      // Ignore malformed theme-authored URLs.
    }
  };

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll<HTMLElement>('[src]').forEach((element) => addUrl(element.getAttribute('src')));
    doc.querySelectorAll<HTMLElement>('[href]').forEach((element) => addUrl(element.getAttribute('href')));
    doc.querySelectorAll<HTMLSourceElement>('[srcset]').forEach((element) => {
      const firstCandidate = element.getAttribute('srcset')?.split(',')[0]?.trim().split(/\s+/)[0] || null;
      addUrl(firstCandidate);
    });
    doc.querySelectorAll<HTMLStyleElement>('style').forEach((style) => {
      const matches = style.textContent?.matchAll(/url\((['"]?)(.*?)\1\)/gi) || [];
      for (const match of matches) addUrl(match[2]);
    });
  } catch {
    // Offline prefetch is opportunistic; rendering should never depend on it.
  }

  return Array.from(urls).slice(0, OFFLINE_PREFETCH_LIMIT);
}

function queueOfflinePrefetch(html: string, slug: string): void {
  if (!('serviceWorker' in navigator)) return;
  const urls = collectOfflineUrls(html, slug);
  const message = { type: 'PREFETCH_URLS', urls };

  navigator.serviceWorker.controller?.postMessage(message);
  navigator.serviceWorker.ready
    .then((registration) => registration.active?.postMessage(message))
    .catch(() => undefined);
}

function isEcclesiaTheme(siteContext: SiteContext): boolean {
  const themeName = siteContext.theme?.name || '';
  const settings = siteContext.theme?.settings || {};
  const themeKey = settings.metadata?.key || settings.metadata?.sourcePackage || '';
  return /ecclesia/i.test(`${themeName} ${themeKey}`);
}

const slugToTemplateMap: Record<string, string> = {
  '': 'index.html',
  'about': 'about.html',
  'sermons': 'sermons.html',
  'events': 'events.html',
  'ministries': 'ministries.html',
  'prayer': 'prayer.html',
  'contact': 'contact.html',
  'login': 'login.html',
  'member-login': 'login.html',
  'members/login': 'login.html',
  'account': 'account.html',
  'profile': 'account.html',
  'my-giving': 'account.html',
  'giving': 'giving.html',
  'partnership': 'giving-partnership.html',
  'livestream': 'livestream-page.html',
  'media': 'media-archive.html',
  'media/sample-message': 'media-single.html',
  'podcast': 'podcast-archive.html',
  'podcast/sample-episode': 'podcast-episode.html',
  'blog': 'blog-archive.html',
  'blog/sample-post': 'blog-single.html',
  'services': 'services-archive.html',
  'services/sample-service': 'service-single.html',
  'library': 'library-archive.html',
  'library/sample-resource': 'resource-single.html',
  'courses': 'courses-archive.html',
  'courses/main': 'course-main.html',
  'courses/lesson': 'lesson-single.html',
  'events/archive': 'events-archive.html',
  'events/sample-event': 'event-single.html',
  'events/register': 'event-register.html',
  'prayer-home': 'prayer-home.html',
  'prayer/wall': 'prayer-wall.html',
  'prayer/room': 'prayer-room.html',
  'testimonies': 'testimony-wall.html',
  'testimonies/sample-story': 'testimony-single.html',
  'testimonies/submit': 'testimony-submit.html',
  'worship': 'worship.html'
};

function getTemplateFileForSlug(slug: string): string | null {
  if (slugToTemplateMap[slug]) {
    return slugToTemplateMap[slug];
  }

  const parts = slug.split('/');
  if (parts.length > 1) {
    const prefix = parts[0];
    const subPath = parts.slice(1).join('/');

    if (prefix === 'blog') {
      return 'blog-single.html';
    }
    if (prefix === 'sermons' || prefix === 'media') {
      return 'media-single.html';
    }
    if (prefix === 'events') {
      if (subPath === 'archive') return 'events-archive.html';
      if (subPath === 'register') return 'event-register.html';
      return 'event-single.html';
    }
    if (prefix === 'podcast') {
      return 'podcast-episode.html';
    }
    if (prefix === 'services') {
      return 'service-single.html';
    }
    if (prefix === 'livestream') {
      return 'livestream-page.html';
    }
    if (prefix === 'library') {
      return 'resource-single.html';
    }
    if (prefix === 'courses') {
      if (subPath === 'main') return 'course-main.html';
      if (subPath === 'lesson') return 'lesson-single.html';
      return 'course-main.html';
    }
    if (prefix === 'account') {
      return 'account.html';
    }
    if (prefix === 'testimonies') {
      if (subPath === 'submit') return 'testimony-submit.html';
      return 'testimony-single.html';
    }
  }

  return null;
}

const SkeletonPage: React.FC = () => (
  <div className="skeleton-page">
    <div className="skeleton-shimmer skeleton-hero"></div>
    <div className="skeleton-shimmer skeleton-title" style={{ marginTop: '24px' }}></div>
    <div className="skeleton-shimmer skeleton-text"></div>
    <div className="skeleton-shimmer skeleton-text"></div>
    <div className="skeleton-shimmer skeleton-text short"></div>
    <div className="skeleton-grid" style={{ marginTop: '32px' }}>
      <div className="skeleton-shimmer skeleton-card"></div>
      <div className="skeleton-shimmer skeleton-card"></div>
      <div className="skeleton-shimmer skeleton-card"></div>
    </div>
  </div>
);

// Sub-component that handles fetching and rendering pages based on current URL path
const PageRenderer: React.FC<{ siteContext: SiteContext; themeSettings: ThemeSettings }> = ({
  siteContext,
  themeSettings,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageRenderResponse['data'] | null>(null);
  const [headerCTAs, setHeaderCTAs] = useState<string | null>(null);

  // Load page data from CMS
  useEffect(() => {
    let active = true;
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const slug = slugFromPathname(location.pathname);

        const { previewToken } = getQueryParams();
        let response: PageRenderResponse;

        if (previewToken) {
          response = await fetchPreviewPage(slug, previewToken);
        } else {
          response = await fetchPageRender(slug);
        }

        let data = response.data;
        const fullHtml = getFullHtml(data?.contentBlocks);
        if (!fullHtml) {
          const sourceFile = typeof data?.sourceFile === 'string' ? data.sourceFile : '';
          const sourceFileName = sourceFile.split(/[?#]/)[0].split('/').filter(Boolean).pop() || '';
          const templateFile = sourceFileName || getTemplateFileForSlug(slug);
          if (templateFile) {
            try {
              const themeFolder = data?.theme?.settings?.metadata?.sourcePackage || 'ecclesia-full-theme';
              const tRes = await httpRequest(`/themes/${themeFolder}/${templateFile}?t=${Date.now()}`);
              if (tRes.ok) {
                const templateHtml = await tRes.text();
                data = {
                  ...data,
                  contentBlocks: [{
                    slotKey: 'raw-html',
                    data: {
                      title: 'Raw HTML',
                      content: templateHtml
                    }
                  }]
                };
              }
            } catch (fetchErr) {
              console.warn(`Failed to fetch static template: /themes/ecclesia/${templateFile}`, fetchErr);
            }
          }
        }

        if (active) {
          setPageData(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to load page content');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPage();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  // Intercept all link clicks inside raw HTML blocks and perform SPA navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const route = routeFromHref(href);
      if (!route) return;

      // Prevent full page reload
      e.preventDefault();
      navigate(route);
    };

    document.addEventListener('click', handleLinkClick);
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [navigate]);

  useEffect(() => {
    const fullHtml = getFullHtml(pageData?.contentBlocks);
    if (fullHtml) queueOfflinePrefetch(fullHtml, slugFromPathname(location.pathname));
  }, [location.pathname, pageData]);

  const contextValue = {
    tenant: siteContext.tenant,
    themeSettings,
    navigation: pageData?.navigation || siteContext.navigation,
    footer: pageData?.footer || siteContext.footer,
    globalContent: pageData?.globalContent || null,
    isPreviewMode: !!getQueryParams().previewToken,
    moduleEntitlements: siteContext.moduleEntitlements,
    headerCTAs,
    setHeaderCTAs,
  };

  if (loading) {
    return (
      <EcclesiaProvider value={contextValue}>
        <EcclesiaLayout useStaticLayout={false}>
          <SkeletonPage />
        </EcclesiaLayout>
      </EcclesiaProvider>
    );
  }

  if (error || !pageData) {
    return (
      <EcclesiaProvider value={contextValue}>
        <EcclesiaLayout useStaticLayout={false}>
          <div className="error-fallback" style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Page Not Found</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {error || "The page you are looking for doesn't exist or hasn't been published."}
            </p>
            <a className="btn btn-primary" href="/">Go Back Home</a>
          </div>
        </EcclesiaLayout>
      </EcclesiaProvider>
    );
  }

  const fullHtml = getFullHtml(pageData.contentBlocks);
  const ecclesiaActive = isEcclesiaTheme(siteContext);

  if (fullHtml && !ecclesiaActive) {
    return (
      <StaticHtmlPage
        html={fullHtml}
        themeSettings={themeSettings}
        enableModuleRails={false}
        moduleEntitlements={siteContext.moduleEntitlements}
      />
    );
  }

  return (
    <EcclesiaProvider value={contextValue}>
      <EcclesiaLayout useStaticLayout={false}>
        {fullHtml ? (
          <StaticHtmlPage
            html={fullHtml}
            themeSettings={themeSettings}
            enableModuleRails
            moduleEntitlements={siteContext.moduleEntitlements}
            isShellStatic
          />
        ) : (
          <GenericPage
            title={pageData.title}
            contentBlocks={pageData.contentBlocks}
          />
        )}
      </EcclesiaLayout>
    </EcclesiaProvider>
  );
};

const App: React.FC = () => {
  const [siteContext, setSiteContext] = useState<SiteContext | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial load of global site context
  useEffect(() => {
    const loadContext = async () => {
      try {
        const response = await fetchSiteContext();
        setSiteContext(response.data);
        // Default to active theme's settings
        setThemeSettings(response.data.theme.settings || {});
      } catch (err: any) {
        setError(err.message || 'Failed to initialize site context');
      } finally {
        setLoading(false);
      }
    };
    loadContext();
  }, []);

  // 2. Listen for theme customizer updates (live updates inside iframe)
  useEffect(() => {
    const handleCustomizerMsg = (event: MessageEvent) => {
      if (event.data && event.data.type === 'theme-settings-update') {
        setThemeSettings(event.data.settings);
      }
    };
    window.addEventListener('message', handleCustomizerMsg);
    return () => {
      window.removeEventListener('message', handleCustomizerMsg);
    };
  }, []);

  if (loading) {
    return (
      <div aria-hidden="true" style={{ minHeight: '100vh', background: 'var(--bg, #ffffff)' }} />
    );
  }

  if (error || !siteContext || !themeSettings) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '16px', fontWeight: 600 }}>Connection Offline</h1>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            We're having trouble connecting to Digital Church OS. Please verify your connection or try again.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>Retry Connection</button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<PageRenderer siteContext={siteContext} themeSettings={themeSettings} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
