import React from 'react';
import {
  MessageSquare,
  Users,
  Layers,
  Settings,
  CreditCard,
  Bot,
  Zap,
  Globe,
  LogOut,
} from 'lucide-react';
import { ChannelQuotaDetails } from '../types';
import { translations, Language } from '../lib/translations';

interface SidebarProps {
  quotaDetails?: ChannelQuotaDetails;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  unreadTotal: number;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser?: { id?: string; name?: string; email?: string; role?: string };
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  quotaDetails,
  activeNav,
  setActiveNav,
  unreadTotal,
  lang,
  setLang,
  currentUser,
  onLogout,
}) => {
  const t = translations[lang] || translations.my;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">ChateChat</h1>
            <p className="text-[11px] text-blue-400 font-medium">{t.brandSubtitle}</p>
          </div>
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={() => setLang(lang === 'my' ? 'en' : 'my')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
          title="Switch Language"
        >
          <Globe size={13} className="text-blue-400" />
          <span>{lang === 'my' ? '🇲🇲 MM' : '🇬🇧 EN'}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {/* 1. စုပေါင်း inbox (Renamed per user request) */}
        <button
          onClick={() => setActiveNav('inbox')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeNav === 'inbox'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare size={18} />
            <span>{t.navInbox}</span>
          </div>
          {unreadTotal > 0 && (
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                activeNav === 'inbox' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
              }`}
            >
              {unreadTotal}
            </span>
          )}
        </button>

        {/* 2. Customer CRM */}
        <button
          onClick={() => setActiveNav('customers')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeNav === 'customers'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Users size={18} />
          <span>{t.navCustomers}</span>
        </button>

        {/* 3. Channels Hub */}
        <button
          onClick={() => setActiveNav('channels')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeNav === 'channels'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Layers size={18} />
          <span>{t.navChannels}</span>
        </button>

        {/* 4. Gemini AI Sales Bot */}
        <button
          onClick={() => setActiveNav('ai')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeNav === 'ai'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Bot size={18} />
          <span>{t.navAi}</span>
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => setActiveNav('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeNav === 'settings'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Settings size={18} />
          <span>{t.navSettings}</span>
        </button>
      </nav>

      {/* Subscription Quota Card */}
      <div className="p-3 mx-3 mb-3 bg-slate-800/70 border border-slate-700/60 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <CreditCard size={14} className="text-blue-400" />
            <span>{t.planTitle}</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-400">{t.activeBadge}</span>
        </div>
        <p className="text-xs font-semibold text-white">
          {quotaDetails?.planConfig?.name || '3 Channels Pro Plan'}
        </p>
        <p className="text-[11px] text-slate-400">
          {(quotaDetails?.planConfig?.priceMmk || 12000).toLocaleString()} {t.perMonth}
        </p>

        {/* Channel Usage Bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{t.connectedChannels}</span>
            <span className="text-white font-medium">
              {quotaDetails?.activeChannelsCount || 2} / {quotaDetails?.maxChannels || 3}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((quotaDetails?.activeChannelsCount || 2) / (quotaDetails?.maxChannels || 3)) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* User / Agent Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow">
              {(currentUser?.name || 'M').charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="text-left truncate">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Michael (Owner)'}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Online ({currentUser?.role || 'OWNER'})</p>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Log Out (ထွက်မည်)"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
