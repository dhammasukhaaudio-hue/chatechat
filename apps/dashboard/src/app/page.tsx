'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ConversationList } from '../components/ConversationList';
import { ChatArea } from '../components/ChatArea';
import { CustomerProfile } from '../components/CustomerProfile';
import { CustomersView } from '../components/CustomersView';
import { ChannelsView, getInitialChannels } from '../components/ChannelsView';
import { AiBotView } from '../components/AiBotView';
import { SettingsView } from '../components/SettingsView';
import { LoginView } from '../components/LoginView';
import { ProfileModal } from '../components/ProfileModal';
import { ChateChatLogo } from '../components/ChateChatLogo';
import { useSocket } from '../hooks/useSocket';
import { Conversation, Message, CannedResponse, ChannelQuotaDetails, ChannelType, ConversationStatus, HandoverStatus } from '../types';
import { Language } from '../lib/translations';
import { getApiBaseUrl } from '../lib/api-config';
import {
  Menu,
  Zap,
  Globe,
  MessageSquare,
  Users,
  Layers,
  Bot,
  Settings as SettingsIcon,
} from 'lucide-react';

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

// Web Audio Alert Chime for Incoming Customer Messages & Mobile Notifications
let sharedAudioCtx: AudioContext | null = null;

const playAlertChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Mobile haptic vibration if supported (Android / mobile devices)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 60, 140]);
      } catch {}
    }

    // Melodic two-tone alert chime (G5 784Hz -> C6 1046.5Hz)
    const now = ctx.currentTime;
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Second tone (higher pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.40);
  } catch {}
};

if (typeof window !== 'undefined') {
  (window as any).playAlertChime = playAlertChime;
  // Unlock audio on first touch/click
  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && (!sharedAudioCtx || sharedAudioCtx.state === 'suspended')) {
        if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
        sharedAudioCtx.resume().catch(() => {});
      }
    } catch {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

export default function InboxPage() {
  const [activeNav, setActiveNav] = useState('inbox');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConvIdRef = useRef<string | null>(activeConversationId);
  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);
  const [lang, setLang] = useState<Language>('my');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'info' | 'password'>('info');

  // Responsive: On mobile screens upon initial load, show conversation list instead of defaulting to a selected chat
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setActiveConversationId(null);
    }
  }, []);

  // Authentication State for Frontend (:3000)
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    organizationId?: string;
    organizationName?: string;
    teamCode?: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);

  // Multi-tenant organization isolation namespaces
  const userStorageKey = (currentUser?.email || currentUser?.name || 'guest')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const orgId = currentUser?.organizationId || (currentUser?.name?.toLowerCase().includes('royal') || currentUser?.name?.toLowerCase() === 'mexes' ? 'org_royal' : `org_${userStorageKey}`);
  const convStorageKey = `chatechat_convs_${orgId}`;
  const msgStorageKey = `chatechat_msgs_${orgId}`;
  const channelStorageKey = `chatechat_channels_${orgId}`;
  const readStorageKey = `chatechat_read_chats_${orgId}`;
  const readChatIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(readStorageKey);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) readChatIdsRef.current = new Set(arr);
      }
    } catch {}
  }, [readStorageKey]);

  // Customer List with rich data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // Load Session on Mount & Listen for Updates
  useEffect(() => {
    const loadSession = () => {
      try {
        const saved = localStorage.getItem('chatechat_agent_session');
        if (saved) {
          const user = JSON.parse(saved);
          // Backwards compatibility: ensure organizationId and teamCode exist
          if (!user.organizationId) {
            if (user.name?.toLowerCase().includes('royal') || user.name?.toLowerCase() === 'mexes' || user.email?.includes('michael')) {
              user.organizationId = 'org_royal';
              user.organizationName = 'ChateChat Official (Mexes Shop)';
              user.teamCode = 'CHATE-101';
            } else if (user.name?.toLowerCase() === 'lynn') {
              user.organizationId = 'org_lynn';
              user.organizationName = "Lynn's Private Shop";
              user.teamCode = 'LYNN-202';
            } else {
              user.organizationId = `org_${(user.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
              user.organizationName = `${user.name || 'User'}'s Shop`;
              user.teamCode = `${(user.name || 'USER').toUpperCase().slice(0, 4)}-101`;
            }
          }

          // Auto-heal if old template preset 'Aung Min Store' was retained
          if (user.organizationName === 'Aung Min Store' || (user.organizationName === 'Royal Fashion Myanmar' && user.name?.toLowerCase() !== 'admin')) {
            try {
              const savedBiz = localStorage.getItem('chatechat_biz_' + user.organizationId);
              if (savedBiz) {
                const b = JSON.parse(savedBiz);
                if (b.name) user.organizationName = b.name;
              } else {
                user.organizationName = `${user.name || 'My'} Shop`;
              }
              localStorage.setItem('chatechat_agent_session', JSON.stringify(user));
            } catch {}
          }

          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (e) {
        // ignore
      } finally {
        setAuthLoaded(true);
      }
    };

    loadSession();

    const handleStorage = () => loadSession();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Hydrate conversations and ensure connected bot threads appear
  useEffect(() => {
    if (!currentUser) return;

    try {
      if (typeof window !== 'undefined' && window.location.search.includes('clear=true')) {
        try {
          localStorage.removeItem(convStorageKey);
          localStorage.removeItem(msgStorageKey);
        } catch {}
      }

      const savedConvs = localStorage.getItem(convStorageKey);
      const savedMsgs = localStorage.getItem(msgStorageKey);

      // Multi-tenant isolation: demo mock conversations ONLY for demo mode (e.g. org_demo)
      // Real user shops start with a 100% clean inbox!
      const isDemoOrg = orgId === 'org_demo';
      const defaultConvs = isDemoOrg ? INITIAL_CONVERSATIONS : [];
      const defaultMsgs = isDemoOrg ? INITIAL_MESSAGES : {};

      let initialConvs: Conversation[] = savedConvs ? JSON.parse(savedConvs) : defaultConvs;
      let initialMsgs: Record<string, Message[]> = savedMsgs ? JSON.parse(savedMsgs) : defaultMsgs;

      // Defensive customer sanitation for all loaded conversations
      if (Array.isArray(initialConvs)) {
        initialConvs = initialConvs.map((c, idx) => ({
          ...c,
          id: c.id || `conv_${idx}`,
          unreadCount: c.unreadCount ?? 0,
          customer: {
            id: c.customer?.id || c.customerId || `cust_${idx}`,
            name: c.customer?.name || (c as any).customerName || 'Telegram Customer',
            phone: c.customer?.phone || (c as any).phone || '',
            address: c.customer?.address || '',
            city: c.customer?.city || '',
            totalOrders: c.customer?.totalOrders ?? 0,
            totalSpentMmk: c.customer?.totalSpentMmk ?? 0,
            tags: c.customer?.tags || ['Customer'],
            identities: c.customer?.identities || [],
          },
        }));
      } else {
        initialConvs = [];
      }

      // Filter out demo mock conversations (conv_1, conv_2, conv_3, conv_4) for real organizations!
      if (!isDemoOrg && initialConvs.length > 0) {
        const cleanedConvs = initialConvs.filter((c) => !['conv_1', 'conv_2', 'conv_3', 'conv_4'].includes(c.id));
        if (cleanedConvs.length !== initialConvs.length) {
          initialConvs = cleanedConvs;
          try { localStorage.setItem(convStorageKey, JSON.stringify(initialConvs)); } catch {}
        }
      }

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
              organizationId: orgId,
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
      if (initialConvs.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setActiveConversationId(initialConvs[0].id);
      }

      // Sync any live Telegram conversations received by backend 24/7 Long Polling
      const syncTelegramChats = () => {
        // Auto-check live Telegram bot status on backend to sync across devices (e.g. Mobile App)
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/status?organizationId=${encodeURIComponent(orgId)}`)
          .then((r) => r.json())
          .then((status) => {
            try {
              const savedCh = localStorage.getItem(channelStorageKey);
              let list = savedCh ? JSON.parse(savedCh) : null;
              if (!Array.isArray(list) || list.length === 0) {
                list = getInitialChannels(lang === 'my', getApiBaseUrl());
              }
              const tgIdx = list.findIndex((c: any) => c.type === 'TELEGRAM');
              if (tgIdx >= 0) {
                if (status && status.success && status.isActive && status.botUsername) {
                  list[tgIdx].isActive = true;
                  list[tgIdx].accountName = status.botUsername;
                } else if (status && status.success && !status.isActive) {
                  list[tgIdx].isActive = false;
                  list[tgIdx].accountName = lang === 'my' ? 'မချိတ်ဆက်ရသေးပါ' : 'Not Connected';
                  if (orgId !== 'org_royal') {
                    try { localStorage.removeItem('chatechat_telegram_token_' + orgId); } catch {}
                  }
                }
                localStorage.setItem(channelStorageKey, JSON.stringify(list));
              }
            } catch {}
          })
          .catch(() => {});

        // Always fetch Telegram chats so all agents and mobile devices in the workspace can view customer conversations
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/chats?organizationId=${encodeURIComponent(orgId)}`)
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
                      const rawConv = entry.conv;
                      const safeCustomer = rawConv.customer || {
                        id: rawConv.customerId || `cust_${key}`,
                        name: rawConv.customerName || (rawConv.externalThreadId ? `@${rawConv.externalThreadId}` : 'Telegram Customer'),
                        phone: rawConv.phone || '',
                        identities: [],
                      };
                      const safeConv: Conversation = {
                        ...rawConv,
                        id: rawConv.id || key,
                        channelType: rawConv.channelType || 'TELEGRAM',
                        customer: safeCustomer,
                      };
                      const idx = updated.findIndex((c) => c.id === safeConv.id);
                      const isCurrentlyActive = activeConvIdRef.current === safeConv.id;
                      const isMarkedRead = isCurrentlyActive || readChatIdsRef.current.has(safeConv.id);
                      const targetUnread = isMarkedRead ? 0 : (safeConv.unreadCount || 0);
                      if (idx >= 0) {
                        if (
                          updated[idx].lastMessageAt !== safeConv.lastMessageAt ||
                          updated[idx].lastMessageSnippet !== safeConv.lastMessageSnippet ||
                          updated[idx].handoverStatus !== safeConv.handoverStatus ||
                          updated[idx].unreadCount !== targetUnread ||
                          !updated[idx].customer
                        ) {
                          updated[idx] = {
                            ...updated[idx],
                            ...safeConv,
                            unreadCount: targetUnread,
                          };
                          hasChange = true;
                        }
                      } else {
                        updated = [{ ...safeConv, unreadCount: targetUnread }, ...updated];
                        hasChange = true;
                      }
                    }
                  }
                  if (hasChange) {
                    updated.sort((a, b) => {
                      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                      return timeB - timeA;
                    });
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
                      // Deduplicate server messages by id AND content/sender/timestamp
                      const cleanServerMessages: Message[] = [];
                      for (const msg of entry.messages) {
                        const isDup = cleanServerMessages.some(
                          (m) =>
                            m.id === msg.id ||
                            (msg.clientMessageId && (m.id === msg.clientMessageId || m.clientMessageId === msg.clientMessageId)) ||
                            (m.senderType === msg.senderType &&
                              m.content?.trim() === msg.content?.trim() &&
                              Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 15000)
                        );
                        if (!isDup) {
                          cleanServerMessages.push(msg);
                        }
                      }

                      const serverIdSet = new Set(cleanServerMessages.map((m) => m.id));
                      const serverClientIds = new Set(
                        cleanServerMessages.filter((m) => m.clientMessageId).map((m) => m.clientMessageId!)
                      );

                      // Retain any pending local optimistic messages (< 20 seconds old) that haven't been confirmed yet
                      const localMessages = prev[key] || [];
                      const pendingOptimistic: Message[] = [];
                      const now = Date.now();

                      for (const localMsg of localMessages) {
                        if (localMsg.id.startsWith('m_')) {
                          const isAlreadyOnServer =
                            serverIdSet.has(localMsg.id) ||
                            (localMsg.clientMessageId && serverClientIds.has(localMsg.clientMessageId)) ||
                            cleanServerMessages.some(
                              (sm) =>
                                sm.senderType === 'AGENT' &&
                                sm.content?.trim() === localMsg.content?.trim() &&
                                Math.abs(new Date(sm.createdAt).getTime() - new Date(localMsg.createdAt).getTime()) < 10000
                            );

                          if (!isAlreadyOnServer) {
                            const age = now - new Date(localMsg.createdAt).getTime();
                            if (age < 20000) {
                              pendingOptimistic.push(localMsg);
                            }
                          }
                        }
                      }

                      // Merge server messages with pending optimistic messages
                      const combined = [...cleanServerMessages, ...pendingOptimistic];
                      combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                      const prevList = prev[key] || [];
                      const isDifferent =
                        prevList.length !== combined.length ||
                        prevList[prevList.length - 1]?.id !== combined[combined.length - 1]?.id;

                      if (isDifferent) {
                        updated[key] = combined;
                        hasNewMsg = true;
                      }
                    }
                  }
                  if (hasNewMsg) {
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
          const savedToken = localStorage.getItem('chatechat_telegram_token_' + orgId) || (orgId === 'org_royal' ? localStorage.getItem('chatechat_telegram_token') : null);
          if (savedToken) {
            fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/status?organizationId=${encodeURIComponent(orgId)}`)
              .then((r) => r.json())
              .then((status) => {
                if (status && status.success && !status.isRunning) {
                  console.log('🔄 Telegram polling is idle on backend, auto-resuming...');
                  fetch(`${getApiBaseUrl()}/api/v1/webhooks/connect/telegram`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      botToken: savedToken,
                      organizationId: orgId,
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

  // 3-Minute Agent Inactivity Auto-Handback to Bot
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

    const checkInactivity = () => {
      const now = Date.now();
      let hasChanges = false;

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.handoverStatus === 'TRANSFERRED_TO_AGENT') {
            const lastAgentTime = (c as any).lastAgentMessageAt
              ? new Date((c as any).lastAgentMessageAt).getTime()
              : (c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0);

            if (lastAgentTime > 0 && now - lastAgentTime >= IDLE_TIMEOUT_MS) {
              hasChanges = true;

              // Insert system notice
              const autoNoticeMsg: Message = {
                id: `sys_idle_${Date.now()}_${c.id}`,
                conversationId: c.id,
                senderType: 'SYSTEM',
                senderName: 'ChateChat System',
                type: 'TEXT',
                content: '🤖 အေးဂျင့် ၃ မိနစ်ခန့် မအားလပ်သဖြင့် AI Bot သို့ အလိုအလျောက် ပြန်လည်လွှဲပြောင်းပေးလိုက်ပါသည်',
                isInternal: true,
                createdAt: new Date().toISOString(),
              };

              setMessages((mPrev) => {
                const nextM = {
                  ...mPrev,
                  [c.id]: [...(mPrev[c.id] || []), autoNoticeMsg],
                };
                try { localStorage.setItem(msgStorageKey, JSON.stringify(nextM)); } catch {}
                return nextM;
              });

              // Notify backend if Telegram
              if (c.channelType === 'TELEGRAM') {
                const tgChatId = c.externalThreadId?.replace(/^tg_/, '');
                if (tgChatId) {
                  fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/resolve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatId: tgChatId }),
                  }).catch(() => {});
                }
              }

              return {
                ...c,
                handoverStatus: 'BOT_HANDLING' as HandoverStatus,
              };
            }
          }
          return c;
        });

        if (hasChanges) {
          try { localStorage.setItem(convStorageKey, JSON.stringify(updated)); } catch {}
          return updated;
        }
        return prev;
      });
    };

    const interval = setInterval(checkInactivity, 15000);
    return () => clearInterval(interval);
  }, [convStorageKey, msgStorageKey]);

  const handleLoginSuccess = (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    organizationId?: string;
    organizationName?: string;
    teamCode?: string;
  }) => {
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
      content: 'KBZ Bank: 0123456789\nCB Bank: 9876543210\nAYA Bank: 1122334455\n(အကောင့်အမည်: ဆိုင်ငွေလက်ခံအကောင့်)',
      tags: ['bank'],
    },
  ]);

  // Dynamic quota details based on actual connected channels
  const [activeChannelsCount, setActiveChannelsCount] = useState<number>(0);

  useEffect(() => {
    const updateQuota = () => {
      try {
        const saved = localStorage.getItem(channelStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const count = parsed.filter((c: any) => c.isActive && c.type !== 'WEB_WIDGET').length;
            setActiveChannelsCount(count);
          }
        }
      } catch {}
    };
    updateQuota();
    const interval = setInterval(updateQuota, 2500);
    return () => clearInterval(interval);
  }, [channelStorageKey]);

  const quotaDetails: ChannelQuotaDetails = {
    maxChannels: 3,
    activeChannelsCount: activeChannelsCount,
    remainingSlots: Math.max(0, 3 - activeChannelsCount),
    planConfig: {
      tier: 'TIER_3_CHANNELS',
      name: '3 Channels Pro Plan',
      priceMmk: 12000,
      maxChannels: 3,
    },
    channels: [
      { channelType: 'TELEGRAM', accountName: 'Telegram Bot API', isActive: activeChannelsCount > 0 },
      { channelType: 'MESSENGER', accountName: 'Facebook Messenger', isActive: false },
      { channelType: 'VIBER', accountName: 'Viber Business & Bot', isActive: false },
      { channelType: 'TIKTOK', accountName: 'TikTok Direct Messages', isActive: false },
    ],
  };

  // Socket.IO hook for real-time live events (isolated per organization)
  const { sendOutgoingMessage, joinConversation } = useSocket({
    organizationId: orgId,
    agentId: currentUser?.id || 'agent_1',
    onIncomingMessage: (data) => {
      const { message, conversation } = data;
      if (!message || !message.conversationId) return;
      const convId = message.conversationId;
      const isCurrentlyActive = activeConvIdRef.current === convId;

      setMessages((prev) => {
        const currentList = prev[convId] || [];
        const isDuplicate = currentList.some(
          (m) =>
            m.id === message.id ||
            (m.senderType === message.senderType &&
              m.content?.trim() === message.content?.trim() &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 15000)
        );
        if (isDuplicate) return prev;
        const next = {
          ...prev,
          [convId]: [...currentList, message],
        };
        try { localStorage.setItem(msgStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
      if (conversation && conversation.id) {
        if (!isCurrentlyActive) {
          readChatIdsRef.current.delete(conversation.id);
          try {
            localStorage.setItem(readStorageKey, JSON.stringify(Array.from(readChatIdsRef.current)));
          } catch {}
        }
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conversation.id);
          const next = exists
            ? prev.map((c) =>
                c.id === conversation.id
                  ? {
                      ...c,
                      lastMessageSnippet: message.content,
                      lastMessageAt: message.createdAt,
                      unreadCount: isCurrentlyActive ? 0 : (c.unreadCount || 0) + (message.senderType === 'CUSTOMER' ? 1 : 0),
                      handoverStatus: conversation.handoverStatus || c.handoverStatus,
                    }
                  : c
              )
            : [{ ...conversation, unreadCount: isCurrentlyActive ? 0 : 1 }, ...prev];
          next.sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
          });
          try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    },
    onOutgoingMessage: (data: any) => {
      const { message, conversationId } = data;
      const convId = conversationId || message?.conversationId;
      if (!convId || !message) return;
      const clientMsgId = data.clientMessageId || message.clientMessageId;
      setMessages((prev) => {
        const currentList = prev[convId] || [];
        const matchIdx = currentList.findIndex(
          (m) =>
            m.id === message.id ||
            (clientMsgId && (m.id === clientMsgId || m.clientMessageId === clientMsgId)) ||
            (m.senderType === message.senderType &&
              m.content?.trim() === message.content?.trim() &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 15000)
        );
        let nextList: Message[];
        if (matchIdx >= 0) {
          nextList = [...currentList];
          nextList[matchIdx] = { ...nextList[matchIdx], ...message, status: 'sent' };
        } else {
          nextList = [...currentList, message];
        }
        const next = {
          ...prev,
          [convId]: nextList,
        };
        try { localStorage.setItem(msgStorageKey, JSON.stringify(next)); } catch {}
        return next;
      });
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convId
            ? { ...c, lastMessageSnippet: message.content, lastMessageAt: message.createdAt }
            : c
        );
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

  // Auto-heal invalid activeConversationId on mobile/desktop
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const exists = conversations.some((c) => c.id === activeConversationId);
      if (!exists) {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setActiveConversationId(null);
        } else {
          setActiveConversationId(conversations[0]?.id || null);
        }
      }
    }
  }, [activeConversationId, conversations]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const unreadTotal = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  const handleSendMessage = async (content: string, isInternal: boolean) => {
    if (!activeConversationId) return;

    const senderName = currentUser?.name || 'မသူဇာ';
    const senderId = currentUser?.id || 'agent_1';
    const clientMessageId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newMessage: Message = {
      id: clientMessageId,
      clientMessageId,
      conversationId: activeConversationId,
      senderType: 'AGENT',
      senderId,
      senderName,
      type: isInternal ? 'NOTE' : 'TEXT',
      content,
      isInternal,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => {
      const next = {
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), newMessage],
      };
      try { localStorage.setItem(msgStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });

    const nowIso = new Date().toISOString();
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessageSnippet: content,
              lastMessageAt: nowIso,
              lastAgentMessageAt: nowIso,
              unreadCount: 0,
            }
          : c
      );
      next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });

    if (!isInternal) {
      if (activeConversationId.startsWith('conv_tg_')) {
        const chatId = activeConversationId.replace('conv_tg_', '');
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, text: content, agentName: senderName, clientMessageId }),
        })
          .then((r) => r.json())
          .then((resData) => {
            if (resData?.success && resData?.externalMessageId) {
              const serverMsgId = `msg_agent_${resData.externalMessageId}`;
              setMessages((prev) => {
                const list = prev[activeConversationId] || [];
                const updatedList = list.map((m) =>
                  m.id === clientMessageId || m.clientMessageId === clientMessageId
                    ? { ...m, id: serverMsgId, clientMessageId, status: 'sent' as const }
                    : m
                );
                const next = { ...prev, [activeConversationId]: updatedList };
                try { localStorage.setItem(msgStorageKey, JSON.stringify(next)); } catch {}
                return next;
              });
            }
          })
          .catch((err) => {
            console.warn('Failed to send Telegram message:', err);
          });
      } else {
        sendOutgoingMessage({
          conversationId: activeConversationId,
          agentId: senderId,
          agentName: senderName,
          content,
          clientMessageId,
        });
      }
    }
  };

  const handleAssignToMe = () => {
    if (!activeConversationId) return;
    const agentName = currentUser?.name || 'မသူဇာ';
    const agentId = currentUser?.id || 'agent_1';

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (currentConv?.channelType === 'TELEGRAM') {
      const tgChatId = currentConv.externalThreadId?.replace(/^tg_/, '');
      if (tgChatId) {
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/takeover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: tgChatId, agentName }),
        }).catch(() => {});
      }
    }

    const nowIso = new Date().toISOString();
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              assignedAgent: { id: agentId, name: agentName },
              handoverStatus: 'TRANSFERRED_TO_AGENT' as HandoverStatus,
              lastAgentMessageAt: nowIso,
              status: 'ACTIVE' as ConversationStatus,
            }
          : c
      );
      next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      try { localStorage.setItem(convStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleResolve = () => {
    if (!activeConversationId) return;
    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (currentConv?.channelType === 'TELEGRAM') {
      const tgChatId = currentConv.externalThreadId?.replace(/^tg_/, '');
      if (tgChatId) {
        fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: tgChatId }),
        }).catch(() => {});
      }
    }

    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              status: 'RESOLVED' as ConversationStatus,
              handoverStatus: 'BOT_HANDLING' as HandoverStatus,
            }
          : c
      );
      next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
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

  const handleClearAllChats = async () => {
    try {
      localStorage.removeItem(convStorageKey);
      localStorage.removeItem(msgStorageKey);
    } catch {}
    setConversations([]);
    setMessages({});
    setActiveConversationId(null);
    activeConvIdRef.current = null;
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/clear-chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
    } catch {}
  };

  // If not authenticated, render Frontend Login View
  if (authLoaded && !isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full max-w-full overflow-hidden overflow-x-hidden bg-slate-100 font-burmese">
      {/* 1. Navigation & Quota Sidebar (Desktop static sidebar, Mobile slide-over drawer) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        quotaDetails={quotaDetails}
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav);
          if (nav === 'inbox') setActiveConversationId(null);
          setIsMobileMenuOpen(false);
        }}
        unreadTotal={unreadTotal}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser || undefined}
        onLogout={handleLogout}
        onOpenProfile={(tab) => {
          setProfileInitialTab(tab || 'info');
          setShowProfileModal(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full max-w-full flex flex-col h-full overflow-hidden relative">
        {/* Mobile Top Header (Hidden on desktop lg:hidden; also hidden when actively chatting on mobile) */}
        {!(activeNav === 'inbox' && activeConversationId) && (
          <header className="safe-top-mobile pb-3.5 px-4 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between lg:hidden shrink-0 z-30 select-none">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Open Menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <ChateChatLogo size="xs" showText={true} />
                <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                  {currentUser?.teamCode || 'SOLO'}
                </span>
              </div>
            </div>

            {/* Quick Language Toggle */}
            <button
              onClick={() => setLang(lang === 'my' ? 'en' : 'my')}
              className="px-2 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 transition"
            >
              <Globe size={12} className="text-blue-400" />
              <span>{lang === 'my' ? 'MM' : 'EN'}</span>
            </button>
          </header>
        )}

        {/* Dynamic Views Container */}
        <div className="flex-1 min-w-0 w-full max-w-full flex overflow-hidden relative">
          {activeNav === 'inbox' && (
            <div className="flex flex-1 min-w-0 w-full max-w-full h-full overflow-hidden relative">
              {/* 2. Conversation Triage List */}
              <div
                className={`h-full flex-col ${
                  activeConversationId ? 'hidden lg:flex lg:w-80 xl:w-96 shrink-0' : 'flex w-full lg:w-80 xl:w-96 shrink-0'
                }`}
              >
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={(id) => {
                    setActiveConversationId(id);
                    activeConvIdRef.current = id;
                    readChatIdsRef.current.add(id);
                    try {
                      localStorage.setItem(readStorageKey, JSON.stringify(Array.from(readChatIdsRef.current)));
                    } catch {}
                    fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/mark-read`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ convId: id }),
                    }).catch(() => {});
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
                  onClearAllChats={handleClearAllChats}
                />
              </div>

              {/* 3. Active Chat Window */}
              <div
                className={`h-full flex-1 min-w-0 w-full max-w-full flex-col overflow-hidden ${
                  activeConversationId ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <ChatArea
                  conversation={activeConversation}
                  messages={currentMessages}
                  cannedResponses={cannedResponses}
                  onSendMessage={handleSendMessage}
                  onAssignToMe={handleAssignToMe}
                  onResolve={handleResolve}
                  onBack={() => setActiveConversationId(null)}
                  onToggleProfile={() => setShowMobileProfile((p) => !p)}
                />
              </div>

              {/* 4. Customer Unified Profile & CRM Info (Desktop Panel: xl and above) */}
              {activeConversation && (
                <div className="hidden xl:flex h-full shrink-0">
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
                </div>
              )}

              {/* Mobile / Tablet Slide-Up Drawer for Customer Profile */}
              {activeConversation && showMobileProfile && (
                <div className="fixed inset-0 z-50 xl:hidden flex flex-col justify-end">
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    onClick={() => setShowMobileProfile(false)}
                  />
                  <div className="relative z-10 w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
                    <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <span className="font-bold text-sm text-slate-800">{lang === 'my' ? 'ဝယ်သူ အချက်အလက် (Customer Profile)' : 'Customer Profile'}</span>
                      <button
                        onClick={() => setShowMobileProfile(false)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700"
                      >
                        {lang === 'my' ? '✕ ပိတ်မည်' : '✕ Close'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Full Customer CRM View */}
          {activeNav === 'customers' && (
            <div className="flex-1 h-full overflow-y-auto pb-16 lg:pb-0">
              <CustomersView
                customers={conversations.map((c) => c.customer).filter(Boolean)}
                lang={lang}
              />
            </div>
          )}

          {/* 3. Multi-Channel Integration Hub View */}
          {activeNav === 'channels' && (
            <div className="flex-1 h-full overflow-y-auto pb-16 lg:pb-0">
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
            </div>
          )}

          {/* 4. Gemini AI Sales Bot Assistant View */}
          {activeNav === 'ai' && (
            <div className="flex-1 h-full overflow-y-auto pb-16 lg:pb-0">
              <AiBotView lang={lang} />
            </div>
          )}

          {/* 5. Settings & Subscription Billing View */}
          {(activeNav === 'settings' || activeNav.startsWith('settings_')) && (
            <div className="flex-1 h-full overflow-y-auto pb-16 lg:pb-0">
              <SettingsView
                lang={lang}
                activeSubTab={
                  activeNav === 'settings_agents'
                    ? 'agents'
                    : activeNav === 'settings_general'
                    ? 'general'
                    : 'subscription'
                }
                currentUser={currentUser || undefined}
              />
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar (Hidden when actively chatting or on desktop) */}
        {!(activeNav === 'inbox' && activeConversationId) && (
          <nav className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 lg:hidden shrink-0 z-30 select-none">
            <button
              onClick={() => {
                setActiveNav('inbox');
                setActiveConversationId(null);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative ${
                activeNav === 'inbox' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <MessageSquare size={19} />
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[9px] font-bold">
                    {unreadTotal}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">Inbox</span>
            </button>

            <button
              onClick={() => setActiveNav('customers')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'customers' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={19} />
              <span className="text-[10px] mt-1">CRM</span>
            </button>

            <button
              onClick={() => setActiveNav('channels')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'channels' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={19} />
              <span className="text-[10px] mt-1">{lang === 'my' ? 'ချန်နယ်' : 'Channels'}</span>
            </button>

            <button
              onClick={() => setActiveNav('ai')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'ai' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot size={19} />
              <span className="text-[10px] mt-1">{lang === 'my' ? 'AI စက်' : 'AI Bot'}</span>
            </button>

            <button
              onClick={() => setActiveNav('settings')}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeNav === 'settings' || activeNav.startsWith('settings_') ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SettingsIcon size={19} />
              <span className="text-[10px] mt-1">{lang === 'my' ? 'ဆက်တင်' : 'Settings'}</span>
            </button>
          </nav>
        )}
      </div>

      {/* User Profile & Password Change Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => setCurrentUser(updated)}
        initialTab={profileInitialTab}
        lang={lang}
      />
    </div>
  );
}
