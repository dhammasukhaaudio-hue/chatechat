import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { Search, Bot, UserCheck, Trash2, CheckCircle2, RotateCcw, X } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSimulateTelegramMessage?: () => void;
  onClearAllChats?: () => void;
  onResolveConversation?: (id: string) => void;
  onReopenConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  actionMenuConvId?: string | null;
  setActionMenuConvId?: (id: string | null) => void;
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
  onClearAllChats,
  onResolveConversation,
  onReopenConversation,
  onDeleteConversation,
  actionMenuConvId,
  setActionMenuConvId,
}) => {
  const [internalActionId, setInternalActionId] = useState<string | null>(null);
  const currentActionId = actionMenuConvId !== undefined ? actionMenuConvId : internalActionId;
  const setCurrentActionId = setActionMenuConvId || setInternalActionId;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setConfirmDelete(false);
  }, [currentActionId]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).AndroidNativeAudio?.vibrate) {
        (window as any).AndroidNativeAudio.vibrate(35);
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
    } catch {}
  };

  const startLongPress = (convId: string, clientX: number, clientY: number) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTriggeredRef.current = false;
    touchStartPosRef.current = { x: clientX, y: clientY };

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      triggerHaptic();
      setConfirmDelete(false);
      setCurrentActionId(convId);
    }, 500);
  };

  const moveLongPress = (clientX: number, clientY: number) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    const dx = clientX - touchStartPosRef.current.x;
    const dy = clientY - touchStartPosRef.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  const resolvedCount = conversations.filter((c) => c && c.status === 'RESOLVED').length;

  const filtered = conversations
    .filter((c) => {
      if (!c) return false;
      if (activeFilter === 'resolved') {
        if (c.status !== 'RESOLVED') return false;
      } else if (activeFilter === 'unassigned') {
        if (c.status === 'RESOLVED') return false;
        if (c.handoverStatus === 'TRANSFERRED_TO_AGENT' && c.status !== 'UNASSIGNED') return false;
      } else if (activeFilter === 'mine') {
        if (c.status === 'RESOLVED') return false;
        if (c.handoverStatus !== 'TRANSFERRED_TO_AGENT') return false;
      } else {
        // 'all' tab excludes completed (RESOLVED) chats
        if (c.status === 'RESOLVED') return false;
      }

      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const nameMatch = c.customer?.name?.toLowerCase().includes(query);
      const phoneMatch = c.customer?.phone?.includes(query);
      const snippetMatch = c.lastMessageSnippet?.toLowerCase().includes(query);
      return nameMatch || phoneMatch || snippetMatch;
    })
    .sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const actionMenuConv = currentActionId
    ? conversations.find((c) => c.id === currentActionId) || null
    : null;

  return (
    <div className="w-full bg-white border-r border-slate-200 flex flex-col h-full select-none relative">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">မက်ဆေ့ခ်ျများ</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {filtered.length} ခု
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onClearAllChats && filtered.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('စကားပြောမှတ်တမ်းအားလုံးကို ရှင်းလင်းပစ်ရန် သေချာပါသလား?')) {
                    onClearAllChats();
                  }
                }}
                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-medium flex items-center gap-1 transition border border-rose-200/80"
                title="Clear All Chats"
              >
                <Trash2 size={12} />
                <span>ရှင်းလင်းမည်</span>
              </button>
            )}
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
            { id: 'resolved', label: resolvedCount > 0 ? `ပြီးစီးပြီ (${resolvedCount})` : 'ပြီးစီးပြီ' },
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
            {activeFilter === 'resolved'
              ? 'ပြီးစီးပြီ မှတ်သားထားသော စကားဝိုင်းများ မရှိသေးပါ'
              : 'မက်ဆေ့ခ်ျများ မရှိသေးပါ'}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = activeId === conv.id;
            const isBot = conv.handoverStatus === 'BOT_HANDLING';
            const isResolved = conv.status === 'RESOLVED';

            return (
              <div
                key={conv.id}
                onClick={() => {
                  if (longPressTriggeredRef.current) {
                    longPressTriggeredRef.current = false;
                    return;
                  }
                  onSelect(conv.id);
                }}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  if (t) startLongPress(conv.id, t.clientX, t.clientY);
                }}
                onTouchMove={(e) => {
                  const t = e.touches[0];
                  if (t) moveLongPress(t.clientX, t.clientY);
                }}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onMouseDown={(e) => {
                  if (e.button === 0) startLongPress(conv.id, e.clientX, e.clientY);
                }}
                onMouseMove={(e) => moveLongPress(e.clientX, e.clientY)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onContextMenu={(e) => {
                  e.preventDefault();
                  cancelLongPress();
                  triggerHaptic();
                  setConfirmDelete(false);
                  setCurrentActionId(conv.id);
                }}
                style={{ WebkitTouchCallout: 'none' }}
                className={`p-3.5 cursor-pointer transition-colors relative flex gap-3 select-none ${
                  isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50 active:bg-slate-100'
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
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                    {isResolved && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 size={11} />
                        ပြီးစီးပြီ
                      </span>
                    )}
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
                {conv.unreadCount > 0 && !isResolved && (
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

      {/* Long-Press Action Modal (Bottom Sheet on Mobile, Centered Dialog on Desktop) */}
      {actionMenuConv && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setCurrentActionId(null)}
          />
          <div className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2 min-w-0">
                <ChannelBadge channel={actionMenuConv.channelType} showLabel={false} />
                <span className="font-bold text-sm text-slate-900 truncate">
                  {actionMenuConv.customer?.name || 'ဧည့်သည်ဝယ်သူ'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentActionId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Actions */}
            <div className="p-3 space-y-2">
              {!confirmDelete ? (
                <>
                  {actionMenuConv.status !== 'RESOLVED' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onResolveConversation?.(actionMenuConv.id);
                        setCurrentActionId(null);
                      }}
                      className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-100 border border-emerald-200 text-left flex items-center gap-3 transition"
                    >
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-emerald-900">
                          ပြီးစီးပြီ (Mark as Done)
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          All chat မှ ဖျောက်ပြီး ပြီးစီးပြီ စာရင်းထဲ ထည့်မည်
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onReopenConversation?.(actionMenuConv.id);
                        setCurrentActionId(null);
                      }}
                      className="w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-100 border border-blue-200 text-left flex items-center gap-3 transition"
                    >
                      <RotateCcw size={20} className="text-blue-600 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-blue-900">
                          All Chat ထဲ ပြန်ထည့်မည်
                        </div>
                        <div className="text-[11px] text-blue-700">
                          ပြီးစီးပြီ စာရင်းမှ Active Inbox သို့ ပြန်ပြောင်းမည်
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full p-3 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-100 border border-rose-200 text-left flex items-center gap-3 transition"
                  >
                    <Trash2 size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-rose-900">
                        ဖျက်မည် (Delete Chat)
                      </div>
                      <div className="text-[11px] text-rose-700">
                        ဤစကားပြောမှတ်တမ်းကို ဖျက်သိမ်းမည်
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentActionId(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    ပယ်ဖျက်မည်
                  </button>
                </>
              ) : (
                <div className="p-2 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 font-medium text-center leading-relaxed">
                    <span className="font-bold text-slate-900">
                      {actionMenuConv.customer?.name || 'ဤဝယ်သူ'}
                    </span>{' '}
                    ၏ စကားပြောမှတ်တမ်းကို အပြီးဖျက်ရန် သေချာပါသလား?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      မဖျက်တော့ပါ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteConversation?.(actionMenuConv.id);
                        setCurrentActionId(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                    >
                      ဟုတ်ကဲ့၊ ဖျက်မည်
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
