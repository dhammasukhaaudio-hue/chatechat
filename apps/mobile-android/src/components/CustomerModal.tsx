import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Customer } from '../types';

interface Props {
  visible: boolean;
  customer?: Customer;
  onClose: () => void;
  lang?: 'my' | 'en';
}

export const CustomerModal: React.FC<Props> = ({ visible, customer, onClose, lang = 'my' }) => {
  if (!customer) return null;
  const isMy = lang === 'my';

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleSms = () => {
    if (customer.phone) {
      Linking.openURL(`sms:${customer.phone}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.dragBar} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>{isMy ? 'ဝယ်သူ အချက်အလက် (CRM)' : 'Customer Profile'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Avatar & Name */}
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{customer.name.substring(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{customer.name}</Text>
                <Text style={styles.subtext}>{isMy ? 'အမြဲတမ်း ဝယ်ယူသူ' : 'Registered Customer'}</Text>
              </View>
            </View>

            {/* Quick Action Dial Buttons */}
            {customer.phone && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall}>
                  <Text style={styles.btnText}>📞 {isMy ? 'ဖုန်းခေါ်မည်' : 'Call'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.smsBtn]} onPress={handleSms}>
                  <Text style={styles.btnText}>💬 {isMy ? 'SMS ပို့မည်' : 'SMS'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Contact Details */}
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.label}>{isMy ? 'ဖုန်းနံပါတ်' : 'Phone'}</Text>
                <Text style={styles.value}>{customer.phone || (isMy ? 'မသိရှိသေးပါ' : 'Not set')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.label}>{isMy ? 'မြို့နယ်' : 'City'}</Text>
                <Text style={styles.value}>{customer.city || (isMy ? 'မသိရှိသေးပါ' : 'Not set')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cardRow}>
                <Text style={styles.label}>{isMy ? 'လိပ်စာ' : 'Address'}</Text>
                <Text style={[styles.value, { flex: 1, textAlign: 'right' }]}>
                  {customer.address || (isMy ? 'လိပ်စာ မဖြည့်ရသေးပါ' : 'No address provided')}
                </Text>
              </View>
            </View>

            {/* Spend & Order Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{customer.totalOrdersCount}</Text>
                <Text style={styles.statLabel}>{isMy ? 'ကြိမ် မှာယူပြီး' : 'Total Orders'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, { color: '#2563EB' }]}>
                  {customer.totalSpentMmk.toLocaleString()} Ks
                </Text>
                <Text style={styles.statLabel}>{isMy ? 'စုစုပေါင်း ဝယ်ယူမှု' : 'Total Spent'}</Text>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              <Text style={styles.sectionTitle}>{isMy ? 'အမျိုးအစား အမှတ်အသား' : 'Tags'}</Text>
              <View style={styles.tagWrap}>
                {customer.tags.map((t, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Platform Privacy Notice */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {isMy
                  ? '💡 Telegram, Facebook, TikTok Privacy စည်းမျဉ်းအရ ဖုန်းနံပါတ်ကို ဝယ်သူမှ "ဖုန်းနံပါတ် ပေးပို့ရန် / Share My Phone number" ခလုတ်နှိပ်ခြင်း (သို့မဟုတ်) ရိုက်ပို့သည့်အခါ AI မှ အလိုအလျောက် သိမ်းဆည်းပေးပါသည်။'
                  : '💡 Phone numbers are extracted automatically when shared via Telegram / Messenger contact sharing or chat messages.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: 8,
  },
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#16A34A',
  },
  smsBtn: {
    backgroundColor: '#2563EB',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#BFDBFE',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  statLabel: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    fontWeight: '600',
  },
  tagsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
});
