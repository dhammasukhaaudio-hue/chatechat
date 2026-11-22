import React, { useState } from 'react';
import { Customer } from '../types';
import { ChannelBadge } from './ChannelBadge';
import { Search, Plus, Phone, MapPin, Tag, ShoppingBag, Edit, UserCheck } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  lang: 'my' | 'en';
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  const isMy = lang === 'my';

  const filtered = customers.filter((c) => {
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = selectedTag === 'all' || c.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 bg-slate-50 flex overflow-hidden">
      {/* Customer Directory Table */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isMy ? 'ဝယ်သူမှတ်တမ်း စီမံခန့်ခွဲမှု (Customer CRM)' : 'Customer Directory & CRM'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isMy
                ? 'လူမှုကွန်ရက်ပေါင်းစုံမှ ချိတ်ဆက်မေးမြန်းထားသော ဖောက်သည်အချက်အလက်များ'
                : 'Unified customer profiles merged across Messenger, Viber, Telegram, and TikTok'}
            </p>
          </div>

          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start md:self-auto">
            <Plus size={16} />
            <span>{isMy ? 'ဝယ်သူအသစ် ထည့်သွင်းရန်' : 'Add New Customer'}</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isMy ? 'အမည်၊ ဖုန်းနံပါတ်၊ လိပ်စာဖြင့် ရှာရန်...' : 'Search by name, phone, address...'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['all', 'VIP', 'KPay Regular', 'Wholesale', 'New Customer'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tag === 'all' ? (isMy ? 'အားလုံး' : 'All') : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Customer List Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-slate-100/70 text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-3 px-4">{isMy ? 'ဝယ်သူအမည်' : 'Customer'}</th>
                <th className="py-3 px-4">{isMy ? 'ဖုန်းနံပါတ်' : 'Phone'}</th>
                <th className="py-3 px-4">{isMy ? 'ချိတ်ဆက်ချန်နယ်' : 'Channels'}</th>
                <th className="py-3 px-4">{isMy ? 'လိပ်စာ' : 'Address'}</th>
                <th className="py-3 px-4 text-center">{isMy ? 'အော်ဒါအရေအတွက်' : 'Orders'}</th>
                <th className="py-3 px-4 text-right">{isMy ? 'စုစုပေါင်းသုံးငွေ' : 'Total Spent'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {c.name ? c.name.slice(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{c.name || 'ဧည့်သည်ဝယ်သူ'}</div>
                        <div className="flex gap-1 mt-0.5">
                          {c.tags.map((t) => (
                            <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{c.phone || '-'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        {c.identities && c.identities.length > 0 ? (
                          c.identities.map((id) => <ChannelBadge key={id.id} channel={id.channelType} />)
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{c.address || '-'}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">{c.totalOrders ?? 0}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-600">
                      {(c.totalSpentMmk ?? 0).toLocaleString()} MMK
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Customer Details Drawer */}
      {selectedCustomer && (
        <>
          {/* Desktop Sidebar (lg and above) */}
          <aside className="hidden lg:flex w-80 bg-white border-l border-slate-200 p-6 flex-col h-full overflow-y-auto space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                {isMy ? 'ဝယ်သူ အသေးစိတ်' : 'Customer Details'}
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                {selectedCustomer.name ? selectedCustomer.name.slice(0, 2).toUpperCase() : 'CU'}
              </div>
              <h2 className="text-base font-bold text-slate-900">{selectedCustomer.name || 'ဧည့်သည်ဝယ်သူ'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.phone || 'ဖုန်းနံပါတ် မရှိပါ'}</p>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                {isMy ? 'ဆက်သွယ်ရန်' : 'Contact Information'}
              </h3>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone size={14} className="text-slate-400" />
                <span>{selectedCustomer.phone || 'ဖုန်းနံပါတ် မရှိပါ'}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-700">
                <MapPin size={14} className="text-slate-400 mt-0.5" />
                <span className="leading-relaxed">
                  {selectedCustomer.address
                    ? `${selectedCustomer.address}${selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}`
                    : 'လိပ်စာ မဖြည့်ရသေးပါ'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                {isMy ? 'အော်ဒါနှင့် သုံးစွဲငွေ' : 'Spending & Orders'}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">{isMy ? 'အော်ဒါ' : 'Orders'}</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedCustomer.totalOrders ?? 0} ခု</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">{isMy ? 'သုံးစွဲငွေ' : 'Total Spent'}</span>
                  <p className="text-xs font-bold text-blue-600 mt-1">
                    {(selectedCustomer.totalSpentMmk ?? 0).toLocaleString()} MMK
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                {isMy ? 'ချိတ်ဆက်ထားသော ချန်နယ်များ' : 'Linked Social Accounts'}
              </h3>
              <div className="space-y-2">
                {selectedCustomer.identities?.map((id) => (
                  <div key={id.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <ChannelBadge channel={id.channelType} showLabel />
                    <span className="font-mono text-slate-500">{id.externalUsername || id.externalId}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile Bottom Slide-up Drawer (smaller than lg) */}
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedCustomer(null)}
            />
            <div className="relative z-10 w-full bg-white rounded-t-3xl max-h-[85vh] p-6 overflow-y-auto space-y-5 shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-800">
                  {isMy ? 'ဝယ်သူ အသေးစိတ်' : 'Customer Details'}
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  ✕ ပိတ်မည်
                </button>
              </div>

              <div className="text-center pb-3 border-b border-slate-100">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center mx-auto mb-2">
                  {selectedCustomer.name ? selectedCustomer.name.slice(0, 2).toUpperCase() : 'CU'}
                </div>
                <h2 className="text-base font-bold text-slate-900">{selectedCustomer.name || 'ဧည့်သည်ဝယ်သူ'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.phone || 'ဖုန်းနံပါတ် မရှိပါ'}</p>
              </div>

              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                  {isMy ? 'ဆက်သွယ်ရန်' : 'Contact Information'}
                </h3>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone size={14} className="text-slate-400" />
                  <span>{selectedCustomer.phone || 'ဖုန်းနံပါတ် မရှိပါ'}</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <MapPin size={14} className="text-slate-400 mt-0.5" />
                  <span className="leading-relaxed">
                    {selectedCustomer.address
                      ? `${selectedCustomer.address}${selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}`
                      : 'လိပ်စာ မဖြည့်ရသေးပါ'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                  {isMy ? 'အော်ဒါနှင့် သုံးစွဲငွေ' : 'Spending & Orders'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">{isMy ? 'အော်ဒါ' : 'Orders'}</span>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{selectedCustomer.totalOrders ?? 0} ခု</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[11px] text-slate-500">{isMy ? 'သုံးစွဲငွေ' : 'Total Spent'}</span>
                    <p className="text-xs font-bold text-blue-600 mt-1">
                      {(selectedCustomer.totalSpentMmk ?? 0).toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-400 uppercase tracking-wider">
                  {isMy ? 'ချိတ်ဆက်ထားသော ချန်နယ်များ' : 'Linked Social Accounts'}
                </h3>
                <div className="space-y-2">
                  {selectedCustomer.identities?.map((id) => (
                    <div key={id.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <ChannelBadge channel={id.channelType} showLabel />
                      <span className="font-mono text-slate-500">{id.externalUsername || id.externalId}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
