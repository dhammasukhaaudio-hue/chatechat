import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { mobileApi } from '../services/api.service';
import { mobileSocket } from '../services/socket.service';

interface Props {
  onBack: () => void;
  onDisconnect: () => void;
  currentLang: 'my' | 'en';
  onToggleLang: () => void;
}

export const SettingsScreen: React.FC<Props> = ({
  onBack,
  onDisconnect,
  currentLang,
  onToggleLang,
}) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const isMy = currentLang === 'my';

  const handleLogout = () => {
    mobileSocket.disconnect();
    onDisconnect();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appTitle}>{isMy ? 'အက်ပ် ဆက်တင်များ' : 'App Settings'}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Organization & Subscription Status */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{isMy ? 'ဆိုင်နှင့် အကောင့် အချက်အလက်' : 'Shop & Plan Status'}</Text>
            <View style={styles.shopRow}>
              <View style={styles.shopAvatar}>
                <Text style={styles.shopAvatarText}>👑</Text>
              </View>
              <View>
                <Text style={styles.shopName}>Royal Express Fashion</Text>
                <Text style={styles.planBadge}>
                  ⭐ {isMy ? 'Omni-Channel Plan (15,000 MMK/လ)' : 'Omni-Channel Plan'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{isMy ? 'Team Seats (ဝန်ထမ်း)' : 'Team Seats'}</Text>
              <Text style={styles.infoValue}>1 Admin + 1 Agent (အခမဲ့ ပါဝင်ပြီး)</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{isMy ? 'နောက်ထပ် Agent နှုန်းထား' : 'Extra Agent Fee'}</Text>
              <Text style={styles.infoValue}>+30% / တစ်ဦး (4,500 MMK)</Text>
            </View>
          </View>

          {/* Bilingual Language Switcher */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{isMy ? 'ဘာသာစကား (Language)' : 'Language'}</Text>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[styles.langBtn, isMy && styles.activeLangBtn]}
                onPress={onToggleLang}
              >
                <Text style={[styles.langText, isMy && styles.activeLangText]}>🇲🇲 မြန်မာ (Unicode)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langBtn, !isMy && styles.activeLangBtn]}
                onPress={onToggleLang}
              >
                <Text style={[styles.langText, !isMy && styles.activeLangText]}>🇬🇧 English</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification Toggles */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{isMy ? 'အသိပေးချက်များ (Notifications)' : 'Notifications'}</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {isMy ? 'မက်ဆေ့ခ်ျအသစ် ဝင်ရောက်မှု အသိပေးရန်' : 'Push Notifications'}
              </Text>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {isMy ? 'အသံနှင့် တုန်ခါမှု (Sound & Vibrate)' : 'Sound & Vibrate'}
              </Text>
              <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
            </View>
          </View>

          {/* Connected Channels Summary */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{isMy ? 'ချိတ်ဆက်ထားသော ချန်နယ်များ' : 'Active Channels'}</Text>

            {[
              { name: 'Facebook Messenger', status: 'Active', icon: '🔵' },
              { name: 'Telegram Bot API', status: 'Active', icon: '✈️' },
              { name: 'Viber Partner Bot', status: 'Active', icon: '🟣' },
              { name: 'TikTok Business DM', status: 'Active', icon: '🎵' },
              { name: 'Web Chat Widget', status: 'Active', icon: '💬' },
            ].map((c, i) => (
              <View key={i} style={styles.channelRow}>
                <Text style={styles.channelName}>{c.icon} {c.name}</Text>
                <View style={styles.statusDotRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.channelStatusText}>{c.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Server Info & Disconnect */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{isMy ? 'ဆာဗာ ချိတ်ဆက်မှု' : 'Server Connection'}</Text>
            <Text style={styles.serverUrlText}>Endpoint: {mobileApi.getBaseUrl()}</Text>

            <TouchableOpacity style={styles.disconnectBtn} onPress={handleLogout}>
              <Text style={styles.disconnectText}>
                {isMy ? 'ဆာဗာမှ ထွက်မည် / IP ပြောင်းမည်' : 'Disconnect / Change Server IP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Version Info */}
          <Text style={styles.versionText}>
            ChateChat Mobile v1.0.0 (Android Production Build)
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E40AF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shopAvatarText: {
    fontSize: 22,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  planBadge: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeLangBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  langText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  activeLangText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  channelName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  channelStatusText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  serverUrlText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748B',
    marginBottom: 12,
  },
  disconnectBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  disconnectText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 24,
  },
});
