import { Request, Response, Router } from 'express';
import { WebhookService } from './webhook.service';
import { prisma } from '@chatechat/database';
import { telegramPollingService } from './telegram-polling.service';

export const webhookRouter = Router();

/**
 * 1. FACEBOOK MESSENGER WEBHOOK
 */
// Verification challenge from Meta
webhookRouter.get('/messenger', async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe') {
    // Check if verify_token matches any active channel connection in our DB
    const channel = await prisma.channelConnection.findFirst({
      where: {
        channelType: 'MESSENGER',
        isActive: true,
      },
    });

    const expectedToken = (channel?.credentials as any)?.verifyToken || process.env.FB_VERIFY_TOKEN || 'chatechat_verify_token';

    if (token === expectedToken) {
      console.log('✅ Facebook Webhook Verified Successfully');
      return res.status(200).send(challenge);
    }
  }

  return res.status(403).send('Verification failed');
});

// Incoming message events from Meta
webhookRouter.post('/messenger', async (req: Request, res: Response) => {
  // Acknowledge immediately to avoid Meta webhook retries
  res.status(200).send('EVENT_RECEIVED');

  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const recipientId = req.body?.entry?.[0]?.messaging?.[0]?.recipient?.id;

    if (!recipientId) return;

    await WebhookService.processInboundWebhook(
      'MESSENGER',
      recipientId,
      req.headers,
      rawBody,
      req.body,
      (req as any).socketEmitter
    );
  } catch (error: any) {
    console.error('❌ Error processing Messenger webhook:', error.message);
  }
});

/**
 * 2. TELEGRAM BOT WEBHOOK (For Telegram setWebhook callbacks with numeric botId/channelId)
 */
webhookRouter.post('/telegram/:channelId', async (req: Request, res: Response, next) => {
  const { channelId } = req.params;
  const reservedPaths = ['disconnect', 'pause', 'stop', 'send-message', 'bot-reply', 'takeover', 'resolve', 'status', 'chats'];
  if (reservedPaths.includes(channelId)) {
    return next();
  }

  // Acknowledge immediately to Telegram
  res.status(200).json({ ok: true });

  try {
    // Process immediately via telegramPollingService for Socket.IO dispatch & persistence
    await telegramPollingService.processTelegramUpdate(req.body);

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    await WebhookService.processInboundWebhook(
      'TELEGRAM',
      channelId,
      req.headers,
      rawBody,
      req.body,
      (req as any).socketEmitter
    ).catch(() => {});
  } catch (error: any) {
    console.error(`❌ Error processing Telegram webhook for ${channelId}:`, error.message);
  }
});

/**
 * 3. VIBER BOT / BUSINESS WEBHOOK
 */
webhookRouter.post('/viber/:channelId', async (req: Request, res: Response) => {
  const { channelId } = req.params;

  // Handle Viber Webhook handshake event immediately
  if (req.body?.event === 'webhook') {
    console.log(`✅ Viber Webhook handshake verified for channel ${channelId}`);
    return res.status(200).json({ status: 0, status_message: 'ok' });
  }

  // Acknowledge receipt
  res.status(200).json({ status: 0 });

  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    await WebhookService.processInboundWebhook(
      'VIBER',
      channelId,
      req.headers,
      rawBody,
      req.body,
      (req as any).socketEmitter
    );
  } catch (error: any) {
    console.error(`❌ Error processing Viber webhook for ${channelId}:`, error.message);
  }
});

/**
 * 4. TIKTOK DIRECT MESSAGE WEBHOOK
 */
webhookRouter.post('/tiktok/:channelId', async (req: Request, res: Response) => {
  res.status(200).json({ code: 0, message: 'success' });

  const { channelId } = req.params;
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    await WebhookService.processInboundWebhook(
      'TIKTOK',
      channelId,
      req.headers,
      rawBody,
      req.body,
      (req as any).socketEmitter
    );
  } catch (error: any) {
    console.error(`❌ Error processing TikTok webhook for ${channelId}:`, error.message);
  }
});

/**
 * 5. DIRECT TELEGRAM BOT TOKEN CONNECTION, 24/7 POLLING OR WEBHOOK RELAY
 */
webhookRouter.post('/connect/telegram', async (req: Request, res: Response) => {
  const {
    organizationId = 'org_royal',
    assignAllAgents,
    forwardWebhookUrl,
    disableAutoReply,
    mode,
  } = req.body;
  const botToken = req.body.botToken || req.body.token;

  if (!botToken || typeof botToken !== 'string') {
    return res.status(400).json({ success: false, error: 'Telegram Bot Token ထည့်သွင်းရန် လိုအပ်ပါသည်' });
  }

  // Clean token of any accidental quotes or whitespace
  const cleanToken = botToken.trim().replace(/^["']|["']$/g, '').trim();

  try {
    // Start 24/7 Live Telegram Connection (Polling or Webhook Relay)
    const pollResult = await telegramPollingService.start(
      cleanToken,
      organizationId,
      (req as any).io || req.app.get('io'),
      {
        forwardWebhookUrl,
        disableAutoReply,
        mode,
      }
    );

    if (!pollResult.success) {
      return res.status(400).json({
        success: false,
        error: pollResult.error || 'Telegram Bot Token မှားယွင်းနေပါသည်။ Token မှန်ကန်ကြောင်း ပြန်စစ်ပါ',
      });
    }

    const status = telegramPollingService.getStatus(organizationId);
    const botDisplayUsername = status.botUsername || `@${cleanToken.split(':')[0]}`;

    console.log(`🎉 [TELEGRAM LIVE] Successfully activated ${status.mode} for ${botDisplayUsername}`);

    return res.json({
      success: true,
      botUsername: botDisplayUsername.replace('@', ''),
      botName: status.botName || 'Telegram Bot',
      botId: status.botId,
      isPolling: status.isRunning,
      mode: status.mode,
      webhookUrl: status.webhookUrl,
      forwardWebhookUrl: status.forwardWebhookUrl,
      disableAutoReply: status.disableAutoReply,
      assignAllAgents: !!assignAllAgents,
      message: status.mode === 'WEBHOOK_RELAY'
        ? `Telegram Bot (${botDisplayUsername}) အား Webhook Relay စနစ်ဖြင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ! (Forwarding: ${status.forwardWebhookUrl || 'ChateChat Gateway'})`
        : `Telegram Bot (${botDisplayUsername}) အား ChateChat နှင့် ၂၄ နာရီ တိုက်ရိုက် စာပို့လက်ခံနိုင်ရန် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီခင်ဗျာ!`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to connect Telegram Bot',
    });
  }
});

/**
 * 6. TELEGRAM POLLING STATUS & DISCONNECT
 */
webhookRouter.get('/telegram/status', (req: Request, res: Response) => {
  const organizationId = (req.query.organizationId as string) || undefined;
  return res.json({ success: true, ...telegramPollingService.getStatus(organizationId) });
});

webhookRouter.get('/telegram/chats', (req: Request, res: Response) => {
  const organizationId = (req.query.organizationId as string) || undefined;
  return res.json({ success: true, chats: telegramPollingService.getSavedChats(organizationId) });
});

webhookRouter.post('/telegram/disconnect', (_req: Request, res: Response) => {
  telegramPollingService.stop();
  return res.json({ success: true, message: 'Telegram Bot polling disconnected and paused' });
});

webhookRouter.post('/telegram/pause', (_req: Request, res: Response) => {
  telegramPollingService.stop();
  return res.json({ success: true, message: 'Telegram Bot paused' });
});

webhookRouter.post('/telegram/stop', (_req: Request, res: Response) => {
  telegramPollingService.stop();
  return res.json({ success: true, message: 'Telegram Bot stopped' });
});

webhookRouter.post('/telegram/send-message', async (req: Request, res: Response) => {
  const { chatId, text, agentName } = req.body;
  if (!chatId || !text) {
    return res.status(400).json({ success: false, error: 'chatId and text are required' });
  }
  const result = await telegramPollingService.sendMessage(chatId.toString(), text, agentName);
  return res.json(result);
});

/**
 * 6. RECORD EXTERNAL AI BOT REPLIES (So external AI chats are 100% visible in ChateChat)
 */
webhookRouter.post('/telegram/bot-reply', (req: Request, res: Response) => {
  const { chatId, text, botName = 'AI Bot', organizationId } = req.body;
  if (!chatId || !text) {
    return res.status(400).json({ success: false, error: 'chatId and text are required' });
  }
  const result = telegramPollingService.recordBotReply(chatId.toString(), text, botName, organizationId);
  return res.json(result);
});

/**
 * 6. OPEN INBOUND TELEGRAM UPDATE (For external bots that run their own polling/server)
 */
webhookRouter.post('/inbound/telegram', async (req: Request, res: Response) => {
  try {
    const { organizationId, update } = req.body;
    const payload = update || req.body;
    await telegramPollingService.processTelegramUpdate(payload, organizationId);
    return res.status(200).json({ success: true, message: 'Telegram update ingested into ChateChat successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. SIMULATE INBOUND MESSAGE DIRECTLY TO SOCKET.IO CLIENTS
 */
webhookRouter.post('/simulate-inbound', async (req: Request, res: Response) => {
  const {
    channelType = 'TELEGRAM',
    botName = '@MyBot',
    customerName = 'ကိုကျော်စွာ (Telegram Customer)',
    text = 'မင်္ဂလာပါ Telegram မှ စာတိုစမ်းသပ်ချက် ပို့လိုက်ပါသည်',
    organizationId = 'org_royal',
  } = req.body;
  const convId = `conv_inbound_${Date.now()}`;
  const custId = `cust_inbound_${Date.now()}`;
  const nowIso = new Date().toISOString();

  if ((req as any).socketEmitter) {
    (req as any).socketEmitter('INCOMING_MESSAGE', `org:${organizationId}`, {
      conversation: {
        id: convId,
        organizationId,
        customerId: custId,
        channelConnectionId: `chan_${channelType.toLowerCase()}_active`,
        status: 'ACTIVE',
        handoverStatus: 'HUMAN_REQUESTED',
        channelType,
        externalThreadId: `chat_${Date.now().toString().slice(-6)}`,
        unreadCount: 1,
        lastMessageSnippet: text,
        lastMessageAt: nowIso,
        customer: {
          id: custId,
          name: customerName,
          phone: '09791234567',
          tags: ['Simulated Inbound', `${channelType} Lead`],
          totalOrders: 1,
          totalSpentMmk: 25000,
        },
      },
      message: {
        id: `msg_${Date.now()}`,
        conversationId: convId,
        senderType: 'CUSTOMER',
        senderName: customerName,
        type: 'TEXT',
        content: text,
        isInternal: false,
        createdAt: nowIso,
      },
    });
  }

  return res.json({ success: true, message: 'Simulated inbound message dispatched via Socket.IO' });
});

/**
 * 7. AGENT TAKEOVER (Pause/Silence external AI Bot)
 */
webhookRouter.post('/telegram/takeover', async (req: Request, res: Response) => {
  try {
    const { chatId, agentName } = req.body;
    if (!chatId) return res.status(400).json({ error: 'chatId is required' });
    await telegramPollingService.setHandoverStatus(chatId, 'TRANSFERRED_TO_AGENT', agentName);
    return res.status(200).json({ success: true, handoverStatus: 'TRANSFERRED_TO_AGENT' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. AGENT RESOLVE (Hand control back to Bot)
 */
webhookRouter.post('/telegram/resolve', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: 'chatId is required' });
    await telegramPollingService.setHandoverStatus(chatId, 'BOT_HANDLING');
    return res.status(200).json({ success: true, handoverStatus: 'BOT_HANDLING' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
