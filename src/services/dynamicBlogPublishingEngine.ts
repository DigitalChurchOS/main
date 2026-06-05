import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

const MODULE_KEY = 'dynamic-blog-publishing-engine';
const VALID_STATUSES = new Set(['active', 'inactive']);
const VALID_VISIBILITIES = new Set(['public', 'private']);
const VALID_BILLING_PLANS = new Set(['free', 'premium', 'platform']);
const VALID_PROVIDER_MODES = new Set(['bring_your_own', 'platform_managed']);

const DEFAULT_CONFIG = {
  enableMultipleBlogs: true,
  enableComments: true,
  enableScheduledPosts: true,
  enableRevisions: true,
  enableMemberOnlyAccess: false,
};

export interface DynamicBlogModuleInput {
  title: string;
  description?: string;
  visibility?: string;
  createdBy?: string | null;
}

export interface DynamicBlogSettingsInput {
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

export class DynamicBlogPublishingEngineService {
  /**
   * Create a new Blog profile/channel.
   */
  static async createProfile(tenantId: string, createdBy: string | null, data: DynamicBlogModuleInput) {
    const title = requireNonEmptyString(data.title, 'title');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    const record = await prisma.dynamicBlogPublishingEngineModule.create({
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
   * List all blog profiles for the tenant.
   */
  static async listProfiles(tenantId: string) {
    return await prisma.dynamicBlogPublishingEngineModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single blog profile by ID (tenant-isolated).
   */
  static async getProfile(id: string, tenantId: string) {
    const record = await prisma.dynamicBlogPublishingEngineModule.findFirst({
      where: { id, tenantId },
    });
    if (!record) {
      throw new Error('Blog profile not found');
    }
    return record;
  }

  /**
   * Update a blog profile record.
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

    const updated = await prisma.dynamicBlogPublishingEngineModule.update({
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
   * Delete a blog profile record.
   */
  static async deleteProfile(id: string, tenantId: string, userId: string | null) {
    const record = await this.getProfile(id, tenantId);

    await prisma.dynamicBlogPublishingEngineModule.delete({
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
    const activity = await prisma.dynamicBlogPublishingEngineModuleActivity.create({
      data: {
        tenantId,
        userId: userId || 'System',
        actionType,
        metadataJson: jsonString(metadata, {}),
      },
    });

    await trackEvent(tenantId, {
      category: 'dynamic_blog_publishing_engine',
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
    return await prisma.dynamicBlogPublishingEngineModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get settings configurations of the module.
   */
  static async getSettings(tenantId: string) {
    const record = await prisma.dynamicBlogPublishingEngineModuleSettings.findUnique({
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
  static async updateSettings(tenantId: string, data: DynamicBlogSettingsInput) {
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

    return await prisma.dynamicBlogPublishingEngineModuleSettings.upsert({
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
   * Retrieve module overview content (consolidated stats).
   */
  static async getOverview(tenantId: string) {
    const [profiles, activities, settings] = await Promise.all([
      this.listProfiles(tenantId),
      this.listActivities(tenantId),
      this.getSettings(tenantId),
    ]);

    const categoriesCount = await prisma.blogCategory.count({ where: { tenantId } });
    const tagsCount = await prisma.blogTag.count({ where: { tenantId } });
    const postsCount = await prisma.blogPost.count({ where: { tenantId } });
    const commentsCount = await prisma.blogPostComment.count({ where: { tenantId } });
    const pendingCommentsCount = await prisma.blogPostComment.count({ where: { tenantId, status: 'pending' } });

    return {
      moduleKey: MODULE_KEY,
      settings,
      counts: {
        profilesCount: profiles.length,
        categoriesCount,
        tagsCount,
        postsCount,
        commentsCount,
        pendingCommentsCount,
        activitiesCount: activities.length,
      },
      recentActivity: activities.slice(0, 10),
      profiles,
    };
  }
}
