import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// 1. COMMUNITY POSTS (DISCUSSION FEED)
// ─────────────────────────────────────────────────────────────

export async function createCommunityPost(
  tenantId: string,
  memberId: string,
  data: {
    title?: string;
    content: string;
    postType?: string;
    visibility?: string;
    groupId?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.communityPost.create({
    data: {
      tenantId,
      memberId: member.id,
      title: data.title || null,
      content: data.content,
      postType: data.postType || 'discussion',
      visibility: data.visibility || 'public',
      groupId: data.groupId || null,
    },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });
}

export async function listCommunityPosts(
  tenantId: string,
  options: {
    memberId?: string;
    postType?: string;
    visibility?: string;
    groupId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ data: any[]; count: number }> {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    tenantId,
  };

  if (options.memberId) {
    whereClause.memberId = options.memberId;
  }
  if (options.postType) {
    whereClause.postType = options.postType;
  }
  if (options.visibility) {
    whereClause.visibility = options.visibility;
  }
  if (options.groupId) {
    whereClause.groupId = options.groupId;
  }

  if (options.search) {
    const searchClean = options.search.toLowerCase().trim();
    whereClause.OR = [
      { title: { contains: searchClean } },
      { content: { contains: searchClean } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.communityPost.findMany({
      where: whereClause,
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.communityPost.count({ where: whereClause }),
  ]);

  return { data, count };
}

export async function deleteCommunityPost(tenantId: string, postId: string): Promise<void> {
  const existing = await prisma.communityPost.findFirst({
    where: { id: postId, tenantId },
  });
  if (!existing) {
    throw new Error('Community post not found');
  }

  await prisma.communityPost.delete({
    where: { id: existing.id },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. PRAYER REQUESTS
// ─────────────────────────────────────────────────────────────

export async function createPrayerRequest(
  tenantId: string,
  memberId: string,
  data: {
    title: string;
    content: string;
    isAnonymous?: boolean;
    visibility?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.prayerRequest.create({
    data: {
      tenantId,
      memberId: member.id,
      title: data.title,
      content: data.content,
      isAnonymous: data.isAnonymous ?? false,
      visibility: data.visibility || 'public',
      status: 'approved', // Default auto-approved, can be modified via moderation
    },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });
}

export async function listPrayerRequests(
  tenantId: string,
  options: {
    status?: string;
    visibility?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ data: any[]; count: number }> {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    tenantId,
  };

  if (options.status) {
    whereClause.status = options.status;
  }
  if (options.visibility) {
    whereClause.visibility = options.visibility;
  }

  if (options.search) {
    const searchClean = options.search.toLowerCase().trim();
    whereClause.OR = [
      { title: { contains: searchClean } },
      { content: { contains: searchClean } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.prayerRequest.findMany({
      where: whereClause,
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.prayerRequest.count({ where: whereClause }),
  ]);

  // Map anonymous requests
  const processedData = data.map((pr) => {
    if (pr.isAnonymous) {
      return {
        ...pr,
        member: {
          id: 'anonymous',
          firstName: 'Anonymous',
          lastName: 'Believer',
          photoUrl: null,
        },
      };
    }
    return pr;
  });

  return { data: processedData, count };
}

export async function incrementPrayedCount(tenantId: string, prayerRequestId: string): Promise<any> {
  const request = await prisma.prayerRequest.findFirst({
    where: { id: prayerRequestId, tenantId },
  });
  if (!request) {
    throw new Error('Prayer request not found');
  }

  return await prisma.prayerRequest.update({
    where: { id: request.id },
    data: {
      prayedCount: { increment: 1 },
    },
  });
}

export async function moderatePrayerRequest(
  tenantId: string,
  prayerRequestId: string,
  status: string
): Promise<any> {
  const request = await prisma.prayerRequest.findFirst({
    where: { id: prayerRequestId, tenantId },
  });
  if (!request) {
    throw new Error('Prayer request not found');
  }

  return await prisma.prayerRequest.update({
    where: { id: request.id },
    data: { status },
  });
}

export async function deletePrayerRequest(tenantId: string, prayerRequestId: string): Promise<void> {
  const existing = await prisma.prayerRequest.findFirst({
    where: { id: prayerRequestId, tenantId },
  });
  if (!existing) {
    throw new Error('Prayer request not found');
  }

  await prisma.prayerRequest.delete({
    where: { id: existing.id },
  });
}

// ─────────────────────────────────────────────────────────────
// 3. TESTIMONIES
// ─────────────────────────────────────────────────────────────

export async function createTestimony(
  tenantId: string,
  memberId: string,
  data: {
    title: string;
    content: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.testimony.create({
    data: {
      tenantId,
      memberId: member.id,
      title: data.title,
      content: data.content,
      status: 'pending', // testimony submissions must go through pastoral review
    },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });
}

export async function listTestimonies(
  tenantId: string,
  options: {
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ data: any[]; count: number }> {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    tenantId,
  };

  if (options.status) {
    whereClause.status = options.status;
  }

  const [data, count] = await prisma.$transaction([
    prisma.testimony.findMany({
      where: whereClause,
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.testimony.count({ where: whereClause }),
  ]);

  return { data, count };
}

export async function moderateTestimony(tenantId: string, testimonyId: string, status: string): Promise<any> {
  const testimony = await prisma.testimony.findFirst({
    where: { id: testimonyId, tenantId },
  });
  if (!testimony) {
    throw new Error('Testimony not found');
  }

  return await prisma.testimony.update({
    where: { id: testimony.id },
    data: { status },
  });
}

export async function deleteTestimony(tenantId: string, testimonyId: string): Promise<void> {
  const existing = await prisma.testimony.findFirst({
    where: { id: testimonyId, tenantId },
  });
  if (!existing) {
    throw new Error('Testimony not found');
  }

  await prisma.testimony.delete({
    where: { id: existing.id },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. COMMENTS & MODERATION
// ─────────────────────────────────────────────────────────────

export async function createCommunityComment(
  tenantId: string,
  memberId: string,
  data: {
    content: string;
    postId?: string;
    prayerRequestId?: string;
    testimonyId?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  if (!data.postId && !data.prayerRequestId && !data.testimonyId) {
    throw new Error('Must target either a postId, prayerRequestId, or testimonyId');
  }

  return await prisma.communityComment.create({
    data: {
      tenantId,
      memberId: member.id,
      content: data.content,
      postId: data.postId || null,
      prayerRequestId: data.prayerRequestId || null,
      testimonyId: data.testimonyId || null,
      status: 'approved', // Auto-approved by default
    },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });
}

export async function listComments(
  tenantId: string,
  options: {
    postId?: string;
    prayerRequestId?: string;
    testimonyId?: string;
    status?: string;
  }
): Promise<any[]> {
  const whereClause: any = {
    tenantId,
  };

  if (options.postId) {
    whereClause.postId = options.postId;
  }
  if (options.prayerRequestId) {
    whereClause.prayerRequestId = options.prayerRequestId;
  }
  if (options.testimonyId) {
    whereClause.testimonyId = options.testimonyId;
  }
  if (options.status) {
    whereClause.status = options.status;
  }

  return await prisma.communityComment.findMany({
    where: whereClause,
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function moderateComment(tenantId: string, commentId: string, status: string): Promise<any> {
  const comment = await prisma.communityComment.findFirst({
    where: { id: commentId, tenantId },
  });
  if (!comment) {
    throw new Error('Comment not found');
  }

  return await prisma.communityComment.update({
    where: { id: comment.id },
    data: { status },
  });
}

export async function deleteComment(tenantId: string, commentId: string): Promise<void> {
  const existing = await prisma.communityComment.findFirst({
    where: { id: commentId, tenantId },
  });
  if (!existing) {
    throw new Error('Comment not found');
  }

  await prisma.communityComment.delete({
    where: { id: existing.id },
  });
}

// ─────────────────────────────────────────────────────────────
// 5. REACTIONS
// ─────────────────────────────────────────────────────────────

export async function toggleCommunityReaction(
  tenantId: string,
  memberId: string,
  data: {
    reactionType: string;
    postId?: string;
    prayerRequestId?: string;
    testimonyId?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  if (!data.postId && !data.prayerRequestId && !data.testimonyId) {
    throw new Error('Must target either a postId, prayerRequestId, or testimonyId');
  }

  const queryClause: any = {
    memberId: member.id,
    reactionType: data.reactionType.toLowerCase().trim(),
    postId: data.postId || null,
    prayerRequestId: data.prayerRequestId || null,
    testimonyId: data.testimonyId || null,
  };

  const existing = await prisma.communityReaction.findFirst({
    where: queryClause,
  });

  if (existing) {
    await prisma.communityReaction.delete({
      where: { id: existing.id },
    });
    return { success: true, action: 'removed' };
  } else {
    const reaction = await prisma.communityReaction.create({
      data: {
        tenantId,
        memberId: member.id,
        reactionType: data.reactionType.toLowerCase().trim(),
        postId: data.postId || null,
        prayerRequestId: data.prayerRequestId || null,
        testimonyId: data.testimonyId || null,
      },
    });
    return { success: true, action: 'added', data: reaction };
  }
}

export async function getReactionSummaries(
  tenantId: string,
  target: {
    postId?: string;
    prayerRequestId?: string;
    testimonyId?: string;
  }
): Promise<any[]> {
  const whereClause: any = {
    tenantId,
  };

  if (target.postId) {
    whereClause.postId = target.postId;
  }
  if (target.prayerRequestId) {
    whereClause.prayerRequestId = target.prayerRequestId;
  }
  if (target.testimonyId) {
    whereClause.testimonyId = target.testimonyId;
  }

  const reactions = await prisma.communityReaction.findMany({
    where: whereClause,
  });

  // Aggregate reactions by reactionType in JS
  const countsMap: { [key: string]: number } = {};
  reactions.forEach((r) => {
    countsMap[r.reactionType] = (countsMap[r.reactionType] || 0) + 1;
  });

  return Object.keys(countsMap).map((type) => ({
    reactionType: type,
    count: countsMap[type],
  }));
}

// ─────────────────────────────────────────────────────────────
// 6. MEMBER ENGAGEMENT METRICS
// ─────────────────────────────────────────────────────────────

export async function getMemberCommunityMetrics(
  tenantId: string,
  memberId: string
): Promise<{
  postsCount: number;
  prayersCount: number;
  testimoniesCount: number;
  commentsCount: number;
  reactionsCount: number;
  engagementScore: number;
}> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const [postsCount, prayersCount, testimoniesCount, commentsCount, reactionsCount] = await Promise.all([
    prisma.communityPost.count({ where: { tenantId, memberId: member.id } }),
    prisma.prayerRequest.count({ where: { tenantId, memberId: member.id } }),
    prisma.testimony.count({ where: { tenantId, memberId: member.id } }),
    prisma.communityComment.count({ where: { tenantId, memberId: member.id } }),
    prisma.communityReaction.count({ where: { tenantId, memberId: member.id } }),
  ]);

  // Compute standard engagement scoring indicator
  // Posts = 5 points, Prayers = 3 points, Testimonies = 10 points, Comments = 2 points, Reactions = 1 point
  const engagementScore =
    postsCount * 5 + prayersCount * 3 + testimoniesCount * 10 + commentsCount * 2 + reactionsCount * 1;

  return {
    postsCount,
    prayersCount,
    testimoniesCount,
    commentsCount,
    reactionsCount,
    engagementScore,
  };
}
