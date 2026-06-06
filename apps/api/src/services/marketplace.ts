import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

/**
 * Register a new developer profile.
 */
export async function registerDeveloper(
  userId: string,
  companyName?: string,
  website?: string,
  payoutEmail?: string
): Promise<any> {
  // Check if developer profile already exists for this user
  const existing = await prisma.developerProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error('Developer profile already exists for this user');
  }

  return await prisma.developerProfile.create({
    data: {
      userId,
      companyName,
      website,
      status: 'active',
      payoutEmail,
    },
  });
}

/**
 * Define a new marketplace asset (draft).
 */
export async function createAsset(
  developerId: string,
  name: string,
  description: string | null,
  type: string, // plugin | theme
  pricingType: string, // free | paid
  price: number,
  assetConfig: any
): Promise<any> {
  const developer = await prisma.developerProfile.findUnique({
    where: { id: developerId },
  });

  if (!developer) {
    throw new Error('Developer profile not found');
  }

  if (type !== 'plugin' && type !== 'theme') {
    throw new Error('Invalid asset type. Must be plugin or theme');
  }

  if (pricingType !== 'free' && pricingType !== 'paid') {
    throw new Error('Invalid pricing type. Must be free or paid');
  }

  const finalPrice = pricingType === 'free' ? 0.0 : price;

  return await prisma.marketplaceAsset.create({
    data: {
      developerId,
      name,
      description,
      type,
      pricingType,
      price: finalPrice,
      version: '1.0.0',
      status: 'draft',
      assetConfig: JSON.stringify(assetConfig || {}),
      revenueSharePct: 0.70, // 70% to developer, 30% to platform
    },
  });
}

/**
 * Validate theme package manifest and configuration fields.
 */
export function validateThemePackage(config: any): string[] {
  const errors: string[] = [];

  // 1. Check for manifest identity fields
  if (!config.id && !config.themeKey && !config.slug) {
    errors.push("Theme must declare an 'id', 'themeKey', or 'slug' in manifest configuration.");
  }
  if (!config.name && !config.displayName) {
    errors.push("Theme must declare a 'name' or 'displayName'.");
  }
  if (!config.version) {
    errors.push("Theme must declare a 'version' number (e.g., '1.0.0').");
  }
  if (!config.author) {
    errors.push("Theme must declare an 'author'.");
  }
  if (!config.description) {
    errors.push("Theme must declare a 'description'.");
  }

  // 2. Check settings schema
  if (!config.settingsSchema) {
    errors.push("Theme must declare a 'settingsSchema' object.");
  }

  // 3. Check templates & sections
  if (!config.templates || !Array.isArray(config.templates)) {
    errors.push("Theme must support a 'templates' array in its manifest.");
  }
  if (!config.sections || !Array.isArray(config.sections)) {
    errors.push("Theme must support a 'sections' array in its manifest.");
  }

  // 4. Check for unsafe scripts / direct db operations / backends
  const serialized = JSON.stringify(config).toLowerCase();
  const unsafePatterns = [
    '<script',
    'javascript:',
    'onload=',
    'onerror=',
    'eval(',
    'document.cookie',
    'window.location',
    'prisma.',
    'db.query',
    'select * from',
  ];

  for (const pattern of unsafePatterns) {
    if (serialized.includes(pattern)) {
      errors.push(`Security Scan Flagged Unsafe Pattern: "${pattern}"`);
    }
  }

  // Check external tracker domains
  const trackerPatterns = ['google-analytics.com', 'hotjar.com', 'facebook.net'];
  for (const tracker of trackerPatterns) {
    if (serialized.includes(tracker)) {
      errors.push(`Security Scan Blocked Unauthorized External Tracker: "${tracker}"`);
    }
  }

  // 5. Check for .zip archive package file
  if (!config.archiveFile) {
    errors.push("Theme package must specify an 'archiveFile' filename.");
  } else if (!config.archiveFile.toLowerCase().endsWith('.zip')) {
    errors.push("Theme package 'archiveFile' must be a valid zip archive (.zip).");
  }

  // 6. Check for theme cover image (like in WordPress)
  if (!config.themeCoverImage) {
    errors.push("Theme package must specify a 'themeCoverImage' filename.");
  } else {
    const validImageExtensions = ['.png', '.jpg', '.jpeg'];
    const lowerImage = config.themeCoverImage.toLowerCase();
    const hasValidExt = validImageExtensions.some(ext => lowerImage.endsWith(ext));
    if (!hasValidExt) {
      errors.push("Theme package 'themeCoverImage' must be a valid image file (.png, .jpg, or .jpeg).");
    }
  }

  return errors;
}

/**
 * Submit an asset version for review.
 */
export async function submitAssetVersion(
  assetId: string,
  version: string,
  changelog?: string
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error('Marketplace asset not found');
  }

  const config = JSON.parse(asset.assetConfig || '{}');
  
  // Parse and build manifest details
  const manifestObj = {
    id: config.id || config.themeKey || config.slug || assetId,
    name: config.name || config.displayName || asset.name,
    version: version,
    author: config.author || 'Developer',
    description: config.description || asset.description || '',
    requiredPermissions: config.requiredPermissions || [],
    requiredModules: config.requiredModules || [],
    defaultSettings: config.defaultSettings || {},
    templates: config.templates || [],
    sections: config.sections || [],
    settingsSchema: config.settingsSchema || {},
    screenshots: config.screenshots || [],
    archiveFile: config.archiveFile || '',
    themeCoverImage: config.themeCoverImage || '',
  };

  // Run validation checks if asset is a theme
  let validationErrors: string[] = [];
  if (asset.type === 'theme') {
    validationErrors = validateThemePackage(config);
  }

  // Upsert the version entry as pending
  const versionRecord = await prisma.marketplaceAssetVersion.upsert({
    where: {
      assetId_version: { assetId, version },
    },
    update: {
      changelog,
      status: 'pending',
      manifestJson: JSON.stringify(manifestObj),
    },
    create: {
      assetId,
      version,
      changelog,
      status: 'pending',
      manifestJson: JSON.stringify(manifestObj),
    },
  });

  // Create submission
  const submission = await prisma.assetSubmission.create({
    data: {
      assetId,
      version,
      changelog,
      status: 'pending',
    },
  });

  // Record security review logs
  if (validationErrors.length > 0) {
    await prisma.marketplaceSecurityReview.create({
      data: {
        assetId,
        versionId: versionRecord.id,
        status: 'failed',
        notes: `Validation failed with errors:\n- ${validationErrors.join('\n- ')}`,
      },
    });

    // Update asset status to rejected
    await prisma.marketplaceAsset.update({
      where: { id: assetId },
      data: { status: 'rejected' },
    });

    // Update submission status to rejected
    await prisma.assetSubmission.update({
      where: { id: submission.id },
      data: { status: 'rejected' },
    });

    // Update version status to rejected
    await prisma.marketplaceAssetVersion.update({
      where: { id: versionRecord.id },
      data: { status: 'rejected' },
    });

    throw new Error(`Theme package validation failed:\n- ${validationErrors.join('\n- ')}`);
  } else {
    // Passed validation
    await prisma.marketplaceSecurityReview.create({
      data: {
        assetId,
        versionId: versionRecord.id,
        status: 'passed',
        notes: 'Security scans and manifest structures validated successfully.',
      },
    });

    // Update asset status to under_review
    await prisma.marketplaceAsset.update({
      where: { id: assetId },
      data: {
        status: 'under_review',
      },
    });
  }

  return submission;
}

/**
 * Review a version submission (Admin action).
 */
export async function reviewSubmission(
  submissionId: string,
  reviewerId: string,
  decision: string, // approved | rejected | changes_requested
  notes?: string
): Promise<any> {
  const submission = await prisma.assetSubmission.findUnique({
    where: { id: submissionId },
    include: { asset: true },
  });

  if (!submission) {
    throw new Error('Asset submission not found');
  }

  if (!['approved', 'rejected', 'changes_requested'].includes(decision)) {
    throw new Error('Invalid review decision');
  }

  // Create review record
  const review = await prisma.submissionReview.create({
    data: {
      submissionId,
      reviewerId,
      decision,
      notes,
    },
  });

  // Update submission status
  await prisma.assetSubmission.update({
    where: { id: submissionId },
    data: { status: decision },
  });

  // If approved, update asset status, version, and the version registry entry status
  if (decision === 'approved') {
    await prisma.marketplaceAssetVersion.update({
      where: {
        assetId_version: {
          assetId: submission.assetId,
          version: submission.version,
        },
      },
      data: { status: 'approved' },
    });

    const updatedAsset = await prisma.marketplaceAsset.update({
      where: { id: submission.assetId },
      data: {
        status: 'approved',
        version: submission.version,
      },
    });

    // If the asset is a plugin, upsert the global PluginDefinition
    if (updatedAsset.type === 'plugin') {
      const config = JSON.parse(updatedAsset.assetConfig);
      await prisma.pluginDefinition.upsert({
        where: { id: updatedAsset.id },
        update: {
          name: updatedAsset.name,
          description: updatedAsset.description,
          version: updatedAsset.version,
          requiredPermissions: JSON.stringify(config.requiredPermissions || []),
          requiredOsVersion: config.requiredOsVersion || '1.0.0',
          price: updatedAsset.price,
          isActive: true,
        },
        create: {
          id: updatedAsset.id,
          name: updatedAsset.name,
          description: updatedAsset.description,
          version: updatedAsset.version,
          requiredPermissions: JSON.stringify(config.requiredPermissions || []),
          requiredOsVersion: config.requiredOsVersion || '1.0.0',
          price: updatedAsset.price,
          isActive: true,
        },
      });
    } else if (updatedAsset.type === 'theme') {
      await prisma.theme.upsert({
        where: { id: updatedAsset.id },
        update: {
          name: updatedAsset.name,
          settings: updatedAsset.assetConfig,
          isCustom: false,
        },
        create: {
          id: updatedAsset.id,
          tenantId: null,
          name: updatedAsset.name,
          settings: updatedAsset.assetConfig,
          isCustom: false,
        },
      });
    }
  } else {
    // Update MarketplaceAssetVersion to rejected/pending
    await prisma.marketplaceAssetVersion.update({
      where: {
        assetId_version: {
          assetId: submission.assetId,
          version: submission.version,
        },
      },
      data: { status: decision === 'rejected' ? 'rejected' : 'pending' },
    });

    // If rejected, set status back or mark as rejected
    await prisma.marketplaceAsset.update({
      where: { id: submission.assetId },
      data: { status: decision === 'rejected' ? 'rejected' : 'draft' },
    });
  }

  return review;
}

/**
 * List approved marketplace assets with optional filters.
 */
export async function listMarketplaceAssets(filters: {
  type?: string;
  pricingType?: string;
  query?: string;
}): Promise<any[]> {
  const whereClause: any = {
    status: 'approved',
  };

  if (filters.type) {
    whereClause.type = filters.type;
  }

  if (filters.pricingType) {
    whereClause.pricingType = filters.pricingType;
  }

  if (filters.query) {
    whereClause.OR = [
      { name: { contains: filters.query } },
      { description: { contains: filters.query } },
    ];
  }

  return await prisma.marketplaceAsset.findMany({
    where: whereClause,
    include: {
      developer: {
        select: {
          companyName: true,
          website: true,
        },
      },
    },
  });
}

/**
 * Retrieve marketplace asset details along with feedbacks.
 */
export async function getAssetDetails(assetId: string): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
    include: {
      developer: {
        select: {
          companyName: true,
          website: true,
        },
      },
      feedbacks: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
        },
      },
    },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Approved marketplace asset not found');
  }

  // Calculate average rating
  const totalFeedback = asset.feedbacks.length;
  const averageRating = totalFeedback > 0
    ? asset.feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedback
    : 5;

  return {
    ...asset,
    averageRating,
    totalFeedback,
  };
}

/**
 * Purchase and auto-install a marketplace asset.
 */
export async function purchaseMarketplaceAsset(
  tenantId: string,
  assetId: string
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Asset is not available for purchase');
  }

  // Calculate platform & developer share
  const amountPaid = asset.price;
  const developerShare = Math.round(amountPaid * asset.revenueSharePct * 100) / 100;
  const platformShare = Math.round(amountPaid * (1 - asset.revenueSharePct) * 100) / 100;

  // Check if already purchased
  const existingPurchase = await prisma.assetPurchase.findFirst({
    where: { tenantId, assetId, status: 'completed' },
  });

  if (existingPurchase) {
    throw new Error('Asset has already been purchased/installed');
  }

  // Record purchase inside a transaction
  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.assetPurchase.create({
      data: {
        tenantId,
        assetId,
        amountPaid,
        developerShare,
        platformShare,
        status: 'completed',
      },
    });

    // Auto-install logic
    if (asset.type === 'plugin') {
      const config = JSON.parse(asset.assetConfig);
      await tx.tenantPlugin.create({
        data: {
          tenantId,
          pluginId: asset.id, // linked to pluginDefinition ID
          status: 'pending', // installs in pending until permissions are granted
          settings: '{}',
          grantedPermissions: '[]',
        },
      });
    } else if (asset.type === 'theme') {
      // Create theme copy in the tenant workspace
      await tx.theme.create({
        data: {
          tenantId,
          name: asset.name,
          settings: asset.assetConfig, // Custom styles template config
          isCustom: true,
        },
      });
    }

    return purchase;
  });
}

/**
 * Submit a feedback rating.
 */
export async function submitAssetFeedback(
  tenantId: string,
  assetId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<any> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Asset not found or not approved');
  }

  // Check if they purchased the asset (if it is paid) or if they just installed it
  if (asset.pricingType === 'paid') {
    const purchased = await prisma.assetPurchase.findFirst({
      where: { tenantId, assetId, status: 'completed' },
    });
    if (!purchased) {
      throw new Error('Must purchase the asset before leaving feedback');
    }
  }

  return await prisma.assetFeedback.create({
    data: {
      tenantId,
      assetId,
      userId,
      rating,
      comment,
    },
  });
}

/**
 * Provision a sandbox testing tenant.
 */
export async function createSandboxTenant(developerId: string): Promise<any> {
  const developer = await prisma.developerProfile.findUnique({
    where: { id: developerId },
  });

  if (!developer) {
    throw new Error('Developer profile not found');
  }

  const sandboxId = randomUUID().slice(0, 8);
  const subdomain = `sandbox-dev-${sandboxId}`;

  // Expiration: 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return await prisma.$transaction(async (tx) => {
    // 1. Create a brand new tenant
    const tenant = await tx.tenant.create({
      data: {
        name: `Sandbox Dev Workspace - ${developer.companyName || 'Dev'}`,
        subdomain,
        status: 'trialing',
      },
    });

    // 2. Link it in sandbox_tenants
    const sandbox = await tx.sandboxTenant.create({
      data: {
        developerId,
        tenantId: tenant.id,
        expiresAt,
      },
    });

    return { tenant, sandbox };
  });
}

/**
 * Retrieve payouts split report for a developer.
 */
export async function getDeveloperPayouts(developerId: string): Promise<any> {
  const assets = await prisma.marketplaceAsset.findMany({
    where: { developerId },
    select: { id: true },
  });

  const assetIds = assets.map((a) => a.id);

  const purchases = await prisma.assetPurchase.findMany({
    where: {
      assetId: { in: assetIds },
      status: 'completed',
    },
    include: {
      asset: {
        select: {
          name: true,
          type: true,
        },
      },
    },
  });

  const totalSales = Math.round(purchases.reduce((acc, p) => acc + p.amountPaid, 0) * 100) / 100;
  const totalDeveloperShare = Math.round(purchases.reduce((acc, p) => acc + p.developerShare, 0) * 100) / 100;
  const totalPlatformShare = Math.round(purchases.reduce((acc, p) => acc + p.platformShare, 0) * 100) / 100;

  return {
    totalSales,
    totalDeveloperShare,
    totalPlatformShare,
    purchases,
  };
}

/**
 * Log a marketplace action in the audit logs.
 */
export async function logMarketplaceAudit(
  tenantId: string,
  assetId: string,
  action: string,
  version: string,
  userId: string,
  details?: string
): Promise<any> {
  return await prisma.marketplaceAuditLog.create({
    data: {
      tenantId,
      assetId,
      action,
      version,
      userId,
      details,
    },
  });
}

/**
 * Submit or record a security review for an asset version.
 */
export async function recordSecurityReview(
  assetId: string,
  versionId: string,
  status: string, // passed | failed | flagged
  notes?: string,
  reviewerId?: string
): Promise<any> {
  return await prisma.marketplaceSecurityReview.create({
    data: {
      assetId,
      versionId,
      status,
      reviewerId: reviewerId || null,
      notes,
    },
  });
}

/**
 * Install a marketplace asset for a tenant.
 */
export async function installMarketplaceAsset(
  tenantId: string,
  assetId: string,
  versionId: string,
  userId: string
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error('Marketplace asset not found');
  }

  // Check if asset is suspended (in config or status)
  const config = JSON.parse(asset.assetConfig || '{}');
  if (config.suspended === true || asset.status === 'suspended') {
    throw new Error('This asset is currently suspended and cannot be installed');
  }

  if (asset.status !== 'approved') {
    throw new Error('Asset is not approved for installation');
  }

  const version = await prisma.marketplaceAssetVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.assetId !== assetId) {
    throw new Error('Asset version not found');
  }

  // Entitlement check for paid assets
  if (asset.pricingType === 'paid') {
    const purchased = await prisma.assetPurchase.findFirst({
      where: { tenantId, assetId, status: 'completed' },
    });
    if (!purchased) {
      throw new Error('Billing entitlement check failed. This is a paid asset and has not been purchased.');
    }
  }

  // Parse permissions from manifest
  const manifest = JSON.parse(version.manifestJson || '{}');
  const requiredPermissions = manifest.requiredPermissions || [];

  // Determine initial status: plugins with required permissions start as pending_permissions
  const initialStatus = (asset.type === 'plugin' && requiredPermissions.length > 0)
    ? 'pending_permissions'
    : 'active';

  const installation = await prisma.marketplaceInstallation.upsert({
    where: {
      tenantId_assetId: { tenantId, assetId },
    },
    update: {
      versionId,
      status: initialStatus,
      updatedAt: new Date(),
    },
    create: {
      tenantId,
      assetId,
      versionId,
      status: initialStatus,
      settings: JSON.stringify(manifest.defaultSettings || {}),
      grantedPermissions: initialStatus === 'active' ? JSON.stringify(requiredPermissions) : '[]',
    },
  });

  // Activate core tables as helper
  if (initialStatus === 'active') {
    if (asset.type === 'plugin') {
      await prisma.tenantPlugin.upsert({
        where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
        update: { status: 'active', grantedPermissions: JSON.stringify(requiredPermissions) },
        create: { tenantId, pluginId: assetId, status: 'active', settings: '{}', grantedPermissions: JSON.stringify(requiredPermissions) },
      });
    } else if (asset.type === 'theme') {
      await prisma.theme.upsert({
        where: { id: assetId },
        update: { tenantId, name: asset.name, settings: version.manifestJson },
        create: { id: assetId, tenantId, name: asset.name, settings: version.manifestJson, isCustom: false },
      });
    }
  }

  await logMarketplaceAudit(tenantId, assetId, 'install', version.version, userId, `Installed version ${version.version}`);
  return installation;
}

/**
 * Approve plugin permissions and activate the installation.
 */
export async function approvePluginPermissions(
  tenantId: string,
  assetId: string,
  permissions: string[],
  userId: string
): Promise<any> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { tenantId_assetId: { tenantId, assetId } },
    include: { version: true, asset: true },
  });

  if (!installation) {
    throw new Error('Installation not found');
  }

  const manifest = JSON.parse(installation.version.manifestJson || '{}');
  const required = manifest.requiredPermissions || [];

  // Verify all required permissions are approved
  const allApproved = required.every((p: string) => permissions.includes(p));
  if (!allApproved) {
    throw new Error('All required permissions must be approved to activate the plugin');
  }

  const updated = await prisma.marketplaceInstallation.update({
    where: { id: installation.id },
    data: {
      status: 'active',
      grantedPermissions: JSON.stringify(permissions),
    },
  });

  // Upsert to core TenantPlugin
  await prisma.tenantPlugin.upsert({
    where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
    update: { status: 'active', grantedPermissions: JSON.stringify(permissions) },
    create: { tenantId, pluginId: assetId, status: 'active', settings: '{}', grantedPermissions: JSON.stringify(permissions) },
  });

  await logMarketplaceAudit(tenantId, assetId, 'enable', installation.version.version, userId, 'Permissions approved and plugin enabled');
  return updated;
}

/**
 * Update an asset installation to a new version.
 */
export async function updateMarketplaceAsset(
  tenantId: string,
  assetId: string,
  newVersionId: string,
  userId: string
): Promise<any> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { tenantId_assetId: { tenantId, assetId } },
    include: { version: true, asset: true },
  });

  if (!installation) {
    throw new Error('Asset is not installed');
  }

  const newVersion = await prisma.marketplaceAssetVersion.findUnique({
    where: { id: newVersionId },
  });

  if (!newVersion || newVersion.assetId !== assetId) {
    throw new Error('Target version not found');
  }

  // Parse permissions
  const oldManifest = JSON.parse(installation.version.manifestJson || '{}');
  const newManifest = JSON.parse(newVersion.manifestJson || '{}');
  
  const oldPermissions = oldManifest.requiredPermissions || [];
  const newPermissions = newManifest.requiredPermissions || [];

  // If new permissions are introduced, require re-approval
  const hasNewPermissions = newPermissions.some((p: string) => !oldPermissions.includes(p));
  const nextStatus = hasNewPermissions ? 'pending_permissions' : 'active';

  const updated = await prisma.marketplaceInstallation.update({
    where: { id: installation.id },
    data: {
      versionId: newVersionId,
      status: nextStatus,
      grantedPermissions: nextStatus === 'active' ? JSON.stringify(newPermissions) : '[]',
    },
  });

  if (nextStatus === 'active') {
    if (installation.asset.type === 'plugin') {
      await prisma.tenantPlugin.update({
        where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
        data: { grantedPermissions: JSON.stringify(newPermissions) },
      });
    }
  } else {
    // Plugin must go to pending approval
    if (installation.asset.type === 'plugin') {
      await prisma.tenantPlugin.update({
        where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
        data: { status: 'pending' },
      });
    }
  }

  await logMarketplaceAudit(tenantId, assetId, 'update', newVersion.version, userId, `Updated to version ${newVersion.version}`);
  return updated;
}

/**
 * Rollback an asset installation to a specific version.
 */
export async function rollbackMarketplaceAssetVersion(
  tenantId: string,
  assetId: string,
  targetVersionId: string,
  userId: string
): Promise<any> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { tenantId_assetId: { tenantId, assetId } },
    include: { version: true, asset: true },
  });

  if (!installation) {
    throw new Error('Asset is not installed');
  }

  const targetVersion = await prisma.marketplaceAssetVersion.findUnique({
    where: { id: targetVersionId },
  });

  if (!targetVersion || targetVersion.assetId !== assetId) {
    throw new Error('Target version not found');
  }

  // Rollback behaves like an update but logs as rollback
  const manifest = JSON.parse(targetVersion.manifestJson || '{}');
  const requiredPermissions = manifest.requiredPermissions || [];

  const updated = await prisma.marketplaceInstallation.update({
    where: { id: installation.id },
    data: {
      versionId: targetVersionId,
      status: 'active', // Rollbacks to previously approved are auto-approved for simplicity
      grantedPermissions: JSON.stringify(requiredPermissions),
    },
  });

  if (installation.asset.type === 'plugin') {
    await prisma.tenantPlugin.upsert({
      where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
      update: { status: 'active', grantedPermissions: JSON.stringify(requiredPermissions) },
      create: { tenantId, pluginId: assetId, status: 'active', settings: '{}', grantedPermissions: JSON.stringify(requiredPermissions) },
    });
  }

  await logMarketplaceAudit(tenantId, assetId, 'rollback', targetVersion.version, userId, `Rolled back to version ${targetVersion.version}`);
  return updated;
}

/**
 * Disable an installed asset.
 */
export async function disableMarketplaceAsset(
  tenantId: string,
  assetId: string,
  userId: string
): Promise<any> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { tenantId_assetId: { tenantId, assetId } },
    include: { version: true, asset: true },
  });

  if (!installation) {
    throw new Error('Asset is not installed');
  }

  const updated = await prisma.marketplaceInstallation.update({
    where: { id: installation.id },
    data: { status: 'disabled' },
  });

  if (installation.asset.type === 'plugin') {
    await prisma.tenantPlugin.update({
      where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
      data: { status: 'inactive' },
    });
  }

  await logMarketplaceAudit(tenantId, assetId, 'disable', installation.version.version, userId, 'Disabled asset');
  return updated;
}

/**
 * Enable an installed asset.
 */
export async function enableMarketplaceAsset(
  tenantId: string,
  assetId: string,
  userId: string
): Promise<any> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { tenantId_assetId: { tenantId, assetId } },
    include: { version: true, asset: true },
  });

  if (!installation) {
    throw new Error('Asset is not installed');
  }

  const manifest = JSON.parse(installation.version.manifestJson || '{}');
  const requiredPermissions = manifest.requiredPermissions || [];

  const updated = await prisma.marketplaceInstallation.update({
    where: { id: installation.id },
    data: { status: 'active' },
  });

  if (installation.asset.type === 'plugin') {
    await prisma.tenantPlugin.update({
      where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
      data: { status: 'active', grantedPermissions: JSON.stringify(requiredPermissions) },
    });
  }

  await logMarketplaceAudit(tenantId, assetId, 'enable', installation.version.version, userId, 'Enabled asset');
  return updated;
}

/**
 * Uninstall an installed asset.
 */
export async function uninstallMarketplaceAsset(
  tenantId: string,
  assetId: string,
  userId: string
): Promise<any> {
  const installation = await prisma.marketplaceInstallation.findUnique({
    where: { tenantId_assetId: { tenantId, assetId } },
    include: { version: true, asset: true },
  });

  if (!installation) {
    throw new Error('Asset is not installed');
  }

  await prisma.marketplaceInstallation.delete({
    where: { id: installation.id },
  });

  if (installation.asset.type === 'plugin') {
    await prisma.tenantPlugin.deleteMany({
      where: { tenantId, pluginId: assetId },
    });
  }

  await logMarketplaceAudit(tenantId, assetId, 'uninstall', installation.version.version, userId, 'Uninstalled asset');
  return { success: true };
}

/**
 * Suspend an asset (Super Admin action).
 */
export async function suspendMarketplaceAsset(
  assetId: string,
  status: string // suspended | approved
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error('Marketplace asset not found');
  }

  const updated = await prisma.marketplaceAsset.update({
    where: { id: assetId },
    data: { status },
  });

  // If suspended, force disable the plugin/theme across all tenants
  if (status === 'suspended') {
    await prisma.marketplaceInstallation.updateMany({
      where: { assetId },
      data: { status: 'disabled' },
    });

    if (asset.type === 'plugin') {
      await prisma.tenantPlugin.updateMany({
        where: { pluginId: assetId },
        data: { status: 'inactive' },
      });
    }
  }

  return updated;
}

