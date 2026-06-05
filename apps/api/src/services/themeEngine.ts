import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

const MODULE_KEY = 'theme-engine';
const VALID_STATUSES = new Set(['active', 'inactive', 'suspended']);
const VALID_VISIBILITIES = new Set(['public', 'private']);
const VALID_BILLING_PLANS = new Set(['free', 'premium', 'platform']);
const VALID_PROVIDER_MODES = new Set(['bring_your_own', 'platform_managed', 'marketplace']);
const CUSTOM_CSS_LIMIT = 20000;

const DEFAULT_THEME_ENGINE_CONFIG = {
  allowMarketplaceThemes: true,
  allowCustomCss: true,
  publicPublishingRequiresActiveEntitlement: true,
  defaultHeaderStyle: 'default',
  defaultFooterStyle: 'simple',
  mobileLayout: 'stacked',
  sections: [],
  pageTemplates: [],
};

export interface CustomizeThemeInput {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  logos?: {
    primaryUrl?: string;
    secondaryUrl?: string;
  };
  layout?: {
    headerStyle?: string;
    footerStyle?: string;
    mobileLayout?: string;
  };
  customCss?: string;
}

export interface ThemeEngineModuleInput {
  title: string;
  description?: string;
  visibility?: string;
  createdBy?: string | null;
}

export interface ThemeEngineSettingsInput {
  enabled?: boolean;
  billingPlan?: string;
  providerMode?: string;
  configJson?: any;
}

export interface ThemeEngineTemplateInput {
  name: string;
  key: string;
  structureJson: any;
}

function jsonString(value: any, fallback: any = {}): string {
  if (typeof value === 'string') {
    JSON.parse(value);
    return value;
  }

  return JSON.stringify(value ?? fallback);
}

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}

function normalizeTemplateKey(value: unknown): string {
  const key = requireNonEmptyString(value, 'key')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!key) {
    throw new Error('key must contain letters or numbers');
  }

  return key;
}

function assertAllowed(value: string | undefined, allowed: Set<string>, label: string): void {
  if (value !== undefined && !allowed.has(value)) {
    throw new Error(`${label} must be one of: ${Array.from(allowed).join(', ')}`);
  }
}

function assertHexColor(value: string | undefined, label: string): void {
  if (value === undefined || value === '') return;
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    throw new Error(`${label} must be a valid hex color`);
  }
}

function assertUrlLike(value: string | undefined, label: string): void {
  if (value === undefined || value.trim() === '') return;

  if (value.startsWith('/')) return;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error(`${label} must be a valid http(s) URL or site-relative path`);
  }
}

function validateCustomization(input: CustomizeThemeInput): void {
  if (input.colors) {
    assertHexColor(input.colors.primary, 'colors.primary');
    assertHexColor(input.colors.secondary, 'colors.secondary');
    assertHexColor(input.colors.accent, 'colors.accent');
  }

  if (input.fonts) {
    if (input.fonts.heading !== undefined) requireNonEmptyString(input.fonts.heading, 'fonts.heading');
    if (input.fonts.body !== undefined) requireNonEmptyString(input.fonts.body, 'fonts.body');
  }

  if (input.logos) {
    assertUrlLike(input.logos.primaryUrl, 'logos.primaryUrl');
    assertUrlLike(input.logos.secondaryUrl, 'logos.secondaryUrl');
  }

  if (input.customCss !== undefined && input.customCss.length > CUSTOM_CSS_LIMIT) {
    throw new Error(`customCss must be ${CUSTOM_CSS_LIMIT} characters or fewer`);
  }
}

function normalizeConfigJson(input: any): string {
  const current = typeof input === 'string' ? safeParseJson<Record<string, any>>(input, {}) : (input || {});
  return JSON.stringify({
    ...DEFAULT_THEME_ENGINE_CONFIG,
    ...current,
    sections: Array.isArray(current.sections) ? current.sections : [],
    pageTemplates: Array.isArray(current.pageTemplates) ? current.pageTemplates : [],
  });
}

function normalizeTemplate(input: ThemeEngineTemplateInput, type: 'section' | 'page') {
  const name = requireNonEmptyString(input.name, 'name');
  const key = normalizeTemplateKey(input.key);
  const structure = typeof input.structureJson === 'string'
    ? safeParseJson<Record<string, any>>(input.structureJson, {})
    : input.structureJson;

  if (!structure || typeof structure !== 'object' || Array.isArray(structure)) {
    throw new Error('structureJson must be an object');
  }

  return {
    name,
    key,
    structure,
    type,
    registeredAt: new Date().toISOString(),
  };
}

export class ThemeEngineService {
  /**
   * Activate / Create a new Theme Engine module instance.
   */
  static async createThemeEngineModule(tenantId: string, data: ThemeEngineModuleInput) {
    const title = requireNonEmptyString(data.title, 'title');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    return await prisma.themeEngineModule.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        visibility: data.visibility || 'public',
        createdBy: data.createdBy || null,
        status: 'active',
      },
    });
  }

  /**
   * List all module configuration instances for the tenant.
   */
  static async listThemeEngineModules(tenantId: string) {
    return await prisma.themeEngineModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single theme engine module configuration.
   */
  static async getThemeEngineModule(id: string, tenantId: string) {
    const record = await prisma.themeEngineModule.findFirst({
      where: { id, tenantId },
    });
    if (!record) {
      throw new Error('Theme engine module not found');
    }
    return record;
  }

  /**
   * Update theme engine module details.
   */
  static async updateThemeEngineModule(id: string, tenantId: string, data: { title?: string; description?: string; status?: string; settingsJson?: any; visibility?: string }) {
    const record = await this.getThemeEngineModule(id, tenantId);
    assertAllowed(data.status, VALID_STATUSES, 'status');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');
    
    return await prisma.themeEngineModule.update({
      where: { id: record.id },
      data: {
        ...(data.title !== undefined && { title: requireNonEmptyString(data.title, 'title') }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settingsJson !== undefined && { settingsJson: jsonString(data.settingsJson, {}) }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
      },
    });
  }

  /**
   * Delete theme engine module.
   */
  static async deleteThemeEngineModule(id: string, tenantId: string) {
    const record = await this.getThemeEngineModule(id, tenantId);
    return await prisma.themeEngineModule.delete({
      where: { id: record.id },
    });
  }

  /**
   * Logs an action in the audit/activity trail.
   */
  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.themeEngineModuleActivity.create({
      data: {
        tenantId,
        userId: userId || 'System',
        actionType,
        metadataJson: jsonString(metadata, {}),
      },
    });

    await trackEvent(tenantId, {
      category: 'theme_engine',
      name: actionType,
      entityId: metadata?.themeId || metadata?.moduleId || metadata?.key || null,
      userId: userId || null,
      metadata,
    }).catch(() => undefined);

    return activity;
  }

  /**
   * Fetch all logged activities for audit.
   */
  static async listActivities(tenantId: string) {
    return await prisma.themeEngineModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Fetch settings configurations.
   */
  static async getSettings(tenantId: string) {
    const record = await prisma.themeEngineModuleSettings.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: 'theme-engine',
        },
      },
    });

    if (!record) {
      // Return defaults if none configured yet
      return {
        tenantId,
        moduleKey: MODULE_KEY,
        enabled: true,
        billingPlan: 'free',
        providerMode: 'bring_your_own',
        configJson: JSON.stringify(DEFAULT_THEME_ENGINE_CONFIG),
      };
    }
    return record;
  }

  /**
   * Update billing plan/configurations (Super Admin).
   */
  static async updateSettings(tenantId: string, data: ThemeEngineSettingsInput) {
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
    assertAllowed(data.billingPlan, VALID_BILLING_PLANS, 'billingPlan');
    assertAllowed(data.providerMode, VALID_PROVIDER_MODES, 'providerMode');

    const normalizedConfig = data.configJson !== undefined ? normalizeConfigJson(data.configJson) : undefined;

    return await prisma.themeEngineModuleSettings.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: MODULE_KEY,
        },
      },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.billingPlan !== undefined && { billingPlan: data.billingPlan }),
        ...(data.providerMode !== undefined && { providerMode: data.providerMode }),
        ...(normalizedConfig !== undefined && { configJson: normalizedConfig }),
      },
      create: {
        tenantId,
        moduleKey: MODULE_KEY,
        enabled: data.enabled !== undefined ? data.enabled : true,
        billingPlan: data.billingPlan || 'free',
        providerMode: data.providerMode || 'bring_your_own',
        configJson: normalizedConfig || JSON.stringify(DEFAULT_THEME_ENGINE_CONFIG),
      },
    });
  }

  /**
   * Module overview for the central dashboard.
   */
  static async getOverview(tenantId: string) {
    const [moduleRecords, themes, websites, activities, settings] = await Promise.all([
      prisma.themeEngineModule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
      this.listTenantThemes(tenantId),
      prisma.website.findMany({ where: { tenantId }, include: { theme: true }, orderBy: { createdAt: 'desc' } }),
      prisma.themeEngineModuleActivity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      this.getSettings(tenantId),
    ]);

    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);
    const activeWebsite = websites.find((website) => website.isActive) || websites[0] || null;

    return {
      moduleKey: MODULE_KEY,
      settings,
      counts: {
        moduleProfiles: moduleRecords.length,
        installedThemes: themes.filter((theme) => theme.tenantId === tenantId).length,
        globalThemes: themes.filter((theme) => theme.tenantId === null).length,
        websites: websites.length,
        sectionTemplates: this.defaultSectionTemplates().length + (config.sections || []).length,
        pageTemplates: this.defaultPageTemplates().length + (config.pageTemplates || []).length,
      },
      activeWebsite: activeWebsite ? {
        id: activeWebsite.id,
        title: activeWebsite.title,
        themeId: activeWebsite.themeId,
        themeName: activeWebsite.theme?.name,
      } : null,
      recentActivity: activities,
    };
  }

  /**
   * Install a theme from the marketplace storefront.
   */
  static async installThemeFromMarketplace(tenantId: string, assetId: string) {
    // 1. Fetch asset details
    const asset = await prisma.marketplaceAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.status !== 'approved' || asset.type !== 'theme') {
      throw new Error('Approved marketplace theme not found');
    }

    if (asset.pricingType !== 'free') {
      const purchase = await prisma.assetPurchase.findFirst({
        where: { tenantId, assetId, status: 'completed' },
      });

      if (!purchase) {
        throw new Error('This premium theme must be purchased before installation');
      }
    }

    // 2. Check if already purchased/installed
    const existing = await prisma.theme.findFirst({
      where: { tenantId, name: asset.name },
    });

    if (existing) {
      throw new Error('Theme is already installed');
    }

    // 3. Create a copy inside the tenant's workspace
    const assetConfig = safeParseJson<Record<string, any>>(asset.assetConfig, {});

    return await prisma.theme.create({
      data: {
        tenantId,
        name: asset.name,
        settings: JSON.stringify({
          ...assetConfig,
          marketplace: {
            assetId: asset.id,
            version: asset.version,
            pricingType: asset.pricingType,
            installedAt: new Date().toISOString(),
          },
        }),
        isCustom: true,
      },
    });
  }

  /**
   * Swap out / switch active theme for website pages.
   */
  static async activateThemeForWebsite(tenantId: string, websiteId: string, themeId: string) {
    // 1. Verify website belongs to tenant
    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      throw new Error('Website not found');
    }

    // 2. Verify theme belongs to tenant or is global (tenantId === null)
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });
    if (!theme) {
      throw new Error('Theme not found');
    }

    // 3. Update website active themeId
    return await prisma.website.update({
      where: { id: websiteId },
      data: { themeId },
    });
  }

  /**
   * List installed and custom themes in the tenant space (including global themes).
   */
  static async listTenantThemes(tenantId: string) {
    return await prisma.theme.findMany({
      where: {
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Customize a theme settings profile (colors, typography, branding layouts).
   */
  static async customizeTheme(tenantId: string, themeId: string, customConfig: CustomizeThemeInput) {
    validateCustomization(customConfig);

    // 1. Find theme
    let theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!theme) {
      throw new Error('Customizable tenant theme not found');
    }

    if (theme.tenantId === null) {
      theme = await prisma.theme.create({
        data: {
          tenantId,
          name: `${theme.name} Custom`,
          settings: theme.settings || '{}',
          isCustom: true,
        },
      });

      await prisma.website.updateMany({
        where: { tenantId, themeId },
        data: { themeId: theme.id },
      });
    }

    // 2. Merge existing settings with updates
    let existingSettings: Record<string, any> = {};
    try {
      existingSettings = JSON.parse(theme.settings || '{}');
    } catch {
      existingSettings = {};
    }

    const updatedSettings = {
      ...existingSettings,
      ...customConfig,
      colors: {
        ...(existingSettings.colors || {}),
        ...(customConfig.colors || {}),
      },
      fonts: {
        ...(existingSettings.fonts || {}),
        ...(customConfig.fonts || {}),
      },
      logos: {
        ...(existingSettings.logos || {}),
        ...(customConfig.logos || {}),
      },
      layout: {
        ...(existingSettings.layout || {}),
        ...(customConfig.layout || {}),
      },
    };

    // 3. Save to database
    return await prisma.theme.update({
      where: { id: themeId },
      data: {
        settings: JSON.stringify(updatedSettings),
      },
    });
  }

  /**
   * Preview a theme config in temporary simulation staging context.
   */
  static async previewTheme(tenantId: string, themeId: string) {
    // Fetch theme
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    const settings = safeParseJson<Record<string, any>>(theme.settings, {});

    return {
      themeId: theme.id,
      name: theme.name,
      settings,
      version: settings.marketplace?.version || 'local',
      isPreview: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Staging preview temporary customization settings save.
   */
  static async customizePreview(tenantId: string, themeId: string, customConfig: CustomizeThemeInput) {
    // Return simulated styling variables merged, without modifying actual production theme
    const basePreview = await this.previewTheme(tenantId, themeId);
    
    const mergedSettings = {
      ...basePreview.settings,
      ...customConfig,
      colors: {
        ...(basePreview.settings.colors || {}),
        ...(customConfig.colors || {}),
      },
      fonts: {
        ...(basePreview.settings.fonts || {}),
        ...(customConfig.fonts || {}),
      },
      logos: {
        ...(basePreview.settings.logos || {}),
        ...(customConfig.logos || {}),
      },
      layout: {
        ...(basePreview.settings.layout || {}),
        ...(customConfig.layout || {}),
      },
    };

    return {
      themeId,
      settings: mergedSettings,
      isPreview: true,
      staging: true,
    };
  }

  /**
   * Register layout blocks / section templates (Developer).
   */
  static async registerSectionTemplate(tenantId: string, data: ThemeEngineTemplateInput) {
    const template = normalizeTemplate(data, 'section');
    // Store in settings config registry or inside theme-engine system configs
    const settings = await this.getSettings(tenantId);
    
    let config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    if (!config.sections) {
      config.sections = [];
    }

    // Check duplicate key
    const exists = [...this.defaultSectionTemplates(), ...config.sections].some((s: any) => s.key === template.key);
    if (exists) {
      throw new Error(`Section template with key '${template.key}' already registered`);
    }

    config.sections.push(template);

    await this.updateSettings(tenantId, { configJson: config });

    return {
      name: template.name,
      key: template.key,
      structure: template.structure,
    };
  }

  /**
   * List section templates available.
   */
  static async listSectionTemplates(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    return [...this.defaultSectionTemplates(), ...(config.sections || [])];
  }

  static async registerPageTemplate(tenantId: string, data: ThemeEngineTemplateInput) {
    const template = normalizeTemplate(data, 'page');
    const settings = await this.getSettings(tenantId);
    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    if (!config.pageTemplates) {
      config.pageTemplates = [];
    }

    const exists = [...this.defaultPageTemplates(), ...config.pageTemplates].some((s: any) => s.key === template.key);
    if (exists) {
      throw new Error(`Page template with key '${template.key}' already registered`);
    }

    config.pageTemplates.push(template);
    await this.updateSettings(tenantId, { configJson: config });

    return {
      name: template.name,
      key: template.key,
      structure: template.structure,
    };
  }

  static async listPageTemplates(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    return [...this.defaultPageTemplates(), ...(config.pageTemplates || [])];
  }

  private static defaultSectionTemplates() {
    return [
      { name: 'Hero Banner', key: 'hero-banner', type: 'section', structure: { title: 'string', subtitle: 'string', bgImage: 'string' } },
      { name: 'Feature Grid', key: 'feature-grid', type: 'section', structure: { items: 'array' } },
      { name: 'Sermon Player Widget', key: 'sermon-player', type: 'section', structure: { recentCount: 'number' } },
      { name: 'Giving Callout', key: 'giving-callout', type: 'section', structure: { title: 'string', campaignId: 'string', buttonLabel: 'string' } },
    ];
  }

  private static defaultPageTemplates() {
    return [
      { name: 'Home Page', key: 'home-page', type: 'page', structure: { sections: ['hero-banner', 'feature-grid', 'sermon-player'] } },
      { name: 'Ministry Landing Page', key: 'ministry-landing', type: 'page', structure: { sections: ['hero-banner', 'feature-grid', 'giving-callout'] } },
      { name: 'Event Landing Page', key: 'event-landing', type: 'page', structure: { sections: ['hero-banner', 'feature-grid'] } },
    ];
  }
}
