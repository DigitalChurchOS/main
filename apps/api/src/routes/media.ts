import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { generateEmbed, MEDIA_MODULE_KEY, MediaService } from '../services/media';

const router = Router();

router.use(authMiddleware);
router.use(requireModule(MEDIA_MODULE_KEY));

const requireMediaPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

function statusFor(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes('not found')) return 404;
  if (message.includes('disabled')) return 403;
  return 400;
}

function filters(req: Request) {
  return {
    categoryId: req.query.categoryId as string | undefined,
    seriesId: req.query.seriesId as string | undefined,
    speakerId: req.query.speakerId as string | undefined,
    type: req.query.type as string | undefined,
    status: req.query.status as string | undefined,
    visibility: req.query.visibility as string | undefined,
    providerKey: req.query.providerKey as string | undefined,
    search: req.query.search as string | undefined,
    tagIds: req.query.tagIds ? String(req.query.tagIds).split(',').map((id) => id.trim()).filter(Boolean) : undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };
}

router.get('/overview', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.getOverview(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/settings', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.getSettings(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/settings', requireMediaPermission('media.manage_settings'), async (req, res) => {
  try { res.json({ data: await MediaService.updateSettings(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/reports', requireMediaPermission('media.view_reports'), async (req, res) => {
  try { res.json({ data: await MediaService.getReports(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/activity', requireMediaPermission('media.view_reports'), async (req, res) => {
  try { res.json({ data: await MediaService.listActivities(req.tenantId!, { actionType: req.query.actionType as string | undefined, limit: req.query.limit ? Number(req.query.limit) : undefined }) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/templates', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.getTemplates(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/uploads/intent', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createUploadIntent(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/categories', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.listCategories(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/categories', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createCategory(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/tags', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.listTags(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/tags', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createTag(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/speakers', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.listSpeakers(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/speakers', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createSpeaker(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.put('/speakers/:id', requireMediaPermission('media.update'), async (req, res) => {
  try { res.json({ data: await MediaService.updateSpeaker(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.patch('/speakers/:id', requireMediaPermission('media.update'), async (req, res) => {
  try { res.json({ data: await MediaService.updateSpeaker(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/series', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.listSeries(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/series', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createSeries(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/assets', requireMediaPermission('media.read'), async (req, res) => {
  try {
    const result = await MediaService.listAssets(req.tenantId!, filters(req));
    res.json({ data: result.assets, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/assets', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createAsset(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/assets/:id', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.getAsset(req.params.id as string, req.tenantId!) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.put('/assets/:id', requireMediaPermission('media.update'), async (req, res) => {
  try { res.json({ data: await MediaService.updateAsset(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.patch('/assets/:id', requireMediaPermission('media.update'), async (req, res) => {
  try { res.json({ data: await MediaService.updateAsset(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.delete('/assets/:id', requireMediaPermission('media.delete'), async (req, res) => {
  try { res.json({ data: await MediaService.deleteAsset(req.params.id as string, req.tenantId!, req.user?.userId), message: 'Asset archived successfully' }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/assets/:id/tags', requireMediaPermission('media.update'), async (req, res) => {
  try {
    if (!Array.isArray(req.body.tagIds)) { res.status(400).json({ error: 'tagIds array is required' }); return; }
    res.json({ data: await MediaService.tagAsset(req.params.id as string, req.tenantId!, req.body.tagIds, req.user?.userId) });
  } catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.delete('/assets/:id/tags', requireMediaPermission('media.update'), async (req, res) => {
  try {
    if (!Array.isArray(req.body.tagIds)) { res.status(400).json({ error: 'tagIds array is required' }); return; }
    res.json({ data: await MediaService.untagAsset(req.params.id as string, req.tenantId!, req.body.tagIds, req.user?.userId) });
  } catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/assets/:id/embed', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: { embedHtml: generateEmbed(await MediaService.getAsset(req.params.id as string, req.tenantId!)) } }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/assets/:id/playback', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.recordPlayback(req.tenantId!, req.params.id as string, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/playlists', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.listPlaylists(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/playlists', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createPlaylist(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/playlists/:id/items', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.getPlaylistItems(req.params.id as string, req.tenantId!) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/playlists/:id/items', requireMediaPermission('media.update'), async (req, res) => {
  try {
    if (!req.body.assetId) { res.status(400).json({ error: 'assetId is required' }); return; }
    res.status(201).json({ data: await MediaService.addToPlaylist(req.params.id as string, req.tenantId!, req.body.assetId, Number(req.body.order || 0), req.user?.userId) });
  } catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.delete('/playlists/:id/items/:assetId', requireMediaPermission('media.update'), async (req, res) => {
  try { res.json({ data: await MediaService.removeFromPlaylist(req.params.id as string, req.tenantId!, req.params.assetId as string, req.user?.userId), message: 'Item removed from playlist' }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.listModuleRecords(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireMediaPermission('media.create'), async (req, res) => {
  try { res.status(201).json({ data: await MediaService.createModuleRecord(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/:id', requireMediaPermission('media.read'), async (req, res) => {
  try { res.json({ data: await MediaService.getModuleRecord(req.params.id as string, req.tenantId!) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.patch('/:id', requireMediaPermission('media.update'), async (req, res) => {
  try { res.json({ data: await MediaService.updateModuleRecord(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.delete('/:id', requireMediaPermission('media.delete'), async (req, res) => {
  try { res.json({ data: await MediaService.deleteModuleRecord(req.params.id as string, req.tenantId!, req.user?.userId), success: true }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

export default router;
