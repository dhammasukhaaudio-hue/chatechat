import fs from 'fs';
import path from 'path';
import https from 'node:https';
import { Server as SocketIOServer } from 'socket.io';

export async function telegramFetch(url: string, options: any = {}): Promise<any> {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn(`⚠️ [TELEGRAM FETCH FALLBACK] Global fetch failed (${err.message}). Trying node:https IPv4...`);
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const reqOptions: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        family: 4, // Force IPv4 to prevent IPv6 unreachable errors on cloud containers
        timeout: 25000,
      };

      const req = https.request(reqOptions, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (pe) {
            reject(new Error(`Failed to parse Telegram response: ${rawData}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Telegram request timed out (25s)'));
      });

      req.on('error', (e) => reject(e));

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }
}

export interface TelegramBotConfig {
  token: string;
  botId: string;
  username: string;
  firstName: string;
  organizationId: string;
  isActive: boolean;
  lastOffset: number;
  forwardWebhookUrl?: string;
  disableAutoReply?: boolean;
  mode?: 'POLLING' | 'WEBHOOK_RELAY';
  webhookUrl?: string;
  agentIdleTimeoutMinutes?: number;
}

const DATA_DIR = path.resolve(__dirname, '../../../data');
const CONFIG_FILE = path.join(DATA_DIR, 'telegram-bot.json');
const CHATS_FILE = path.join(DATA_DIR, 'telegram-chats.json');

class TelegramPollingService {
  private config: TelegramBotConfig | null = null;
  private isRunning: boolean = false;
  private io: SocketIOServer | null = null;
  private pollAbortController: AbortController | null = null;
  private pollingErrorCount: number = 0;
  private lastMessageTimestamp: string | null = null;
  private idleCheckerTimer: NodeJS.Timeout | null = null;
  private sentClientMessageIds = new Map<string, number>();

  constructor() {
    this.loadConfig();
    this.startIdleHandbackChecker();
  }

  /**
   * 3-Minute Agent Inactivity Auto-Handback background checker
   */
  public startIdleHandbackChecker() {
    if (this.idleCheckerTimer) return;
    this.idleCheckerTimer = setInterval(() => {
      try {
        if (!fs.existsSync(CHATS_FILE)) return;
        const history = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
        const now = Date.now();
        const timeoutMs = (this.config?.agentIdleTimeoutMinutes || 3) * 60 * 1000;

        for (const [convId, data] of Object.entries<any>(history)) {
          const conv = data?.conv;
          if (conv && conv.handoverStatus === 'TRANSFERRED_TO_AGENT') {
            const lastTime = conv.lastAgentMessageAt ? new Date(conv.lastAgentMessageAt).getTime() : 0;
            if (lastTime > 0 && (now - lastTime) >= timeoutMs) {
              const chatId = conv.externalThreadId || convId.replace('conv_tg_', '');
              console.log(`⏰ [AUTO-HANDBACK BACKGROUND] Conversation ${convId} (Chat ${chatId}) idle for > ${timeoutMs / 60000} mins. Returning to BOT_HANDLING.`);
              this.setHandoverStatus(chatId, 'BOT_HANDLING', undefined, true);
            }
          }
        }
      } catch (err: any) {
        // silent catch
      }
    }, 20000);
  }

  private loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('⚠️ Could not load telegram-bot.json:', e);
    }
  }

  private saveConfig() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (this.config) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('❌ Failed to save telegram config:', e);
    }
  }

  public getStatus(organizationId?: string) {
    const isThisOrg = !organizationId || (this.config?.organizationId || 'org_royal') === organizationId;
    return {
      isRunning: this.isRunning && isThisOrg && !!this.config?.isActive,
      botUsername: isThisOrg && this.config?.username ? `@${this.config.username}` : null,
      botName: isThisOrg ? (this.config?.firstName || null) : null,
      botId: isThisOrg ? (this.config?.botId || null) : null,
      isActive: isThisOrg && !!this.config?.isActive,
      lastMessageTimestamp: isThisOrg ? this.lastMessageTimestamp : null,
      lastOffset: isThisOrg ? (this.config?.lastOffset || 0) : 0,
      organizationId: this.config?.organizationId || 'org_royal',
      forwardWebhookUrl: isThisOrg ? (this.config?.forwardWebhookUrl || null) : null,
      disableAutoReply: isThisOrg ? !!this.config?.disableAutoReply : false,
      mode: isThisOrg ? (this.config?.mode || 'POLLING') : 'POLLING',
      webhookUrl: isThisOrg ? (this.config?.webhookUrl || `https://chatechat.onrender.com/api/v1/webhooks/telegram/${this.config?.botId || 'bot'}`) : null,
    };
  }

  public getSavedToken(): string | null {
    return this.config?.token || null;
  }

  /**
   * Start polling or Webhook Relay for a specific Telegram Bot Token
   */
  public async start(
    token: string,
    organizationId = 'org_royal',
    io?: SocketIOServer,
    options?: {
      forwardWebhookUrl?: string;
      disableAutoReply?: boolean;
      mode?: 'POLLING' | 'WEBHOOK_RELAY';
    }
  ): Promise<{ success: boolean; botUsername?: string; botId?: string; error?: string; webhookUrl?: string; mode?: string }> {
    if (io) this.io = io;
    const cleanToken = token.trim().replace(/^["']|["']$/g, '').trim();

    try {
      // 1. Validate token with getMe
      console.log(`🤖 [TELEGRAM] Verifying Bot Token with Telegram API...`);
      const meData = await telegramFetch(`https://api.telegram.org/bot${cleanToken}/getMe`);

      if (!meData || !meData.ok || !meData.result) {
        return {
          success: false,
          error: meData?.description || 'Telegram Bot Token မှားယွင်းနေပါသည်။ Token မှန်ကန်ကြောင်း ပြန်စစ်ပါ',
        };
      }

      const bot = meData.result;
      console.log(`✅ [TELEGRAM] Bot Verified: @${bot.username} (${bot.first_name})`);

      const effectiveMode = options?.mode || (options?.forwardWebhookUrl ? 'WEBHOOK_RELAY' : 'POLLING');
      const webhookUrl = `https://chatechat.onrender.com/api/v1/webhooks/telegram/${bot.id}`;

      // Stop any running polling loop first
      this.stop();

      if (effectiveMode === 'WEBHOOK_RELAY') {
        // Register ChateChat Webhook on Telegram!
        console.log(`🌐 [TELEGRAM RELAY] Registering Telegram Webhook to ChateChat: ${webhookUrl}`);
        const setHookData = await telegramFetch(
          `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=["message","edited_message","callback_query"]`
        );
        console.log(`📡 [TELEGRAM RELAY] Webhook set result:`, setHookData);

        if (!setHookData?.ok) {
          throw new Error(`Failed to set Telegram Webhook: ${setHookData?.description || 'Unknown error'}`);
        }
      } else {
        // Mode is POLLING: Delete any existing webhook so Telegram allows getUpdates long polling
        try {
          console.log(`🔄 [TELEGRAM] Deleting any existing webhook to enable 24/7 Long Polling...`);
          const delData = await telegramFetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook?drop_pending_updates=false`);
          console.log(`📡 [TELEGRAM] Webhook status reset:`, delData?.ok ? 'Ready for Long Polling' : delData?.description);
        } catch (delErr) {
          console.warn('⚠️ [TELEGRAM] deleteWebhook call warning:', delErr);
        }

        // Start polling loop
        this.isRunning = true;
        this.pollingErrorCount = 0;
        this.runPollingLoop();
      }

      // 3. Update configuration
      this.config = {
        token: cleanToken,
        botId: bot.id.toString(),
        username: bot.username || `bot_${bot.id}`,
        firstName: bot.first_name || 'Telegram Bot',
        organizationId,
        isActive: true,
        lastOffset: this.config?.lastOffset || 0,
        forwardWebhookUrl: options?.forwardWebhookUrl?.trim() || undefined,
        disableAutoReply: options?.disableAutoReply ?? (!!options?.forwardWebhookUrl),
        mode: effectiveMode,
        webhookUrl,
      };
      this.saveConfig();

      return {
        success: true,
        botUsername: `@${bot.username}`,
        botId: bot.id.toString(),
        webhookUrl,
        mode: effectiveMode,
      };
    } catch (err: any) {
      console.error('❌ [TELEGRAM] Failed to start connection:', err.message);
      return {
        success: false,
        error: err.message || 'Telegram Bot ချိတ်ဆက်မှု မအောင်မြင်ပါ',
      };
    }
  }

  /**
   * Stop polling
   */
  public stop() {
    this.isRunning = false;
    if (this.pollAbortController) {
      try {
        this.pollAbortController.abort();
      } catch {}
      this.pollAbortController = null;
    }
    if (this.config) {
      this.config.isActive = false;
      this.saveConfig();
    }
    console.log('🛑 [TELEGRAM] Polling stopped');
  }

  /**
   * Continuous Long Polling Loop (getUpdates)
   */
  private async runPollingLoop() {
    console.log(`🚀 [TELEGRAM] 24/7 Live Long Polling Started for @${this.config?.username}`);

    while (this.isRunning && this.config?.token) {
      try {
        const offset = this.config.lastOffset || 0;
        this.pollAbortController = new AbortController();

        // 25 second long polling timeout
        const url = `https://api.telegram.org/bot${this.config.token}/getUpdates?offset=${offset}&timeout=25&allowed_updates=["message","edited_message"]`;
        const res = await fetch(url, { signal: this.pollAbortController.signal });

        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json() as any;

        if (data && data.ok && Array.isArray(data.result)) {
          this.pollingErrorCount = 0;
          for (const update of data.result) {
            // Advance offset immediately so we do not re-process
            this.config.lastOffset = update.update_id + 1;
            this.saveConfig();

            await this.processTelegramUpdate(update);
          }
        } else if (data && !data.ok) {
          console.warn(`⚠️ [TELEGRAM API Warning]: ${data.description}`);
          if (data.description?.includes('webhook is active')) {
            await fetch(`https://api.telegram.org/bot${this.config.token}/deleteWebhook`);
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err: any) {
        if (!this.isRunning) break;
        if (err.name === 'AbortError') continue;

        this.pollingErrorCount++;
        const backoffMs = Math.min(1000 * Math.pow(1.5, this.pollingErrorCount), 10000);
        console.warn(`⚠️ [TELEGRAM Polling Error]: ${err.message}. Retrying in ${Math.round(backoffMs / 1000)}s...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  /**
   * Process a single incoming Telegram Update and dispatch via Socket.IO
   */
  public async processTelegramUpdate(update: any, explicitOrgId?: string) {
    if (!update) return;

    const msg = update.message || update.edited_message;
    const callback = update.callback_query;
    if (!msg && !callback) return;

    const chat = msg?.chat || callback?.message?.chat;
    if (!chat) return;

    const chatId = chat.id.toString();
    const convId = `conv_tg_${chatId}`;

    // Check if human agent is currently active on this conversation
    const savedConv = this.getSavedConversation(convId);
    let isAgentActive = savedConv?.handoverStatus === 'TRANSFERRED_TO_AGENT';

    // 3-Minute Agent Inactivity Auto-Handback check
    const timeoutMs = (this.config?.agentIdleTimeoutMinutes || 3) * 60 * 1000;
    if (isAgentActive && savedConv?.lastAgentMessageAt) {
      const lastAgentTime = new Date(savedConv.lastAgentMessageAt).getTime();
      const elapsed = Date.now() - lastAgentTime;
      if (elapsed >= timeoutMs) {
        console.log(`⏰ [AUTO-HANDBACK ON INBOUND] Agent idle for ${(elapsed / 60000).toFixed(1)} mins on ${convId}. Returning to BOT_HANDLING.`);
        this.setHandoverStatus(chatId, 'BOT_HANDLING', undefined, true);
        isAgentActive = false;
      }
    }

    // 1. FORWARD RAW UPDATE TO EXTERNAL BOT IF RELAY IS CONFIGURED
    // (If a human agent is actively handling this conversation, silence forwarding so AI bot won't interrupt!)
    if (this.config?.forwardWebhookUrl) {
      if (isAgentActive) {
        console.log(`⏸️ [TELEGRAM RELAY SILENCED] Human Agent is active on ${convId}. Skipping external AI forward.`);
      } else {
        this.forwardUpdateToExternalBot(update, this.config.forwardWebhookUrl);
      }
    }

    const fromUser = msg?.from || callback?.from;
    const senderFirst = fromUser?.first_name || '';
    const senderLast = fromUser?.last_name || '';
    const senderName = [senderFirst, senderLast].filter(Boolean).join(' ') || fromUser?.username || `Telegram Customer (${chatId.slice(-4)})`;
    const username = fromUser?.username ? `@${fromUser.username}` : '';

    let text = msg?.text || msg?.caption || '';
    let msgType = 'TEXT';
    let mediaUrl: string | undefined;

    if (callback) {
      text = text || `🔘 [Button]: ${callback.data || 'Clicked'}`;
    } else if (msg?.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      msgType = 'IMAGE';
      text = text || '📷 [Customer ပေးပို့သော ဓာတ်ပုံ / Image]';
      const largest = msg.photo[msg.photo.length - 1];
      try {
        const fileRes = await fetch(`https://api.telegram.org/bot${this.config?.token}/getFile?file_id=${largest.file_id}`);
        const fileData = await fileRes.json() as any;
        if (fileData?.ok && fileData.result?.file_path) {
          mediaUrl = `https://api.telegram.org/file/bot${this.config?.token}/${fileData.result.file_path}`;
        }
      } catch {
        mediaUrl = `https://api.telegram.org/bot${this.config?.token}/getFile?file_id=${largest.file_id}`;
      }
    } else if (msg?.contact) {
      text = `📱 [ဖုန်းနံပါတ် မျှဝေသည်]: ${msg.contact.phone_number}`;
    } else if (msg?.sticker) {
      text = msg.sticker.emoji ? `[Sticker: ${msg.sticker.emoji}]` : '[Sticker]';
    } else if (!text) {
      text = '[Media Message]';
    }

    const nowIso = new Date().toISOString();
    this.lastMessageTimestamp = nowIso;
    const custId = `cust_tg_${chatId}`;
    const messageId = msg?.message_id ? `msg_tg_${msg.message_id}` : `msg_tg_${Date.now()}`;
    const orgId = explicitOrgId || this.config?.organizationId || 'org_royal';

    console.log(`📨 [TELEGRAM LIVE INBOUND] From: ${senderName} (${chatId}) - "${text}"`);

    // Prepare Unified Conversation Object (preserve handoverStatus if already assigned to agent)
    const currentHandover = savedConv?.handoverStatus || 'BOT_HANDLING';

    const conversation = {
      id: convId,
      organizationId: orgId,
      customerId: custId,
      channelConnectionId: `chan_tg_${this.config?.botId || 'active'}`,
      status: 'ACTIVE',
      handoverStatus: currentHandover,
      channelType: 'TELEGRAM',
      externalThreadId: chatId,
      unreadCount: 1,
      lastMessageSnippet: text,
      lastMessageAt: nowIso,
      customer: {
        id: custId,
        name: `${senderName}${username ? ` (${username})` : ''}`,
        phone: msg?.contact?.phone_number || '',
        tags: ['Telegram Real Customer', 'Live Chat'],
        totalOrders: 0,
        totalSpentMmk: 0,
        identities: [
          {
            id: `id_${chatId}`,
            channelType: 'TELEGRAM',
            externalId: chatId,
            externalUsername: username,
          },
        ],
      },
    };

    // Prepare Normalized Message Object
    const message = {
      id: messageId,
      conversationId: convId,
      senderType: 'CUSTOMER',
      senderName: senderName,
      type: msgType,
      content: text,
      mediaUrl,
      isInternal: false,
      createdAt: nowIso,
    };

    // Save to persistent file
    this.saveMessageToHistory(convId, conversation, message);

    // Emit live events ONLY ONCE to connected agents of THIS specific organization
    if (this.io) {
      console.log(`⚡ [SOCKET.IO] Emitting chat:incoming_message strictly to room: org:${orgId}`);
      this.io.to(`org:${orgId}`).emit('chat:incoming_message', { conversation, message });
    }

    // =========================================================================
    // Automated Bot Responder: "/start", "hi", "hello", "apk", "download"
    // (Disabled if external bot forwardWebhookUrl is active or disableAutoReply is set)
    // =========================================================================
    const isAutoReplyDisabled = this.config?.disableAutoReply || !!this.config?.forwardWebhookUrl;

    if (!isAutoReplyDisabled && !callback) {
      const lowerText = text.trim().toLowerCase();
      const isStartCmd = lowerText.startsWith('/start');
      const isGreeting = lowerText === 'hi' || lowerText === 'hello' || lowerText === 'hey' || lowerText.includes('မင်္ဂလာပါ');
      const isApkQuery =
        lowerText.includes('apk') ||
        lowerText.includes('app') ||
        lowerText.includes('download') ||
        lowerText.includes('လင့်') ||
        lowerText.includes('လင့်') ||
        lowerText.includes('ဒေါင်း');

      if (isStartCmd || isGreeting || isApkQuery) {
        const apkUrl = process.env.APK_DOWNLOAD_URL || 'https://tinyurl.com/chatechat-app';
        const webUrl = 'https://chatechat.onrender.com';

        const replyText = `မင်္ဂလာပါခင်ဗျာ 🙏 <b>ChateChat (ချိတ်ချက်)</b> မှ နွေးထွေးစွာ ကြိုဆိုပါသည်! 📱

Android ဖုန်းအတွက် Mobile App (APK) အား အောက်ပါ Short Link မှတစ်ဆင့် တိုက်ရိုက် ရယူနိုင်ပါပြီခင်ဗျာ -

📲 <b>APK ဒေါင်းလုဒ် Short Link:</b>
${apkUrl}

🌐 <b>Web Dashboard ဖြင့် တိုက်ရိုက်သုံးရန်:</b>
${webUrl}

စတင်အသုံးပြုရန် အောက်ပါ ခလုတ်ကို နှိပ်၍လည်း Download ဆွဲနိုင်ပါသည်ခင်ဗျာ။ 👇`;

        const replyMarkup = {
          inline_keyboard: [
            [
              {
                text: '📲 Download Android APK',
                url: apkUrl,
              },
            ],
            [
              {
                text: '🌐 Open Web App',
                url: webUrl,
              },
            ],
          ],
        };

        console.log(`🤖 [TELEGRAM BOT AUTO-REPLY] Sending APK link & Welcome to Chat ID: ${chatId}`);
        this.sendMessage(chatId, replyText, 'ChateChat Bot', replyMarkup).catch((e) =>
          console.warn('⚠️ Telegram auto-reply warning:', e)
        );
      }
    }
  }

  /**
   * Relay / Forward raw Telegram Update to external bot server
   */
  private async forwardUpdateToExternalBot(update: any, forwardUrl: string) {
    try {
      console.log(`🔄 [TELEGRAM RELAY] Forwarding raw update to: ${forwardUrl}`);
      const res = await fetch(forwardUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChateChat-Relay/1.0',
          'X-ChateChat-Relay': 'true',
        },
        body: JSON.stringify(update),
        signal: AbortSignal.timeout(10000),
      });
      console.log(`✅ [TELEGRAM RELAY SUCCESS] Forwarded to ${forwardUrl} -> Status: ${res.status}`);
    } catch (err: any) {
      console.warn(`⚠️ [TELEGRAM RELAY ERROR] Could not forward to ${forwardUrl}:`, err.message);
    }
  }

  /**
   * Persist incoming messages to telegram-chats.json
   */
  private saveMessageToHistory(convId: string, conv: any, msg: any) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      let history: Record<string, { conv: any; messages: any[] }> = {};
      if (fs.existsSync(CHATS_FILE)) {
        try {
          history = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
        } catch {}
      }

      if (!history[convId]) {
        history[convId] = { conv, messages: [msg] };
      } else {
        history[convId].conv = { ...history[convId].conv, ...conv };
        const messages = history[convId].messages || [];
        const existingIdx = messages.findIndex(
          (m) =>
            m.id === msg.id ||
            (msg.clientMessageId && (m.id === msg.clientMessageId || m.clientMessageId === msg.clientMessageId)) ||
            (m.senderType === msg.senderType &&
              m.content?.trim() === msg.content?.trim() &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1500)
        );
        if (existingIdx >= 0) {
          messages[existingIdx] = { ...messages[existingIdx], ...msg };
        } else {
          messages.push(msg);
        }
        history[convId].messages = messages;
      }

      fs.writeFileSync(CHATS_FILE, JSON.stringify(history, null, 2), 'utf-8');
    } catch (e) {
      console.warn('⚠️ Could not save message to telegram-chats.json:', e);
    }
  }

  public getSavedChats(organizationId?: string) {
    try {
      if (fs.existsSync(CHATS_FILE)) {
        const history = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
        const dedupeMessages = (msgList: any[]) => {
          if (!Array.isArray(msgList)) return [];
          const clean: any[] = [];
          for (const m of msgList) {
            const isDup = clean.some(
              (prev) =>
                prev.id === m.id ||
                (m.clientMessageId && prev.clientMessageId === m.clientMessageId) ||
                (prev.senderType === m.senderType &&
                  prev.content?.trim() === m.content?.trim() &&
                  Math.abs(new Date(prev.createdAt).getTime() - new Date(m.createdAt).getTime()) < 1500)
            );
            if (!isDup) clean.push(m);
          }
          return clean;
        };

        if (!organizationId || organizationId === 'all') {
          for (const k of Object.keys(history)) {
            if (history[k]?.messages) history[k].messages = dedupeMessages(history[k].messages);
          }
          return history;
        }
        // Multi-tenant: filter chats strictly for the requesting organization
        const filtered: Record<string, { conv: any; messages: any[] }> = {};
        for (const [key, value] of Object.entries(history as Record<string, { conv: any; messages: any[] }>)) {
          const convOrg = value?.conv?.organizationId || 'org_royal';
          if (convOrg === organizationId) {
            filtered[key] = {
              ...value,
              messages: dedupeMessages(value?.messages || []),
            };
          }
        }
        return filtered;
      }
    } catch {}
    return {};
  }

  public getSavedConversation(convId: string): any | null {
    try {
      if (fs.existsSync(CHATS_FILE)) {
        const history = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
        return history[convId]?.conv || null;
      }
    } catch {}
    return null;
  }

  public setHandoverStatus(
    chatId: string,
    status: 'BOT_HANDLING' | 'TRANSFERRED_TO_AGENT' | 'RESOLVED',
    agentName?: string,
    isAutoHandback?: boolean
  ) {
    const convId = `conv_tg_${chatId}`;
    const nowIso = new Date().toISOString();
    const updatePayload: any = { handoverStatus: status };
    if (agentName) updatePayload.assignedAgentName = agentName;
    if (status === 'TRANSFERRED_TO_AGENT') updatePayload.lastAgentMessageAt = nowIso;

    const sysMsg = {
      id: `sys_${Date.now()}`,
      conversationId: convId,
      senderType: 'SYSTEM',
      senderName: 'ChateChat System',
      type: 'TEXT',
      content: status === 'TRANSFERRED_TO_AGENT'
        ? `👨‍💻 အေးဂျင့် ${agentName || 'မသူဇာ'} မှ တာဝန်ယူလိုက်ပါပြီ (AI Bot ခေတ္တ အသံတိတ်ပါမည်)`
        : isAutoHandback
        ? `🤖 အေးဂျင့် ၃ မိနစ်ခန့် မအားလပ်သဖြင့် AI Bot သို့ အလိုအလျောက် ပြန်လည်လွှဲပြောင်းပေးလိုက်ပါသည်`
        : `🤖 စကားစမြည် ပြီးစီးသဖြင့် AI Bot သို့ ပြန်လည်လွှဲပြောင်းပေးလိုက်ပါပြီ`,
      isInternal: true,
      createdAt: nowIso,
    };
    this.saveMessageToHistory(convId, updatePayload, sysMsg);

    if (this.io) {
      const orgId = this.config?.organizationId || 'org_royal';
      this.io.to(`org:${orgId}`).emit('chat:incoming_message', {
        conversation: { id: convId, handoverStatus: status },
        message: sysMsg,
      });
    }

    return { success: true, handoverStatus: status };
  }

  /**
   * Record external AI / Bot outbound replies directly into ChateChat conversation history
   */
  public recordBotReply(chatId: string, text: string, botName = 'AI Bot', organizationId?: string) {
    const convId = `conv_tg_${chatId}`;
    const nowIso = new Date().toISOString();
    const botMsg = {
      id: `msg_bot_${Date.now()}`,
      conversationId: convId,
      senderType: 'BOT',
      senderName: botName,
      type: 'TEXT',
      content: text,
      isInternal: false,
      createdAt: nowIso,
    };
    this.saveMessageToHistory(convId, { lastMessageSnippet: text, lastMessageAt: nowIso }, botMsg);

    if (this.io) {
      const orgId = organizationId || this.config?.organizationId || 'org_royal';
      const payload = {
        conversation: { id: convId, lastMessageSnippet: text, lastMessageAt: nowIso },
        message: botMsg,
        conversationId: convId,
      };
      this.io.to(`org:${orgId}`).emit('chat:outgoing_message', payload);
    }

    return { success: true };
  }

  /**
   * Send outbound reply directly to the customer on Telegram!
   */
  public async sendMessage(
    chatId: string,
    text: string,
    agentName: string = 'ChateChat Bot',
    replyMarkup?: any,
    clientMessageId?: string
  ): Promise<{ success: boolean; externalMessageId?: string; clientMessageId?: string; error?: string }> {
    if (!this.config?.token) {
      return { success: false, error: 'Telegram Bot is not connected or active' };
    }

    if (clientMessageId) {
      const lastSentTime = this.sentClientMessageIds.get(clientMessageId);
      if (lastSentTime && Date.now() - lastSentTime < 30000) {
        console.log(`🛡️ [TELEGRAM DEDUPE] Dropping duplicate send request for clientMessageId: ${clientMessageId}`);
        return { success: true, clientMessageId };
      }
      this.sentClientMessageIds.set(clientMessageId, Date.now());
      if (this.sentClientMessageIds.size > 500) {
        const threshold = Date.now() - 60000;
        for (const [k, v] of this.sentClientMessageIds.entries()) {
          if (v < threshold) this.sentClientMessageIds.delete(k);
        }
      }
    }

    try {
      console.log(`📤 [TELEGRAM OUTBOUND] Sending reply to Chat ID [${chatId}]: "${text.slice(0, 50)}..."`);
      const bodyPayload: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      };
      if (replyMarkup) {
        bodyPayload.reply_markup = replyMarkup;
      }

      let data = (await telegramFetch(`https://api.telegram.org/bot${this.config.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload,
      })) as any;

      // Handle Telegram Rate Limit (429 Too Many Requests) with automatic retry
      if (!data?.ok && data?.error_code === 429) {
        const retryAfterMs = ((data.parameters?.retry_after || 1) * 1000) + 200;
        console.warn(`⏳ [TELEGRAM RATE LIMIT 429] Waiting ${retryAfterMs}ms before retrying for Chat [${chatId}]...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
        data = (await telegramFetch(`https://api.telegram.org/bot${this.config.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyPayload,
        })) as any;
      }

      // If HTML parse fails, retry with plain text
      if (!data?.ok && (data?.description?.includes('can\'t parse entities') || data?.description?.includes('entity'))) {
        const plainPayload: any = {
          chat_id: chatId,
          text: text.replace(/<[^>]*>?/gm, ''),
        };
        if (replyMarkup) {
          plainPayload.reply_markup = replyMarkup;
        }

        data = (await telegramFetch(`https://api.telegram.org/bot${this.config.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: plainPayload,
        })) as any;

        if (!data?.ok && data?.error_code === 429) {
          const retryAfterMs = ((data.parameters?.retry_after || 1) * 1000) + 200;
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
          data = (await telegramFetch(`https://api.telegram.org/bot${this.config.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: plainPayload,
          })) as any;
        }
      }

      if (data && data.ok) {
        console.log(`✅ [TELEGRAM OUTBOUND SUCCESS] Delivered to Telegram Message ID: ${data.result?.message_id}`);
        const convId = `conv_tg_${chatId}`;
        const nowIso = new Date().toISOString();
        const isHumanAgent = agentName !== 'ChateChat Bot' && !agentName.toLowerCase().includes('bot');

        const outId = data.result?.message_id ? `msg_agent_${data.result.message_id}` : `msg_agent_${Date.now()}`;
        const agentMsg = {
          id: outId,
          clientMessageId,
          conversationId: convId,
          senderType: isHumanAgent ? 'AGENT' : 'BOT',
          senderName: agentName,
          type: 'TEXT',
          content: text,
          isInternal: false,
          createdAt: nowIso,
        };

        const convUpdates: any = {
          lastMessageSnippet: text,
          lastMessageAt: nowIso,
        };
        if (isHumanAgent) {
          convUpdates.handoverStatus = 'TRANSFERRED_TO_AGENT';
          convUpdates.assignedAgentName = agentName;
          convUpdates.lastAgentMessageAt = nowIso;
        }

        this.saveMessageToHistory(convId, convUpdates, agentMsg);

        if (this.io) {
          const orgId = this.config?.organizationId || 'org_royal';
          const payload = {
            conversation: { id: convId, lastMessageSnippet: text, lastMessageAt: nowIso, handoverStatus: convUpdates.handoverStatus || 'BOT_HANDLING' },
            message: agentMsg,
            conversationId: convId,
            clientMessageId,
          };
          this.io.to(`org:${orgId}`).emit('chat:outgoing_message', payload);
        }

        return {
          success: true,
          externalMessageId: data.result?.message_id?.toString(),
          clientMessageId,
        };
      }

      return {
        success: false,
        error: data?.description || 'Failed to send message via Telegram',
      };
    } catch (err: any) {
      console.error(`❌ [TELEGRAM OUTBOUND ERROR]:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Automatically resume polling if active bot exists on startup
   */
  public autoResume(io: SocketIOServer) {
    this.io = io;
    // Check if bot was explicitly deactivated/paused
    if (this.config && this.config.isActive === false) {
      console.log('⏸️ [TELEGRAM] Bot is paused/inactive (isActive: false). Skipping autoResume.');
      return;
    }
    const envToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_FINANCE_BOT_TOKEN;
    const tokenToUse = this.config?.token || envToken?.trim();
    // Only auto-resume if token exists AND isActive is explicitly true
    if (tokenToUse && this.config?.isActive) {
      console.log(`🔄 [TELEGRAM] Auto-resuming Telegram Bot connection (${this.config?.mode || 'POLLING'})...`);
      this.start(
        tokenToUse,
        this.config?.organizationId || 'org_royal',
        io,
        {
          forwardWebhookUrl: this.config?.forwardWebhookUrl,
          disableAutoReply: this.config?.disableAutoReply,
          mode: this.config?.mode,
        }
      ).catch((e) => {
        console.warn('⚠️ Telegram auto-resume warning:', e.message);
      });
    } else {
      console.log('⏸️ [TELEGRAM] No active Telegram Bot configured to auto-resume.');
    }
  }
}

export const telegramPollingService = new TelegramPollingService();
