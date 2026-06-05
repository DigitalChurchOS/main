import prisma from '../lib/prisma';

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

export async function createCategory(
  tenantId: string,
  data: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  // Check if category with this slug already exists for the tenant
  const existing = await prisma.blogCategory.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Blog category with slug '${slug}' already exists`);
  }

  if (data.parentId) {
    const parent = await prisma.blogCategory.findFirst({
      where: { id: data.parentId, tenantId },
    });
    if (!parent) {
      throw new Error(`Parent category not found`);
    }
  }

  return await prisma.blogCategory.create({
    data: {
      tenantId,
      name: data.name,
      slug,
      description: data.description || null,
      parentId: data.parentId || null,
    },
  });
}

export async function listCategories(tenantId: string): Promise<any[]> {
  return await prisma.blogCategory.findMany({
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
 * TAG SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createTag(
  tenantId: string,
  name: string,
  slug?: string
): Promise<any> {
  const finalSlug = slug ? slugify(slug) : slugify(name);

  const existing = await prisma.blogTag.findFirst({
    where: { tenantId, slug: finalSlug },
  });
  if (existing) {
    throw new Error(`Blog tag with slug '${finalSlug}' already exists`);
  }

  return await prisma.blogTag.create({
    data: {
      tenantId,
      name,
      slug: finalSlug,
    },
  });
}

export async function listTags(tenantId: string): Promise<any[]> {
  return await prisma.blogTag.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * BLOG POST SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createPost(
  tenantId: string,
  data: {
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    postType: string; // devotional | news | article | other
    status?: string; // draft | published | archived
    publishedAt?: Date | string;
    coverImageUrl?: string;
    authorId?: string;
    categoryId?: string;
    scriptures?: string[];
    tags?: string[];
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  // Validate slug uniqueness for the tenant
  const existing = await prisma.blogPost.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Blog post with slug '${slug}' already exists`);
  }

  // Validate Category
  if (data.categoryId) {
    const category = await prisma.blogCategory.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) {
      throw new Error(`Category not found`);
    }
  }

  // Validate Author
  if (data.authorId) {
    const speaker = await prisma.speaker.findFirst({
      where: { id: data.authorId, tenantId },
    });
    if (!speaker) {
      throw new Error(`Speaker author not found`);
    }
  }

  const status = data.status || 'draft';
  const publishedAt = status === 'published' ? (data.publishedAt ? new Date(data.publishedAt) : new Date()) : null;

  return await prisma.$transaction(async (tx) => {
    // 1. Create the post
    const post = await tx.blogPost.create({
      data: {
        tenantId,
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        postType: data.postType,
        status,
        publishedAt,
        coverImageUrl: data.coverImageUrl || null,
        authorId: data.authorId || null,
        categoryId: data.categoryId || null,
      },
    });

    // 2. Add scriptures
    if (data.scriptures && data.scriptures.length > 0) {
      await tx.blogPostScripture.createMany({
        data: data.scriptures.map((ref, idx) => ({
          postId: post.id,
          reference: ref,
          order: idx,
        })),
      });
    }

    // 3. Add tags
    if (data.tags && data.tags.length > 0) {
      for (const tagId of data.tags) {
        await tx.blogPostTag.create({
          data: {
            postId: post.id,
            tagId,
          },
        });
      }
    }

    return await tx.blogPost.findUnique({
      where: { id: post.id },
      include: {
        category: true,
        author: true,
        scriptures: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
    });
  });
}

export async function updatePost(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    postType?: string;
    status?: string;
    publishedAt?: Date | string;
    coverImageUrl?: string;
    authorId?: string;
    categoryId?: string;
    scriptures?: string[];
    tags?: string[];
  }
): Promise<any> {
  const post = await prisma.blogPost.findFirst({
    where: { id, tenantId },
  });
  if (!post) {
    throw new Error('Blog post not found');
  }

  let slug = post.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.blogPost.findFirst({
      where: { tenantId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Blog post with slug '${slug}' already exists`);
    }
  } else if (data.title && !data.slug) {
    // If title changes but slug is not explicitly provided, we don't automatically change the slug
    // to prevent breaking existing URLs, unless they request a slug change.
  }

  // Validate Category
  if (data.categoryId) {
    const category = await prisma.blogCategory.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) {
      throw new Error(`Category not found`);
    }
  }

  // Validate Author
  if (data.authorId) {
    const speaker = await prisma.speaker.findFirst({
      where: { id: data.authorId, tenantId },
    });
    if (!speaker) {
      throw new Error(`Speaker author not found`);
    }
  }

  const status = data.status !== undefined ? data.status : post.status;
  let publishedAt = post.publishedAt;
  if (status === 'published' && post.status !== 'published') {
    publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();
  } else if (status !== 'published') {
    publishedAt = null;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update fields
    await tx.blogPost.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : post.title,
        slug,
        content: data.content !== undefined ? data.content : post.content,
        excerpt: data.excerpt !== undefined ? data.excerpt : post.excerpt,
        postType: data.postType !== undefined ? data.postType : post.postType,
        status,
        publishedAt,
        coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : post.coverImageUrl,
        authorId: data.authorId !== undefined ? data.authorId : post.authorId,
        categoryId: data.categoryId !== undefined ? data.categoryId : post.categoryId,
      },
    });

    // 2. Update scriptures (replace all)
    if (data.scriptures !== undefined) {
      await tx.blogPostScripture.deleteMany({
        where: { postId: id },
      });
      if (data.scriptures.length > 0) {
        await tx.blogPostScripture.createMany({
          data: data.scriptures.map((ref, idx) => ({
            postId: id,
            reference: ref,
            order: idx,
          })),
        });
      }
    }

    // 3. Update tags (replace all)
    if (data.tags !== undefined) {
      await tx.blogPostTag.deleteMany({
        where: { postId: id },
      });
      for (const tagId of data.tags) {
        await tx.blogPostTag.create({
          data: {
            postId: id,
            tagId,
          },
        });
      }
    }

    return await tx.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        scriptures: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
    });
  });
}

export async function deletePost(id: string, tenantId: string): Promise<any> {
  const post = await prisma.blogPost.findFirst({
    where: { id, tenantId },
  });
  if (!post) {
    throw new Error('Blog post not found');
  }

  // Soft delete by archiving
  return await prisma.blogPost.update({
    where: { id },
    data: { status: 'archived' },
  });
}

export async function getPost(idOrSlug: string, tenantId: string): Promise<any> {
  const post = await prisma.blogPost.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: true,
      author: true,
      scriptures: { orderBy: { order: 'asc' } },
      tags: { include: { tag: true } },
    },
  });

  if (!post) {
    throw new Error('Blog post not found');
  }

  return post;
}

export async function listPosts(
  tenantId: string,
  filters: {
    postType?: string;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    status?: string; // defaults to published if not specified
    search?: string;
    dateFrom?: string | Date;
    dateTo?: string | Date;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{ posts: any[]; total: number; page: number; limit: number }> {
  const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
  const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    tenantId,
  };

  // Status scoping: default is 'published' to hide drafts from public viewers
  if (filters.status) {
    whereClause.status = filters.status;
  } else {
    whereClause.status = 'published';
  }

  if (filters.postType) {
    whereClause.postType = filters.postType;
  }

  if (filters.categoryId) {
    whereClause.categoryId = filters.categoryId;
  }

  if (filters.authorId) {
    whereClause.authorId = filters.authorId;
  }

  if (filters.tagId) {
    whereClause.tags = {
      some: {
        tagId: filters.tagId,
      },
    };
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search } },
      { content: { contains: filters.search } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.publishedAt = {};
    if (filters.dateFrom) {
      whereClause.publishedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereClause.publishedAt.lte = new Date(filters.dateTo);
    }
  }

  const sortBy = filters.sortBy || 'publishedAt';
  const sortOrder = filters.sortOrder || 'desc';

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: whereClause,
      include: {
        category: true,
        author: true,
        scriptures: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.blogPost.count({ where: whereClause }),
  ]);

  return {
    posts,
    total,
    page,
    limit,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * COMMENT & MODERATION SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function addComment(
  tenantId: string,
  postId: string,
  userId: string | null,
  data: {
    displayName: string;
    email?: string;
    content: string;
  }
): Promise<any> {
  const post = await prisma.blogPost.findFirst({
    where: { id: postId, tenantId },
  });
  if (!post) {
    throw new Error('Blog post not found');
  }

  if (post.status !== 'published') {
    throw new Error('Cannot comment on a post that is not published');
  }

  return await prisma.blogPostComment.create({
    data: {
      tenantId,
      postId,
      userId,
      displayName: data.displayName,
      email: data.email || null,
      content: data.content,
      status: 'pending', // defaults to pending moderation
    },
  });
}

export async function listComments(
  postId: string,
  tenantId: string,
  includePending = false
): Promise<any[]> {
  const whereClause: any = {
    postId,
    tenantId,
  };

  if (!includePending) {
    whereClause.status = 'approved';
  } else {
    // Admins can see pending, approved, spam
  }

  return await prisma.blogPostComment.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export async function moderateComment(
  commentId: string,
  tenantId: string,
  status: 'approved' | 'spam' | 'pending'
): Promise<any> {
  const comment = await prisma.blogPostComment.findFirst({
    where: { id: commentId, tenantId },
  });
  if (!comment) {
    throw new Error('Comment not found');
  }

  return await prisma.blogPostComment.update({
    where: { id: commentId },
    data: { status },
  });
}
