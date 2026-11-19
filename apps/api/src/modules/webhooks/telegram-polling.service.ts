import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

export interface TelegramBotConfig {
  token: string;
  botId: string;
  username: string;
  firstName: string;
  organizationId: string;
  isActive: boolean;
  lastOffset: number;
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

  constructor() {
    this.loadConfig();
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

  public getStatus() {
    return {
      isRunning: this.isRunning,
      botUsername: this.config?.username ? `@${this.config.username}` : null,
      botName: this.config?.firstName || null,
      botId: this.config?.botId || null,
      isActive: !!this.config?.isActive,
      lastMessageTimestamp: this.lastMessageTimestamp,
      lastOffset: this.config?.lastOffset || 0,
    };
  }

  public getSavedToken(): string | null {
    return this.config?.token || null;
  }

  /**
   * Start polling for a specific Telegram Bot Token
   */
  public async start(token: string, organizationId = 'org_royal', io?: SocketIOServer): Promise<{ success: boolean; botUsername?: string; error?: string }> {
    if (io) this.io = io;
    const cleanToken = token.trim().replace(/^["']|["']$/g, '').trim();

    try {
      // 1. Validate token with getMe
      console.log(`🤖 [TELEGRAM] Verifying Bot Token with Telegram API...`);
      const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, { signal: AbortSignal.timeout(8000) });
      const meData = await meRes.json() as any;

      if (!meData || !meData.ok || !meData.result) {
        return {
          success: false,
          error: meData?.description || 'Telegram Bot Token မှားယွင်းနေပါသည်။ Token မှန်ကန်ကြောင်း ပြန်စစ်ပါ',
        };
      }

      const bot = meData.result;
      console.log(`✅ [TELEGRAM] Bot Verified: @${bot.username} (${bot.first_name})`);

      // 2. CRITICAL: Delete any existing webhook so Telegram allows getUpdates long polling
      try {
        console.log(`🔄 [TELEGRAM] Deleting any existing webhook to enable 24/7 Long Polling...`);
        const delRes = await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook?drop_pending_updates=false`);
        const delData = await delRes.json() as any;
        console.log(`📡 [TELEGRAM] Webhook status reset:`, delData?.ok ? 'Ready for Long Polling' : delData?.description);
      } catch (delErr) {
        console.warn('⚠️ [TELEGRAM] deleteWebhook call warning:', delErr);
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
      };
      this.saveConfig();

      // 4. Start polling loop
      this.stop();
      this.isRunning = true;
      this.pollingErrorCount = 0;
      this.runPollingLoop();

      return {
        success: true,
        botUsername: `@${bot.username}`,
      };
    } catch (err: any) {
      console.error('❌ [TELEGRAM] Failed to start polling:', err.message);
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
  public async processTelegramUpdate(update: any) {
    const msg = update.message || update.edited_message;
    if (!msg || !msg.chat) return;

    const chatId = msg.chat.id.toString();
    const senderFirst = msg.from?.first_name || '';
    const senderLast = msg.from?.last_name || '';
    const senderName = [senderFirst, senderLast].filter(Boolean).join(' ') || msg.from?.username || `Telegram Customer (${chatId.slice(-4)})`;
    const username = msg.from?.username ? `@${msg.from.username}` : '';

    let text = msg.text || msg.caption || '';
    let msgType = 'TEXT';
    let mediaUrl: string | undefined;

    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      msgType = 'IMAGE';
      text = text || '📷 [Customer ပေးပို့သော ဓာတ်ပုံ / Image]';
      const largest = msg.photo[msg.photo.length - 1];
      mediaUrl = `https://api.telegram.org/bot${this.config?.token}/getFile?file_id=${largest.file_id}`;
    } else if (msg.contact) {
      text = `📱 [ဖုန်းနံပါတ် မျှဝေသည်]: ${msg.contact.phone_number}`;
    } else if (msg.sticker) {
      text = msg.sticker.emoji ? `[Sticker: ${msg.sticker.emoji}]` : '[Sticker]';
    } else if (!text) {
      text = '[Media Message]';
    }

    const nowIso = new Date().toISOString();
    this.lastMessageTimestamp = nowIso;
    const convId = `conv_tg_${chatId}`;
    const custId = `cust_tg_${chatId}`;
    const messageId = `msg_tg_${msg.message_id}_${Date.now()}`;

    console.log(`📨 [TELEGRAM LIVE INBOUND] From: ${senderName} (${chatId}) - "${text}"`);

    // Prepare Unified Conversation Object
    const conversation = {
      id: convId,
      organizationId: this.config?.organizationId || 'org_royal',
      customerId: custId,
      channelConnectionId: `chan_tg_${this.config?.botId || 'active'}`,
      status: 'ACTIVE',
      handoverStatus: 'HUMAN_REQUESTED',
      channelType: 'TELEGRAM',
      externalThreadId: chatId,
      unreadCount: 1,
      lastMessageSnippet: text,
      lastMessageAt: nowIso,
      customer: {
        id: custId,
        name: `${senderName}${username ? ` (${username})` : ''}`,
        phone: msg.contact?.phone_number || '',
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

    // Emit live events to all connected agents
    if (this.io) {
      console.log(`⚡ [SOCKET.IO] Emitting INCOMING_MESSAGE for conversation: ${convId}`);
      this.io.emit('chat:incoming_message', { conversation, message });
      this.io.emit('INCOMING_MESSAGE', { conversation, message });
      this.io.to(`org:${this.config?.organizationId || 'org_royal'}`).emit('chat:incoming_message', { conversation, message });
      this.io.to(`org:${this.config?.organizationId || 'org_royal'}`).emit('INCOMING_MESSAGE', { conversation, message });
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
        history[convId].messages.push(msg);
      }

      fs.writeFileSync(CHATS_FILE, JSON.stringify(history, null, 2), 'utf-8');
    } catch (e) {
      console.warn('⚠️ Could not save message to telegram-chats.json:', e);
    }
  }

  public getSavedChats() {
    try {
      if (fs.existsSync(CHATS_FILE)) {
        return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
      }
    } catch {}
    return {};
  }

  /**
   * Send outbound reply directly to the customer on Telegram!
   */
  public async sendMessage(chatId: string, text: string): Promise<{ success: boolean; externalMessageId?: string; error?: string }> {
    if (!this.config?.token) {
      return { success: false, error: 'Telegram Bot is not connected or active' };
    }

    try {
      console.log(`📤 [TELEGRAM OUTBOUND] Sending reply to Chat ID [${chatId}]: "${text}"`);
      const res = await fetch(`https://api.telegram.org/bot${this.config.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });

      const data = await res.json() as any;
      if (data && data.ok) {
        console.log(`✅ [TELEGRAM OUTBOUND SUCCESS] Delivered to Telegram Message ID: ${data.result?.message_id}`);
        return {
          success: true,
          externalMessageId: data.result?.message_id?.toString(),
        };
      }

      // If HTML parse fails, retry with plain text
      const plainRes = await fetch(`https://api.telegram.org/bot${this.config.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });
      const plainData = await plainRes.json() as any;
      if (plainData?.ok) {
        return { success: true, externalMessageId: plainData.result?.message_id?.toString() };
      }

      return {
        success: false,
        error: plainData?.description || data?.description || 'Failed to send message via Telegram',
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
    if (this.config?.token && this.config?.isActive) {
      console.log(`🔄 [TELEGRAM] Auto-resuming 24/7 Long Polling for @${this.config.username}...`);
      this.start(this.config.token, this.config.organizationId || 'org_royal', io).catch((e) => {
        console.warn('⚠️ Telegram auto-resume warning:', e.message);
      });
    }
  }
}

export const telegramPollingService = new TelegramPollingService();
