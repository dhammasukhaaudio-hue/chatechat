import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, StatusBar } from 'react-native';
import { mobileApi } from '../services/api.service';
import { mobileSocket } from '../services/socket.service';

interface Props {
  onConnected: () => void;
  lang?: 'my' | 'en';
}

export const ConnectionScreen: React.FC<Props> = ({ onConnected, lang = 'my' }) => {
  const [serverUrl, setServerUrl] = useState('http://10.0.2.2:4000');
  const [isConnecting, setIsConnecting] = useState(false);
  const isMy = lang === 'my';

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      mobileApi.setBaseUrl(serverUrl);
      mobileSocket.connect(serverUrl, 'mobile_agent_1', 'org_royal', () => {
        setIsConnecting(false);
        onConnected();
      });

      // Quick HTTP ping to confirm reachable
      const res = await fetch(`${serverUrl}/api/v1/chat/conversations`);
      if (res.ok) {
        setIsConnecting(false);
        onConnected();
      }
    } catch (err: any) {
      setIsConnecting(false);
      Alert.alert(
        isMy ? 'ချိတ်ဆက်မှု မအောင်မြင်ပါ' : 'Connection Failed',
        isMy
          ? 'Server IP လိပ်စာ မှန်ကန်မှု ရှိမရှိ စစ်ဆေးပါ။ (Android Emulator ဖြစ်ပါက http://10.0.2.2:4000 သို့မဟုတ် Phone ဖြင့် ချိတ်ပါက Local WiFi IP ထည့်ပါ)'
          : 'Could not reach server. Verify your PC and mobile are on the same WiFi network.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <View style={styles.container}>
        {/* App Logo */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💬</Text>
          </View>
          <Text style={styles.brandTitle}>ChateChat</Text>
          <Text style={styles.brandSubtitle}>
            {isMy ? 'ချိတ်ချက် - မြန်မာ့ စုပေါင်း ဆက်သွယ်ရေး ပလက်ဖောင်း' : 'Myanmar Omnichannel Agent App'}
          </Text>
        </View>

        {/* Server Config Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isMy ? 'Server ချိတ်ဆက်မှု သတ်မှတ်ရန်' : 'Server Connection'}</Text>
          <Text style={styles.cardSubtitle}>
            {isMy
              ? 'သင့်ကွန်ပျူတာတွင် Run ထားသော ChateChat API Server လိပ်စာကို ထည့်သွင်းပါ:'
              : 'Enter backend API server URL:'}
          </Text>

          <TextInput
            style={styles.input}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.1.xxx:4000"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Quick Preset Buttons */}
          <View style={styles.presets}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setServerUrl('http://10.0.2.2:4000')}
            >
              <Text style={styles.presetText}>📱 Emulator (10.0.2.2)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setServerUrl('http://localhost:4000')}
            >
              <Text style={styles.presetText}>💻 Localhost</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.connectBtn, isConnecting && styles.btnDisabled]}
            disabled={isConnecting}
            onPress={handleConnect}
          >
            <Text style={styles.connectText}>
              {isConnecting
                ? (isMy ? 'ချိတ်ဆက်နေသည်...' : 'Connecting...')
                : (isMy ? '🚀 ချိတ်ဆက်ပြီး ဝင်မည်' : 'Connect & Login')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Offline Pass */}
        <TouchableOpacity style={styles.offlineBtn} onPress={onConnected}>
          <Text style={styles.offlineText}>
            {isMy ? '⚡ Local Demo Mode ဖြင့် စမ်းသပ်ကြည့်ရှုမည်' : 'Continue with Local Demo Mode'}
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0F172A',
    marginBottom: 12,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  connectBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  offlineBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
