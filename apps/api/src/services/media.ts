import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

export const MEDIA_MODULE_KEY = 'media';

const DEFAULT_CONFIG = {
  enablePlatformHosting: true,
  enableExternalEmbeds: true,
  enableShortClips: true,
  enableImageGalleries: true,
  enableDownloads: true,
  enableAutoTranscripts: true,
  defaultVisibility: 'public',
  defaultStatus: 'draft',
  defaultStreamingQuality: '720p',
  maxUploadSizeMb: 500,
  monthlyStorageGbLimit: 100,
  monthlyBandwidthGbLimit: 250,
  defaultStorageProvider: 'platform',
  providerMode: 'hybrid',
  publishRequiresThumbnail: false,
  allowedExternalProviders: ['youtube', 'vimeo', 'cloudinary', 'aws_s3', 'cloudflare_r2', 'mux'],
};

const STATUSES = new Set(['draft', 'processing', 'published', 'archived']);
const MODULE_STATUSES = new Set(['active', 'inactive', 'archived']);
const TYPES = new Set(['video', 'audio', 'image', 'gallery', 'short_clip', 'document', 'download', 'worship']);
const VISIBILITIES = new Set(['public', 'members_only', 'leaders_only', 'private', 'unlisted']);
const PROVIDER_TYPES = new Set(['platform_managed', 'external_link', 'bring_your_own']);
const PROVIDER_KEYS = new Set(['platform', 'youtube', 'vimeo', 'cloudinary', 'aws_s3', 'cloudflare_r2', 'bunny_storage', 'mux', 'wasabi', 'backblaze_b2', 'external']);
const BILLING_PLANS = new Set(['free', 'premium', 'platform', 'metered']);
const PROVIDER_MODES = new Set(['platform_managed', 'bring_your_own', 'hybrid']);

export interface MediaModuleInput {
  title: string;
  description?: string;
  visibility?: string;
  settingsJson?: any;
  createdBy?: string | null;
}

export interface MediaSettingsInput {
  enabled?: boolean;
  billingPlan?: string;
  providerMode?: string;
  configJson?: any;
}

export interface AssetInput {
  title: string;
  description?: string;
  type: string;
  providerType?: string;
  providerKey?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  categoryId?: string | null;
  seriesId?: string | null;
  seriesOrder?: number | null;
  speakerId?: string | null;
  visibility?: string;
  status?: string;
  parentAssetId?: string | null;
  clipStartSeconds?: number | null;
  clipEndSeconds?: number | null;
}

export interface AssetFilters {
  categoryId?: string;
  seriesId?: string;
  speakerId?: string;
  tagIds?: string[];
  type?: string;
  status?: string;
  visibility?: string;
  providerKey?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringify(value: any, fallback: any = {}) {
  if (typeof value === 'string') {
    JSON.parse(value);
    return value;
  }
  return JSON.stringify(value ?? fallback);
}

function required(value: unknown, label: string) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is required`);
  return value.trim();
}

function allowed(value: string | undefined, set: Set<string>, label: string) {
  if (value !== undefined && !set.has(value)) throw new Error(`${label} must be one of: ${Array.from(set).join(', ')}`);
}

function urlLike(value: string | null | undefined, label: string) {
  if (!value) return;
  if (value.startsWith('/')) return;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error(`${label} must be a valid http(s) URL or site-relative path`);
  }
}

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('name must contain letters or numbers');
  return slug;
}

function normalizeStatus(status?: string) {
  return status === 'ready' ? 'published' : status;
}

function providerFromUrl(sourceUrl?: string | null) {
  const url = (sourceUrl || '').toLowerCase();
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('cloudinary.com')) return 'cloudinary';
  if (url.includes('mux.com') || url.includes('mux.dev')) return 'mux';
  return undefined;
}

function normalizeProvider(data: Pick<AssetInput, 'providerType' | 'providerKey' | 'sourceUrl'>) {
  let providerType = data.providerType || 'platform_managed';
  let providerKey = data.providerKey || providerFromUrl(data.sourceUrl);

  if (['youtube', 'vimeo'].includes(providerType)) {
    providerKey = providerType;
    providerType = 'external_link';
  }
  if (providerType === 's3') {
    providerType = 'bring_your_own';
    providerKey = 'aws_s3';
  }
  if (['cloudinary', 'aws_s3', 'cloudflare_r2', 'bunny_storage', 'mux', 'wasabi', 'backblaze_b2'].includes(providerType)) {
    providerKey = providerType;
    providerType = 'bring_your_own';
  }
  if (providerType === 'platform_managed') providerKey = providerKey || 'platform';
  if (providerType === 'external_link') providerKey = providerKey || 'external';

  allowed(providerType, PROVIDER_TYPES, 'providerType');
  allowed(providerKey, PROVIDER_KEYS, 'providerKey');
  return { providerType, providerKey };
}

async function uniqueSlug(model: 'category' | 'tag', tenantId: string, name: string) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = model === 'category'
      ? await prisma.mediaCategory.findFirst({ where: { tenantId, slug: candidate } })
      : await prisma.mediaTag.findFirst({ where: { tenantId, slug: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function normalizedConfig(value: any) {
  const raw = typeof value === 'string' ? parseJson<Record<string, any>>(value, {}) : (value || {});
  const merged = {
    ...DEFAULT_CONFIG,
    ...raw,
    maxUploadSizeMb: Number(raw.maxUploadSizeMb ?? DEFAULT_CONFIG.maxUploadSizeMb),
    monthlyStorageGbLimit: Number(raw.monthlyStorageGbLimit ?? DEFAULT_CONFIG.monthlyStorageGbLimit),
    monthlyBandwidthGbLimit: Number(raw.monthlyBandwidthGbLimit ?? DEFAULT_CONFIG.monthlyBandwidthGbLimit),
    allowedExternalProviders: Array.isArray(raw.allowedExternalProviders) ? raw.allowedExternalProviders : DEFAULT_CONFIG.allowedExternalProviders,
  };
  allowed(merged.defaultVisibility, VISIBILITIES, 'configJson.defaultVisibility');
  allowed(merged.defaultStatus, STATUSES, 'configJson.defaultStatus');
  allowed(merged.providerMode, PROVIDER_MODES, 'configJson.providerMode');
  if (merged.maxUploadSizeMb <= 0) throw new Error('configJson.maxUploadSizeMb must be greater than zero');
  return JSON.stringify(merged);
}

export class MediaService {
  private static includeAsset() {
    return {
      category: true,
      series: true,
      speaker: true,
      assetTags: { include: { tag: true } },
      clips: true,
      mediaCaptions: true,
    };
  }

  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.mediaModuleActivity.create({
      data: { tenantId, userId: userId || null, actionType, metadataJson: stringify(metadata) },
    });
    await trackEvent(tenantId, {
      category: 'media',
      name: actionType,
      entityId: metadata.assetId || metadata.recordId || metadata.playlistId || metadata.seriesId || null,
      value: metadata.value ?? null,
      userId: userId || null,
      metadata,
    }).catch(() => undefined);
    return activity;
  }

  static async listActivities(tenantId: string, options: { actionType?: string; limit?: number } = {}) {
    return prisma.mediaModuleActivity.findMany({
      where: { tenantId, ...(options.actionType ? { actionType: options.actionType } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(options.limit || 100, 1), 250),
    });
  }

  static async createModuleRecord(tenantId: string, data: MediaModuleInput, userId?: string | null) {
    const title = required(data.title, 'title');
    allowed(data.visibility, VISIBILITIES, 'visibility');
    const record = await prisma.mediaModule.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        visibility: data.visibility || 'private',
        settingsJson: data.settingsJson !== undefined ? stringify(data.settingsJson) : '{}',
        createdBy: data.createdBy || userId || null,
      },
    });
    await this.logActivity(tenantId, userId, 'module_record_created', { recordId: record.id, title });
    return record;
  }

  static async listModuleRecords(tenantId: string) {
    return prisma.mediaModule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  static async getModuleRecord(id: string, tenantId: string) {
    const record = await prisma.mediaModule.findFirst({ where: { id, tenantId } });
    if (!record) throw new Error('Media module record not found');
    return record;
  }

  static async updateModuleRecord(id: string, tenantId: string, data: Partial<MediaModuleInput> & { status?: string }, userId?: string | null) {
    const existing = await this.getModuleRecord(id, tenantId);
    allowed(data.status, MODULE_STATUSES, 'status');
    allowed(data.visibility, VISIBILITIES, 'visibility');
    const record = await prisma.mediaModule.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined && { title: required(data.title, 'title') }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.settingsJson !== undefined && { settingsJson: stringify(data.settingsJson) }),
      },
    });
    await this.logActivity(tenantId, userId, 'module_record_updated', { recordId: record.id, fields: Object.keys(data) });
    return record;
  }

  static async deleteModuleRecord(id: string, tenantId: string, userId?: string | null) {
    const existing = await this.getModuleRecord(id, tenantId);
    const record = await prisma.mediaModule.update({ where: { id: existing.id }, data: { status: 'archived' } });
    await this.logActivity(tenantId, userId, 'module_record_archived', { recordId: record.id, title: record.title });
    return record;
  }

  static async getSettings(tenantId: string) {
    const settings = await prisma.mediaModuleSettings.findUnique({ where: { tenantId_moduleKey: { tenantId, moduleKey: MEDIA_MODULE_KEY } } });
    return settings || { id: 'default', tenantId, moduleKey: MEDIA_MODULE_KEY, enabled: true, billingPlan: 'free', providerMode: 'hybrid', configJson: JSON.stringify(DEFAULT_CONFIG), updatedAt: new Date() };
  }

  static async updateSettings(tenantId: string, data: MediaSettingsInput, userId?: string | null) {
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') throw new Error('enabled must be a boolean');
    allowed(data.billingPlan, BILLING_PLANS, 'billingPlan');
    allowed(data.providerMode, PROVIDER_MODES, 'providerMode');
    const current = await this.getSettings(tenantId);
    const currentConfig = parseJson<Record<string, any>>(current.configJson, DEFAULT_CONFIG);
    const incoming = typeof data.configJson === 'string' ? parseJson<Record<string, any>>(data.configJson, {}) : (data.configJson || {});
    const configJson = data.configJson !== undefined ? normalizedConfig({ ...currentConfig, ...incoming, ...(data.providerMode ? { providerMode: data.providerMode } : {}) }) : undefined;
    const settings = await prisma.mediaModuleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: MEDIA_MODULE_KEY } },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.billingPlan !== undefined && { billingPlan: data.billingPlan }),
        ...(data.providerMode !== undefined && { providerMode: data.providerMode }),
        ...(configJson !== undefined && { configJson }),
      },
      create: {
        tenantId,
        moduleKey: MEDIA_MODULE_KEY,
        enabled: data.enabled ?? true,
        billingPlan: data.billingPlan || 'free',
        providerMode: data.providerMode || 'hybrid',
        configJson: configJson || JSON.stringify(DEFAULT_CONFIG),
      },
    });
    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: MEDIA_MODULE_KEY } },
      update: { settings: settings.configJson },
      create: { tenantId, moduleKey: MEDIA_MODULE_KEY, settings: settings.configJson },
    });
    await this.logActivity(tenantId, userId, 'settings_updated', { fields: Object.keys(data), providerMode: settings.providerMode });
    return settings;
  }

  static async createCategory(tenantId: string, data: { name: string; parentId?: string | null }, userId?: string | null) {
    const name = required(data.name, 'name');
    if (data.parentId && !(await prisma.mediaCategory.findFirst({ where: { id: data.parentId, tenantId } }))) throw new Error('Parent category not found');
    const category = await prisma.mediaCategory.create({ data: { tenantId, name, slug: await uniqueSlug('category', tenantId, name), parentId: data.parentId || null }, include: { parent: true, children: true } });
    await this.logActivity(tenantId, userId, 'category_created', { categoryId: category.id, name });
    return category;
  }

  static listCategories(tenantId: string) {
    return prisma.mediaCategory.findMany({ where: { tenantId }, include: { children: true }, orderBy: { name: 'asc' } });
  }

  static async createTag(tenantId: string, data: { name: string }, userId?: string | null) {
    const name = required(data.name, 'name');
    const tag = await prisma.mediaTag.create({ data: { tenantId, name, slug: await uniqueSlug('tag', tenantId, name) } });
    await this.logActivity(tenantId, userId, 'tag_created', { tagId: tag.id, name });
    return tag;
  }

  static listTags(tenantId: string) {
    return prisma.mediaTag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  static async createSpeaker(tenantId: string, data: { name: string; title?: string; bio?: string; photoUrl?: string }, userId?: string | null) {
    const name = required(data.name, 'name');
    urlLike(data.photoUrl, 'photoUrl');
    const speaker = await prisma.speaker.create({ data: { tenantId, name, title: data.title || null, bio: data.bio || null, photoUrl: data.photoUrl || null } });
    await this.logActivity(tenantId, userId, 'speaker_created', { speakerId: speaker.id, name });
    return speaker;
  }

  static listSpeakers(tenantId: string) {
    return prisma.speaker.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  static async updateSpeaker(id: string, tenantId: string, data: { name?: string; title?: string; bio?: string; photoUrl?: string }, userId?: string | null) {
    const existing = await prisma.speaker.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Speaker not found');
    if (data.photoUrl !== undefined) urlLike(data.photoUrl, 'photoUrl');
    const speaker = await prisma.speaker.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined && { name: required(data.name, 'name') }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    });
    await this.logActivity(tenantId, userId, 'speaker_updated', { speakerId: speaker.id, fields: Object.keys(data) });
    return speaker;
  }

  static async createSeries(tenantId: string, data: { title: string; description?: string; coverImageUrl?: string }, userId?: string | null) {
    const title = required(data.title, 'title');
    urlLike(data.coverImageUrl, 'coverImageUrl');
    const series = await prisma.mediaSeries.create({ data: { tenantId, title, description: data.description || null, coverImageUrl: data.coverImageUrl || null } });
    await this.logActivity(tenantId, userId, 'series_created', { seriesId: series.id, title });
    return series;
  }

  static listSeries(tenantId: string) {
    return prisma.mediaSeries.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  private static async validateAssetRelations(tenantId: string, data: Partial<AssetInput>) {
    if (data.categoryId && !(await prisma.mediaCategory.findFirst({ where: { id: data.categoryId, tenantId } }))) throw new Error('Category not found');
    if (data.seriesId && !(await prisma.mediaSeries.findFirst({ where: { id: data.seriesId, tenantId } }))) throw new Error('Series not found');
    if (data.speakerId && !(await prisma.speaker.findFirst({ where: { id: data.speakerId, tenantId } }))) throw new Error('Speaker not found');
    if (data.parentAssetId && !(await prisma.mediaAsset.findFirst({ where: { id: data.parentAssetId, tenantId } }))) throw new Error('Parent media asset not found');
  }

  static async createAsset(tenantId: string, data: AssetInput, userId?: string | null) {
    const title = required(data.title, 'title');
    const type = required(data.type, 'type');
    allowed(type, TYPES, 'type');
    const settings = await this.getSettings(tenantId);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    if (!settings.enabled) throw new Error('Media Module is disabled for this tenant');
    const provider = normalizeProvider(data);
    const status = normalizeStatus(data.status) || config.defaultStatus || 'draft';
    const visibility = data.visibility || config.defaultVisibility || 'public';
    allowed(status, STATUSES, 'status');
    allowed(visibility, VISIBILITIES, 'visibility');
    urlLike(data.sourceUrl, 'sourceUrl');
    urlLike(data.thumbnailUrl, 'thumbnailUrl');
    if (provider.providerType === 'platform_managed' && config.enablePlatformHosting === false) throw new Error('Platform-managed hosting is disabled');
    if (provider.providerType === 'external_link' && config.enableExternalEmbeds === false) throw new Error('External media embeds are disabled');
    if (provider.providerType !== 'platform_managed' && !data.sourceUrl) throw new Error('sourceUrl is required for external or church-owned provider media');
    if (status === 'published' && config.publishRequiresThumbnail && !data.thumbnailUrl) throw new Error('A thumbnail is required before publishing');
    if (data.fileSizeBytes !== undefined && data.fileSizeBytes < 0) throw new Error('fileSizeBytes cannot be negative');
    if (data.durationSeconds !== undefined && data.durationSeconds < 0) throw new Error('durationSeconds cannot be negative');
    await this.validateAssetRelations(tenantId, data);
    const asset = await prisma.mediaAsset.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        type,
        providerType: provider.providerType,
        providerKey: provider.providerKey,
        sourceUrl: data.sourceUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
        durationSeconds: data.durationSeconds ?? null,
        fileSizeBytes: data.fileSizeBytes ?? null,
        mimeType: data.mimeType || null,
        categoryId: data.categoryId || null,
        seriesId: data.seriesId || null,
        seriesOrder: data.seriesOrder ?? null,
        speakerId: data.speakerId || null,
        visibility,
        status,
        publishedAt: status === 'published' ? new Date() : null,
        parentAssetId: data.parentAssetId || null,
        clipStartSeconds: data.clipStartSeconds ?? null,
        clipEndSeconds: data.clipEndSeconds ?? null,
      },
      include: this.includeAsset(),
    });
    await this.logActivity(tenantId, userId, 'asset_created', { assetId: asset.id, title, type, providerType: asset.providerType, providerKey: asset.providerKey, status });
    return asset;
  }

  static async getAsset(id: string, tenantId: string) {
    const asset = await prisma.mediaAsset.findFirst({ where: { id, tenantId }, include: this.includeAsset() });
    if (!asset) throw new Error('Media asset not found');
    return asset;
  }

  static async listAssets(tenantId: string, filters: AssetFilters = {}) {
    const page = Math.max(Number(filters.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(filters.pageSize || 20), 1), 100);
    const where: any = { tenantId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.seriesId) where.seriesId = filters.seriesId;
    if (filters.speakerId) where.speakerId = filters.speakerId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = normalizeStatus(filters.status);
    if (filters.visibility) where.visibility = filters.visibility;
    if (filters.providerKey) where.providerKey = filters.providerKey;
    if (filters.search) where.OR = [{ title: { contains: filters.search } }, { description: { contains: filters.search } }];
    if (filters.tagIds?.length) where.assetTags = { some: { tagId: { in: filters.tagIds } } };
    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({ where, include: this.includeAsset(), orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.mediaAsset.count({ where }),
    ]);
    return { assets, total, page, pageSize };
  }

  static async updateAsset(id: string, tenantId: string, data: Partial<AssetInput>, userId?: string | null) {
    const existing = await this.getAsset(id, tenantId);
    await this.validateAssetRelations(tenantId, data);
    const update: any = {};
    if (data.title !== undefined) update.title = required(data.title, 'title');
    if (data.description !== undefined) update.description = data.description;
    if (data.type !== undefined) { allowed(data.type, TYPES, 'type'); update.type = data.type; }
    if (data.providerType !== undefined || data.providerKey !== undefined) Object.assign(update, normalizeProvider({ providerType: data.providerType || existing.providerType, providerKey: data.providerKey || existing.providerKey || undefined, sourceUrl: data.sourceUrl || existing.sourceUrl || undefined }));
    if (data.sourceUrl !== undefined) { urlLike(data.sourceUrl, 'sourceUrl'); update.sourceUrl = data.sourceUrl; }
    if (data.thumbnailUrl !== undefined) { urlLike(data.thumbnailUrl, 'thumbnailUrl'); update.thumbnailUrl = data.thumbnailUrl; }
    if (data.durationSeconds !== undefined) update.durationSeconds = data.durationSeconds;
    if (data.fileSizeBytes !== undefined) update.fileSizeBytes = data.fileSizeBytes;
    if (data.mimeType !== undefined) update.mimeType = data.mimeType;
    if (data.categoryId !== undefined) update.categoryId = data.categoryId;
    if (data.seriesId !== undefined) update.seriesId = data.seriesId;
    if (data.seriesOrder !== undefined) update.seriesOrder = data.seriesOrder;
    if (data.speakerId !== undefined) update.speakerId = data.speakerId;
    if (data.visibility !== undefined) { allowed(data.visibility, VISIBILITIES, 'visibility'); update.visibility = data.visibility; }
    if (data.status !== undefined) {
      const status = normalizeStatus(data.status);
      allowed(status, STATUSES, 'status');
      update.status = status;
      if (status === 'published' && existing.status !== 'published') update.publishedAt = new Date();
    }
    if (data.parentAssetId !== undefined) update.parentAssetId = data.parentAssetId;
    if (data.clipStartSeconds !== undefined) update.clipStartSeconds = data.clipStartSeconds;
    if (data.clipEndSeconds !== undefined) update.clipEndSeconds = data.clipEndSeconds;
    const settings = await this.getSettings(tenantId);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    if ((update.status || existing.status) === 'published' && config.publishRequiresThumbnail && !(data.thumbnailUrl ?? existing.thumbnailUrl)) throw new Error('A thumbnail is required before publishing');
    const asset = await prisma.mediaAsset.update({ where: { id: existing.id }, data: update, include: this.includeAsset() });
    await this.logActivity(tenantId, userId, 'asset_updated', { assetId: asset.id, fields: Object.keys(data), status: asset.status });
    return asset;
  }

  static async deleteAsset(id: string, tenantId: string, userId?: string | null) {
    const existing = await this.getAsset(id, tenantId);
    const asset = await prisma.mediaAsset.update({ where: { id: existing.id }, data: { status: 'archived' }, include: this.includeAsset() });
    await this.logActivity(tenantId, userId, 'asset_archived', { assetId: asset.id, title: asset.title });
    return asset;
  }

  static async tagAsset(assetId: string, tenantId: string, tagIds: string[], userId?: string | null) {
    await this.getAsset(assetId, tenantId);
    const tags = await prisma.mediaTag.findMany({ where: { tenantId, id: { in: tagIds } } });
    if (tags.length !== tagIds.length) throw new Error('One or more tags were not found');
    for (const tagId of tagIds) await prisma.mediaAssetTag.upsert({ where: { assetId_tagId: { assetId, tagId } }, create: { assetId, tagId }, update: {} });
    await this.logActivity(tenantId, userId, 'asset_tagged', { assetId, tagIds });
    return prisma.mediaAssetTag.findMany({ where: { assetId }, include: { tag: true } });
  }

  static async untagAsset(assetId: string, tenantId: string, tagIds: string[], userId?: string | null) {
    await this.getAsset(assetId, tenantId);
    const result = await prisma.mediaAssetTag.deleteMany({ where: { assetId, tagId: { in: tagIds } } });
    await this.logActivity(tenantId, userId, 'asset_untagged', { assetId, tagIds, count: result.count });
    return result;
  }

  static async createPlaylist(tenantId: string, data: { name: string; description?: string; coverImageUrl?: string; isPublic?: boolean }, userId?: string | null) {
    const name = required(data.name, 'name');
    urlLike(data.coverImageUrl, 'coverImageUrl');
    const playlist = await prisma.mediaPlaylist.create({ data: { tenantId, name, description: data.description || null, coverImageUrl: data.coverImageUrl || null, isPublic: data.isPublic ?? true } });
    await this.logActivity(tenantId, userId, 'playlist_created', { playlistId: playlist.id, name });
    return playlist;
  }

  static listPlaylists(tenantId: string) {
    return prisma.mediaPlaylist.findMany({ where: { tenantId }, include: { _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' } });
  }

  static async addToPlaylist(playlistId: string, tenantId: string, assetId: string, order = 0, userId?: string | null) {
    const [playlist, asset] = await Promise.all([prisma.mediaPlaylist.findFirst({ where: { id: playlistId, tenantId } }), prisma.mediaAsset.findFirst({ where: { id: assetId, tenantId } })]);
    if (!playlist) throw new Error('Playlist not found');
    if (!asset) throw new Error('Media asset not found');
    const item = await prisma.mediaPlaylistItem.upsert({ where: { playlistId_assetId: { playlistId, assetId } }, create: { playlistId, assetId, order }, update: { order }, include: { asset: true } });
    await this.logActivity(tenantId, userId, 'playlist_item_added', { playlistId, assetId, order });
    return item;
  }

  static async removeFromPlaylist(playlistId: string, tenantId: string, assetId: string, userId?: string | null) {
    if (!(await prisma.mediaPlaylist.findFirst({ where: { id: playlistId, tenantId } }))) throw new Error('Playlist not found');
    await this.getAsset(assetId, tenantId);
    const result = await prisma.mediaPlaylistItem.deleteMany({ where: { playlistId, assetId } });
    await this.logActivity(tenantId, userId, 'playlist_item_removed', { playlistId, assetId, count: result.count });
    return result;
  }

  static async getPlaylistItems(playlistId: string, tenantId: string) {
    if (!(await prisma.mediaPlaylist.findFirst({ where: { id: playlistId, tenantId } }))) throw new Error('Playlist not found');
    return prisma.mediaPlaylistItem.findMany({ where: { playlistId }, include: { asset: { include: { speaker: true, category: true } } }, orderBy: { order: 'asc' } });
  }

  static async getTemplates(tenantId: string) {
    const [categories, tags, series, playlists, speakers] = await Promise.all([this.listCategories(tenantId), this.listTags(tenantId), this.listSeries(tenantId), this.listPlaylists(tenantId), this.listSpeakers(tenantId)]);
    return { categories, tags, series, playlists, speakers };
  }

  static async getOverview(tenantId: string) {
    const [assetResult, records, categories, tags, series, playlists, speakers, settings, activity, allAssets] = await Promise.all([
      this.listAssets(tenantId, { pageSize: 8 }),
      this.listModuleRecords(tenantId),
      prisma.mediaCategory.count({ where: { tenantId } }),
      prisma.mediaTag.count({ where: { tenantId } }),
      prisma.mediaSeries.count({ where: { tenantId } }),
      prisma.mediaPlaylist.count({ where: { tenantId } }),
      prisma.speaker.count({ where: { tenantId } }),
      this.getSettings(tenantId),
      this.listActivities(tenantId, { limit: 10 }),
      prisma.mediaAsset.findMany({ where: { tenantId } }),
    ]);
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const providerModes: Record<string, number> = {};
    let storageBytes = 0;
    for (const asset of allAssets) {
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
      byType[asset.type] = (byType[asset.type] || 0) + 1;
      providerModes[asset.providerKey || asset.providerType] = (providerModes[asset.providerKey || asset.providerType] || 0) + 1;
      storageBytes += Number(asset.fileSizeBytes || 0);
    }
    return {
      moduleKey: MEDIA_MODULE_KEY,
      settings,
      counts: { moduleRecords: records.length, assets: allAssets.length, published: byStatus.published || 0, draft: byStatus.draft || 0, archived: byStatus.archived || 0, categories, tags, series, playlists, speakers },
      usage: { storageBytes, storageGb: Number((storageBytes / 1024 / 1024 / 1024).toFixed(2)), providerModes },
      breakdowns: { byStatus, byType },
      recentAssets: assetResult.assets,
      recentActivity: activity,
    };
  }

  static async getReports(tenantId: string) {
    const [overview, events, activity] = await Promise.all([
      this.getOverview(tenantId),
      prisma.analyticsEvent.findMany({ where: { tenantId, category: 'media' }, orderBy: { createdAt: 'desc' }, take: 250 }),
      this.listActivities(tenantId, { limit: 100 }),
    ]);
    const eventCounts: Record<string, number> = {};
    for (const event of events) eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    return {
      summary: { assets: overview.counts.assets, published: overview.counts.published, storageGb: overview.usage.storageGb, plays: eventCounts.play || eventCounts.playback_requested || 0, downloads: eventCounts.download || 0, activityCount: activity.length },
      eventCounts,
      providerModes: overview.usage.providerModes,
      byStatus: overview.breakdowns.byStatus,
      byType: overview.breakdowns.byType,
      recentActivity: activity.slice(0, 25),
      recentEvents: events.slice(0, 25),
    };
  }

  static async createUploadIntent(tenantId: string, data: { fileName: string; fileSizeBytes: number; mimeType: string; type: string; providerKey?: string }, userId?: string | null) {
    const fileName = required(data.fileName, 'fileName');
    const type = required(data.type, 'type');
    allowed(type, TYPES, 'type');
    required(data.mimeType, 'mimeType');
    if (!Number.isFinite(data.fileSizeBytes) || data.fileSizeBytes <= 0) throw new Error('fileSizeBytes must be greater than zero');
    const settings = await this.getSettings(tenantId);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    const maxBytes = Number(config.maxUploadSizeMb || 500) * 1024 * 1024;
    if (data.fileSizeBytes > maxBytes) throw new Error(`File exceeds the ${config.maxUploadSizeMb} MB upload limit`);
    const providerKey = data.providerKey || config.defaultStorageProvider || 'platform';
    allowed(providerKey, PROVIDER_KEYS, 'providerKey');
    if (settings.providerMode === 'bring_your_own' && providerKey === 'platform') throw new Error('A church-owned provider is required by the current Media Module settings');
    const intent = { id: `upload_${Date.now()}`, tenantId, moduleKey: MEDIA_MODULE_KEY, fileName, fileSizeBytes: data.fileSizeBytes, mimeType: data.mimeType, type, providerMode: settings.providerMode, providerKey, uploadUrl: providerKey === 'platform' ? `/api/media/uploads/${Date.now()}` : null, instructions: providerKey === 'platform' ? 'Upload through the ChurchOS media upload endpoint.' : `Use the connected ${providerKey} provider and save the returned URL as sourceUrl.`, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
    await this.logActivity(tenantId, userId, 'upload_intent_created', { providerKey, fileName, fileSizeBytes: data.fileSizeBytes });
    return intent;
  }

  static async recordPlayback(tenantId: string, assetId: string, userId?: string | null) {
    const asset = await this.getAsset(assetId, tenantId);
    await this.logActivity(tenantId, userId, 'playback_requested', { assetId, title: asset.title, type: asset.type, value: 1 });
    const settings = await this.getSettings(tenantId);
    return { assetId: asset.id, title: asset.title, type: asset.type, providerType: asset.providerType, providerKey: asset.providerKey, sourceUrl: asset.sourceUrl, embedHtml: generateEmbed(asset), quality: parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG).defaultStreamingQuality };
  }
}

export function generateEmbed(asset: { id: string; sourceUrl?: string | null; providerType: string; providerKey?: string | null; title: string }) {
  const title = escapeAttribute(asset.title);
  if (asset.providerType === 'external_link' && asset.sourceUrl) {
    if (asset.providerKey === 'youtube') {
      const id = extractYouTubeId(asset.sourceUrl);
      if (id) return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" title="${title}" frameborder="0" allowfullscreen></iframe>`;
    }
    if (asset.providerKey === 'vimeo') {
      const id = extractVimeoId(asset.sourceUrl);
      if (id) return `<iframe width="560" height="315" src="https://player.vimeo.com/video/${id}" title="${title}" frameborder="0" allowfullscreen></iframe>`;
    }
    return `<iframe width="560" height="315" src="${escapeAttribute(asset.sourceUrl)}" title="${title}" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<iframe width="560" height="315" src="/embed/media/${asset.id}" title="${title}" frameborder="0" allowfullscreen></iframe>`;
}

function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : null;
}

function extractVimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
