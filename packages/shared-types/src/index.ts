/**
 * Shared Type Definitions for ChateChat (ချိတ်ချက်)
 * Myanmar Multi-Channel Real-Time Customer Communication Platform
 */

export type ChannelType = 'MESSENGER' | 'TELEGRAM' | 'VIBER' | 'TIKTOK' | 'WEB_WIDGET';
export type PlanTier = 'TIER_1_CHANNEL' | 'TIER_2_CHANNELS' | 'TIER_3_CHANNELS' | 'TIER_ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';
export type PaymentMethod = 'KBZPAY' | 'WAVEPAY' | 'CB_PAY' | 'AYA_PAY' | 'BANK_TRANSFER';

export type SenderType = 'CUSTOMER' | 'AGENT' | 'BOT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'STICKER' | 'NOTE';
export type ConversationStatus = 'UNASSIGNED' | 'ACTIVE' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type HandoverStatus = 'BOT_HANDLING' | 'HUMAN_REQUESTED' | 'TRANSFERRED_TO_AGENT' | 'RESOLVED';
export type AgentStatus = 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE';

// Subscription Pricing and Channel Quota Mapping
export interface PlanTierDetails {
  tier: PlanTier;
  name: string;
  priceMmk: number;
  maxChannels: number;
}

export const SUBSCRIPTION_TIERS: Record<PlanTier, PlanTierDetails> = {
  TIER_1_CHANNEL: {
    tier: 'TIER_1_CHANNEL',
    name: '1 Channel Starter Plan',
    priceMmk: 5000,
    maxChannels: 1,
  },
  TIER_2_CHANNELS: {
    tier: 'TIER_2_CHANNELS',
    name: '2 Channels Growth Plan',
    priceMmk: 10000,
    maxChannels: 2,
  },
  TIER_3_CHANNELS: {
    tier: 'TIER_3_CHANNELS',
    name: '3 Channels Pro Plan',
    priceMmk: 12000,
    maxChannels: 3,
  },
  TIER_ENTERPRISE: {
    tier: 'TIER_ENTERPRISE',
    name: 'Omni-Channel Enterprise Plan',
    priceMmk: 15000,
    maxChannels: 5,
  },
};

// Inbound Normalized Webhook Message
export interface NormalizedInboundMessage {
  channelType: ChannelType;
  channelIdentifier: string; // Page ID, Bot Token, Viber URI, etc.
  externalThreadId: string;
  externalMessageId: string;
  senderExternalId: string;
  senderName?: string;
  senderPhone?: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  rawPayload: Record<string, unknown>;
  timestamp: Date;
}

// Outbound Message Request
export interface OutboundMessagePayload {
  conversationId: string;
  channelType: ChannelType;
  recipientExternalId: string;
  type: MessageType;
  text: string;
  mediaUrl?: string;
  agentName?: string;
  metadata?: Record<string, any>;
}

// Socket Events
export const SOCKET_EVENTS = {
  // Agent Authentications & Rooms
  AGENT_AUTH: 'agent:auth',
  AGENT_JOIN_CONVERSATION: 'agent:join_conv',
  AGENT_LEAVE_CONVERSATION: 'agent:leave_conv',
  AGENT_STATUS_UPDATE: 'agent:status_update',

  // Messaging & Real-Time Sync
  INCOMING_MESSAGE: 'chat:incoming_message',
  OUTGOING_MESSAGE: 'chat:outgoing_message',
  MESSAGE_DELIVERED: 'chat:message_delivered',
  AGENT_TYPING: 'chat:agent_typing',
  CUSTOMER_TYPING: 'chat:customer_typing',

  // Workflow & Assignment
  CONVERSATION_ASSIGNED: 'conv:assigned',
  HANDOVER_REQUESTED: 'conv:handover_requested',
  CONVERSATION_RESOLVED: 'conv:resolved',
  CHANNEL_STATUS_CHANGED: 'channel:status_changed',
} as const;
