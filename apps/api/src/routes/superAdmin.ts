import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { platformAuthMiddleware, requirePlatformPermission } from '../middleware/platformAuth';
import { suspendMarketplaceAsset, recordSecurityReview, reviewSubmission } from '../services/marketplace';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const router = Router();

// Helper to record platform audit logs
async function logPlatformAction(
  actorId: string,
  actorEmail: string,
  actorRole: string,
  action: string,
  targetType: string,
  targetId?: string,
  tenantId?: string,
  beforeData?: any,
  afterData?: any
) {
  try {
    await prisma.platformAuditLog.create({
      data: {
        actorId,
        actorEmail,
        actorRole,
        action,
        targetType,
        targetId,
        tenantId,
        beforeData: beforeData ? JSON.stringify(beforeData) : null,
        afterData: afterData ? JSON.stringify(afterData) : null,
      },
    });
  } catch (err) {
    console.error('Failed to write platform audit log:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const platformUser = await prisma.platformUser.findUnique({
      where: { email },
      include: { platformRole: true },
    });

    if (!platformUser) {
      res.status(401).json({ error: 'Invalid platform credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, platformUser.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid platform credentials' });
      return;
    }

    if (platformUser.status !== 'active') {
      res.status(403).json({ error: `Platform user account is ${platformUser.status}` });
      return;
    }

    const token = jwt.sign(
      { platformUserId: platformUser.id, email: platformUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: platformUser.id,
        email: platformUser.email,
        role: platformUser.platformRole?.name || 'User',
      },
    });
  } catch (err: any) {
    console.error('Platform login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All endpoints below require platform token authentication
router.use(platformAuthMiddleware);

// ─────────────────────────────────────────────────────────────
// 1. OVERVIEW SNAPSHOT
// ─────────────────────────────────────────────────────────────

router.get('/overview', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const totalChurches = await prisma.tenant.count();
    const trialChurches = await prisma.tenant.count({ where: { status: 'trialing' } });
    const activeChurches = await prisma.tenant.count({ where: { status: 'active' } });
    const suspendedChurches = await prisma.tenant.count({ where: { status: 'suspended' } });
    
    const activeSubscriptions = await prisma.tenantSubscription.count({ where: { status: 'active' } });
    const cancelledSubscriptions = await prisma.tenantSubscription.count({ where: { status: 'cancelled' } });
    const totalEnabledModules = await prisma.tenantModule.count({ where: { status: 'active' } });

    // Sum basePrice of active plans
    const subscriptionsList = await prisma.tenantSubscription.findMany({
      where: { status: 'active' },
      include: { plan: true },
    });
    const mrr = subscriptionsList.reduce((sum, sub) => sum + (sub.plan?.basePrice || 0), 0);

    const supportTicketsCount = await prisma.supportTicket.count({ where: { status: 'open' } });
    const recentAnnouncements = await prisma.announcement.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    const recentActivities = await prisma.platformAuditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } });

    // Mock/Dev-safe analytics metrics
    const stats = {
      totalChurches,
      trialChurches,
      activeChurches,
      suspendedChurches,
      mrr: mrr || 4590, // fallback for blank DB
      activeSubscriptions,
      cancelledSubscriptions,
      totalEnabledModules,
      supportTicketsCount,
      totalCustomDomains: await prisma.tenantDomain.count({ where: { status: 'active' } }),
      totalWebsites: await prisma.website.count({ where: { isActive: true } }),
      totalMediaStorageUsed: 432.5, // GB
      totalAiTokensUsed: 1250000,
      totalMessagesSent: 48900,
      recentAnnouncements,
      recentActivities,
    };

    res.json({ data: stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. TENANTS / CHURCHES MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List all tenants
router.get('/tenants', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, plan } = req.query;
    const where: any = {};

    if (status) {
      where.status = String(status);
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { subdomain: { contains: String(search) } },
        { customDomain: { contains: String(search) } },
      ];
    }
    if (plan) {
      where.subscription = {
        plan: {
          name: String(plan),
        },
      };
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        subscription: {
          include: { plan: true },
        },
        tenantDomains: true,
        tenantModules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: tenants });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Onboard / Create Tenant
router.post('/tenants', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subdomain, planId, trialDays, ownerName, ownerEmail, ownerPassword } = req.body;

    if (!name || !subdomain) {
      res.status(400).json({ error: 'name and subdomain are required' });
      return;
    }

    let normalizedSubdomain = subdomain.trim().toLowerCase();
    if (normalizedSubdomain.includes('.')) {
      normalizedSubdomain = normalizedSubdomain.split('.')[0];
    }
    normalizedSubdomain = normalizedSubdomain.replace(/[^a-z0-9-]/g, '');

    if (!normalizedSubdomain) {
      res.status(400).json({ error: 'Invalid subdomain format' });
      return;
    }

    // Check duplicate subdomain
    const duplicate = await prisma.tenant.findUnique({ where: { subdomain: normalizedSubdomain } });
    if (duplicate) {
      res.status(409).json({ error: `Subdomain '${normalizedSubdomain}' is already taken` });
      return;
    }

    const tenant = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const newTenant = await tx.tenant.create({
        data: {
          name,
          subdomain: normalizedSubdomain,
          status: 'active',
        },
      });

      // 2. Create Owner user if email/password provided
      if (ownerEmail && ownerPassword) {
        const passwordHash = await bcrypt.hash(ownerPassword, 12);
        const user = await tx.user.create({
          data: {
            tenantId: newTenant.id,
            email: ownerEmail,
            passwordHash,
            status: 'active',
          },
        });

        const names = (ownerName || ownerEmail.split('@')[0]).split(' ');
        await tx.member.create({
          data: {
            tenantId: newTenant.id,
            userId: user.id,
            firstName: names[0] || 'Admin',
            lastName: names[1] || 'User',
            email: ownerEmail,
            membershipStatus: 'leader',
          },
        });
      }

      // 3. Setup default subscription plan
      if (planId) {
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
        if (plan) {
          const trialEnds = trialDays ? new Date(Date.now() + Number(trialDays) * 24 * 60 * 60 * 1000) : null;
          await tx.tenantSubscription.create({
            data: {
              tenantId: newTenant.id,
              planId: plan.id,
              status: trialEnds ? 'trialing' : 'active',
              trialEndsAt: trialEnds,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      // 4. Entitle default core modules
      await tx.tenantModule.createMany({
        data: [
          { tenantId: newTenant.id, moduleKey: 'website-cms', status: 'active', billingRule: 'free' },
          { tenantId: newTenant.id, moduleKey: 'theme-engine', status: 'active', billingRule: 'free' },
          { tenantId: newTenant.id, moduleKey: 'domain-tenant-management', status: 'active', billingRule: 'free' },
        ],
      });

      return newTenant;
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'tenant.onboard',
      'tenant',
      tenant.id,
      tenant.id,
      null,
      tenant
    );

    res.status(201).json({ data: tenant });
  } catch (err: any) {
    console.error('Tenant onboarding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get tenant detailed info
router.get('/tenants/:id', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id as string },
      include: {
        subscription: {
          include: { plan: true },
        },
        tenantDomains: true,
        tenantModules: {
          include: { module: true },
        },
        users: {
          include: { member: true },
        },
        supportTickets: true,
      },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    res.json({ data: tenant });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update tenant profile / status
router.patch('/tenants/:id', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, status, customDomain } = req.body;
    const tenantId = req.params.id as string;

    const oldTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!oldTenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(customDomain !== undefined && { customDomain }),
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'tenant.update',
      'tenant',
      tenantId,
      tenantId,
      oldTenant,
      updated
    );

    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Tenant
router.delete('/tenants/:id', requirePlatformPermission('platform.admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id as string;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Soft delete or status toggle to archived
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'archived' },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'tenant.archive',
      'tenant',
      tenantId,
      tenantId,
      tenant,
      updated
    );

    res.json({ message: 'Tenant archived successfully', data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Extend tenant trial days
router.post('/tenants/:id/extend-trial', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id as string;
    const { days } = req.body;
    const daysToAdd = parseInt(days) || 7;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const currentTrialEnds = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : new Date();
    const baseDate = currentTrialEnds.getTime() > Date.now() ? currentTrialEnds : new Date();
    const newTrialEnds = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        trialEndsAt: newTrialEnds,
        status: 'trialing',
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'tenant.extend_trial',
      'tenant',
      tenantId,
      tenantId,
      { trialEndsAt: tenant.trialEndsAt, status: tenant.status },
      { trialEndsAt: updated.trialEndsAt, status: updated.status }
    );

    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update tenant plan / subscription override
router.patch('/tenants/:id/subscription', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id as string;
    const { planId } = req.body;

    if (!planId) {
      res.status(400).json({ error: 'planId is required' });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      res.status(404).json({ error: 'Subscription Plan not found' });
      return;
    }

    const existing = await prisma.tenantSubscription.findUnique({ where: { tenantId } });

    const subscription = await prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId,
      },
      create: {
        tenantId,
        planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'tenant.subscription.update',
      'tenant',
      tenantId,
      tenantId,
      existing,
      subscription
    );

    res.json({ data: subscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alias for plan update
router.patch('/tenants/:id/plan', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id as string;
    const { planId } = req.body;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      res.status(404).json({ error: 'Subscription Plan not found' });
      return;
    }

    const subscription = await prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: { planId },
      create: {
        tenantId,
        planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ data: subscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. MODULE ENTITLEMENTS OVERRIDES
// ─────────────────────────────────────────────────────────────

router.get('/tenants/:id/modules', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id as string;
    const entitlements = await prisma.tenantModule.findMany({
      where: { tenantId },
      include: { module: true },
    });
    res.json({ data: entitlements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert tenant module entitlement overrides
router.patch('/tenants/:id/modules', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id as string;
    const { moduleKey, status, billingRule, usageLimits } = req.body;

    if (!moduleKey || !status) {
      res.status(400).json({ error: 'moduleKey and status are required' });
      return;
    }

    const before = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
    });

    const updated = await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      create: {
        tenantId,
        moduleKey,
        status,
        billingRule: billingRule || 'free',
        usageLimits: usageLimits ? JSON.stringify(usageLimits) : '{}',
      },
      update: {
        status,
        ...(billingRule && { billingRule }),
        ...(usageLimits && { usageLimits: JSON.stringify(usageLimits) }),
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'tenant.modules.update',
      'tenant_module',
      updated.id,
      tenantId,
      before,
      updated
    );

    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. SAAS PLANS & PRICING
// ─────────────────────────────────────────────────────────────

router.get('/plans', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { basePrice: 'asc' },
    });
    res.json({ data: plans });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plans', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, slug, description, currency, billingInterval, basePrice,
      includedMembers, includedSms, includedStorageGb,
      memberOverageRate, smsOverageRate, storageOverageRate, modulesJson, featuresJson
    } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        currency: currency || 'USD',
        billingInterval: billingInterval || 'month',
        basePrice: Number(basePrice || 0),
        includedMembers: Number(includedMembers || 0),
        includedSms: Number(includedSms || 0),
        includedStorageGb: Number(includedStorageGb || 0),
        memberOverageRate: Number(memberOverageRate || 0),
        smsOverageRate: Number(smsOverageRate || 0),
        storageOverageRate: Number(storageOverageRate || 0),
        modulesJson: modulesJson ? JSON.stringify(modulesJson) : '[]',
        featuresJson: featuresJson ? JSON.stringify(featuresJson) : '[]',
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'plan.create',
      'plan',
      plan.id,
      undefined,
      null,
      plan
    );

    res.status(201).json({ data: plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/plans/:id', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const before = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!before) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.basePrice !== undefined && { basePrice: Number(body.basePrice) }),
        ...(body.includedMembers !== undefined && { includedMembers: Number(body.includedMembers) }),
        ...(body.includedStorageGb !== undefined && { includedStorageGb: Number(body.includedStorageGb) }),
        ...(body.modulesJson && { modulesJson: JSON.stringify(body.modulesJson) }),
        ...(body.featuresJson && { featuresJson: JSON.stringify(body.featuresJson) }),
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'plan.update',
      'plan',
      id,
      undefined,
      before,
      updated
    );

    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. SUBSCRIPTIONS & INVOICES
// ─────────────────────────────────────────────────────────────

router.get('/subscriptions', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.tenantSubscription.findMany({
      include: {
        tenant: true,
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoices', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.invoice.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. MODULE CATALOG CATALOG
// ─────────────────────────────────────────────────────────────

router.get('/modules', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.moduleDefinition.findMany({
      orderBy: { key: 'asc' },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/modules/:key', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key as string;
    const body = req.body;

    const before = await prisma.moduleDefinition.findUnique({ where: { key } });
    if (!before) {
      res.status(404).json({ error: 'Module definition not found' });
      return;
    }

    const updated = await prisma.moduleDefinition.update({
      where: { key },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.category && { category: body.category }),
        ...(body.description && { description: body.description }),
        ...(body.icon && { icon: body.icon }),
        ...(body.status && { status: body.status }),
        ...(body.isAddOn !== undefined && { isAddOn: Boolean(body.isAddOn) }),
        ...(body.supportsUsageBilling !== undefined && { supportsUsageBilling: Boolean(body.supportsUsageBilling) }),
        ...(body.supportsProviderModes !== undefined && { supportsProviderModes: Boolean(body.supportsProviderModes) }),
        ...(body.isPublicFacing !== undefined && { isPublicFacing: Boolean(body.isPublicFacing) }),
        ...(body.hasDashboardPages !== undefined && { hasDashboardPages: Boolean(body.hasDashboardPages) }),
        ...(body.hasMobileFeatures !== undefined && { hasMobileFeatures: Boolean(body.hasMobileFeatures) }),
        ...(body.requiresThirdParty !== undefined && { requiresThirdParty: Boolean(body.requiresThirdParty) }),
        ...(body.defaultSettingsSchema !== undefined && { defaultSettingsSchema: String(body.defaultSettingsSchema) }),
        ...(body.displayOrder !== undefined && { displayOrder: Number(body.displayOrder) }),
        ...(body.dependencies !== undefined && { dependencies: String(body.dependencies) }),
      },
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'module.catalog.update',
      'module_definition',
      key,
      undefined,
      before,
      updated
    );

    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. USAGE & DOMAINS
// ─────────────────────────────────────────────────────────────

router.get('/usage', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const usageList = await prisma.usageMeter.findMany({
      include: { tenant: true },
    });
    res.json({ data: usageList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/domains', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const domains = await prisma.tenantDomain.findMany({
      include: { tenant: true },
    });
    res.json({ data: domains });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/domains/:id/verify', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const domain = await prisma.tenantDomain.findUnique({ where: { id } });

    if (!domain) {
      res.status(404).json({ error: 'Domain mapping not found' });
      return;
    }

    // Simulate domain DNS verification
    const verified = true;
    const updated = await prisma.tenantDomain.update({
      where: { id },
      data: {
        status: 'active',
        providerMetadata: JSON.stringify({ verifiedAt: new Date().toISOString(), sslStatus: 'active' }),
      },
    });

    res.json({ data: updated, verified });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. PLATFORM TEAM USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get('/platform-users', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.platformUser.findMany({
      include: { platformRole: true },
    });
    res.json({ data: users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/platform-users', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, roleId } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const existing = await prisma.platformUser.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Platform email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.platformUser.create({
      data: {
        email,
        passwordHash,
        roleId,
        status: 'active',
      },
    });

    res.status(201).json({ data: { id: user.id, email: user.email, status: user.status } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. DEVELOPER SUBMISSIONS GOVERNANCE
// ─────────────────────────────────────────────────────────────

router.get('/marketplace', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const submissions = await prisma.assetSubmission.findMany({
      include: {
        asset: {
          include: { developer: { include: { user: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ data: submissions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/marketplace/assets', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assets = await prisma.marketplaceAsset.findMany({
      include: {
        developer: { include: { user: true } },
        versions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/marketplace/:submissionId', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const submissionId = req.params.submissionId as string;
    const { status, reviewerNotes } = req.body; // approved | rejected

    const sub = await prisma.assetSubmission.findUnique({ where: { id: submissionId } });
    if (!sub) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const updatedSub = await prisma.$transaction(async (tx) => {
      const uSub = await tx.assetSubmission.update({
        where: { id: submissionId },
        data: { status },
      });

      // Insert reviewer feedback log
      await tx.submissionReview.create({
        data: {
          submissionId,
          reviewerId: req.platformUser!.userId,
          decision: status,
          notes: reviewerNotes || `Approved via Super Admin Panel`,
        },
      });

      if (status === 'approved') {
        // Publish/approve the primary marketplace asset version
        await tx.marketplaceAsset.update({
          where: { id: sub.assetId },
          data: { status: 'approved', version: sub.version },
        });
      }

      return uSub;
    });

    res.json({ data: updatedSub });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submissions/:submissionId/review', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const submissionId = req.params.submissionId as string;
    const { decision, notes } = req.body;
    const reviewerId = req.platformUser!.userId;

    if (!decision) {
      res.status(400).json({ error: 'decision is required' });
      return;
    }

    const review = await reviewSubmission(submissionId, reviewerId, decision, notes);
    res.status(201).json({ data: review });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Suspend or unsuspend an asset
router.post('/marketplace/assets/:assetId/suspend', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assetId = req.params.assetId as string;
    const { status } = req.body; // suspended | approved

    if (status !== 'suspended' && status !== 'approved') {
      res.status(400).json({ error: 'Status must be suspended or approved' });
      return;
    }

    const updated = await suspendMarketplaceAsset(assetId, status);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record a security review for an asset version
router.post('/marketplace/assets/:assetId/versions/:versionId/security-review', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assetId = req.params.assetId as string;
    const versionId = req.params.versionId as string;
    const { status, notes } = req.body; // passed | failed | flagged

    const review = await recordSecurityReview(assetId, versionId, status, notes, req.platformUser!.userId);
    res.json({ data: review });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all security review records
router.get('/marketplace/security-reviews', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.marketplaceSecurityReview.findMany({
      include: {
        asset: true,
        version: true,
      },
      orderBy: { scannedAt: 'desc' },
    });
    res.json({ data: reviews });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all marketplace audit logs (platform-wide)
router.get('/marketplace/audit-logs', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.marketplaceAuditLog.findMany({
      include: {
        tenant: {
          select: { name: true, subdomain: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all registered developers
router.get('/marketplace/developers', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const developers = await prisma.developerProfile.findMany({
      include: {
        user: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: developers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global Themes Presets Catalog
router.get('/themes', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Return system visual theme presets
    const list = await prisma.theme.findMany({
      where: { tenantId: null },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global Plugins registry catalog
router.get('/plugins', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.pluginDefinition.findMany();
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 10. INTEGRATION HUB / CONNECTED SERVICES
// ─────────────────────────────────────────────────────────────

router.get('/integrations', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.provider.findMany({
      include: { category: true },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggles general provider status / config
router.patch('/integrations/:id', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;

    const provider = await prisma.provider.findUnique({ where: { id } });
    if (!provider) {
      res.status(404).json({ error: 'Integration provider not found' });
      return;
    }

    const updated = await prisma.provider.update({
      where: { id },
      data: { name },
    });

    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 11. SUPPORT TICKETS
// ─────────────────────────────────────────────────────────────

router.get('/support', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: tickets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/support/:id/reply', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { replyMessage, status, internalNotes } = req.body;

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: status || 'resolved',
        ...(internalNotes && { internalNotes }),
      },
    });

    // Simulate sending email notification/response
    res.json({ message: 'Reply sent successfully', data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 12. ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────

router.post('/announcements', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, type, targetAudience, expiresAt } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'title and content are required' });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'info',
        targetAudience: targetAudience || 'all',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({ data: announcement });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 13. PLATFORM AUDIT LOGS & HEALTH
// ─────────────────────────────────────────────────────────────

router.get('/audit-logs', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await prisma.platformAuditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/system-health', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.systemHealthEvent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Static placeholder metrics compiled with live events
    const state = {
      database: 'healthy',
      api: 'healthy',
      queue: 'active',
      providers: {
        stripe: 'operational',
        resend: 'operational',
        cloudinary: 'operational',
      },
      recentEvents: logs,
    };

    res.json({ data: state });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 14. PLATFORM SETTINGS
// ─────────────────────────────────────────────────────────────

router.get('/settings', requirePlatformPermission('platform.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.platformSetting.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach(s => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });

    const defaults = {
      platformName: settingsMap.platformName || 'ChurchOS Platform Engine',
      accentColor: settingsMap.accentColor || '#4f46e5',
      accentSoftColor: settingsMap.accentSoftColor || 'rgba(79, 70, 229, 0.14)',
      defaultTrialDays: settingsMap.defaultTrialDays || 14,
      maintenanceMode: settingsMap.maintenanceMode || false,
      signupEnabled: settingsMap.signupEnabled || true,
    };

    res.json({ data: defaults });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', requirePlatformPermission('platform.write'), async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    
    const results = await prisma.$transaction(
      Object.keys(body).map(key => {
        const valStr = JSON.stringify(body[key]);
        return prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: valStr },
          update: { value: valStr },
        });
      })
    );

    const settingsMap: Record<string, any> = {};
    results.forEach(s => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });

    await logPlatformAction(
      req.platformUser!.userId,
      req.platformUser!.email,
      req.platformUser!.roleName,
      'settings.update',
      'platform_settings',
      'global',
      undefined,
      null,
      settingsMap
    );

    res.json({ data: settingsMap });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
