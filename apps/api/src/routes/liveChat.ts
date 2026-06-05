import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as chatService from '../services/liveChat';

const router = Router();

// All live chat routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
//  CHAT CONVERSATIONS  (Chat Conversation API)
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/conversations
router.post('/conversations', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { visitorName, visitorEmail, memberId, channel, subject, priority, tags, isAnonymous, departmentId } = req.body;
    const conv = await chatService.createConversation(req.tenantId!, {
      visitorName, visitorEmail, memberId, channel, subject, priority, tags, isAnonymous, departmentId,
    });
    res.status(201).json({ data: conv });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/conversations
router.get('/conversations', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { status, channel, assignedAgentId, priority, page, limit } = req.query;
    const isAdmin = req.user?.permissions?.includes('tenant.settings') || false;
    const result = await chatService.listConversations(req.tenantId!, {
      status: status as string,
      channel: channel as string,
      assignedAgentId: assignedAgentId as string,
      priority: priority as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    }, isAdmin);
    res.json(result);
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/conversations/:id
router.get('/conversations/:id', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user?.permissions?.includes('tenant.settings') || false;
    const conv = await chatService.getConversation(req.tenantId!, req.params.id as string, isAdmin);
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ data: conv });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chat/conversations/:id
router.put('/conversations/:id', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const updated = await chatService.updateConversation(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update conversation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AGENT ASSIGNMENT  (Agent Assignment API)
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/conversations/:id/assign
router.post('/conversations/:id/assign', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      res.status(400).json({ error: 'agentId is required' });
      return;
    }
    const result = await chatService.assignAgent(req.tenantId!, req.params.id as string, agentId);
    if (!result) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ data: result });
  } catch (err) {
    console.error('Assign agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/chat/conversations/:id/unassign
router.post('/conversations/:id/unassign', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const result = await chatService.unassignAgent(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ data: result });
  } catch (err) {
    console.error('Unassign agent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CHAT MESSAGES  (Chat Message API)
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { senderType, senderName, senderId, body, messageType, isInternal, audioUrl, audioDuration, transcript } = req.body;
    if (!senderType || (!body && !audioUrl)) {
      res.status(400).json({ error: 'senderType and either body or audioUrl are required' });
      return;
    }
    const msg = await chatService.sendMessage(req.tenantId!, req.params.id as string, {
      senderType, senderName, senderId, body, messageType, isInternal, audioUrl, audioDuration, transcript,
    });
    if (!msg) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.status(201).json({ data: msg });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { includeInternal } = req.query;
    const messages = await chatService.getMessages(
      req.tenantId!,
      req.params.id as string,
      includeInternal === 'true'
    );
    if (messages === null) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ data: messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CARE REQUESTS  (Care Request + Prayer + Testimony APIs)
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/care-requests
router.post('/care-requests', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { conversationId, memberId, requestType, description, priority } = req.body;
    if (!requestType || !description) {
      res.status(400).json({ error: 'requestType and description are required' });
      return;
    }
    const careReq = await chatService.createCareRequest(req.tenantId!, {
      conversationId, memberId, requestType, description, priority,
    });
    res.status(201).json({ data: careReq });
  } catch (err) {
    console.error('Create care request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/care-requests
router.get('/care-requests', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { requestType, status, assignedAgentId, priority, page, limit } = req.query;
    const result = await chatService.listCareRequests(req.tenantId!, {
      requestType: requestType as string,
      status: status as string,
      assignedAgentId: assignedAgentId as string,
      priority: priority as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error('List care requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/care-requests/:id
router.get('/care-requests/:id', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const careReq = await chatService.getCareRequest(req.tenantId!, req.params.id as string);
    if (!careReq) {
      res.status(404).json({ error: 'Care request not found' });
      return;
    }
    res.json({ data: careReq });
  } catch (err) {
    console.error('Get care request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chat/care-requests/:id
router.put('/care-requests/:id', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const updated = await chatService.updateCareRequest(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Care request not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update care request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SAVED REPLIES
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/saved-replies
router.post('/saved-replies', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { title, body, category } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: 'title and body are required' });
      return;
    }
    const reply = await chatService.createSavedReply(req.tenantId!, { title, body, category });
    res.status(201).json({ data: reply });
  } catch (err) {
    console.error('Create saved reply error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/saved-replies
router.get('/saved-replies', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const replies = await chatService.listSavedReplies(req.tenantId!, category as string);
    res.json({ data: replies });
  } catch (err) {
    console.error('List saved replies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/chat/saved-replies/:id
router.delete('/saved-replies/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const result = await chatService.deleteSavedReply(req.tenantId!, req.params.id as string);
    if (!result) {
      res.status(404).json({ error: 'Saved reply not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('Delete saved reply error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  CHAT FOLLOW-UP TASKS  (Follow-Up Task API)
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/conversations/:id/tasks
router.post('/conversations/:id/tasks', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const { title, description, priority, assignedUserId, dueDate } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const task = await chatService.createChatFollowUpTask(req.tenantId!, req.params.id as string, {
      title, description, priority, assignedUserId, dueDate,
    });
    if (!task) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.status(201).json({ data: task });
  } catch (err) {
    console.error('Create chat task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/chat/tasks
router.get('/tasks', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { conversationId, status, assignedUserId, page, limit } = req.query;
    const result = await chatService.listChatFollowUpTasks(req.tenantId!, {
      conversationId: conversationId as string,
      status: status as string,
      assignedUserId: assignedUserId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error('List chat tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/chat/tasks/:id
router.put('/tasks/:id', requirePermission('member.update'), async (req: Request, res: Response) => {
  try {
    const updated = await chatService.updateChatFollowUpTask(req.tenantId!, req.params.id as string, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ data: updated });
  } catch (err) {
    console.error('Update chat task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  MEMBER CONVERSATION HISTORY
// ═══════════════════════════════════════════════════════════════

// GET /api/chat/members/:memberId/history
router.get('/members/:memberId/history', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const history = await chatService.getMemberChatHistory(req.tenantId!, req.params.memberId as string);
    res.json({ data: history });
  } catch (err) {
    console.error('Get member chat history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AGENT PRESENCE & TYPING
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/presence
router.post('/presence', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { presenceState, customPresence } = req.body;
    const userId = req.user!.userId;
    if (!presenceState) {
      res.status(400).json({ error: 'presenceState is required' });
      return;
    }
    const result = await chatService.updateAgentPresence(req.tenantId!, userId, presenceState, customPresence);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/chat/presence
router.get('/presence', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const result = await chatService.getActiveAgentPresences(req.tenantId!);
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/conversations/:id/typing
router.post('/conversations/:id/typing', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { isTyping, userName } = req.body;
    const userId = req.user!.userId;
    const result = chatService.setTypingStatus(
      req.params.id as string,
      userId,
      isTyping === true,
      userName || 'Unknown'
    );
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/conversations/:id/typing
router.get('/conversations/:id/typing', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const result = chatService.getTypingStatuses(req.params.id as string);
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  TRANSLATION
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/conversations/:id/messages/:msgId/translate
router.post('/conversations/:id/messages/:msgId/translate', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { targetLang } = req.body;
    if (!targetLang) {
      res.status(400).json({ error: 'targetLang is required' });
      return;
    }
    const result = await chatService.translateChatMessage(req.tenantId!, req.params.msgId as string, targetLang);
    if (!result) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  SMART MEMBER CONTEXT PANEL
// ═══════════════════════════════════════════════════════════════

// GET /api/chat/members/:memberId/context
router.get('/members/:memberId/context', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const result = await chatService.getMemberContextPanel(req.tenantId!, req.params.memberId as string);
    if (!result) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ALTAR CALL RESPONSES
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/altar-call
router.post('/altar-call', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { memberId, visitorName, visitorEmail, visitorPhone, responseType, livestreamId, counselorId } = req.body;
    if (!responseType) {
      res.status(400).json({ error: 'responseType is required' });
      return;
    }
    const result = await chatService.createAltarCallResponse(req.tenantId!, {
      memberId, visitorName, visitorEmail, visitorPhone, responseType, livestreamId, counselorId,
    });
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  AI KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/kb
router.post('/kb', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { question, answer, keywords } = req.body;
    if (!question || !answer) {
      res.status(400).json({ error: 'question and answer are required' });
      return;
    }
    const result = await chatService.createKbArticle(req.tenantId!, { question, answer, keywords });
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/kb/ask
router.post('/kb/ask', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) {
      res.status(400).json({ error: 'question is required' });
      return;
    }
    const result = await chatService.askKbQuestion(req.tenantId!, question);
    if (!result) {
      res.status(404).json({ error: 'No matching answers found' });
      return;
    }
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
//  READ RECEIPTS
// ═══════════════════════════════════════════════════════════════

// POST /api/chat/conversations/:id/read
router.post('/conversations/:id/read', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    await chatService.markMessagesAsRead(req.tenantId!, req.params.id as string);
    res.json({ data: { success: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
