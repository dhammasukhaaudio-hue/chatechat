# ChateChat (ချိတ်ချက်) - Android Mobile Application 📱

ChateChat Android App သည် မြန်မာအွန်လိုင်းဆိုင်ပိုင်ရှင်များနှင့် Customer Support Agent များအတွက် သီးသန့်တည်ဆောက်ထားသော High-Performance Real-Time Multi-Channel Communication Mobile App ဖြစ်ပါသည်။

---

## 🌟 Android ဖုန်းအားလုံးအတွက် Fix လုပ်ထားသော အချက်များ (All Android Fixes)

1. **Android OS Version အားလုံး Support ပေးနိုင်ခြင်း (Android 7 မှ Android 15 အထိ)**:
   - `Target SDK 34/35` အပြည့်အဝ ထည့်သွင်းထားပြီး Android 13+ အတွက် `POST_NOTIFICATIONS` နှင့် Media Permissions များကို စနစ်တကျ ချိန်ညှိထားပါသည်။
2. **Android Hardware Back Button ပြင်ဆင်ချက် (Hardware BackPress Fixed)**:
   - Chat မျက်နှာပြင် သို့မဟုတ် Settings မျက်နှာပြင်တွင် ဖုန်း၏ Physical Back Button နှိပ်လိုက်ပါက App ထွက်မသွားဘဲ Inbox သို့ အလိုအလျောက် ပြန်ရောက်စေရန် စီမံထားပါသည်။
3. **ကီးဘုတ် စာရိုက်ကွက် မကွယ်စေရန် ပြင်ဆင်ချက် (Keyboard Pan Layout Fixed)**:
   - Samsung, Xiaomi, Oppo, Vivo အစရှိသော Android စက်များတွင် စာရိုက်ကွက် ပွင့်လာပါက Chat Input Box မကွယ်သွားစေရန် `softwareKeyboardLayoutMode: "pan"` သတ်မှတ်ထားပါသည်။
4. **မြန်မာ ယူနီကုဒ် ဖောင့် ပြသမှု အပြည့်အဝ ကောင်းမွန်စေခြင်း**:
   - Zawgyi/Unicode font conflict မဖြစ်စေဘဲ System Unicode Font ဖြင့် ချောမွေ့စွာ ပြသပေးပါသည်။
5. **တိုက်ရိုက် Cloud Server ချိတ်ဆက်မှု (Live Render Cloud Ready)**:
   - Production API Server အဖြစ် `https://chatechat.onrender.com` ကို Default ချိတ်ဆက်ပေးထားပြီး Socket.io (WebSocket + HTTP Polling) ဖြင့် အင်တာနက်လိုင်း မည်မျှနှေးသည်ဖြစ်စေ အမြဲတမ်း Connected ဖြစ်နေစေပါသည်။
6. **Multi-Tenant Shop Login အပြည့်အဝ အသုံးပြုနိုင်ခြင်း**:
   - ဆိုင်ပိုင်ရှင် (`minkhant` သို့မဟုတ် မိမိအကောင့်) ဖြင့် တိုက်ရိုက် Login ဝင်နိုင်ပြီး မိမိဆိုင်၏ Telegram/Facebook စာများကို ဖုန်းပေါ်မှ တိုက်ရိုက် စာပြန်နိုင်ပါသည်။

---

## 🚀 Standalone APK ဖိုင် ထုတ်ယူနည်း (How to Generate APK File)

EAS (Expo Application Services) ဖြင့် သင့်ကွန်ပျူတာတွင် Android Studio သွင်းစရာမလိုဘဲ တိုက်ရိုက် install လုပ်နိုင်သော `.apk` ဖိုင်ကို အခမဲ့ ထုတ်ယူနိုင်ပါသည်:

### အဆင့် ၁: EAS CLI တင်သွင်းခြင်း
```bash
npm install -g eas-cli
```

### အဆင့် ၂: Expo Account ဖြင့် Login ဝင်ခြင်း (မရှိပါက အခမဲ့ Register လုပ်ပါ)
```bash
eas login
```

### အဆင့် ၃: တိုက်ရိုက် Install လုပ်နိုင်သော APK ဖိုင် ထုတ်ယူခြင်း
```bash
cd apps/mobile-android
eas build -p android --profile preview
```

> **မှတ်ချက်:** Build ပြီးပါက Terminal တွင် တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲနိုင်သော **APK Download Link** နှင့် **QR Code** ထွက်လာမည်ဖြစ်ပြီး မည်သည့် Android ဖုန်းတွင်မဆို ချက်ချင်း ဒေါင်းလုဒ်ဆွဲကာ Install ပြုလုပ်နိုင်ပါသည်။

---

## 📲 ဖုန်းပေါ်တွင် ချက်ချင်း စမ်းသပ်လိုပါက (Expo Go ဖြင့် ၁ မိနစ်အတွင်း စမ်းသပ်နည်း)

1. ဖုန်းရှိ Google Play Store မှ **`Expo Go`** အက်ပ်ကို အခမဲ့ ဒေါင်းလုဒ်ဆွဲပါ။
2. Terminal တွင် အောက်ပါ command ကို Run ပါ:
   ```bash
   cd apps/mobile-android
   npx expo start
   ```
3. Terminal တွင် ပေါ်လာသော **QR Code** ကို ဖုန်းရှိ Expo Go ဖြင့် Scan ဖတ်လိုက်ရုံဖြင့် ChateChat Mobile App ပွင့်လာမည် ဖြစ်ပါသည်။
4. ဆာဗာလိပ်စာအဖြစ် `https://chatechat.onrender.com` ကို အသုံးပြုပြီး မိမိ Username ဖြင့် ဝင်ရောက်အသုံးပြုနိုင်ပါသည်။
