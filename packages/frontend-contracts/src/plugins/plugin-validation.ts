import { PluginManifest } from './plugin-manifest.types';
import { allowedInjectionPoints } from './plugin-injection-point.types';

const coreRoutes = [
  '/',
  '/events',
  '/sermons',
  '/giving',
  '/groups',
  '/courses',
  '/prayer',
  '/blog',
  '/store',
  '/live',
  '/members',
  '/search'
];

const validCategories = [
  'communication',
  'giving',
  'media',
  'livestream',
  'prayer',
  'testimony',
  'events',
  'groups',
  'courses',
  'commerce',
  'analytics',
  'seo',
  'localization',
  'forms',
  'automation',
  'integration',
  'member-portal',
  'dashboard',
  'theme-extension',
  'custom'
];

const validStatuses = [
  'installed',
  'enabled',
  'disabled',
  'suspended',
  'incompatible',
  'pending_setup',
  'update_required',
  'deprecated',
  'blocked'
];

export function validatePluginManifest(manifest: PluginManifest): string[] {
  const errors: string[] = [];

  // 1. Core Identification
  if (!manifest.pluginKey) {
    errors.push('Missing pluginKey');
  } else if (typeof manifest.pluginKey !== 'string' || !/^[a-z0-9-]+$/.test(manifest.pluginKey)) {
    errors.push('Invalid pluginKey format (must be lower-case alphanumeric and dashes only)');
  }

  if (!manifest.displayName) {
    errors.push('Missing displayName');
  }

  if (!manifest.version) {
    errors.push('Missing version');
  } else if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
    errors.push('Invalid version format (must be semver)');
  }

  // 2. Category & Status
  if (!manifest.category) {
    errors.push('Missing category');
  } else if (!validCategories.includes(manifest.category)) {
    errors.push(`Invalid category: "${manifest.category}"`);
  }

  if (!manifest.status) {
    errors.push('Missing status');
  } else if (!validStatuses.includes(manifest.status)) {
    errors.push(`Invalid status: "${manifest.status}"`);
  }

  // 3. Injection Points
  if (manifest.injectionPoints) {
    for (const point of manifest.injectionPoints) {
      if (!allowedInjectionPoints.includes(point as any)) {
        errors.push(`Invalid injection point: "${point}"`);
      }
    }
  }

  // 4. Slots Check (Must prefix with plugin.{pluginKey}.)
  if (manifest.themeSlots) {
    const slotKeys = new Set<string>();
    for (const slot of manifest.themeSlots) {
      if (!slot.slotKey) {
        errors.push('Missing slotKey in themeSlots');
        continue;
      }
      if (!slot.slotKey.startsWith(`plugin.${manifest.pluginKey}.`)) {
        errors.push(`Slot key "${slot.slotKey}" must start with prefix "plugin.${manifest.pluginKey}."`);
      }
      if (slotKeys.has(slot.slotKey)) {
        errors.push(`Duplicate theme slot key in manifest: "${slot.slotKey}"`);
      }
      slotKeys.add(slot.slotKey);
    }
  }

  // 5. Routes Conflict Checks
  if (manifest.publicRoutes) {
    for (const route of manifest.publicRoutes) {
      if (!route.path) {
        errors.push('Missing path in route configuration');
        continue;
      }
      
      const normalizedPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
      
      // Exact match or prefix match conflicts with core routes
      const hasConflict = coreRoutes.some(core => {
        if (core === '/') {
          return normalizedPath === '/';
        }
        return normalizedPath === core || normalizedPath.startsWith(`${core}/`);
      });

      if (hasConflict) {
        errors.push(`Public route path "${route.path}" conflicts with core platform route`);
      }
    }
  }

  // 6. Private/Secret settings exposure check
  if (manifest.widgets) {
    for (const widget of manifest.widgets) {
      if (widget.settingsSchema) {
        for (const f of widget.settingsSchema) {
          if (f.type === 'secret') {
            errors.push(`Unsafe secret setting field "${f.name}" exposure inside public widget "${widget.widgetKey}"`);
          }
        }
      }
    }
  }

  return errors;
}
