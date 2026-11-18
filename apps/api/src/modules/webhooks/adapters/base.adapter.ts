import { ChannelType, NormalizedInboundMessage, OutboundMessagePayload } from '@chatechat/shared-types';

export interface ChannelConnection {
  id: string;
  organizationId: string;
  channelType: ChannelType;
  accountName?: string;
  pageId?: string | null;
  credentials?: any;
  isActive?: boolean;
  [key: string]: any;
}

export interface IChannelAdapter {
  readonly channelType: ChannelType;

  /**
   * Verify inbound webhook authenticity (HMAC signature or token check)
   */
  verifyWebhook(reqHeaders: Record<string, string | string[] | undefined>, rawBody: string | Buffer, credentials: Record<string, any>): boolean;

  /**
   * Parse vendor-specific webhook payload into normalized ChateChat messages
   */
  parseInbound(body: any, channel: ChannelConnection): NormalizedInboundMessage[];

  /**
   * Send outbound reply message to customer via external API
   */
  sendMessage(credentials: Record<string, any>, payload: OutboundMessagePayload): Promise<{ success: boolean; externalMessageId?: string; error?: string }>;
}
