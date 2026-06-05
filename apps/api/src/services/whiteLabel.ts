import prisma from '../lib/prisma';

// ─── App Configuration ──────────────────────────────────────

export async function configureApp(
  tenantId: string,
  data: {
    appName: string;
    appDescription?: string;
    logoUrl?: string;
    appIconUrl?: string;
    splashScreenUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    iosBundleId?: string;
    androidPackageName?: string;
    pushCertificatesJson?: string;
  },
) {
  return prisma.whiteLabelApp.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: { ...data },
  });
}

export async function getAppConfig(tenantId: string) {
  return prisma.whiteLabelApp.findUnique({ where: { tenantId } });
}

// ─── Build Pipeline (Expo EAS mock) ─────────────────────────

export async function triggerBuild(
  tenantId: string,
  appId: string,
  data: { platform: string; version: string },
) {
  // Determine next build number for this app + platform
  const lastBuild = await prisma.whiteLabelBuild.findFirst({
    where: { tenantId, appId, platform: data.platform },
    orderBy: { buildNumber: 'desc' },
  });

  const buildNumber = lastBuild ? lastBuild.buildNumber + 1 : 1;

  return prisma.whiteLabelBuild.create({
    data: {
      tenantId,
      appId,
      platform: data.platform,
      version: data.version,
      buildNumber,
      status: 'queued',
      logs: `[${new Date().toISOString()}] Build queued for ${data.platform} v${data.version} #${buildNumber}\n`,
    },
  });
}

export async function processBuild(tenantId: string, buildId: string) {
  const build = await prisma.whiteLabelBuild.findFirst({
    where: { id: buildId, tenantId },
  });
  if (!build) throw new Error('Build not found');
  if (build.status !== 'queued' && build.status !== 'building') {
    throw new Error(`Cannot process build in status "${build.status}"`);
  }

  const now = new Date();

  if (build.status === 'queued') {
    // Transition to building
    return prisma.whiteLabelBuild.update({
      where: { id: buildId },
      data: {
        status: 'building',
        logs:
          build.logs +
          `[${now.toISOString()}] Compiling ${build.platform} bundle...\n` +
          `[${now.toISOString()}] Bundling JavaScript assets...\n` +
          `[${now.toISOString()}] Generating native binaries...\n`,
      },
    });
  }

  // Transition from building → completed
  const ext = build.platform === 'ios' ? 'ipa' : 'apk';
  const downloadUrl = `https://builds.churchos.app/${tenantId}/${build.appId}/${build.platform}-v${build.version}-b${build.buildNumber}.${ext}`;

  return prisma.whiteLabelBuild.update({
    where: { id: buildId },
    data: {
      status: 'completed',
      downloadUrl,
      completedAt: now,
      logs:
        build.logs +
        `[${now.toISOString()}] Build completed successfully.\n` +
        `[${now.toISOString()}] Artifact: ${downloadUrl}\n`,
    },
  });
}

export async function listBuilds(tenantId: string) {
  return prisma.whiteLabelBuild.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Store Submission (mock) ─────────────────────────────────

export async function submitToStore(
  tenantId: string,
  buildId: string,
  data: { storeType: string; storeDetailsJson?: string },
) {
  const build = await prisma.whiteLabelBuild.findFirst({
    where: { id: buildId, tenantId },
  });
  if (!build) throw new Error('Build not found');
  if (build.status !== 'completed') {
    throw new Error('Only completed builds can be submitted to a store');
  }

  // Also update the WhiteLabelApp store details if provided
  if (data.storeDetailsJson) {
    await prisma.whiteLabelApp.updateMany({
      where: { tenantId },
      data: { storeDetailsJson: data.storeDetailsJson },
    });
  }

  const now = new Date();
  return prisma.whiteLabelBuild.update({
    where: { id: buildId },
    data: {
      storeType: data.storeType,
      submittedAt: now,
      logs:
        build.logs +
        `[${now.toISOString()}] Submitted to ${data.storeType} for review.\n`,
    },
  });
}
