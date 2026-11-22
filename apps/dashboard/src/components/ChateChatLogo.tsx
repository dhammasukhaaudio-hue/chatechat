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
    xs: { px: 22, text: 'text-xs' },
    sm: { px: 28, text: 'text-sm' },
    md: { px: 36, text: 'text-base' },
    lg: { px: 44, text: 'text-lg' },
    xl: { px: 56, text: 'text-xl' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* 3D Frosted Glassmorphism Icon (Variation 03) */}
      <div
        className="relative shrink-0 flex items-center justify-center select-none"
        style={{ width: dim.px, height: dim.px }}
      >
        <svg
          width={dim.px}
          height={dim.px}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(37,99,235,0.35)]"
        >
          <defs>
            {/* Outer Squircle Gradient */}
            <linearGradient id="ccSquircle" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0B132B" />
            </linearGradient>

            {/* Frosted Glass Gradient */}
            <linearGradient id="ccGlass" x1="25" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.08" />
            </linearGradient>

            {/* 3D Chain Link Cyan Gradient */}
            <linearGradient id="ccLink1" x1="30" y1="35" x2="60" y2="55" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="ccLink2" x1="45" y1="42" x2="75" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Inner Glow Filter */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00F0FF" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Squircle Background with Gloss Rim */}
          <rect x="8" y="8" width="84" height="84" rx="26" fill="url(#ccSquircle)" />
          <rect x="8.5" y="8.5" width="83" height="83" rx="25.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

          {/* Frosted Glass Speech Bubble Layer */}
          <path
            d="M32 26 C22 26, 18 34, 18 46 C18 57, 24 64, 34 66 L30 78 L44 72 C48 73, 52 73.5, 56 73.5 C72 73.5, 82 64, 82 46 C82 32, 70 26, 56 26 Z"
            fill="url(#ccGlass)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />

          {/* Specular Highlight on Frosted Bubble (Glass reflection) */}
          <ellipse cx="38" cy="34" rx="14" ry="5" transform="rotate(-15 38 34)" fill="white" fillOpacity="0.25" />

          {/* 3D Floating Chain Links (Variation 03) */}
          {/* Left / Upper Link Ring */}
          <rect
            x="32"
            y="37"
            width="25"
            height="17"
            rx="8.5"
            stroke="url(#ccLink1)"
            strokeWidth="5"
            fill="none"
            filter="url(#cyanGlow)"
          />
          {/* Inner Highlight for 3D metallic feel */}
          <rect
            x="33.5"
            y="38.5"
            width="22"
            height="14"
            rx="7"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Right / Lower Interlocking Link Ring */}
          <rect
            x="45"
            y="45"
            width="25"
            height="17"
            rx="8.5"
            stroke="url(#ccLink2)"
            strokeWidth="5"
            fill="none"
            filter="url(#cyanGlow)"
          />
          {/* Inner Highlight for 3D depth */}
          <rect
            x="46.5"
            y="46.5"
            width="22"
            height="14"
            rx="7"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Overlap Connection Point Gloss */}
          <circle cx="51" cy="49.5" r="2" fill="#E0F2FE" />
        </svg>
      </div>

      {/* Brand Text (Optional) */}
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-bold tracking-tight text-white leading-tight ${dim.text} ${textClassName}`}>
            ChateChat
          </span>
          <span className="text-[10px] text-cyan-400 font-medium tracking-wide">
            ချိတ်ချက်
          </span>
        </div>
      )}
    </div>
  );
};
