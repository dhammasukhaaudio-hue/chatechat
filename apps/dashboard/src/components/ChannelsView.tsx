'use client';

import React, { useState, useEffect } from 'react';
import { ChannelQuotaDetails, ChannelType } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { Check, Copy, ExternalLink, ShieldCheck, AlertCircle, RefreshCw, X, Send, Bot, Power, PlusCircle } from 'lucide-react';
import { getApiBaseUrl } from '../lib/api-config';

interface ChannelItem {
  type: ChannelType;
  name: string;
  accountName: string;
  pageId: string;
  isActive: boolean;
  webhookUrl: string;
  description: string;
  forwardWebhookUrl?: string;
  mode?: string;
}

interface ChannelsViewProps {
  quotaDetails: ChannelQuotaDetails;
  lang: 'my' | 'en';
  currentUser?: { id?: string; name?: string; email?: string; role?: string };
  onBotConnected?: (botName: string) => void;
  onSendTestMessage?: (channelType: ChannelType, botName: string) => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({ quotaDetails, lang, currentUser, onBotConnected, onSendTestMessage }) => {
  const isMy = lang === 'my';
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Multi-tenant organization isolation
  const orgId = (currentUser as any)?.organizationId || (currentUser?.name?.toLowerCase().includes('royal') || currentUser?.name?.toLowerCase() === 'mexes' ? 'org_royal' : `org_${(currentUser?.email || currentUser?.name || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  const storageKey = `chatechat_channels_${orgId}`;

  // Channels state
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [channelsLoaded, setChannelsLoaded] = useState(false);

  // Telegram Connection Modal State
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [assignAllAgents, setAssignAllAgents] = useState(true);
  const [integrationMode, setIntegrationMode] = useState<'STANDALONE' | 'WEBHOOK_RELAY'>('STANDALONE');
  const [forwardWebhookUrl, setForwardWebhookUrl] = useState('');
  const [disableAutoReply, setDisableAutoReply] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Facebook Connection Modal State
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [fbPageName, setFbPageName] = useState('My Shop FB Page');
  const [fbPageId, setFbPageId] = useState('109823478912345');

  // Load Channels per user on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setChannels(JSON.parse(saved));
        setChannelsLoaded(true);

        // Auto-verify backend polling if telegram token is saved for this organization
        try {
          const savedToken = localStorage.getItem('chatechat_telegram_token_' + orgId) || (orgId === 'org_royal' ? localStorage.getItem('chatechat_telegram_token') : null);
          if (savedToken) {
            fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/status?organizationId=${encodeURIComponent(orgId)}`)
              .then((r) => r.json())
              .then((status) => {
                if (status && status.success && !status.isRunning) {
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
        return;
      }
    } catch (e) {}

    // Default channels for any user: all channels start completely CLEAN & DISCONNECTED!
    const isDefaultAdmin = false;

    const initialChannels: ChannelItem[] = [
      {
        type: 'MESSENGER',
        name: 'Facebook Messenger',
        accountName: isDefaultAdmin ? 'Royal Fashion Myanmar FB Page' : (isMy ? 'မချိတ်ဆက်ရသေးပါ' : 'Not Connected'),
        pageId: isDefaultAdmin ? '109823478912345' : '-',
        isActive: !!isDefaultAdmin,
        webhookUrl: `${getApiBaseUrl()}/api/v1/webhooks/messenger`,
        description: isMy
          ? 'Facebook Page သို့ လာရောက်မေးမြန်းသော Messenger စာတိုများအားလုံးကို အလိုအလျောက် ရယူပေးပါသည်'
          : 'Syncs all inbound customer messages from your Meta Business Facebook Page',
      },
      {
        type: 'TELEGRAM',
        name: 'Telegram Bot API',
        accountName: isDefaultAdmin ? '@RoyalFashionBot' : (isMy ? 'မချိတ်ဆက်ရသေးပါ' : 'Not Connected'),
        pageId: isDefaultAdmin ? 'bot6789012345' : '-',
        isActive: !!isDefaultAdmin,
        webhookUrl: `${getApiBaseUrl()}/api/v1/webhooks/telegram/bot`,
        description: isMy
          ? 'Telegram Bot သို့ customer များ ပို့သမျှ စာတို၊ ဓာတ်ပုံနှင့် ဖုန်းနံပါတ်များကို ၂၄ နာရီ ကန့်သတ်ချက်မရှိ စာပြန်နိုင်ပါသည်'
          : 'Connects official Telegram bot for 24/7 unlimited customer inquiries and broadcast',
      },
      {
        type: 'VIBER',
        name: 'Viber Business & Bot',
        accountName: isMy ? 'မချိတ်ဆက်ရသေးပါ' : 'Not Connected',
        pageId: '-',
        isActive: false,
        webhookUrl: `${getApiBaseUrl()}/api/v1/webhooks/viber/bot`,
        description: isMy
          ? 'Viber Public Account သို့မဟုတ် Bot ဖြင့် ချိတ်ဆက်၍ မြန်မာနိုင်ငံရှိ Viber သုံးစွဲသူများနှင့် တိုက်ရိုက် စကားပြောနိုင်ပါသည်'
          : 'Connect official Viber Bot to chat with Viber users in Myanmar',
      },
      {
        type: 'TIKTOK',
        name: 'TikTok Direct Messages',
        accountName: isMy ? 'မချိတ်ဆက်ရသေးပါ' : 'Not Connected',
        pageId: '-',
        isActive: false,
        webhookUrl: `${getApiBaseUrl()}/api/v1/webhooks/tiktok/bot`,
        description: isMy
          ? 'TikTok Shop / TikTok Live ကြည့်ရှုပြီး လာရောက်မေးမြန်းသော Direct Message (DM) များကို လက်ခံဖြေကြားနိုင်ပါသည်'
          : 'Manage TikTok Live and Shop buyer inquiries directly from your unified inbox',
      },
      {
        type: 'WEB_WIDGET',
        name: 'Website Live Chat Widget',
        accountName: 'Embeddable Web Component',
        pageId: 'script-tag-chatechat.js',
        isActive: true,
        webhookUrl: `${getApiBaseUrl()}/widget`,
        description: isMy
          ? 'မိမိဆိုင်၏ Website တွင် JivoChat ကဲ့သို့ Floating Chat Widget အဖြစ် ထည့်သွင်းအသုံးပြုနိုင်ပါသည်'
          : 'Lightweight pure JS floating chat widget embeddable on any eCommerce website',
      },
    ];

    setChannels(initialChannels);
    setChannelsLoaded(true);
  }, [storageKey, isMy]);

  // Save Channels helper
  const saveChannels = (updated: ChannelItem[]) => {
    setChannels(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {}
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ==========================================
  // CONNECT TELEGRAM BOT
  // ==========================================
  const handleConnectTelegram = async () => {
    const cleanToken = telegramToken.trim();
    if (!cleanToken) {
      setConnectError('Telegram Bot Token ထည့်သွင်းရန် လိုအပ်ပါသည်');
      return;
    }

    setIsConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    let botName = cleanToken.includes(':') ? `@bot_${cleanToken.split(':')[0]}` : '@MyTelegramBot';
    let botId = cleanToken.includes(':') ? cleanToken.split(':')[0] : 'bot_' + Date.now();

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/webhooks/connect/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: cleanToken,
          organizationId: orgId,
          assignAllAgents,
          forwardWebhookUrl: integrationMode === 'WEBHOOK_RELAY' ? forwardWebhookUrl.trim() : undefined,
          disableAutoReply: integrationMode === 'WEBHOOK_RELAY' ? disableAutoReply : false,
          mode: integrationMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.botUsername) botName = data.botUsername.startsWith('@') ? data.botUsername : `@${data.botUsername}`;
        if (data.botId) botId = data.botId;
        localStorage.setItem('chatechat_telegram_token_' + orgId, cleanToken);
        if (orgId === 'org_royal') localStorage.setItem('chatechat_telegram_token', cleanToken);
      } else {
        setConnectError(data.error || 'Telegram Token ချိတ်ဆက်မှု မအောင်မြင်ပါ');
        setIsConnecting(false);
        return;
      }
    } catch (err: any) {
      setConnectError('Backend Server နှင့် ချိတ်ဆက်မရပါ: ' + err.message);
      setIsConnecting(false);
      return;
    }

    // UPDATE TELEGRAM CHANNEL IN STATE
    const updatedChannels = channels.map((c) => {
      if (c.type === 'TELEGRAM') {
        return {
          ...c,
          isActive: true,
          accountName: botName,
          pageId: `id_${botId}`,
          webhookUrl: `${getApiBaseUrl()}/api/v1/webhooks/telegram/${botId}`,
          forwardWebhookUrl: integrationMode === 'WEBHOOK_RELAY' ? forwardWebhookUrl.trim() : undefined,
          mode: integrationMode,
        };
      }
      return c;
    });

    saveChannels(updatedChannels);

    setConnectSuccess(
      isMy
        ? integrationMode === 'WEBHOOK_RELAY'
          ? `Telegram Bot (${botName}) အား Webhook Relay ဖြင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ! (Forwarding to: ${forwardWebhookUrl.trim() || 'Active'})`
          : `Telegram Bot (${botName}) အား ChateChat နှင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီခင်ဗျာ!`
        : `Telegram Bot (${botName}) successfully connected to ChateChat!`
    );

    setIsConnecting(false);

    // Auto navigate to Unified Inbox after 1.2s to show incoming messages
    setTimeout(() => {
      setIsTelegramModalOpen(false);
      setConnectSuccess(null);
      if (onBotConnected) {
        onBotConnected(botName);
      }
    }, 1200);
  };

  // ==========================================
  // CONNECT FACEBOOK PAGE
  // ==========================================
  const handleConnectFacebook = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedChannels = channels.map((c) => {
      if (c.type === 'MESSENGER') {
        return {
          ...c,
          isActive: true,
          accountName: fbPageName.trim() || 'My Facebook Page',
          pageId: fbPageId.trim() || '109823478912345',
        };
      }
      return c;
    });

    saveChannels(updatedChannels);
    setIsFacebookModalOpen(false);
  };

  // ==========================================
  // DISCONNECT CHANNEL
  // ==========================================
  const handleDisconnectChannel = (type: ChannelType) => {
    if (!confirm(isMy ? 'ဤချန်နယ် ချိတ်ဆက်မှုကို ဖြုတ်မည် သေချာပါသလား?' : 'Are you sure you want to disconnect this channel?')) {
      return;
    }

    const updatedChannels = channels.map((c) => {
      if (c.type === type) {
        return {
          ...c,
          isActive: false,
          accountName: isMy ? 'မချိတ်ဆက်ရသေးပါ' : 'Not Connected',
          pageId: '-',
        };
      }
      return c;
    });

    if (type === 'TELEGRAM') {
      fetch(`${getApiBaseUrl()}/api/v1/webhooks/telegram/disconnect?organizationId=${encodeURIComponent(orgId)}`, { method: 'POST' }).catch(() => {});
      try {
        localStorage.removeItem('chatechat_telegram_token_' + orgId);
        if (orgId === 'org_royal') localStorage.removeItem('chatechat_telegram_token');
      } catch {}
    }

    saveChannels(updatedChannels);
  };

  // Active channel count
  const activeCount = channels.filter((c) => c.isActive).length;

  return (
    <div className="flex-1 bg-slate-50 flex flex-col overflow-y-auto p-6 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Header & Quota Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {isMy ? 'လူမှုကွန်ရက် ချန်နယ်များ ချိတ်ဆက်ခြင်း' : 'Multi-Channel Integration Hub'}
              </h1>
              {currentUser?.name && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                  {currentUser.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isMy
                ? 'Facebook Messenger, Telegram, Viber, TikTok တို့မှ စာများကို စုပေါင်းလက်ခံရန် ချိတ်ဆက်ပါ'
                : 'Connect and manage inbound webhooks for Facebook Messenger, Telegram, Viber, and TikTok'}
            </p>
          </div>

          {/* Quota Limit Pill */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isMy ? 'လက်ရှိ ချိတ်ဆက်ထားသော ချန်နယ်' : 'Active Connected Channels'}
              </p>
              <p className="text-sm font-bold text-slate-900">
                {activeCount} / {quotaDetails.maxChannels} {isMy ? 'ချန်နယ်' : 'Channels'}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {quotaDetails.planConfig.name}
            </span>
          </div>
        </div>

        {/* Channel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels.map((channel) => (
            <div
              key={channel.name}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                channel.isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-90'
              }`}
            >
              <div>
                {/* Channel Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ChannelBadge channel={channel.type} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{channel.name}</h3>
                      <p className={`text-xs ${channel.isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                        {channel.accountName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      channel.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${channel.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                    {channel.isActive ? (isMy ? 'ချိတ်ဆက်ထားသည်' : 'Active') : isMy ? 'မချိတ်ရသေးပါ' : 'Disconnected'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{channel.description}</p>

                {/* Webhook / Long Polling Box */}
                {channel.type === 'TELEGRAM' && channel.isActive ? (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>
                          {channel.mode === 'WEBHOOK_RELAY'
                            ? '⚡ Webhook Relay စနစ်ဖြင့် ချိတ်ဆက်ထားသည်'
                            : '24/7 Live Long Polling တိုက်ရိုက်ချိတ်ဆက်ထားသည်'}
                        </span>
                      </div>
                      {channel.mode === 'WEBHOOK_RELAY' && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                          Relay Active
                        </span>
                      )}
                    </div>
                    {channel.forwardWebhookUrl && (
                      <div className="text-[11px] text-emerald-800 font-mono truncate">
                        Forwarding: <span className="font-bold underline">{channel.forwardWebhookUrl}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      {channel.mode === 'WEBHOOK_RELAY'
                        ? 'Customer စာတိုများကို ChateChat Inbox ထဲ စာရင်းသွင်းသလို သင့် Python/AI Bot ဆီသို့လည်း မပျက်မကွက် ချက်ချင်း လက်ဆင့်ကမ်းပေးနေပါသည်။'
                        : 'Customer များ Telegram App ထဲမှနေ၍ ဤ Bot ထံသို့ စာပို့သည်နှင့် စုပေါင်း Inbox ထဲသို့ စက္ကန့်မခြား အလိုအလျောက် ချက်ချင်း ရောက်ရှိပါမည်။'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Webhook Callback URL:</span>
                      <button
                        onClick={() => copyToClipboard(channel.webhookUrl, channel.name)}
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        {copiedKey === channel.name ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedKey === channel.name ? (isMy ? 'ကူးပြီးပြီ' : 'Copied') : isMy ? 'လင့်ခ်ကူးယူပါ' : 'Copy URL'}</span>
                      </button>
                    </div>
                    <code className="text-[11px] font-mono text-slate-800 break-all select-all block">
                      {channel.webhookUrl}
                    </code>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">ID: {channel.pageId}</span>
                <div className="flex items-center gap-2">
                  {channel.isActive ? (
                    <>
                      {(channel.type === 'TELEGRAM' || channel.type === 'MESSENGER') && onSendTestMessage && (
                        <button
                          onClick={() => onSendTestMessage(channel.type, channel.accountName)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-sm"
                          title="Send test customer inquiry to Unified Inbox"
                        >
                          <Send size={12} />
                          <span>{isMy ? 'Inbox သို့ စာပို့မည်' : 'Test Msg'}</span>
                        </button>
                      )}
                      {channel.type !== 'WEB_WIDGET' && (
                        <button
                          onClick={() => handleDisconnectChannel(channel.type)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 transition flex items-center gap-1"
                        >
                          <Power size={13} />
                          <span>{isMy ? 'ဖြုတ်မည်' : 'Disconnect'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (channel.type === 'TELEGRAM') setIsTelegramModalOpen(true);
                          if (channel.type === 'MESSENGER') setIsFacebookModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition"
                      >
                        {isMy ? 'ပြန်ပြင်ရန်' : 'Change'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        if (channel.type === 'TELEGRAM') setIsTelegramModalOpen(true);
                        if (channel.type === 'MESSENGER') setIsFacebookModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle size={14} />
                      <span>{isMy ? 'စတင်ချိတ်ဆက်ရန်' : 'Connect Channel'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TELEGRAM CONNECTION MODAL (Exact JivoChat UX Specification) */}
      {/* ======================================================== */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-auto max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Top Blue Header (shrink-0) */}
            <div className="bg-gradient-to-r from-[#0088cc] to-[#0077b5] px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white text-[#0088cc] flex items-center justify-center font-bold text-base shadow-sm">
                  ✈️
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight">Telegram</span>
                  <span className="text-blue-200 text-xs font-light">✕</span>
                  <span className="text-lg font-extrabold tracking-tight">ChateChat</span>
                </div>
              </div>
              <button
                onClick={() => setIsTelegramModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Body (flex-1 overflow-y-auto) */}
            <div className="p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5 text-slate-800 overflow-y-auto flex-1 overscroll-contain">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Connecting Telegram</h2>

              {/* 4 Steps Instructions matching JivoChat */}
              <div className="space-y-4 text-xs md:text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                    1
                  </div>
                  <p className="text-slate-700 pt-0.5">
                    Open Telegram and find <strong className="text-blue-600 font-mono">@BotFather</strong>
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                    2
                  </div>
                  <p className="text-slate-700 pt-0.5">
                    If you already have a bot, send the command <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">/token</code> or <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">/mybots</code> to get the token
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                    3
                  </div>
                  <p className="text-slate-700 pt-0.5">
                    If you don't have a bot, create one using <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono font-bold">/newbot</code>
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                    4
                  </div>
                  <p className="text-slate-700 pt-0.5">
                    Copy the <strong>token</strong>, paste it into the field below, and click &laquo;Connect Telegram&raquo;
                  </p>
                </div>
              </div>

              {/* Success / Error Alerts */}
              {connectSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{connectSuccess}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                    <span className="text-[11px] text-emerald-700 animate-pulse">
                      {isMy ? '⚡ စုပေါင်း inbox သို့ အလိုအလျောက် ပို့ဆောင်ပေးနေပါသည်...' : '⚡ Redirecting to Unified Inbox...'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTelegramModalOpen(false);
                        setConnectSuccess(null);
                        const cleanToken = telegramToken.trim();
                        const bName = cleanToken.includes(':') ? `@bot_${cleanToken.split(':')[0]}` : '@MyTelegramBot';
                        if (onBotConnected) onBotConnected(bName);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Send size={12} />
                      <span>{isMy ? 'Inbox သို့ ချက်ချင်းသွားမည် ➡️' : 'Go to Inbox Now ➡️'}</span>
                    </button>
                  </div>
                </div>
              )}

              {connectError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{connectError}</span>
                </div>
              )}

              {/* Token Input Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Bot Token</label>
                  <button
                    type="button"
                    onClick={() => setTelegramToken('7289104523:AAH_mexes_store_sample_token_x99')}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ⚡ Paste Sample Token
                  </button>
                </div>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="1234567890:ABCdefGhIJKlmNoPQRstuVWXyz123456789"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Bot Integration Mode Selector */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {isMy ? 'ချိတ်ဆက်မှု စနစ် ရွေးချယ်ပါ (Integration Mode):' : 'Select Connection Mode:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIntegrationMode('STANDALONE');
                      setDisableAutoReply(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      integrationMode === 'STANDALONE'
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>🤖 ChateChat သီးသန့်</span>
                      {integrationMode === 'STANDALONE' && <Check size={14} className="text-blue-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      ပြင်ပ bot မရှိပါက ရွေးပါ။ ChateChat မှ ၂၄ နာရီ တိုက်ရိုက် စာပြန်ပေးမည်။
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIntegrationMode('WEBHOOK_RELAY');
                      setDisableAutoReply(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      integrationMode === 'WEBHOOK_RELAY'
                        ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>⚡ Webhook Relay (တွဲဖက်သုံး)</span>
                      {integrationMode === 'WEBHOOK_RELAY' && <Check size={14} className="text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      လက်ရှိ Python/AI Bot (e.g. Salone4D) ရှိပါက ရွေးပါ။ စာမလုဘဲ Webhook Forward လုပ်ပေးမည်။
                    </p>
                  </button>
                </div>
              </div>

              {/* Extra settings for Webhook Relay Mode */}
              {integrationMode === 'WEBHOOK_RELAY' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-emerald-900 block mb-1">
                      Forward Webhook URL (သင့် Python/AI Server သို့ လက်ဆင့်ကမ်းမည့် URL)
                    </label>
                    <input
                      type="url"
                      value={forwardWebhookUrl}
                      onChange={(e) => setForwardWebhookUrl(e.target.value)}
                      placeholder="https://salone4d.onrender.com/webhook"
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                      💡 Telegram မှ ဝင်လာသမျှ စာများကို ChateChat Inbox တွင် ပြသပေးမည်ဖြစ်ပြီး သင့် Server သို့လည်း ချက်ချင်း Forward လုပ်ပေးပါမည်။
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={disableAutoReply}
                      onChange={(e) => setDisableAutoReply(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      ChateChat Default Auto-Reply ပိတ်မည် (သင့် Bot ၏ AI များနှင့် စာမပြိုင်စေရန်)
                    </span>
                  </label>
                </div>
              )}

              {/* Assign all agents checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={assignAllAgents}
                  onChange={(e) => setAssignAllAgents(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-xs font-medium text-slate-700">Assign all agents to this channel</span>
              </label>
            </div>

            {/* Action Buttons Footer (Pinned at bottom, always visible) */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 px-5 border-t border-slate-100 bg-slate-50 shrink-0">
              <a
                href="https://core.telegram.org/bots/tutorial"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span>Detailed instructions</span>
                <ExternalLink size={12} />
              </a>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsTelegramModalOpen(false)}
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isConnecting || !telegramToken.trim()}
                  onClick={handleConnectTelegram}
                  className="px-4 sm:px-6 py-2 rounded-xl text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect Telegram</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FACEBOOK CONNECTION MODAL                               */}
      {/* ======================================================== */}
      {isFacebookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-auto max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 px-5 shrink-0 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ChannelBadge channel="MESSENGER" size="sm" />
                <span>Facebook Page ချိတ်ဆက်ခြင်း</span>
              </h3>
              <button onClick={() => setIsFacebookModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleConnectFacebook} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facebook Page အမည်</label>
                  <input
                    type="text"
                    required
                    value={fbPageName}
                    onChange={(e) => setFbPageName(e.target.value)}
                    placeholder="ဥပမာ- Mexes Fashion Official"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Page ID</label>
                  <input
                    type="text"
                    required
                    value={fbPageId}
                    onChange={(e) => setFbPageId(e.target.value)}
                    placeholder="109823478912345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 px-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFacebookModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  ချိတ်ဆက်မည် (Connect Page)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
