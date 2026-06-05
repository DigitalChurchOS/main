import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

const MODULE_KEY = 'domain-tenant-management';
const VALID_STATUSES = new Set(['active', 'inactive']);
const VALID_VISIBILITIES = new Set(['public', 'private']);
const VALID_BILLING_PLANS = new Set(['free', 'premium', 'platform']);
const VALID_PROVIDER_MODES = new Set(['bring_your_own', 'platform_managed', 'marketplace']);

const DEFAULT_CONFIG = {
  allowCustomDomains: true,
  requireDnsVerification: true,
  enableAutoSsl: true,
  defaultSubdomainSuffix: 'churchos.com',
};

export interface DomainTenantModuleInput {
  title: string;
  description?: string;
  visibility?: string;
  createdBy?: string | null;
}

export interface DomainTenantSettingsInput {
  enabled?: boolean;
  billingPlan?: string;
  providerMode?: string;
  configJson?: any;
}

function jsonString(value: any, fallback: any = {}): string {
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify({ value });
    }
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

function assertAllowed(value: string | undefined, allowed: Set<string>, label: string): void {
  if (value !== undefined && !allowed.has(value)) {
    throw new Error(`${label} must be one of: ${Array.from(allowed).join(', ')}`);
  }
}

export class DomainTenantManagementService {
  /**
   * Create a new Domain Tenant module profile record.
   */
  static async createProfile(tenantId: string, createdBy: string | null, data: DomainTenantModuleInput) {
    const title = requireNonEmptyString(data.title, 'title');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    const record = await prisma.domainTenantManagementModule.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        visibility: data.visibility || 'public',
        createdBy: createdBy || null,
        status: 'active',
      },
    });

    await this.logActivity(tenantId, createdBy || 'System', 'create_profile', {
      profileId: record.id,
      title,
    });

    return record;
  }

  /**
   * List all domain tenant profiles for the tenant.
   */
  static async listProfiles(tenantId: string) {
    return await prisma.domainTenantManagementModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single domain tenant profile by ID (tenant-isolated).
   */
  static async getProfile(id: string, tenantId: string) {
    const record = await prisma.domainTenantManagementModule.findFirst({
      where: { id, tenantId },
    });
    if (!record) {
      throw new Error('Domain tenant management profile not found');
    }
    return record;
  }

  /**
   * Update a domain tenant profile record.
   */
  static async updateProfile(
    id: string,
    tenantId: string,
    userId: string | null,
    data: { title?: string; description?: string; status?: string; settingsJson?: any; visibility?: string }
  ) {
    const record = await this.getProfile(id, tenantId);
    assertAllowed(data.status, VALID_STATUSES, 'status');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    const updated = await prisma.domainTenantManagementModule.update({
      where: { id: record.id },
      data: {
        ...(data.title !== undefined && { title: requireNonEmptyString(data.title, 'title') }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settingsJson !== undefined && { settingsJson: jsonString(data.settingsJson, {}) }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
      },
    });

    await this.logActivity(tenantId, userId || 'System', 'update_profile', {
      profileId: id,
      fieldsUpdated: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete a domain tenant profile record.
   */
  static async deleteProfile(id: string, tenantId: string, userId: string | null) {
    const record = await this.getProfile(id, tenantId);
    
    await prisma.domainTenantManagementModule.delete({
      where: { id: record.id },
    });

    await this.logActivity(tenantId, userId || 'System', 'delete_profile', {
      profileId: id,
      title: record.title,
    });

    return record;
  }

  /**
   * Logs an action in the audit log and registers an analytics event hook.
   */
  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.domainTenantManagementModuleActivity.create({
      data: {
        tenantId,
        userId: userId || 'System',
        actionType,
        metadataJson: jsonString(metadata, {}),
      },
    });

    await trackEvent(tenantId, {
      category: 'domain_tenant_management',
      name: actionType,
      entityId: metadata?.profileId || metadata?.moduleId || null,
      userId: userId || null,
      metadata,
    }).catch(() => undefined);

    return activity;
  }

  /**
   * Fetch logged activities for audit reports.
   */
  static async listActivities(tenantId: string) {
    return await prisma.domainTenantManagementModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get settings configurations of the module.
   */
  static async getSettings(tenantId: string) {
    const record = await prisma.domainTenantManagementModuleSettings.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: MODULE_KEY,
        },
      },
    });

    if (!record) {
      return {
        tenantId,
        moduleKey: MODULE_KEY,
        enabled: true,
        billingPlan: 'free',
        providerMode: 'bring_your_own',
        configJson: JSON.stringify(DEFAULT_CONFIG),
      };
    }
    return record;
  }

  /**
   * Update settings configuration of the module.
   */
  static async updateSettings(tenantId: string, data: DomainTenantSettingsInput) {
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
    assertAllowed(data.billingPlan, VALID_BILLING_PLANS, 'billingPlan');
    assertAllowed(data.providerMode, VALID_PROVIDER_MODES, 'providerMode');

    let normalizedConfig = data.configJson;
    if (normalizedConfig !== undefined) {
      const parsed = typeof normalizedConfig === 'string' ? safeParseJson(normalizedConfig, {}) : normalizedConfig;
      normalizedConfig = JSON.stringify({
        ...DEFAULT_CONFIG,
        ...parsed,
      });
    }

    return await prisma.domainTenantManagementModuleSettings.upsert({
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
        configJson: normalizedConfig || JSON.stringify(DEFAULT_CONFIG),
      },
    });
  }

  /**
   * Retrieves branding preferences and general tenant info.
   */
  static async getBranding(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subdomain: true, customDomain: true, status: true }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY }
      }
    });

    const defaultBranding = {
      logo: '',
      favicon: '',
      timezone: 'UTC',
      accent: '#4f46e5',
      language: 'en',
      description: '',
      phone: '',
      address: ''
    };

    let branding = defaultBranding;
    if (brandingRecord && brandingRecord.settings) {
      branding = { ...defaultBranding, ...safeParseJson(brandingRecord.settings, {}) };
    }

    return { tenant, branding };
  }

  /**
   * Updates church tenant name and customized branding presets.
   */
  static async updateBranding(
    tenantId: string,
    userId: string | null | undefined,
    data: { name?: string; logo?: string; favicon?: string; timezone?: string; accent?: string; language?: string; description?: string; phone?: string; address?: string }
  ) {
    if (data.name) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { name: data.name }
      });
    }

    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY }
      }
    });

    let currentSettings = {};
    if (brandingRecord && brandingRecord.settings) {
      currentSettings = safeParseJson(brandingRecord.settings, {});
    }

    const updatedSettings = {
      ...currentSettings,
      ...(data.logo !== undefined && { logo: data.logo }),
      ...(data.favicon !== undefined && { favicon: data.favicon }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.accent !== undefined && { accent: data.accent }),
      ...(data.language !== undefined && { language: data.language }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address })
    };

    await prisma.moduleSettings.upsert({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY }
      },
      create: {
        tenantId,
        moduleKey: MODULE_KEY,
        settings: JSON.stringify(updatedSettings)
      },
      update: {
        settings: JSON.stringify(updatedSettings)
      }
    });

    await this.logActivity(tenantId, userId, 'update_branding', updatedSettings);

    return { name: data.name, branding: updatedSettings };
  }

  /**
   * Retrieves subdomain, customDomain, instructions, and SSL status mappings.
   */
  static async getDomain(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subdomain: true, customDomain: true }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true }
    });

    const dnsStatus = tenant.customDomain ? {
      verified: true,
      sslStatus: 'active',
      aRecordMatch: true,
      cnameRecordMatch: true
    } : {
      verified: false,
      sslStatus: 'none',
      aRecordMatch: false,
      cnameRecordMatch: false
    };

    return {
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain || primaryWebsite?.domain || null,
      dnsStatus,
      instructions: {
        ip: '76.76.21.21',
        cname: 'cname.churchos.com'
      }
    };
  }

  /**
   * Updates custom domain on both Tenant and Website records.
   */
  static async updateDomain(tenantId: string, userId: string | null | undefined, customDomain: string | null) {
    const domainName = customDomain ? customDomain.trim().toLowerCase() : null;

    if (domainName) {
      const duplicate = await prisma.tenant.findFirst({
        where: {
          id: { not: tenantId },
          customDomain: domainName
        }
      });
      if (duplicate) {
        throw new Error('This custom domain is already registered to another tenant.');
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { customDomain: domainName }
    });

    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true }
    });

    if (primaryWebsite) {
      await prisma.website.update({
        where: { id: primaryWebsite.id },
        data: { domain: domainName }
      });
    }

    await this.logActivity(tenantId, userId, 'update_domain', { customDomain: domainName });

    return {
      subdomain: updatedTenant.subdomain,
      customDomain: updatedTenant.customDomain
    };
  }

  /**
   * Simulated DNS and SSL verification lookup check.
   */
  static async verifyDomain(tenantId: string, userId: string | null | undefined) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant || !tenant.customDomain) {
      throw new Error('Configure a custom domain first before running verification check.');
    }

    const success = true;

    await this.logActivity(tenantId, userId, 'verify_domain', {
      customDomain: tenant.customDomain,
      verified: success
    });

    return {
      verified: success,
      sslStatus: success ? 'active' : 'failed',
      aRecordMatch: success,
      cnameRecordMatch: success,
      lastChecked: new Date().toISOString()
    };
  }

  /**
   * Lists all module definitions along with their subscription/activation status.
   */
  static async getModules(tenantId: string) {
    const definitions = await prisma.moduleDefinition.findMany({
      orderBy: { key: 'asc' }
    });

    const activeModules = await prisma.tenantModule.findMany({
      where: { tenantId }
    });

    const activeMap = new Map(activeModules.map(m => [m.moduleKey, m]));

    return definitions.map(def => {
      const active = activeMap.get(def.key);
      return {
        key: def.key,
        name: def.name,
        category: def.category,
        dependencies: safeParseJson(def.dependencies, []),
        status: active ? active.status : 'inactive',
        billingRule: active ? active.billingRule : 'free'
      };
    });
  }

  /**
   * Toggles status between active and suspended / inactive.
   */
  static async updateModuleStatus(tenantId: string, userId: string | null | undefined, moduleKey: string, status: string) {
    if (!['active', 'suspended', 'inactive'].includes(status)) {
      throw new Error('Invalid target module status');
    }

    if (status === 'inactive') {
      try {
        await prisma.tenantModule.delete({
          where: { tenantId_moduleKey: { tenantId, moduleKey } }
        });
      } catch (e) {
        // ignore
      }
      
      await this.logActivity(tenantId, userId, 'module_deactivate', { moduleKey });
      
      return { moduleKey, status: 'inactive' };
    }

    const record = await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      create: {
        tenantId,
        moduleKey,
        status,
        billingRule: 'free'
      },
      update: {
        status
      }
    });

    await this.logActivity(tenantId, userId, status === 'active' ? 'module_activate' : 'module_suspend', { moduleKey });

    return record;
  }

  /**
   * Calculates the onboarding launch progress checklist checkpoints.
   */
  static async getChecklist(tenantId: string) {
    // 1. Domain Setup
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { customDomain: true }
    });
    const domainSetup = !!tenant?.customDomain;

    // 2. Branding Customized
    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY }
      }
    });
    let brandingSetup = false;
    if (brandingRecord && brandingRecord.settings) {
      const parsed = safeParseJson<any>(brandingRecord.settings, {});
      brandingSetup = !!(parsed.logo || parsed.favicon || parsed.timezone !== 'UTC' || parsed.accent !== '#4f46e5');
    }

    // 3. Module Activated (Website CMS + at least one other module)
    const moduleCount = await prisma.tenantModule.count({
      where: {
        tenantId,
        status: 'active'
      }
    });
    const moduleRegistry = moduleCount > 1;

    // 4. Team Invited
    const inviteCount = await prisma.user.count({
      where: {
        tenantId,
        status: 'invited'
      }
    });
    const userCount = await prisma.user.count({
      where: { tenantId }
    });
    const inviteTeam = inviteCount > 0 || userCount > 1;

    return {
      domainSetup,
      brandingSetup,
      moduleRegistry,
      inviteTeam
    };
  }

  /**
   * Module overview for the central dashboard.
   */
  static async getOverview(tenantId: string) {
    const [profiles, activities, settings, checklist, domain, branding] = await Promise.all([
      this.listProfiles(tenantId),
      this.listActivities(tenantId),
      this.getSettings(tenantId),
      this.getChecklist(tenantId),
      this.getDomain(tenantId),
      this.getBranding(tenantId),
    ]);

    const activeModules = await prisma.tenantModule.count({
      where: { tenantId, status: 'active' }
    });

    return {
      moduleKey: MODULE_KEY,
      settings,
      checklist,
      domain,
      branding: branding.branding,
      counts: {
        profilesCount: profiles.length,
        activeModules,
        activitiesCount: activities.length,
      },
      recentActivity: activities.slice(0, 10),
      profiles,
    };
  }
}
