export type ChannelType = 'MESSENGER' | 'TELEGRAM' | 'VIBER' | 'TIKTOK' | 'WEB_WIDGET';
export type SenderType = 'CUSTOMER' | 'AGENT' | 'BOT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'STICKER' | 'NOTE';
export type ConversationStatus = 'UNASSIGNED' | 'ACTIVE' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type HandoverStatus = 'BOT_HANDLING' | 'HUMAN_REQUESTED' | 'TRANSFERRED_TO_AGENT' | 'RESOLVED';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  totalOrdersCount: number;
  totalSpentMmk: number;
  tags: string[];
}

export interface Message {
  id: string;
  clientMessageId?: string;
  conversationId: string;
  senderType: SenderType;
  senderName: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  isInternal: boolean;
  createdAt: string;
  status?: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  channelType: ChannelType;
  status: ConversationStatus;
  handoverStatus: HandoverStatus;
  unreadCount: number;
  lastMessageSnippet: string;
  lastMessageAt: string;
  customer: Customer;
}
