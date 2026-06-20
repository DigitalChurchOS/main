/// <reference lib="webworker" />

import {
  ECCLESIA_THEME_KEY,
  ECCLESIA_THEME_NAME,
  createEcclesiaFooterLinks,
  createEcclesiaDefaultPages,
  createEcclesiaGlobalContent,
  createEcclesiaNavigationItems,
  createEcclesiaThemeSettings,
  getEcclesiaPageTemplates,
  getEcclesiaSectionTemplates,
} from './themes/ecclesia';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiResponse = {
  data?: JsonValue;
  error?: string;
  ok?: boolean;
  status?: string;
  token?: string;
  tenantId?: string;
  tenant?: JsonValue;
  user?: JsonValue;
  website?: JsonValue;
  available?: boolean;
  plan?: JsonValue;
  meta?: JsonValue;
};

type TenantRegistry = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

type Env = {
  CHURCHOS_TENANTS?: TenantRegistry;
};

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-allow-headers':
    'content-type,authorization,x-tenant-id,x-tenant-name,x-tenant-subdomain,x-churchos-onboarding-context',
};

const onboardingSteps = [
  'profile',
  'logo',
  'theme',
  'design',
  'modules',
  'website',
  'domain',
  'giving',
  'invite',
  'complete',
].map((stepKey, index) => ({
  id: `step-${index + 1}`,
  stepKey,
  status: index < 2 ? 'completed' : 'pending',
  metadataJson: '{}',
}));

const platformDomain = 'churched.online';
const defaultTenantValues = {
  plan: 'growth',
  country: 'United States',
  city: 'Online',
};
const reservedSubdomains = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'central',
  'church',
  'developer',
  'docs',
  'help',
  'live',
  'mail',
  'marketplace',
  'onboarding',
  'start',
  'status',
  'support',
  'super-admin',
  'www',
]);

function makeSubdomainHost(subdomain: string) {
  return `${subdomain}.${platformDomain}`;
}

const demoTenant = {
  id: 'demo-church-local',
  name: 'Demo Church',
  subdomain: 'demo',
  subdomainHost: makeSubdomainHost('demo'),
  plan: 'growth',
  country: 'United States',
  city: 'Online',
};

const demoUser = {
  id: 'user-demo-admin',
  name: 'Admin User',
  email: 'admin@demo.church',
  role: 'Owner',
  status: 'active',
};

const demoRoles = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full workspace access',
    permissions: ['*'],
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Operational administration',
    permissions: ['cms.*', 'members.*', 'settings.*'],
  },
];

const demoThemeSettings = createEcclesiaThemeSettings({
  installation: {
    installedForTenantId: demoTenant.id,
    installedAt: '2026-06-18T00:00:00.000Z',
    autoProvisioned: true,
    runtime: 'cloudflare-api-worker',
  },
  marketplace: {
    version: '1.0.0',
    author: 'Church OS',
  },
});

const demoEcclesiaTheme = {
  id: 'theme-ecclesia',
  tenantId: demoTenant.id,
  name: ECCLESIA_THEME_NAME,
  slug: ECCLESIA_THEME_KEY,
  description: 'System default church website theme with full Ecclesia page templates, source assets, and builder-aware styling.',
  settings: JSON.stringify(demoThemeSettings),
  draftSettings: null,
  isCustom: false,
  status: 'active',
  previewUrl: '/themes/ecclesia/index.html',
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
};

const demoWebsite = {
  id: 'website-main',
  tenantId: demoTenant.id,
  themeId: demoEcclesiaTheme.id,
  title: `${demoTenant.name} Website`,
  description: createEcclesiaGlobalContent(demoTenant.name).churchIdentity.description,
  domain: demoTenant.subdomainHost,
  isActive: true,
  isPrimary: true,
  status: 'published',
  theme: demoEcclesiaTheme,
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
};

const demoPages = [
  {
    id: 'page-home',
    tenantId: demoTenant.id,
    websiteId: demoWebsite.id,
    title: 'Home',
    slug: '',
    status: 'published',
    content: '[]',
    draftContent: null,
    isHome: true,
    isPublished: true,
    updatedAt: '2026-06-18T00:00:00.000Z',
  },
];

type TenantPageRecord = {
  id: string;
  tenantId: string;
  websiteId: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  draftContent: string | null;
  isHome: boolean;
  isPublished: boolean;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string | null;
  sourceFile?: string;
  sourceUrl?: string;
  module?: string;
};

type TenantThemeState = {
  settings: Record<string, any>;
  draftSettings: Record<string, any> | null;
  updatedAt: string;
};

const demoMarketplaceAssets = [
  {
    id: 'asset-next-theme',
    name: 'Next Church Theme',
    title: 'Next Church Theme',
    type: 'theme',
    category: 'Website',
    price: 0,
    status: 'published',
    developer: 'ChurchOS',
    rating: 5,
  },
  {
    id: 'asset-giving-plugin',
    name: 'Giving Starter',
    title: 'Giving Starter',
    type: 'plugin',
    category: 'Giving',
    price: 0,
    status: 'published',
    developer: 'ChurchOS',
    rating: 5,
  },
];

function withJson(body: ApiResponse, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {}),
    },
  });
}

async function readBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function getThemeEngineSettings() {
  return {
    tenantId: demoTenant.id,
    moduleKey: 'theme-engine',
    enabled: true,
    billingPlan: 'platform',
    providerMode: 'platform_managed',
    configJson: JSON.stringify({
      sections: [],
      pageTemplates: [],
      defaults: {
        systemTheme: ECCLESIA_THEME_KEY,
        activeThemeId: demoEcclesiaTheme.id,
      },
    }),
  };
}

function getThemeEngineOverview() {
  return {
    moduleKey: 'theme-engine',
    settings: getThemeEngineSettings(),
    activeTheme: ECCLESIA_THEME_NAME,
    installedThemes: 1,
    draftChanges: 0,
    counts: {
      moduleProfiles: 1,
      installedThemes: 1,
      globalThemes: 1,
      websites: 1,
      sectionTemplates: getEcclesiaSectionTemplates().length,
      pageTemplates: getEcclesiaPageTemplates().length,
    },
    activeWebsite: {
      id: demoWebsite.id,
      title: demoWebsite.title,
      themeId: demoEcclesiaTheme.id,
      themeName: ECCLESIA_THEME_NAME,
    },
    recentActivity: [
      {
        id: 'activity-provision-ecclesia',
        tenantId: demoTenant.id,
        userId: 'System',
        actionType: 'provision_ecclesia',
        metadataJson: JSON.stringify({ themeId: demoEcclesiaTheme.id, websiteId: demoWebsite.id }),
        createdAt: '2026-06-18T00:00:00.000Z',
      },
    ],
  };
}

function findDemoPage<T extends { id: string; slug: string }>(pageId: string, pages = demoPages as unknown as T[]) {
  const slug = String(pageId || '').replace(/^\/+/, '');
  return pages.find((page) => page.id === pageId || page.slug === slug) || pages[0];
}

function tenantThemeStateKey(tenantId: string) {
  return `tenant-theme:${tenantId}`;
}

function tenantPagesStateKey(tenantId: string) {
  return `tenant-pages:${tenantId}`;
}

function pageIdFromSlug(context: ReturnType<typeof getRequestContext>, slug: string) {
  const slugKey = cleanSubdomain(slug || 'home') || 'home';
  const tenantKey = cleanSubdomain(context.tenant.subdomain || context.tenant.id) || 'tenant';
  return `page-${tenantKey}-${slugKey}`;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseStoredJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringifyCmsContent(value: unknown) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value || []);
}

function mergeRecords(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  const next: Record<string, any> = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (isRecord(value) && isRecord(next[key])) {
      next[key] = mergeRecords(next[key], value);
      return;
    }
    next[key] = value;
  });
  return next;
}

function cleanSubdomain(value: unknown) {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return cleaned;
}

function tenantRegistryKey(subdomain: string) {
  return `tenant:${cleanSubdomain(subdomain)}`;
}

function cleanCustomDomain(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^\.+|\.+$/g, '');
}

function domainRegistryKey(hostname: string) {
  return `domain:${cleanCustomDomain(hostname)}`;
}

function isReservedSubdomain(subdomain: string) {
  const clean = cleanSubdomain(subdomain);
  return !clean || reservedSubdomains.has(clean);
}

function serializeTenantForRegistry(tenant: Record<string, any>) {
  const subdomain = cleanSubdomain(tenant.subdomain);
  if (!subdomain) {
    throw new Error('Tenant subdomain is required');
  }
  const customDomain = cleanCustomDomain(tenant.customDomain);
  return {
    ...defaultTenantValues,
    ...tenant,
    id: String(tenant.id || `tenant-${subdomain}`),
    name: String(tenant.name || `${titleFromSubdomain(subdomain)} Church`),
    subdomain,
    subdomainHost: makeSubdomainHost(subdomain),
    customDomain: customDomain || null,
    status: tenant.status || 'active',
  };
}

async function readRegisteredTenant(env: Env, subdomain: string) {
  const clean = cleanSubdomain(subdomain);
  if (isReservedSubdomain(clean)) return null;
  const raw = await env.CHURCHOS_TENANTS?.get(tenantRegistryKey(clean));
  if (!raw) return null;
  try {
    return serializeTenantForRegistry(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function readRegisteredTenantByDomain(env: Env, hostname: string) {
  const clean = cleanCustomDomain(hostname);
  if (!clean || clean === platformDomain || clean === `www.${platformDomain}` || clean.endsWith(`.${platformDomain}`)) {
    return null;
  }
  const raw = await env.CHURCHOS_TENANTS?.get(domainRegistryKey(clean));
  if (!raw) return null;
  try {
    return serializeTenantForRegistry(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeRegisteredTenant(env: Env, tenant: Record<string, any>) {
  const record = serializeTenantForRegistry(tenant);
  if (isReservedSubdomain(record.subdomain)) {
    throw new Error('This subdomain is reserved. Please choose another.');
  }
  const existing = await readRegisteredTenant(env, record.subdomain);
  await env.CHURCHOS_TENANTS?.put(tenantRegistryKey(record.subdomain), JSON.stringify(record));
  const oldDomain = cleanCustomDomain(existing?.customDomain);
  const nextDomain = cleanCustomDomain(record.customDomain);
  if (oldDomain && oldDomain !== nextDomain) {
    await env.CHURCHOS_TENANTS?.delete(domainRegistryKey(oldDomain));
  }
  if (nextDomain) {
    await env.CHURCHOS_TENANTS?.put(domainRegistryKey(nextDomain), JSON.stringify(record));
  }
  return record;
}

async function getSubdomainAvailability(env: Env, input: unknown) {
  const subdomain = cleanSubdomain(input);
  const invalid = !subdomain;
  const reserved = isReservedSubdomain(subdomain);
  const existing = reserved ? null : await readRegisteredTenant(env, subdomain);
  return {
    subdomain,
    host: makeSubdomainHost(subdomain),
    available: !invalid && !reserved && !existing,
    reason: invalid ? 'invalid' : reserved ? 'reserved' : existing ? 'taken' : null,
    suggestions: !reserved && !existing ? [] : [`${subdomain}-church`, `${subdomain}-online`, `${subdomain}-${new Date().getFullYear()}`]
      .map(cleanSubdomain)
      .filter((candidate) => candidate && !isReservedSubdomain(candidate) && candidate !== subdomain)
      .slice(0, 3),
  };
}

function decodeHeaderValue(value: string | null) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseContextHeader(request: Request): Record<string, any> {
  const raw = request.headers.get('x-churchos-onboarding-context');
  if (!raw) return {};
  try {
    return JSON.parse(decodeHeaderValue(raw));
  } catch {
    return {};
  }
}

function titleFromSubdomain(subdomain: string) {
  return subdomain
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Demo';
}

function subdomainFromTenantId(value: unknown) {
  const tenantId = String(value || '');
  if (tenantId.startsWith('tenant-') && tenantId.length > 'tenant-'.length) {
    return tenantId.slice('tenant-'.length);
  }
  return '';
}

function subdomainFromHost(hostname: string) {
  const host = hostname.toLowerCase().split(':')[0];
  if (host === platformDomain || host === `www.${platformDomain}` || host.endsWith('.workers.dev')) return '';
  if (host.endsWith(`.${platformDomain}`)) {
    return host.slice(0, -(platformDomain.length + 1));
  }
  if (host.endsWith('.localhost')) {
    return host.slice(0, -'.localhost'.length);
  }
  return '';
}

function customDomainFromHost(hostname: string) {
  const host = hostname.toLowerCase().split(':')[0];
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.workers.dev')) return '';
  if (host === platformDomain || host === `www.${platformDomain}` || host.endsWith(`.${platformDomain}`)) return '';
  return host;
}

function getRequestContext(request: Request, url: URL, body: Record<string, unknown> = {}) {
  const stored = parseContextHeader(request);
  const storedTenant = stored.tenant || {};
  const storedSteps = stored.steps || {};
  const headerTenantId = request.headers.get('x-tenant-id') || '';
  const headerName = decodeHeaderValue(request.headers.get('x-tenant-name'));
  const headerSubdomain = decodeHeaderValue(request.headers.get('x-tenant-subdomain'));
  const hostSubdomain = subdomainFromHost(url.hostname);
  const hostCustomDomain = customDomainFromHost(url.hostname);

  const subdomain = cleanSubdomain(
    body.subdomain ||
    headerSubdomain ||
    storedTenant.subdomain ||
    hostSubdomain ||
    (hostCustomDomain ? hostCustomDomain.split('.')[0] : '') ||
    subdomainFromTenantId(headerTenantId),
  );

  const name = String(
    body.name ||
    body.churchName ||
    headerName ||
    storedTenant.name ||
    (hostCustomDomain ? `${titleFromSubdomain(hostCustomDomain.split('.')[0])} Church` : '') ||
    (subdomain ? `${titleFromSubdomain(subdomain)} Church` : 'Church Workspace'),
  ).trim();

  const tenant = {
    ...defaultTenantValues,
    ...storedTenant,
    id: headerTenantId || storedTenant.id || (subdomain ? `tenant-${subdomain}` : 'tenant-unresolved'),
    name,
    subdomain,
    subdomainHost: subdomain ? makeSubdomainHost(subdomain) : '',
    customDomain: cleanCustomDomain(body.customDomain || storedTenant.customDomain || hostCustomDomain) || null,
    country: String(body.country || storedTenant.country || defaultTenantValues.country),
    city: String(body.city || storedTenant.city || defaultTenantValues.city),
    status: 'active',
    onboardingStatus: stored.completedAt ? 'completed' : 'in_progress',
  };

  return {
    tenant,
    steps: storedSteps,
    completedAt: stored.completedAt || null,
  };
}

function getStep(context: ReturnType<typeof getRequestContext>, key: string) {
  const step = context.steps?.[key];
  return step && typeof step === 'object' ? step : {};
}

function makeDefaultThemeSettingsForContext(context: ReturnType<typeof getRequestContext>) {
  return createEcclesiaThemeSettings({
    installation: {
      installedForTenantId: context.tenant.id,
      installedAt: '2026-06-18T00:00:00.000Z',
      autoProvisioned: true,
      runtime: 'cloudflare-api-worker',
    },
    marketplace: {
      version: '1.0.0',
      author: 'Church OS',
    },
  });
}

function coerceRecord(value: unknown, fallback: Record<string, any> = {}) {
  if (typeof value === 'string') {
    return coerceRecord(parseStoredJson<Record<string, any>>(value, fallback), fallback);
  }
  return isRecord(value) ? value : fallback;
}

async function readTenantThemeState(env: Env, context: ReturnType<typeof getRequestContext>): Promise<TenantThemeState> {
  const fallback: TenantThemeState = {
    settings: makeDefaultThemeSettingsForContext(context),
    draftSettings: null,
    updatedAt: '2026-06-18T00:00:00.000Z',
  };
  const raw = await env.CHURCHOS_TENANTS?.get(tenantThemeStateKey(context.tenant.id));
  const stored = parseStoredJson<Record<string, any>>(raw, {});
  const settings = coerceRecord(stored.settings, fallback.settings);
  const draftSettings = stored.draftSettings == null ? null : coerceRecord(stored.draftSettings, null as unknown as Record<string, any>);
  return {
    settings,
    draftSettings,
    updatedAt: String(stored.updatedAt || fallback.updatedAt),
  };
}

async function writeTenantThemeState(env: Env, context: ReturnType<typeof getRequestContext>, state: TenantThemeState) {
  await env.CHURCHOS_TENANTS?.put(
    tenantThemeStateKey(context.tenant.id),
    JSON.stringify({
      settings: state.settings,
      draftSettings: state.draftSettings,
      updatedAt: state.updatedAt,
    }),
  );
}

function makeThemeForContext(context: ReturnType<typeof getRequestContext>, state?: TenantThemeState) {
  const themeState = state || {
    settings: makeDefaultThemeSettingsForContext(context),
    draftSettings: null,
    updatedAt: '2026-06-18T00:00:00.000Z',
  };
  return {
    ...demoEcclesiaTheme,
    tenantId: context.tenant.id,
    settings: JSON.stringify(themeState.settings),
    draftSettings: themeState.draftSettings ? JSON.stringify(themeState.draftSettings) : null,
    updatedAt: themeState.updatedAt,
  };
}

function makeBrandingForContext(context: ReturnType<typeof getRequestContext>) {
  const profile = getStep(context, 'profile');
  const logo = getStep(context, 'logo');
  const website = getStep(context, 'website');
  const phone = [profile.phoneCode, profile.phone].filter(Boolean).join(' ').trim();

  return {
    churchName: context.tenant.name,
    description: website.homepageSubtitle || `${context.tenant.name} church website`,
    address: profile.address || '',
    venueAddress: profile.venueAddress || '',
    isVenueDifferent: Boolean(profile.isVenueDifferent),
    phone,
    phoneCode: profile.phoneCode || '',
    publicEmail: profile.email || '',
    email: profile.email || '',
    timezone: profile.timezone || 'UTC',
    serviceTimes: Array.isArray(profile.serviceTimes) ? profile.serviceTimes : [],
    logo: logo.logoUrl || '',
    darkLogo: logo.darkLogoUrl || '',
    favicon: logo.faviconUrl || '',
    accent: '#4f46e5',
    language: 'en',
    city: context.tenant.city,
    country: context.tenant.country,
    subdomainHost: context.tenant.subdomainHost,
    plan: context.tenant.plan,
  };
}

function makeWebsiteForContext(context: ReturnType<typeof getRequestContext>, theme = makeThemeForContext(context)) {
  const website = getStep(context, 'website');
  return {
    ...demoWebsite,
    id: `website-${context.tenant.subdomain}`,
    tenantId: context.tenant.id,
    themeId: theme.id,
    title: context.tenant.name,
    description: website.homepageSubtitle || `${context.tenant.name} church website`,
    domain: context.tenant.customDomain || context.tenant.subdomainHost,
    theme,
  };
}

function normalizeTenantPage(
  context: ReturnType<typeof getRequestContext>,
  website: ReturnType<typeof makeWebsiteForContext>,
  page: Record<string, any>,
): TenantPageRecord {
  const slug = String(page.slug || '').replace(/^\/+/, '');
  const template = getEcclesiaPageTemplates().find((item) => item.slug === slug);
  const isHome = slug === '' || Boolean(page.isHome);
  return {
    id: String(page.id || pageIdFromSlug(context, slug)),
    tenantId: context.tenant.id,
    websiteId: String(page.websiteId || website.id),
    title: String(page.title || page.name || template?.title || 'Untitled page'),
    slug,
    status: String(page.status || 'draft'),
    content: stringifyCmsContent(page.content),
    draftContent: page.draftContent == null ? null : stringifyCmsContent(page.draftContent),
    isHome,
    isPublished: page.isPublished == null ? String(page.status || 'draft') === 'published' : Boolean(page.isPublished),
    updatedAt: String(page.updatedAt || '2026-06-18T00:00:00.000Z'),
    seoTitle: page.seoTitle || template?.seo?.title?.replace('{{churchName}}', context.tenant.name),
    seoDescription: page.seoDescription || template?.seo?.description?.replace('{{churchName}}', context.tenant.name),
    seoKeywords: page.seoKeywords || template?.seo?.keywords || null,
    sourceFile: page.sourceFile || template?.sourceFile,
    sourceUrl: page.sourceUrl || template?.sourceUrl,
    module: page.module || template?.module,
  };
}

function makePagesForContext(
  context: ReturnType<typeof getRequestContext>,
  website = makeWebsiteForContext(context),
  storedPages: Record<string, any>[] = [],
): TenantPageRecord[] {
  const websiteStep = getStep(context, 'website');
  const defaults = createEcclesiaDefaultPages(context.tenant.id, website.id, context.tenant.name)
    .map((page) => normalizeTenantPage(context, website, {
      ...page,
      id: pageIdFromSlug(context, page.slug),
      isHome: page.slug === '' || Boolean(page.isHome),
      isPublished: page.status === 'published',
    }));

  const homePage = defaults.find((page) => page.slug === '');
  if (homePage && (websiteStep.homepageTitle || websiteStep.homepageSubtitle || websiteStep.aboutText)) {
    homePage.content = JSON.stringify([
      {
        type: 'hero',
        title: websiteStep.homepageTitle || context.tenant.name,
        subtitle: websiteStep.homepageSubtitle || 'Welcome to our church community.',
        aboutText: websiteStep.aboutText || '',
        buttonText: websiteStep.primaryCtaText || 'Plan a Visit',
        buttonUrl: websiteStep.primaryCtaUrl || '/visit',
      },
    ]);
  }

  const bySlug = new Map(defaults.map((page) => [page.slug, page]));
  storedPages.forEach((page) => {
    const normalized = normalizeTenantPage(context, website, page);
    bySlug.set(normalized.slug, normalized);
  });

  return Array.from(bySlug.values());
}

async function readTenantPages(
  env: Env,
  context: ReturnType<typeof getRequestContext>,
  website = makeWebsiteForContext(context),
) {
  const raw = await env.CHURCHOS_TENANTS?.get(tenantPagesStateKey(context.tenant.id));
  const stored = parseStoredJson<Record<string, any>[]>(raw, []);
  return makePagesForContext(context, website, Array.isArray(stored) ? stored : []);
}

async function writeTenantPages(
  env: Env,
  context: ReturnType<typeof getRequestContext>,
  pages: TenantPageRecord[],
) {
  await env.CHURCHOS_TENANTS?.put(tenantPagesStateKey(context.tenant.id), JSON.stringify(pages));
}

function makeGlobalContentForContext(context: ReturnType<typeof getRequestContext>) {
  const profile = getStep(context, 'profile');
  const logo = getStep(context, 'logo');
  const website = getStep(context, 'website');
  const globalContent = createEcclesiaGlobalContent(context.tenant.name);
  return {
    ...globalContent,
    churchIdentity: {
      ...globalContent.churchIdentity,
      churchName: context.tenant.name,
      logoUrl: logo.logoUrl || globalContent.churchIdentity.logoUrl,
      faviconUrl: logo.faviconUrl || globalContent.churchIdentity.faviconUrl,
      tagline: website.homepageTitle || globalContent.churchIdentity.tagline,
      description: website.homepageSubtitle || globalContent.churchIdentity.description,
    },
    contact: {
      ...globalContent.contact,
      phone: [profile.phoneCode, profile.phone].filter(Boolean).join(' ').trim() || globalContent.contact.phone,
      email: profile.email || globalContent.contact.email,
      address: profile.venueAddress || profile.address || globalContent.contact.address,
    },
    services: {
      ...globalContent.services,
      serviceTimes: Array.isArray(profile.serviceTimes) && profile.serviceTimes.length
        ? profile.serviceTimes.map((item: any) => ({
            label: item.day || 'Service',
            time: item.time || '',
            location: profile.venueAddress || profile.address || undefined,
          }))
        : globalContent.services.serviceTimes,
    },
  };
}

function makeSiteContextForContext(context: ReturnType<typeof getRequestContext>, theme = makeThemeForContext(context)) {
  return {
    tenant: {
      id: context.tenant.id,
      name: context.tenant.name,
      subdomain: context.tenant.subdomain,
      status: 'active',
    },
    theme: {
      id: theme.id,
      name: theme.name,
      settings: JSON.parse(theme.settings),
      draftSettings: null,
    },
    moduleEntitlements: [
      'website-cms',
      'theme-engine',
      'domain-tenant-management',
      'livestream',
      'giving',
      'member-crm',
      'church-services',
    ].map((moduleKey) => ({ moduleKey, enabled: true })),
    navigation: {
      id: `nav-${context.tenant.subdomain}`,
      items: createEcclesiaNavigationItems(),
    },
    footer: {
      id: `footer-${context.tenant.subdomain}`,
      copyrightText: `Copyright ${new Date().getFullYear()} ${context.tenant.name}`,
      socialLinks: [],
      secondaryLinks: createEcclesiaFooterLinks(),
    },
    announcement: {
      id: `announcement-${context.tenant.subdomain}`,
      isActive: false,
      text: '',
    },
    enabledPlugins: [],
    pluginSettings: {},
  };
}

function makeRenderForContext(
  context: ReturnType<typeof getRequestContext>,
  slug = '',
  theme = makeThemeForContext(context),
  website = makeWebsiteForContext(context, theme),
  pages = makePagesForContext(context, website),
) {
  const normalizedSlug = String(slug || '').replace(/^\/+/, '');
  const page = findDemoPage(normalizedSlug, pages);
  const siteContext = makeSiteContextForContext(context, theme);
  const contentBlocks = parseStoredJson<JsonValue>(page.content, []);
  return {
    pageId: page.id,
    title: page.title,
    slug: page.slug,
    isHome: page.isHome,
    contentBlocks: Array.isArray(contentBlocks) ? contentBlocks : [],
    isPreview: false,
    seoTitle: page.seoTitle || `${context.tenant.name} | ${page.title}`,
    seoDescription: page.seoDescription || website.description,
    seoKeywords: page.seoKeywords || null,
    sourceFile: page.sourceFile || null,
    sourceUrl: page.sourceUrl || null,
    module: page.module || null,
    globalContent: makeGlobalContentForContext(context),
    navigation: siteContext.navigation,
    footer: siteContext.footer,
    theme: {
      name: siteContext.theme.name,
      settings: siteContext.theme.settings,
    },
  };
}

function makeTenantFromBody(body: Record<string, unknown>) {
  const subdomain = cleanSubdomain(body.subdomain);
  const plan = String(body.plan || defaultTenantValues.plan);
  return {
    ...defaultTenantValues,
    id: `tenant-${subdomain}`,
    name: String(body.name || body.churchName || `${titleFromSubdomain(subdomain)} Church`),
    subdomain,
    subdomainHost: makeSubdomainHost(subdomain),
    plan,
    country: String(body.country || defaultTenantValues.country),
    city: String(body.city || defaultTenantValues.city),
    status: 'active',
    onboardingStatus: 'in_progress',
  };
}

function makeSessionToken(tenantId: string, userId: string) {
  const encoded = btoa(`${tenantId}:${userId}:${Date.now()}`);
  return `churchos-session-${encoded.replace(/=+$/g, '')}`;
}

function collectionResponse(pathname: string): JsonValue {
  if (pathname.includes('/users')) return [demoUser];
  if (pathname.includes('/roles')) return demoRoles;
  if (pathname.includes('/invitations')) return [];
  if (pathname.includes('/pages')) return demoPages;
  if (pathname.includes('/websites')) return [demoWebsite] as JsonValue;
  if (pathname.includes('/themes')) return [demoEcclesiaTheme] as JsonValue;
  if (pathname.includes('/assets')) return demoMarketplaceAssets;
  if (pathname.includes('/plans')) {
    return [
      { id: 'starter', name: 'Starter', priceMonthly: 29 },
      { id: 'growth', name: 'Growth', priceMonthly: 79 },
      { id: 'pro', name: 'Pro', priceMonthly: 149 },
    ];
  }
  if (
    pathname.includes('/categories') ||
    pathname.includes('/tags') ||
    pathname.includes('/playlists') ||
    pathname.includes('/speakers') ||
    pathname.includes('/products') ||
    pathname.includes('/orders') ||
    pathname.includes('/events') ||
    pathname.includes('/members') ||
    pathname.includes('/contacts') ||
    pathname.includes('/tasks') ||
    pathname.includes('/streams') ||
    pathname.includes('/courses') ||
    pathname.includes('/modules') ||
    pathname.includes('/lessons') ||
    pathname.includes('/jobs') ||
    pathname.includes('/logs') ||
    pathname.includes('/reports')
  ) {
    return [];
  }
  return {
    id: makeId('demo'),
    status: 'ready',
    message: 'Demo API response',
  };
}

async function routeGet(request: Request, pathname: string, url: URL, env: Env) {
  const hostSubdomain = subdomainFromHost(url.hostname);
  const hostCustomDomain = customDomainFromHost(url.hostname);
  const resolvedHostTenant = hostSubdomain
    ? await readRegisteredTenant(env, hostSubdomain)
    : hostCustomDomain
      ? await readRegisteredTenantByDomain(env, hostCustomDomain)
      : null;
  const context = getRequestContext(request, url, resolvedHostTenant || {});
  const tenant = context.tenant;
  const themeState = await readTenantThemeState(env, context);
  const theme = makeThemeForContext(context, themeState);
  const website = makeWebsiteForContext(context, theme);
  const pages = await readTenantPages(env, context, website);

  if (pathname === '/health' || pathname === '/api/health') {
    return withJson({
      status: 'ok',
      data: {
        runtime: 'cloudflare-api-worker',
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (pathname === '/api/public/check-subdomain') {
    return withJson({ data: await getSubdomainAvailability(env, url.searchParams.get('subdomain') || url.searchParams.get('host')) });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(url.searchParams.get('subdomain') || hostSubdomain);
    const resolvedTenant = await readRegisteredTenant(env, subdomain);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-domain') {
    const hostname = cleanCustomDomain(url.searchParams.get('host') || hostCustomDomain);
    const resolvedTenant = await readRegisteredTenantByDomain(env, hostname);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if ((hostSubdomain || hostCustomDomain) && !resolvedHostTenant) {
    return withJson({ error: 'Church website not found' }, { status: 404 });
  }

  if (pathname === '/api/cms/websites') {
    return withJson({ data: [website] as unknown as JsonValue });
  }

  if (pathname === '/api/cms/pages') {
    return withJson({ data: pages as unknown as JsonValue });
  }

  if (pathname.startsWith('/api/cms/pages/')) {
    const pageId = pathname.split('/').filter(Boolean).pop() || '';
    return withJson({ data: findDemoPage(pageId, pages) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/global-content') {
    return withJson({ data: makeGlobalContentForContext(context) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/site-context') {
    return withJson({ data: makeSiteContextForContext(context, theme) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/render') {
    return withJson({ data: makeRenderForContext(context, url.searchParams.get('slug') || '', theme, website, pages) as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/themes') {
    return withJson({ data: [theme] as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/sections') {
    return withJson({ data: getEcclesiaSectionTemplates() as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/page-templates') {
    return withJson({ data: getEcclesiaPageTemplates() as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/settings' || pathname === '/api/settings/theme-engine') {
    return withJson({ data: getThemeEngineSettings() as JsonValue });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/preview$/.test(pathname)) {
    return withJson({
      data: {
        themeId: demoEcclesiaTheme.id,
        name: theme.name,
        settings: JSON.parse(theme.settings),
        version: '1.0.0',
        isPreview: true,
        timestamp: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (pathname === '/api/onboarding') {
    return withJson({
      data: {
        tenant,
        steps: onboardingSteps,
        progressPercent: context.completedAt ? 100 : 20,
        completedAt: context.completedAt,
      },
    });
  }

  if (pathname === '/api/billing-subscription-management/current') {
    return withJson({
      plan: { slug: 'growth', name: 'Growth' },
      data: { plan: { slug: 'growth', name: 'Growth' } },
    });
  }

  if (pathname === '/api/settings/schema') {
    return withJson({
      data: [
        { key: 'liveChat.enabled', label: 'Live chat', type: 'boolean', moduleKey: 'liveChat' },
        { key: 'cms.autoSave', label: 'CMS autosave', type: 'boolean', moduleKey: 'cms' },
      ],
    });
  }

  if (pathname === '/api/settings') {
    return withJson({
      data: {
        liveChat: { enabled: true },
        cms: { autoSave: true, searchIndexing: true },
      },
    });
  }

  if (pathname === '/api/tenant/branding') {
    return withJson({
      data: {
        tenant,
        branding: makeBrandingForContext(context),
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/tenant/domain') {
    return withJson({
      data: {
        subdomain: tenant.subdomain,
        subdomainHost: tenant.subdomainHost,
        customDomain: tenant.customDomain || '',
        primaryDomain: tenant.customDomain || tenant.subdomainHost,
        websiteDomain: website.domain,
        status: 'verified',
        dnsStatus: {
          verified: true,
          sslActive: true,
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/tenant/checklist') {
    return withJson({
      data: onboardingSteps.map((step) => ({
        key: step.stepKey,
        label: step.stepKey,
        status: step.status,
      })),
    });
  }

  if (pathname === '/api/theme-engine/overview') {
    return withJson({
      data: {
        ...getThemeEngineOverview(),
        settings: {
          ...getThemeEngineSettings(),
          tenantId: tenant.id,
        },
        activeWebsite: {
          id: website.id,
          title: website.title,
          themeId: theme.id,
          themeName: ECCLESIA_THEME_NAME,
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/reports') {
    return withJson({
      data: getThemeEngineOverview().recentActivity as JsonValue,
    });
  }

  if (pathname === '/api/cms/navigation') {
    return withJson({ data: { items: createEcclesiaNavigationItems() } as JsonValue });
  }

  if (pathname === '/api/cms/footer') {
    return withJson({
      data: {
        columns: [],
        secondaryLinks: createEcclesiaFooterLinks(),
        copyright: `${tenant.name}`,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-website-tenant') {
    return withJson({
      data: {
        tenantId: tenant.id,
        tenant,
        website,
      } as JsonValue,
    });
  }

  return withJson({
    data: collectionResponse(pathname),
    meta: { source: 'churchos-api-worker', mock: true },
  });
}

async function routeMutation(request: Request, pathname: string, env: Env) {
  const body = await readBody(request);
  const url = new URL(request.url);
  const context = getRequestContext(request, url, body);
  const tenant = context.tenant;
  const themeState = await readTenantThemeState(env, context);
  const theme = makeThemeForContext(context, themeState);
  const website = makeWebsiteForContext(context, theme);
  const pages = await readTenantPages(env, context, website);

  if (pathname === '/api/cms/websites') {
    return withJson({ data: { ...website, ...(body as Record<string, JsonValue>) } as unknown as JsonValue }, { status: 201 });
  }

  if (pathname === '/api/cms/pages') {
    const title = String(body.title || 'Untitled page');
    const slug = String(body.slug || '').replace(/^\/+/, '');
    const page = normalizeTenantPage(context, website, {
      id: pageIdFromSlug(context, slug) || makeId('page'),
      tenantId: tenant.id,
      websiteId: String(body.websiteId || website.id),
      title,
      slug,
      status: String(body.status || 'draft'),
      content: body.content || [],
      draftContent: null,
      isHome: slug === '',
      isPublished: body.status === 'published',
      updatedAt: new Date().toISOString(),
    });
    const existingIndex = pages.findIndex((item) => item.id === page.id || item.slug === page.slug);
    if (existingIndex >= 0) {
      pages[existingIndex] = { ...pages[existingIndex], ...page };
    } else {
      pages.push(page);
    }
    await writeTenantPages(env, context, pages);
    return withJson({ data: page as JsonValue }, { status: 201 });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/draft$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || pages[0].id;
    const pageIndex = pages.findIndex((page) => page.id === pageId || page.slug === pageId);
    const page = pageIndex >= 0 ? pages[pageIndex] : pages[0];
    const updatedPage = {
      ...page,
      draftContent: stringifyCmsContent(body.draftContent || []),
      updatedAt: new Date().toISOString(),
    };
    pages[pageIndex >= 0 ? pageIndex : 0] = updatedPage;
    await writeTenantPages(env, context, pages);
    return withJson({
      data: updatedPage as unknown as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/publish$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || pages[0].id;
    const pageIndex = pages.findIndex((page) => page.id === pageId || page.slug === pageId);
    const page = pageIndex >= 0 ? pages[pageIndex] : pages[0];
    const updatedPage = {
      ...page,
      status: 'published',
      isPublished: true,
      content: page.draftContent || page.content,
      draftContent: null,
      updatedAt: new Date().toISOString(),
    };
    pages[pageIndex >= 0 ? pageIndex : 0] = updatedPage;
    await writeTenantPages(env, context, pages);
    return withJson({
      data: updatedPage as unknown as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).pop() || pages[0].id;
    const pageIndex = pages.findIndex((page) => page.id === pageId || page.slug === pageId);
    const page = pageIndex >= 0 ? pages[pageIndex] : pages[0];
    const updatedPage = normalizeTenantPage(context, website, {
      ...page,
      ...body,
      id: page.id,
      content: body.content == null ? page.content : body.content,
      draftContent: body.draftContent == null ? page.draftContent : body.draftContent,
      updatedAt: new Date().toISOString(),
    });
    pages[pageIndex >= 0 ? pageIndex : 0] = updatedPage;
    await writeTenantPages(env, context, pages);
    return withJson({
      data: updatedPage as unknown as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/settings') {
    return withJson({
      data: {
        ...getThemeEngineSettings(),
        tenantId: tenant.id,
        ...(body as Record<string, JsonValue>),
      } as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/ecclesia/provision') {
    return withJson({ data: { theme, website } as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/themes/install') {
    return withJson({ data: theme as unknown as JsonValue }, { status: 201 });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/activate$/.test(pathname)) {
    return withJson({
      data: {
        ...website,
        id: String(body.websiteId || website.id),
        themeId: pathname.split('/').filter(Boolean).at(-2) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/draft$/.test(pathname)) {
    const incoming = coerceRecord((body as Record<string, unknown>).settings || body, {});
    const nextState: TenantThemeState = {
      settings: themeState.settings,
      draftSettings: mergeRecords(themeState.draftSettings || themeState.settings, incoming),
      updatedAt: new Date().toISOString(),
    };
    await writeTenantThemeState(env, context, nextState);
    const updatedTheme = makeThemeForContext(context, nextState);
    return withJson({
      data: {
        ...updatedTheme,
        id: pathname.split('/').filter(Boolean).at(-3) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/(publish|discard|reset)$/.test(pathname)) {
    const action = pathname.split('/').filter(Boolean).pop();
    const nextState: TenantThemeState = {
      settings: themeState.settings,
      draftSettings: themeState.draftSettings,
      updatedAt: new Date().toISOString(),
    };
    if (action === 'publish') {
      nextState.settings = themeState.draftSettings || themeState.settings;
      nextState.draftSettings = null;
    }
    if (action === 'discard') {
      nextState.draftSettings = null;
    }
    if (action === 'reset') {
      nextState.settings = makeDefaultThemeSettingsForContext(context);
      nextState.draftSettings = null;
    }
    await writeTenantThemeState(env, context, nextState);
    const updatedTheme = makeThemeForContext(context, nextState);
    return withJson({
      data: {
        ...updatedTheme,
        id: pathname.split('/').filter(Boolean).at(-3) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customize$/.test(pathname)) {
    const incoming = coerceRecord((body as Record<string, unknown>).settings || body, {});
    const nextState: TenantThemeState = {
      settings: mergeRecords(themeState.settings, incoming),
      draftSettings: null,
      updatedAt: new Date().toISOString(),
    };
    await writeTenantThemeState(env, context, nextState);
    const updatedTheme = makeThemeForContext(context, nextState);
    return withJson({
      data: {
        ...updatedTheme,
        id: pathname.split('/').filter(Boolean).at(-2) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/preview\/customize$/.test(pathname)) {
    const incoming = coerceRecord((body as Record<string, unknown>).settings || body, {});
    return withJson({
      data: {
        themeId: pathname.split('/').filter(Boolean).at(-3) || theme.id,
        settings: mergeRecords(themeState.draftSettings || themeState.settings, incoming),
        isPreview: true,
        staging: true,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/check-subdomain') {
    const availability = await getSubdomainAvailability(env, body.subdomain || body.host);
    return withJson({ available: availability.available, data: availability as unknown as JsonValue });
  }

  if (pathname === '/api/tenant/branding') {
    return withJson({
      data: {
        tenant: {
          ...tenant,
          name: String(body.name || tenant.name),
        },
        branding: {
          ...makeBrandingForContext(context),
          ...(body as Record<string, JsonValue>),
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/tenant/domain') {
    const customDomain = String(body.customDomain || '').trim().toLowerCase();
    if (!tenant.subdomain) {
      return withJson({ error: 'Tenant subdomain is required before connecting a custom domain' }, { status: 400 });
    }
    const existingDomainTenant = customDomain ? await readRegisteredTenantByDomain(env, customDomain) : null;
    if (existingDomainTenant && existingDomainTenant.subdomain !== tenant.subdomain) {
      return withJson({ error: 'This custom domain is already connected to another church.' }, { status: 409 });
    }
    await writeRegisteredTenant(env, { ...tenant, customDomain });
    return withJson({
      data: {
        subdomain: tenant.subdomain,
        subdomainHost: tenant.subdomainHost,
        customDomain,
        primaryDomain: customDomain || tenant.subdomainHost,
        websiteDomain: customDomain || tenant.subdomainHost,
        status: 'verified',
        dnsStatus: {
          verified: true,
          sslActive: true,
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(body.subdomain);
    const resolvedTenant = await readRegisteredTenant(env, subdomain);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-domain') {
    const hostname = cleanCustomDomain(body.host || body.domain || body.customDomain);
    const resolvedTenant = await readRegisteredTenantByDomain(env, hostname);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if (pathname === '/api/auth/register-tenant') {
    const availability = await getSubdomainAvailability(env, body.subdomain || body.name || body.churchName);
    if (!availability.available) {
      return withJson({
        error: availability.reason === 'reserved'
          ? 'This subdomain is reserved. Please choose another.'
          : availability.reason === 'taken'
            ? 'This subdomain is already assigned to another church.'
            : 'A valid subdomain is required.',
        data: availability as unknown as JsonValue,
      }, { status: 409 });
    }
    body.subdomain = availability.subdomain;
    const tenant = await writeRegisteredTenant(env, makeTenantFromBody(body));
    const ownerName = String(body.ownerName || 'Church Owner');
    const ownerEmail = String(body.ownerEmail || `owner@${tenant.subdomain}.church`);
    const user = {
      ...demoUser,
      id: `user-${tenant.subdomain}`,
      name: ownerName,
      email: ownerEmail,
      member: {
        id: `member-${tenant.subdomain}`,
        firstName: ownerName.split(/\s+/)[0] || 'Church',
        lastName: ownerName.split(/\s+/).slice(1).join(' ') || 'Owner',
      },
    };
    const website = {
      id: `website-${tenant.subdomain}`,
      tenantId: tenant.id,
      title: tenant.name,
      description: `${tenant.name} church website`,
      domain: tenant.subdomainHost,
      status: 'published',
      isPrimary: true,
      isActive: true,
      theme: {
        ...demoEcclesiaTheme,
        tenantId: tenant.id,
      },
    };
    const plan = {
      slug: tenant.plan,
      name: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
    };
    const token = makeSessionToken(tenant.id, user.id);
    const session = {
      token,
      tenantId: tenant.id,
      tenant,
      user,
      website,
      plan,
    };
    return withJson({ ...session, data: session }, { status: 201 });
  }

  if (pathname === '/api/auth/login' || pathname === '/api/super-admin/login') {
    const token = makeSessionToken(tenant.id, demoUser.id);
    return withJson({
      token,
      data: {
        token,
        user: {
          ...demoUser,
          tenantId: tenant.id,
          email: tenant.subdomain ? `admin@${tenant.subdomain}.${platformDomain}` : 'admin@churched.online',
        },
        tenant,
      },
    });
  }

  if (pathname.startsWith('/api/onboarding')) {
    const stepKey = pathname.split('/').filter(Boolean).pop() || 'profile';
    const normalizedStepKey = stepKey === 'website-basics' ? 'website' : stepKey;
    return withJson({
      ok: true,
      data: {
        id: makeId('onboarding'),
        tenant,
        steps: onboardingSteps.map((step) => step.stepKey === normalizedStepKey
          ? { ...step, status: 'completed', metadataJson: JSON.stringify(body) }
          : step),
        progressPercent: pathname.endsWith('/complete') ? 100 : 40,
        completedAt: pathname.endsWith('/complete') ? new Date().toISOString() : null,
        step: {
          stepKey: normalizedStepKey,
          status: 'completed',
          metadataJson: JSON.stringify(body),
        },
        status: pathname.endsWith('/complete') ? 'completed' : 'saved',
      } as JsonValue,
    });
  }

  if (request.method === 'DELETE') {
    return withJson({ ok: true, data: null });
  }

  return withJson({
    ok: true,
    data: {
      id: makeId('item'),
      ...body,
      status: 'saved',
      updatedAt: new Date().toISOString(),
    } as JsonValue,
  });
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return routeGet(request, pathname, url, env);
      }
      return routeMutation(request, pathname, env);
    } catch (err) {
      return withJson(
        { error: err instanceof Error ? err.message : 'API request failed' },
        { status: 500 },
      );
    }
  },
};
