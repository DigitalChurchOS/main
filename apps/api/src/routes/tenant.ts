import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { DomainTenantManagementService } from '../services/domainTenantManagement';

const router = Router();

// Secure all endpoints: requires authenticated tenant administrator
router.use(authMiddleware);
router.use(requirePermission('tenant.settings'));

/**
 * GET /api/tenant/branding
 * Retrieves church branding settings and tenant general info.
 */
router.get('/branding', async (req: Request, res: Response) => {
  try {
    const data = await DomainTenantManagementService.getBranding(req.tenantId!);
    res.json({ data });
  } catch (err: any) {
    console.error('Fetch branding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tenant/branding
 * Updates church tenant name and customized branding presets.
 */
router.patch('/branding', async (req: Request, res: Response) => {
  try {
    const data = await DomainTenantManagementService.updateBranding(
      req.tenantId!,
      req.user?.userId,
      req.body
    );
    res.json({ data });
  } catch (err: any) {
    console.error('Update branding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tenant/domain
 * Retrieves subdomain, customDomain, instructions, and SSL status mappings.
 */
router.get('/domain', async (req: Request, res: Response) => {
  try {
    const data = await DomainTenantManagementService.getDomain(req.tenantId!);
    res.json({ data });
  } catch (err: any) {
    console.error('Fetch domain status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tenant/domain
 * Updates custom domain on both Tenant and Website records.
 */
router.patch('/domain', async (req: Request, res: Response) => {
  try {
    const { customDomain } = req.body;
    const data = await DomainTenantManagementService.updateDomain(
      req.tenantId!,
      req.user?.userId,
      customDomain
    );
    res.json({ data });
  } catch (err: any) {
    console.error('Update custom domain error:', err);
    if (err.message.includes('already registered')) {
      res.status(409).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/tenant/domain/verify
 * Simulated DNS and SSL verification endpoint.
 */
router.post('/domain/verify', async (req: Request, res: Response) => {
  try {
    const data = await DomainTenantManagementService.verifyDomain(
      req.tenantId!,
      req.user?.userId
    );
    res.json({ data });
  } catch (err: any) {
    console.error('Verify domain DNS error:', err);
    if (err.message.includes('Configure a custom domain first')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/tenant/modules
 * Lists all module definitions along with their subscription/activation status.
 */
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const data = await DomainTenantManagementService.getModules(req.tenantId!);
    res.json({ data });
  } catch (err: any) {
    console.error('Fetch tenant modules registry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tenant/modules/:moduleKey
 * Toggles status between active and suspended / inactive.
 */
router.patch('/modules/:moduleKey', async (req: Request, res: Response) => {
  try {
    const moduleKey = req.params.moduleKey as string;
    const { status } = req.body;

    const data = await DomainTenantManagementService.updateModuleStatus(
      req.tenantId!,
      req.user?.userId,
      moduleKey,
      status
    );
    res.json({ data });
  } catch (err: any) {
    console.error('Update tenant module status error:', err);
    if (err.message.includes('Invalid target module status')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/tenant/checklist
 * Calculates the onboarding launch progress checklist.
 */
router.get('/checklist', async (req: Request, res: Response) => {
  try {
    const data = await DomainTenantManagementService.getChecklist(req.tenantId!);
    res.json({ data });
  } catch (err: any) {
    console.error('Calculate tenant checklist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
