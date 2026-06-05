import prisma from '../lib/prisma';
import { DigitalLibraryResourceCenterService } from './digitalLibraryResourceCenter';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * ─────────────────────────────────────────────────────────────
 * CATEGORY SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createLibraryCategory(
  tenantId: string,
  data: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
  },
  userId?: string
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  // Check unique slug per tenant
  const existing = await prisma.libraryCategory.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Library category with slug '${slug}' already exists`);
  }

  if (data.parentId) {
    const parent = await prisma.libraryCategory.findFirst({
      where: { id: data.parentId, tenantId },
    });
    if (!parent) {
      throw new Error(`Parent category not found`);
    }
  }

  const category = await prisma.libraryCategory.create({
    data: {
      tenantId,
      name: data.name,
      slug,
      description: data.description || null,
      parentId: data.parentId || null,
    },
  });

  await DigitalLibraryResourceCenterService.logActivity(tenantId, userId || 'System', 'create_category', {
    categoryId: category.id,
    name: category.name,
    slug: category.slug,
  }).catch(() => undefined);

  return category;
}

export async function listLibraryCategories(tenantId: string): Promise<any[]> {
  return await prisma.libraryCategory.findMany({
    where: { tenantId },
    include: {
      children: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * RESOURCE SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createResource(
  tenantId: string,
  data: {
    title: string;
    slug?: string;
    description?: string;
    author?: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string; // pdf | epub | docx | pptx | other
    coverImageUrl?: string;
    pricingType?: string; // free | paid
    price?: number;
    visibility?: string; // public | members_only | leaders_only
    status?: string; // draft | published | archived
    categoryId?: string;
  },
  userId?: string
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  const existing = await prisma.libraryResource.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Library resource with slug '${slug}' already exists`);
  }

  if (data.categoryId) {
    const category = await prisma.libraryCategory.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) {
      throw new Error(`Category not found`);
    }
  }

  const pricingType = data.pricingType || 'free';
  const price = pricingType === 'free' ? 0.0 : (data.price || 0.0);
  const status = data.status || 'draft';
  const visibility = data.visibility || 'public';

  const resource = await prisma.libraryResource.create({
    data: {
      tenantId,
      title: data.title,
      slug,
      description: data.description || null,
      author: data.author || null,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize || null,
      fileType: data.fileType || null,
      coverImageUrl: data.coverImageUrl || null,
      pricingType,
      price,
      visibility,
      status,
      categoryId: data.categoryId || null,
    },
    include: {
      category: true,
    },
  });

  await DigitalLibraryResourceCenterService.logActivity(tenantId, userId || 'System', 'create_resource', {
    resourceId: resource.id,
    title: resource.title,
    slug: resource.slug,
  }).catch(() => undefined);

  return resource;
}

export async function updateResource(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    author?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    coverImageUrl?: string;
    pricingType?: string;
    price?: number;
    visibility?: string;
    status?: string;
    categoryId?: string;
  },
  userId?: string
): Promise<any> {
  const resource = await prisma.libraryResource.findFirst({
    where: { id, tenantId },
  });
  if (!resource) {
    throw new Error('Library resource not found');
  }

  let slug = resource.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.libraryResource.findFirst({
      where: { tenantId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Library resource with slug '${slug}' already exists`);
    }
  }

  if (data.categoryId) {
    const category = await prisma.libraryCategory.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) {
      throw new Error(`Category not found`);
    }
  }

  const pricingType = data.pricingType !== undefined ? data.pricingType : resource.pricingType;
  const price = pricingType === 'free' ? 0.0 : (data.price !== undefined ? data.price : resource.price);

  const updated = await prisma.libraryResource.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : resource.title,
      slug,
      description: data.description !== undefined ? data.description : resource.description,
      author: data.author !== undefined ? data.author : resource.author,
      fileUrl: data.fileUrl !== undefined ? data.fileUrl : resource.fileUrl,
      fileSize: data.fileSize !== undefined ? data.fileSize : resource.fileSize,
      fileType: data.fileType !== undefined ? data.fileType : resource.fileType,
      coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : resource.coverImageUrl,
      pricingType,
      price,
      visibility: data.visibility !== undefined ? data.visibility : resource.visibility,
      status: data.status !== undefined ? data.status : resource.status,
      categoryId: data.categoryId !== undefined ? data.categoryId : resource.categoryId,
    },
    include: {
      category: true,
    },
  });

  await DigitalLibraryResourceCenterService.logActivity(tenantId, userId || 'System', 'update_resource', {
    resourceId: id,
    title: updated.title,
    fieldsUpdated: Object.keys(data),
  }).catch(() => undefined);

  return updated;
}

export async function deleteResource(id: string, tenantId: string, userId?: string): Promise<any> {
  const resource = await prisma.libraryResource.findFirst({
    where: { id, tenantId },
  });
  if (!resource) {
    throw new Error('Library resource not found');
  }

  // Soft delete by archiving
  const updated = await prisma.libraryResource.update({
    where: { id },
    data: { status: 'archived' },
  });

  await DigitalLibraryResourceCenterService.logActivity(tenantId, userId || 'System', 'delete_resource', {
    resourceId: id,
    title: updated.title,
  }).catch(() => undefined);

  return updated;
}

export async function getResource(idOrSlug: string, tenantId: string): Promise<any> {
  const resource = await prisma.libraryResource.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: true,
    },
  });

  if (!resource) {
    throw new Error('Library resource not found');
  }

  return resource;
}

export async function listResources(
  tenantId: string,
  filters: {
    categoryId?: string;
    pricingType?: string;
    visibility?: string;
    status?: string; // default is published
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{ resources: any[]; total: number; page: number; limit: number }> {
  const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
  const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    tenantId,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  } else {
    whereClause.status = 'published';
  }

  if (filters.categoryId) {
    whereClause.categoryId = filters.categoryId;
  }

  if (filters.pricingType) {
    whereClause.pricingType = filters.pricingType;
  }

  if (filters.visibility) {
    whereClause.visibility = filters.visibility;
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
      { author: { contains: filters.search } },
    ];
  }

  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  const [resources, total] = await Promise.all([
    prisma.libraryResource.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.libraryResource.count({ where: whereClause }),
  ]);

  return {
    resources,
    total,
    page,
    limit,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * DOWNLOAD STATS & PURCHASES
 * ─────────────────────────────────────────────────────────────
 */

export async function incrementDownloadCount(resourceId: string, tenantId: string, userId?: string): Promise<any> {
  const resource = await prisma.libraryResource.findFirst({
    where: { id: resourceId, tenantId },
  });
  if (!resource) {
    throw new Error('Library resource not found');
  }

  const updated = await prisma.libraryResource.update({
    where: { id: resourceId },
    data: {
      downloadCount: {
        increment: 1,
      },
    },
  });

  await DigitalLibraryResourceCenterService.logActivity(tenantId, userId || 'System', 'download_resource', {
    resourceId,
    title: updated.title,
  }).catch(() => undefined);

  return updated;
}

export async function purchaseResource(
  tenantId: string,
  resourceId: string,
  userId: string
): Promise<any> {
  const resource = await prisma.libraryResource.findFirst({
    where: { id: resourceId, tenantId },
  });
  if (!resource) {
    throw new Error('Library resource not found');
  }

  if (resource.status !== 'published') {
    throw new Error('Resource is not available for purchase');
  }

  // Check if already purchased
  const existing = await prisma.libraryPurchase.findFirst({
    where: { tenantId, resourceId, userId },
  });
  if (existing) {
    return existing; // already purchased
  }

  const purchase = await prisma.libraryPurchase.create({
    data: {
      tenantId,
      resourceId,
      userId,
      amountPaid: resource.price,
    },
  });

  await DigitalLibraryResourceCenterService.logActivity(tenantId, userId, 'purchase_resource', {
    resourceId,
    title: resource.title,
    amountPaid: resource.price,
    purchaseId: purchase.id,
  }).catch(() => undefined);

  return purchase;
}

/**
 * Access Verification Helper
 */
export async function hasAccess(
  tenantId: string,
  resourceId: string,
  userId: string | null,
  userPermissions: string[] = []
): Promise<boolean> {
  const resource = await prisma.libraryResource.findFirst({
    where: { id: resourceId, tenantId },
  });
  if (!resource) {
    return false;
  }

  // Admins always bypass access restrictions (unless it's archived/draft and they don't have settings,
  // but they have settings permission to write/manage).
  const isAdmin = userPermissions.includes('tenant.settings');
  if (isAdmin) {
    return true;
  }

  // If draft or archived, only admins can view it
  if (resource.status !== 'published') {
    return false;
  }

  // 1. Role-based Visibility Checks
  if (resource.visibility === 'members_only') {
    if (!userId) {
      return false; // must be authenticated user/member
    }
    const isMember = userPermissions.includes('member.read') || isAdmin;
    if (!isMember) {
      return false;
    }
  } else if (resource.visibility === 'leaders_only') {
    // Requires leader permission or admin
    const isLeader = userPermissions.includes('member.create') || userPermissions.includes('tenant.settings');
    if (!isLeader) {
      return false;
    }
  }

  // 2. Paid Resource Checks
  if (resource.pricingType === 'paid') {
    if (!userId) {
      return false; // must login and purchase
    }
    const purchase = await prisma.libraryPurchase.findFirst({
      where: { tenantId, resourceId, userId },
    });
    if (!purchase) {
      return false; // must purchase
    }
  }

  return true;
}
