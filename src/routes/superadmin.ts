import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { superAdminMiddleware } from '../middleware/superAdmin';

const router = Router();

// Enforce standard authentication and Super Admin checks on all routes
router.use(authMiddleware);
router.use(superAdminMiddleware);

// ── GET /api/super-admin/tenants ───────────────────────────────
// Returns a list of all tenants, including subscription and module status
// ─────────────────────────────────────────────────────────────
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        tenantModules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: tenants });
  } catch (err: any) {
    console.error('Super Admin get tenants error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/super-admin/tenants ──────────────────────────────
// Provisions a new tenant with a subdomain and default plan
// ─────────────────────────────────────────────────────────────
router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, subdomain, customDomain } = req.body;

    if (!name || !subdomain) {
      res.status(400).json({ error: 'name and subdomain are required' });
      return;
    }

    // Verify subdomain unique
    const existingSubdomain = await prisma.tenant.findUnique({
      where: { subdomain },
    });
    if (existingSubdomain) {
      res.status(409).json({ error: 'Subdomain already exists' });
      return;
    }

    // Verify custom domain unique if provided
    if (customDomain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { customDomain },
      });
      if (existingDomain) {
        res.status(409).json({ error: 'Custom domain already registered' });
        return;
      }
    }

    const tenant = await prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
          customDomain: customDomain || null,
          status: 'active',
        },
      });

      // Assign default demo plan if it exists
      const defaultPlan = await tx.subscriptionPlan.findFirst();
      if (defaultPlan) {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await tx.tenantSubscription.create({
          data: {
            tenantId: newTenant.id,
            planId: defaultPlan.id,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
          },
        });
      }

      // Seed default modules (website-cms and theme-engine)
      const defaultModules = ['website-cms', 'theme-engine', 'member-crm'];
      for (const modKey of defaultModules) {
        // Verify module key exists in definitions
        const def = await tx.moduleDefinition.findUnique({ where: { key: modKey } });
        if (def) {
          await tx.tenantModule.create({
            data: {
              tenantId: newTenant.id,
              moduleKey: modKey,
              status: 'active',
              billingRule: 'free',
              usageLimits: '{}',
            },
          });
        }
      }

      return newTenant;
    });

    res.status(201).json({ data: tenant });
  } catch (err: any) {
    console.error('Super Admin create tenant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/super-admin/tenants/:id ──────────────────────────
// Updates tenant details (name, domain, status suspension)
// ─────────────────────────────────────────────────────────────
router.patch('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, subdomain, customDomain, status } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Validate unique subdomain if changing
    if (subdomain && subdomain !== existing.subdomain) {
      const dupeSub = await prisma.tenant.findUnique({ where: { subdomain } });
      if (dupeSub) {
        res.status(409).json({ error: 'Subdomain already exists' });
        return;
      }
    }

    // Validate unique custom domain if changing
    if (customDomain && customDomain !== existing.customDomain) {
      const dupeDom = await prisma.tenant.findUnique({ where: { customDomain } });
      if (dupeDom) {
        res.status(409).json({ error: 'Custom domain already registered' });
        return;
      }
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subdomain !== undefined && { subdomain }),
        ...(customDomain !== undefined && { customDomain: customDomain || null }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({ data: updated });
  } catch (err: any) {
    console.error('Super Admin update tenant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/super-admin/modules ───────────────────────────────
// Returns list of all available global modules
// ─────────────────────────────────────────────────────────────
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const modules = await prisma.moduleDefinition.findMany({
      orderBy: { key: 'asc' },
    });
    res.json({ data: modules });
  } catch (err: any) {
    console.error('Super Admin get modules error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/super-admin/entitlements ─────────────────────────
// Enables, disables, or updates entitlements for a module on a tenant
// ─────────────────────────────────────────────────────────────
router.post('/entitlements', async (req: Request, res: Response) => {
  try {
    const { tenantId, moduleKey, status, billingRule, usageLimits } = req.body;

    if (!tenantId || !moduleKey) {
      res.status(400).json({ error: 'tenantId and moduleKey are required' });
      return;
    }

    // Verify tenant and module definition exist
    const [tenantExists, modDefExists] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.moduleDefinition.findUnique({ where: { key: moduleKey } }),
    ]);

    if (!tenantExists) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    if (!modDefExists) {
      res.status(404).json({ error: 'Module definition not found' });
      return;
    }

    const entitlement = await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey },
      },
      update: {
        ...(status !== undefined && { status }),
        ...(billingRule !== undefined && { billingRule }),
        ...(usageLimits !== undefined && { usageLimits: JSON.stringify(usageLimits) }),
      },
      create: {
        tenantId,
        moduleKey,
        status: status || 'active',
        billingRule: billingRule || 'free',
        usageLimits: usageLimits ? JSON.stringify(usageLimits) : '{}',
      },
    });

    res.json({ data: entitlement });
  } catch (err: any) {
    console.error('Super Admin entitlement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/super-admin/logs ──────────────────────────────────
// Returns log entries for platform auditing
// ─────────────────────────────────────────────────────────────
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined;
    const scope = req.query.scope as string | undefined;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const logs = await prisma.observabilityLog.findMany({
      where: {
        ...(level && { logLevel: level }),
        ...(scope && { scope: { contains: scope } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.observabilityLog.count({
      where: {
        ...(level && { logLevel: level }),
        ...(scope && { scope: { contains: scope } }),
      },
    });

    res.json({
      data: logs,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (err: any) {
    console.error('Super Admin get logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
