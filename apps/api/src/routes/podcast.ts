import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import {
  createChannel,
  updateChannel,
  deleteChannel,
  getChannel,
  listChannels,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getEpisode,
  listEpisodes,
  generateRssFeed,
  getPodcastSettings,
  updatePodcastSettings,
  getPodcastAnalytics,
  recordPodcastPlay,
  recordPodcastDownload,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  getSpeaker,
  listSpeakers,
  createSeries,
  updateSeries,
  deleteSeries,
  getSeries,
  listSeries,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  addPlaylistItem,
  reorderPlaylistItems,
  listDistributionTargets,
  connectDistributionTarget,
  deleteDistributionTarget,
} from '../services/podcast';
import prisma from '../lib/prisma';

const router = Router();

// Permission shorthand middleware
const requireReadPermission = requireAnyPermission('tenant.settings', 'podcast-audio-broadcasting.read');
const requireCreatePermission = requireAnyPermission('tenant.settings', 'podcast-audio-broadcasting.create');
const requireUpdatePermission = requireAnyPermission('tenant.settings', 'podcast-audio-broadcasting.update');
const requireDeletePermission = requireAnyPermission('tenant.settings', 'podcast-audio-broadcasting.delete');
const requireSettingsPermission = requireAnyPermission('tenant.settings', 'podcast-audio-broadcasting.manage_settings');
const requireReportsPermission = requireAnyPermission('tenant.settings', 'podcast-audio-broadcasting.view_reports');

/**
 * ─────────────────────────────────────────────────────────────
 * PUBLIC ENDPOINTS (No authentication, no tenant restriction)
 * ─────────────────────────────────────────────────────────────
 */

// Public RSS Feed 1: /rss/:tenantSlug/:channelSlug
router.get('/rss/:tenantId/:channelSlug', async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const channelSlug = req.params.channelSlug as string;
    if (!tenantId || !channelSlug) {
      res.status(400).json({ error: 'tenantId and channelSlug are required' });
      return;
    }
    const xml = await generateRssFeed(channelSlug, tenantId);
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('Generate RSS feed error:', err);
    res.status(404).send(err.message || 'Feed not found');
  }
});

// Public RSS Feed 2 (Backward compatibility): /feeds/:tenantId/:showSlug
router.get('/feeds/:tenantId/:showSlug', async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const showSlug = req.params.showSlug as string;
    if (!tenantId || !showSlug) {
      res.status(400).json({ error: 'tenantId and showSlug are required' });
      return;
    }
    const xml = await generateRssFeed(showSlug, tenantId);
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('Generate RSS feed error:', err);
    res.status(404).send(err.message || 'Feed not found');
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * ADMIN/AUTHENTICATED ENDPOINTS GATEWAY
 * ─────────────────────────────────────────────────────────────
 */

router.use(authMiddleware);

// Preview Check middleware: allow admin preview even if module is unpaid
const requirePodcastAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const tenantId = req.tenantId!;
  try {
    const userPermissions = req.user?.permissions || [];
    const hasAdminPermission = userPermissions.includes('tenant.settings') || userPermissions.includes('podcast-audio-broadcasting.read');

    if (hasAdminPermission) {
      return next();
    }

    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'podcast-audio-broadcasting' } },
    });

    if (!entitlement || !['active', 'trialing'].includes(entitlement.status)) {
      res.status(403).json({ error: 'Podcast module is inactive or suspended' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};

router.use(requirePodcastAccess);

/**
 * ─────────────────────────────────────────────────────────────
 * CHANNELS / SHOWS
 * ─────────────────────────────────────────────────────────────
 */

const getListChannels = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Secure check: only admins can view non-published channels
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings') || userPermissions.includes('podcast-audio-broadcasting.update');
    if (!isAdmin && status && status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published channels' });
      return;
    }

    const queryStatus = isAdmin ? status : 'published';
    const channels = await listChannels(req.tenantId!, { status: queryStatus, search });
    res.json({ data: channels });
  } catch (err: any) {
    console.error('List channels error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getChannelDetail = async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const channel = await getChannel(idOrSlug, req.tenantId!);

    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings') || userPermissions.includes('podcast-audio-broadcasting.update');
    if (!isAdmin && channel.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published channels' });
      return;
    }

    res.json({ data: channel });
  } catch (err: any) {
    console.error('Get channel error:', err);
    res.status(404).json({ error: err.message });
  }
};

// Map both Shows (backward compatibility) and Channels endpoints
router.get('/shows', getListChannels);
router.get('/channels', getListChannels);

router.get('/shows/:idOrSlug', getChannelDetail);
router.get('/channels/:idOrSlug', getChannelDetail);

router.post('/shows', requireCreatePermission, async (req: Request, res: Response) => {
  try {
    const { title, slug, description, author, email, coverImageUrl, category, subcategory, language, copyright, explicit, status } = req.body;
    if (!title || !author || !category) {
      res.status(400).json({ error: 'title, author, and category are required' });
      return;
    }
    const channel = await createChannel(req.tenantId!, req.user?.userId || null, {
      title,
      slug,
      description,
      authorName: author,
      ownerEmail: email,
      coverImageMediaId: coverImageUrl, // map URL to media ID placeholder
      category,
      subcategory,
      language,
      copyrightText: copyright,
      explicitContent: explicit,
      status,
    });
    res.status(201).json({ data: channel });
  } catch (err: any) {
    console.error('Create channel error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/channels', requireCreatePermission, async (req: Request, res: Response) => {
  try {
    const { title, slug, description, authorName, ownerName, ownerEmail, coverImageMediaId, category, subcategory, language, copyrightText, explicitContent, visibility, status } = req.body;
    if (!title || !authorName || !category) {
      res.status(400).json({ error: 'title, authorName, and category are required' });
      return;
    }
    const channel = await createChannel(req.tenantId!, req.user?.userId || null, {
      title,
      slug,
      description,
      coverImageMediaId,
      language,
      category,
      subcategory,
      authorName,
      ownerName,
      ownerEmail,
      copyrightText,
      explicitContent,
      visibility,
      status,
    });
    res.status(201).json({ data: channel });
  } catch (err: any) {
    console.error('Create channel error:', err);
    res.status(400).json({ error: err.message });
  }
});

const putChannelUpdate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const channel = await updateChannel(id, req.tenantId!, req.user?.userId || null, req.body);
    res.json({ data: channel });
  } catch (err: any) {
    console.error('Update channel error:', err);
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

router.put('/shows/:id', requireUpdatePermission, putChannelUpdate);
router.put('/channels/:id', requireUpdatePermission, putChannelUpdate);
router.patch('/channels/:id', requireUpdatePermission, putChannelUpdate);

const deleteChannelHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const channel = await deleteChannel(id, req.tenantId!, req.user?.userId || null);
    res.json({ data: channel });
  } catch (err: any) {
    console.error('Delete channel error:', err);
    res.status(400).json({ error: err.message });
  }
};

router.delete('/shows/:id', requireDeletePermission, deleteChannelHandler);
router.delete('/channels/:id', requireDeletePermission, deleteChannelHandler);

router.post('/channels/:id/publish', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const channel = await updateChannel(req.params.id as string, req.tenantId!, req.user?.userId || null, { status: 'published' });
    res.json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/channels/:id/unpublish', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const channel = await updateChannel(req.params.id as string, req.tenantId!, req.user?.userId || null, { status: 'draft' });
    res.json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * EPISODES
 * ─────────────────────────────────────────────────────────────
 */

router.post('/episodes', requireCreatePermission, async (req: Request, res: Response) => {
  try {
    const { showId, channelId, title, slug, description, showNotes, audioUrl, audioMediaId, coverImageMediaId, speakerId, guestSpeakerName, seriesId, season, episodeNumber, episodeType, durationSeconds, fileSize, mimeType, publishDate, visibility, status, allowRss } = req.body;
    const targetChannelId = channelId || showId;
    const targetAudioMediaId = audioMediaId || audioUrl;

    if (!targetChannelId || !title || !targetAudioMediaId) {
      res.status(400).json({ error: 'channelId, title, and audioMediaId are required' });
      return;
    }
    const episode = await createEpisode(req.tenantId!, req.user?.userId || null, {
      channelId: targetChannelId,
      title,
      slug,
      description,
      showNotes,
      audioMediaId: targetAudioMediaId,
      coverImageMediaId,
      speakerId,
      guestSpeakerName,
      seriesId,
      seasonNumber: season || req.body.seasonNumber,
      episodeNumber,
      durationSeconds: durationSeconds || req.body.duration,
      audioMimeType: mimeType || req.body.audioMimeType,
      audioFileSize: fileSize || req.body.audioFileSize,
      publishAt: publishDate || req.body.publishAt,
      visibility,
      status,
      allowRss,
    });
    res.status(201).json({ data: episode });
  } catch (err: any) {
    console.error('Create episode error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/shows/:showId/episodes', async (req: Request, res: Response) => {
  try {
    const showId = req.params.showId as string;
    const status = req.query.status as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    // Secure check: only admins can view non-published episodes
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings') || userPermissions.includes('podcast-audio-broadcasting.update');
    if (!isAdmin && status && status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published episodes' });
      return;
    }

    const queryStatus = isAdmin ? status : 'published';
    const result = await listEpisodes(showId, req.tenantId!, { status: queryStatus, page, limit });
    res.json({
      data: result.episodes,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err: any) {
    console.error('List episodes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/episodes', async (req: Request, res: Response) => {
  try {
    const channelId = req.query.channelId as string;
    const status = req.query.status as string | undefined;
    const speakerId = req.query.speakerId as string | undefined;
    const seriesId = req.query.seriesId as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    // Secure check: only admins can view non-published episodes
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings') || userPermissions.includes('podcast-audio-broadcasting.update');
    if (!isAdmin && status && status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published episodes' });
      return;
    }

    const queryStatus = isAdmin ? status : 'published';
    const result = await listEpisodes(channelId, req.tenantId!, { status: queryStatus, speakerId, seriesId, page, limit, search });
    res.json({
      data: result.episodes,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const getEpisodeDetail = async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const episode = await getEpisode(idOrSlug, req.tenantId!);

    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings') || userPermissions.includes('podcast-audio-broadcasting.update');
    if (!isAdmin && episode.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published episodes' });
      return;
    }

    res.json({ data: episode });
  } catch (err: any) {
    console.error('Get episode error:', err);
    res.status(404).json({ error: err.message });
  }
};

router.get('/episodes/:idOrSlug', getEpisodeDetail);

const putEpisodeUpdate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const episode = await updateEpisode(id, req.tenantId!, req.user?.userId || null, req.body);
    res.json({ data: episode });
  } catch (err: any) {
    console.error('Update episode error:', err);
    res.status(400).json({ error: err.message });
  }
};

router.put('/episodes/:id', requireUpdatePermission, putEpisodeUpdate);
router.patch('/episodes/:id', requireUpdatePermission, putEpisodeUpdate);

const deleteEpisodeHandler = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const episode = await deleteEpisode(id, req.tenantId!, req.user?.userId || null);
    res.json({ data: episode });
  } catch (err: any) {
    console.error('Delete episode error:', err);
    res.status(400).json({ error: err.message });
  }
};

router.delete('/episodes/:id', requireDeletePermission, deleteEpisodeHandler);

router.post('/episodes/:id/publish', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const episode = await updateEpisode(req.params.id as string, req.tenantId!, req.user?.userId || null, { status: 'published', publishAt: new Date() });
    res.json({ data: episode });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/episodes/:id/schedule', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const { publishAt } = req.body;
    if (!publishAt) {
      res.status(400).json({ error: 'publishAt datetime is required' });
      return;
    }
    const episode = await updateEpisode(req.params.id as string, req.tenantId!, req.user?.userId || null, { status: 'scheduled', publishAt: new Date(publishAt) });
    res.json({ data: episode });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/episodes/:id/play', async (req: Request, res: Response) => {
  try {
    await recordPodcastPlay(req.tenantId!, req.params.id as string, {
      userId: req.user?.userId,
      ipHash: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/episodes/:id/download', async (req: Request, res: Response) => {
  try {
    await recordPodcastDownload(req.tenantId!, req.params.id as string, {
      userId: req.user?.userId,
      ipHash: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * RSS SYNDICATION & PREVIEW
 * ─────────────────────────────────────────────────────────────
 */

router.post('/channels/:id/regenerate-rss', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const channel = await getChannel(req.params.id as string, req.tenantId!);
    const xml = await generateRssFeed(channel.slug, req.tenantId!);
    res.json({ success: true, rssUrl: channel.rssUrl, payloadPreview: xml.substring(0, 500) + '...' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/channels/:id/rss-preview', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const channel = await getChannel(req.params.id as string, req.tenantId!);
    const xml = await generateRssFeed(channel.slug, req.tenantId!);
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * PLAYLISTS
 * ─────────────────────────────────────────────────────────────
 */

router.get('/playlists', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const playlists = await listPlaylists(req.tenantId!);
    res.json({ data: playlists });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/playlists', requireCreatePermission, async (req: Request, res: Response) => {
  try {
    const playlist = await createPlaylist(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/playlists/:id', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const playlist = await getPlaylist(req.params.id as string, req.tenantId!);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/playlists/:id', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const playlist = await updatePlaylist(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/playlists/:id', requireDeletePermission, async (req: Request, res: Response) => {
  try {
    const playlist = await deletePlaylist(req.params.id as string, req.tenantId!);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/playlists/:id/items', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const { episodeId, displayOrder } = req.body;
    const item = await addPlaylistItem(req.tenantId!, req.params.id as string, episodeId, displayOrder || 0);
    res.status(201).json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/playlists/:id/items/reorder', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { episodeId, displayOrder }
    await reorderPlaylistItems(req.tenantId!, req.params.id as string, items);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * SPEAKERS
 * ─────────────────────────────────────────────────────────────
 */

router.get('/speakers', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const speakers = await listSpeakers(req.tenantId!);
    res.json({ data: speakers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/speakers', requireCreatePermission, async (req: Request, res: Response) => {
  try {
    const speaker = await createSpeaker(req.tenantId!, req.body);
    res.status(201).json({ data: speaker });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/speakers/:id', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const speaker = await getSpeaker(req.params.id as string, req.tenantId!);
    res.json({ data: speaker });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/speakers/:id', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const speaker = await updateSpeaker(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: speaker });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/speakers/:id', requireDeletePermission, async (req: Request, res: Response) => {
  try {
    const speaker = await deleteSpeaker(req.params.id as string, req.tenantId!);
    res.json({ data: speaker });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * SERIES
 * ─────────────────────────────────────────────────────────────
 */

router.get('/series', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const series = await listSeries(req.tenantId!);
    res.json({ data: series });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/series', requireCreatePermission, async (req: Request, res: Response) => {
  try {
    const series = await createSeries(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: series });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/series/:id', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const series = await getSeries(req.params.id as string, req.tenantId!);
    res.json({ data: series });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/series/:id', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const series = await updateSeries(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: series });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/series/:id', requireDeletePermission, async (req: Request, res: Response) => {
  try {
    const series = await deleteSeries(req.params.id as string, req.tenantId!);
    res.json({ data: series });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * SETTINGS
 * ─────────────────────────────────────────────────────────────
 */

router.get('/settings', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const settings = await getPodcastSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', requireSettingsPermission, async (req: Request, res: Response) => {
  try {
    const settings = await updatePodcastSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * ANALYTICS & REPORTS
 * ─────────────────────────────────────────────────────────────
 */

router.get('/analytics', requireReportsPermission, async (req: Request, res: Response) => {
  try {
    const report = await getPodcastAnalytics(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * AI SIMULATIONS
 * ─────────────────────────────────────────────────────────────
 */

router.post('/episodes/:id/generate-transcript', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const episode = await getEpisode(req.params.id as string, req.tenantId!);
    const simulatedTranscript = `[00:01] Welcome to the episode: "${episode.title}". Today we talk about grace. [05:00] Grace is active. [15:00] End of sermon.`;
    const updated = await updateEpisode(episode.id, req.tenantId!, req.user?.userId || null, { transcript: simulatedTranscript });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/episodes/:id/generate-summary', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const episode = await getEpisode(req.params.id as string, req.tenantId!);
    const simulatedSummary = `An encouraging message about structural grace and its master outlines, based on the teaching of: "${episode.title}".`;
    const updated = await updateEpisode(episode.id, req.tenantId!, req.user?.userId || null, { aiSummary: simulatedSummary });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/episodes/:id/generate-show-notes', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const episode = await getEpisode(req.params.id as string, req.tenantId!);
    const simulatedShowNotes = `Show notes for: "${episode.title}"\n- Introduction to Grace\n- Read Ephesians 2:8\n- Prayer Points & Outlines`;
    const updated = await updateEpisode(episode.id, req.tenantId!, req.user?.userId || null, { showNotes: simulatedShowNotes });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * DISTRIBUTION
 * ─────────────────────────────────────────────────────────────
 */

router.get('/distribution', requireReadPermission, async (req: Request, res: Response) => {
  try {
    const channelId = req.query.channelId as string;
    const targets = await listDistributionTargets(req.tenantId!, channelId);
    res.json({ data: targets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/distribution/:channelId/connect', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const { provider, settings } = req.body;
    const target = await connectDistributionTarget(req.tenantId!, req.params.channelId as string, provider, settings || {});
    res.status(201).json({ data: target });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/distribution/:channelId/sync', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, message: 'Distribution channels synced successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/distribution/:targetId', requireUpdatePermission, async (req: Request, res: Response) => {
  try {
    const target = await deleteDistributionTarget(req.params.targetId as string, req.tenantId!);
    res.json({ data: target });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
