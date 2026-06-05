import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { BillingService } from '../services/billing';

const router = Router();

router.use(authMiddleware);

function sendRouteError(res: Response, err: any) {
  const message = err?.message || 'Internal server error';
  const status = message.toLowerCase().includes('not found') ? 404 : 400;
  res.status(status).json({ error: message });
}

const readBilling = requirePermission('billing-subscription-management.read');
const createBilling = requirePermission('billing-subscription-management.create');
const updateBilling = requirePermission('billing-subscription-management.update');
const deleteBilling = requirePermission('billing-subscription-management.delete');
const manageBillingSettings = requirePermission('billing-subscription-management.manage_settings');
const viewBillingReports = requirePermission('billing-subscription-management.view_reports');

router.get('/overview', readBilling, async (req: Request, res: Response) => {
  try {
    const overview = await BillingService.getOverview(req.tenantId!);
    res.json({ data: overview });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/plans', readBilling, async (_req: Request, res: Response) => {
  try {
    const plans = await BillingService.listPlans();
    res.json({ data: plans });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/plans', manageBillingSettings, async (req: Request, res: Response) => {
  try {
    const plan = await BillingService.createPlan(req.user?.userId || null, req.tenantId!, req.body);
    res.status(201).json({ data: plan });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/plans/:id', manageBillingSettings, async (req: Request, res: Response) => {
  try {
    const plan = await BillingService.updatePlan(req.user?.userId || null, req.tenantId!, req.params.id as string, req.body);
    res.json({ data: plan });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/subscribe', updateBilling, async (req: Request, res: Response) => {
  try {
    const subscription = await BillingService.subscribeTenant(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: subscription });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/usage', readBilling, async (req: Request, res: Response) => {
  try {
    const current = await BillingService.getCurrentUsage(req.tenantId!);
    if (!current) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }
    res.json({ data: current });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/usage', createBilling, async (req: Request, res: Response) => {
  try {
    const { metricKey, quantity } = req.body;
    if (!metricKey || quantity === undefined) {
      res.status(400).json({ error: 'metricKey and quantity are required' });
      return;
    }
    await BillingService.recordUsage(req.tenantId!, metricKey, Number(quantity), req.user?.userId || null);
    const current = await BillingService.getCurrentUsage(req.tenantId!);
    res.status(201).json({ data: current?.usage || null });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/invoices', readBilling, async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: invoices });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/invoice/trigger', createBilling, async (req: Request, res: Response) => {
  try {
    const invoice = await BillingService.generateInvoice(req.tenantId!, req.user?.userId || null);
    res.status(201).json({ data: invoice });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/webhook', updateBilling, async (req: Request, res: Response) => {
  try {
    const { invoiceId, event } = req.body;
    if (!invoiceId || !event) {
      res.status(400).json({ error: 'invoiceId and event are required' });
      return;
    }

    if (event !== 'payment_intent.succeeded' && event !== 'payment_intent.payment_failed') {
      res.status(400).json({ error: 'Invalid event type' });
      return;
    }

    await BillingService.handlePaymentWebhook(req.tenantId!, invoiceId, event, req.user?.userId || null);
    res.json({ success: true, message: 'Webhook handled successfully' });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/add-ons', readBilling, async (req: Request, res: Response) => {
  try {
    const addOns = await BillingService.listAddOns(req.tenantId!);
    res.json({ data: addOns });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/add-ons', manageBillingSettings, async (req: Request, res: Response) => {
  try {
    const addOn = await BillingService.createAddOn(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: addOn });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/add-ons/:id', manageBillingSettings, async (req: Request, res: Response) => {
  try {
    const addOn = await BillingService.updateAddOn(req.tenantId!, req.user?.userId || null, req.params.id as string, req.body);
    res.json({ data: addOn });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/add-ons/:id/activate', updateBilling, async (req: Request, res: Response) => {
  try {
    const active = await BillingService.activateAddOn(
      req.tenantId!,
      req.user?.userId || null,
      req.params.id as string,
      req.body.quantity || 1
    );
    res.status(201).json({ data: active });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/subscription-add-ons/:id/deactivate', updateBilling, async (req: Request, res: Response) => {
  try {
    const active = await BillingService.deactivateAddOn(req.tenantId!, req.user?.userId || null, req.params.id as string);
    res.json({ data: active });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/coupons', readBilling, async (req: Request, res: Response) => {
  try {
    const coupons = await BillingService.listCoupons(req.tenantId!);
    res.json({ data: coupons });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/coupons', createBilling, async (req: Request, res: Response) => {
  try {
    const coupon = await BillingService.createCoupon(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: coupon });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/coupons/:id', updateBilling, async (req: Request, res: Response) => {
  try {
    const coupon = await BillingService.updateCoupon(req.tenantId!, req.user?.userId || null, req.params.id as string, req.body);
    res.json({ data: coupon });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/coupons/apply', updateBilling, async (req: Request, res: Response) => {
  try {
    const subscription = await BillingService.applyCoupon(req.tenantId!, req.user?.userId || null, req.body.code);
    res.json({ data: subscription });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/settings', readBilling, async (req: Request, res: Response) => {
  try {
    const settings = await BillingService.getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/settings', manageBillingSettings, async (req: Request, res: Response) => {
  try {
    const settings = await BillingService.updateSettings(req.tenantId!, req.user?.userId || null, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/entitlements', readBilling, async (req: Request, res: Response) => {
  try {
    const entitlements = await BillingService.listEntitlements(req.tenantId!);
    res.json({ data: entitlements });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/entitlements/:moduleKey', manageBillingSettings, async (req: Request, res: Response) => {
  try {
    const entitlement = await BillingService.updateEntitlement(
      req.tenantId!,
      req.user?.userId || null,
      req.params.moduleKey as string,
      req.body
    );
    res.json({ data: entitlement });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/activity', viewBillingReports, async (req: Request, res: Response) => {
  try {
    const activities = await BillingService.listActivities(req.tenantId!);
    res.json({ data: activities });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/reports', viewBillingReports, async (req: Request, res: Response) => {
  try {
    const reports = await BillingService.getReports(req.tenantId!);
    res.json({ data: reports });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/records', readBilling, async (req: Request, res: Response) => {
  try {
    const records = await BillingService.listRecords(req.tenantId!);
    res.json({ data: records });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/records', createBilling, async (req: Request, res: Response) => {
  try {
    const record = await BillingService.createRecord(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/', readBilling, async (req: Request, res: Response) => {
  try {
    const records = await BillingService.listRecords(req.tenantId!);
    res.json({ data: records });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/', createBilling, async (req: Request, res: Response) => {
  try {
    const record = await BillingService.createRecord(req.tenantId!, req.user?.userId || null, req.body);
    res.status(201).json({ data: record });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/:id', readBilling, async (req: Request, res: Response) => {
  try {
    const record = await BillingService.getRecord(req.tenantId!, req.params.id as string);
    res.json({ data: record });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/:id', updateBilling, async (req: Request, res: Response) => {
  try {
    const record = await BillingService.updateRecord(req.tenantId!, req.user?.userId || null, req.params.id as string, req.body);
    res.json({ data: record });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.delete('/:id', deleteBilling, async (req: Request, res: Response) => {
  try {
    const record = await BillingService.deleteRecord(req.tenantId!, req.user?.userId || null, req.params.id as string);
    res.json({ data: record, message: 'Billing record deleted successfully' });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

export default router;
