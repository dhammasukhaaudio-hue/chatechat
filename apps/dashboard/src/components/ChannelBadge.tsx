import React from 'react';
import { ChannelType } from '@chatechat/shared-types';
import { MessageSquare, Send, PhoneCall, Video } from 'lucide-react';

interface ChannelBadgeProps {
  channel: ChannelType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, showLabel = false, size = 'sm' }) => {
  const configs: Record<ChannelType, { label: string; bg: string; text: string; icon: any }> = {
    MESSENGER: {
      label: 'Messenger',
      bg: 'bg-blue-50 text-blue-600 border-blue-200',
      text: 'text-blue-600',
      icon: MessageSquare,
    },
    TELEGRAM: {
      label: 'Telegram',
      bg: 'bg-sky-50 text-sky-600 border-sky-200',
      text: 'text-sky-600',
      icon: Send,
    },
    VIBER: {
      label: 'Viber',
      bg: 'bg-purple-50 text-purple-600 border-purple-200',
      text: 'text-purple-600',
      icon: PhoneCall,
    },
    TIKTOK: {
      label: 'TikTok',
      bg: 'bg-rose-50 text-rose-600 border-rose-200',
      text: 'text-rose-600',
      icon: Video,
    },
    WEB_WIDGET: {
      label: 'Live Chat',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      text: 'text-emerald-600',
      icon: MessageSquare,
    },
  };

  const config = configs[channel] || configs.WEB_WIDGET;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      <Icon size={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
