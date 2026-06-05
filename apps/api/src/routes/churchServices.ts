import { Router, Request } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { CHURCH_SERVICES_MODULE_KEY, ChurchServicesService } from '../services/churchServices';

const router = Router();

router.use(authMiddleware);
router.use(requireModule(CHURCH_SERVICES_MODULE_KEY));

const requireServicesPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

function statusFor(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes('not found')) return 404;
  if (message.includes('disabled') || message.includes('required before publishing')) return 403;
  return 400;
}

function filters(req: Request) {
  return {
    serviceType: req.query.serviceType as string | undefined,
    speakerId: req.query.speakerId as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    status: req.query.status as string | undefined,
    visibility: req.query.visibility as string | undefined,
    search: req.query.search as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };
}

router.get('/overview', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getOverview(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/settings', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getSettings(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/settings', requireServicesPermission('church-services.manage_settings'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.updateSettings(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/reports', requireServicesPermission('church-services.view_reports'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getReports(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/activity', requireServicesPermission('church-services.view_reports'), async (req, res) => {
  try {
    res.json({
      data: await ChurchServicesService.listActivities(req.tenantId!, {
        actionType: req.query.actionType as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/templates', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getTemplates(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/profiles', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.listProfiles(req.tenantId!) }); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/profiles', requireServicesPermission('church-services.create'), async (req, res) => {
  try { res.status(201).json({ data: await ChurchServicesService.createProfile(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/profiles/:id', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getProfile(req.params.id as string, req.tenantId!) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.patch('/profiles/:id', requireServicesPermission('church-services.update'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.updateProfile(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.delete('/profiles/:id', requireServicesPermission('church-services.delete'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.deleteProfile(req.params.id as string, req.tenantId!, req.user?.userId), success: true }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/recurring', requireServicesPermission('church-services.create'), async (req, res) => {
  try { res.status(201).json({ data: await ChurchServicesService.generateRecurringServices(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/', requireServicesPermission('church-services.read'), async (req, res) => {
  try {
    const result = await ChurchServicesService.listServices(req.tenantId!, filters(req));
    res.json({ data: result.services, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
  } catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/', requireServicesPermission('church-services.create'), async (req, res) => {
  try { res.status(201).json({ data: await ChurchServicesService.createService(req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/:id', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getService(req.params.id as string, req.tenantId!) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.put('/:id', requireServicesPermission('church-services.update'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.updateService(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.patch('/:id', requireServicesPermission('church-services.update'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.updateService(req.params.id as string, req.tenantId!, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.delete('/:id', requireServicesPermission('church-services.delete'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.deleteService(req.params.id as string, req.tenantId!, req.user?.userId), message: 'Service archived successfully' }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/:id/publish', requireServicesPermission('church-services.update'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.publishService(req.params.id as string, req.tenantId!, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/:id/replay', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.recordReplay(req.tenantId!, req.params.id as string, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/:id/scriptures', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getScriptures(req.tenantId!, req.params.id as string) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/:id/scriptures', requireServicesPermission('church-services.update'), async (req, res) => {
  try { res.status(201).json({ data: await ChurchServicesService.addScriptures(req.tenantId!, req.params.id as string, req.body.references, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.get('/:id/attachments', requireServicesPermission('church-services.read'), async (req, res) => {
  try { res.json({ data: await ChurchServicesService.getAttachments(req.tenantId!, req.params.id as string) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

router.post('/:id/attachments', requireServicesPermission('church-services.update'), async (req, res) => {
  try { res.status(201).json({ data: await ChurchServicesService.addAttachment(req.tenantId!, req.params.id as string, req.body, req.user?.userId) }); }
  catch (err: any) { res.status(statusFor(err)).json({ error: err.message }); }
});

export default router;
