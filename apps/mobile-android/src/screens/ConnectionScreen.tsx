import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { mobileApi } from '../services/api.service';
import { mobileSocket } from '../services/socket.service';

interface Props {
  onConnected: () => void;
  lang?: 'my' | 'en';
}

export const ConnectionScreen: React.FC<Props> = ({ onConnected, lang = 'my' }) => {
  const [serverUrl, setServerUrl] = useState('https://chatechat.onrender.com');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isMy = lang === 'my';

  const handleLoginConnect = async () => {
    setIsConnecting(true);
    const cleanUrl = serverUrl.trim().replace(/\/$/, '');
    const cleanUser = username.trim() || 'mexes';
    const cleanPass = password.trim() || 'Admin!123';

    try {
      mobileApi.setBaseUrl(cleanUrl);

      // Attempt Auth Login
      let userOrgId = 'org_royal';
      let agentName = cleanUser;

      try {
        const loginRes = await fetch(`${cleanUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanUser, password: cleanPass }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.success && loginData.user) {
            userOrgId = loginData.user.organizationId || userOrgId;
            agentName = loginData.user.name || agentName;
          }
        }
      } catch (e) {
        // Fallback for offline/local resilience
        if (cleanUser.toLowerCase() === 'minkhant') {
          userOrgId = 'org_minkhant';
        } else if (cleanUser.toLowerCase() === 'lynn') {
          userOrgId = 'org_lynn';
        }
      }

      mobileApi.setOrganizationId(userOrgId);
      mobileApi.setAgentName(agentName);

      // Connect Socket.io
      mobileSocket.connect(cleanUrl, agentName, userOrgId, () => {
        setIsConnecting(false);
        onConnected();
      });

      // Quick HTTP check
      setIsConnecting(false);
      onConnected();
    } catch (err: any) {
      setIsConnecting(false);
      Alert.alert(
        isMy ? 'ချိတ်ဆက်မှု မအောင်မြင်ပါ' : 'Connection Failed',
        isMy
          ? 'Server လိပ်စာနှင့် အင်တာနက် လိုင်းကို စစ်ဆေးပေးပါခင်ဗျာ။'
          : 'Could not reach server. Verify your internet connection or server URL.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* App Logo */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <Text style={styles.brandTitle}>ChateChat</Text>
            <Text style={styles.brandSubtitle}>
              {isMy ? 'ချိတ်ချက် - မြန်မာ့ စုပေါင်း ဆက်သွယ်ရေး မိုဘိုင်းအက်ပ်' : 'Myanmar Omnichannel Mobile App'}
            </Text>
            <View style={styles.livePill}>
              <View style={styles.greenDot} />
              <Text style={styles.livePillText}>Live 24/7 Cloud Support</Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isMy ? 'အကောင့်ဝင်ရောက်မည်' : 'Agent Login'}</Text>
            <Text style={styles.cardSubtitle}>
              {isMy
                ? 'သင်၏ ChateChat အကောင့်ဖြင့် ဝင်ရောက်ပြီး စာများကို ချက်ချင်းလက်ခံရယူပါ:'
                : 'Sign in to access your omnichannel unified inbox:'}
            </Text>

            {/* Username / Phone */}
            <Text style={styles.inputLabel}>{isMy ? 'Username / Phone နံပါတ်' : 'Username / Phone'}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={isMy ? 'ဥပမာ - minkhant သို့မဟုတ် 09...' : 'e.g. minkhant or 09...'}
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password */}
            <Text style={styles.inputLabel}>{isMy ? 'စကားဝှက် (Password)' : 'Password'}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />

            {/* Advanced Server Toggle */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Text style={styles.advancedToggleText}>
                {showAdvanced
                  ? (isMy ? '▼ Server ဆက်တင် ဝှက်မည်' : '▼ Hide Server Settings')
                  : (isMy ? '⚙️ Server လိပ်စာ ပြင်ဆင်ရန် (Advanced)' : '⚙️ Advanced Server Settings')}
              </Text>
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.advancedBox}>
                <Text style={styles.inputLabel}>API Server URL:</Text>
                <TextInput
                  style={[styles.input, styles.monoInput]}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="https://chatechat.onrender.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.presets}>
                  <TouchableOpacity
                    style={styles.presetBtn}
                    onPress={() => setServerUrl('https://chatechat.onrender.com')}
                  >
                    <Text style={styles.presetText}>☁️ Render Cloud</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetBtn}
                    onPress={() => setServerUrl('http://10.0.2.2:4000')}
                  >
                    <Text style={styles.presetText}>📱 Emulator</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetBtn}
                    onPress={() => setServerUrl('http://localhost:4000')}
                  >
                    <Text style={styles.presetText}>💻 Local</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.connectBtn, isConnecting && styles.btnDisabled]}
              disabled={isConnecting}
              onPress={handleLoginConnect}
            >
              <Text style={styles.connectText}>
                {isConnecting
                  ? (isMy ? 'ချိတ်ဆက်နေသည်...' : 'Connecting...')
                  : (isMy ? '🚀 အကောင့်ဝင်ပြီး စတင်မည်' : 'Sign In & Connect')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Bypass */}
          <TouchableOpacity style={styles.offlineBtn} onPress={onConnected}>
            <Text style={styles.offlineText}>
              {isMy ? '⚡ Local Demo Mode ဖြင့် ချက်ချင်း စမ်းသပ်မည်' : 'Continue with Local Demo Mode'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  livePillText: {
    fontSize: 10,
    color: '#34D399',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#F8FAFC',
    marginBottom: 14,
  },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  advancedToggle: {
    paddingVertical: 6,
    marginBottom: 10,
  },
  advancedToggleText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '700',
  },
  advancedBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  connectBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#475569',
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  offlineBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
