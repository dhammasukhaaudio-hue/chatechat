import { Conversation, Message } from '../types';

export class MobileApiService {
  private baseUrl: string = 'http://10.0.2.2:4000';

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async getConversations(): Promise<Conversation[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/chat/conversations`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.conversations || [];
    } catch (err) {
      console.warn('Fallback local demo conversations for mobile:', err);
      return this.getMockConversations();
    }
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.messages || [];
    } catch (err) {
      console.warn('Fallback local demo messages for mobile:', err);
      return this.getMockMessages(conversationId);
    }
  }

  public async sendMessage(conversationId: string, text: string, isInternal: boolean = false): Promise<Message> {
    const res = await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        type: isInternal ? 'NOTE' : 'TEXT',
        isInternal,
      }),
    });
    const data = await res.json();
    return data.message;
  }

  public async resolveConversation(conversationId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/resolve`, {
      method: 'PATCH',
    });
  }

  public async toggleHandover(conversationId: string, status: 'BOT_HANDLING' | 'TRANSFERRED_TO_AGENT'): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/chat/conversations/${conversationId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handoverStatus: status,
      }),
    });
  }

  // Resilient Offline/Local Mock Data
  private getMockConversations(): Conversation[] {
    return [
      {
        id: 'conv_1',
        organizationId: 'org_royal',
        channelType: 'TELEGRAM',
        status: 'ACTIVE',
        handoverStatus: 'HUMAN_REQUESTED',
        unreadCount: 2,
        lastMessageSnippet: 'AYApay နဲ့ ရှင်းလို့ရမလား ခင်ဗျာ',
        lastMessageAt: new Date().toISOString(),
        customer: {
          id: 'cust_1',
          name: 'Ko Aung Kyaw',
          phone: '09798765432',
          city: 'ရန်ကုန်',
          address: 'တိုက် ၄၅၊ လှည်းတန်းလမ်း၊ ကမာရွတ်',
          totalOrdersCount: 4,
          totalSpentMmk: 185000,
          tags: ['VIP', 'AYAPay'],
        },
      },
      {
        id: 'conv_2',
        organizationId: 'org_royal',
        channelType: 'MESSENGER',
        status: 'WAITING',
        handoverStatus: 'BOT_HANDLING',
        unreadCount: 0,
        lastMessageSnippet: 'အမဲရောင်ရော အဖြူရောင်ပါ stock အသင့်ရှိပါသေးသည်ခင်ဗျာ',
        lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
        customer: {
          id: 'cust_2',
          name: 'Ma Thuzar Lwin',
          phone: '09450012345',
          city: 'မန္တလေး',
          address: '၇၃ လမ်း၊ မဟာအောင်မြေ',
          totalOrdersCount: 2,
          totalSpentMmk: 92000,
          tags: ['Repeat Buyer'],
        },
      },
      {
        id: 'conv_3',
        organizationId: 'org_royal',
        channelType: 'VIBER',
        status: 'UNASSIGNED',
        handoverStatus: 'HUMAN_REQUESTED',
        unreadCount: 1,
        lastMessageSnippet: 'ငွေလွှဲပြေစာ screenshot ပို့ထားပါတယ်',
        lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
        customer: {
          id: 'cust_3',
          name: 'Daw Khin Hnin Yu',
          phone: '09971234567',
          city: 'ရန်ကုန်',
          address: 'ဗဟန်း၊ ရွှေတောင်ကြား',
          totalOrdersCount: 1,
          totalSpentMmk: 45000,
          tags: ['New Customer', 'KPay'],
        },
      },
      {
        id: 'conv_4',
        organizationId: 'org_royal',
        channelType: 'TIKTOK',
        status: 'ACTIVE',
        handoverStatus: 'BOT_HANDLING',
        unreadCount: 0,
        lastMessageSnippet: 'ဘယ်လောက်ကြာမလဲ?',
        lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
        customer: {
          id: 'cust_4',
          name: '@myanmar_fashionista',
          phone: '09254000111',
          city: 'နေပြည်တော်',
          address: 'ပျဉ်းမနား',
          totalOrdersCount: 1,
          totalSpentMmk: 38000,
          tags: ['TikTok Lead'],
        },
      },
    ];
  }

  private getMockMessages(convId: string): Message[] {
    return [
      {
        id: 'm1',
        conversationId: convId,
        senderType: 'CUSTOMER',
        senderName: 'Ko Aung Kyaw',
        type: 'TEXT',
        content: 'မင်္ဂလာပါ အမဲရောင် size L ရှိလားဗျ',
        isInternal: false,
        createdAt: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: 'm2',
        conversationId: convId,
        senderType: 'BOT',
        senderName: 'ChateChat AI Bot',
        type: 'TEXT',
        content: 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ! အမဲရောင်ရော အဖြူရောင်ပါ stock အသင့်ရှိပါသေးသည်ခင်ဗျာ။ လူကြီးမင်း မှာယူလိုသည့် size လေးနှင့် ဆက်သွယ်ရမည့် အမည်/ဖုန်းနံပါတ်လေး ပြောပြပေးပါခင်ဗျာ။ 😊',
        isInternal: false,
        createdAt: new Date(Date.now() - 550000).toISOString(),
      },
      {
        id: 'm3',
        conversationId: convId,
        senderType: 'CUSTOMER',
        senderName: 'Ko Aung Kyaw',
        type: 'TEXT',
        content: 'AYApay နဲ့ ရှင်းလို့ရမလား ခင်ဗျာ',
        isInternal: false,
        createdAt: new Date(Date.now() - 100000).toISOString(),
      },
    ];
  }
}

export const mobileApi = new MobileApiService();
