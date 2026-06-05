import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

export const CHURCH_SERVICES_MODULE_KEY = 'church-services';

const DEFAULT_CONFIG = {
  enableSundayServices: true,
  enableMidweekServices: true,
  enablePrayerServices: true,
  enableCommunionServices: true,
  enableHealingServices: true,
  enableThanksgivingServices: true,
  enableYouthServices: true,
  enableSpecialServices: true,
  enableRecurringSchedules: true,
  enablePublicArchive: true,
  enableReplayAttachments: true,
  enableAudioAttachments: true,
  enableGivingIntegration: true,
  enableAttendanceIntegration: true,
  enableSalvationIntegration: true,
  enableCalendarSync: false,
  enableAiSummaries: false,
  defaultVisibility: 'public',
  defaultStatus: 'draft',
  defaultLocationMode: 'hybrid',
  archiveSortOrder: 'desc',
  providerMode: 'hybrid',
  defaultReplayProvider: 'media',
  allowedVideoProviders: ['platform', 'youtube', 'vimeo', 'mux', 'cloudinary', 'cloudflare_r2'],
  recurringMaxBatchSize: 52,
  publishRequiresSpeaker: false,
  publishRequiresMedia: false,
};

const SERVICE_TYPES = new Set(['sunday', 'midweek', 'prayer', 'communion', 'healing', 'thanksgiving', 'youth', 'special', 'other']);
const SERVICE_STATUSES = new Set(['draft', 'scheduled', 'published', 'archived', 'cancelled']);
const MODULE_STATUSES = new Set(['active', 'inactive', 'archived']);
const VISIBILITIES = new Set(['public', 'members_only', 'leaders_only', 'private', 'unlisted']);
const LOCATION_MODES = new Set(['physical', 'online', 'hybrid']);
const BILLING_PLANS = new Set(['free', 'premium', 'platform', 'metered']);
const PROVIDER_MODES = new Set(['platform_managed', 'bring_your_own', 'hybrid']);
const SORT_ORDERS = new Set(['asc', 'desc']);

const SERVICE_TYPE_LABELS: Record<string, string> = {
  sunday: 'Sunday Service',
  midweek: 'Midweek Service',
  prayer: 'Prayer Service',
  communion: 'Communion Service',
  healing: 'Healing Service',
  thanksgiving: 'Thanksgiving Service',
  youth: 'Youth Service',
  special: 'Special Service',
  other: 'Other Service',
};

const SERVICE_TYPE_FEATURES: Record<string, keyof typeof DEFAULT_CONFIG> = {
  sunday: 'enableSundayServices',
  midweek: 'enableMidweekServices',
  prayer: 'enablePrayerServices',
  communion: 'enableCommunionServices',
  healing: 'enableHealingServices',
  thanksgiving: 'enableThanksgivingServices',
  youth: 'enableYouthServices',
  special: 'enableSpecialServices',
  other: 'enableSpecialServices',
};

const FRIENDLY_SERVICE_TYPES: Record<string, string> = {
  'sunday-main': 'sunday',
  'sunday-service': 'sunday',
  'sunday-morning': 'sunday',
  weekend: 'sunday',
  'mid-week-service': 'midweek',
  'midweek-service': 'midweek',
  wednesday: 'midweek',
  'wednesday-service': 'midweek',
  'prayer-service': 'prayer',
  'communion-service': 'communion',
  'healing-service': 'healing',
  'thanksgiving-service': 'thanksgiving',
  'youth-service': 'youth',
  'special-service': 'special',
};

export interface ChurchServiceInput {
  title: string;
  serviceType: string;
  serviceDate: string | Date;
  description?: string | null;
  notes?: string | null;
  thumbnailUrl?: string | null;
  speakerId?: string | null;
  sermonMediaId?: string | null;
  serviceAudioId?: string | null;
  livestreamId?: string | null;
  attendanceCount?: number | string | null;
  givingTotal?: number | string | null;
  salvationCount?: number | string | null;
  status?: string;
  visibility?: string;
  locationMode?: string;
  settingsJson?: any;
  archiveOrder?: number | string | null;
}

export interface ChurchServiceFilters {
  serviceType?: string;
  speakerId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  visibility?: string;
  search?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ChurchServicesSettingsInput {
  enabled?: boolean;
  billingPlan?: string;
  providerMode?: string;
  configJson?: any;
}

export interface ChurchServicesProfileInput {
  title: string;
  description?: string | null;
  visibility?: string;
  settingsJson?: any;
  createdBy?: string | null;
}

export interface RecurringPattern {
  serviceType: string;
  titleTemplate: string;
  dayOfWeek: number;
  startDate: string | Date;
  count: number;
  frequency?: 'weekly' | 'monthly';
  speakerId?: string | null;
  locationMode?: string;
  visibility?: string;
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

function optionalUrl(value: string | null | undefined, label: string) {
  if (!value) return;
  if (value.startsWith('/')) return;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error(`${label} must be a valid http(s) URL or site-relative path`);
  }
}

function normalizeServiceType(value: string | undefined, requiredValue = true) {
  if (!value) {
    if (requiredValue) throw new Error('serviceType is required');
    return undefined;
  }
  const slug = value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const normalized = FRIENDLY_SERVICE_TYPES[slug] || slug;
  allowed(normalized, SERVICE_TYPES, 'serviceType');
  return normalized;
}

function normalizeStatus(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value === 'ready' ? 'published' : value.toLowerCase().trim();
  allowed(normalized, SERVICE_STATUSES, 'status');
  return normalized;
}

function normalizeVisibility(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  allowed(normalized, VISIBILITIES, 'visibility');
  return normalized;
}

function normalizeLocationMode(value: string | undefined) {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  allowed(normalized, LOCATION_MODES, 'locationMode');
  return normalized;
}

function asDate(value: string | Date | undefined, label: string) {
  if (!value) throw new Error(`${label} is required`);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`);
  return date;
}

function rangeStart(value?: string) {
  if (!value) return undefined;
  return asDate(value, 'dateFrom');
}

function rangeEnd(value?: string) {
  if (!value) return undefined;
  const end = asDate(value, 'dateTo');
  if (!String(value).includes('T')) end.setHours(23, 59, 59, 999);
  return end;
}

function optionalNumber(value: number | string | null | undefined, label: string, integer = false) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error(`${label} must be a non-negative number`);
  return integer ? Math.trunc(numberValue) : numberValue;
}

function normalizeConfig(value: any) {
  const raw = typeof value === 'string' ? parseJson<Record<string, any>>(value, {}) : (value || {});
  const merged = {
    ...DEFAULT_CONFIG,
    ...raw,
    recurringMaxBatchSize: Number(raw.recurringMaxBatchSize ?? DEFAULT_CONFIG.recurringMaxBatchSize),
    allowedVideoProviders: Array.isArray(raw.allowedVideoProviders) ? raw.allowedVideoProviders : DEFAULT_CONFIG.allowedVideoProviders,
  };
  allowed(merged.defaultStatus, SERVICE_STATUSES, 'configJson.defaultStatus');
  allowed(merged.defaultVisibility, VISIBILITIES, 'configJson.defaultVisibility');
  allowed(merged.defaultLocationMode, LOCATION_MODES, 'configJson.defaultLocationMode');
  allowed(merged.archiveSortOrder, SORT_ORDERS, 'configJson.archiveSortOrder');
  allowed(merged.providerMode, PROVIDER_MODES, 'configJson.providerMode');
  if (!Number.isFinite(merged.recurringMaxBatchSize) || merged.recurringMaxBatchSize < 1) {
    throw new Error('configJson.recurringMaxBatchSize must be greater than zero');
  }
  merged.recurringMaxBatchSize = Math.min(Math.trunc(merged.recurringMaxBatchSize), 104);
  return JSON.stringify(merged);
}

function serviceTypeAllowed(serviceType: string, config: Record<string, any>) {
  const feature = SERVICE_TYPE_FEATURES[serviceType];
  if (feature && config[feature] === false) {
    throw new Error(`${SERVICE_TYPE_LABELS[serviceType]} records are disabled in Church Services settings`);
  }
}

function assertEnabled(settings: { enabled: boolean }) {
  if (!settings.enabled) throw new Error('Church Services Module is disabled for this tenant');
}

export class ChurchServicesService {
  private static includeService() {
    return {
      speaker: true,
      sermonMedia: true,
      serviceAudio: true,
      livestream: true,
      scriptures: { orderBy: { order: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
    } as const;
  }

  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.churchServicesModuleActivity.create({
      data: {
        tenantId,
        userId: userId || null,
        actionType,
        metadataJson: stringify(metadata, {}),
      },
    });

    await trackEvent(tenantId, {
      category: 'church_services',
      name: actionType,
      entityId: metadata.serviceId || metadata.profileId || metadata.recordId || null,
      value: metadata.value ?? null,
      userId: userId || null,
      metadata,
    }).catch(() => undefined);

    return activity;
  }

  static listActivities(tenantId: string, options: { actionType?: string; limit?: number } = {}) {
    return prisma.churchServicesModuleActivity.findMany({
      where: { tenantId, ...(options.actionType ? { actionType: options.actionType } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(Number(options.limit || 100), 1), 250),
    });
  }

  static async getSettings(tenantId: string) {
    const settings = await prisma.churchServicesModuleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CHURCH_SERVICES_MODULE_KEY } },
    });
    return settings || {
      id: 'default',
      tenantId,
      moduleKey: CHURCH_SERVICES_MODULE_KEY,
      enabled: true,
      billingPlan: 'free',
      providerMode: 'hybrid',
      configJson: JSON.stringify(DEFAULT_CONFIG),
      updatedAt: new Date(),
    };
  }

  static async updateSettings(tenantId: string, data: ChurchServicesSettingsInput, userId?: string | null) {
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') throw new Error('enabled must be a boolean');
    allowed(data.billingPlan, BILLING_PLANS, 'billingPlan');
    allowed(data.providerMode, PROVIDER_MODES, 'providerMode');

    const current = await this.getSettings(tenantId);
    const currentConfig = parseJson<Record<string, any>>(current.configJson, DEFAULT_CONFIG);
    const incoming = typeof data.configJson === 'string' ? parseJson<Record<string, any>>(data.configJson, {}) : (data.configJson || {});
    const configJson = data.configJson !== undefined || data.providerMode !== undefined
      ? normalizeConfig({ ...currentConfig, ...incoming, ...(data.providerMode ? { providerMode: data.providerMode } : {}) })
      : undefined;

    const settings = await prisma.churchServicesModuleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CHURCH_SERVICES_MODULE_KEY } },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.billingPlan !== undefined && { billingPlan: data.billingPlan }),
        ...(data.providerMode !== undefined && { providerMode: data.providerMode }),
        ...(configJson !== undefined && { configJson }),
      },
      create: {
        tenantId,
        moduleKey: CHURCH_SERVICES_MODULE_KEY,
        enabled: data.enabled ?? true,
        billingPlan: data.billingPlan || 'free',
        providerMode: data.providerMode || 'hybrid',
        configJson: configJson || JSON.stringify(DEFAULT_CONFIG),
      },
    });

    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CHURCH_SERVICES_MODULE_KEY } },
      update: { settings: settings.configJson },
      create: { tenantId, moduleKey: CHURCH_SERVICES_MODULE_KEY, settings: settings.configJson },
    });

    await this.logActivity(tenantId, userId, 'settings_updated', {
      fields: Object.keys(data),
      providerMode: settings.providerMode,
      enabled: settings.enabled,
    });

    return settings;
  }

  private static async validateRelations(tenantId: string, data: Partial<ChurchServiceInput>) {
    if (data.speakerId && !(await prisma.speaker.findFirst({ where: { id: data.speakerId, tenantId } }))) {
      throw new Error('Speaker not found');
    }
    if (data.sermonMediaId && !(await prisma.mediaAsset.findFirst({ where: { id: data.sermonMediaId, tenantId } }))) {
      throw new Error('Sermon media asset not found');
    }
    if (data.serviceAudioId) {
      const audio = await prisma.mediaAsset.findFirst({ where: { id: data.serviceAudioId, tenantId } });
      if (!audio) throw new Error('Service audio asset not found');
      if (audio.type !== 'audio') throw new Error('serviceAudioId must reference an audio media asset');
    }
    if (data.livestreamId && !(await prisma.livestream.findFirst({ where: { id: data.livestreamId, tenantId } }))) {
      throw new Error('Livestream not found');
    }
  }

  private static validatePublishRules(data: { status: string; speakerId?: string | null; sermonMediaId?: string | null; livestreamId?: string | null }, config: Record<string, any>) {
    if (data.status !== 'published') return;
    if (config.publishRequiresSpeaker && !data.speakerId) throw new Error('A speaker is required before publishing');
    if (config.publishRequiresMedia && !data.sermonMediaId && !data.livestreamId) {
      throw new Error('A sermon media asset or livestream is required before publishing');
    }
  }

  static async createProfile(tenantId: string, data: ChurchServicesProfileInput, userId?: string | null) {
    const title = required(data.title, 'title');
    const visibility = normalizeVisibility(data.visibility) || 'private';
    const record = await prisma.churchServicesModule.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        visibility,
        settingsJson: data.settingsJson !== undefined ? stringify(data.settingsJson, {}) : '{}',
        createdById: data.createdBy || userId || null,
      },
    });
    await this.logActivity(tenantId, userId, 'profile_created', { profileId: record.id, title });
    return record;
  }

  static listProfiles(tenantId: string) {
    return prisma.churchServicesModule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  static async getProfile(id: string, tenantId: string) {
    const record = await prisma.churchServicesModule.findFirst({ where: { id, tenantId } });
    if (!record) throw new Error('Church Services profile not found');
    return record;
  }

  static async updateProfile(id: string, tenantId: string, data: Partial<ChurchServicesProfileInput> & { status?: string }, userId?: string | null) {
    const existing = await this.getProfile(id, tenantId);
    allowed(data.status, MODULE_STATUSES, 'status');
    const visibility = normalizeVisibility(data.visibility);
    const record = await prisma.churchServicesModule.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined && { title: required(data.title, 'title') }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(visibility !== undefined && { visibility }),
        ...(data.settingsJson !== undefined && { settingsJson: stringify(data.settingsJson, {}) }),
      },
    });
    await this.logActivity(tenantId, userId, 'profile_updated', { profileId: record.id, fields: Object.keys(data) });
    return record;
  }

  static async deleteProfile(id: string, tenantId: string, userId?: string | null) {
    const existing = await this.getProfile(id, tenantId);
    const record = await prisma.churchServicesModule.update({ where: { id: existing.id }, data: { status: 'archived' } });
    await this.logActivity(tenantId, userId, 'profile_archived', { profileId: record.id, title: record.title });
    return record;
  }

  static async createService(tenantId: string, data: ChurchServiceInput, userId?: string | null) {
    const settings = await this.getSettings(tenantId);
    assertEnabled(settings);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    const title = required(data.title, 'title');
    const serviceType = normalizeServiceType(data.serviceType) as string;
    serviceTypeAllowed(serviceType, config);
    const status = normalizeStatus(data.status) || config.defaultStatus || 'draft';
    const visibility = normalizeVisibility(data.visibility) || config.defaultVisibility || 'public';
    const locationMode = normalizeLocationMode(data.locationMode) || config.defaultLocationMode || 'hybrid';
    const serviceDate = asDate(data.serviceDate, 'serviceDate');
    optionalUrl(data.thumbnailUrl, 'thumbnailUrl');
    await this.validateRelations(tenantId, data);
    this.validatePublishRules({ status, speakerId: data.speakerId, sermonMediaId: data.sermonMediaId, livestreamId: data.livestreamId }, config);

    const service = await prisma.churchService.create({
      data: {
        tenantId,
        title,
        serviceType,
        serviceDate,
        description: data.description || null,
        notes: data.notes || null,
        thumbnailUrl: data.thumbnailUrl || null,
        speakerId: data.speakerId || null,
        sermonMediaId: data.sermonMediaId || null,
        serviceAudioId: data.serviceAudioId || null,
        livestreamId: data.livestreamId || null,
        attendanceCount: optionalNumber(data.attendanceCount, 'attendanceCount', true),
        givingTotal: optionalNumber(data.givingTotal, 'givingTotal'),
        salvationCount: optionalNumber(data.salvationCount, 'salvationCount', true),
        status,
        visibility,
        locationMode,
        settingsJson: data.settingsJson !== undefined ? stringify(data.settingsJson, {}) : '{}',
        createdById: userId || null,
        archiveOrder: optionalNumber(data.archiveOrder, 'archiveOrder', true),
      },
      include: this.includeService(),
    });

    await this.logActivity(tenantId, userId, 'service_created', { serviceId: service.id, title, serviceType, status });
    return service;
  }

  static async getService(id: string, tenantId: string) {
    const service = await prisma.churchService.findFirst({
      where: { id, tenantId },
      include: this.includeService(),
    });
    if (!service) throw new Error('Service not found');
    return service;
  }

  static async listServices(tenantId: string, filters: ChurchServiceFilters = {}) {
    const page = Math.max(Number(filters.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(filters.pageSize || 20), 1), 100);
    const sortOrder = filters.sortOrder && SORT_ORDERS.has(filters.sortOrder) ? filters.sortOrder : 'desc';
    const where: any = { tenantId };
    if (filters.serviceType) where.serviceType = normalizeServiceType(filters.serviceType);
    if (filters.speakerId) where.speakerId = filters.speakerId;
    if (filters.status) where.status = normalizeStatus(filters.status);
    if (filters.visibility) where.visibility = normalizeVisibility(filters.visibility);
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }
    const from = rangeStart(filters.dateFrom);
    const to = rangeEnd(filters.dateTo);
    if (from || to) {
      where.serviceDate = {};
      if (from) where.serviceDate.gte = from;
      if (to) where.serviceDate.lte = to;
    }

    const [services, total] = await Promise.all([
      prisma.churchService.findMany({
        where,
        include: this.includeService(),
        orderBy: [{ serviceDate: sortOrder }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.churchService.count({ where }),
    ]);

    return { services, total, page, pageSize };
  }

  static async updateService(id: string, tenantId: string, data: Partial<ChurchServiceInput>, userId?: string | null) {
    const settings = await this.getSettings(tenantId);
    assertEnabled(settings);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    const existing = await this.getService(id, tenantId);
    const update: any = {};

    if (data.title !== undefined) update.title = required(data.title, 'title');
    if (data.serviceType !== undefined) {
      update.serviceType = normalizeServiceType(data.serviceType);
      serviceTypeAllowed(update.serviceType, config);
    }
    if (data.serviceDate !== undefined) update.serviceDate = asDate(data.serviceDate, 'serviceDate');
    if (data.description !== undefined) update.description = data.description || null;
    if (data.notes !== undefined) update.notes = data.notes || null;
    if (data.thumbnailUrl !== undefined) {
      optionalUrl(data.thumbnailUrl, 'thumbnailUrl');
      update.thumbnailUrl = data.thumbnailUrl || null;
    }
    if (data.speakerId !== undefined) update.speakerId = data.speakerId || null;
    if (data.sermonMediaId !== undefined) update.sermonMediaId = data.sermonMediaId || null;
    if (data.serviceAudioId !== undefined) update.serviceAudioId = data.serviceAudioId || null;
    if (data.livestreamId !== undefined) update.livestreamId = data.livestreamId || null;
    if (data.attendanceCount !== undefined) update.attendanceCount = optionalNumber(data.attendanceCount, 'attendanceCount', true);
    if (data.givingTotal !== undefined) update.givingTotal = optionalNumber(data.givingTotal, 'givingTotal');
    if (data.salvationCount !== undefined) update.salvationCount = optionalNumber(data.salvationCount, 'salvationCount', true);
    if (data.status !== undefined) update.status = normalizeStatus(data.status);
    if (data.visibility !== undefined) update.visibility = normalizeVisibility(data.visibility);
    if (data.locationMode !== undefined) update.locationMode = normalizeLocationMode(data.locationMode);
    if (data.settingsJson !== undefined) update.settingsJson = stringify(data.settingsJson, {});
    if (data.archiveOrder !== undefined) update.archiveOrder = optionalNumber(data.archiveOrder, 'archiveOrder', true);

    await this.validateRelations(tenantId, data);
    this.validatePublishRules({
      status: update.status || existing.status,
      speakerId: update.speakerId !== undefined ? update.speakerId : existing.speakerId,
      sermonMediaId: update.sermonMediaId !== undefined ? update.sermonMediaId : existing.sermonMediaId,
      livestreamId: update.livestreamId !== undefined ? update.livestreamId : existing.livestreamId,
    }, config);

    const service = await prisma.churchService.update({
      where: { id: existing.id },
      data: update,
      include: this.includeService(),
    });
    await this.logActivity(tenantId, userId, 'service_updated', { serviceId: service.id, fields: Object.keys(data), status: service.status });
    return service;
  }

  static async deleteService(id: string, tenantId: string, userId?: string | null) {
    const existing = await this.getService(id, tenantId);
    const service = await prisma.churchService.update({
      where: { id: existing.id },
      data: { status: 'archived' },
      include: this.includeService(),
    });
    await this.logActivity(tenantId, userId, 'service_archived', { serviceId: service.id, title: service.title });
    return service;
  }

  static async publishService(id: string, tenantId: string, userId?: string | null) {
    return this.updateService(id, tenantId, { status: 'published' }, userId);
  }

  static async generateRecurringServices(tenantId: string, pattern: RecurringPattern, userId?: string | null) {
    const settings = await this.getSettings(tenantId);
    assertEnabled(settings);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    if (config.enableRecurringSchedules === false) throw new Error('Recurring service schedules are disabled');
    const serviceType = normalizeServiceType(pattern.serviceType) as string;
    serviceTypeAllowed(serviceType, config);
    const titleTemplate = required(pattern.titleTemplate, 'titleTemplate');
    const dayOfWeek = Number(pattern.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) throw new Error('dayOfWeek must be an integer from 0 to 6');
    const count = Math.trunc(Number(pattern.count));
    const maxCount = Math.min(Number(config.recurringMaxBatchSize || 52), 104);
    if (!Number.isInteger(count) || count < 1 || count > maxCount) throw new Error(`count must be between 1 and ${maxCount}`);
    const frequency = pattern.frequency || 'weekly';
    if (!['weekly', 'monthly'].includes(frequency)) throw new Error('frequency must be weekly or monthly');
    await this.validateRelations(tenantId, { speakerId: pattern.speakerId || undefined });

    const startDate = asDate(pattern.startDate, 'startDate');
    const currentDay = startDate.getDay();
    let daysUntilTarget = dayOfWeek - currentDay;
    if (daysUntilTarget < 0) daysUntilTarget += 7;
    const firstDate = new Date(startDate);
    firstDate.setDate(firstDate.getDate() + daysUntilTarget);

    const created = [];
    for (let i = 0; i < count; i++) {
      const serviceDate = new Date(firstDate);
      if (frequency === 'weekly') serviceDate.setDate(serviceDate.getDate() + i * 7);
      if (frequency === 'monthly') serviceDate.setMonth(serviceDate.getMonth() + i);
      const dateStr = serviceDate.toISOString().split('T')[0];
      const service = await prisma.churchService.create({
        data: {
          tenantId,
          title: `${titleTemplate} - ${dateStr}`,
          serviceType,
          serviceDate,
          speakerId: pattern.speakerId || null,
          status: 'draft',
          visibility: normalizeVisibility(pattern.visibility) || config.defaultVisibility || 'public',
          locationMode: normalizeLocationMode(pattern.locationMode) || config.defaultLocationMode || 'hybrid',
          createdById: userId || null,
        },
        include: this.includeService(),
      });
      created.push(service);
    }

    await this.logActivity(tenantId, userId, 'recurring_services_generated', {
      serviceType,
      count,
      frequency,
      serviceIds: created.map((service) => service.id),
    });
    return created;
  }

  static async addScriptures(tenantId: string, serviceId: string, references: Array<{ reference: string; order?: number }>, userId?: string | null) {
    await this.getService(serviceId, tenantId);
    if (!Array.isArray(references) || references.length === 0) throw new Error('references array is required');
    const created = [];
    for (let index = 0; index < references.length; index += 1) {
      const item = references[index];
      const reference = required(item.reference, 'reference');
      const record = await prisma.serviceScripture.create({
        data: {
          serviceId,
          reference,
          order: item.order !== undefined ? Math.trunc(Number(item.order)) : index,
        },
      });
      created.push(record);
    }
    await this.logActivity(tenantId, userId, 'scriptures_linked', { serviceId, count: created.length });
    return created;
  }

  static async getScriptures(tenantId: string, serviceId: string) {
    await this.getService(serviceId, tenantId);
    return prisma.serviceScripture.findMany({ where: { serviceId }, orderBy: { order: 'asc' } });
  }

  static async addAttachment(tenantId: string, serviceId: string, data: { title: string; fileUrl: string; fileType?: string }, userId?: string | null) {
    await this.getService(serviceId, tenantId);
    const title = required(data.title, 'title');
    const fileUrl = required(data.fileUrl, 'fileUrl');
    optionalUrl(fileUrl, 'fileUrl');
    const attachment = await prisma.serviceAttachment.create({
      data: {
        serviceId,
        title,
        fileUrl,
        fileType: data.fileType ? data.fileType.toLowerCase().trim() : null,
      },
    });
    await this.logActivity(tenantId, userId, 'attachment_added', { serviceId, attachmentId: attachment.id, title });
    return attachment;
  }

  static async getAttachments(tenantId: string, serviceId: string) {
    await this.getService(serviceId, tenantId);
    return prisma.serviceAttachment.findMany({ where: { serviceId }, orderBy: { createdAt: 'desc' } });
  }

  static async recordReplay(tenantId: string, serviceId: string, userId?: string | null) {
    const service = await this.getService(serviceId, tenantId);
    await this.logActivity(tenantId, userId, 'replay_requested', { serviceId, title: service.title, value: 1 });
    return {
      serviceId: service.id,
      title: service.title,
      serviceType: service.serviceType,
      sermonMedia: service.sermonMedia,
      serviceAudio: service.serviceAudio,
      livestream: service.livestream,
      replayAvailable: Boolean(service.sermonMedia || service.livestream),
    };
  }

  static async getTemplates(tenantId: string) {
    const [speakers, mediaAssets, audioAssets, livestreams, settings] = await Promise.all([
      prisma.speaker.findMany({ where: { tenantId }, orderBy: { name: 'asc' }, take: 100 }),
      prisma.mediaAsset.findMany({ where: { tenantId, type: { in: ['video', 'worship'] } }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.mediaAsset.findMany({ where: { tenantId, type: 'audio' }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.livestream.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.getSettings(tenantId),
    ]);

    return {
      moduleKey: CHURCH_SERVICES_MODULE_KEY,
      settings,
      serviceTypes: Array.from(SERVICE_TYPES).map((key) => ({ key, label: SERVICE_TYPE_LABELS[key] })),
      defaultSchedules: [
        { serviceType: 'sunday', titleTemplate: 'Sunday Morning Service', dayOfWeek: 0, frequency: 'weekly' },
        { serviceType: 'midweek', titleTemplate: 'Wednesday Word & Prayer', dayOfWeek: 3, frequency: 'weekly' },
        { serviceType: 'prayer', titleTemplate: 'Corporate Prayer Service', dayOfWeek: 5, frequency: 'weekly' },
        { serviceType: 'communion', titleTemplate: 'Communion Service', dayOfWeek: 0, frequency: 'monthly' },
      ],
      integrations: {
        speakers,
        mediaAssets,
        audioAssets,
        livestreams,
        supportedProviders: DEFAULT_CONFIG.allowedVideoProviders,
      },
    };
  }

  static async getOverview(tenantId: string) {
    const nowDate = new Date();
    const [services, recentResult, upcomingServices, settings, activity, profiles] = await Promise.all([
      prisma.churchService.findMany({ where: { tenantId }, include: this.includeService() }),
      this.listServices(tenantId, { pageSize: 8 }),
      prisma.churchService.findMany({
        where: { tenantId, status: { not: 'archived' }, serviceDate: { gte: nowDate } },
        include: this.includeService(),
        orderBy: { serviceDate: 'asc' },
        take: 5,
      }),
      this.getSettings(tenantId),
      this.listActivities(tenantId, { limit: 10 }),
      this.listProfiles(tenantId),
    ]);

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let attendanceTotal = 0;
    let givingTotal = 0;
    let salvationTotal = 0;
    for (const service of services) {
      byStatus[service.status] = (byStatus[service.status] || 0) + 1;
      byType[service.serviceType] = (byType[service.serviceType] || 0) + 1;
      attendanceTotal += Number(service.attendanceCount || 0);
      givingTotal += Number(service.givingTotal || 0);
      salvationTotal += Number(service.salvationCount || 0);
    }

    return {
      moduleKey: CHURCH_SERVICES_MODULE_KEY,
      settings,
      counts: {
        services: services.length,
        profiles: profiles.length,
        published: byStatus.published || 0,
        draft: byStatus.draft || 0,
        archived: byStatus.archived || 0,
        upcoming: upcomingServices.length,
        activity: activity.length,
      },
      totals: {
        attendance: attendanceTotal,
        giving: Math.round(givingTotal * 100) / 100,
        salvation: salvationTotal,
      },
      breakdowns: { byStatus, byType },
      recentServices: recentResult.services,
      upcomingServices,
      recentActivity: activity,
    };
  }

  static async getReports(tenantId: string) {
    const [overview, services, events, activity] = await Promise.all([
      this.getOverview(tenantId),
      prisma.churchService.findMany({ where: { tenantId }, orderBy: { serviceDate: 'asc' } }),
      prisma.analyticsEvent.findMany({ where: { tenantId, category: 'church_services' }, orderBy: { createdAt: 'desc' }, take: 250 }),
      this.listActivities(tenantId, { limit: 100 }),
    ]);

    const eventCounts: Record<string, number> = {};
    for (const event of events) eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;

    const serviceVolumeByMonth: Record<string, number> = {};
    const attendanceByType: Record<string, number> = {};
    const givingByType: Record<string, number> = {};
    const salvationByType: Record<string, number> = {};
    for (const service of services) {
      const month = service.serviceDate.toISOString().slice(0, 7);
      serviceVolumeByMonth[month] = (serviceVolumeByMonth[month] || 0) + 1;
      attendanceByType[service.serviceType] = (attendanceByType[service.serviceType] || 0) + Number(service.attendanceCount || 0);
      givingByType[service.serviceType] = (givingByType[service.serviceType] || 0) + Number(service.givingTotal || 0);
      salvationByType[service.serviceType] = (salvationByType[service.serviceType] || 0) + Number(service.salvationCount || 0);
    }

    return {
      summary: {
        services: overview.counts.services,
        published: overview.counts.published,
        attendance: overview.totals.attendance,
        giving: overview.totals.giving,
        salvation: overview.totals.salvation,
        replays: eventCounts.replay_requested || 0,
        activityCount: activity.length,
      },
      charts: {
        serviceVolumeByMonth: Object.entries(serviceVolumeByMonth).map(([month, count]) => ({ month, count })),
        attendanceByType: Object.entries(attendanceByType).map(([serviceType, count]) => ({ serviceType, count })),
        givingByType: Object.entries(givingByType).map(([serviceType, total]) => ({ serviceType, total: Math.round(total * 100) / 100 })),
        salvationByType: Object.entries(salvationByType).map(([serviceType, count]) => ({ serviceType, count })),
      },
      byStatus: overview.breakdowns.byStatus,
      byType: overview.breakdowns.byType,
      eventCounts,
      recentActivity: activity.slice(0, 25),
      recentEvents: events.slice(0, 25),
    };
  }
}
