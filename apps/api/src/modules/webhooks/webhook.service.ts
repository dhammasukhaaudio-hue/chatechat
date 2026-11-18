import { prisma } from '@chatechat/database';
import { ChannelType, NormalizedInboundMessage, SOCKET_EVENTS } from '@chatechat/shared-types';
import { messengerAdapter } from './adapters/messenger.adapter';
import { telegramAdapter } from './adapters/telegram.adapter';
import { viberAdapter } from './adapters/viber.adapter';
import { tikTokAdapter } from './adapters/tiktok.adapter';
import { IChannelAdapter } from './adapters/base.adapter';
import { SubscriptionQuotaService } from '../subscriptions/quota.service';
import { GeminiService } from '../ai/gemini.service';

export class WebhookService {
  private static adapters: Record<ChannelType, IChannelAdapter> = {
    MESSENGER: messengerAdapter,
    TELEGRAM: telegramAdapter,
    VIBER: viberAdapter,
    TIKTOK: tikTokAdapter,
    WEB_WIDGET: messengerAdapter, // fallback
  };

  /**
   * Main Webhook Ingestion Pipeline
   */
  public static async processInboundWebhook(
    channelType: ChannelType,
    channelIdentifierOrId: string,
    headers: Record<string, any>,
    rawBody: string | Buffer,
    parsedBody: any,
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    // 1. Locate Channel Connection
    const channel = await prisma.channelConnection.findFirst({
      where: {
        channelType,
        OR: [
          { id: channelIdentifierOrId },
          { identifier: channelIdentifierOrId },
        ],
      },
      include: {
        organization: {
          include: {
            subscription: true,
            aiConfig: true,
          },
        },
      },
    });

    if (!channel) {
      throw new Error(`Channel connection not found for ${channelType} identifier: ${channelIdentifierOrId}`);
    }

    // 2. Validate Quota & Channel Active Status
    if (!channel.isActive) {
      throw new Error(`Channel [${channel.accountName}] is currently inactive. Please activate it in your dashboard.`);
    }

    // Verify Subscription is active
    await SubscriptionQuotaService.getSubscriptionDetails(channel.organizationId);

    // 3. Verify Signature / Security Token
    const adapter = this.adapters[channelType];
    const credentials = (channel.credentials as Record<string, any>) || {};
    const isValid = adapter.verifyWebhook(headers, rawBody, credentials);

    if (!isValid) {
      throw new Error(`Invalid webhook signature for ${channelType}`);
    }

    // 4. Parse into Normalized Inbound Messages
    const normalizedMessages = adapter.parseInbound(parsedBody, channel);
    const processedMessages = [];

    for (const msg of normalizedMessages) {
      const saved = await this.saveInboundMessage(channel, msg, socketEmitter);
      if (saved) {
        processedMessages.push(saved);
      }
    }

    return { processedCount: processedMessages.length, messages: processedMessages };
  }

  /**
   * Save Normalized Message with Unified Customer Profiling & Deduplication
   */
  private static async saveInboundMessage(
    channel: any,
    msg: NormalizedInboundMessage,
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    const orgId = channel.organizationId;

    // A. Deduplicate by externalMessageId
    if (msg.externalMessageId) {
      const existing = await prisma.message.findFirst({
        where: { externalMessageId: msg.externalMessageId },
      });
      if (existing) {
        return null; // Already processed
      }
    }

    // B. Resolve or Merge Customer Identity
    let customer = null;

    // Auto-extract Myanmar phone number from message content if not already set by channel
    if (!msg.senderPhone && msg.text) {
      const sanitizedText = msg.text.replace(/[\s-]/g, '');
      const phoneMatch = sanitizedText.match(/(?:\+?959|09)[0-9]{7,9}/);
      if (phoneMatch) {
        msg.senderPhone = phoneMatch[0].replace(/^\+95/, '0');
      }
    }

    // Check if phone number is known -> attempt cross-channel merge
    if (msg.senderPhone) {
      customer = await prisma.customer.findFirst({
        where: { organizationId: orgId, phone: msg.senderPhone },
      });
    }

    // If not found by phone, check via Channel Identity
    if (!customer) {
      const identity = await prisma.customerChannelIdentity.findUnique({
        where: {
          channelConnectionId_externalId: {
            channelConnectionId: channel.id,
            externalId: msg.senderExternalId,
          },
        },
        include: { customer: true },
      });

      if (identity) {
        customer = identity.customer;
      }
    }

    // If still no customer found, create a new Customer profile
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId: orgId,
          name: msg.senderName || `${msg.channelType} Customer`,
          phone: msg.senderPhone || null,
          firstSeenAt: msg.timestamp,
          lastActiveAt: msg.timestamp,
        },
      });
    } else {
      // Update customer activity & phone if now available
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          lastActiveAt: msg.timestamp,
          phone: msg.senderPhone || customer.phone,
          name: customer.name || msg.senderName,
        },
      });
    }

    // Link or Update CustomerChannelIdentity
    await prisma.customerChannelIdentity.upsert({
      where: {
        channelConnectionId_externalId: {
          channelConnectionId: channel.id,
          externalId: msg.senderExternalId,
        },
      },
      create: {
        customerId: customer.id,
        channelConnectionId: channel.id,
        channelType: msg.channelType,
        externalId: msg.senderExternalId,
        externalUsername: msg.senderName,
        rawProfile: msg.rawPayload as any,
      },
      update: {
        externalUsername: msg.senderName || undefined,
        rawProfile: msg.rawPayload as any,
      },
    });

    // C. Locate or Create Unified Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId: orgId,
        customerId: customer.id,
        channelConnectionId: channel.id,
        status: { in: ['UNASSIGNED', 'ACTIVE', 'WAITING'] },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: orgId,
          customerId: customer.id,
          channelConnectionId: channel.id,
          channelType: msg.channelType,
          externalThreadId: msg.externalThreadId,
          status: 'UNASSIGNED',
          handoverStatus: 'BOT_HANDLING',
          unreadCount: 1,
          lastMessageSnippet: msg.text || `[${msg.type}]`,
          lastMessageAt: msg.timestamp,
        },
      });
    } else {
      // Increment unread count & update snippet
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageSnippet: msg.text || `[${msg.type}]`,
          lastMessageAt: msg.timestamp,
          unreadCount: { increment: 1 },
        },
      });
    }

    // D. Persist the Inbound Message
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        senderName: customer.name || 'Customer',
        type: msg.type,
        content: msg.text || '',
        mediaUrl: msg.mediaUrl,
        externalMessageId: msg.externalMessageId,
        createdAt: msg.timestamp,
        metadata: {
          channelType: msg.channelType,
          senderExternalId: msg.senderExternalId,
        },
      },
    });

    // E. Broadcast Real-Time Event via Socket.IO
    if (socketEmitter) {
      socketEmitter(SOCKET_EVENTS.INCOMING_MESSAGE, `org:${orgId}`, {
        message: savedMessage,
        conversation: {
          ...conversation,
          customer,
        },
      });
    }

    // F. Trigger Gemini AI Auto-Responder (Asynchronous background task)
    if (conversation.handoverStatus === 'BOT_HANDLING') {
      GeminiService.handleIncomingMessage(
        conversation.id,
        msg.text || '',
        msg.type,
        msg.mediaUrl,
        socketEmitter
      ).catch((err) => console.error('❌ AI Auto-Responder error:', err.message));
    }

    return {
      message: savedMessage,
      conversationId: conversation.id,
      handoverStatus: conversation.handoverStatus,
      organizationId: orgId,
      customer,
    };
  }
}
