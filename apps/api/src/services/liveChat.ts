import prisma from '../lib/prisma';

/**
 * Live Chat, Pastoral Care & Support Service (Enhanced)
 * ----------------------------------------------------
 * Manages chat conversations, messages, care requests,
 * saved replies, agent assignment, and follow-up tasks.
 */

// Typing states in-memory storage (cleared if older than 10 seconds)
const typingIndicators = new Map<string, { userId: string; userName: string; timestamp: number }[]>();

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

export function maskAnonymousConversation(conv: any, isAdmin: boolean) {
  if (conv && conv.isAnonymous && !isAdmin) {
    return {
      ...conv,
      visitorName: 'Anonymous Member',
      visitorEmail: null,
      memberId: null,
      member: null,
    };
  }
  return conv;
}

// ═══════════════════════════════════════════════════════════════
//  CHAT CONVERSATIONS  (Chat Conversation API)
// ═══════════════════════════════════════════════════════════════

export async function createConversation(
  tenantId: string,
  data: {
    visitorName?: string;
    visitorEmail?: string;
    memberId?: string;
    channel?: string;
    subject?: string;
    priority?: string;
    tags?: string;
    isAnonymous?: boolean;
    departmentId?: string;
  }
) {
  return prisma.chatConversation.create({
    data: {
      tenantId,
      visitorName: data.visitorName || null,
      visitorEmail: data.visitorEmail || null,
      memberId: data.memberId || null,
      channel: data.channel || 'website',
      subject: data.subject || null,
      priority: data.priority || 'normal',
      tags: data.tags || null,
      isAnonymous: data.isAnonymous || false,
      departmentId: data.departmentId || null,
    },
    include: { messages: true },
  });
}

export async function listConversations(
  tenantId: string,
  filters: {
    status?: string;
    channel?: string;
    assignedAgentId?: string;
    priority?: string;
    page?: number;
    limit?: number;
  },
  isAdmin: boolean = false
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.channel) where.channel = filters.channel;
  if (filters.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;
  if (filters.priority) where.priority = filters.priority;

  const [rawItems, total] = await Promise.all([
    prisma.chatConversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.chatConversation.count({ where }),
  ]);

  const data = rawItems.map((item) => maskAnonymousConversation(item, isAdmin));
  return { data, total, page, limit };
}

export async function getConversation(tenantId: string, conversationId: string, isAdmin: boolean = false) {
  const conv = await prisma.chatConversation.findFirst({
    where: { id: conversationId, tenantId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, where: { isInternal: false } },
      member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      careRequests: true,
      chatFollowUpTasks: true,
    },
  });
  if (!conv) return null;
  return maskAnonymousConversation(conv, isAdmin);
}

export async function updateConversation(
  tenantId: string,
  conversationId: string,
  data: Partial<{
    status: string;
    priority: string;
    tags: string;
    internalNotes: string;
    subject: string;
    departmentId: string;
  }>
) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  if (data.status) {
    const validStatuses = ['open', 'waiting', 'assigned', 'resolved', 'closed', 'escalated'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid conversation status: ${data.status}`);
    }
  }

  const updateData: any = { ...data };
  if (data.status === 'resolved' || data.status === 'closed') {
    updateData.resolvedAt = new Date();
  }

  return prisma.chatConversation.update({
    where: { id: conversationId },
    data: updateData,
  });
}

// ═══════════════════════════════════════════════════════════════
//  AGENT ASSIGNMENT  (Agent Assignment API)
// ═══════════════════════════════════════════════════════════════

export async function assignAgent(tenantId: string, conversationId: string, agentId: string) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  return prisma.$transaction(async (tx) => {
    // Update conversation
    const updated = await tx.chatConversation.update({
      where: { id: conversationId },
      data: { assignedAgentId: agentId, status: 'assigned' },
    });

    // Add system message
    await tx.chatMessage.create({
      data: {
        conversationId,
        senderType: 'system',
        senderName: 'System',
        body: `Conversation assigned to agent.`,
        messageType: 'system_event',
      },
    });

    return updated;
  });
}

export async function unassignAgent(tenantId: string, conversationId: string) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  return prisma.chatConversation.update({
    where: { id: conversationId },
    data: { assignedAgentId: null, status: 'open' },
  });
}

// ═══════════════════════════════════════════════════════════════
//  CHAT MESSAGES  (Chat Message API)
// ═══════════════════════════════════════════════════════════════

export async function sendMessage(
  tenantId: string,
  conversationId: string,
  data: {
    senderType: string;
    senderName?: string;
    senderId?: string;
    body: string;
    messageType?: string;
    isInternal?: boolean;
    audioUrl?: string;
    audioDuration?: number;
    transcript?: string;
  }
) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  let body = data.body;
  let transcript = data.transcript || null;

  // Voice message simulation transcription
  if (data.audioUrl && !transcript) {
    transcript = '[Audio Transcribed]: I need help and crisis support for my family.';
    body = body || transcript;
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderType: data.senderType,
      senderName: data.senderName || null,
      senderId: data.senderId || null,
      body,
      messageType: data.messageType || (data.audioUrl ? 'audio' : 'text'),
      isInternal: data.isInternal || false,
      audioUrl: data.audioUrl || null,
      audioDuration: data.audioDuration || null,
      transcript,
    },
  });

  // AI intelligence pipeline on visitor incoming messages
  if (data.senderType === 'visitor') {
    // Fetch dynamic settings from Centralized Settings Service
    let chatSettings = { enableAiScreening: true, autoEscalateTimer: 15 };
    try {
      const { SettingsService } = require('./settings');
      chatSettings = await SettingsService.getSettingsForModule(tenantId, 'liveChat');
    } catch (err) {
      // If service is not loaded, fallback silently to defaults
    }

    const lowerBody = body.toLowerCase();
    let sentiment = conv.sentiment;
    let safetyAlert = conv.safetyAlert;
    let priority = conv.priority;
    let status = conv.status;
    let escalatedAt = conv.escalatedAt;

    if (chatSettings.enableAiScreening) {
      const distressKeywords = ['sad', 'depressed', 'anxious', 'hopeless', 'hurt', 'lonely'];
      const crisisKeywords = ['suicide', 'end my life', 'kill myself'];

      // Sentiment checks
      if (distressKeywords.some((w) => lowerBody.includes(w))) {
        sentiment = 'distressed';
      }

      // Safety checks
      if (crisisKeywords.some((w) => lowerBody.includes(w))) {
        safetyAlert = true;
        priority = 'urgent';
        status = 'escalated';
        escalatedAt = new Date();

        // Trigger automatic system escalation message
        await prisma.chatMessage.create({
          data: {
            conversationId,
            senderType: 'system',
            senderName: 'System',
            body: 'Safety Alert: Crisis indicators detected. Conversation escalated to Senior Care Team.',
            messageType: 'system_event',
          },
        });
      }
    }

    // AI suggestion engine
    let aiSuggestedReply = conv.aiSuggestedReply;
    let aiSuggestedScriptures = conv.aiSuggestedScriptures;
    let aiSummary = conv.aiSummary || 'Visitor seeking assistance.';

    if (chatSettings.enableAiScreening) {
      if (safetyAlert) {
        aiSuggestedReply = 'Dear friend, your life is valuable to God and us. A crisis counselor has been alerted. Let’s pray.';
        aiSuggestedScriptures = 'Psalm 34:18 (The Lord is close to the brokenhearted)';
        aiSummary = 'CRISIS ALERT: Expressing suicidal thoughts.';
      } else if (lowerBody.includes('service') || lowerBody.includes('time')) {
        aiSuggestedReply = 'Our main services are every Sunday at 8 AM, 10 AM, and 12 PM.';
        aiSuggestedScriptures = 'Hebrews 10:25 (Gathering together)';
        aiSummary = 'Visitor asking about service hours.';
      } else if (lowerBody.includes('salvation') || lowerBody.includes('jesus')) {
        aiSuggestedReply = 'Accepting Jesus is a beautiful decision. We would love to guide you.';
        aiSuggestedScriptures = 'Romans 10:9 (Confess with your mouth Jesus is Lord)';
        aiSummary = 'Visitor interested in salvation journey.';
      } else {
        aiSuggestedReply = 'Thank you for reaching out. A pastor will assist you soon.';
        aiSuggestedScriptures = 'Philippians 4:6 (Be anxious for nothing)';
      }
    }

    // Smart matching/counselor assignment
    let assignedAgentId = conv.assignedAgentId;
    if (!assignedAgentId) {
      const matchedAgent = await findMatchingAgent(tenantId);
      if (matchedAgent) {
        assignedAgentId = matchedAgent;
        if (status !== 'escalated') {
          status = 'assigned';
        }

        await prisma.chatMessage.create({
          data: {
            conversationId,
            senderType: 'system',
            senderName: 'System',
            body: 'Conversation automatically routed and assigned to online counselor.',
            messageType: 'system_event',
          },
        });
      }
    }

    // Update conversation metadata
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        sentiment,
        safetyAlert,
        priority,
        status,
        escalatedAt,
        aiSuggestedReply,
        aiSuggestedScriptures,
        aiSummary,
        assignedAgentId,
      },
    });
  }

  return message;
}

export async function getMessages(
  tenantId: string,
  conversationId: string,
  includeInternal: boolean = false
) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  const where: any = { conversationId };
  if (!includeInternal) where.isInternal = false;

  return prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
}

export async function markMessagesAsRead(tenantId: string, conversationId: string) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  return prisma.chatMessage.updateMany({
    where: { conversationId, readAt: null },
    data: { readAt: new Date() },
  });
}

// ═══════════════════════════════════════════════════════════════
//  CARE REQUESTS  (Care Request API + Prayer Request + Testimony)
// ═══════════════════════════════════════════════════════════════

export async function createCareRequest(
  tenantId: string,
  data: {
    conversationId?: string;
    memberId?: string;
    requestType: string;
    description: string;
    priority?: string;
  }
) {
  return prisma.careRequest.create({
    data: {
      tenantId,
      conversationId: data.conversationId || null,
      memberId: data.memberId || null,
      requestType: data.requestType,
      description: data.description,
      priority: data.priority || 'normal',
    },
  });
}

export async function listCareRequests(
  tenantId: string,
  filters: {
    requestType?: string;
    status?: string;
    assignedAgentId?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.requestType) where.requestType = filters.requestType;
  if (filters.status) where.status = filters.status;
  if (filters.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;
  if (filters.priority) where.priority = filters.priority;

  const [data, total] = await Promise.all([
    prisma.careRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.careRequest.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function updateCareRequest(
  tenantId: string,
  requestId: string,
  data: Partial<{
    status: string;
    priority: string;
    assignedAgentId: string;
  }>
) {
  const req = await prisma.careRequest.findFirst({ where: { id: requestId, tenantId } });
  if (!req) return null;

  if (data.status) {
    const validCareStatuses = [
      'pending',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'new',
      'prayed',
      'followed_up',
      'visited',
      'counselled',
      'testimony_received',
    ];
    if (!validCareStatuses.includes(data.status)) {
      throw new Error(`Invalid care request status: ${data.status}`);
    }
  }

  const updateData: any = { ...data };
  if (data.status === 'resolved' || data.status === 'closed') {
    updateData.resolvedAt = new Date();
  }

  return prisma.careRequest.update({
    where: { id: requestId },
    data: updateData,
  });
}

export async function getCareRequest(tenantId: string, requestId: string) {
  return prisma.careRequest.findFirst({
    where: { id: requestId, tenantId },
    include: {
      member: { select: { id: true, firstName: true, lastName: true } },
      conversation: { select: { id: true, subject: true, channel: true } },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//  SAVED REPLIES
// ═══════════════════════════════════════════════════════════════

export async function createSavedReply(
  tenantId: string,
  data: { title: string; body: string; category?: string }
) {
  return prisma.savedReply.create({
    data: {
      tenantId,
      title: data.title,
      body: data.body,
      category: data.category || null,
    },
  });
}

export async function listSavedReplies(tenantId: string, category?: string) {
  const where: any = { tenantId };
  if (category) where.category = category;
  return prisma.savedReply.findMany({ where, orderBy: { title: 'asc' } });
}

export async function deleteSavedReply(tenantId: string, replyId: string) {
  const reply = await prisma.savedReply.findFirst({ where: { id: replyId, tenantId } });
  if (!reply) return null;
  await prisma.savedReply.delete({ where: { id: replyId } });
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════
//  CHAT FOLLOW-UP TASKS  (Follow-Up Task API)
// ═══════════════════════════════════════════════════════════════

export async function createChatFollowUpTask(
  tenantId: string,
  conversationId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    assignedUserId?: string;
    dueDate?: string;
  }
) {
  const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, tenantId } });
  if (!conv) return null;

  return prisma.chatFollowUpTask.create({
    data: {
      tenantId,
      conversationId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'normal',
      assignedUserId: data.assignedUserId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
}

export async function listChatFollowUpTasks(
  tenantId: string,
  filters: {
    conversationId?: string;
    status?: string;
    assignedUserId?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters.conversationId) where.conversationId = filters.conversationId;
  if (filters.status) where.status = filters.status;
  if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;

  const [data, total] = await Promise.all([
    prisma.chatFollowUpTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.chatFollowUpTask.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function updateChatFollowUpTask(
  tenantId: string,
  taskId: string,
  data: Partial<{ status: string; priority: string; assignedUserId: string; dueDate: string }>
) {
  const task = await prisma.chatFollowUpTask.findFirst({ where: { id: taskId, tenantId } });
  if (!task) return null;

  const updateData: any = { ...data };
  if (data.status === 'completed') {
    updateData.completedAt = new Date();
  }
  if (data.dueDate) {
    updateData.dueDate = new Date(data.dueDate);
  }

  return prisma.chatFollowUpTask.update({
    where: { id: taskId },
    data: updateData,
  });
}

// ═══════════════════════════════════════════════════════════════
//  CONVERSATION HISTORY (per member)
// ═══════════════════════════════════════════════════════════════

export async function getMemberChatHistory(tenantId: string, memberId: string) {
  return prisma.chatConversation.findMany({
    where: { tenantId, memberId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//  NEW ADVANCED LIVE CHAT FEATURES (Presence, Typing, KB, Translation)
// ═══════════════════════════════════════════════════════════════

// 1. Live Presence
export async function updateAgentPresence(
  tenantId: string,
  userId: string,
  presenceState: string,
  customPresence?: string
) {
  const validStates = ['online', 'offline', 'away'];
  if (!validStates.includes(presenceState)) {
    throw new Error(`Invalid presence state: ${presenceState}`);
  }

  return prisma.agentPresence.upsert({
    where: { userId },
    update: {
      presenceState,
      customPresence: customPresence || null,
      lastActiveAt: new Date(),
    },
    create: {
      tenantId,
      userId,
      presenceState,
      customPresence: customPresence || null,
    },
  });
}

export async function getActiveAgentPresences(tenantId: string) {
  return prisma.agentPresence.findMany({
    where: { tenantId, presenceState: 'online' },
    include: { user: { select: { id: true, email: true } } },
  });
}

// Smart matching counselor helper
export async function findMatchingAgent(tenantId: string, customPresenceRequired?: string) {
  const presence = await prisma.agentPresence.findFirst({
    where: {
      tenantId,
      presenceState: 'online',
      ...(customPresenceRequired ? { customPresence: customPresenceRequired } : {}),
    },
    select: { userId: true },
  });
  if (presence) return presence.userId;

  const fallback = await prisma.agentPresence.findFirst({
    where: { tenantId, presenceState: 'online' },
    select: { userId: true },
  });
  return fallback ? fallback.userId : null;
}

// 2. Typing Indicators
export function setTypingStatus(conversationId: string, userId: string, isTyping: boolean, userName: string) {
  let list = typingIndicators.get(conversationId) || [];
  list = list.filter((t) => t.userId !== userId);
  if (isTyping) {
    list.push({ userId, userName, timestamp: Date.now() });
  }
  typingIndicators.set(conversationId, list);
  return list;
}

export function getTypingStatuses(conversationId: string) {
  const list = typingIndicators.get(conversationId) || [];
  const now = Date.now();
  const active = list.filter((t) => now - t.timestamp < 10000);
  typingIndicators.set(conversationId, active);
  return active;
}

// 3. Live Translation
export async function translateChatMessage(tenantId: string, messageId: string, targetLang: string) {
  const msg = await prisma.chatMessage.findFirst({
    where: { id: messageId, conversation: { tenantId } },
  });
  if (!msg) return null;

  const translated = `[Translated to ${targetLang}]: ${msg.body}`;
  return prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      translatedBody: translated,
      translatedLang: targetLang,
    },
  });
}

// 4. Member Context Panel
export async function getMemberContextPanel(tenantId: string, memberId: string) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
    include: {
      family: true,
      volunteerProfile: true,
    },
  });
  if (!member) return null;

  const checkInsCount = await prisma.memberCheckIn.count({
    where: { memberId },
  });

  const groupMemberships = await prisma.groupMember.findMany({
    where: { memberId },
    include: { group: true },
  });
  const cellGroups = groupMemberships.map((gm) => ({
    id: gm.group.id,
    name: gm.group.name,
    role: gm.role,
  }));

  const lmsCount = await prisma.lmsEnrollment.count({
    where: { memberId },
  });

  let donationsCount = 0;
  let donationsTotal = 0;
  if (member.email) {
    const donations = await prisma.donation.findMany({
      where: { tenantId, donorEmail: member.email, status: 'succeeded' },
      select: { amount: true },
    });
    donationsCount = donations.length;
    donationsTotal = donations.reduce((sum, d) => sum + d.amount, 0);
  }

  const testimoniesCount = await prisma.testimony.count({ where: { memberId } });
  const prayerCount = await prisma.prayerRequest.count({ where: { memberId } });

  let volunteerTeams: string[] = [];
  if (member.volunteerProfile) {
    const assignments = await prisma.volunteerTeamAssignment.findMany({
      where: { profileId: member.volunteerProfile.id },
      include: { team: { include: { department: true } } },
    });
    volunteerTeams = assignments.map((a) => `${a.team.department.name} - ${a.team.name}`);
  }

  return {
    member: {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      birthday: member.birthday,
      membershipStatus: member.membershipStatus,
      preferredLanguage: member.preferredLanguage,
    },
    family: member.family ? { id: member.family.id, name: member.family.name } : null,
    attendanceCount: checkInsCount,
    cellGroups,
    lmsEnrollmentsCount: lmsCount,
    givingSummary: {
      donationsCount,
      totalAmount: donationsTotal,
    },
    testimoniesCount,
    prayerRequestsCount: prayerCount,
    volunteerTeams,
  };
}

// 5. Community Channels
export async function createCommunityChannel(
  tenantId: string,
  data: { name: string; type?: string; description?: string }
) {
  return prisma.communityChannel.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type || 'public',
      description: data.description || null,
    },
  });
}

export async function listCommunityChannels(tenantId: string) {
  return prisma.communityChannel.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

// 6. AI Knowledge Base
export async function createKbArticle(
  tenantId: string,
  data: { question: string; answer: string; keywords?: string }
) {
  return prisma.chatKbArticle.create({
    data: {
      tenantId,
      question: data.question,
      answer: data.answer,
      keywords: data.keywords || null,
    },
  });
}

export async function askKbQuestion(tenantId: string, question: string) {
  const articles = await prisma.chatKbArticle.findMany({
    where: { tenantId },
  });
  if (articles.length === 0) return null;

  const queryWords = question.toLowerCase().split(/\s+/).filter(Boolean);
  let bestArticle = null;
  let maxMatches = 0;

  for (const article of articles) {
    const articleWords = (article.question + ' ' + (article.keywords || '')).toLowerCase().split(/[\s,]+/);
    const matches = queryWords.filter((w) => articleWords.includes(w)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestArticle = article;
    }
  }

  return bestArticle;
}

// 7. Altar Call Responses
export async function createAltarCallResponse(
  tenantId: string,
  data: {
    memberId?: string;
    visitorName?: string;
    visitorEmail?: string;
    visitorPhone?: string;
    responseType: string;
    livestreamId?: string;
    counselorId?: string;
  }
) {
  const response = await prisma.altarCallResponse.create({
    data: {
      tenantId,
      memberId: data.memberId || null,
      visitorName: data.visitorName || null,
      visitorEmail: data.visitorEmail || null,
      visitorPhone: data.visitorPhone || null,
      responseType: data.responseType,
      livestreamId: data.livestreamId || null,
      counselorId: data.counselorId || null,
    },
  });

  const email = data.visitorEmail || (data.memberId ? (await prisma.member.findUnique({ where: { id: data.memberId }, select: { email: true } }))?.email : null);
  const name = data.visitorName || (data.memberId ? (await prisma.member.findUnique({ where: { id: data.memberId }, select: { firstName: true, lastName: true } }))?.firstName : 'Altar Call Visitor');

  let crmContact = null;
  if (email) {
    crmContact = await prisma.crmContact.create({
      data: {
        tenantId,
        firstName: name || 'Visitor',
        lastName: 'AltarCall',
        email: email || '',
        phone: data.visitorPhone || '',
        type: 'lead',
        status: 'new',
        leadSource: 'website',
        leadSourceDetail: 'Altar Call Response',
      },
    });

    await prisma.altarCallResponse.update({
      where: { id: response.id },
      data: { crmContactId: crmContact.id },
    });
  }

  const conv = await prisma.chatConversation.create({
    data: {
      tenantId,
      visitorName: name,
      visitorEmail: email,
      memberId: data.memberId || null,
      channel: 'livestream',
      subject: `Altar Call Response - ${data.responseType}`,
      priority: 'high',
      tags: `altar_call,${data.responseType}`,
      assignedAgentId: data.counselorId || null,
      status: data.counselorId ? 'assigned' : 'open',
    },
  });

  await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      senderType: 'system',
      senderName: 'System',
      body: `Altar Call Response registered: ${data.responseType.toUpperCase()}. Conversation initiated.`,
      messageType: 'system_event',
    },
  });

  return { response, conversation: conv, crmContact };
}
