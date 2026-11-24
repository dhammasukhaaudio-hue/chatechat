import React from 'react';

interface ChateChatLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const ChateChatLogo: React.FC<ChateChatLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
}) => {
  const sizeMap = {
    xs: { px: 24, text: 'text-xs', rounded: 'rounded-[7px]' },
    sm: { px: 32, text: 'text-sm', rounded: 'rounded-[10px]' },
    md: { px: 40, text: 'text-base', rounded: 'rounded-[12px]' },
    lg: { px: 52, text: 'text-lg', rounded: 'rounded-[16px]' },
    xl: { px: 68, text: 'text-xl', rounded: 'rounded-[20px]' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* 3D Frosted Grey Chat Bubble Logo (Transparent Standalone Icon) */}
      <div
        className="relative shrink-0 select-none flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
        style={{ width: dim.px, height: dim.px }}
      >
        <img
          src="/logo.png"
          alt="ChateChat Logo"
          width={dim.px}
          height={dim.px}
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      </div>

      {/* Brand Text (Optional) */}
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-bold tracking-tight text-white leading-tight ${dim.text} ${textClassName}`}>
            ChateChat
          </span>
          <span className="text-[10px] text-blue-400 font-medium tracking-wide">
            ချိတ်ချက်
          </span>
        </div>
      )}
    </div>
  );
};
