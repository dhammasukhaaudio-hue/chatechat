import { IChannelAdapter, ChannelConnection } from './base.adapter';
import { ChannelType, MessageType, NormalizedInboundMessage, OutboundMessagePayload } from '@chatechat/shared-types';

export class TelegramAdapter implements IChannelAdapter {
  public readonly channelType: ChannelType = 'TELEGRAM';

  /**
   * Verify Telegram secret token header
   */
  public verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    _rawBody: string | Buffer,
    credentials: Record<string, any>
  ): boolean {
    const secretHeader = headers['x-telegram-bot-api-secret-token'] as string;
    const expectedSecret = credentials.webhookSecret;

    if (!expectedSecret) return true; // Optional if not set
    return secretHeader === expectedSecret;
  }

  /**
   * Parse Telegram Update object
   */
  public parseInbound(update: any, channel: ChannelConnection): NormalizedInboundMessage[] {
    const results: NormalizedInboundMessage[] = [];
    const message = update.message || update.edited_message;

    if (!message || !message.chat) {
      return results;
    }

    const chatId = message.chat.id.toString();
    const senderName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || message.from?.username || 'Telegram User';
    const messageId = `tg_${message.message_id}`;

    let msgType: MessageType = 'TEXT';
    let text = message.text || message.caption || '';
    let mediaUrl: string | undefined;
    let senderPhone: string | undefined;

    // Contact sharing (very common in Myanmar e-commerce to share phone)
    if (message.contact && message.contact.phone_number) {
      senderPhone = message.contact.phone_number.replace(/\s+/g, '');
      text = `[Shared Contact] Phone: ${senderPhone}`;
    } else if (Array.isArray(message.photo) && message.photo.length > 0) {
      msgType = 'IMAGE';
      // Telegram sends multiple photo sizes, last element is highest resolution
      const largestPhoto = message.photo[message.photo.length - 1];
      mediaUrl = `tg_file_id:${largestPhoto.file_id}`;
    } else if (message.voice || message.audio) {
      msgType = 'AUDIO';
      mediaUrl = `tg_file_id:${(message.voice || message.audio).file_id}`;
    } else if (message.video) {
      msgType = 'VIDEO';
      mediaUrl = `tg_file_id:${message.video.file_id}`;
    } else if (message.document) {
      msgType = 'FILE';
      mediaUrl = `tg_file_id:${message.document.file_id}`;
    } else if (message.sticker) {
      msgType = 'STICKER';
      text = message.sticker.emoji || '[Sticker]';
    }

    results.push({
      channelType: 'TELEGRAM',
      channelIdentifier: channel.identifier,
      externalThreadId: chatId,
      externalMessageId: messageId,
      senderExternalId: chatId,
      senderName,
      senderPhone,
      type: msgType,
      text,
      mediaUrl,
      rawPayload: update,
      timestamp: new Date(message.date ? message.date * 1000 : Date.now()),
    });

    return results;
  }

  /**
   * Send Message via Telegram Bot API
   */
  public async sendMessage(
    credentials: Record<string, any>,
    payload: OutboundMessagePayload
  ): Promise<{ success: boolean; externalMessageId?: string; error?: string }> {
    const botToken = credentials.botToken;
    if (!botToken) {
      return { success: false, error: 'Missing Telegram botToken in credentials' };
    }

    const endpoint = payload.type === 'IMAGE' && payload.mediaUrl ? 'sendPhoto' : 'sendMessage';
    const url = `https://api.telegram.org/bot${botToken}/${endpoint}`;

    const bodyPayload: any = {
      chat_id: payload.recipientExternalId,
    };

    if (endpoint === 'sendPhoto') {
      bodyPayload.photo = payload.mediaUrl;
      bodyPayload.caption = payload.text;
    } else {
      bodyPayload.text = payload.text;
      bodyPayload.parse_mode = 'HTML';

      // Attach Telegram Native Contact Share Keyboard when asking for phone number
      if (
        payload.text.includes('ဖုန်းနံပါတ်') ||
        payload.text.toLowerCase().includes('phone') ||
        payload.metadata?.requestContact
      ) {
        bodyPayload.reply_markup = {
          keyboard: [
            [
              {
                text: '📱 ဖုန်းနံပါတ် ပေးပို့ရန် / Share My Phone number',
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        };
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json() as any;

      if (!response.ok || !data.ok) {
        return {
          success: false,
          error: data.description || `Telegram API Error ${response.status}`,
        };
      }

      return {
        success: true,
        externalMessageId: data.result?.message_id?.toString(),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch Telegram message' };
    }
  }
}

export const telegramAdapter = new TelegramAdapter();
