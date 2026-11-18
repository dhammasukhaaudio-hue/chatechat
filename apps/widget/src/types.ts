export interface WidgetConfig {
  organizationId: string;
  apiUrl?: string;
  socketUrl?: string;
  themeColor?: string;
  greeting?: string;
  subtitle?: string;
  position?: 'bottom-right' | 'bottom-left';
  requirePreChat?: boolean;
  proactiveDelaySeconds?: number;
  proactiveMessage?: string;
}

export interface VisitorData {
  sessionToken: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface ChatMessage {
  id: string;
  senderType: 'VISITOR' | 'AGENT' | 'BOT' | 'SYSTEM';
  senderName: string;
  content: string;
  createdAt: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  mediaUrl?: string;
}
