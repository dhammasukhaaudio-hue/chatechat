import React from 'react';
import { Conversation } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { Search, Bot, UserCheck } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSimulateTelegramMessage?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onSimulateTelegramMessage,
}) => {
  const filtered = conversations.filter((c) => {
    if (!c) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = c.customer?.name?.toLowerCase().includes(query);
    const phoneMatch = c.customer?.phone?.includes(query);
    const snippetMatch = c.lastMessageSnippet?.toLowerCase().includes(query);
    return nameMatch || phoneMatch || snippetMatch;
  });

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full bg-white border-r border-slate-200 flex flex-col h-full select-none">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">မက်ဆေ့ခ်ျများ</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {filtered.length} ခု
            </span>
          </div>
          {onSimulateTelegramMessage && (
            <button
              onClick={onSimulateTelegramMessage}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition border border-slate-200/80"
              title="Test Message"
            >
              <span>+ စမ်းသပ်ရန်</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ရှာဖွေရန်..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-transparent focus:border-blue-400/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
          {[
            { id: 'all', label: 'အားလုံး' },
            { id: 'unassigned', label: 'မခွဲရသေး' },
            { id: 'mine', label: 'ကျွန်ုပ်' },
            { id: 'resolved', label: 'ပြီးစီး' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 py-1.5 rounded-md transition-all text-center ${
                activeFilter === tab.id
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            မက်ဆေ့ခ်ျများ မရှိသေးပါ
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = activeId === conv.id;
            const isBot = conv.handoverStatus === 'BOT_HANDLING';

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`p-3.5 cursor-pointer transition-colors relative flex gap-3 ${
                  isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                {/* Customer Avatar with status */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                    {conv.customer?.name ? conv.customer.name.slice(0, 2).toUpperCase() : 'CU'}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <ChannelBadge channel={conv.channelType} />
                  </div>
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {conv.customer?.name || 'ဧည့်သည်ဝယ်သူ'}
                    </h3>
                    <span suppressHydrationWarning className="text-[11px] text-slate-400 flex-shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate leading-relaxed">
                    {conv.lastMessageSnippet || 'စကားပြောဆိုမှု မရှိသေးပါ'}
                  </p>

                  {/* Status Badges */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {isBot ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200/60">
                        <Bot size={11} />
                        AI လက်ထောက်
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60">
                        <UserCheck size={11} />
                        အေးဂျင့်ကိုင်တွယ်
                      </span>
                    )}

                    {conv.customer?.phone && (
                      <span className="text-[10px] text-slate-400">
                        {conv.customer?.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Unread Counter */}
                {conv.unreadCount > 0 && (
                  <div className="self-center">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
