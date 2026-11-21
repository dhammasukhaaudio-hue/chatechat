import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, CannedResponse } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { CannedResponseDrawer } from './CannedResponseDrawer';
import {
  Send,
  Lock,
  Zap,
  CheckCheck,
  Bot,
  UserCheck,
  FileCheck,
  Paperclip,
  Smile,
  ArrowLeft,
  Info,
} from 'lucide-react';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  cannedResponses: CannedResponse[];
  onSendMessage: (content: string, isInternal: boolean) => void;
  onAssignToMe: () => void;
  onResolve: () => void;
  onBack?: () => void;
  onToggleProfile?: () => void;
}

// Safely render message text with bold tags and clickable hyperlinks without showing raw <b> tags
const renderFormattedContent = (content: string, isCustomer: boolean, isBot: boolean) => {
  if (!content) return null;

  const parts = content.split(/(<b>[\s\S]*?<\/b>|<strong>[\s\S]*?<\/strong>|https?:\/\/[^\s]+)/g);

  return parts.map((part, idx) => {
    if (!part) return null;

    const boldMatch = part.match(/^<(?:b|strong)>([\s\S]*?)<\/(?:b|strong)>$/);
    if (boldMatch) {
      return (
        <strong key={idx} className="font-bold">
          {boldMatch[1]}
        </strong>
      );
    }

    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 break-all ${
            isCustomer
              ? 'text-blue-600 hover:text-blue-800'
              : isBot
              ? 'text-blue-700 hover:text-blue-900 font-medium'
              : 'text-white underline hover:text-blue-100 font-medium'
          }`}
        >
          {part}
        </a>
      );
    }

    const cleanText = part.replace(/<\/?[^>]+(>|$)/g, '');
    return <span key={idx}>{cleanText}</span>;
  });
};

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  cannedResponses,
  onSendMessage,
  onAssignToMe,
  onResolve,
  onBack,
  onToggleProfile,
}) => {
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCannedDrawer, setShowCannedDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 border border-slate-200">
          <Smile size={32} />
        </div>
        <h3 className="text-base font-bold text-slate-700">စကားပြောဆိုမှု မရွေးချယ်ရသေးပါ</h3>
        <p className="text-sm mt-1 text-slate-500">
          ဘယ်ဘက်စာရင်းမှ စကားစမြည်တစ်ခုကို ရွေးချယ်ပြီး ဝယ်သူနှင့် စကားစတင်ပြောကြားနိုင်ပါသည်
        </p>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), isInternalNote);
    setInputText('');
    setIsInternalNote(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '/' && inputText === '') {
      setShowCannedDrawer(true);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBotHandling = conversation.handoverStatus === 'BOT_HANDLING';

  return (
    <div className="flex-1 bg-white flex flex-col h-full relative">
      {/* Chat Area Header */}
      <header className="safe-top-mobile pb-3 border-b border-slate-200 px-3 lg:px-6 flex items-center justify-between bg-white z-10 shrink-0 lg:h-16 lg:pt-0 lg:pb-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Back Button on Mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition shrink-0"
              title="စာရင်းသို့ ပြန်သွားမည်"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs md:text-sm">
              {conversation.customer.name ? conversation.customer.name.slice(0, 2).toUpperCase() : 'CU'}
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <h2 className="text-xs md:text-sm font-bold text-slate-900 leading-tight truncate max-w-[105px] sm:max-w-[180px] md:max-w-xs">
                {conversation.customer.name || 'ဧည့်သည်ဝယ်သူ'}
              </h2>
              <div className="shrink-0">
                <ChannelBadge channel={conversation.channelType} showLabel />
              </div>
            </div>
            <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 truncate">
              {conversation.customer.phone || 'ဖုန်းနံပါတ် မဖြည့်ရသေးပါ'}
            </p>
          </div>
        </div>

        {/* Handover & Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Customer CRM Profile Toggle on screens smaller than xl */}
          {onToggleProfile && (
            <button
              onClick={onToggleProfile}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg xl:hidden transition"
              title="ဝယ်သူမှတ်တမ်း (CRM Profile)"
            >
              <Info size={18} />
            </button>
          )}

          {isBotHandling ? (
            <button
              onClick={onAssignToMe}
              className="px-2.5 md:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] md:text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
            >
              <UserCheck size={14} />
              <span className="hidden sm:inline">ကိုယ်တိုင်လက်ခံပြောကြားမည်</span>
              <span className="sm:hidden">လက်ခံမည်</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 md:px-2.5 py-1 rounded-md text-[11px] md:text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 truncate max-w-[110px] sm:max-w-none">
              <UserCheck size={13} className="shrink-0" />
              <span className="truncate">{conversation.assignedAgent?.name || 'မသူဇာ'}</span>
            </span>
          )}

          <button
            onClick={onResolve}
            className="px-2.5 md:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] md:text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <FileCheck size={14} />
            <span>ပြီးစီး</span>
          </button>
        </div>
      </header>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12">
            မက်ဆေ့ခ်ျမှတ်တမ်း မရှိသေးပါ
          </div>
        ) : (
          messages.map((msg) => {
            const isCustomer = msg.senderType === 'CUSTOMER';
            const isAgent = msg.senderType === 'AGENT';
            const isBot = msg.senderType === 'BOT';
            const isSystem = msg.senderType === 'SYSTEM';
            const isInternal = msg.isInternal;

            if (isSystem) {
              return (
                <div key={msg.id} className="mx-auto my-2 text-center select-none">
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 rounded-full px-3.5 py-1 text-[11px] text-slate-600 shadow-2xs font-medium">
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            if (isInternal) {
              return (
                <div key={msg.id} className="mx-auto max-w-lg my-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 shadow-sm flex items-start gap-2.5">
                    <Lock size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <span>အတွင်းသီးသန့်မှတ်ချက် (ဝယ်သူ မမြင်နိုင်ပါ)</span>
                        <span className="text-[10px] text-amber-600 font-normal">
                          by {msg.senderName}
                        </span>
                      </div>
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[70%] ${
                  isCustomer ? 'self-start items-start' : 'self-end items-end ml-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                  {isBot && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 px-1 rounded">
                      <Bot size={10} /> AI
                    </span>
                  )}
                  <span>{msg.senderName}</span>
                  <span>•</span>
                  <span suppressHydrationWarning>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                    isCustomer
                      ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                      : isBot
                      ? 'bg-blue-50 text-blue-950 border border-blue-200 rounded-tr-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  {msg.mediaUrl && (
                    <div className="mb-2">
                      <img
                        src={msg.mediaUrl}
                        alt="attachment"
                        className="rounded-lg max-h-60 object-cover"
                      />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{renderFormattedContent(msg.content, isCustomer, isBot)}</div>
                </div>

                {!isCustomer && (
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                    <CheckCheck size={12} className="text-blue-500" />
                    <span>ပေးပို့ပြီး</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Canned Response Drawer */}
      {showCannedDrawer && (
        <CannedResponseDrawer
          cannedResponses={cannedResponses}
          onSelect={(content) => {
            setInputText(content);
            setShowCannedDrawer(false);
          }}
          onClose={() => setShowCannedDrawer(false)}
        />
      )}

      {/* Input Box & Toolbar */}
      <footer className="border-t border-slate-200 p-4 bg-white relative">
        {/* Toggle Mode: Customer Reply vs Internal Note */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInternalNote(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                !isInternalNote
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ဝယ်သူထံသို့ စာပြန်ရန်
            </button>
            <button
              onClick={() => setIsInternalNote(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                isInternalNote
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock size={12} />
              အတွင်းသီးသန့်မှတ်ချက်
            </button>
          </div>

          <button
            onClick={() => setShowCannedDrawer(!showCannedDrawer)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Zap size={13} className="text-amber-500" />
            <span>ဖြတ်လမ်းများ ( / )</span>
          </button>
        </div>

        {/* Input Textarea & Action Buttons */}
        <div
          className={`flex items-end gap-2 border rounded-xl p-2.5 transition-all ${
            isInternalNote
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20'
              : 'border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
          }`}
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInternalNote
                ? 'အတွင်းမှတ်ချက် ရေးသားပါ (အခြားအေးဂျင့်များသာ မြင်နိုင်ပါသည်)...'
                : 'မက်ဆေ့ခ်ျ ရေးသားပါ (မြန်မာ/English)... Canned responses အတွက် / ရိုက်ပါ'
            }
            rows={2}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-800 placeholder-slate-400"
          />

          <div className="flex items-center gap-1">
            <button
              title="ဖိုင်တွဲတင်ပါ"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <Paperclip size={18} />
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-lg text-white transition-all ${
                inputText.trim()
                  ? isInternalNote
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
