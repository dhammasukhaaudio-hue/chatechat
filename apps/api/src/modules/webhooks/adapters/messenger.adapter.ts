import crypto from 'crypto';
import { IChannelAdapter, ChannelConnection } from './base.adapter';
import { ChannelType, MessageType, NormalizedInboundMessage, OutboundMessagePayload } from '@chatechat/shared-types';

export class MessengerAdapter implements IChannelAdapter {
  public readonly channelType: ChannelType = 'MESSENGER';

  /**
   * Verify Facebook HMAC SHA-256 Signature (x-hub-signature-256)
   */
  public verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
    credentials: Record<string, any>
  ): boolean {
    const signature = headers['x-hub-signature-256'] as string;
    const appSecret = credentials.appSecret;

    if (!appSecret) return true; // If no secret configured, bypass (for initial testing)
    if (!signature) return false;

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'))
      .digest('hex')}`;

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Parse Meta Messenger Webhook events
   */
  public parseInbound(body: any, channel: ChannelConnection): NormalizedInboundMessage[] {
    const results: NormalizedInboundMessage[] = [];
    if (body.object !== 'page' || !Array.isArray(body.entry)) {
      return results;
    }

    for (const entry of body.entry) {
      if (!Array.isArray(entry.messaging)) continue;

      for (const event of entry.messaging) {
        // Ignore echo messages sent by the page itself
        if (event.message?.is_echo) continue;

        const senderPsid = event.sender?.id;
        const recipientPageId = event.recipient?.id;
        if (!senderPsid) continue;

        // 1. Text Message or Attachment
        if (event.message) {
          const mid = event.message.mid || `fb_${Date.now()}_${Math.random()}`;
          let msgType: MessageType = 'TEXT';
          let mediaUrl: string | undefined;

          if (Array.isArray(event.message.attachments) && event.message.attachments.length > 0) {
            const attachment = event.message.attachments[0];
            mediaUrl = attachment.payload?.url;
            switch (attachment.type) {
              case 'image':
                msgType = 'IMAGE';
                break;
              case 'audio':
                msgType = 'AUDIO';
                break;
              case 'video':
                msgType = 'VIDEO';
                break;
              default:
                msgType = 'FILE';
            }
          }

          results.push({
            channelType: 'MESSENGER',
            channelIdentifier: channel.identifier || recipientPageId,
            externalThreadId: senderPsid,
            externalMessageId: mid,
            senderExternalId: senderPsid,
            type: msgType,
            text: event.message.text || '',
            mediaUrl,
            rawPayload: event,
            timestamp: new Date(event.timestamp || Date.now()),
          });
        }
        // 2. Postback Buttons (Get Started, Persistent Menu)
        else if (event.postback) {
          results.push({
            channelType: 'MESSENGER',
            channelIdentifier: channel.identifier || recipientPageId,
            externalThreadId: senderPsid,
            externalMessageId: `postback_${Date.now()}`,
            senderExternalId: senderPsid,
            type: 'TEXT',
            text: event.postback.title || event.postback.payload || '',
            rawPayload: event,
            timestamp: new Date(event.timestamp || Date.now()),
          });
        }
      }
    }

    return results;
  }

  /**
   * Send Message via Meta Graph API v20.0
   */
  public async sendMessage(
    credentials: Record<string, any>,
    payload: OutboundMessagePayload
  ): Promise<{ success: boolean; externalMessageId?: string; error?: string }> {
    const pageAccessToken = credentials.pageAccessToken;
    if (!pageAccessToken) {
      return { success: false, error: 'Missing pageAccessToken in channel credentials' };
    }

    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;

    const bodyPayload: any = {
      recipient: { id: payload.recipientExternalId },
      messaging_type: 'RESPONSE',
    };

    if (payload.mediaUrl && payload.type === 'IMAGE') {
      bodyPayload.message = {
        attachment: {
          type: 'image',
          payload: { url: payload.mediaUrl, is_reusable: true },
        },
      };
    } else {
      bodyPayload.message = { text: payload.text };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json() as any;

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || `Facebook Graph API Error ${response.status}`,
        };
      }

      return {
        success: true,
        externalMessageId: data.message_id,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch Messenger message' };
    }
  }
}

export const messengerAdapter = new MessengerAdapter();
