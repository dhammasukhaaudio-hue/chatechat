# ChateChat (ချိတ်ချက်) - Android Mobile Application 📱

ChateChat Android App သည် မြန်မာအွန်လိုင်းဆိုင်ပိုင်ရှင်များနှင့် Customer Support Agent များအတွက် သီးသန့်တည်ဆောက်ထားသော High-Performance Real-Time Multi-Channel Communication Mobile App ဖြစ်ပါသည်။

---

## 🌟 အဓိက ပါဝင်သော စွမ်းဆောင်ရည်များ (Features)

1. **စုပေါင်း Inbox (Unified Omnichannel Inbox)**:
   - Facebook Messenger 🔵, Telegram ✈️, Viber 🟣, TikTok 🎵 နှင့် Web Widget 💬 မက်ဆေ့ခ်ျများကို မျက်နှာပြင်တစ်ခုတည်းတွင် လက်ခံရယူခြင်း။
   - Tab များ: အားလုံး (All), မဖြေရသေး (Unassigned), လုပ်ဆောင်ဆဲ (Active), စောင့်ဆိုင်းဆဲ (Waiting), ဖြေရှင်းပြီး (Resolved)။
2. **မြန်မာယူနီကုဒ် & Canned Responses (အမြန်ဖြေ စကားစုများ)**:
   - 1-Tap ဖြင့် `/kpay`၊ `/wave`၊ `/ayapay`၊ `/deli` (ပို့ဆောင်ခ နှုန်းထား) စာများကို အမြန်ပေးပို့နိုင်ခြင်း။
3. **Smart Gemini AI & Human Handover Toggle**:
   - မေးခွန်းများကို AI Bot ဖြေကြားနေစဉ် လိုအပ်ပါက ခလုတ်တစ်ချက်နှိပ်ရုံဖြင့် လူကိုယ်တိုင် လွှဲပြောင်းရယူနိုင်ခြင်း (🤖 AI ↔️ 👨‍💻 Agent)။
4. **ဖုန်းနံပါတ် တောင်းဆိုမှု (Phone Number Capture)**:
   - Telegram / Viber စည်းမျဉ်းအရ ဖုန်းနံပါတ် မသိရှိသေးပါက **"ဖုန်းနံပါတ် ပေးပို့ရန် / Share My Phone number"** ခလုတ်ဖြင့် ၁ စက္ကန့်အတွင်း အလိုအလျောက် တောင်းဆိုနိုင်ခြင်း။
5. **Mobile CRM & 1-Tap Phone Call**:
   - Customer ဖုန်းနံပါတ်အား အက်ပ်ထဲမှ တိုက်ရိုက်ဖုန်းခေါ်ဆိုနိုင်ခြင်း (`📞 ဖုန်းခေါ်မည်`)၊ SMS ပို့နိုင်ခြင်းနှင့် မြို့နယ်/လိပ်စာ ကြည့်ရှုနိုင်ခြင်း။
6. **Bilingual Support (ဘာသာစကား ၂ မျိုး)**:
   - 🇲🇲 မြန်မာဘာသာ (Unicode) နှင့် 🇬🇧 English ကို Settings ထဲတွင် ၁ ချက်နှိပ်ရုံဖြင့် ပြောင်းလဲနိုင်ခြင်း။

---

## 🚀 ဖုန်းပေါ်တွင် စမ်းသပ် Run နည်း (How to Run on Android)

### နည်းလမ်း (၁) - သင်၏ Android ဖုန်းအစစ်ဖြင့် စမ်းသပ်ခြင်း (အလွယ်ဆုံးနည်း)
1. သင်၏ Android ဖုန်းတွင် **Google Play Store** မှ `Expo Go` အက်ပ်ကို အခမဲ့ ဒေါင်းလုဒ်ဆွဲပါ။
2. ကွန်ပျူတာနှင့် ဖုန်းကို **WiFi ကွန်ရက်တစ်ခုတည်း (Same WiFi)** တွင် ချိတ်ဆက်ပါ။
3. Terminal တွင် အောက်ပါ command ကို Run ပါ:
   ```bash
   cd apps/mobile-android
   npx expo start
   ```
4. Terminal တွင် ထွက်ပေါ်လာသော **QR Code** ကို Android ဖုန်းရှိ `Expo Go` အက်ပ်ဖြင့် Scan ဖတ်လိုက်ရုံဖြင့် အက်ပ်ပွင့်လာမည် ဖြစ်ပါသည်။
5. Server Connection မျက်နှာပြင်တွင် သင့်ကွန်ပျူတာ၏ WiFi IP လိပ်စာ (ဥပမာ `http://192.168.1.15:4000`) ကို ထည့်သွင်းပြီး ချိတ်ဆက်နိုင်ပါသည်။

### နည်းလမ်း (၂) - Android Studio Emulator တွင် စမ်းသပ်ခြင်း
1. Android Studio Emulator ကို ဖွင့်ပါ။
2. Terminal တွင် အောက်ပါ command ကို Run ပါ:
   ```bash
   cd apps/mobile-android
   npx expo start --android
   ```
3. Server Connection မျက်နှာပြင်တွင် `📱 Emulator (10.0.2.2)` ခလုတ်ကို နှိပ်ပြီး `http://10.0.2.2:4000` ဖြင့် ချိတ်ဆက်နိုင်ပါသည်။

### နည်းလမ်း (၃) - Standalone APK ထုတ်လုပ်ခြင်း
တိုက်ရိုက် install လုပ်နိုင်သော `.apk` ဖိုင် ထုတ်ယူလိုပါက:
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
Build ပြီးပါက ထွက်လာသော `.apk` link ကို Android ဖုန်းတွင် ဒေါင်းလုဒ်ဆွဲ၍ တိုက်ရိုက် install ပြုလုပ်နိုင်ပါသည်။
