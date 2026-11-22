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
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [city, setCity] = useState(customer?.city || '');

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
          {customer?.name ? customer.name.slice(0, 2).toUpperCase() : 'CU'}
        </div>
        <h3 className="text-base font-bold text-slate-900">{customer?.name || 'ဧည့်သည်ဝယ်သူ'}</h3>
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
                className="w-full mt-1.5 py-1.5 px-3 bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-blue-200/60"
              >
                <Send size={12} />
                <span>ဖုန်း/လိပ်စာ တောင်းမည်</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connected Channels */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Share2 size={12} />
          <span>ချန်နယ်များ</span>
        </h4>

        <div className="space-y-1.5">
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
            <div className="text-xs text-slate-400">ချန်နယ် ၁ ခု ချိတ်ဆက်ထားသည်</div>
          )}
        </div>
      </div>

      {/* E-Commerce Order History */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={12} />
          <span>ဝယ်ယူမှု</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-medium">အော်ဒါ</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {customer.totalOrders} ခု
            </p>
          </div>

          <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-medium">စုစုပေါင်း</span>
            <p className="text-xs font-bold text-blue-600 mt-0.5">
              {customer.totalSpentMmk.toLocaleString()} MMK
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Tag size={12} />
          <span>တဂ်များ</span>
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {customer.tags && customer.tags.length > 0 ? (
            customer.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
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
