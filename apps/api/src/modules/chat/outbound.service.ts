import { prisma } from '@chatechat/database';
import { ChannelType, MessageType, OutboundMessagePayload, SOCKET_EVENTS } from '@chatechat/shared-types';
import { messengerAdapter } from '../webhooks/adapters/messenger.adapter';
import { telegramAdapter } from '../webhooks/adapters/telegram.adapter';
import { viberAdapter } from '../webhooks/adapters/viber.adapter';
import { tikTokAdapter } from '../webhooks/adapters/tiktok.adapter';
import { IChannelAdapter } from '../webhooks/adapters/base.adapter';

export class OutboundService {
  private static adapters: Record<ChannelType, IChannelAdapter> = {
    MESSENGER: messengerAdapter,
    TELEGRAM: telegramAdapter,
    VIBER: viberAdapter,
    TIKTOK: tikTokAdapter,
    WEB_WIDGET: messengerAdapter,
  };

  /**
   * Dispatch an outbound message from an Agent or AI Bot to an external platform
   */
  public static async dispatchOutboundMessage(
    conversationId: string,
    sender: {
      type: 'AGENT' | 'BOT' | 'SYSTEM';
      id?: string;
      name: string;
    },
    content: string,
    type: MessageType = 'TEXT',
    mediaUrl?: string,
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    // 1. Fetch conversation and connected channel credentials
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        channelConnection: true,
        customer: true,
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const channel = conversation.channelConnection;
    if (!channel || !channel.isActive) {
      throw new Error(`Channel [${channel?.accountName || 'Unknown'}] is inactive or disconnected.`);
    }

    const adapter = this.adapters[conversation.channelType];
    const credentials = (channel.credentials as Record<string, any>) || {};

    const outboundPayload: OutboundMessagePayload = {
      conversationId: conversation.id,
      channelType: conversation.channelType,
      recipientExternalId: conversation.externalThreadId,
      type,
      text: content,
      mediaUrl,
      agentName: sender.name,
    };

    // 2. Dispatch via external API adapter
    const dispatchResult = await adapter.sendMessage(credentials, outboundPayload);

    if (!dispatchResult.success) {
      throw new Error(`Failed to send message to ${conversation.channelType}: ${dispatchResult.error}`);
    }

    // 3. Persist outbound message in database
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: sender.type,
        senderId: sender.id || null,
        senderName: sender.name,
        type,
        content,
        mediaUrl,
        externalMessageId: dispatchResult.externalMessageId,
      },
    });

    // 4. Update Conversation status and snippet
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageSnippet: content,
        lastMessageAt: new Date(),
        unreadCount: 0, // Reset when agent replies
      },
    });

    // 5. Emit real-time event to Agent Dashboard
    if (socketEmitter) {
      socketEmitter(SOCKET_EVENTS.OUTGOING_MESSAGE, `org:${conversation.organizationId}`, {
        message: savedMessage,
        conversationId: conversation.id,
      });
    }

    return savedMessage;
  }
}
