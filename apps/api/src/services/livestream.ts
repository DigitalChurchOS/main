import prisma from '../lib/prisma';
import { randomBytes } from 'crypto';

// ─────────────────────────────────────────────────────────────
// Helper: generate a stream key
// ─────────────────────────────────────────────────────────────
function generateStreamKey(): string {
  return `live_${randomBytes(16).toString('hex')}`;
}

// ─────────────────────────────────────────────────────────────
// STREAM LIFECYCLE
// ─────────────────────────────────────────────────────────────
interface ScheduleStreamInput {
  title: string;
  description?: string;
  scheduledAt?: string;
  thumbnailUrl?: string;
  countdownEnabled?: boolean;
  chatEnabled?: boolean;
  multiPlatformLinks?: Array<{ platform: string; url: string }>;
}

export async function scheduleStream(tenantId: string, data: ScheduleStreamInput) {
  await assertModuleEnabled(tenantId);
  const streamKey = generateStreamKey();
  const rtmpIngestUrl = `rtmp://ingest.churchos.io/live/${streamKey}`;

  return prisma.livestream.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      streamKey,
      rtmpIngestUrl,
      thumbnailUrl: data.thumbnailUrl,
      countdownEnabled: data.countdownEnabled ?? true,
      chatEnabled: data.chatEnabled ?? true,
      multiPlatformLinks: JSON.stringify(data.multiPlatformLinks || []),
      status: 'scheduled',
    },
  });
}

export async function getStream(id: string, tenantId: string) {
  const stream = await prisma.livestream.findFirst({
    where: { id, tenantId },
    include: {
      replayAsset: true,
    },
  });

  if (!stream) return null;

  return {
    ...stream,
    multiPlatformLinks: JSON.parse(stream.multiPlatformLinks || '[]'),
  };
}

export async function listStreams(tenantId: string, status?: string) {
  const where: any = { tenantId };
  if (status) where.status = status;

  const streams = await prisma.livestream.findMany({
    where,
    orderBy: { scheduledAt: 'desc' },
    include: {
      replayAsset: true,
      _count: { select: { viewers: true, chatMessages: true } },
    },
  });

  return streams.map((s) => ({
    ...s,
    multiPlatformLinks: JSON.parse(s.multiPlatformLinks || '[]'),
  }));
}

export async function goLive(id: string, tenantId: string) {
  await assertModuleEnabled(tenantId);
  const stream = await prisma.livestream.findFirst({ where: { id, tenantId } });
  if (!stream) throw new Error('Stream not found');
  if (stream.status !== 'scheduled') throw new Error('Stream must be in scheduled status to go live');

  return prisma.livestream.update({
    where: { id },
    data: {
      status: 'live',
      startedAt: new Date(),
    },
  });
}

export async function endStream(id: string, tenantId: string) {
  await assertModuleEnabled(tenantId);
  const stream = await prisma.livestream.findFirst({ where: { id, tenantId } });
  if (!stream) throw new Error('Stream not found');
  if (stream.status !== 'live') throw new Error('Stream must be live to end');

  const endedAt = new Date();

  // Auto-create a replay MediaAsset from the ended stream
  const replayAsset = await prisma.mediaAsset.create({
    data: {
      tenantId,
      title: `Replay: ${stream.title}`,
      description: stream.description || `Replay of livestream: ${stream.title}`,
      type: 'video',
      providerType: 'platform_managed',
      sourceUrl: `https://cdn.churchos.io/replays/${stream.streamKey}.mp4`,
      thumbnailUrl: stream.thumbnailUrl,
      durationSeconds: stream.startedAt
        ? Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000)
        : null,
      status: 'published',
      visibility: 'public',
      publishedAt: endedAt,
    },
  });

  return prisma.livestream.update({
    where: { id },
    data: {
      status: 'ended',
      endedAt,
      replayAssetId: replayAsset.id,
    },
    include: {
      replayAsset: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────
export async function sendChatMessage(
  livestreamId: string,
  tenantId: string,
  userId: string | null,
  displayName: string,
  message: string
) {
  return prisma.livestreamChat.create({
    data: { livestreamId, tenantId, userId, displayName, message },
  });
}

export async function getChatMessages(livestreamId: string, limit: number = 100) {
  return prisma.livestreamChat.findMany({
    where: { livestreamId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

// ─────────────────────────────────────────────────────────────
// VIEWER TRACKING
// ─────────────────────────────────────────────────────────────
export async function trackViewerJoin(
  livestreamId: string,
  tenantId: string,
  userId?: string,
  sessionId?: string
) {
  return prisma.livestreamViewer.create({
    data: { livestreamId, tenantId, userId, sessionId },
  });
}

export async function trackViewerLeave(viewerId: string) {
  const viewer = await prisma.livestreamViewer.findUnique({ where: { id: viewerId } });
  if (!viewer) throw new Error('Viewer session not found');

  const leftAt = new Date();
  const durationSeconds = Math.floor((leftAt.getTime() - viewer.joinedAt.getTime()) / 1000);

  return prisma.livestreamViewer.update({
    where: { id: viewerId },
    data: { leftAt, durationSeconds },
  });
}

export async function getStreamAnalytics(livestreamId: string) {
  const viewers = await prisma.livestreamViewer.findMany({
    where: { livestreamId },
  });

  const totalViewers = viewers.length;
  const uniqueUserIds = new Set(viewers.filter((v) => v.userId).map((v) => v.userId));
  const uniqueViewers = uniqueUserIds.size || totalViewers; // fallback to total if no userIds

  // Aggregate watch time in seconds
  const totalWatchTimeSeconds = viewers.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);

  // Compute peak concurrent viewers
  // Build a timeline of join/leave events
  const events: Array<{ time: Date; delta: number }> = [];
  for (const v of viewers) {
    events.push({ time: v.joinedAt, delta: 1 });
    if (v.leftAt) {
      events.push({ time: v.leftAt, delta: -1 });
    }
  }
  events.sort((a, b) => a.time.getTime() - b.time.getTime());

  let concurrent = 0;
  let peakConcurrent = 0;
  for (const event of events) {
    concurrent += event.delta;
    if (concurrent > peakConcurrent) {
      peakConcurrent = concurrent;
    }
  }

  // Interaction counts
  const interactions = await prisma.livestreamInteraction.groupBy({
    by: ['type'],
    where: { livestreamId },
    _count: true,
  });

  const interactionCounts: Record<string, number> = {};
  for (const group of interactions) {
    interactionCounts[group.type] = group._count;
  }

  // Chat message count
  const chatCount = await prisma.livestreamChat.count({ where: { livestreamId } });

  return {
    totalViewers,
    uniqueViewers,
    peakConcurrent,
    totalWatchTimeSeconds,
    chatMessages: chatCount,
    interactions: interactionCounts,
  };
}

// ─────────────────────────────────────────────────────────────
// INTERACTIONS (prayer, salvation, notes, giving)
// ─────────────────────────────────────────────────────────────
export async function submitInteraction(
  livestreamId: string,
  tenantId: string,
  type: string,
  userId?: string,
  content?: string
) {
  return prisma.livestreamInteraction.create({
    data: { livestreamId, tenantId, type, userId, content },
  });
}

export async function getInteractions(livestreamId: string, type?: string) {
  const where: any = { livestreamId };
  if (type) where.type = type;

  return prisma.livestreamInteraction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// EMBED CODE GENERATION
// ─────────────────────────────────────────────────────────────
export function generateStreamEmbed(stream: { id: string; title: string }): string {
  return `<iframe width="560" height="315" src="/live/${stream.id}" title="${stream.title}" frameborder="0" allowfullscreen></iframe>`;
}

// ─────────────────────────────────────────────────────────────
// MODULE ENHANCEMENTS (Settings, Activity, Profiles)
// ─────────────────────────────────────────────────────────────
export const LIVESTREAM_MODULE_KEY = 'livestream';

const DEFAULT_CONFIG = {
  enabled: true,
  adminPreviewOnly: true,
  publicPublishingEnabled: false,
  billingPlan: 'free',
  providerMode: 'hybrid',
  defaultProvider: 'youtube',
  embedWidth: 560,
  embedHeight: 315,
  chatEnabled: true,
  replayAutoArchive: true,
  smsRemindersEnabled: false,
  givingButtonEnabled: true,
  prayerRequestEnabled: true,
  salvationResponseEnabled: true,
  biblePanelEnabled: true,
  notesPanelEnabled: true,
  multilingualAudioEnabled: false,
  analyticsTrackingEnabled: true,
  autoAttachToServices: true,
  defaultVisibility: 'public',
};

const MODULE_STATUSES = new Set(['active', 'inactive', 'archived']);

import { trackEvent } from './analytics';

export async function assertModuleEnabled(tenantId: string) {
  const settings = await getSettings(tenantId);
  if (!settings.enabled) {
    throw new Error('Livestream Module is disabled for this tenant');
  }
}

export async function logActivity(
  tenantId: string,
  userId: string | null | undefined,
  actionType: string,
  metadata: any = {}
) {
  const activity = await prisma.livestreamModuleActivity.create({
    data: {
      tenantId,
      userId: userId || null,
      actionType,
      metadataJson: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}),
    },
  });

  await trackEvent(tenantId, {
    category: 'livestream',
    name: actionType,
    entityId: metadata.streamId || metadata.profileId || metadata.recordId || null,
    value: metadata.value ?? null,
    userId: userId || null,
    metadata,
  }).catch(() => undefined);

  return activity;
}

export async function listActivities(
  tenantId: string,
  options: { actionType?: string; limit?: number } = {}
) {
  return prisma.livestreamModuleActivity.findMany({
    where: {
      tenantId,
      ...(options.actionType ? { actionType: options.actionType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(Number(options.limit || 100), 1), 250),
  });
}

export async function getSettings(tenantId: string) {
  const settings = await prisma.livestreamModuleSettings.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: LIVESTREAM_MODULE_KEY } },
  });

  return settings || {
    id: 'default',
    tenantId,
    moduleKey: LIVESTREAM_MODULE_KEY,
    enabled: true,
    billingPlan: 'free',
    providerMode: 'hybrid',
    configJson: JSON.stringify(DEFAULT_CONFIG),
    updatedAt: new Date(),
  };
}

export async function updateSettings(
  tenantId: string,
  data: { enabled?: boolean; billingPlan?: string; providerMode?: string; configJson?: any },
  userId?: string | null
) {
  const current = await getSettings(tenantId);
  const currentConfig = typeof current.configJson === 'string'
    ? JSON.parse(current.configJson)
    : current.configJson || DEFAULT_CONFIG;
  const incoming = typeof data.configJson === 'string'
    ? JSON.parse(data.configJson)
    : data.configJson || {};
  const configJson = JSON.stringify({
    ...currentConfig,
    ...incoming,
  });

  const settings = await prisma.livestreamModuleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: LIVESTREAM_MODULE_KEY } },
    update: {
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.billingPlan !== undefined && { billingPlan: data.billingPlan }),
      ...(data.providerMode !== undefined && { providerMode: data.providerMode }),
      configJson,
    },
    create: {
      tenantId,
      moduleKey: LIVESTREAM_MODULE_KEY,
      enabled: data.enabled ?? true,
      billingPlan: data.billingPlan || 'free',
      providerMode: data.providerMode || 'hybrid',
      configJson,
    },
  });

  // Also sync to global ModuleSettings table
  await prisma.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: LIVESTREAM_MODULE_KEY } },
    update: { settings: settings.configJson },
    create: { tenantId, moduleKey: LIVESTREAM_MODULE_KEY, settings: settings.configJson },
  });

  await logActivity(tenantId, userId, 'settings_updated', {
    fields: Object.keys(data),
    providerMode: settings.providerMode,
    enabled: settings.enabled,
  });

  return settings;
}

export async function createProfile(
  tenantId: string,
  data: { title: string; description?: string | null; visibility?: string; settingsJson?: any },
  userId?: string | null
) {
  const title = data.title;
  if (!title) throw new Error('title is required');
  const visibility = data.visibility || 'private';

  const record = await prisma.livestreamModule.create({
    data: {
      tenantId,
      title,
      description: data.description || null,
      visibility,
      settingsJson: data.settingsJson !== undefined
        ? (typeof data.settingsJson === 'string' ? data.settingsJson : JSON.stringify(data.settingsJson))
        : '{}',
      createdById: userId || null,
    },
  });

  await logActivity(tenantId, userId, 'profile_created', { profileId: record.id, title });
  return record;
}

export async function listProfiles(tenantId: string) {
  return prisma.livestreamModule.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProfile(id: string, tenantId: string) {
  const record = await prisma.livestreamModule.findFirst({
    where: { id, tenantId },
  });
  if (!record) throw new Error('Livestream module profile not found');
  return record;
}

export async function updateProfile(
  id: string,
  tenantId: string,
  data: { title?: string; description?: string | null; visibility?: string; settingsJson?: any; status?: string },
  userId?: string | null
) {
  const existing = await getProfile(id, tenantId);
  if (data.status && !MODULE_STATUSES.has(data.status)) {
    throw new Error(`status must be one of: ${Array.from(MODULE_STATUSES).join(', ')}`);
  }

  const record = await prisma.livestreamModule.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.visibility !== undefined && { visibility: data.visibility }),
      ...(data.settingsJson !== undefined && {
        settingsJson: typeof data.settingsJson === 'string' ? data.settingsJson : JSON.stringify(data.settingsJson),
      }),
    },
  });

  await logActivity(tenantId, userId, 'profile_updated', { profileId: record.id, fields: Object.keys(data) });
  return record;
}

export async function deleteProfile(id: string, tenantId: string, userId?: string | null) {
  const existing = await getProfile(id, tenantId);
  const record = await prisma.livestreamModule.update({
    where: { id: existing.id },
    data: { status: 'archived' },
  });

  await logActivity(tenantId, userId, 'profile_archived', { profileId: record.id, title: record.title });
  return record;
}

export async function getOverview(tenantId: string) {
  const [streams, settings, activity, profiles] = await Promise.all([
    prisma.livestream.findMany({ where: { tenantId } }),
    getSettings(tenantId),
    listActivities(tenantId, { limit: 10 }),
    listProfiles(tenantId),
  ]);

  const byStatus: Record<string, number> = {};
  for (const s of streams) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  }

  return {
    moduleKey: LIVESTREAM_MODULE_KEY,
    settings,
    counts: {
      streams: streams.length,
      profiles: profiles.length,
      scheduled: byStatus.scheduled || 0,
      live: byStatus.live || 0,
      ended: byStatus.ended || 0,
      archived: byStatus.archived || 0,
      activity: activity.length,
    },
  };
}

