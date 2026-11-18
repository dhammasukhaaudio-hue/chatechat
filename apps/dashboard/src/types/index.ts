import { ChannelType, ConversationStatus, HandoverStatus, MessageType, SenderType } from '@chatechat/shared-types';

export type { ChannelType, ConversationStatus, HandoverStatus, MessageType, SenderType };

export interface Customer {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  notes?: string;
  tags: string[];
  totalOrders: number;
  totalSpentMmk: number;
  identities?: {
    id: string;
    channelType: ChannelType;
    externalId: string;
    externalUsername?: string;
  }[];
}

export interface Conversation {
  id: string;
  organizationId: string;
  customerId: string;
  channelConnectionId: string;
  assignedAgentId?: string | null;
  status: ConversationStatus;
  handoverStatus: HandoverStatus;
  channelType: ChannelType;
  externalThreadId: string;
  unreadCount: number;
  lastMessageSnippet?: string;
  lastMessageAt: string;
  customer: Customer;
  assignedAgent?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string | null;
  senderName: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  isInternal: boolean;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  content: string;
  tags: string[];
}

export interface ChannelQuotaDetails {
  maxChannels: number;
  activeChannelsCount: number;
  remainingSlots: number;
  planConfig: {
    tier: string;
    name: string;
    priceMmk: number;
    maxChannels: number;
  };
  channels: {
    channelType: ChannelType;
    accountName: string;
    isActive: boolean;
  }[];
}
