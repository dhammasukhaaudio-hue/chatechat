import { Conversation, Message } from '../types';

export class MobileApiService {
  private baseUrl: string = 'https://chatechat.onrender.com';
  private organizationId: string = 'org_royal';
  private agentName: string = 'Agent';

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setOrganizationId(org: string) {
    this.organizationId = org;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public setAgentName(name: string) {
    this.agentName = name;
  }

  public getAgentName(): string {
    return this.agentName;
  }

  public async getConversations(): Promise<Conversation[]> {
    try {
      // 1. Fetch live Telegram chats for this organization
      const tgRes = await fetch(
        `${this.baseUrl}/api/v1/webhooks/telegram/chats?organizationId=${encodeURIComponent(this.organizationId)}`
      );
      if (tgRes.ok) {
        const tgData = await tgRes.json();
        if (tgData && tgData.chats) {
          const chatKeys = Object.keys(tgData.chats);
          if (chatKeys.length > 0) {
            const list: Conversation[] = [];
            for (const key of chatKeys) {
              const entry = tgData.chats[key];
              if (entry && entry.conv) {
                list.push(entry.conv);
              }
            }
            if (list.length > 0) return list;
          }
        }
      }

      // 2. Fallback to API chat conversations
      const res = await fetch(`${this.baseUrl}/api/v1/chat/conversations`);
      if (res.ok) {
        const data = await res.json();
        const convs = data.data || data.conversations || [];
        if (Array.isArray(convs) && convs.length > 0) return convs;
      }

      return this.getMockConversations();
    } catch (err) {
      console.warn('Fallback local demo conversations for mobile:', err);
      return this.getMockConversations();
    }
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    try {
      // 1. Check Telegram chat messages
      const tgRes = await fetch(
        `${this.baseUrl}/api/v1/webhooks/telegram/chats?organizationId=${encodeURIComponent(this.organizationId)}`
      );
      if (tgRes.ok) {
        const tgData = await tgRes.json();
        if (tgData?.chats?.[conversationId]?.messages) {
          return tgData.chats[conversationId].messages;
        }
      }

      // 2. Fetch from DB messages
      const res = await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        return data.messages || data.data || [];
      }

      return this.getMockMessages(conversationId);
    } catch (err) {
      console.warn('Fallback local demo messages for mobile:', err);
      return this.getMockMessages(conversationId);
    }
  }

  public async sendMessage(
    conversationId: string,
    text: string,
    isInternal: boolean = false,
    externalThreadId?: string
  ): Promise<Message> {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderType: 'AGENT',
      senderName: this.agentName,
      type: isInternal ? 'NOTE' : 'TEXT',
      content: text,
      isInternal,
      createdAt: new Date().toISOString(),
    };

    // 1. If customer is from Telegram, send directly to Telegram Bot Outbound API
    const targetChatId = externalThreadId || conversationId.replace(/^conv_/, '');
    if (targetChatId && !isInternal) {
      fetch(`${this.baseUrl}/api/v1/webhooks/telegram/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChatId,
          text,
          agentName: this.agentName,
        }),
      }).catch((e) => console.warn('Telegram outbound send failed:', e));
    }

    // 2. Record to API messages
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          type: isInternal ? 'NOTE' : 'TEXT',
          isInternal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) return data.message;
      }
    } catch (e) {}

    return newMsg;
  }

  public async resolveConversation(conversationId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/resolve`, {
      method: 'PATCH',
    }).catch(() => {});
  }

  public async toggleHandover(conversationId: string, status: 'BOT_HANDLING' | 'TRANSFERRED_TO_AGENT'): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handoverStatus: status }),
    }).catch(() => {});
  }

  // Resilient Offline/Local Mock Data
  private getMockConversations(): Conversation[] {
    return [
      {
        id: 'conv_1',
        organizationId: this.organizationId,
        channelType: 'TELEGRAM',
        status: 'ACTIVE',
        handoverStatus: 'HUMAN_REQUESTED',
        unreadCount: 1,
        lastMessageSnippet: 'မင်္ဂလာပါ အော်ဒါတင်ချင်လို့ပါ ခင်ဗျာ',
        lastMessageAt: new Date().toISOString(),
        customer: {
          id: 'cust_1',
          name: 'Ko Min Khant (Customer)',
          phone: '09798765432',
          city: 'ရန်ကုန်',
          address: 'တိုက် ၄၅၊ လှည်းတန်းလမ်း၊ ကမာရွတ်',
          totalOrdersCount: 2,
          totalSpentMmk: 65000,
          tags: ['VIP', 'KPay'],
        },
      },
    ];
  }

  private getMockMessages(conversationId: string): Message[] {
    return [
      {
        id: 'msg_1',
        conversationId,
        senderType: 'CUSTOMER',
        senderName: 'Customer',
        type: 'TEXT',
        content: 'မင်္ဂလာပါ အော်ဒါတင်ချင်လို့ပါ ခင်ဗျာ',
        isInternal: false,
        createdAt: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId,
        senderType: 'AGENT',
        senderName: this.agentName,
        type: 'TEXT',
        content: 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ။ ဘာများ အဆင်ပြေအောင် ကူညီဆောင်ရွက်ပေးရမလဲခင်ဗျာ။',
        isInternal: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const mobileApi = new MobileApiService();
