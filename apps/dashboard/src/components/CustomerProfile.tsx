import React, { useState } from 'react';
import { Customer, Conversation } from '../types';
import { ChannelBadge } from './ChannelBadge';
import {
  Phone,
  MapPin,
  ShoppingBag,
  Tag,
  Share2,
  Edit2,
  Check,
  Send,
  Info,
} from 'lucide-react';

interface CustomerProfileProps {
  customer: Customer;
  conversation: Conversation;
  onUpdateCustomer?: (updated: Partial<Customer>) => void;
  onRequestContact?: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer,
  conversation,
  onUpdateCustomer,
  onRequestContact,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(customer.phone || '');
  const [address, setAddress] = useState(customer.address || '');
  const [city, setCity] = useState(customer.city || '');

  const handleSave = () => {
    if (onUpdateCustomer) {
      onUpdateCustomer({ phone, address, city });
    }
    setIsEditing(false);
  };

  return (
    <aside className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto select-none p-5 space-y-6">
      {/* Customer Avatar & Name */}
      <div className="text-center pb-4 border-b border-slate-100">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xl mx-auto mb-3 border border-slate-200">
          {customer.name ? customer.name.slice(0, 2).toUpperCase() : 'CU'}
        </div>
        <h3 className="text-base font-bold text-slate-900">{customer.name || 'ဧည့်သည်ဝယ်သူ'}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{phone || 'ဖုန်းနံပါတ် မသိရှိသေးပါ'}</p>

        {/* Current Channel */}
        <div className="mt-3 flex justify-center">
          <ChannelBadge channel={conversation.channelType} showLabel size="md" />
        </div>
      </div>

      {/* Contact Details with Inline Edit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ဆက်သွယ်ရန် အချက်အလက်
          </h4>
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
          >
            {isEditing ? (
              <>
                <Check size={13} />
                <span>သိမ်းမည်</span>
              </>
            ) : (
              <>
                <Edit2 size={12} />
                <span>ပြင်မည်</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">ဖုန်းနံပါတ်</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxxx"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">မြို့/မြို့နယ်</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ရန်ကုန်၊ စမ်းချောင်း"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">ပို့ဆောင်မည့် လိပ်စာအပြည့်အစုံ</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="အမှတ်၊ လမ်း၊ ရပ်ကွက်"
                rows={2}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <Phone size={15} className="text-slate-400 flex-shrink-0" />
              <span className="font-medium font-mono">
                {phone || (
                  <span className="text-slate-400 italic">ဖုန်းနံပါတ် မသိရှိသေးပါ</span>
                )}
              </span>
            </div>

            <div className="flex items-start gap-3 text-xs text-slate-700">
              <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">
                {address
                  ? `${address}${city ? `, ${city}` : ''}`
                  : (
                    <span className="text-slate-400 italic">လိပ်စာ မဖြည့်ရသေးပါ</span>
                  )}
              </span>
            </div>

            {/* Quick Request Button */}
            {!phone && (
              <button
                onClick={onRequestContact}
                className="w-full mt-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
              >
                <Send size={13} />
                <span>ဖုန်းနံပါတ်နှင့် လိပ်စာ တောင်းဆိုရန်</span>
              </button>
            )}
          </div>
        )}

        {/* Explainability banner for Staff & Founder */}
        <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1 text-amber-800">
            <Info size={13} />
            <span>ဖုန်းနံပါတ် ရယူပုံစနစ်</span>
          </div>
          <p className="leading-relaxed text-amber-800/90 text-[10.5px]">
            Telegram, Facebook, TikTok တို့သည် Privacy စည်းမျဉ်းအရ ဖုန်းနံပါတ်ကို အလိုအလျောက် မပေးပါ။ ဝယ်သူမှ စာထဲတွင် ရိုက်ပို့ခြင်း သို့မဟုတ် Telegram ၏ <strong>"ဖုန်းနံပါတ် ပေးပို့ရန် / Share My Phone number"</strong> ခလုတ်နှိပ်သည့်အခါ AI က အလိုအလျောက် ထုတ်ယူဖြည့်စွက်ပေးပါသည်။
          </p>
        </div>
      </div>

      {/* Connected Channels (Cross-Platform Merging) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Share2 size={13} />
          <span>ပေါင်းစည်းထားသော လူမှုကွန်ရက်များ</span>
        </h4>

        <div className="space-y-2">
          {customer.identities && customer.identities.length > 0 ? (
            customer.identities.map((id) => (
              <div
                key={id.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <ChannelBadge channel={id.channelType} showLabel />
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                  {id.externalUsername || id.externalId}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400">ချန်နယ် ၁ ခုသာ ချိတ်ဆက်ထားပါသည်</div>
          )}
        </div>
      </div>

      {/* E-Commerce Order History */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={13} />
          <span>ဝယ်ယူမှု မှတ်တမ်း</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500">စုစုပေါင်း အော်ဒါ</span>
            <p className="text-base font-bold text-slate-800 mt-0.5">
              {customer.totalOrders} ခု
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500">စုစုပေါင်း သုံးစွဲငွေ</span>
            <p className="text-xs font-bold text-blue-600 mt-1">
              {customer.totalSpentMmk.toLocaleString()} MMK
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Tag size={13} />
          <span>တဂ်များ (Tags)</span>
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {customer.tags && customer.tags.length > 0 ? (
            customer.tags.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                {t}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">တဂ် မရှိသေးပါ</span>
          )}
        </div>
      </div>
    </aside>
  );
};
