import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// Secure all endpoints: requires authenticated tenant administrator
router.use(authMiddleware);

const WIZARD_STEPS = [
  { stepKey: 'profile', title: 'Church Profile', description: 'Basic church identity and service details' },
  { stepKey: 'logo', title: 'Logo Upload', description: 'Light logo, dark logo, and favicon' },
  { stepKey: 'theme', title: 'Choose Theme', description: 'Starter theme selection' },
  { stepKey: 'design', title: 'Design Style', description: 'Colors, modes, and edges' },
  { stepKey: 'modules', title: 'Select Modules', description: 'Enable plan-allowed modules' },
  { stepKey: 'website', title: 'Website Basics', description: 'Homepage copy and social details' },
  { stepKey: 'domain', title: 'Domain Setup', description: 'Church subdomain or custom domain configuration' },
  { stepKey: 'giving', title: 'Giving Setup', description: 'Configure giving gateway settings' },
  { stepKey: 'invite', title: 'Invite Team', description: 'Add other pastors and staff members' },
  { stepKey: 'complete', title: 'Launch Dashboard', description: 'Final onboarding completion check' },
];

/**
 * Helper to ensure checklist records exist for the tenant.
 */
async function ensureChecklist(tenantId: string) {
  const existingCount = await prisma.tenantOnboardingStep.count({
    where: { tenantId },
  });

  if (existingCount === WIZARD_STEPS.length) {
    return;
  }

  for (const step of WIZARD_STEPS) {
    await prisma.tenantOnboardingStep.upsert({
      where: {
        tenantId_stepKey: {
          tenantId,
          stepKey: step.stepKey,
        },
      },
      update: {},
      create: {
        tenantId,
        stepKey: step.stepKey,
        title: step.title,
        description: step.description,
        status: 'pending',
      },
    });
  }
}

/**
 * GET /api/onboarding
 * Retrieves the checklist status and overall progress percentage.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    await ensureChecklist(tenantId);

    const steps = await prisma.tenantOnboardingStep.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        country: true,
        city: true,
        timezone: true,
        onboardingStatus: true,
        onboardingCompletedAt: true,
        customDomain: true,
      },
    });

    const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    res.json({
      data: {
        onboardingStatus: tenant?.onboardingStatus || 'pending',
        onboardingCompletedAt: tenant?.onboardingCompletedAt || null,
        progressPercent,
        steps,
        tenant,
      },
    });
  } catch (err: any) {
    console.error('Fetch onboarding progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/church-profile
 * Body: { country, city, address, phone, email, serviceTimes, timezone }
 */
router.patch('/church-profile', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { country, city, address, phone, email, serviceTimes, timezone } = req.body;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        country: country || null,
        city: city || null,
        timezone: timezone || 'UTC',
      },
    });

    // Also update profile step status
    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'profile' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ country, city, serviceTimes }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding church profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/logo
 * Body: { logoUrl, darkLogoUrl, faviconUrl }
 */
router.patch('/logo', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { logoUrl, darkLogoUrl, faviconUrl } = req.body;

    const moduleKey = 'domain-tenant-management';

    // Retrieve current ModuleSettings
    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
    });

    let settings = {};
    if (brandingRecord && brandingRecord.settings) {
      try {
        settings = JSON.parse(brandingRecord.settings);
      } catch {}
    }

    const updatedSettings = {
      ...settings,
      logo: logoUrl || '',
      darkLogo: darkLogoUrl || '',
      favicon: faviconUrl || '',
    };

    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      create: {
        tenantId,
        moduleKey,
        settings: JSON.stringify(updatedSettings),
      },
      update: {
        settings: JSON.stringify(updatedSettings),
      },
    });

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'logo' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ logoUrl, darkLogoUrl, faviconUrl }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding logo update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/theme
 * Body: { themeId }
 */
router.patch('/theme', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { themeId } = req.body;

    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true },
    });

    if (primaryWebsite) {
      await prisma.website.update({
        where: { id: primaryWebsite.id },
        data: { themeId },
      });
    }

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'theme' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ themeId }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding theme update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/design
 * Body: { mode, accentColor, roundedEdges }
 */
router.patch('/design', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { mode, accentColor, roundedEdges } = req.body;

    const moduleKey = 'domain-tenant-management';

    // Retrieve current settings
    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
    });

    let settings = {};
    if (brandingRecord && brandingRecord.settings) {
      try {
        settings = JSON.parse(brandingRecord.settings);
      } catch {}
    }

    const updatedSettings = {
      ...settings,
      mode: mode || 'system',
      accent: accentColor || '#f97316',
      roundedEdges: roundedEdges !== undefined ? roundedEdges : true,
    };

    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      create: {
        tenantId,
        moduleKey,
        settings: JSON.stringify(updatedSettings),
      },
      update: {
        settings: JSON.stringify(updatedSettings),
      },
    });

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'design' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ mode, accentColor, roundedEdges }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding design update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/modules
 * Body: { enabledModuleKeys }
 */
router.patch('/modules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { enabledModuleKeys } = req.body;

    if (!Array.isArray(enabledModuleKeys)) {
      res.status(400).json({ error: 'enabledModuleKeys must be an array' });
      return;
    }

    // Retrieve tenant active plan
    const sub = await prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    const allowedModules = sub?.plan?.modulesJson ? JSON.parse(sub.plan.modulesJson) : [];

    for (const key of enabledModuleKeys) {
      const isAllowed = allowedModules.includes(key) || ['website-cms', 'theme-engine', 'domain-tenant-management'].includes(key);
      if (!isAllowed) {
        res.status(403).json({ error: `Module '${key}' is locked under your current plan. Please upgrade to enable.` });
        return;
      }
    }

    // Deactivate modules not in the selected list, activate the selected ones
    await prisma.$transaction(async (tx) => {
      // Deactivate others
      await tx.tenantModule.deleteMany({
        where: {
          tenantId,
          moduleKey: { notIn: enabledModuleKeys },
        },
      });

      // Activate selected
      for (const moduleKey of enabledModuleKeys) {
        await tx.tenantModule.upsert({
          where: { tenantId_moduleKey: { tenantId, moduleKey } },
          create: {
            tenantId,
            moduleKey,
            status: 'active',
            billingRule: 'plan_included',
          },
          update: {
            status: 'active',
          },
        });
      }
    });

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'modules' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ enabledModuleKeys }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding modules update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/website-basics
 * Body: { homepageTitle, homepageSubtitle, heroImageUrl, primaryCtaText, primaryCtaUrl, aboutText }
 */
router.patch('/website-basics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { homepageTitle, homepageSubtitle, heroImageUrl, primaryCtaText, primaryCtaUrl, aboutText } = req.body;

    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true },
    });

    if (primaryWebsite) {
      // Find home page
      const homePage = await prisma.page.findFirst({
        where: { websiteId: primaryWebsite.id, isHome: true },
      });

      if (homePage) {
        const content = [
          {
            type: 'hero',
            title: homepageTitle || 'Welcome Home',
            subtitle: homepageSubtitle || 'We are glad you are here.',
            bgImage: heroImageUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=80',
            buttonText: primaryCtaText || 'Plan a Visit',
            buttonUrl: primaryCtaUrl || '/visit',
          },
          {
            type: 'about_story',
            storyText: aboutText || 'Learn more about our mission, vision, and leadership.',
          },
        ];

        await prisma.page.update({
          where: { id: homePage.id },
          data: {
            content: JSON.stringify(content),
          },
        });
      }
    }

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'website' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ homepageTitle, homepageSubtitle }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding website basics update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/domain
 * Body: { customDomain }
 */
router.patch('/domain', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { customDomain } = req.body;

    const domainName = customDomain ? customDomain.trim().toLowerCase() : null;

    if (domainName) {
      const duplicate = await prisma.tenant.findFirst({
        where: {
          id: { not: tenantId },
          customDomain: domainName,
        },
      });
      if (duplicate) {
        res.status(409).json({ error: 'This custom domain is already registered to another tenant.' });
        return;
      }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { customDomain: domainName },
    });

    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true },
    });

    if (primaryWebsite) {
      await prisma.website.update({
        where: { id: primaryWebsite.id },
        data: { domain: domainName },
      });
    }

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'domain' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ customDomain: domainName }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding domain update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/giving
 * Body: { gatewayProvider, integrationMode }
 */
router.patch('/giving', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { gatewayProvider, integrationMode } = req.body;

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'giving' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ gatewayProvider, integrationMode }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding giving update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/onboarding/invite-team
 * Body: { email, roleName }
 */
router.post('/invite-team', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { email, roleName } = req.body;

    if (!email || !roleName) {
      res.status(400).json({ error: 'email and roleName are required' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (existing) {
      res.status(409).json({ error: 'Email already exists in this church tenant' });
      return;
    }

    let role = await prisma.role.findFirst({
      where: { tenantId, name: roleName },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { tenantId, name: roleName, description: `${roleName} level staff role`, isCustom: true },
      });
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordPlaceholder = await bcrypt.hash(randomPassword, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email,
          passwordHash: passwordPlaceholder,
          status: 'invited',
        },
      });

      const names = email.split('@')[0].split('.');
      const firstName = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1) : 'Invited';
      const lastName = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1) : 'Staff';

      await tx.member.create({
        data: {
          tenantId,
          userId: user.id,
          firstName,
          lastName,
          email,
          membershipStatus: 'visitor',
        },
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: role!.id },
      });
    });

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'invite' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadataJson: JSON.stringify({ email, roleName }),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding team invitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/onboarding/complete
 * Ends the onboarding workflow and logs launch details.
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        onboardingStatus: 'completed',
        onboardingCompletedAt: new Date(),
      },
    });

    await prisma.tenantOnboardingStep.update({
      where: { tenantId_stepKey: { tenantId, stepKey: 'complete' } },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Onboarding complete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
