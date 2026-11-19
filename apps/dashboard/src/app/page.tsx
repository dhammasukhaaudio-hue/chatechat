'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ConversationList } from '../components/ConversationList';
import { ChatArea } from '../components/ChatArea';
import { CustomerProfile } from '../components/CustomerProfile';
import { CustomersView } from '../components/CustomersView';
import { ChannelsView } from '../components/ChannelsView';
import { AiBotView } from '../components/AiBotView';
import { SettingsView } from '../components/SettingsView';
import { LoginView } from '../components/LoginView';
import { useSocket } from '../hooks/useSocket';
import { Conversation, Message, CannedResponse, ChannelQuotaDetails, ChannelType, ConversationStatus, HandoverStatus } from '../types';
import { Language } from '../lib/translations';
import { getApiBaseUrl } from '../lib/api-config';

// Initial Mock Conversations
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    organizationId: 'org_royal',
    customerId: 'cust_1',
    channelConnectionId: 'chan_fb',
    status: 'ACTIVE',
    handoverStatus: 'TRANSFERRED_TO_AGENT',
    channelType: 'MESSENGER',
    externalThreadId: 'psid_987654321',
    unreadCount: 0,
    lastMessageSnippet: 'မင်္ဂလာပါရှင် အကျီ size M ရသေးလားရှင့်?',
    lastMessageAt: new Date(Date.now() - 5 * 60000).toISOString(),
    customer: {
      id: 'cust_1',
      name: 'မေသူခိုင်',
      phone: '09798765432',
      address: 'အမှတ် ၄၅၊ သရက်တော ၃ လမ်း၊ စမ်းချောင်းမြို့နယ်',
      city: 'ရန်ကုန်',
      tags: ['VIP', 'KPay Regular'],
      totalOrders: 3,
      totalSpentMmk: 85000,
      identities: [
        { id: 'id_1', channelType: 'MESSENGER', externalId: 'psid_987654321', externalUsername: 'May Thu Khine' },
        { id: 'id_2', channelType: 'VIBER', externalId: '09798765432', externalUsername: 'May Thu' },
      ],
    },
    assignedAgent: { id: 'agent_1', name: 'မသူဇာ' },
  },
  {
    id: 'conv_2',
    organizationId: 'org_royal',
    customerId: 'cust_2',
    channelConnectionId: 'chan_tg',
    status: 'UNASSIGNED',
    handoverStatus: 'BOT_HANDLING',
    channelType: 'TELEGRAM',
    externalThreadId: 'tg_chat_112233',
    unreadCount: 1,
    lastMessageSnippet: 'KPay နဲ့ လွှဲလို့ရလားခင်ဗျ?',
    lastMessageAt: new Date(Date.now() - 15 * 60000).toISOString(),
    customer: {
      id: 'cust_2',
      name: 'ကိုအောင်ကို',
      phone: '09450011223',
      address: '၇၃ လမ်း၊ ၂၈x၂၉ ကြား',
      city: 'မန္တလေး',
      tags: ['New Customer'],
      totalOrders: 1,
      totalSpentMmk: 25000,
      identities: [
        { id: 'id_3', channelType: 'TELEGRAM', externalId: 'tg_chat_112233', externalUsername: '@AungKo_MDY' },
      ],
    },
  },
  {
    id: 'conv_3',
    organizationId: 'org_royal',
    customerId: 'cust_3',
    channelConnectionId: 'chan_viber',
    status: 'ACTIVE',
    handoverStatus: 'TRANSFERRED_TO_AGENT',
    channelType: 'VIBER',
    externalThreadId: 'viber_uid_9988',
    unreadCount: 0,
    lastMessageSnippet: 'ငွေလွှဲပြေစာ ပို့ပေးထားပါတယ်ရှင်',
    lastMessageAt: new Date(Date.now() - 45 * 60000).toISOString(),
    customer: {
      id: 'cust_3',
      name: 'ဒေါ်လှလှဝင်း',
      phone: '09250123456',
      address: 'ဗဟန်းမြို့နယ်၊ ရွှေတောင်ကြား',
      city: 'ရန်ကုန်',
      tags: ['Wholesale'],
      totalOrders: 8,
      totalSpentMmk: 450000,
      identities: [
        { id: 'id_4', channelType: 'VIBER', externalId: 'viber_uid_9988', externalUsername: 'Daw Hla Hla Win' },
      ],
    },
    assignedAgent: { id: 'agent_1', name: 'မသူဇာ' },
  },
  {
    id: 'conv_4',
    organizationId: 'org_royal',
    customerId: 'cust_4',
    channelConnectionId: 'chan_tiktok',
    status: 'UNASSIGNED',
    handoverStatus: 'HUMAN_REQUESTED',
    channelType: 'TIKTOK',
    externalThreadId: 'tt_user_5566',
    unreadCount: 1,
    lastMessageSnippet: 'လူနဲ့ပြောချင်တယ်ဗျ.. အော်ဒါအရေးကြီးတင်ချင်လို့ admin ခေါ်ပေးပါ',
    lastMessageAt: new Date(Date.now() - 120 * 60000).toISOString(),
    customer: {
      id: 'cust_4',
      name: 'TikTok User 99',
      phone: '09887766554',
      address: 'မင်္ဂလာတောင်ညွန့်၊ ရန်ကုန်',
      city: 'ရန်ကုန်',
      tags: ['Live Buyer'],
      totalOrders: 0,
      totalSpentMmk: 0,
      identities: [
        { id: 'id_5', channelType: 'TIKTOK', externalId: 'tt_user_5566', externalUsername: '@mg_mg_style' },
      ],
    },
  },
];

// Initial Messages
const INITIAL_MESSAGES: Record<string, Message[]> = {
  conv_1: [
    {
      id: 'm1',
      conversationId: 'conv_1',
      senderType: 'CUSTOMER',
      senderName: 'မေသူခိုင်',
      type: 'TEXT',
      content: 'မင်္ဂလာပါရှင် အကျီ size M ရသေးလားရှင့်?',
      isInternal: false,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'm2',
      conversationId: 'conv_1',
      senderType: 'AGENT',
      senderName: 'မသူဇာ',
      type: 'TEXT',
      content: 'ဟုတ်ကဲ့ မင်္ဂလာပါ မမေသူခိုင်ရှင်။ အကျီ size M အနက်ရောင်ရော၊ အဖြူရောင်ပါ stock အသင့်ရှိပါသေးတယ်ရှင်။',
      isInternal: false,
      createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
    },
    {
      id: 'm3',
      conversationId: 'conv_1',
      senderType: 'AGENT',
      senderName: 'မသူဇာ',
      type: 'NOTE',
      content: 'ဒီ customer က ပုံမှန်ဆို အနက်ရောင်ပဲ ဝယ်လေ့ရှိတယ်။ size L လဲ အဆင်ပြေတယ်ပြောဖူးတယ်။',
      isInternal: true,
      createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    },
  ],
  conv_2: [
    {
      id: 'm4',
      conversationId: 'conv_2',
      senderType: 'CUSTOMER',
      senderName: 'ကိုအောင်ကို',
      type: 'TEXT',
      content: 'KPay နဲ့ လွှဲလို့ရလားခင်ဗျ?',
      isInternal: false,
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'm5',
      conversationId: 'conv_2',
      senderType: 'BOT',
      senderName: 'ChateChat AI Bot',
      type: 'TEXT',
      content: 'ဟုတ်ကဲ့ ရပါတယ်ခင်ဗျာ။ KBZPay အကောင့် 09987654321 (ဒေါ်စုစုဝင်း) သို့ လွှဲပေးပို့နိုင်ပါသည်။ လွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။',
      isInternal: false,
      createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
    },
  ],
  conv_3: [
    {
      id: 'm6',
      conversationId: 'conv_3',
      senderType: 'CUSTOMER',
      senderName: 'ဒေါ်လှလှဝင်း',
      type: 'TEXT',
      content: 'အဝတ်အထည် လက္ကား အထည် ၅၀ မှာထားတာ ငွေလွှဲပြေစာ ပို့ပေးထားပါတယ်ရှင်။',
      isInternal: false,
      createdAt: new Date(Date.now() - 50 * 60000).toISOString(),
    },
    {
      id: 'm7',
      conversationId: 'conv_3',
      senderType: 'AGENT',
      senderName: 'မသူဇာ',
      type: 'TEXT',
      content: 'ဟုတ်ကဲ့ပါ အန်တီရှင်၊ စလစ်လက်ခံရရှိပြီး စစ်ဆေးအတည်ပြုပြီးပါပြီရှင်။ ပစ္စည်းများကို ဒီနေ့ ညနေ အောင်မင်္ဂလာ အဝေးပြေးဂိတ်သို့ တင်ပို့ပေးပါမည်ရှင့်။ 🙏',
      isInternal: false,
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    },
  ],
  conv_4: [
    {
      id: 'm8',
      conversationId: 'conv_4',
      senderType: 'CUSTOMER',
      senderName: 'TikTok User 99',
      type: 'TEXT',
      content: 'ဒီနေ့ live လွှင့်ထားတဲ့ ဖိနပ် ဈေးဘယ်လောက်လဲဗျ?',
      isInternal: false,
      createdAt: new Date(Date.now() - 125 * 60000).toISOString(),
    },
    {
      id: 'm9',
      conversationId: 'conv_4',
      senderType: 'BOT',
      senderName: 'ChateChat AI Bot',
      type: 'TEXT',
      content: 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ! ဒီနေ့ TikTok Live မှာ မိတ်ဆက်ပေးထားသော Sneaker ဖိနပ်လေးကတော့ အထူးပရိုမိုးရှင်းအနေဖြင့် ၂၈၀၀၀ ကျပ် ဖြစ်ပါသည်ခင်ဗျာ။ Size 39 မှ 44 အထိ stock အသင့်ရှိပါသည်ခင်ဗျာ။ 👟',
      isInternal: false,
      createdAt: new Date(Date.now() - 124 * 60000).toISOString(),
    },
    {
      id: 'm10',
      conversationId: 'conv_4',
      senderType: 'CUSTOMER',
      senderName: 'TikTok User 99',
      type: 'TEXT',
      content: 'လူနဲ့ပြောချင်တယ်ဗျ.. အော်ဒါအရေးကြီးတင်ချင်လို့ admin ခေါ်ပေးပါ',
      isInternal: false,
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    },
    {
      id: 'm11',
      conversationId: 'conv_4',
      senderType: 'BOT',
      senderName: 'ChateChat System',
      type: 'TEXT',
      content: 'ဟုတ်ကဲ့ပါခင်ဗျာ။ လူကြီးမင်းအား အသေးစိတ် ကူညီဆောင်ရွက်ပေးနိုင်ရန် တာဝန်ကျ အရောင်းကိုယ်စားလှယ် (Customer Support Agent) ထံသို့ ချက်ချင်း လွှဲပြောင်းပေးလိုက်ပါပြီခင်ဗျာ။ ခဏလေး စောင့်ဆိုင်းပေးပါရှင့်/ခင်ဗျာ။ 🙏',
      isInternal: false,
      createdAt: new Date(Date.now() - 119 * 60000).toISOString(),
    },
  ],
};

// Web Audio Alert Chime for Incoming Customer Messages
const playAlertChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

export default function InboxPage() {
  const [activeNav, setActiveNav] = useState('inbox');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv_1');
  const [lang, setLang] = useState<Language>('my');

  // Authentication State for Frontend (:3000)
  const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);

  // Storage key namespaces based on authenticated user
  const userStorageKey = (currentUser?.email || currentUser?.name || 'guest')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const convStorageKey = `chatechat_convs_${userStorageKey}`;
  const msgStorageKey = `chatechat_msgs_${userStorageKey}`;
  const channelStorageKey = `chatechat_channels_${userStorageKey}`;

  // Customer List with rich data
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  // Load Session on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatechat_agent_session');
      if (saved) {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // ignore
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  // Hydrate conversations and ensure connected bot threads appear
  useEffect(() => {
    if (!currentUser) return;

    try {
      const savedConvs = localStorage.getItem(convStorageKey);
      const savedMsgs = localStorage.getItem(msgStorageKey);
      let initialConvs: Conversation[] = savedConvs ? JSON.parse(savedConvs) : INITIAL_CONVERSATIONS;
      let initialMsgs: Record<string, Message[]> = savedMsgs ? JSON.parse(savedMsgs) : INITIAL_MESSAGES;

      // Check if user has an active Telegram bot connected in localStorage
      const savedChannels = localStorage.getItem(channelStorageKey);
      if (savedChannels) {
        const channelsList = JSON.parse(savedChannels);
        const activeTg = channelsList.find((c: any) => c.type === 'TELEGRAM' && c.isActive);
        if (activeTg && activeTg.accountName && activeTg.accountName !== 'မချိတ်ဆက်ရသေးပါ') {
          // If no conversation currently reflects this bot, inject a welcoming bot thread
          const cleanBot = activeTg.accountName.startsWith('@') ? activeTg.accountName : `@${activeTg.accountName}`;
          const hasTgBotConv = initialConvs.some((c) => 
            c.channelType === 'TELEGRAM' && (c.customer?.name?.includes(cleanBot) || c.lastMessageSnippet?.includes(cleanBot))
          );
          if (!hasTgBotConv) {
            const botConvId = `conv_tg_${Date.now()}`;
            const botCustId = `cust_tg_${Date.now()}`;
            const nowIso = new Date().toISOString();
            const welcomeConv: Conversation = {
              id: botConvId,
              organizationId: 'org_royal',
              customerId: botCustId,
              channelConnectionId: 'chan_tg_active',
              status: 'ACTIVE',
              handoverStatus: 'HUMAN_REQUESTED',
              channelType: 'TELEGRAM',
              externalThreadId: `tg_${Date.now().toString().slice(-6)}`,
              unreadCount: 1,
              lastMessageSnippet: `မင်္ဂလာပါရှင် ${cleanBot} မှ ကြိုဆိုပါသည်ခင်ဗျာ။ စာတိုစမ်းသပ်ချက် အောင်မြင်ပါသည်! 🚀`,
              lastMessageAt: nowIso,
              customer: {
                id: botCustId,
                name: `ကိုကျော်စွာ (${cleanBot})`,
                phone: '09791234567',
                address: 'လှည်းတန်း၊ ကမာရွတ်မြို့နယ်',
                city: 'ရန်ကုန်',
                tags: ['Telegram Lead', 'Live Bot'],
                totalOrders: 1,
                totalSpentMmk: 35000,
                identities: [
                  {
                    id: `id_tg_${Date.now()}`,
                    channelType: 'TELEGRAM',
                    externalId: `tg_user_1`,
                    externalUsername: '@kyawswar_mm',
                  },
                ],
              },
              assignedAgent: currentUser?.name ? { id: currentUser.id || 'agent_me', name: currentUser.name } : undefined,
            };

            const welcomeMsg: Message = {
              id: `msg_tg_${Date.now()}`,
              conversationId: botConvId,
              senderType: 'CUSTOMER',
              senderName: `ကိုကျော်စွာ (@kyawswar_mm)`,
              type: 'TEXT',
              content: `မင်္ဂလာပါရှင် ${cleanBot} bot အား ချိတ်ဆက်ထားသည်ကို တွေ့ရှိရပါသဖြင့် စာတိုစမ်းသပ် ပေးပို့လိုက်ပါသည်ခင်ဗျာ။ မင်္ဂလာရှိသော နေ့လေးဖြစ်ပါစေရှင့်! 👕🌟`,
              isInternal: false,
              createdAt: nowIso,
            };

            initialConvs = [welcomeConv, ...initialConvs];
            initialMsgs[botConvId] = [welcomeMsg];
            localStorage.setItem(convStorageKey, JSON.stringify(initialConvs));
            localStorage.setItem(msgStorageKey, JSON.stringify(initialMsgs));
          }
        }
      }

      setConversations(initialConvs);
      setMessages(initialMsgs);
      if (initialConvs.length > 0) {
        setActiveConversationId(initialConvs[0].id);
      }

      // Sync any live Telegram conversations received by backend 24/7 Long Polling
      const syncTelegramChats = () => {
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/chats`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success && data.chats) {
              const chats = data.chats;
              const chatKeys = Object.keys(chats);
              if (chatKeys.length > 0) {
                setConversations((prev) => {
                  let updated = [...prev];
                  let hasChange = false;
                  for (const key of chatKeys) {
                    const entry = chats[key];
                    if (entry && entry.conv) {
                      const idx = updated.findIndex((c) => c.id === entry.conv.id);
                      if (idx >= 0) {
                        if (updated[idx].lastMessageAt !== entry.conv.lastMessageAt || updated[idx].lastMessageSnippet !== entry.conv.lastMessageSnippet) {
                          updated[idx] = { ...updated[idx], ...entry.conv };
                          hasChange = true;
                        }
                      } else {
                        updated = [entry.conv, ...updated];
                        hasChange = true;
                      }
                    }
                  }
                  if (hasChange) {
                    try { localStorage.setItem(convStorageKey, JSON.stringify(updated)); } catch {}
                    return updated;
                  }
                  return prev;
                });

                setMessages((prev) => {
                  let updated = { ...prev };
                  let hasNewMsg = false;
                  for (const key of chatKeys) {
                    const entry = chats[key];
                    if (entry && Array.isArray(entry.messages)) {
                      const currentLen = prev[key]?.length || 0;
                      if (currentLen !== entry.messages.length) {
                        updated[key] = entry.messages;
                        hasNewMsg = true;
                      }
                    }
                  }
                  if (hasNewMsg) {
                    playAlertChime();
                    try { localStorage.setItem(msgStorageKey, JSON.stringify(updated)); } catch {}
                    return updated;
                  }
                  return prev;
                });
              }
            }
          })
          .catch(() => {});
      };

      // Run once immediately
      syncTelegramChats();

      // Auto-heal Telegram polling if backend restarted or container was recreated
      const checkAndAutoResumeTelegram = () => {
        try {
          const savedToken = localStorage.getItem('chatechat_telegram_token');
          if (savedToken) {
            fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/status`)
              .then((r) => r.json())
              .then((status) => {
                if (status && status.success && !status.isRunning) {
                  console.log('🔄 Telegram polling is idle on backend, auto-resuming...');
                  fetch(`${getApiBaseUrl()}/api/v1/webhooks/connect/telegram`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      botToken: savedToken,
                      organizationId: 'org_royal',
                      assignAllAgents: true,
                    }),
                  }).catch(() => {});
                }
              })
              .catch(() => {});
          }
        } catch {}
      };

      checkAndAutoResumeTelegram();

      // Poll every 2.5 seconds in background for guaranteed instant updates
      const tgSyncInterval = setInterval(syncTelegramChats, 2500);
      return () => clearInterval(tgSyncInterval);
    } catch (e) {
      console.error('Failed to load user conversations from localStorage:', e);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: { id: string; name: string; email: string; role: string; phone?: string }) => {
    localStorage.setItem('chatechat_agent_session', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (confirm('စနစ်ထဲမှ ထွက်ခွာမည် သေချာပါသလား?')) {
      localStorage.removeItem('chatechat_agent_session');
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  const [cannedResponses] = useState<CannedResponse[]>([
    {
      id: 'cr_1',
      shortcut: '/kpay',
      title: 'KBZPay အကောင့်',
      content: 'KBZPay: 09987654321 (ဒေါ်စုစုဝင်း) သို့ ငွေလွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။',
      tags: ['kpay'],
    },
    {
      id: 'cr_2',
      shortcut: '/wave',
      title: 'WavePay အကောင့်',
      content: 'WavePay: 09987654321 (ဒေါ်စုစုဝင်း) သို့ ငွေလွှဲပေးပို့နိုင်ပါသည်ခင်ဗျာ။',
      tags: ['wave'],
    },
    {
      id: 'cr_3',
      shortcut: '/deli',
      title: 'ရန်ကုန် ပို့ခ (COD)',
      content: 'ရန်ကုန်မြို့တွင်း ပို့ခ ၂၅၀၀ ကျပ် ဖြစ်ပြီး ၁ ရက် မှ ၂ ရက် အတွင်း အိမ်အရောက်ပို့ပေးပါသည်ခင်ဗျာ။ (အိမ်ရောက်ငွေချေ Cash On Delivery ရရှိပါသည်)',
      tags: ['deli'],
    },
    {
      id: 'cr_4',
      shortcut: '/mandalay',
      title: 'မန္တလေး ပို့ခ',
      content: 'မန္တလေးမြို့တွင်း ပို့ခ ၃၅၀၀ ကျပ် ဖြစ်ပါသည်။ အခြားနယ်မြို့များအတွက် ကားဂိတ်ချောပို့ဖြင့် ပို့ဆောင်ပေးပါသည်ခင်ဗျာ။',
      tags: ['deli'],
    },
    {
      id: 'cr_5',
      shortcut: '/acc',
      title: 'ဘဏ်အကောင့်များ အားလုံး',
      content: 'KBZ Bank: 0123456789\nCB Bank: 9876543210\nAYA Bank: 1122334455\n(အကောင့်အမည်: Royal Fashion Co., Ltd.)',
      tags: ['bank'],
    },
  ]);

  const quotaDetails: ChannelQuotaDetails = {
    maxChannels: 3,
    activeChannelsCount: 2,
    remainingSlots: 1,
    planConfig: {
      tier: 'TIER_3_CHANNELS',
      name: '3 Channels Pro Plan',
      priceMmk: 12000,
      maxChannels: 3,
    },
    channels: [
      { channelType: 'MESSENGER', accountName: 'Royal Fashion FB Page', isActive: true },
      { channelType: 'TELEGRAM', accountName: '@RoyalFashionBot', isActive: true },
      { channelType: 'VIBER', accountName: 'Royal Viber Official', isActive: false },
      { channelType: 'TIKTOK', accountName: '@royalfashion_mm', isActive: false },
    ],
  };

  // Socket.IO hook for real-time live events
  const { sendOutgoingMessage, joinConversation } = useSocket({
    organizationId: 'org_royal',
    agentId: currentUser?.id || 'agent_1',
    onIncomingMessage: (data) => {
      const { message, conversation } = data;
      setMessages((prev) => {
        const next = {
          ...prev,
          [message.conversationId]: [...(prev[message.conversationId] || []), message],
        };
        try { localStorage.setItem(msgStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        const next = exists
          ? prev.map((c) =>
              c.id === conversation.id
                ? {
                    ...c,
                    lastMessageSnippet: message.content,
                    lastMessageAt: message.createdAt,
                    unreadCount: c.unreadCount + 1,
                  }
                : c
            )
          : [conversation, ...prev];
        try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    onConversationAssigned: (data) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                assignedAgent: data.assignedAgent,
                handoverStatus: 'TRANSFERRED_TO_AGENT' as HandoverStatus,
                status: 'ACTIVE' as ConversationStatus,
              }
            : c
        );
        try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    onConversationResolved: (data) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === data.conversationId ? { ...c, status: 'RESOLVED' as ConversationStatus, handoverStatus: 'RESOLVED' as HandoverStatus } : c
        );
        try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
    },
  });

  useEffect(() => {
    if (activeConversationId) {
      joinConversation(activeConversationId);
    }
  }, [activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const unreadTotal = conversations.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const handleSendMessage = async (content: string, isInternal: boolean) => {
    if (!activeConversationId) return;

    const senderName = currentUser?.name || 'မသူဇာ';
    const senderId = currentUser?.id || 'agent_1';

    const newMessage: Message = {
      id: `m_${Date.now()}`,
      conversationId: activeConversationId,
      senderType: 'AGENT',
      senderId,
      senderName,
      type: isInternal ? 'NOTE' : 'TEXT',
      content,
      isInternal,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const next = {
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), newMessage],
      };
      try { localStorage.setItem(msgStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });

    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessageSnippet: content,
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
            }
          : c
      );
      try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });

    if (!isInternal) {
      sendOutgoingMessage({
        conversationId: activeConversationId,
        agentId: senderId,
        agentName: senderName,
        content,
      });

      // Direct fallback dispatch for Telegram messages to guarantee delivery
      if (activeConversationId.startsWith('conv_tg_')) {
        const chatId = activeConversationId.replace('conv_tg_', '');
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, text: content, agentName: senderName }),
        }).catch(() => {});
      }
    }
  };

  const handleAssignToMe = () => {
    if (!activeConversationId) return;
    const agentName = currentUser?.name || 'မသူဇာ';
    const agentId = currentUser?.id || 'agent_1';

    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              assignedAgent: { id: agentId, name: agentName },
              handoverStatus: 'TRANSFERRED_TO_AGENT' as HandoverStatus,
              status: 'ACTIVE' as ConversationStatus,
            }
          : c
      );
      try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleResolve = () => {
    if (!activeConversationId) return;
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              status: 'RESOLVED' as ConversationStatus,
            }
          : c
      );
      try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Simulate Customer Inbound Message from Connected Bot (e.g. Telegram / Messenger)
  const handleSimulateInboundMessage = (channelType: ChannelType = 'TELEGRAM', botName = '@MyBot') => {
    playAlertChime();
    const newConvId = `conv_inbound_${Date.now()}`;
    const newCustId = `cust_${Date.now()}`;
    const newMsgId = `msg_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const cleanBot = botName.startsWith('@') ? botName : `@${botName}`;

    // Random realistic customer inquiries
    const customerVariations = [
      { name: 'ကိုကျော်စွာ (Telegram Customer)', phone: '09791234567', username: '@kyawswar_telegram', text: `မင်္ဂလာပါခင်ဗျာ ${cleanBot} ကနေ ဆက်သွယ်မေးမြန်းတာပါ။ ပစ္စည်း stock အသင့်ရှိပါသေးလားခင်ဗျာ? 👕` },
      { name: 'မသီတာ (Telegram Customer)', phone: '09459876543', username: '@thida_tg', text: `မင်္ဂလာပါရှင် ${cleanBot} ကနေ အကျီ Size M နဲ့ L ဈေးလေး သိချင်လို့ပါရှင့်။ KPay နဲ့ ငွေချေလို့ရပါသလား? 💳` },
      { name: 'ကိုအောင်သူ (Telegram Customer)', phone: '09254321098', username: '@aungthu_mm', text: `မင်္ဂလာပါ ${cleanBot} ရေ၊ ရန်ကုန် မြို့တွင်း အိမ်အရောက်ပို့ Cash On Delivery (COD) ရလားခင်ဗျ? 🚚` },
    ];
    const picked = customerVariations[Math.floor(Math.random() * customerVariations.length)];

    const newConv: Conversation = {
      id: newConvId,
      organizationId: 'org_royal',
      customerId: newCustId,
      channelConnectionId: `chan_${channelType.toLowerCase()}_active`,
      status: 'ACTIVE',
      handoverStatus: 'HUMAN_REQUESTED',
      channelType,
      externalThreadId: `chat_${Date.now().toString().slice(-6)}`,
      unreadCount: 1,
      lastMessageSnippet: picked.text,
      lastMessageAt: nowIso,
      customer: {
        id: newCustId,
        name: picked.name,
        phone: picked.phone,
        address: 'အမှတ် ၄၅၊ သရက်တော ၃ လမ်း၊ စမ်းချောင်းမြို့နယ်',
        city: 'ရန်ကုန်',
        tags: ['New Lead', 'Telegram Inquiry', 'Bot Connected'],
        totalOrders: 1,
        totalSpentMmk: 28000,
        identities: [
          {
            id: `id_${Date.now()}`,
            channelType,
            externalId: `user_${Date.now().toString().slice(-6)}`,
            externalUsername: picked.username,
          },
        ],
      },
      assignedAgent: currentUser?.name ? { id: currentUser.id || 'agent_me', name: currentUser.name } : undefined,
    };

    const newMsgs: Message[] = [
      {
        id: newMsgId,
        conversationId: newConvId,
        senderType: 'CUSTOMER',
        senderName: `${picked.name}`,
        type: 'TEXT',
        content: picked.text,
        isInternal: false,
        createdAt: nowIso,
      },
    ];

    setConversations((prev) => {
      const updated = [newConv, ...prev.filter((c) => c.id !== newConvId)];
      try { localStorage.setItem(convStorageKey, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setMessages((prev) => {
      const updated = {
        ...prev,
        [newConvId]: newMsgs,
      };
      try { localStorage.setItem(msgStorageKey, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setActiveConversationId(newConvId);
    setActiveNav('inbox');
  };

  // If not authenticated, render Frontend Login View
  if (authLoaded && !isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-burmese">
      {/* 1. Navigation & Quota Sidebar (Renamed to စုပေါင်း inbox + Language Toggle) */}
      <Sidebar
        quotaDetails={quotaDetails}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        unreadTotal={unreadTotal}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser || undefined}
        onLogout={handleLogout}
      />

      {/* Main Content Area switched by activeNav */}
      {activeNav === 'inbox' && (
        <>
          {/* 2. Conversation Triage List */}
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={(id) => {
              setActiveConversationId(id);
              setConversations((prev) => {
                const updated = prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c));
                try { localStorage.setItem(convStorageKey, JSON.stringify(updated)); } catch {}
                return updated;
              });
            }}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSimulateTelegramMessage={() => {
              let botName = '@MyTelegramBot';
              try {
                const rawChan = localStorage.getItem(channelStorageKey);
                if (rawChan) {
                  const parsed = JSON.parse(rawChan);
                  const tg = parsed.find((c: any) => c.type === 'TELEGRAM' && c.isActive);
                  if (tg?.accountName && tg.accountName !== 'မချိတ်ဆက်ရသေးပါ') {
                    botName = tg.accountName;
                  }
                }
              } catch {}
              handleSimulateInboundMessage('TELEGRAM', botName);
            }}
          />

          {/* 3. Active Chat Window */}
          <ChatArea
            conversation={activeConversation}
            messages={currentMessages}
            cannedResponses={cannedResponses}
            onSendMessage={handleSendMessage}
            onAssignToMe={handleAssignToMe}
            onResolve={handleResolve}
          />

          {/* 4. Customer Unified Profile & CRM Info */}
          {activeConversation && (
            <CustomerProfile
              customer={activeConversation.customer}
              conversation={activeConversation}
              onUpdateCustomer={(updated) => {
                setConversations((prev) => {
                  const updatedList = prev.map((c) =>
                    c.id === activeConversationId
                      ? {
                          ...c,
                          customer: { ...c.customer, ...updated },
                        }
                      : c
                  );
                  try { localStorage.setItem(convStorageKey, JSON.stringify(updatedList)); } catch {}
                  return updatedList;
                });
              }}
              onRequestContact={() => {
                handleSendMessage(
                  'လူကြီးမင်း၏ အော်ဒါအား အမြန်ဆုံး ပို့ဆောင်ပေးနိုင်ရန် ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်နှင့် ပို့ဆောင်ရမည့် လိပ်စာလေး ပြောပြပေးပါခင်ဗျာ။ 🙏',
                  false
                );
              }}
            />
          )}
        </>
      )}

      {/* 2. Full Customer CRM View */}
      {activeNav === 'customers' && (
        <CustomersView
          customers={conversations.map((c) => c.customer)}
          lang={lang}
        />
      )}

      {/* 3. Multi-Channel Integration Hub View */}
      {activeNav === 'channels' && (
        <ChannelsView
          quotaDetails={quotaDetails}
          lang={lang}
          currentUser={currentUser || undefined}
          onBotConnected={(botName) => {
            handleSimulateInboundMessage('TELEGRAM', botName);
          }}
          onSendTestMessage={(channelType, botName) => {
            handleSimulateInboundMessage(channelType, botName);
          }}
        />
      )}

      {/* 4. Gemini AI Sales Bot Assistant View */}
      {activeNav === 'ai' && <AiBotView lang={lang} />}

      {/* 5. Settings & Subscription Billing View */}
      {activeNav === 'settings' && <SettingsView lang={lang} />}
    </div>
  );
}
