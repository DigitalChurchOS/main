import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createSong,
  getSong,
  listSongs,
  updateSong,
  deleteSong,
  createWorshipPlaylist,
  getWorshipPlaylist,
  listWorshipPlaylists,
  updateWorshipPlaylist,
  deleteWorshipPlaylist,
  addWorshipPlaylistItem,
  removeWorshipPlaylistItem,
  createWorshipSession,
  getWorshipSession,
  updateWorshipSession,
  startWorshipSession,
  endWorshipSession,
  changeSessionActiveSong,
  navigateSessionLyrics,
} from '../services/worship';

const router = Router();

router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// SONGS ADMIN & VIEW
// ─────────────────────────────────────────────────────────────
router.post('/songs', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const song = await createSong(req.tenantId!, req.body);
    res.status(201).json({ data: song });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/songs', async (req: Request, res: Response) => {
  try {
    const songs = await listSongs(req.tenantId!);
    res.json({ data: songs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/songs/:id', async (req: Request, res: Response) => {
  try {
    const song = await getSong(req.params.id as string, req.tenantId!);
    res.json({ data: song });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/songs/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const song = await updateSong(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: song });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/songs/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await deleteSong(req.params.id as string, req.tenantId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PLAYLISTS ADMIN & VIEW
// ─────────────────────────────────────────────────────────────
router.post('/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await createWorshipPlaylist(req.tenantId!, req.body);
    res.status(201).json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/playlists', async (req: Request, res: Response) => {
  try {
    const playlists = await listWorshipPlaylists(req.tenantId!);
    res.json({ data: playlists });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/playlists/:id', async (req: Request, res: Response) => {
  try {
    const playlist = await getWorshipPlaylist(req.params.id as string, req.tenantId!);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await updateWorshipPlaylist(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await deleteWorshipPlaylist(req.params.id as string, req.tenantId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Playlist Items ---
router.post('/playlists/:id/items', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { songId, order } = req.body;
    const item = await addWorshipPlaylistItem(req.tenantId!, req.params.id as string, songId, order);
    res.status(201).json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/playlists/items/:itemId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await removeWorshipPlaylistItem(req.tenantId!, req.params.itemId as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// WORSHIP SESSIONS & REAL-TIME CONTROLS
// ─────────────────────────────────────────────────────────────
router.post('/sessions', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const session = await createWorshipSession(req.tenantId!, req.body);
    res.status(201).json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const session = await getWorshipSession(req.params.id as string, req.tenantId!);
    res.json({ data: session });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/sessions/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const session = await updateWorshipSession(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/start', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const session = await startWorshipSession(req.tenantId!, req.params.id as string);
    res.json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/end', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const session = await endWorshipSession(req.tenantId!, req.params.id as string);
    res.json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/song', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { songId } = req.body;
    const session = await changeSessionActiveSong(req.tenantId!, req.params.id as string, songId || null);
    res.json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sessions/:id/navigate', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { direction } = req.body; // 'next' | 'prev' | number
    const session = await navigateSessionLyrics(req.tenantId!, req.params.id as string, direction);
    res.json({ data: session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
