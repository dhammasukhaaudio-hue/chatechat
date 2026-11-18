import crypto from 'crypto';
import { IChannelAdapter, ChannelConnection } from './base.adapter';
import { ChannelType, MessageType, NormalizedInboundMessage, OutboundMessagePayload } from '@chatechat/shared-types';

export class ViberAdapter implements IChannelAdapter {
  public readonly channelType: ChannelType = 'VIBER';

  /**
   * Verify Viber HMAC-SHA256 Content Signature
   */
  public verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
    credentials: Record<string, any>
  ): boolean {
    const signature = headers['x-viber-content-signature'] as string;
    const authToken = credentials.authToken;

    if (!authToken) return true;
    if (!signature) return false;

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const calculatedSignature = crypto.createHmac('sha256', authToken).update(bodyString).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Parse Viber Webhook Callback
   */
  public parseInbound(body: any, channel: ChannelConnection): NormalizedInboundMessage[] {
    const results: NormalizedInboundMessage[] = [];

    // Viber sends a verification handshake event on setup
    if (body.event === 'webhook') {
      return results;
    }

    if (body.event === 'message' && body.sender && body.message) {
      const senderId = body.sender.id;
      const senderName = body.sender.name || 'Viber User';
      const messageToken = body.message_token?.toString() || `vb_${Date.now()}`;

      let msgType: MessageType = 'TEXT';
      let text = body.message.text || '';
      let mediaUrl: string | undefined = body.message.media;
      let senderPhone: string | undefined;

      switch (body.message.type) {
        case 'picture':
          msgType = 'IMAGE';
          break;
        case 'video':
          msgType = 'VIDEO';
          break;
        case 'file':
          msgType = 'FILE';
          break;
        case 'contact':
          senderPhone = body.message.contact?.phone_number;
          text = `[Shared Contact] ${body.message.contact?.name || ''}: ${senderPhone || ''}`;
          break;
        case 'sticker':
          msgType = 'STICKER';
          text = '[Viber Sticker]';
          break;
        default:
          msgType = 'TEXT';
      }

      results.push({
        channelType: 'VIBER',
        channelIdentifier: channel.identifier,
        externalThreadId: senderId,
        externalMessageId: messageToken,
        senderExternalId: senderId,
        senderName,
        senderPhone,
        type: msgType,
        text,
        mediaUrl,
        rawPayload: body,
        timestamp: new Date(body.timestamp || Date.now()),
      });
    }

    return results;
  }

  /**
   * Send Message via Viber REST API
   */
  public async sendMessage(
    credentials: Record<string, any>,
    payload: OutboundMessagePayload
  ): Promise<{ success: boolean; externalMessageId?: string; error?: string }> {
    const authToken = credentials.authToken;
    const senderName = credentials.senderName || payload.agentName || 'ChateChat Support';

    if (!authToken) {
      return { success: false, error: 'Missing Viber authToken in credentials' };
    }

    const url = 'https://chatapi.viber.com/pa/send_message';

    const bodyPayload: any = {
      receiver: payload.recipientExternalId,
      min_api_version: 7,
      sender: {
        name: senderName,
      },
    };

    if (payload.type === 'IMAGE' && payload.mediaUrl) {
      bodyPayload.type = 'picture';
      bodyPayload.text = payload.text || '';
      bodyPayload.media = payload.mediaUrl;
    } else {
      bodyPayload.type = 'text';
      bodyPayload.text = payload.text;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Viber-Auth-Token': authToken,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json() as any;

      if (!response.ok || data.status !== 0) {
        return {
          success: false,
          error: data.status_message || `Viber API Error code ${data.status}`,
        };
      }

      return {
        success: true,
        externalMessageId: data.message_token?.toString(),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch Viber message' };
    }
  }
}

export const viberAdapter = new ViberAdapter();
