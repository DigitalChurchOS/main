import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routeFromHref } from '../../routing';
import type { ModuleEntitlement, ThemeSettings } from '../../types';
import { isUrlEntitled } from '../../entitlements';
import { httpRequest } from '../../http';
import { useEcclesia, EcclesiaContextValue } from './EcclesiaContext';

const ASSET_BASE = '/themes/ecclesia';
const LUCIDE_CDN = 'https://unpkg.com/lucide@latest';

type StaticScript = {
  src?: string;
  code?: string;
};

type StaticPayload = {
  html: string;
  title: string;
  bodyClassNames: string[];
  bodyAttributes: Record<string, string>;
  headLinks: Array<{ href: string; rel: string; media?: string; crossOrigin?: string }>;
  headStyles: Array<{ id?: string; css: string }>;
  scripts: StaticScript[];
  needsLucide: boolean;
  headerActionsHtml: string;
};

interface Props {
  html: string;
  themeSettings?: ThemeSettings;
  enableModuleRails?: boolean;
  moduleEntitlements?: ModuleEntitlement[];
  isShellStatic?: boolean;
}

declare global {
  interface Window {
    navigateToPage?: (url: string) => void;
    lucide?: { createIcons?: () => void };
  }
}

const RAIL_ITEMS = [
  { label: 'Media', path: '/media', icon: 'tv' },
  { label: 'Livestream', path: '/livestream', icon: 'video' },
  { label: 'Podcast', path: '/podcast', icon: 'mic' },
  { label: 'Articles', path: '/blog', icon: 'newspaper' },
  { label: 'Services', path: '/services', icon: 'calendar' },
  { label: 'Library', path: '/library', icon: 'book-open' },
  { label: 'LMS', path: '/courses', icon: 'graduation-cap' },
  { label: 'Worship', path: '/worship', icon: 'music' },
  { label: 'Account', path: '/login', icon: 'user-circle' },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRailHtml(pathname: string, entitlements?: ModuleEntitlement[]): string {
  const items = RAIL_ITEMS.filter((item) => isUrlEntitled(item.path, entitlements));
  if (items.length === 0) return '';

  const links = items.map((item) => {
    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return `<a class="rail-item${isActive ? ' active' : ''}" href="${escapeHtml(item.path)}" title="${escapeHtml(item.label)}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  return `<nav class="rail-nav">${links}</nav>`;
}

function renderMobileTabHtml(pathname: string, entitlements?: ModuleEntitlement[]): string {
  const items = RAIL_ITEMS
    .filter((item) => isUrlEntitled(item.path, entitlements));
  if (items.length === 0) return '';

  return items.map((item) => {
    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return `<a class="mobile-tab-item${isActive ? ' active' : ''}" href="${escapeHtml(item.path)}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');
}

function renderMobileDrawerHtml(ecContext: EcclesiaContextValue): string {
  const { navigation, moduleEntitlements } = ecContext;
  const items = (navigation?.items || []).filter((item) => isUrlEntitled(item.url, moduleEntitlements));
  const showLiveAction = isUrlEntitled('/livestream', moduleEntitlements);
  const showGivingAction = isUrlEntitled('/giving', moduleEntitlements);

  const navIcons: Record<string, string> = {
    '/': 'home',
    '/home': 'home',
    '/about': 'info',
    '/sermons': 'play-square',
    '/events': 'calendar-days',
    '/ministries': 'users-round',
    '/prayer': 'heart-handshake',
    '/contact': 'mail',
    '/login': 'user-circle',
    '/account': 'user-circle',
    '/media': 'tv',
    '/livestream': 'video',
    '/podcast': 'mic',
    '/blog': 'newspaper',
    '/services': 'calendar',
    '/library': 'book-open',
    '/courses': 'graduation-cap',
    '/worship': 'music',
  };

  const closeRow = `
    <div class="drawer-close-row">
      <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
        <i data-lucide="x"></i>
      </button>
    </div>
  `;

  const links = items.map((item) => {
    const url = item.url === '/home' ? '/' : item.url;
    const icon = navIcons[url] || navIcons[item.url] || 'link';
    return `<a class="pjax-link" href="${escapeHtml(url)}"><i data-lucide="${icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  const navHtml = `<nav class="drawer-nav">${links}</nav>`;

  let actionsHtml = '';
  if (showLiveAction || showGivingAction) {
    let liveButton = '';
    if (showLiveAction) {
      liveButton = `<a href="/livestream" class="btn btn-light btn-full pjax-link"><i data-lucide="radio"></i> Watch Live</a>`;
    }
    let giveButton = '';
    if (showGivingAction) {
      giveButton = `<a href="/giving" class="btn btn-primary btn-full pjax-link"><i data-lucide="hand-coins"></i> Give</a>`;
    }
    actionsHtml = `<div class="drawer-actions">${liveButton}${giveButton}</div>`;
  }

  return `${closeRow}${navHtml}${actionsHtml}`;
}

function renderDefaultMobileDrawerHtml(): string {
  const items = [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Account', url: '/login' },
    { label: 'Media', url: '/media' },
    { label: 'Livestream', url: '/livestream' },
    { label: 'Podcast', url: '/podcast' },
    { label: 'Articles', url: '/blog' },
    { label: 'Services', url: '/services' },
    { label: 'Library', url: '/library' },
    { label: 'LMS', url: '/courses' },
    { label: 'Worship', url: '/worship' },
  ];

  const closeRow = `
    <div class="drawer-close-row">
      <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
        <i data-lucide="x"></i>
      </button>
    </div>
  `;

  const links = items.map((item) => {
    const navIcons: Record<string, string> = {
      '/': 'home',
      '/about': 'info',
      '/contact': 'mail',
      '/login': 'user-circle',
      '/media': 'tv',
      '/livestream': 'video',
      '/podcast': 'mic',
      '/blog': 'newspaper',
      '/services': 'calendar',
      '/library': 'book-open',
      '/courses': 'graduation-cap',
      '/worship': 'music',
    };
    const icon = navIcons[item.url] || 'link';
    return `<a class="pjax-link" href="${escapeHtml(item.url)}"><i data-lucide="${icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  const navHtml = `<nav class="drawer-nav">${links}</nav>`;
  const actionsHtml = `
    <div class="drawer-actions">
      <a href="/livestream" class="btn btn-light btn-full pjax-link"><i data-lucide="radio"></i> Watch Live</a>
      <a href="/giving" class="btn btn-primary btn-full pjax-link"><i data-lucide="hand-coins"></i> Give</a>
    </div>
  `;

  return `${closeRow}${navHtml}${actionsHtml}`;
}


function splitUrlSuffix(value: string) {
  const match = value.match(/^([^?#]*)([?#].*)?$/);
  return { path: match?.[1] || value, suffix: match?.[2] || '' };
}

function rewriteAssetUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^(https?:|data:|blob:|mailto:|tel:|#|\/)/i.test(trimmed)) return value;

  const { path, suffix } = splitUrlSuffix(trimmed.replace(/^\.\//, ''));
  if (path.startsWith('assets/')) {
    return `${ASSET_BASE}/${path}${suffix}`;
  }

  return value;
}

function rewriteInlineUrls(value: string): string {
  return value.replace(/url\((['"]?)(?!https?:|data:|blob:|\/|#)([^'")]+)\1\)/gi, (_match, quote, rawUrl) => {
    return `url(${quote}${rewriteAssetUrl(rawUrl)}${quote})`;
  });
}

function renderFooterHtml(ecContext: EcclesiaContextValue): string {
  const { tenant, footer, globalContent } = ecContext;
  const churchName = globalContent?.churchIdentity?.churchName || tenant.name;
  const description = globalContent?.churchIdentity?.description || '';
  const serviceTimes = globalContent?.services?.serviceTimes || [];
  const socialLinks = footer?.socialLinks || [];
  const secondaryLinks = footer?.secondaryLinks || [];
  const copyright = footer?.copyrightText || `© ${new Date().getFullYear()} ${churchName}. All rights reserved.`;

  let socialsHtml = '';
  if (socialLinks.length > 0) {
    socialsHtml = `<div class="socials">` + socialLinks.map((link) => {
      const iconName = link.name.toLowerCase();
      return `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer"><i data-lucide="${escapeHtml(iconName)}"></i></a>`;
    }).join('') + `</div>`;
  }

  const col1Html = `
    <div>
      <a href="/" class="brand" style="color: white">
        <span class="brand-mark"><i data-lucide="church"></i></span>
        <span>${escapeHtml(churchName)}</span>
      </a>
      ${description ? `<p style="margin-top: 18px; max-width: 340px">${escapeHtml(description)}</p>` : ''}
      ${socialsHtml}
    </div>
  `;

  const col2Html = `
    <div>
      <h4>Explore</h4>
      <a href="/about">About</a>
      <a href="/sermons">Sermons</a>
      <a href="/events">Events</a>
      <a href="/ministries">Ministries</a>
    </div>
  `;

  let secondaryLinksHtml = '';
  if (secondaryLinks.length > 0) {
    secondaryLinksHtml = secondaryLinks.map((link) => {
      return `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`;
    }).join('');
  } else {
    secondaryLinksHtml = `
      <a href="/contact">Plan a Visit</a>
      <a href="/prayer">Prayer Request</a>
      <a href="/ministries">Join a Group</a>
      <a href="/contact">Volunteer</a>
    `;
  }
  const col3Html = `
    <div>
      <h4>Connect</h4>
      ${secondaryLinksHtml}
    </div>
  `;

  let serviceTimesHtml = '';
  if (serviceTimes.length > 0) {
    serviceTimesHtml = serviceTimes.map((s) => {
      return `<p>${escapeHtml(s.label)}<br />${escapeHtml(s.time)}</p>`;
    }).join('');
  } else {
    serviceTimesHtml = `<p>Sunday Worship<br />9:30 AM</p>`;
  }
  const col4Html = `
    <div>
      <h4>Service Times</h4>
      ${serviceTimesHtml}
    </div>
  `;

  return `
    <div class="footer-inner">
      <div class="footer-grid">
        ${col1Html}
        ${col2Html}
        ${col3Html}
        ${col4Html}
      </div>
      <div class="footer-bottom">
        <span>${copyright}</span>
        <span>Ecclesia Theme · Digital Church OS</span>
      </div>
    </div>
  `;
}

function buildStaticPayload(
  html: string,
  options: {
    enableModuleRails: boolean;
    pathname: string;
    moduleEntitlements?: ModuleEntitlement[];
    ecContext?: EcclesiaContextValue | null;
    isShellStatic?: boolean;
  }
): StaticPayload {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Strip any existing mobile drawers from the parsed document to avoid duplicates
  doc.querySelectorAll('.mobile-drawer, #mobileDrawer, .drawer, #drawer').forEach((el) => el.remove());

  // Extract header actions before we strip/process elements
  const headerActionsEl = doc.querySelector('.header-actions');
  let headerActionsHtml = '';
  if (headerActionsEl) {
    const cloned = headerActionsEl.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('#menuBtn, .mobile-menu-btn').forEach(btn => btn.remove());
    headerActionsHtml = cloned.innerHTML;
  }

  const scripts: StaticScript[] = [];
  const headLinks: StaticPayload['headLinks'] = [];
  const headStyles: Array<{ id?: string; css: string }> = [];
  const railHtml = options.enableModuleRails ? renderRailHtml(options.pathname, options.moduleEntitlements) : '';
  const mobileTabHtml = options.enableModuleRails ? renderMobileTabHtml(options.pathname, options.moduleEntitlements) : '';

  doc.head.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]').forEach((link) => {
    const rawHref = link.getAttribute('href') || '';
    const href = rewriteAssetUrl(rawHref);

    // Skip core theme stylesheets when rendering inside the dynamic shell wrapper
    // (where these sheets are already loaded globally) to avoid overriding customizer style tags.
    if (options.isShellStatic) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (
        cleanHref.startsWith('/themes/ecclesia/assets/') ||
        cleanHref.startsWith('assets/') ||
        cleanHref.endsWith('/assets/styles.css')
      ) {
        return;
      }
    }

    headLinks.push({
      href,
      rel: link.getAttribute('rel') || 'stylesheet',
      media: link.getAttribute('media') || undefined,
      crossOrigin: link.getAttribute('crossorigin') || undefined,
    });
  });

  doc.head.querySelectorAll('style').forEach((style) => {
    if (style.textContent?.trim()) {
      headStyles.push({
        id: style.id || undefined,
        css: rewriteInlineUrls(style.textContent),
      });
    }
  });

  doc.querySelectorAll('script').forEach((script) => {
    const src = script.getAttribute('src');
    if (src) {
      scripts.push({ src: rewriteAssetUrl(src) });
    } else if (script.textContent?.trim()) {
      scripts.push({ code: script.textContent });
    }
    script.remove();
  });

  doc.querySelectorAll<HTMLElement>('[src]').forEach((element) => {
    const src = element.getAttribute('src');
    if (src) element.setAttribute('src', rewriteAssetUrl(src));
  });

  doc.querySelectorAll<HTMLElement>('[href]').forEach((element) => {
    const href = element.getAttribute('href');
    if (href && /^(?:\.\/)?assets\//i.test(href)) {
      element.setAttribute('href', rewriteAssetUrl(href));
    }
  });

  doc.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    const style = element.getAttribute('style');
    if (style) element.setAttribute('style', rewriteInlineUrls(style));
  });

  const stage = doc.createElement('div');
  stage.className = 'static-html-stage';

  if (options.isShellStatic) {
    let mainContentEl = doc.getElementById('content-outlet') || doc.querySelector('main');
    const contentDiv = doc.createElement('div');
    contentDiv.className = 'template-main-content';

    if (mainContentEl) {
      const mainClone = mainContentEl.cloneNode(true) as HTMLElement;
      Array.from(mainClone.attributes).forEach(attr => {
        if (attr.name !== 'id') {
          contentDiv.setAttribute(attr.name, attr.value);
        }
      });
      while (mainClone.firstChild) {
        contentDiv.appendChild(mainClone.firstChild);
      }
    } else {
      Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (
            el.matches('header, .header, footer, .footer, .top-notice, .mobile-drawer, #mobileDrawer, .mobile-tab-rail, aside.left-rail')
          ) {
            return;
          }
        }
        contentDiv.appendChild(node.cloneNode(true));
      });
    }
    stage.appendChild(contentDiv);
  } else {
    const bodyChildren = Array.from(doc.body.childNodes);
    const hasShellWrapper = bodyChildren.some(
      (node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains('shell-wrapper')
    );

    if (hasShellWrapper) {
      bodyChildren.forEach((node) => stage.appendChild(node));

      const shellWrapper = stage.querySelector('.shell-wrapper');
      if (shellWrapper && options.ecContext) {
        shellWrapper.querySelectorAll('footer, .footer').forEach((f) => f.remove());
        const footerHtml = renderFooterHtml(options.ecContext);
        const footer = doc.createElement('footer');
        footer.className = 'footer';
        footer.innerHTML = footerHtml;

        const themeSettings = options.ecContext.themeSettings || {};
        footer.setAttribute('data-footer-style', themeSettings.footerStyle || themeSettings.footer?.style || 'classic');
        footer.setAttribute('data-footer-widgets', themeSettings.footerWidgets === 'hidden' ? 'hidden' : 'shown');
        footer.setAttribute('data-footer-widget-layout', themeSettings.footerWidgetLayout || 'feature');
        footer.setAttribute('data-footer-bottom', themeSettings.footerBottom || 'split');
        footer.setAttribute('data-footer-legal', themeSettings.footerLegal === 'hidden' ? 'hidden' : 'shown');

        shellWrapper.appendChild(footer);
      }

      if (options.enableModuleRails) {
        const shellBody = stage.querySelector('.main-shell-body');
        if (shellBody) {
          let rail = shellBody.querySelector<HTMLElement>(':scope > .left-rail');
          if (!rail) {
            rail = doc.createElement('aside');
            rail.className = 'left-rail';
            shellBody.insertBefore(rail, shellBody.firstChild);
          }
          rail.innerHTML = railHtml;
        }

        if (shellWrapper) {
          let mobileTabRail = stage.querySelector<HTMLElement>(':scope > .mobile-tab-rail') || stage.querySelector<HTMLElement>('.mobile-tab-rail');
          if (!mobileTabRail) {
            mobileTabRail = doc.createElement('div');
            mobileTabRail.className = 'mobile-tab-rail';
            stage.appendChild(mobileTabRail);
          } else if (mobileTabRail.parentNode !== stage) {
            stage.appendChild(mobileTabRail);
          }
          mobileTabRail.innerHTML = mobileTabHtml;
        }
      }
    } else {
      const shell = doc.createElement('div');
      shell.className = 'shell-wrapper static-shell-wrapper';
      const mainShellBody = doc.createElement('div');
      mainShellBody.className = 'main-shell-body';
      const rail = doc.createElement('aside');
      rail.className = 'left-rail';
      rail.innerHTML = railHtml;
      const contentOutlet = doc.createElement('div');
      contentOutlet.className = 'content-wrap';
      contentOutlet.id = 'content-outlet';
      const mobileTabRail = doc.createElement('div');
      mobileTabRail.className = 'mobile-tab-rail';
      mobileTabRail.innerHTML = mobileTabHtml;
      const drawers: Node[] = [];
      const footers: Node[] = [];

      bodyChildren.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('.mobile-drawer, #mobileDrawer')
        ) {
          drawers.push(node);
          return;
        }

        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('footer, .footer')
        ) {
          footers.push(node);
          return;
        }

        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('header, .header, .top-notice, .top')
        ) {
          shell.appendChild(node);
          return;
        }

        contentOutlet.appendChild(node);
      });

      mainShellBody.appendChild(rail);
      mainShellBody.appendChild(contentOutlet);
      stage.appendChild(shell);
      shell.appendChild(mainShellBody);

      if (options.ecContext) {
        const footerHtml = renderFooterHtml(options.ecContext);
        const footer = doc.createElement('footer');
        footer.className = 'footer';
        footer.innerHTML = footerHtml;

        const themeSettings = options.ecContext.themeSettings || {};
        footer.setAttribute('data-footer-style', themeSettings.footerStyle || themeSettings.footer?.style || 'classic');
        footer.setAttribute('data-footer-widgets', themeSettings.footerWidgets === 'hidden' ? 'hidden' : 'shown');
        footer.setAttribute('data-footer-widget-layout', themeSettings.footerWidgetLayout || 'feature');
        footer.setAttribute('data-footer-bottom', themeSettings.footerBottom || 'split');
        footer.setAttribute('data-footer-legal', themeSettings.footerLegal === 'hidden' ? 'hidden' : 'shown');

        shell.appendChild(footer);
      } else {
        footers.forEach((footer) => shell.appendChild(footer));
      }

      stage.appendChild(mobileTabRail);

      drawers.forEach((drawer) => {
        if (drawer.nodeType === Node.ELEMENT_NODE) {
          const element = drawer as Element;
          element.setAttribute('aria-hidden', 'true');
        }
        stage.appendChild(drawer);
      });
    }

    // Inject dynamic canonical mobile drawer
    const drawerElement = doc.createElement('aside');
    drawerElement.className = 'mobile-drawer';
    drawerElement.id = 'mobileDrawer';
    drawerElement.setAttribute('aria-hidden', 'true');
    if (options.ecContext) {
      drawerElement.innerHTML = renderMobileDrawerHtml(options.ecContext);
    } else {
      drawerElement.innerHTML = renderDefaultMobileDrawerHtml();
    }
    stage.appendChild(drawerElement);
  }

  return {
    html: stage.innerHTML,
    title: doc.title,
    bodyClassNames: (doc.body.getAttribute('class') || '').split(/\s+/).filter((className) => className && className !== 'drawer-open'),
    bodyAttributes: Array.from(doc.body.attributes).reduce<Record<string, string>>((attrs, attr) => {
      if (attr.name !== 'class') attrs[attr.name] = attr.value;
      return attrs;
    }, {}),
    headLinks,
    headStyles,
    scripts,
    needsLucide: Boolean(stage.querySelector('[data-lucide]')),
    headerActionsHtml,
  };
}

function bindStaticDrawer(root: HTMLElement): () => void {
  const drawer = root.querySelector<HTMLElement>('#mobileDrawer, .mobile-drawer');
  if (!drawer) return () => undefined;

  const menuButtons = Array.from(root.querySelectorAll<HTMLElement>('#menuBtn, .mobile-menu-btn, [aria-controls="mobileDrawer"]'));
  const closeButtons = Array.from(root.querySelectorAll<HTMLElement>('#closeDrawer, .drawer-close'));
  const cleanups: Array<() => void> = [];

  const setOpen = (open: boolean) => {
    document.body.classList.toggle('drawer-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    menuButtons.forEach((button) => button.setAttribute('aria-expanded', String(open)));
  };

  const addListener = <K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ) => {
    element.addEventListener(type, listener as EventListener);
    cleanups.push(() => element.removeEventListener(type, listener as EventListener));
  };

  menuButtons.forEach((button) => {
    addListener(button, 'click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    });
  });

  closeButtons.forEach((button) => {
    addListener(button, 'click', (event) => {
      event.preventDefault();
      setOpen(false);
    });
  });

  const onDrawerClick = (event: Event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  };
  drawer.addEventListener('click', onDrawerClick);
  cleanups.push(() => drawer.removeEventListener('click', onDrawerClick));

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };
  document.addEventListener('keydown', onKeyDown);
  cleanups.push(() => document.removeEventListener('keydown', onKeyDown));

  const onDocumentClick = (event: MouseEvent) => {
    if (!document.body.classList.contains('drawer-open')) return;
    const target = event.target as Node;
    const clickedMenuButton = menuButtons.some((button) => button.contains(target));
    if (!drawer.contains(target) && !clickedMenuButton) setOpen(false);
  };
  document.addEventListener('click', onDocumentClick);
  cleanups.push(() => document.removeEventListener('click', onDocumentClick));

  setOpen(false);

  return () => {
    setOpen(false);
    cleanups.forEach((cleanup) => cleanup());
  };
}

function applyCustomizerAttributes(root: HTMLElement, settings?: ThemeSettings): () => void {
  if (!settings) return () => undefined;

  const targets: Array<{ element: Element; attrs: Record<string, string> }> = [];
  const header = root.querySelector('header, .header');
  const footer = root.querySelector('footer, .footer');

  if (header) {
    targets.push({
      element: header,
      attrs: {
        'data-header-style': settings.headerStyle || settings.header?.style || 'full',
        'data-header-content': settings.headerContentBoxed === false ? 'full' : 'boxed',
        'data-header-look': settings.headerLook || (settings.headerGlass ? 'glass' : 'flat'),
        'data-header-shadow': String(settings.headerShadow ?? true),
        'data-header-shadow-intensity': settings.headerShadowIntensity || 'medium',
        'data-header-shadow-themed': String(!!settings.headerShadowThemed),
        'data-header-solid-themed': String(!!settings.headerSolidThemed),
        'data-header-border': String(!!settings.headerBorder),
        'data-header-border-size': settings.headerBorderSize || 'small',
        'data-header-border-color': settings.headerBorderColor || 'accent',
        'data-header-layout': settings.headerLayout || 'logo-left',
        'data-header-effect': settings.headerEffect || 'static',
        'data-mobile-menu-position': settings.mobileMenuPosition || 'right',
        'data-mobile-hamburger-shape': settings.mobileHamburgerShape || 'circle',
      },
    });
  }

  if (footer) {
    targets.push({
      element: footer,
      attrs: {
        'data-footer-style': settings.footerStyle || settings.footer?.style || 'classic',
        'data-footer-widgets': settings.footerWidgets === 'hidden' ? 'hidden' : 'shown',
        'data-footer-widget-layout': settings.footerWidgetLayout || 'feature',
        'data-footer-bottom': settings.footerBottom || 'split',
        'data-footer-legal': settings.footerLegal === 'hidden' ? 'hidden' : 'shown',
      },
    });
  }

  const previous = targets.map(({ element, attrs }) => ({
    element,
    attrs: Object.fromEntries(Object.keys(attrs).map((name) => [name, element.getAttribute(name)])),
  }));

  targets.forEach(({ element, attrs }) => {
    Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
  });

  return () => {
    previous.forEach(({ element, attrs }) => {
      Object.entries(attrs).forEach(([name, value]) => {
        if (value === null) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, value);
        }
      });
    });
  };
}

function appendInlineScript(code: string, label: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.textContent = `;(function(){\nconst lucide = window.lucide || (window.lucide = { createIcons: function(){} });\n${code}\n})();\n//# sourceURL=${label}`;
  script.dataset.staticHtmlScript = 'true';
  document.body.appendChild(script);
  return script;
}

function loadScriptOnce(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.staticHtmlScript = 'true';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

async function runExternalScript(src: string): Promise<HTMLScriptElement | null> {
  const url = new URL(src, window.location.href);
  if (/app\.js(?:$|[?#])/i.test(url.pathname + url.search)) return null;
  if (/lucide/i.test(url.href)) {
    await loadScriptOnce(url.href);
    return null;
  }

  if (url.origin !== window.location.origin) {
    await loadScriptOnce(url.href);
    return null;
  }

  const response = await httpRequest(url.href, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Failed to fetch ${url.href}`);
  const code = await response.text();
  return appendInlineScript(code, url.href);
}

const StaticHtmlPage: React.FC<Props> = ({
  html,
  themeSettings,
  enableModuleRails = true,
  moduleEntitlements,
  isShellStatic = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  let ecContext: EcclesiaContextValue | null = null;
  try {
    ecContext = useEcclesia();
  } catch (e) {
    // ignore
  }

  const payload = useMemo(
    () => buildStaticPayload(html, {
      enableModuleRails,
      pathname: location.pathname,
      moduleEntitlements,
      ecContext,
      isShellStatic,
    }),
    [enableModuleRails, html, location.pathname, moduleEntitlements, ecContext, isShellStatic]
  );

  useEffect(() => {
    if (isShellStatic && ecContext?.setHeaderCTAs) {
      ecContext.setHeaderCTAs(payload.headerActionsHtml || null);
      return () => {
        ecContext.setHeaderCTAs?.(null);
      };
    }
  }, [isShellStatic, payload.headerActionsHtml, ecContext]);

  useEffect(() => {
    if (payload.title) document.title = payload.title;

    document.body.classList.remove('drawer-open');
    payload.bodyClassNames.forEach((className) => document.body.classList.add(className));
    const previousAttributes = new Map<string, string | null>();
    Object.entries(payload.bodyAttributes).forEach(([name, value]) => {
      previousAttributes.set(name, document.body.getAttribute(name));
      document.body.setAttribute(name, value);
    });
    return () => {
      payload.bodyClassNames.forEach((className) => document.body.classList.remove(className));
      previousAttributes.forEach((value, name) => {
        if (value === null) {
          document.body.removeAttribute(name);
        } else {
          document.body.setAttribute(name, value);
        }
      });
    };
  }, [payload]);

  useEffect(() => {
    const linkElements = payload.headLinks.map((linkDef, index) => {
      const link = document.createElement('link');
      link.rel = linkDef.rel;
      link.href = linkDef.href;
      link.dataset.staticHtmlStylesheet = 'true';
      link.dataset.staticHtmlStylesheetIndex = String(index);
      if (linkDef.media) link.media = linkDef.media;
      if (linkDef.crossOrigin) link.crossOrigin = linkDef.crossOrigin;
      document.head.appendChild(link);
      return link;
    });

    const styleElements = payload.headStyles.map((styleDef, index) => {
      const style = document.createElement('style');
      style.textContent = styleDef.css;
      style.dataset.staticHtmlStyle = 'true';
      style.dataset.staticHtmlStyleIndex = String(index);
      if (styleDef.id) style.id = styleDef.id;
      document.head.appendChild(style);
      return style;
    });

    return () => {
      linkElements.forEach((link) => link.remove());
      styleElements.forEach((style) => style.remove());
    };
  }, [payload]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    const injectedScripts: HTMLScriptElement[] = [];
    const cleanupDrawer = bindStaticDrawer(root);
    const cleanupCustomizerAttributes = applyCustomizerAttributes(root, themeSettings);
    const previousNavigateToPage = window.navigateToPage;

    window.navigateToPage = (url: string) => {
      const route = routeFromHref(url);
      if (route) {
        navigate(route);
      } else {
        window.location.href = url;
      }
    };

    const runScripts = async () => {
      try {
        if (payload.needsLucide && !window.lucide?.createIcons) {
          await loadScriptOnce(LUCIDE_CDN).catch(() => undefined);
        }

        if (!window.lucide?.createIcons) {
          window.lucide = { createIcons: () => undefined };
        }

        for (const script of payload.scripts) {
          if (cancelled) return;
          if (script.src) {
            const injected = await runExternalScript(script.src);
            if (injected) injectedScripts.push(injected);
          } else if (script.code) {
            injectedScripts.push(appendInlineScript(script.code, 'static-html-inline-script'));
          }
        }

        if (!cancelled) window.lucide?.createIcons?.();
      } catch (error) {
        console.warn('Static page script initialization failed:', error);
      }
    };

    window.requestAnimationFrame(() => {
      void runScripts();
    });

    return () => {
      cancelled = true;
      cleanupDrawer();
      cleanupCustomizerAttributes();
      injectedScripts.forEach((script) => script.remove());
      window.navigateToPage = previousNavigateToPage;
    };
  }, [navigate, payload, themeSettings]);

  return <div ref={rootRef} className="static-html-stage" dangerouslySetInnerHTML={{ __html: payload.html }} />;
};

export default StaticHtmlPage;
