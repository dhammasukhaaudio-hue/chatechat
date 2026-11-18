import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Props {
  onSelect: (text: string) => void;
  lang?: 'my' | 'en';
}

export const CannedResponseBar: React.FC<Props> = ({ onSelect }) => {
  const responses = [
    {
      label: '🏦 AYA Pay',
      text: 'ဟုတ်ကဲ့ပါခင်ဗျာ! AYA Pay ဖြင့် အဆင်ပြေစွာ ငွေလွှဲရှင်းနိုင်ပါသည်ခင်ဗျာ။ AYA Pay အကောင့်: 09987654321 (ဒေါ်စုစုဝင်း) ဖြစ်ပါသည်ခင်ဗျာ။ 🙏',
    },
    {
      label: '💳 KBZPay',
      text: 'ဟုတ်ကဲ့ပါခင်ဗျာ။ KBZPay အကောင့် 09987654321 (ဒေါ်စုစုဝင်း) သို့ လွှဲပေးပို့နိုင်ပါသည်။ လွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။ 🙏',
    },
    {
      label: '🌊 WavePay',
      text: 'ဟုတ်ကဲ့ပါခင်ဗျာ။ WavePay အကောင့် 09987654321 သို့ လွှဲပေးပို့နိုင်ပါသည်ခင်ဗျာ။',
    },
    {
      label: '🚚 Deli နှုန်းထား',
      text: 'ပို့ဆောင်ခမှာ ရန်ကုန် ၂၅၀၀ ကျပ် (၁-၂ ရက်၊ COD အိမ်ရောက်ငွေချေ ရရှိပါသည်)၊ မန္တလေး ၃၅၀၀ ကျပ် ဖြစ်ပါသည်ခင်ဗျာ။ 🚚',
    },
    {
      label: '📱 ဖုန်း/လိပ်စာ တောင်းရန်',
      text: 'လူကြီးမင်း၏ အော်ဒါအား အမြန်ဆုံး ပို့ဆောင်ပေးနိုင်ရန် ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်နှင့် ပို့ဆောင်ရမည့် လိပ်စာလေး ပြောပြပေးပါခင်ဗျာ။ 🙏',
    },
    {
      label: '✅ အော်ဒါမှတ်ပြီး',
      text: 'လူကြီးမင်း၏ အော်ဒါအား စနစ်တွင် အောင်မြင်စွာ မှတ်သားအတည်ပြုထားပြီး ဖြစ်ပါသည်ခင်ဗျာ။ ပစ္စည်းထွက်ပါက ဖုန်းဆက်အကြောင်းကြားပေးပါမည်။ ကျေးဇူးတင်ရှိပါသည်ခင်ဗျာ။ 🙏',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {responses.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.pill}
            activeOpacity={0.7}
            onPress={() => onSelect(item.text)}
          >
            <Text style={styles.pillText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
});
