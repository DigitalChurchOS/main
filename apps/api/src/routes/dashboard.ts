import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Require authentication for all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/setup-checklist
 * Computes and returns the 10-step launch readiness checklist.
 */
router.get('/setup-checklist', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;

    // Fetch tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        onboardingSteps: true,
        websites: true,
      },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Check services, events, and users counts
    const serviceCount = await prisma.churchService.count({ where: { tenantId } });
    const eventCount = await prisma.event.count({ where: { tenantId } });
    const userCount = await prisma.user.count({ where: { tenantId } });

    // Retrieve onboarding steps for override checks
    const stepsMap = new Map(tenant.onboardingSteps.map((s) => [s.stepKey, s]));

    const isStepCompleted = (stepKey: string, dbCondition: boolean) => {
      const step = stepsMap.get(stepKey);
      if (step && (step.status === 'completed' || step.status === 'skipped')) {
        return true;
      }
      return dbCondition;
    };

    const getCompletedAt = (stepKey: string, dbCondition: boolean) => {
      const step = stepsMap.get(stepKey);
      if (step && step.completedAt) {
        return step.completedAt;
      }
      return dbCondition ? new Date() : null;
    };

    const checklistItems = [
      {
        key: 'profile',
        title: 'Complete church profile',
        description: 'Provide your basic church identity and timezone settings.',
        status: isStepCompleted('profile', !!(tenant.city && tenant.country)) ? 'completed' : 'pending',
        completionDate: getCompletedAt('profile', !!(tenant.city && tenant.country)),
        actionLink: '/onboarding.html?step=1',
        assignedArea: 'Settings',
      },
      {
        key: 'logo',
        title: 'Upload logo',
        description: 'Upload your light/dark mode logo assets and tab favicon.',
        status: isStepCompleted('logo', false) ? 'completed' : 'pending',
        completionDate: getCompletedAt('logo', false),
        actionLink: '/onboarding.html?step=2',
        assignedArea: 'Branding',
      },
      {
        key: 'theme',
        title: 'Choose theme',
        description: 'Select a church template theme such as the Christo Theme.',
        status: isStepCompleted('theme', false) ? 'completed' : 'pending',
        completionDate: getCompletedAt('theme', false),
        actionLink: '/onboarding.html?step=3',
        assignedArea: 'Design',
      },
      {
        key: 'website',
        title: 'Customize homepage',
        description: 'Establish your primary hero headlines, copy, and visual style.',
        status: isStepCompleted('website', false) ? 'completed' : 'pending',
        completionDate: getCompletedAt('website', false),
        actionLink: '/onboarding.html?step=6',
        assignedArea: 'CMS',
      },
      {
        key: 'first-service',
        title: 'Add first service',
        description: 'Add your regular service schedule, times, and streaming links.',
        status: serviceCount > 0 ? 'completed' : 'pending',
        completionDate: serviceCount > 0 ? new Date() : null,
        actionLink: '/admin#church-services',
        assignedArea: 'Connect',
      },
      {
        key: 'first-event',
        title: 'Add first event',
        description: 'Publish your first event or announcement card to the congregation.',
        status: eventCount > 0 ? 'completed' : 'pending',
        completionDate: eventCount > 0 ? new Date() : null,
        actionLink: '/admin#events',
        assignedArea: 'Connect',
      },
      {
        key: 'invite',
        title: 'Invite team member',
        description: 'Add other pastors, leaders, and content editors to your dashboard.',
        status: isStepCompleted('invite', userCount > 1) ? 'completed' : 'pending',
        completionDate: getCompletedAt('invite', userCount > 1),
        actionLink: '/onboarding.html?step=9',
        assignedArea: 'Users & Roles',
      },
      {
        key: 'giving',
        title: 'Configure giving',
        description: 'Select and integrate a donation/payment gateway provider.',
        status: isStepCompleted('giving', false) ? 'completed' : 'pending',
        completionDate: getCompletedAt('giving', false),
        actionLink: '/onboarding.html?step=8',
        assignedArea: 'Giving',
      },
      {
        key: 'domain',
        title: 'Connect domain',
        description: 'Setup a secure custom domain or confirm your church subdomain.',
        status: isStepCompleted('domain', !!tenant.customDomain) ? 'completed' : 'pending',
        completionDate: getCompletedAt('domain', !!tenant.customDomain),
        actionLink: '/onboarding.html?step=7',
        assignedArea: 'Domain Setup',
      },
      {
        key: 'publish',
        title: 'Publish website',
        description: 'Make your church website live for the world to see.',
        status: isStepCompleted('complete', tenant.websites.some((w) => w.isActive)) ? 'completed' : 'pending',
        completionDate: getCompletedAt('complete', tenant.websites.some((w) => w.isActive)),
        actionLink: '/onboarding.html?step=10',
        assignedArea: 'CMS',
      },
    ];

    const completedCount = checklistItems.filter((i) => i.status === 'completed').length;
    const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

    res.json({
      data: {
        progressPercent,
        items: checklistItems,
      },
    });
  } catch (err: any) {
    console.error('Fetch dashboard checklist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/dashboard/setup-checklist/:stepKey
 * Allows manually completing/skipping checklist items.
 */
router.patch('/setup-checklist/:stepKey', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const stepKey = req.params.stepKey as string;
    const { status } = req.body; // completed | skipped | pending

    if (!status || !['completed', 'skipped', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const step = await prisma.tenantOnboardingStep.upsert({
      where: {
        tenantId_stepKey: {
          tenantId,
          stepKey,
        },
      },
      update: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
        skippedAt: status === 'skipped' ? new Date() : null,
      },
      create: {
        tenantId,
        stepKey,
        title: stepKey.replace('-', ' '),
        status,
        completedAt: status === 'completed' ? new Date() : null,
        skippedAt: status === 'skipped' ? new Date() : null,
      },
    });

    res.json({ success: true, data: step });
  } catch (err: any) {
    console.error('Update checklist step error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/quick-actions
 * Returns quick actions list with labels, icons, and redirect tags.
 */
router.get('/quick-actions', async (req: Request, res: Response) => {
  const actions = [
    { label: 'Customize Website', icon: 'palette', view: 'cms', url: '/admin#cms' },
    { label: 'Add Sermon', icon: 'clapperboard', view: 'media', url: '/admin#media' },
    { label: 'Create Event', icon: 'calendar-days', view: 'events', url: '/admin#events' },
    { label: 'Invite Team', icon: 'users-round', view: 'users-roles', url: '/admin#user-role-management' },
    { label: 'Set Up Giving', icon: 'hand-coins', view: 'giving', url: '/admin#giving' },
    { label: 'Manage Members', icon: 'users', view: 'members', url: '/admin#members' },
    { label: 'Choose Theme', icon: 'brush', view: 'themes', url: '/admin#theme-engine' },
    { label: 'Connect Domain', icon: 'globe', view: 'domain-tenant-management', url: '/admin#domain-tenant-management' },
  ];
  res.json({ data: actions });
});

/**
 * GET /api/dashboard/recent-activity
 * Returns a list of activities triggered by the tenant.
 */
router.get('/recent-activity', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const logs = await prisma.cmsActivityLog.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: logs });
  } catch (err: any) {
    console.error('Fetch recent activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/dashboard/home
 * Returns the consolidated summary of setup checklist, quick actions, billing subscription, and domain config.
 */
router.get('/home', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;

    // Fetch tenant + subscription info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Setup checklist status
    const serviceCount = await prisma.churchService.count({ where: { tenantId } });
    const eventCount = await prisma.event.count({ where: { tenantId } });
    const userCount = await prisma.user.count({ where: { tenantId } });

    const onboardingSteps = await prisma.tenantOnboardingStep.findMany({
      where: { tenantId },
    });
    const stepsMap = new Map(onboardingSteps.map((s) => [s.stepKey, s]));

    const isStepCompleted = (stepKey: string, dbCondition: boolean) => {
      const step = stepsMap.get(stepKey);
      if (step && (step.status === 'completed' || step.status === 'skipped')) {
        return true;
      }
      return dbCondition;
    };

    const checklistCount = 10;
    const completedCount = [
      isStepCompleted('profile', !!(tenant.city && tenant.country)),
      isStepCompleted('logo', false),
      isStepCompleted('theme', false),
      isStepCompleted('website', false),
      serviceCount > 0,
      eventCount > 0,
      isStepCompleted('invite', userCount > 1),
      isStepCompleted('giving', false),
      isStepCompleted('domain', !!tenant.customDomain),
      isStepCompleted('complete', false),
    ].filter(Boolean).length;

    const progressPercent = Math.round((completedCount / checklistCount) * 100);

    // Recent activity logs
    const logs = await prisma.cmsActivityLog.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: {
        welcomeHeader: `Welcome back to ${tenant.name}`,
        progressPercent,
        planStatus: {
          name: tenant.subscription?.plan?.name || 'Free Trial',
          trialEndsAt: tenant.trialEndsAt,
          status: tenant.subscription?.status || 'trialing',
        },
        domainStatus: {
          subdomain: tenant.subdomain,
          customDomain: tenant.customDomain,
          status: tenant.customDomain ? 'connected' : 'subdomain_only',
        },
        recentActivity: logs,
      },
    });
  } catch (err: any) {
    console.error('Fetch dashboard home config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
