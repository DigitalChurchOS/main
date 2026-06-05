import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

const MODULE_KEY = 'developer-marketplace';
const VALID_STATUSES = new Set(['active', 'inactive']);
const VALID_VISIBILITIES = new Set(['public', 'private']);
const VALID_BILLING_PLANS = new Set(['free', 'premium', 'platform']);
const VALID_PROVIDER_MODES = new Set(['bring_your_own', 'platform_managed', 'marketplace']);

const DEFAULT_MARKETPLACE_CONFIG = {
  allowThirdPartyDevelopers: true,
  requireReviewForAssets: true,
  revenueShareSplit: 30,
  billingPlan: 'stripe_connect',
};

export interface DeveloperMarketplaceModuleInput {
  title: string;
  description?: string;
  visibility?: string;
  createdBy?: string | null;
}

export interface DeveloperMarketplaceSettingsInput {
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

export class DeveloperMarketplaceService {
  /**
   * Activate / Create a new Developer Marketplace module instance.
   */
  static async createDeveloperMarketplaceModule(tenantId: string, data: DeveloperMarketplaceModuleInput) {
    const title = requireNonEmptyString(data.title, 'title');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    return await prisma.developerMarketplaceModule.create({
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
  static async listDeveloperMarketplaceModules(tenantId: string) {
    return await prisma.developerMarketplaceModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single developer marketplace module configuration.
   */
  static async getDeveloperMarketplaceModule(id: string, tenantId: string) {
    const record = await prisma.developerMarketplaceModule.findFirst({
      where: { id, tenantId },
    });
    if (!record) {
      throw new Error('Developer marketplace module not found');
    }
    return record;
  }

  /**
   * Update developer marketplace module details.
   */
  static async updateDeveloperMarketplaceModule(
    id: string,
    tenantId: string,
    data: { title?: string; description?: string; status?: string; settingsJson?: any; visibility?: string }
  ) {
    const record = await this.getDeveloperMarketplaceModule(id, tenantId);
    assertAllowed(data.status, VALID_STATUSES, 'status');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    return await prisma.developerMarketplaceModule.update({
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
   * Delete developer marketplace module.
   */
  static async deleteDeveloperMarketplaceModule(id: string, tenantId: string) {
    const record = await this.getDeveloperMarketplaceModule(id, tenantId);
    return await prisma.developerMarketplaceModule.delete({
      where: { id: record.id },
    });
  }

  /**
   * Logs an action in the audit/activity trail.
   */
  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.developerMarketplaceModuleActivity.create({
      data: {
        tenantId,
        userId: userId || 'System',
        actionType,
        metadataJson: jsonString(metadata, {}),
      },
    });

    await trackEvent(tenantId, {
      category: 'developer_marketplace',
      name: actionType,
      entityId: metadata?.moduleId || metadata?.assetId || null,
      userId: userId || null,
      metadata,
    }).catch(() => undefined);

    return activity;
  }

  /**
   * Fetch all logged activities for audit.
   */
  static async listActivities(tenantId: string) {
    return await prisma.developerMarketplaceModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Fetch settings configurations.
   */
  static async getSettings(tenantId: string) {
    const record = await prisma.developerMarketplaceModuleSettings.findUnique({
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
        configJson: JSON.stringify(DEFAULT_MARKETPLACE_CONFIG),
      };
    }
    return record;
  }

  /**
   * Update billing plan/configurations.
   */
  static async updateSettings(tenantId: string, data: DeveloperMarketplaceSettingsInput) {
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
    assertAllowed(data.billingPlan, VALID_BILLING_PLANS, 'billingPlan');
    assertAllowed(data.providerMode, VALID_PROVIDER_MODES, 'providerMode');

    let normalizedConfig = data.configJson;
    if (normalizedConfig !== undefined) {
      const parsed = typeof normalizedConfig === 'string' ? safeParseJson(normalizedConfig, {}) : normalizedConfig;
      normalizedConfig = JSON.stringify({
        ...DEFAULT_MARKETPLACE_CONFIG,
        ...parsed,
      });
    }

    return await prisma.developerMarketplaceModuleSettings.upsert({
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
        configJson: normalizedConfig || JSON.stringify(DEFAULT_MARKETPLACE_CONFIG),
      },
    });
  }

  /**
   * Module overview for the central dashboard.
   */
  static async getOverview(tenantId: string) {
    const [
      moduleRecords,
      submissionsCount,
      activeSandboxCount,
      activities,
      settings,
      payoutsReport,
      submissionsList,
      sandboxList,
      purchasesList,
      assetsList
    ] = await Promise.all([
      prisma.developerMarketplaceModule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
      prisma.assetSubmission.count(),
      prisma.sandboxTenant.count(),
      prisma.developerMarketplaceModuleActivity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.getSettings(tenantId),
      prisma.assetPurchase.aggregate({
        where: { tenantId, status: 'completed' },
        _sum: {
          amountPaid: true,
          developerShare: true,
          platformShare: true,
        },
        _count: true,
      }),
      prisma.assetSubmission.findMany({
        include: {
          asset: {
            include: {
              developer: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.sandboxTenant.findMany({
        include: {
          developer: true,
          tenant: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.assetPurchase.findMany({
        include: {
          asset: true,
          tenant: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.marketplaceAsset.findMany({
        include: {
          developer: true
        },
        orderBy: { name: 'asc' }
      })
    ]);

    const salesVolume = payoutsReport._sum.amountPaid || 0;
    const developerVolume = payoutsReport._sum.developerShare || 0;
    const platformVolume = payoutsReport._sum.platformShare || 0;

    return {
      moduleKey: MODULE_KEY,
      settings,
      counts: {
        moduleProfiles: moduleRecords.length,
        assetSubmissions: submissionsCount,
        sandboxTenants: activeSandboxCount,
        purchasesCount: payoutsReport._count,
      },
      financials: {
        salesVolume,
        developerVolume,
        platformVolume,
      },
      recentActivity: activities,
      submissions: submissionsList,
      sandboxes: sandboxList,
      purchases: purchasesList,
      assets: assetsList
    };
  }
}
