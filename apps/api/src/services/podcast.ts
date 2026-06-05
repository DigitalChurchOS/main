import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function formatCdata(text: string | null | undefined): string {
  if (!text) return '';
  const cleanText = text.replace(/\]\]>/g, ']]&gt;');
  return `<![CDATA[${cleanText}]]>`;
}

/**
 * ─────────────────────────────────────────────────────────────
 * BILLING & MODULE ENABLING ASSERTS
 * ─────────────────────────────────────────────────────────────
 */

export async function assertPublicAccessAllowed(tenantId: string): Promise<void> {
  // Check entitlement status
  const entitlement = await prisma.tenantModule.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'podcast-audio-broadcasting' } },
  });
  if (!entitlement || entitlement.status === 'suspended' || entitlement.status === 'inactive') {
    throw new Error('Podcast module is inactive or suspended for this tenant.');
  }

  // Check module settings
  const settings = await getPodcastSettings(tenantId);
  if (!settings.enabled) {
    throw new Error('Podcast module is disabled by the administrator.');
  }

  // Block unpaid/free plan churches from publishing publicly if configured
  if (!settings.allowPublicPublishing) {
    throw new Error('Public publishing is restricted for this tenant plan.');
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * AUDIT LOG / ACTIVITY SERVICE
 * ─────────────────────────────────────────────────────────────
 */

export class PodcastActivityService {
  static async log(
    tenantId: string,
    userId: string | null | undefined,
    actionType: string,
    metadata: any = {},
    channelId?: string,
    episodeId?: string,
    playlistId?: string,
    ipHash?: string,
    userAgent?: string
  ) {
    return await prisma.podcastActivity.create({
      data: {
        tenantId,
        userId: userId || null,
        actionType,
        metadataJson: JSON.stringify(metadata),
        channelId: channelId || null,
        episodeId: episodeId || null,
        playlistId: playlistId || null,
        ipHash: ipHash || null,
        userAgent: userAgent || null,
      },
    });
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * MODULE SETTINGS SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function getPodcastSettings(tenantId: string): Promise<any> {
  let settings = await prisma.podcastAudioBroadcastingModuleSettings.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'podcast-audio-broadcasting' } },
  });
  if (!settings) {
    settings = await prisma.podcastAudioBroadcastingModuleSettings.create({
      data: {
        tenantId,
        moduleKey: 'podcast-audio-broadcasting',
        enabled: true,
        billingPlan: 'free',
        providerMode: 'hybrid',
        allowPublicPublishing: true,
        allowRssFeed: true,
        allowExternalDistribution: true,
        defaultChannelVisibility: 'public',
        defaultEpisodeVisibility: 'public',
        defaultLanguage: 'en',
        defaultCategory: 'Religion & Spirituality',
        configJson: '{}',
      },
    });
  }
  return settings;
}

export async function updatePodcastSettings(tenantId: string, data: any): Promise<any> {
  return await prisma.podcastAudioBroadcastingModuleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: 'podcast-audio-broadcasting' } },
    create: {
      tenantId,
      moduleKey: 'podcast-audio-broadcasting',
      ...data,
    },
    update: data,
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * CHANNEL CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createChannel(
  tenantId: string,
  createdById: string | null,
  data: {
    title: string;
    slug?: string;
    description?: string;
    coverImageMediaId?: string;
    language?: string;
    category: string;
    subcategory?: string;
    authorName: string;
    ownerName?: string;
    ownerEmail?: string;
    copyrightText?: string;
    explicitContent?: boolean;
    rssEnabled?: boolean;
    rssSlug?: string;
    externalLinksJson?: string;
    seoTitle?: string;
    seoDescription?: string;
    visibility?: string;
    status?: string;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);
  const rssSlug = data.rssSlug ? slugify(data.rssSlug) : slug;

  const existing = await prisma.podcastChannel.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Podcast channel with slug '${slug}' already exists`);
  }

  const rssUrl = `https://churchos.io/api/podcast-audio-broadcasting/rss/${tenantId}/${rssSlug}`;

  let extLinks: any = {};
  try {
    if (data.externalLinksJson) extLinks = JSON.parse(data.externalLinksJson);
  } catch (e) {}
  if (data.subcategory) {
    extLinks.subcategory = data.subcategory;
  }

  const channel = await prisma.podcastChannel.create({
    data: {
      tenantId,
      title: data.title,
      slug,
      description: data.description || null,
      coverImageMediaId: data.coverImageMediaId || null,
      language: data.language || 'en',
      category: data.category,
      authorName: data.authorName,
      ownerName: data.ownerName || null,
      ownerEmail: data.ownerEmail || null,
      copyrightText: data.copyrightText || null,
      explicitContent: data.explicitContent !== undefined ? data.explicitContent : false,
      rssEnabled: data.rssEnabled !== undefined ? data.rssEnabled : true,
      rssSlug,
      rssUrl,
      externalLinksJson: JSON.stringify(extLinks),
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      visibility: data.visibility || 'public',
      status: data.status || 'draft',
      createdBy: createdById,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
  });

  await PodcastActivityService.log(tenantId, createdById, 'podcast.channel.created', { title: channel.title }, channel.id);
  return channel;
}

export async function updateChannel(
  id: string,
  tenantId: string,
  updatedById: string | null,
  data: any
): Promise<any> {
  const channel = await prisma.podcastChannel.findFirst({
    where: { id, tenantId },
  });
  if (!channel) {
    throw new Error('Podcast channel not found');
  }

  let slug = channel.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.podcastChannel.findFirst({
      where: { tenantId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Podcast channel with slug '${slug}' already exists`);
    }
  }

  let rssSlug = channel.rssSlug;
  if (data.rssSlug) {
    rssSlug = slugify(data.rssSlug);
  } else if (data.slug) {
    rssSlug = slug;
  }

  const rssUrl = `https://churchos.io/api/podcast-audio-broadcasting/rss/${tenantId}/${rssSlug}`;
  const publishedAt = data.status === 'published' && channel.status !== 'published' ? new Date() : channel.publishedAt;

  // Extract non-DB fields to externalLinksJson
  let extLinks: any = {};
  try {
    const jsonStr = data.externalLinksJson || channel.externalLinksJson || '{}';
    extLinks = JSON.parse(jsonStr);
  } catch (e) {}

  if (data.subcategory !== undefined) {
    extLinks.subcategory = data.subcategory;
  }

  // Construct valid DB update payload
  const updateData: any = {};
  const dbFields = [
    'title', 'description', 'coverImageMediaId', 'language', 'category',
    'authorName', 'ownerName', 'ownerEmail', 'copyrightText', 'explicitContent',
    'rssEnabled', 'visibility', 'status', 'seoTitle', 'seoDescription'
  ];

  for (const field of dbFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  updateData.slug = slug;
  updateData.rssSlug = rssSlug;
  updateData.rssUrl = rssUrl;
  updateData.publishedAt = publishedAt;
  updateData.updatedBy = updatedById;
  updateData.externalLinksJson = JSON.stringify(extLinks);

  const updated = await prisma.podcastChannel.update({
    where: { id },
    data: updateData,
  });

  await PodcastActivityService.log(tenantId, updatedById, 'podcast.channel.updated', { title: updated.title }, updated.id);
  return updated;
}

export async function deleteChannel(id: string, tenantId: string, userId: string | null): Promise<any> {
  const channel = await prisma.podcastChannel.findFirst({
    where: { id, tenantId },
  });
  if (!channel) {
    throw new Error('Podcast channel not found');
  }

  // Soft delete by archiving
  const deleted = await prisma.podcastChannel.update({
    where: { id },
    data: { status: 'archived' },
  });

  await PodcastActivityService.log(tenantId, userId, 'podcast.channel.deleted', { title: deleted.title }, deleted.id);
  return deleted;
}

export async function getChannel(idOrSlug: string, tenantId: string): Promise<any> {
  const channel = await prisma.podcastChannel.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      episodes: {
        where: { status: { not: 'archived' } },
        orderBy: { publishAt: 'desc' },
      },
    },
  });

  if (!channel) {
    throw new Error('Podcast channel not found');
  }

  return channel;
}

export async function listChannels(
  tenantId: string,
  filters: {
    status?: string;
    search?: string;
    visibility?: string;
  } = {}
): Promise<any[]> {
  const whereClause: any = {
    tenantId,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  } else {
    whereClause.status = { not: 'archived' };
  }

  if (filters.visibility) {
    whereClause.visibility = filters.visibility;
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return await prisma.podcastChannel.findMany({
    where: whereClause,
    orderBy: { title: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * EPISODE CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createEpisode(
  tenantId: string,
  createdById: string | null,
  data: {
    channelId: string;
    title: string;
    slug?: string;
    description?: string;
    showNotes?: string;
    audioMediaId: string;
    coverImageMediaId?: string;
    speakerId?: string;
    guestSpeakerName?: string;
    seriesId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    durationSeconds?: number;
    audioMimeType?: string;
    audioFileSize?: number;
    publishAt?: Date | string;
    visibility?: string;
    status?: string;
    allowRss?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    metadataJson?: string;
  }
): Promise<any> {
  const channel = await prisma.podcastChannel.findFirst({
    where: { id: data.channelId, tenantId },
  });
  if (!channel) {
    throw new Error('Podcast channel not found');
  }

  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  const existing = await prisma.podcastEpisode.findFirst({
    where: { tenantId, channelId: data.channelId, slug },
  });
  if (existing) {
    throw new Error(`Podcast episode with slug '${slug}' already exists for this channel`);
  }

  const publishAt = data.publishAt ? new Date(data.publishAt) : new Date();
  const publishedAt = data.status === 'published' && publishAt <= new Date() ? new Date() : null;

  const episode = await prisma.podcastEpisode.create({
    data: {
      tenantId,
      channelId: data.channelId,
      title: data.title,
      slug,
      description: data.description || null,
      showNotes: data.showNotes || null,
      audioMediaId: data.audioMediaId,
      coverImageMediaId: data.coverImageMediaId || null,
      speakerId: data.speakerId || null,
      guestSpeakerName: data.guestSpeakerName || null,
      seriesId: data.seriesId || null,
      seasonNumber: data.seasonNumber || null,
      episodeNumber: data.episodeNumber || null,
      durationSeconds: data.durationSeconds || null,
      audioMimeType: data.audioMimeType || 'audio/mpeg',
      audioFileSize: data.audioFileSize || null,
      publishAt,
      publishedAt,
      visibility: data.visibility || 'public',
      status: data.status || 'draft',
      allowRss: data.allowRss !== undefined ? data.allowRss : true,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      metadataJson: data.metadataJson || '{}',
      createdBy: createdById,
    },
  });

  await PodcastActivityService.log(tenantId, createdById, 'podcast.episode.created', { title: episode.title }, channel.id, episode.id);
  return episode;
}

export async function updateEpisode(
  id: string,
  tenantId: string,
  updatedById: string | null,
  data: any
): Promise<any> {
  const episode = await prisma.podcastEpisode.findFirst({
    where: { id, tenantId },
  });
  if (!episode) {
    throw new Error('Podcast episode not found');
  }

  let slug = episode.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.podcastEpisode.findFirst({
      where: { tenantId, channelId: episode.channelId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Podcast episode with slug '${slug}' already exists for this channel`);
    }
  }

  const publishAt = data.publishAt !== undefined ? new Date(data.publishAt) : episode.publishAt;
  const publishedAt = data.status === 'published' && publishAt <= new Date() ? new Date() : episode.publishedAt;

  const updated = await prisma.podcastEpisode.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishAt,
      publishedAt,
      updatedBy: updatedById,
    },
  });

  await PodcastActivityService.log(tenantId, updatedById, 'podcast.episode.updated', { title: updated.title }, updated.channelId, updated.id);
  return updated;
}

export async function deleteEpisode(id: string, tenantId: string, userId: string | null): Promise<any> {
  const episode = await prisma.podcastEpisode.findFirst({
    where: { id, tenantId },
  });
  if (!episode) {
    throw new Error('Podcast episode not found');
  }

  const deleted = await prisma.podcastEpisode.update({
    where: { id },
    data: { status: 'archived' },
  });

  await PodcastActivityService.log(tenantId, userId, 'podcast.episode.deleted', { title: deleted.title }, deleted.channelId, deleted.id);
  return deleted;
}

export async function getEpisode(idOrSlug: string, tenantId: string): Promise<any> {
  const episode = await prisma.podcastEpisode.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      channel: true,
      speaker: true,
      series: true,
      scriptures: true,
      resources: true,
    },
  });

  if (!episode) {
    throw new Error('Podcast episode not found');
  }

  return episode;
}

export async function listEpisodes(
  channelId: string,
  tenantId: string,
  filters: {
    status?: string;
    speakerId?: string;
    seriesId?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<{ episodes: any[]; total: number; page: number; limit: number }> {
  const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
  const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    channelId,
    tenantId,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  } else {
    whereClause.status = { not: 'archived' };
  }

  if (filters.speakerId) {
    whereClause.speakerId = filters.speakerId;
  }

  if (filters.seriesId) {
    whereClause.seriesId = filters.seriesId;
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  const [episodes, total] = await Promise.all([
    prisma.podcastEpisode.findMany({
      where: whereClause,
      include: { speaker: true, series: true },
      orderBy: { publishAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.podcastEpisode.count({ where: whereClause }),
  ]);

  return {
    episodes,
    total,
    page,
    limit,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * SPEAKERS SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createSpeaker(tenantId: string, data: any): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  return await prisma.podcastSpeaker.create({
    data: {
      tenantId,
      name: data.name,
      slug,
      title: data.title || null,
      bio: data.bio || null,
      photoMediaId: data.photoMediaId || null,
      externalLinksJson: data.externalLinksJson || '{}',
      status: data.status || 'active',
    },
  });
}

export async function updateSpeaker(id: string, tenantId: string, data: any): Promise<any> {
  let slug = data.slug;
  if (slug) {
    slug = slugify(slug);
  }
  return await prisma.podcastSpeaker.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
    },
  });
}

export async function deleteSpeaker(id: string, tenantId: string): Promise<any> {
  return await prisma.podcastSpeaker.update({
    where: { id },
    data: { status: 'inactive' },
  });
}

export async function getSpeaker(idOrSlug: string, tenantId: string): Promise<any> {
  const speaker = await prisma.podcastSpeaker.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
  if (!speaker) throw new Error('Speaker not found');
  return speaker;
}

export async function listSpeakers(tenantId: string): Promise<any[]> {
  return await prisma.podcastSpeaker.findMany({
    where: { tenantId, status: 'active' },
    orderBy: { name: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * SERIES SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createSeries(tenantId: string, createdById: string | null, data: any): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);
  return await prisma.podcastSeries.create({
    data: {
      tenantId,
      title: data.title,
      slug,
      description: data.description || null,
      coverImageMediaId: data.coverImageMediaId || null,
      speakerId: data.speakerId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      visibility: data.visibility || 'public',
      status: data.status || 'active',
      createdBy: createdById,
    },
  });
}

export async function updateSeries(id: string, tenantId: string, data: any): Promise<any> {
  let slug = data.slug;
  if (slug) {
    slug = slugify(slug);
  }
  return await prisma.podcastSeries.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
  });
}

export async function deleteSeries(id: string, tenantId: string): Promise<any> {
  return await prisma.podcastSeries.update({
    where: { id },
    data: { status: 'archived' },
  });
}

export async function getSeries(idOrSlug: string, tenantId: string): Promise<any> {
  const series = await prisma.podcastSeries.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      episodes: true,
      speaker: true,
    },
  });
  if (!series) throw new Error('Series not found');
  return series;
}

export async function listSeries(tenantId: string): Promise<any[]> {
  return await prisma.podcastSeries.findMany({
    where: { tenantId, status: 'active' },
    orderBy: { title: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * PLAYLISTS SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createPlaylist(tenantId: string, createdById: string | null, data: any): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);
  return await prisma.podcastPlaylist.create({
    data: {
      tenantId,
      title: data.title,
      slug,
      description: data.description || null,
      coverImageMediaId: data.coverImageMediaId || null,
      visibility: data.visibility || 'public',
      status: data.status || 'active',
      featured: data.featured || false,
      createdBy: createdById,
    },
  });
}

export async function updatePlaylist(id: string, tenantId: string, data: any): Promise<any> {
  let slug = data.slug;
  if (slug) {
    slug = slugify(slug);
  }
  return await prisma.podcastPlaylist.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
    },
  });
}

export async function deletePlaylist(id: string, tenantId: string): Promise<any> {
  return await prisma.podcastPlaylist.update({
    where: { id },
    data: { status: 'archived' },
  });
}

export async function getPlaylist(idOrSlug: string, tenantId: string): Promise<any> {
  const playlist = await prisma.podcastPlaylist.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      items: {
        orderBy: { displayOrder: 'asc' },
        include: { episode: true },
      },
    },
  });
  if (!playlist) throw new Error('Playlist not found');
  return playlist;
}

export async function listPlaylists(tenantId: string): Promise<any[]> {
  return await prisma.podcastPlaylist.findMany({
    where: { tenantId, status: 'active' },
    orderBy: { title: 'asc' },
  });
}

export async function addPlaylistItem(tenantId: string, playlistId: string, episodeId: string, displayOrder: number): Promise<any> {
  return await prisma.podcastPlaylistItem.create({
    data: {
      tenantId,
      playlistId,
      episodeId,
      displayOrder,
    },
  });
}

export async function reorderPlaylistItems(tenantId: string, playlistId: string, items: { episodeId: string; displayOrder: number }[]): Promise<void> {
  // Simple reordering transaction
  await prisma.podcastPlaylistItem.deleteMany({
    where: { tenantId, playlistId },
  });

  await prisma.podcastPlaylistItem.createMany({
    data: items.map((it) => ({
      tenantId,
      playlistId,
      episodeId: it.episodeId,
      displayOrder: it.displayOrder,
    })),
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * RSS XML FEED GENERATOR
 * ─────────────────────────────────────────────────────────────
 */

export async function generateRssFeed(channelSlug: string, tenantId: string): Promise<string> {
  await assertPublicAccessAllowed(tenantId);

  const channel = await prisma.podcastChannel.findFirst({
    where: { slug: channelSlug, tenantId, status: 'published', visibility: 'public' },
    include: {
      episodes: {
        where: {
          status: 'published',
          visibility: 'public',
          allowRss: true,
          publishAt: { lte: new Date() },
        },
        orderBy: { publishAt: 'desc' },
      },
    },
  });

  if (!channel) {
    throw new Error('Podcast channel not found or not published');
  }

  // Generate audit activity log
  await PodcastActivityService.log(tenantId, null, 'podcast.rss.requested', { slug: channelSlug }, channel.id);

  // Fetch cover URL if media ID is set
  let coverUrl = 'https://churchos.io/podcasts/default-cover.jpg';
  if (channel.coverImageMediaId) {
    if (channel.coverImageMediaId.startsWith('http://') || channel.coverImageMediaId.startsWith('https://')) {
      coverUrl = channel.coverImageMediaId;
    } else {
      const asset = await prisma.mediaAsset.findUnique({ where: { id: channel.coverImageMediaId } });
      if (asset && asset.sourceUrl) coverUrl = asset.sourceUrl;
    }
  }

  const siteLink = channel.rssUrl || `https://churchos.io/podcasts/${channel.slug}`;
  const feedLink = `https://churchos.io/api/podcast-audio-broadcasting/rss/${tenantId}/${channel.slug}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${escapeXml(feedLink)}" rel="self" type="application/rss+xml" />
    <title>${formatCdata(channel.title)}</title>
    <description>${formatCdata(channel.description || channel.title)}</description>
    <link>${escapeXml(siteLink)}</link>
    <language>${escapeXml(channel.language)}</language>
    <copyright>${formatCdata(channel.copyrightText || `${new Date().getFullYear()} ${channel.authorName}`)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>${escapeXml(channel.authorName)}</itunes:author>
    <itunes:summary>${escapeXml(channel.description || channel.title)}</itunes:summary>
    <itunes:explicit>${channel.explicitContent ? 'yes' : 'no'}</itunes:explicit>
`;

  if (channel.ownerEmail) {
    xml += `    <itunes:owner>
      <itunes:name>${escapeXml(channel.authorName)}</itunes:name>
      <itunes:email>${escapeXml(channel.ownerEmail)}</itunes:email>
    </itunes:owner>\n`;
  } else {
    xml += `    <itunes:owner>
      <itunes:name>${escapeXml(channel.authorName)}</itunes:name>
    </itunes:owner>\n`;
  }

  xml += `    <itunes:image href="${escapeXml(coverUrl)}" />\n`;

  let subcategory = '';
  try {
    const extLinks = JSON.parse(channel.externalLinksJson || '{}');
    if (extLinks.subcategory) {
      subcategory = extLinks.subcategory;
    }
  } catch (e) {}

  if (subcategory) {
    xml += `    <itunes:category text="${escapeXml(channel.category)}">\n`;
    xml += `      <itunes:category text="${escapeXml(subcategory)}" />\n`;
    xml += `    </itunes:category>\n`;
  } else {
    xml += `    <itunes:category text="${escapeXml(channel.category)}" />\n`;
  }

  for (const episode of channel.episodes) {
    const guid = episode.id;
    const pubDate = new Date(episode.publishAt).toUTCString();

    // Look up audio file properties
    let episodeAudioUrl = '';
    let episodeCoverUrl = coverUrl;

    if (episode.audioMediaId && (episode.audioMediaId.startsWith('http://') || episode.audioMediaId.startsWith('https://'))) {
      episodeAudioUrl = episode.audioMediaId;
    } else {
      const audioAsset = await prisma.mediaAsset.findUnique({ where: { id: episode.audioMediaId } });
      if (audioAsset && audioAsset.sourceUrl) {
        episodeAudioUrl = audioAsset.sourceUrl;
      }
    }

    if (episode.coverImageMediaId) {
      if (episode.coverImageMediaId.startsWith('http://') || episode.coverImageMediaId.startsWith('https://')) {
        episodeCoverUrl = episode.coverImageMediaId;
      } else {
        const coverAsset = await prisma.mediaAsset.findUnique({ where: { id: episode.coverImageMediaId } });
        if (coverAsset && coverAsset.sourceUrl) episodeCoverUrl = coverAsset.sourceUrl;
      }
    }

    let isExplicit = false;
    try {
      const meta = JSON.parse(episode.metadataJson || '{}');
      isExplicit = !!meta.explicit;
    } catch (e) {}

    xml += `    <item>
      <title>${formatCdata(episode.title)}</title>
      <description>${formatCdata(episode.description || episode.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <enclosure url="${escapeXml(episodeAudioUrl)}" length="${episode.audioFileSize || 0}" type="${escapeXml(episode.audioMimeType)}" />
      <itunes:explicit>${isExplicit ? 'yes' : 'no'}</itunes:explicit>
      <itunes:image href="${escapeXml(episodeCoverUrl)}" />
`;

    if (episode.durationSeconds !== null && episode.durationSeconds !== undefined) {
      xml += `      <itunes:duration>${episode.durationSeconds}</itunes:duration>\n`;
    }
    if (episode.seasonNumber !== null && episode.seasonNumber !== undefined) {
      xml += `      <itunes:season>${episode.seasonNumber}</itunes:season>\n`;
    }
    if (episode.episodeNumber !== null && episode.episodeNumber !== undefined) {
      xml += `      <itunes:episode>${episode.episodeNumber}</itunes:episode>\n`;
    }

    xml += `    </item>\n`;
  }

  xml += `  </channel>
</rss>`;

  return xml;
}

/**
 * ─────────────────────────────────────────────────────────────
 * ANALYTICS SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function recordPodcastPlay(tenantId: string, episodeId: string, metadata: any = {}): Promise<void> {
  const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
  if (!episode) return;

  await PodcastActivityService.log(
    tenantId,
    metadata.userId || null,
    'podcast.episode.played',
    metadata,
    episode.channelId,
    episodeId,
    undefined,
    metadata.ipHash,
    metadata.userAgent
  );

  // Increment daily analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.podcastAnalyticsDaily.upsert({
    where: {
      tenantId_channelId_episodeId_date: {
        tenantId,
        channelId: episode.channelId,
        episodeId,
        date: today,
      },
    },
    create: {
      tenantId,
      channelId: episode.channelId,
      episodeId,
      date: today,
      totalPlays: 1,
      uniqueListeners: 1,
    },
    update: {
      totalPlays: { increment: 1 },
      uniqueListeners: { increment: 1 },
    },
  });
}

export async function recordPodcastDownload(tenantId: string, episodeId: string, metadata: any = {}): Promise<void> {
  const episode = await prisma.podcastEpisode.findUnique({ where: { id: episodeId } });
  if (!episode) return;

  await PodcastActivityService.log(
    tenantId,
    metadata.userId || null,
    'podcast.episode.downloaded',
    metadata,
    episode.channelId,
    episodeId,
    undefined,
    metadata.ipHash,
    metadata.userAgent
  );

  // Increment daily analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.podcastAnalyticsDaily.upsert({
    where: {
      tenantId_channelId_episodeId_date: {
        tenantId,
        channelId: episode.channelId,
        episodeId,
        date: today,
      },
    },
    create: {
      tenantId,
      channelId: episode.channelId,
      episodeId,
      date: today,
      totalDownloads: 1,
    },
    update: {
      totalDownloads: { increment: 1 },
    },
  });
}

export async function getPodcastAnalytics(tenantId: string): Promise<any> {
  const [totalActivity, channelsCount, episodesCount, channelsList, dailyMetrics] = await Promise.all([
    prisma.podcastActivity.count({ where: { tenantId } }),
    prisma.podcastChannel.count({ where: { tenantId, status: { not: 'archived' } } }),
    prisma.podcastEpisode.count({ where: { tenantId, status: { not: 'archived' } } }),
    prisma.podcastChannel.findMany({
      where: { tenantId, status: { not: 'archived' } },
      include: {
        episodes: {
          where: { status: { not: 'archived' } },
          select: { title: true, id: true },
        },
      },
    }),
    prisma.podcastAnalyticsDaily.findMany({
      where: { tenantId },
      select: { episodeId: true, totalPlays: true, totalDownloads: true },
    }),
  ]);

  const playCounts: Record<string, number> = {};
  const downloadCounts: Record<string, number> = {};
  for (const metric of dailyMetrics) {
    if (!metric.episodeId) continue;
    playCounts[metric.episodeId] = (playCounts[metric.episodeId] || 0) + metric.totalPlays;
    downloadCounts[metric.episodeId] = (downloadCounts[metric.episodeId] || 0) + metric.totalDownloads;
  }

  let totalPlays = 0;
  let totalDownloads = 0;
  const topEpisodes: any[] = [];

  for (const ch of channelsList) {
    for (const ep of ch.episodes) {
      const plays = playCounts[ep.id] || 0;
      const downloads = downloadCounts[ep.id] || 0;
      totalPlays += plays;
      totalDownloads += downloads;
      topEpisodes.push({
        id: ep.id,
        title: ep.title,
        channelTitle: ch.title,
        plays,
        downloads,
      });
    }
  }

  topEpisodes.sort((a, b) => (b.plays + b.downloads) - (a.plays + a.downloads));

  const recentActivity = await prisma.podcastActivity.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    totalPlays,
    totalDownloads,
    uniqueListeners: totalPlays, // Simulated logic
    totalActivity,
    counts: {
      channels: channelsCount,
      episodes: episodesCount,
    },
    topEpisodes: topEpisodes.slice(0, 5),
    recentActivity,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * DISTRIBUTION SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function listDistributionTargets(tenantId: string, channelId: string): Promise<any[]> {
  return await prisma.podcastDistributionTarget.findMany({
    where: { tenantId, channelId },
  });
}

export async function connectDistributionTarget(tenantId: string, channelId: string, provider: string, settingsJson: any): Promise<any> {
  return await prisma.podcastDistributionTarget.create({
    data: {
      tenantId,
      channelId,
      provider,
      status: 'active',
      settingsJson: JSON.stringify(settingsJson),
    },
  });
}

export async function deleteDistributionTarget(id: string, tenantId: string): Promise<any> {
  return await prisma.podcastDistributionTarget.delete({
    where: { id },
  });
}
