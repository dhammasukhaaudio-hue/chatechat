import React from 'react';
import { CannedResponse } from '../types';
import { Zap, CornerDownLeft } from 'lucide-react';

interface CannedResponseDrawerProps {
  cannedResponses: CannedResponse[];
  onSelect: (content: string) => void;
  onClose: () => void;
}

export const CannedResponseDrawer: React.FC<CannedResponseDrawerProps> = ({
  cannedResponses,
  onSelect,
  onClose,
}) => {
  return (
    <div className="absolute bottom-16 left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20 max-h-72 flex flex-col animation-slide-up">
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 font-bold text-slate-700">
          <Zap size={13} className="text-amber-500" />
          မြန်ဆန်တုံ့ပြန်မှု ဖြတ်လမ်းများ (Canned Responses)
        </span>
        <button onClick={onClose} className="hover:text-slate-800">
          ✕ ပိတ်ပါ
        </button>
      </div>

      <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
        {cannedResponses.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item.content)}
            className="p-3 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-xs font-bold">
                  {item.shortcut}
                </span>
                <span className="text-xs font-bold text-slate-800">{item.title}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
            </div>
            <CornerDownLeft size={14} className="text-slate-400 mt-1 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
