import type { NavigationData, NavItem } from '../../../types';
import { HEADER_BLUEPRINT_NAV, RAIL_BLUEPRINT_PATHS } from './surfaceCatalog';

function normalizePath(url: string): string {
  const clean = url.split(/[?#]/)[0].replace(/\.html$/i, '').replace(/\/+$/, '');
  if (!clean || clean === '/home') return '/';
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export function buildEcclesiaHeaderNavigation(source: NavigationData | null): NavigationData {
  const byPath = new Map<string, NavItem>();

  for (const item of HEADER_BLUEPRINT_NAV) {
    byPath.set(normalizePath(item.url), item);
  }

  for (const item of source?.items || []) {
    const path = normalizePath(item.url);
    if (RAIL_BLUEPRINT_PATHS.has(path)) continue;
    if (path === '/sermons') continue;
    if (!byPath.has(path)) {
      byPath.set(path, { ...item, url: path });
    }
  }

  return {
    id: source?.id || 'ecclesia-blueprint-header',
    items: Array.from(byPath.values()),
  };
}

export function isRailNavigationPath(url: string): boolean {
  return RAIL_BLUEPRINT_PATHS.has(normalizePath(url));
}
