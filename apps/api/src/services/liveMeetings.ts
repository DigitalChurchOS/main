import { randomBytes } from 'crypto';
import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

const db = prisma as any;

export const LIVE_MEETINGS_MODULE_KEY = 'live-meetings';

const DEFAULT_CONFIG = {
  enableVideoMeetings: true,
  enableAudioMeetings: true,
  enableWaitingRoom: true,
  enableChat: true,
  enableScreenSharing: true,
  enableRecording: true,
  enableAttendanceTracking: true,
  enableReminders: true,
  enableWorshipIntegration: true,
  allowGuestAccess: true,
  requireMemberAccess: false,
  allowExternalProviders: true,
  publicHostingEnabled: true,
  previewOnlyForUnpaid: true,
  defaultMeetingType: 'video',
  defaultProvider: 'native',
  defaultVisibility: 'members_only',
  allowedProviders: ['native', 'jitsi', 'zoom', 'google_meet', 'livekit', 'daily', 'whereby'],
  participantLimit: 100,
  meetingUsageLimitHours: 40,
  recordingLimitHours: 10,
  storageLimitGb: 25,
};

const DEFAULT_USAGE_LIMITS = {
  meetingUsageLimitHours: DEFAULT_CONFIG.meetingUsageLimitHours,
  participantLimit: DEFAULT_CONFIG.participantLimit,
  recordingLimitHours: DEFAULT_CONFIG.recordingLimitHours,
  storageLimitGb: DEFAULT_CONFIG.storageLimitGb,
  publicHostingEnabled: true,
  externalProvidersAllowed: true,
  previewOnlyForUnpaid: true,
};

const MEETING_TYPES = new Set(['video', 'audio']);
const PROVIDERS = new Set(['native', 'jitsi', 'zoom', 'google_meet', 'livekit', 'daily', 'whereby']);
const STATUSES = new Set(['scheduled', 'live', 'ended', 'cancelled']);
const RECURRENCES = new Set(['none', 'daily', 'weekly', 'monthly']);
const PARTICIPANT_STATUSES = new Set(['approved', 'in_waiting_room', 'rejected']);
const PARTICIPANT_ROLES = new Set(['host', 'co_host', 'participant']);
const BILLING_PLANS = new Set(['free', 'premium', 'platform', 'metered']);
const PROVIDER_MODES = new Set(['native', 'external', 'hybrid', 'platform_managed', 'bring_your_own']);
const MODULE_STATUSES = new Set(['active', 'trialing', 'suspended', 'inactive']);
const BILLING_RULES = new Set(['free', 'plan_included', 'flat_rate', 'tiered', 'metered', 'preview_only']);
const ACTIVE_ENTITLEMENT_STATUSES = new Set(['active', 'trialing']);

export interface LiveMeetingInput {
  hostMemberId: string;
  title: string;
  description?: string | null;
  meetingType?: string;
  provider?: string;
  scheduledStart: Date | string;
  scheduledEnd?: Date | string | null;
  recurrence?: string;
  recurrenceRules?: string | null;
  enableWaitingRoom?: boolean;
}

export interface LiveMeetingUpdateInput {
  hostMemberId?: string;
  title?: string;
  description?: string | null;
  meetingType?: string;
  provider?: string;
  scheduledStart?: Date | string;
  scheduledEnd?: Date | string | null;
  recurrence?: string;
  recurrenceRules?: string | null;
  enableWaitingRoom?: boolean;
  isLocked?: boolean;
  status?: string;
}

export interface LiveMeetingSettingsInput {
  enabled?: boolean;
  billingPlan?: string;
  providerMode?: string;
  configJson?: any;
}

export interface LiveMeetingProfileInput {
  title: string;
  description?: string | null;
  visibility?: string;
  status?: string;
  settingsJson?: any;
}

export interface LiveMeetingFilters {
  hostMemberId?: string;
  status?: string;
  provider?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface TenantAccessInput {
  status?: string;
  billingRule?: string;
  usageLimits?: any;
  providerMode?: string;
  billingPlan?: string;
  configJson?: any;
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

function asDate(value: string | Date | undefined, label: string) {
  if (!value) throw new Error(`${label} is required`);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} must be a valid date`);
  return date;
}

function optionalDate(value: string | Date | null | undefined, label: string) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return asDate(value, label);
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

function optionalNumber(value: number | string | null | undefined, label: string) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error(`${label} must be a non-negative number`);
  return Math.trunc(numberValue);
}

function normalizeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizeStatus(value: string | undefined, fallback = 'scheduled') {
  const normalized = value ? normalizeSlug(value) : fallback;
  allowed(normalized, STATUSES, 'status');
  return normalized;
}

function normalizeMeetingType(value: string | undefined, fallback = DEFAULT_CONFIG.defaultMeetingType) {
  const normalized = value ? normalizeSlug(value) : fallback;
  allowed(normalized, MEETING_TYPES, 'meetingType');
  return normalized;
}

function normalizeProvider(value: string | undefined, fallback = DEFAULT_CONFIG.defaultProvider) {
  const normalized = value ? normalizeSlug(value) : fallback;
  allowed(normalized, PROVIDERS, 'provider');
  return normalized;
}

function normalizeRecurrence(value: string | undefined, fallback = 'none') {
  const normalized = value ? normalizeSlug(value) : fallback;
  allowed(normalized, RECURRENCES, 'recurrence');
  return normalized;
}

function normalizeConfig(value: any) {
  const raw = typeof value === 'string' ? parseJson<Record<string, any>>(value, {}) : (value || {});
  const merged = {
    ...DEFAULT_CONFIG,
    ...raw,
  };

  merged.defaultMeetingType = normalizeMeetingType(merged.defaultMeetingType);
  merged.defaultProvider = normalizeProvider(merged.defaultProvider);
  merged.allowedProviders = Array.isArray(merged.allowedProviders)
    ? merged.allowedProviders.map((provider: string) => normalizeProvider(provider))
    : DEFAULT_CONFIG.allowedProviders;
  merged.allowedProviders = Array.from(new Set(merged.allowedProviders));

  if (!merged.allowedProviders.includes(merged.defaultProvider)) {
    merged.allowedProviders.unshift(merged.defaultProvider);
  }

  merged.participantLimit = optionalNumber(merged.participantLimit, 'configJson.participantLimit') ?? DEFAULT_CONFIG.participantLimit;
  merged.meetingUsageLimitHours = optionalNumber(merged.meetingUsageLimitHours, 'configJson.meetingUsageLimitHours') ?? DEFAULT_CONFIG.meetingUsageLimitHours;
  merged.recordingLimitHours = optionalNumber(merged.recordingLimitHours, 'configJson.recordingLimitHours') ?? DEFAULT_CONFIG.recordingLimitHours;
  merged.storageLimitGb = optionalNumber(merged.storageLimitGb, 'configJson.storageLimitGb') ?? DEFAULT_CONFIG.storageLimitGb;

  return merged;
}

function normalizeUsageLimits(value: any) {
  const raw = typeof value === 'string' ? parseJson<Record<string, any>>(value, {}) : (value || {});
  const merged = {
    ...DEFAULT_USAGE_LIMITS,
    ...raw,
  };

  merged.meetingUsageLimitHours = optionalNumber(merged.meetingUsageLimitHours, 'usageLimits.meetingUsageLimitHours') ?? DEFAULT_USAGE_LIMITS.meetingUsageLimitHours;
  merged.participantLimit = optionalNumber(merged.participantLimit, 'usageLimits.participantLimit') ?? DEFAULT_USAGE_LIMITS.participantLimit;
  merged.recordingLimitHours = optionalNumber(merged.recordingLimitHours, 'usageLimits.recordingLimitHours') ?? DEFAULT_USAGE_LIMITS.recordingLimitHours;
  merged.storageLimitGb = optionalNumber(merged.storageLimitGb, 'usageLimits.storageLimitGb') ?? DEFAULT_USAGE_LIMITS.storageLimitGb;

  if (Array.isArray(merged.allowedProviders)) {
    merged.allowedProviders = merged.allowedProviders.map((provider: string) => normalizeProvider(provider));
  }

  return merged;
}

function providerMeeting(provider: string) {
  if (provider === 'zoom') {
    const id = Math.floor(100000000 + Math.random() * 900000000).toString();
    return { providerMeetingId: id, meetingUrl: `https://zoom.us/j/${id}` };
  }

  if (provider === 'google_meet') {
    const id = `${randomBytes(2).toString('hex')}-${randomBytes(2).toString('hex')}-${randomBytes(2).toString('hex')}`;
    return { providerMeetingId: id, meetingUrl: `https://meet.google.com/${id}` };
  }

  const prefix: Record<string, string> = {
    livekit: 'livekit',
    daily: 'daily',
    whereby: 'whereby',
    jitsi: 'jitsi',
    native: 'room',
  };
  const id = `${prefix[provider] || 'room'}-${randomBytes(8).toString('hex')}`;
  return { providerMeetingId: id, meetingUrl: `https://meet.churchos.org/${id}` };
}

async function ensurePlatformRecords() {
  await db.moduleDefinition.upsert({
    where: { key: LIVE_MEETINGS_MODULE_KEY },
    update: { name: 'Live Meetings', category: 'Connect', dependencies: '["media","worship"]' },
    create: { key: LIVE_MEETINGS_MODULE_KEY, name: 'Live Meetings', category: 'Connect', dependencies: '["media","worship"]' },
  });
}

async function logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
  await db.liveMeetingsModuleActivity.create({
    data: {
      tenantId,
      userId: userId || null,
      actionType,
      metadataJson: JSON.stringify(metadata || {}),
    },
  });
}

async function logAnalytics(tenantId: string, name: string, entityId?: string | null, userId?: string | null, metadata?: any, value?: number | null) {
  try {
    await trackEvent(tenantId, {
      category: 'live_meeting',
      name,
      entityId: entityId || null,
      userId: userId || null,
      metadata: metadata || {},
      value: value ?? null,
    });
  } catch (err) {
    console.error('Failed to record live meeting analytics event:', err);
  }
}

async function syncCentralSettings(tenantId: string, settings: Record<string, any>) {
  await db.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY } },
    update: { settings: JSON.stringify(settings) },
    create: {
      tenantId,
      moduleKey: LIVE_MEETINGS_MODULE_KEY,
      settings: JSON.stringify(settings),
    },
  });
}

async function getEntitlement(tenantId: string) {
  return db.tenantModule.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY } },
  });
}

async function assertPublicAccess(tenantId: string) {
  const [settings, entitlement] = await Promise.all([
    LiveMeetingsService.getSettings(tenantId),
    getEntitlement(tenantId),
  ]);
  const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
  const usageLimits = normalizeUsageLimits(entitlement?.usageLimits || {});

  if (!settings.enabled) throw new Error('Live Meetings is disabled for this church');
  if (!config.publicHostingEnabled) throw new Error('Public live meeting access is disabled for this church');
  if (!entitlement) throw new Error('Live Meetings is not enabled for public hosting');
  if (!ACTIVE_ENTITLEMENT_STATUSES.has(entitlement.status)) {
    throw new Error('Live Meetings is not enabled for public hosting');
  }
  if (usageLimits.publicHostingEnabled === false) {
    throw new Error('Live Meetings public hosting is restricted by the platform owner');
  }

  return { settings, entitlement, config, usageLimits };
}

async function assertParticipantLimit(tenantId: string, meetingId: string) {
  const { config, usageLimits } = await assertPublicAccess(tenantId);
  const limit = Number(usageLimits.participantLimit || config.participantLimit || DEFAULT_CONFIG.participantLimit);
  const count = await db.liveMeetingParticipant.count({ where: { tenantId, meetingId } });
  if (limit > 0 && count >= limit) throw new Error(`Participant limit of ${limit} has been reached for this meeting`);
}

function statusForMeetingWindow(meeting: any) {
  const now = Date.now();
  const start = new Date(meeting.scheduledStart).getTime();
  const end = meeting.scheduledEnd ? new Date(meeting.scheduledEnd).getTime() : null;
  if (meeting.status === 'cancelled') return 'cancelled';
  if (meeting.status === 'ended' || (end && end < now && meeting.status !== 'live')) return 'ended';
  if (meeting.isLocked) return 'locked';
  if (meeting.status !== 'live' && start > now) return 'not_started';
  return meeting.status;
}

export class LiveMeetingsService {
  static async getSettings(tenantId: string) {
    const existing = await db.liveMeetingsModuleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY } },
    });

    if (existing) {
      return {
        ...existing,
        configJson: JSON.stringify(normalizeConfig(existing.configJson)),
      };
    }

    const created = await db.liveMeetingsModuleSettings.create({
      data: {
        tenantId,
        moduleKey: LIVE_MEETINGS_MODULE_KEY,
        enabled: true,
        billingPlan: 'free',
        providerMode: 'hybrid',
        configJson: JSON.stringify(DEFAULT_CONFIG),
      },
    });
    await syncCentralSettings(tenantId, { enabled: true, billingPlan: 'free', providerMode: 'hybrid', ...DEFAULT_CONFIG });
    return created;
  }

  static async updateSettings(tenantId: string, data: LiveMeetingSettingsInput, userId?: string | null) {
    if (data.billingPlan) allowed(data.billingPlan, BILLING_PLANS, 'billingPlan');
    if (data.providerMode) allowed(data.providerMode, PROVIDER_MODES, 'providerMode');

    const current = await this.getSettings(tenantId);
    const currentConfig = parseJson<Record<string, any>>(current.configJson, DEFAULT_CONFIG);
    const nextConfig = normalizeConfig({
      ...currentConfig,
      ...(data.configJson !== undefined ? (typeof data.configJson === 'string' ? parseJson(data.configJson, {}) : data.configJson) : {}),
    });

    const updated = await db.liveMeetingsModuleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY } },
      update: {
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : current.enabled,
        billingPlan: data.billingPlan || current.billingPlan,
        providerMode: data.providerMode || current.providerMode,
        configJson: JSON.stringify(nextConfig),
      },
      create: {
        tenantId,
        moduleKey: LIVE_MEETINGS_MODULE_KEY,
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
        billingPlan: data.billingPlan || 'free',
        providerMode: data.providerMode || 'hybrid',
        configJson: JSON.stringify(nextConfig),
      },
    });

    await syncCentralSettings(tenantId, {
      enabled: updated.enabled,
      billingPlan: updated.billingPlan,
      providerMode: updated.providerMode,
      ...nextConfig,
    });
    await logActivity(tenantId, userId, 'settings_update', {
      enabled: updated.enabled,
      billingPlan: updated.billingPlan,
      providerMode: updated.providerMode,
    });
    await logAnalytics(tenantId, 'settings_update', null, userId || null, { providerMode: updated.providerMode });
    return updated;
  }

  static async listProfiles(tenantId: string) {
    return db.liveMeetingsModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createProfile(tenantId: string, data: LiveMeetingProfileInput, userId?: string | null) {
    const title = required(data.title, 'title');
    const status = data.status ? normalizeSlug(data.status) : 'active';
    const profile = await db.liveMeetingsModule.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        status,
        visibility: data.visibility ? normalizeSlug(data.visibility) : 'private',
        settingsJson: data.settingsJson ? stringify(data.settingsJson) : '{}',
        createdById: userId || null,
      },
    });
    await logActivity(tenantId, userId, 'profile_create', { profileId: profile.id, title });
    return profile;
  }

  static async getProfile(tenantId: string, id: string) {
    const profile = await db.liveMeetingsModule.findFirst({ where: { id, tenantId } });
    if (!profile) throw new Error('Live Meetings profile not found');
    return profile;
  }

  static async updateProfile(tenantId: string, id: string, data: Partial<LiveMeetingProfileInput>, userId?: string | null) {
    await this.getProfile(tenantId, id);
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = required(data.title, 'title');
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.status !== undefined) updateData.status = normalizeSlug(data.status);
    if (data.visibility !== undefined) updateData.visibility = normalizeSlug(data.visibility);
    if (data.settingsJson !== undefined) updateData.settingsJson = stringify(data.settingsJson);

    const profile = await db.liveMeetingsModule.update({
      where: { id },
      data: updateData,
    });
    await logActivity(tenantId, userId, 'profile_update', { profileId: id });
    return profile;
  }

  static async deleteProfile(tenantId: string, id: string, userId?: string | null) {
    await this.getProfile(tenantId, id);
    const profile = await db.liveMeetingsModule.update({
      where: { id },
      data: { status: 'archived' },
    });
    await logActivity(tenantId, userId, 'profile_archive', { profileId: id });
    return profile;
  }

  static async getOverview(tenantId: string) {
    const [settings, entitlement, meetings, activeParticipants, attendanceCount, pendingReminders] = await Promise.all([
      this.getSettings(tenantId),
      getEntitlement(tenantId),
      db.liveMeeting.findMany({
        where: { tenantId },
        include: {
          hostMember: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { participants: true, chats: true, attendance: true, reminders: true } },
        },
        orderBy: { scheduledStart: 'asc' },
        take: 20,
      }),
      db.liveMeetingParticipant.count({ where: { tenantId, joinStatus: 'approved' } }),
      db.liveMeetingAttendance.count({ where: { tenantId } }),
      db.liveMeetingReminder.count({ where: { tenantId, status: 'pending' } }),
    ]);

    const statusCounts = meetings.reduce((acc: Record<string, number>, meeting: any) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1;
      return acc;
    }, {});
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
    const usageLimits = normalizeUsageLimits(entitlement?.usageLimits || {});

    return {
      moduleKey: LIVE_MEETINGS_MODULE_KEY,
      settings,
      entitlement,
      usageLimits,
      config,
      counts: {
        totalMeetings: await db.liveMeeting.count({ where: { tenantId } }),
        scheduled: statusCounts.scheduled || 0,
        live: statusCounts.live || 0,
        ended: statusCounts.ended || 0,
        cancelled: statusCounts.cancelled || 0,
        activeParticipants,
        attendanceEntries: attendanceCount,
        pendingReminders,
      },
      meetings,
      publicAccess: {
        allowed: Boolean(settings.enabled && entitlement && ACTIVE_ENTITLEMENT_STATUSES.has(entitlement.status) && config.publicHostingEnabled && usageLimits.publicHostingEnabled !== false),
        previewOnly: !entitlement || !ACTIVE_ENTITLEMENT_STATUSES.has(entitlement.status),
      },
    };
  }

  static async getReports(tenantId: string) {
    const [statusGroups, providerGroups, attendanceDuration, activity] = await Promise.all([
      db.liveMeeting.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      db.liveMeeting.groupBy({ by: ['provider'], where: { tenantId }, _count: true }),
      db.liveMeetingAttendance.aggregate({
        where: { tenantId },
        _sum: { durationMinutes: true },
        _avg: { durationMinutes: true },
      }),
      this.listActivities(tenantId, { limit: 25 }),
    ]);

    return {
      status: Object.fromEntries(statusGroups.map((group: any) => [group.status, group._count])),
      providers: providerGroups.map((group: any) => ({ provider: group.provider, meetings: group._count })),
      attendance: {
        totalDurationMinutes: attendanceDuration._sum.durationMinutes || 0,
        averageDurationMinutes: Math.round(attendanceDuration._avg.durationMinutes || 0),
      },
      auditLogs: activity,
      providerSyncIssues: [],
    };
  }

  static async listActivities(tenantId: string, filters: { actionType?: string; limit?: number } = {}) {
    return db.liveMeetingsModuleActivity.findMany({
      where: {
        tenantId,
        ...(filters.actionType ? { actionType: filters.actionType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(filters.limit || 50, 1), 200),
    });
  }

  static async getPlatformOverview() {
    const tenants = await db.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        tenantModules: {
          where: { moduleKey: LIVE_MEETINGS_MODULE_KEY },
        },
        liveMeetings: {
          select: { id: true, provider: true, status: true },
        },
        liveMeetingParticipants: {
          select: { id: true },
        },
        liveMeetingsModuleSettings: true,
      },
      orderBy: { name: 'asc' },
    });

    return tenants.map((tenant: any) => {
      const entitlement = tenant.tenantModules[0] || null;
      const settings = tenant.liveMeetingsModuleSettings[0] || null;
      const providerUsage = tenant.liveMeetings.reduce((acc: Record<string, number>, meeting: any) => {
        acc[meeting.provider] = (acc[meeting.provider] || 0) + 1;
        return acc;
      }, {});
      return {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        entitlement,
        settings,
        usageLimits: normalizeUsageLimits(entitlement?.usageLimits || {}),
        publicHostingAllowed: Boolean(entitlement && ACTIVE_ENTITLEMENT_STATUSES.has(entitlement.status)),
        meetingCount: tenant.liveMeetings.length,
        participantCount: tenant.liveMeetingParticipants.length,
        providerUsage,
      };
    });
  }

  static async updateTenantAccess(targetTenantId: string, data: TenantAccessInput, userId?: string | null) {
    await ensurePlatformRecords();
    const tenant = await db.tenant.findUnique({ where: { id: targetTenantId } });
    if (!tenant) throw new Error('Tenant not found');

    const status = data.status ? normalizeSlug(data.status) : 'active';
    allowed(status, MODULE_STATUSES, 'status');
    const billingRule = data.billingRule ? normalizeSlug(data.billingRule) : 'free';
    allowed(billingRule, BILLING_RULES, 'billingRule');
    const usageLimits = normalizeUsageLimits(data.usageLimits || {});

    if (status === 'inactive') {
      await db.tenantModule.deleteMany({ where: { tenantId: targetTenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY } });
      await logActivity(targetTenantId, userId, 'tenant_access_disable', { status });
      return { tenantId: targetTenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY, status: 'inactive' };
    }

    const entitlement = await db.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId: targetTenantId, moduleKey: LIVE_MEETINGS_MODULE_KEY } },
      update: {
        status,
        billingRule,
        usageLimits: JSON.stringify(usageLimits),
      },
      create: {
        tenantId: targetTenantId,
        moduleKey: LIVE_MEETINGS_MODULE_KEY,
        status,
        billingRule,
        usageLimits: JSON.stringify(usageLimits),
      },
    });

    if (data.providerMode || data.billingPlan || data.configJson) {
      await this.updateSettings(targetTenantId, {
        providerMode: data.providerMode,
        billingPlan: data.billingPlan,
        configJson: data.configJson,
      }, userId);
    }

    await logActivity(targetTenantId, userId, 'tenant_access_update', {
      status,
      billingRule,
      usageLimits,
    });
    return entitlement;
  }
}

export async function createMeeting(tenantId: string, data: LiveMeetingInput, userId?: string | null): Promise<any> {
  const settings = await LiveMeetingsService.getSettings(tenantId);
  const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
  const title = required(data.title, 'title');
  const hostMemberId = required(data.hostMemberId, 'hostMemberId');
  const meetingType = normalizeMeetingType(data.meetingType, config.defaultMeetingType || DEFAULT_CONFIG.defaultMeetingType);
  const provider = normalizeProvider(data.provider, config.defaultProvider || DEFAULT_CONFIG.defaultProvider);
  const recurrence = normalizeRecurrence(data.recurrence);
  const scheduledStart = asDate(data.scheduledStart, 'scheduledStart');
  const scheduledEnd = optionalDate(data.scheduledEnd, 'scheduledEnd') ?? null;

  if (scheduledEnd && scheduledEnd < scheduledStart) {
    throw new Error('Scheduled end date cannot be before start date');
  }
  if (meetingType === 'video' && !config.enableVideoMeetings) throw new Error('Video meetings are disabled');
  if (meetingType === 'audio' && !config.enableAudioMeetings) throw new Error('Audio meetings are disabled');
  if (!config.allowedProviders.includes(provider)) throw new Error(`${provider} is not an allowed meeting provider`);
  if (provider !== 'native' && provider !== 'jitsi' && config.allowExternalProviders === false) {
    throw new Error('External meeting providers are disabled for this church');
  }

  const host = await db.member.findFirst({ where: { id: hostMemberId, tenantId } });
  if (!host) throw new Error('Host member not found');

  const { providerMeetingId, meetingUrl } = providerMeeting(provider);
  const meeting = await db.liveMeeting.create({
    data: {
      tenantId,
      hostMemberId,
      title,
      description: data.description || null,
      meetingType,
      provider,
      providerMeetingId,
      meetingUrl,
      scheduledStart,
      scheduledEnd,
      recurrence,
      recurrenceRules: data.recurrenceRules || null,
      enableWaitingRoom: data.enableWaitingRoom ?? Boolean(config.enableWaitingRoom),
      status: 'scheduled',
    },
    include: {
      hostMember: true,
    },
  });

  await db.liveMeetingParticipant.create({
    data: {
      tenantId,
      meetingId: meeting.id,
      memberId: host.id,
      firstName: host.firstName,
      lastName: host.lastName,
      email: host.email ? host.email.toLowerCase().trim() : `${host.id}@churchos.local`,
      role: 'host',
      joinStatus: 'approved',
    },
  });

  await logActivity(tenantId, userId, 'meeting_create', { meetingId: meeting.id, provider, meetingType });
  await logAnalytics(tenantId, 'create', meeting.id, userId || null, { provider, meetingType });
  return meeting;
}

export async function updateMeeting(tenantId: string, meetingId: string, data: LiveMeetingUpdateInput, userId?: string | null): Promise<any> {
  const existing = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!existing) throw new Error('Meeting not found');

  const settings = await LiveMeetingsService.getSettings(tenantId);
  const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_CONFIG);
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = required(data.title, 'title');
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.meetingType !== undefined) updateData.meetingType = normalizeMeetingType(data.meetingType);
  if (data.recurrence !== undefined) updateData.recurrence = normalizeRecurrence(data.recurrence);
  if (data.recurrenceRules !== undefined) updateData.recurrenceRules = data.recurrenceRules || null;
  if (data.enableWaitingRoom !== undefined) updateData.enableWaitingRoom = Boolean(data.enableWaitingRoom);
  if (data.isLocked !== undefined) updateData.isLocked = Boolean(data.isLocked);
  if (data.status !== undefined) updateData.status = normalizeStatus(data.status);
  if (data.scheduledStart !== undefined) updateData.scheduledStart = asDate(data.scheduledStart, 'scheduledStart');
  if (data.scheduledEnd !== undefined) updateData.scheduledEnd = optionalDate(data.scheduledEnd, 'scheduledEnd');
  if (data.hostMemberId !== undefined) {
    const host = await db.member.findFirst({ where: { id: data.hostMemberId, tenantId } });
    if (!host) throw new Error('Host member not found');
    updateData.hostMemberId = data.hostMemberId;
  }
  if (data.provider !== undefined) {
    const provider = normalizeProvider(data.provider);
    if (!config.allowedProviders.includes(provider)) throw new Error(`${provider} is not an allowed meeting provider`);
    const generated = providerMeeting(provider);
    updateData.provider = provider;
    updateData.providerMeetingId = generated.providerMeetingId;
    updateData.meetingUrl = generated.meetingUrl;
  }

  const start = updateData.scheduledStart || existing.scheduledStart;
  const end = updateData.scheduledEnd === undefined ? existing.scheduledEnd : updateData.scheduledEnd;
  if (end && end < start) throw new Error('Scheduled end date cannot be before start date');

  const meeting = await db.liveMeeting.update({
    where: { id: meetingId },
    data: updateData,
    include: {
      hostMember: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true, attendance: true, chats: true } },
    },
  });

  await logActivity(tenantId, userId, 'meeting_update', { meetingId });
  return meeting;
}

export async function deleteMeeting(tenantId: string, meetingId: string, userId?: string | null): Promise<any> {
  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const updated = await db.liveMeeting.update({
    where: { id: meetingId },
    data: { status: 'cancelled' },
  });
  await logActivity(tenantId, userId, 'meeting_cancel', { meetingId });
  await logAnalytics(tenantId, 'cancel', meetingId, userId || null);
  return updated;
}

export async function getMeeting(tenantId: string, meetingId: string): Promise<any> {
  const meeting = await db.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
    include: {
      hostMember: true,
      participants: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      chats: {
        orderBy: { createdAt: 'asc' },
      },
      attendance: {
        orderBy: { joinedAt: 'asc' },
      },
      reminders: true,
    },
  });

  if (!meeting) throw new Error('Meeting not found');
  return meeting;
}

export async function getPublicMeeting(tenantId: string, meetingId: string): Promise<any> {
  await assertPublicAccess(tenantId);
  const meeting = await getMeeting(tenantId, meetingId);
  const publicStatus = statusForMeetingWindow(meeting);
  return {
    id: meeting.id,
    tenantId: meeting.tenantId,
    title: meeting.title,
    description: meeting.description,
    meetingType: meeting.meetingType,
    provider: meeting.provider,
    meetingUrl: publicStatus === 'live' ? meeting.meetingUrl : null,
    scheduledStart: meeting.scheduledStart,
    scheduledEnd: meeting.scheduledEnd,
    enableWaitingRoom: meeting.enableWaitingRoom,
    activeWorshipSessionId: meeting.activeWorshipSessionId,
    status: publicStatus,
    host: meeting.hostMember ? {
      id: meeting.hostMember.id,
      firstName: meeting.hostMember.firstName,
      lastName: meeting.hostMember.lastName,
    } : null,
    participantCount: meeting.participants.length,
  };
}

export async function listMeetings(tenantId: string, filters: LiveMeetingFilters = {}): Promise<any[]> {
  const where: any = { tenantId };
  if (filters.hostMemberId) where.hostMemberId = filters.hostMemberId;
  if (filters.status) where.status = normalizeStatus(filters.status);
  if (filters.provider) where.provider = normalizeProvider(filters.provider);
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  const start = rangeStart(filters.dateFrom);
  const end = rangeEnd(filters.dateTo);
  if (start || end) where.scheduledStart = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };

  const page = Math.max(Number(filters.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize || 50), 1), 100);

  return db.liveMeeting.findMany({
    where,
    include: {
      hostMember: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true, chats: true, attendance: true, reminders: true } },
    },
    orderBy: { scheduledStart: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function startMeeting(tenantId: string, meetingId: string, userId?: string | null): Promise<any> {
  await assertPublicAccess(tenantId);
  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.status === 'ended' || meeting.status === 'cancelled') {
    throw new Error(`Cannot start a meeting that is already ${meeting.status}`);
  }

  const updated = await db.liveMeeting.update({
    where: { id: meetingId },
    data: { status: 'live' },
  });
  await logActivity(tenantId, userId, 'meeting_start', { meetingId });
  await logAnalytics(tenantId, 'start', meetingId, userId || null, { provider: meeting.provider });
  return updated;
}

export async function endMeeting(tenantId: string, meetingId: string, data?: { recordingUrl?: string }, userId?: string | null): Promise<any> {
  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.status === 'ended') return meeting;

  const updatedMeeting = await db.liveMeeting.update({
    where: { id: meetingId },
    data: {
      status: 'ended',
      recordingUrl: data?.recordingUrl || meeting.recordingUrl || null,
    },
  });

  if (data?.recordingUrl) {
    try {
      let category = await db.mediaCategory.findFirst({
        where: { slug: 'meeting-recordings', tenantId },
      });
      if (!category) {
        category = await db.mediaCategory.create({
          data: { tenantId, name: 'Meeting Recordings', slug: 'meeting-recordings' },
        });
      }

      await db.mediaAsset.create({
        data: {
          tenantId,
          categoryId: category.id,
          title: `Recording: ${meeting.title}`,
          description: meeting.description || 'Auto-archived meeting recording.',
          sourceUrl: data.recordingUrl,
          type: meeting.meetingType === 'audio' ? 'audio' : 'video',
          providerType: 'platform_managed',
          status: 'published',
          publishedAt: new Date(),
        },
      });
    } catch (err) {
      console.error('Failed to auto-archive live meeting recording:', err);
    }
  }

  await logActivity(tenantId, userId, 'meeting_end', { meetingId, hasRecording: Boolean(data?.recordingUrl) });
  await logAnalytics(tenantId, 'end', meetingId, userId || null, { hasRecording: Boolean(data?.recordingUrl) });
  return updatedMeeting;
}

export async function joinMeetingLobby(
  tenantId: string,
  meetingId: string,
  data: { firstName: string; lastName: string; email: string; memberId?: string }
): Promise<any> {
  await assertParticipantLimit(tenantId, meetingId);
  const firstName = required(data.firstName, 'firstName');
  const lastName = required(data.lastName, 'lastName');
  const email = required(data.email, 'email').toLowerCase();

  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');
  if (meeting.status === 'ended' || meeting.status === 'cancelled') throw new Error('Cannot join a meeting that has ended or been cancelled');
  if (meeting.isLocked) throw new Error('Meeting room is locked by the host');

  const { config } = await assertPublicAccess(tenantId);
  if (config.requireMemberAccess && !data.memberId) throw new Error('This meeting is members-only');
  if (!config.allowGuestAccess && !data.memberId) throw new Error('Guest access is disabled for this meeting');

  if (data.memberId) {
    const member = await db.member.findFirst({ where: { id: data.memberId, tenantId } });
    if (!member) throw new Error('Member not found');
  }

  const existing = await db.liveMeetingParticipant.findFirst({ where: { meetingId, email, tenantId } });
  if (existing) return existing;

  const participant = await db.liveMeetingParticipant.create({
    data: {
      tenantId,
      meetingId,
      memberId: data.memberId || null,
      firstName,
      lastName,
      email,
      role: 'participant',
      joinStatus: meeting.enableWaitingRoom ? 'in_waiting_room' : 'approved',
    },
  });
  await logActivity(tenantId, null, 'participant_join_lobby', { meetingId, participantId: participant.id });
  return participant;
}

export async function updateParticipantStatus(
  tenantId: string,
  meetingId: string,
  participantId: string,
  status: 'approved' | 'rejected'
): Promise<any> {
  allowed(status, PARTICIPANT_STATUSES, 'status');
  const participant = await db.liveMeetingParticipant.findFirst({ where: { id: participantId, meetingId, tenantId } });
  if (!participant) throw new Error('Participant not found');

  const updated = await db.liveMeetingParticipant.update({
    where: { id: participantId },
    data: { joinStatus: status },
  });
  await logActivity(tenantId, null, `participant_${status}`, { meetingId, participantId });
  return updated;
}

export async function updateParticipantRole(
  tenantId: string,
  meetingId: string,
  participantId: string,
  role: 'host' | 'co_host' | 'participant'
): Promise<any> {
  allowed(role, PARTICIPANT_ROLES, 'role');
  const participant = await db.liveMeetingParticipant.findFirst({ where: { id: participantId, meetingId, tenantId } });
  if (!participant) throw new Error('Participant not found');

  const updated = await db.liveMeetingParticipant.update({
    where: { id: participantId },
    data: { role },
  });
  await logActivity(tenantId, null, 'participant_role_update', { meetingId, participantId, role });
  return updated;
}

export async function toggleMeetingLock(tenantId: string, meetingId: string, isLocked: boolean, userId?: string | null): Promise<any> {
  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const updated = await db.liveMeeting.update({
    where: { id: meetingId },
    data: { isLocked },
  });
  await logActivity(tenantId, userId, isLocked ? 'meeting_lock' : 'meeting_unlock', { meetingId });
  return updated;
}

export async function postMeetingChat(
  tenantId: string,
  meetingId: string,
  data: { senderName: string; senderEmail: string; message: string }
): Promise<any> {
  const senderName = required(data.senderName, 'senderName');
  const senderEmail = required(data.senderEmail, 'senderEmail').toLowerCase();
  const message = required(data.message, 'message');

  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const chat = await db.liveMeetingChat.create({
    data: { tenantId, meetingId, senderName, senderEmail, message },
  });
  await logActivity(tenantId, null, 'chat_message', { meetingId, chatId: chat.id });
  return chat;
}

export async function linkWorshipSession(tenantId: string, meetingId: string, worshipSessionId: string, userId?: string | null): Promise<any> {
  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const session = await db.worshipSession.findFirst({ where: { id: worshipSessionId, tenantId } });
  if (!session) throw new Error('Worship session not found');

  const updated = await db.liveMeeting.update({
    where: { id: meetingId },
    data: { activeWorshipSessionId: worshipSessionId },
  });
  await logActivity(tenantId, userId, 'worship_link', { meetingId, worshipSessionId });
  return updated;
}

export async function trackParticipantJoin(tenantId: string, meetingId: string, email: string): Promise<any> {
  await assertPublicAccess(tenantId);
  const emailClean = required(email, 'email').toLowerCase();
  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const attendance = await db.liveMeetingAttendance.create({
    data: { tenantId, meetingId, participantEmail: emailClean, joinedAt: new Date() },
  });
  await logAnalytics(tenantId, 'attend', meetingId, null, { email: emailClean }, 1);
  return attendance;
}

export async function trackParticipantLeave(tenantId: string, meetingId: string, email: string): Promise<any> {
  const emailClean = required(email, 'email').toLowerCase();
  const attendance = await db.liveMeetingAttendance.findFirst({
    where: { meetingId, participantEmail: emailClean, tenantId, leftAt: null },
    orderBy: { joinedAt: 'desc' },
  });
  if (!attendance) throw new Error('Active attendance record not found');

  const leftAt = new Date();
  const durationMinutes = Math.max(1, Math.round((leftAt.getTime() - attendance.joinedAt.getTime()) / 60000));
  const updated = await db.liveMeetingAttendance.update({
    where: { id: attendance.id },
    data: { leftAt, durationMinutes },
  });
  await logAnalytics(tenantId, 'leave', meetingId, null, { email: emailClean }, durationMinutes);
  return updated;
}

export async function scheduleMeetingReminder(tenantId: string, meetingId: string, sendBeforeMinutes: number, userId?: string | null): Promise<any> {
  const minutes = optionalNumber(sendBeforeMinutes, 'sendBeforeMinutes');
  if (!minutes || minutes <= 0) throw new Error('sendBeforeMinutes must be greater than 0');

  const meeting = await db.liveMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) throw new Error('Meeting not found');

  const reminder = await db.liveMeetingReminder.create({
    data: { tenantId, meetingId, sendBeforeMinutes: minutes, status: 'pending' },
  });
  await logActivity(tenantId, userId, 'reminder_schedule', { meetingId, reminderId: reminder.id, sendBeforeMinutes: minutes });
  return reminder;
}

export async function triggerMeetingReminder(tenantId: string, reminderId: string, userId?: string | null): Promise<any> {
  const reminder = await db.liveMeetingReminder.findFirst({ where: { id: reminderId, tenantId } });
  if (!reminder) throw new Error('Meeting reminder not found');
  if (reminder.status === 'sent') return reminder;

  const updated = await db.liveMeetingReminder.update({
    where: { id: reminderId },
    data: { status: 'sent', sentAt: new Date() },
  });
  await logActivity(tenantId, userId, 'reminder_send', { reminderId, meetingId: reminder.meetingId });
  return updated;
}
