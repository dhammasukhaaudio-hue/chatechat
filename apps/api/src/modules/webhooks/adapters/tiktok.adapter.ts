import crypto from 'crypto';
import { IChannelAdapter, ChannelConnection } from './base.adapter';
import { ChannelType, MessageType, NormalizedInboundMessage, OutboundMessagePayload } from '@chatechat/shared-types';

export class TikTokAdapter implements IChannelAdapter {
  public readonly channelType: ChannelType = 'TIKTOK';

  /**
   * Verify TikTok Business Webhook Signature
   */
  public verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string | Buffer,
    credentials: Record<string, any>
  ): boolean {
    const signature = (headers['tiktok-signature'] || headers['x-tiktok-signature']) as string;
    const clientSecret = credentials.clientSecret;

    if (!clientSecret) return true;
    if (!signature) return false;

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const calculatedSignature = crypto.createHmac('sha256', clientSecret).update(bodyString).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Parse TikTok Direct Message Events
   */
  public parseInbound(body: any, channel: ChannelConnection): NormalizedInboundMessage[] {
    const results: NormalizedInboundMessage[] = [];

    // TikTok events usually wrap under event or entry
    const events = Array.isArray(body.entry) ? body.entry : [body];

    for (const item of events) {
      const msgEvent = item.event || item.message || item;
      const senderOpenId = msgEvent.from_user_id || msgEvent.sender_id || item.from_user_id;
      const conversationId = msgEvent.conversation_id || senderOpenId;
      const msgId = msgEvent.msg_id || msgEvent.message_id || `tt_${Date.now()}`;

      if (!senderOpenId) continue;

      let msgType: MessageType = 'TEXT';
      let text = msgEvent.content?.text || msgEvent.text || '';
      let mediaUrl: string | undefined;

      if (msgEvent.content?.image_url) {
        msgType = 'IMAGE';
        mediaUrl = msgEvent.content.image_url;
      } else if (msgEvent.content?.video_url) {
        msgType = 'VIDEO';
        mediaUrl = msgEvent.content.video_url;
      }

      results.push({
        channelType: 'TIKTOK',
        channelIdentifier: channel.identifier,
        externalThreadId: conversationId,
        externalMessageId: msgId,
        senderExternalId: senderOpenId,
        senderName: msgEvent.sender_name || 'TikTok User',
        type: msgType,
        text,
        mediaUrl,
        rawPayload: item,
        timestamp: new Date(msgEvent.create_time ? msgEvent.create_time * 1000 : Date.now()),
      });
    }

    return results;
  }

  /**
   * Send Message via TikTok Business Messaging API
   */
  public async sendMessage(
    credentials: Record<string, any>,
    payload: OutboundMessagePayload
  ): Promise<{ success: boolean; externalMessageId?: string; error?: string }> {
    const accessToken = credentials.accessToken;
    const businessId = credentials.businessId;

    if (!accessToken) {
      return { success: false, error: 'Missing TikTok accessToken in credentials' };
    }

    const url = 'https://business-api.tiktok.com/open_api/v1.3/im/message/send/';

    const bodyPayload: any = {
      business_id: businessId,
      to_user_id: payload.recipientExternalId,
      msg_type: payload.type === 'IMAGE' ? 'image' : 'text',
      content: payload.type === 'IMAGE' && payload.mediaUrl
        ? { image_url: payload.mediaUrl }
        : { text: payload.text },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': accessToken,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json() as any;

      if (!response.ok || data.code !== 0) {
        return {
          success: false,
          error: data.message || `TikTok API Error code ${data.code}`,
        };
      }

      return {
        success: true,
        externalMessageId: data.data?.msg_id,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch TikTok message' };
    }
  }
}

export const tikTokAdapter = new TikTokAdapter();
