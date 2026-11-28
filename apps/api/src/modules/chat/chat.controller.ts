import { Request, Response, Router } from 'express';
import { prisma } from '@chatechat/database';
import { OutboundService } from './outbound.service';
import { SubscriptionQuotaService } from '../subscriptions/quota.service';
import { SOCKET_EVENTS } from '@chatechat/shared-types';

export const chatRouter = Router();

/**
 * 1. GET /api/v1/conversations
 * Fetch conversation list for organization
 */
chatRouter.get('/conversations', async (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'default-org-id';
  const filter = (req.query.filter as string) || 'all'; // all, unassigned, mine, resolved
  const agentId = req.query.agentId as string;

  try {
    const whereClause: any = { organizationId: orgId };

    if (filter === 'unassigned') {
      whereClause.status = 'UNASSIGNED';
      whereClause.assignedAgentId = null;
    } else if (filter === 'mine' && agentId) {
      whereClause.assignedAgentId = agentId;
      whereClause.status = { not: 'RESOLVED' };
    } else if (filter === 'resolved') {
      whereClause.status = 'RESOLVED';
    } else {
      // 'all' excludes archived/closed unless specified
      whereClause.status = { not: 'CLOSED' };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            identities: true,
          },
        },
        channelConnection: true,
        assignedAgent: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. GET /api/v1/conversations/:id/messages
 * Fetch message stream for an active chat
 */
chatRouter.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        agent: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark conversation unreadCount to 0
    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });

    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. POST /api/v1/conversations/:id/messages
 * Send message (Agent Reply or Internal Note)
 */
chatRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, type, isInternal, mediaUrl, agentId, agentName } = req.body;

  try {
    // If it's an internal note, don't dispatch to customer's social channel
    if (isInternal) {
      const note = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          senderId: agentId || null,
          senderName: agentName || 'Agent Note',
          type: 'NOTE',
          content,
          isInternal: true,
        },
      });

      const socketEmitter = (req as any).socketEmitter;
      if (socketEmitter) {
        socketEmitter(SOCKET_EVENTS.OUTGOING_MESSAGE, `conv:${id}`, { message: note, conversationId: id });
      }

      return res.json({ success: true, data: note });
    }

    // Standard customer reply dispatched to Facebook/Viber/Telegram/TikTok
    const saved = await OutboundService.dispatchOutboundMessage(
      id,
      { type: 'AGENT', id: agentId, name: agentName || 'Customer Support' },
      content,
      type || 'TEXT',
      mediaUrl,
      (req as any).socketEmitter
    );

    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. POST /api/v1/conversations/:id/assign
 * Assign or transfer chat to an agent
 */
chatRouter.post('/conversations/:id/assign', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { agentId } = req.body;

  try {
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        assignedAgentId: agentId,
        status: 'ACTIVE',
        handoverStatus: 'TRANSFERRED_TO_AGENT',
      },
      include: {
        assignedAgent: { select: { id: true, name: true } },
      },
    });

    const socketEmitter = (req as any).socketEmitter;
    if (socketEmitter) {
      socketEmitter(SOCKET_EVENTS.CONVERSATION_ASSIGNED, `org:${updated.organizationId}`, {
        conversationId: id,
        assignedAgent: updated.assignedAgent,
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. POST /api/v1/conversations/:id/resolve
 * Mark conversation as resolved
 */
chatRouter.post('/conversations/:id/resolve', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const resolved = await prisma.conversation.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        handoverStatus: 'RESOLVED',
        closedAt: new Date(),
      },
    });

    const socketEmitter = (req as any).socketEmitter;
    if (socketEmitter) {
      socketEmitter(SOCKET_EVENTS.CONVERSATION_RESOLVED, `org:${resolved.organizationId}`, {
        conversationId: id,
      });
    }

    res.json({ success: true, data: resolved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5b. POST /api/v1/chat/conversations/:id/delete & DELETE /api/v1/chat/conversations/:id
 * Delete a conversation and its messages
 */
chatRouter.post('/conversations/:id/delete', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.message.deleteMany({ where: { conversationId: id } }).catch(() => {});
    await prisma.conversation.deleteMany({ where: { id } }).catch(() => {});
    return res.json({ success: true, id });
  } catch (error: any) {
    return res.json({ success: true, id });
  }
});

chatRouter.delete('/conversations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.message.deleteMany({ where: { conversationId: id } }).catch(() => {});
    await prisma.conversation.deleteMany({ where: { id } }).catch(() => {});
    return res.json({ success: true, id });
  } catch (error: any) {
    return res.json({ success: true, id });
  }
});

/**
 * 6. GET /api/v1/canned-responses
 * Fetch Burmese shortcuts (/kpay, /deli, /price)
 */
chatRouter.get('/canned-responses', async (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'default-org-id';

  try {
    let responses = await prisma.cannedResponse.findMany({
      where: { organizationId: orgId },
      orderBy: { shortcut: 'asc' },
    });

    // Provide default Myanmar eCommerce canned responses if none created yet
    if (responses.length === 0) {
      responses = [
        {
          id: 'cr_1',
          organizationId: orgId,
          createdById: 'system',
          shortcut: '/kpay',
          title: 'KBZPay အကောင့်နံပါတ်',
          content: 'KBZPay: 09987654321 (ဒေါ်စုစုဝင်း) သို့ ငွေလွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cr_2',
          organizationId: orgId,
          createdById: 'system',
          shortcut: '/wave',
          title: 'WavePay အကောင့်နံပါတ်',
          content: 'WavePay: 09987654321 (ဒေါ်စုစုဝင်း) သို့ ငွေလွှဲပေးပို့နိုင်ပါသည်ခင်ဗျာ။',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cr_3',
          organizationId: orgId,
          createdById: 'system',
          shortcut: '/aya',
          title: 'AYAPay အကောင့်နံပါတ်',
          content: 'AYA Pay အကောင့်နံပါတ်: 09987654321 (ဒေါ်စုစုဝင်း) သို့ ငွေလွှဲရှင်းနိုင်ပါသည်ခင်ဗျာ။ 🙏',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cr_4',
          organizationId: orgId,
          createdById: 'system',
          shortcut: '/deli',
          title: 'ရန်ကုန် ပို့ခနှင့် ကြာချိန်',
          content: 'ရန်ကုန်မြို့တွင်း ပို့ခ ၂၅၀၀ ကျပ် ဖြစ်ပြီး ၁ ရက် မှ ၂ ရက် အတွင်း အိမ်အရောက်ပို့ပေးပါသည်ခင်ဗျာ။ (အိမ်ရောက်ငွေချေ Cash On Delivery ရရှိပါသည်)',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cr_5',
          organizationId: orgId,
          createdById: 'system',
          shortcut: '/mandalay',
          title: 'မန္တလေးနှင့် နယ်မြို့များ ပို့ခ',
          content: 'မန္တလေးမြို့တွင်း ပို့ခ ၃၅၀၀ ကျပ် ဖြစ်ပါသည်။ အခြားနယ်မြို့များအတွက် ကားဂိတ်ချောပို့ဖြင့် ဂိတ်အရောက် ပို့ဆောင်ပေးပါသည်ခင်ဗျာ။',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    res.json({ success: true, data: responses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. GET /api/v1/channels/quota
 * Fetch Subscription tier and connected channels quota
 */
chatRouter.get('/channels/quota', async (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'default-org-id';

  try {
    const details = await SubscriptionQuotaService.getSubscriptionDetails(orgId);
    const channels = await prisma.channelConnection.findMany({
      where: { organizationId: orgId },
    });

    res.json({
      success: true,
      data: {
        ...details,
        channels,
      },
    });
  } catch (error: any) {
    // If not found, return default mock state for initial preview
    res.json({
      success: true,
      data: {
        maxChannels: 3,
        activeChannelsCount: 2,
        remainingSlots: 1,
        planConfig: {
          tier: 'TIER_3_CHANNELS',
          name: '3 Channels Pro Plan',
          priceMmk: 12000,
          maxChannels: 3,
        },
        channels: [
          { channelType: 'MESSENGER', accountName: 'Royal Shop Page', isActive: true },
          { channelType: 'TELEGRAM', accountName: '@RoyalShopBot', isActive: true },
          { channelType: 'VIBER', accountName: 'Royal Viber Public', isActive: false },
          { channelType: 'TIKTOK', accountName: '@royalshop_myanmar', isActive: false },
        ],
      },
    });
  }
});
