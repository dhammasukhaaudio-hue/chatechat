import React from 'react';
import {
  MessageSquare,
  Users,
  Layers,
  Settings,
  CreditCard,
  Bot,
  Globe,
  LogOut,
  X,
} from 'lucide-react';
import { ChateChatLogo } from './ChateChatLogo';
import { ChannelQuotaDetails } from '../types';
import { translations, Language } from '../lib/translations';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  quotaDetails?: ChannelQuotaDetails;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  unreadTotal: number;
  lang: Language;
  setLang: (lang: Language) => void;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    organizationId?: string;
    organizationName?: string;
    teamCode?: string;
  };
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
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

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="safe-top-mobile pb-3.5 flex items-center justify-between px-5 border-b border-slate-800 shrink-0 lg:h-16 lg:pt-0 lg:pb-0">
          <div className="flex items-center gap-2.5">
            <ChateChatLogo size="md" showText={true} />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher Button */}
            <button
              onClick={() => setLang(lang === 'my' ? 'en' : 'my')}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
              title="Switch Language"
            >
              <Globe size={12} className="text-cyan-400" />
              <span>{lang === 'my' ? '🇲🇲 MM' : '🇬🇧 EN'}</span>
            </button>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {/* 1. စုပေါင်း inbox (Renamed per user request) */}
          <button
            onClick={() => handleNavClick('inbox')}
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
            onClick={() => handleNavClick('customers')}
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
            onClick={() => handleNavClick('channels')}
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
            onClick={() => handleNavClick('ai')}
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
            onClick={() => handleNavClick('settings')}
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

        {/* Workspace & Plan Quick Status (Frosted Minimalist Card) */}
        <div className="mx-3 mb-3 p-3 bg-slate-800/70 backdrop-blur-md border border-slate-700/60 rounded-xl space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-white font-semibold text-[11px]" title={currentUser?.organizationName || 'ChateChat'}>
              {currentUser?.organizationName || 'ChateChat'}
            </span>
            <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
              {currentUser?.teamCode || 'SOLO'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{quotaDetails?.planConfig?.name || 'Pro'}</span>
            <span className="text-slate-300 font-mono text-[10.5px]">
              {quotaDetails?.activeChannelsCount || 2}/{quotaDetails?.maxChannels || 3} Channels
            </span>
          </div>

          <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (((quotaDetails?.activeChannelsCount || 2) / (quotaDetails?.maxChannels || 3)) * 100))}%`,
              }}
            />
          </div>

          <div className="pt-1.5 flex items-center justify-between border-t border-slate-700/50 text-[10.5px]">
            <a
              href="/download/apk"
              target="_blank"
              download="ChateChat.apk"
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
            >
              <span>📲 Android App</span>
            </a>
            <span className="text-emerald-400 font-medium">● Online</span>
          </div>
        </div>

        {/* User / Agent Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between shrink-0">
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
    </>
  );
};
