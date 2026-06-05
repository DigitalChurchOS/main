import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// 1. CORPORATE PRAYER SESSIONS
// ─────────────────────────────────────────────────────────────

export async function createPrayerSession(
  tenantId: string,
  leaderId: string | null,
  data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    recurrence?: string;
    musicUrl?: string;
    musicVolume?: number;
  }
): Promise<any> {
  if (leaderId) {
    const leader = await prisma.member.findFirst({
      where: { id: leaderId, tenantId },
    });
    if (!leader) {
      throw new Error('Leader member profile not found');
    }
  }

  return await prisma.prayerSession.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description || null,
      leaderId: leaderId || null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      recurrence: data.recurrence || 'none',
      musicUrl: data.musicUrl || null,
      musicVolume: data.musicVolume !== undefined ? data.musicVolume : 50,
      status: 'scheduled',
    },
    include: {
      leader: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function startPrayerSession(tenantId: string, sessionId: string): Promise<any> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  return await prisma.prayerSession.update({
    where: { id: session.id },
    data: { status: 'active' },
  });
}

export async function joinPrayerSession(
  tenantId: string,
  sessionId: string,
  memberId: string,
  data: {
    isPublic?: boolean;
    audioEnabled?: boolean;
  }
): Promise<any> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.prayerSessionParticipation.upsert({
    where: {
      sessionId_memberId: { sessionId, memberId },
    },
    update: {
      isPublic: data.isPublic ?? true,
      audioEnabled: data.audioEnabled ?? false,
      leftAt: null,
    },
    create: {
      sessionId,
      memberId,
      isPublic: data.isPublic ?? true,
      audioEnabled: data.audioEnabled ?? false,
      hasConfirmed: false,
      isMuted: false,
      isTempLeader: false,
    },
  });
}

export async function leavePrayerSession(tenantId: string, sessionId: string, memberId: string): Promise<any> {
  const participation = await prisma.prayerSessionParticipation.findFirst({
    where: {
      sessionId,
      memberId,
      session: { tenantId },
    },
  });
  if (!participation) {
    throw new Error('Participation not found');
  }

  return await prisma.prayerSessionParticipation.update({
    where: { id: participation.id },
    data: { leftAt: new Date() },
  });
}

export async function confirmPrayed(tenantId: string, sessionId: string, memberId: string): Promise<any> {
  const participation = await prisma.prayerSessionParticipation.findFirst({
    where: {
      sessionId,
      memberId,
      session: { tenantId },
    },
  });
  if (!participation) {
    throw new Error('Participation not found');
  }

  return await prisma.prayerSessionParticipation.update({
    where: { id: participation.id },
    data: { hasConfirmed: true },
  });
}

export async function toggleParticipantAudio(
  tenantId: string,
  sessionId: string,
  memberId: string,
  audioEnabled: boolean
): Promise<any> {
  const participation = await prisma.prayerSessionParticipation.findFirst({
    where: {
      sessionId,
      memberId,
      session: { tenantId },
    },
  });
  if (!participation) {
    throw new Error('Participation not found');
  }

  if (participation.isMuted && audioEnabled) {
    throw new Error('Cannot enable audio because the leader has muted you');
  }

  return await prisma.prayerSessionParticipation.update({
    where: { id: participation.id },
    data: { audioEnabled },
  });
}

async function verifyLeadership(tenantId: string, sessionId: string, memberId: string): Promise<boolean> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  if (session.leaderId === memberId) {
    return true;
  }

  // Check if user is a delegated temp leader
  const part = await prisma.prayerSessionParticipation.findFirst({
    where: { sessionId, memberId, isTempLeader: true },
  });
  if (part) {
    return true;
  }

  return false;
}

export async function updateSessionSettings(
  tenantId: string,
  sessionId: string,
  leaderId: string,
  settings: {
    musicPaused?: boolean;
    scrollingPaused?: boolean;
    volume?: number;
    currentPrayerPointId?: string;
    status?: string;
  }
): Promise<any> {
  const isLeader = await verifyLeadership(tenantId, sessionId, leaderId);
  if (!isLeader) {
    throw new Error('Unauthorized: Only the session leader or temporary leader can control settings');
  }

  const updateData: any = {};
  if (settings.musicPaused !== undefined) {
    updateData.isMusicPaused = settings.musicPaused;
  }
  if (settings.scrollingPaused !== undefined) {
    updateData.isScrollingPaused = settings.scrollingPaused;
  }
  if (settings.volume !== undefined) {
    updateData.musicVolume = settings.volume;
  }
  if (settings.currentPrayerPointId !== undefined) {
    updateData.currentPrayerPointId = settings.currentPrayerPointId;
  }
  if (settings.status !== undefined) {
    updateData.status = settings.status;
  }

  return await prisma.prayerSession.update({
    where: { id: sessionId },
    data: updateData,
  });
}

export async function delegateTemporaryLeader(
  tenantId: string,
  sessionId: string,
  leaderId: string,
  memberId: string
): Promise<any> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  if (session.leaderId !== leaderId) {
    throw new Error('Unauthorized: Only the main session leader can delegate leadership');
  }

  const targetPart = await prisma.prayerSessionParticipation.findFirst({
    where: { sessionId, memberId },
  });
  if (!targetPart) {
    throw new Error('Target member is not participating in the session');
  }

  return await prisma.prayerSessionParticipation.update({
    where: { id: targetPart.id },
    data: { isTempLeader: true },
  });
}

export async function revokeTemporaryLeader(
  tenantId: string,
  sessionId: string,
  leaderId: string,
  memberId: string
): Promise<any> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  if (session.leaderId !== leaderId) {
    throw new Error('Unauthorized: Only the main session leader can revoke leadership');
  }

  const targetPart = await prisma.prayerSessionParticipation.findFirst({
    where: { sessionId, memberId },
  });
  if (!targetPart) {
    throw new Error('Target member is not participating in the session');
  }

  return await prisma.prayerSessionParticipation.update({
    where: { id: targetPart.id },
    data: { isTempLeader: false },
  });
}

export async function muteAllParticipants(tenantId: string, sessionId: string, leaderId: string): Promise<any> {
  const isLeader = await verifyLeadership(tenantId, sessionId, leaderId);
  if (!isLeader) {
    throw new Error('Unauthorized: Only the leader can mute all participants');
  }

  await prisma.prayerSessionParticipation.updateMany({
    where: { sessionId, leftAt: null },
    data: { isMuted: true, audioEnabled: false },
  });

  return { success: true };
}

export async function moderateParticipant(
  tenantId: string,
  sessionId: string,
  leaderId: string,
  targetMemberId: string,
  action: 'mute' | 'unmute' | 'remove'
): Promise<any> {
  const isLeader = await verifyLeadership(tenantId, sessionId, leaderId);
  if (!isLeader) {
    throw new Error('Unauthorized: Only the leader can moderate participants');
  }

  const targetPart = await prisma.prayerSessionParticipation.findFirst({
    where: { sessionId, memberId: targetMemberId },
  });
  if (!targetPart) {
    throw new Error('Target participant not found in this session');
  }

  if (action === 'mute') {
    return await prisma.prayerSessionParticipation.update({
      where: { id: targetPart.id },
      data: { isMuted: true, audioEnabled: false },
    });
  } else if (action === 'unmute') {
    return await prisma.prayerSessionParticipation.update({
      where: { id: targetPart.id },
      data: { isMuted: false },
    });
  } else if (action === 'remove') {
    return await prisma.prayerSessionParticipation.update({
      where: { id: targetPart.id },
      data: { leftAt: new Date() },
    });
  }

  throw new Error('Invalid moderation action');
}

export async function sendReaction(
  tenantId: string,
  sessionId: string,
  memberId: string,
  reactionType: string
): Promise<any> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.prayerSessionReaction.create({
    data: {
      sessionId,
      memberId,
      reactionType: reactionType.toLowerCase().trim(),
    },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function getSessionMetrics(
  tenantId: string,
  sessionId: string
): Promise<{
  liveCount: number;
  confirmedCount: number;
  publicParticipants: any[];
  reactionsSummary: any[];
}> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  const activeParticipations = await prisma.prayerSessionParticipation.findMany({
    where: { sessionId, leftAt: null },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
  });

  const confirmedCount = await prisma.prayerSessionParticipation.count({
    where: { sessionId, hasConfirmed: true },
  });

  // Calculate live reactions summary
  const reactions = await prisma.prayerSessionReaction.findMany({
    where: { sessionId },
  });

  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
  });

  const reactionsSummary = Object.entries(reactionCounts).map(([type, count]) => ({
    reactionType: type,
    count,
  }));

  const publicParticipants = activeParticipations
    .filter((p) => p.isPublic)
    .map((p) => ({
      memberId: p.memberId,
      firstName: p.member.firstName,
      lastName: p.member.lastName,
      photoUrl: p.member.photoUrl,
      audioEnabled: p.audioEnabled,
      isMuted: p.isMuted,
      isTempLeader: p.isTempLeader,
    }));

  return {
    liveCount: activeParticipations.length,
    confirmedCount,
    publicParticipants,
    reactionsSummary,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. PRAYER POINTS
// ─────────────────────────────────────────────────────────────

export async function createPrayerPoint(
  tenantId: string,
  sessionId: string,
  data: {
    title: string;
    content?: string;
    category?: string;
    duration?: number;
    scriptureRef?: string;
    sequenceOrder?: number;
  }
): Promise<any> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  return await prisma.prayerPoint.create({
    data: {
      sessionId,
      title: data.title,
      content: data.content || null,
      category: data.category || 'general',
      duration: data.duration || null,
      scriptureRef: data.scriptureRef || null,
      sequenceOrder: data.sequenceOrder || 0,
    },
  });
}

export async function getPrayerPoints(tenantId: string, sessionId: string): Promise<any[]> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  return await prisma.prayerPoint.findMany({
    where: { sessionId },
    orderBy: { sequenceOrder: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 3. PRAYER REQUESTS ASSIGNMENT & CARE CRM
// ─────────────────────────────────────────────────────────────

export async function assignPrayerRequest(
  tenantId: string,
  requestId: string,
  memberId: string,
  followUpReminderAt?: Date
): Promise<any> {
  const request = await prisma.prayerRequest.findFirst({
    where: { id: requestId, tenantId },
  });
  if (!request) {
    throw new Error('Prayer request not found');
  }

  const assignee = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!assignee) {
    throw new Error('Care agent/assignee member profile not found');
  }

  return await prisma.prayerRequest.update({
    where: { id: request.id },
    data: {
      assignedToId: memberId,
      status: 'assigned',
      followUpReminderAt: followUpReminderAt ? new Date(followUpReminderAt) : null,
    },
    include: {
      assignedTo: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function updateRequestStatus(tenantId: string, requestId: string, status: string): Promise<any> {
  const request = await prisma.prayerRequest.findFirst({
    where: { id: requestId, tenantId },
  });
  if (!request) {
    throw new Error('Prayer request not found');
  }

  return await prisma.prayerRequest.update({
    where: { id: request.id },
    data: { status },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. TESTIMONY MODERATION & FEATURED WALL
// ─────────────────────────────────────────────────────────────

export async function moderateTestimony(
  tenantId: string,
  testimonyId: string,
  status: string,
  isFeatured?: boolean
): Promise<any> {
  const testimony = await prisma.testimony.findFirst({
    where: { id: testimonyId, tenantId },
  });
  if (!testimony) {
    throw new Error('Testimony not found');
  }

  const updateData: any = { status };
  if (isFeatured !== undefined) {
    updateData.isFeatured = isFeatured;
  }

  return await prisma.testimony.update({
    where: { id: testimony.id },
    data: updateData,
  });
}

// ─────────────────────────────────────────────────────────────
// 5. PRAYER MEDIA & RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────

export async function createPrayerMedia(
  tenantId: string,
  data: {
    title: string;
    description?: string;
    mediaUrl?: string;
    mediaType?: string;
    category?: string;
    recommendedFor?: string;
  }
): Promise<any> {
  return await prisma.prayerMedia.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description || null,
      mediaUrl: data.mediaUrl || null,
      mediaType: data.mediaType || 'video',
      category: data.category || 'basics',
      recommendedFor: data.recommendedFor || null,
    },
  });
}

export async function getRecommendedMedia(tenantId: string, sessionId: string): Promise<any[]> {
  const session = await prisma.prayerSession.findFirst({
    where: { id: sessionId, tenantId },
    include: { prayerPoints: true },
  });
  if (!session) {
    throw new Error('Prayer session not found');
  }

  // Look for media tags matching points categories or title keywords
  const keywords: string[] = [];
  if (session.title) {
    keywords.push(...session.title.toLowerCase().split(/\s+/));
  }
  session.prayerPoints.forEach((p) => {
    if (p.category) {
      keywords.push(p.category.toLowerCase());
    }
  });

  // Query all media for this tenant
  const allMedia = await prisma.prayerMedia.findMany({
    where: { tenantId },
  });

  // Score each media asset
  const scoredMedia = allMedia.map((media) => {
    let score = 0;
    const recKeyword = media.recommendedFor?.toLowerCase() || '';
    const descKeyword = media.description?.toLowerCase() || '';
    const titleKeyword = media.title?.toLowerCase() || '';

    keywords.forEach((kw) => {
      if (kw.length > 2) {
        if (recKeyword.includes(kw)) score += 5;
        if (titleKeyword.includes(kw)) score += 3;
        if (descKeyword.includes(kw)) score += 1;
      }
    });

    return { media, score };
  });

  // Sort by score desc, then return the top 5
  return scoredMedia
    .sort((a, b) => b.score - a.score)
    .map((item) => item.media)
    .slice(0, 5);
}
