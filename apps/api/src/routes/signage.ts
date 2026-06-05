import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createScreen,
  getScreen,
  listScreens,
  updateScreen,
  deleteScreen,
  pingScreen,
  triggerEmergencyOverride,
  createPlaylist,
  getPlaylist,
  listPlaylists,
  updatePlaylist,
  deletePlaylist,
  addPlaylistItem,
  removePlaylistItem,
  reorderPlaylist,
  createSlide,
  getSlide,
  listSlides,
  updateSlide,
  deleteSlide,
  renderScreen,
} from '../services/signage';

const router = Router();

// ==========================================
// PUBLIC ENDPOINTS (No auth required)
// ==========================================

// GET /api/signage/screens/:id/render - Render display screen (unauthenticated)
router.get('/screens/:id/render', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await renderScreen(id as string);
    res.json({ data: result });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/signage/screens/:id/ping - Health check ping (unauthenticated)
router.post('/screens/:id/ping', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pingScreen(id as string);
    res.json({ success: true, status: result.status, lastPingAt: result.lastPingAt });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// ==========================================
// AUTHENTICATED ENDPOINTS
// ==========================================
router.use(authMiddleware);

// --- Screens Admin ---
router.post('/screens', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const screen = await createScreen(req.tenantId!, req.body);
    res.status(201).json({ data: screen });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/screens', async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const screens = await listScreens(req.tenantId!, branchId);
    res.json({ data: screens });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/screens/:id', async (req: Request, res: Response) => {
  try {
    const screen = await getScreen(req.params.id as string, req.tenantId!);
    res.json({ data: screen });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/screens/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const screen = await updateScreen(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: screen });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/screens/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await deleteScreen(req.params.id as string, req.tenantId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/screens/:id/override', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    await triggerEmergencyOverride(req.tenantId!, req.params.id as string, text);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Playlists Admin ---
router.post('/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await createPlaylist(req.tenantId!, req.body);
    res.status(201).json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/playlists', async (req: Request, res: Response) => {
  try {
    const playlists = await listPlaylists(req.tenantId!);
    res.json({ data: playlists });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/playlists/:id', async (req: Request, res: Response) => {
  try {
    const playlist = await getPlaylist(req.params.id as string, req.tenantId!);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await updatePlaylist(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await deletePlaylist(req.params.id as string, req.tenantId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Playlist Items Admin ---
router.post('/playlists/:id/items', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { slideId, order } = req.body;
    const item = await addPlaylistItem(req.tenantId!, req.params.id as string, slideId, order);
    res.status(201).json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/playlists/items/:itemId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await removePlaylistItem(req.tenantId!, req.params.itemId as string);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/playlists/:id/items/order', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { itemOrders } = req.body;
    await reorderPlaylist(req.tenantId!, req.params.id as string, itemOrders);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Slides Admin ---
router.post('/slides', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const slide = await createSlide(req.tenantId!, req.body);
    res.status(201).json({ data: slide });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/slides', async (req: Request, res: Response) => {
  try {
    const slides = await listSlides(req.tenantId!);
    res.json({ data: slides });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/slides/:id', async (req: Request, res: Response) => {
  try {
    const slide = await getSlide(req.params.id as string, req.tenantId!);
    res.json({ data: slide });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/slides/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const slide = await updateSlide(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: slide });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/slides/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await deleteSlide(req.params.id as string, req.tenantId!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
