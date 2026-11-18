import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChannelType } from '../types';

interface Props {
  channel: ChannelType;
  size?: 'sm' | 'md';
}

export const ChannelBadge: React.FC<Props> = ({ channel, size = 'sm' }) => {
  const getChannelConfig = () => {
    switch (channel) {
      case 'MESSENGER':
        return { label: 'Messenger', bg: '#EBF5FF', text: '#0084FF', symbol: '🔵' };
      case 'TELEGRAM':
        return { label: 'Telegram', bg: '#EFF6FF', text: '#0088CC', symbol: '✈️' };
      case 'VIBER':
        return { label: 'Viber', bg: '#F3E8FF', text: '#7360F2', symbol: '🟣' };
      case 'TIKTOK':
        return { label: 'TikTok', bg: '#F1F5F9', text: '#000000', symbol: '🎵' };
      case 'WEB_WIDGET':
      default:
        return { label: 'Widget', bg: '#F0FDF4', text: '#16A34A', symbol: '💬' };
    }
  };

  const config = getChannelConfig();
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, paddingVertical: isSm ? 2 : 4, paddingHorizontal: isSm ? 6 : 8 }]}>
      <Text style={[styles.symbol, { fontSize: isSm ? 10 : 12 }]}>{config.symbol}</Text>
      <Text style={[styles.text, { color: config.text, fontSize: isSm ? 10 : 12 }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    gap: 4,
  },
  symbol: {},
  text: {
    fontWeight: '700',
  },
});
