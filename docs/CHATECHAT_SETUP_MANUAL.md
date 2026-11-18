# ChateChat (ချိတ်ချက်) - Multi-Channel Integration & Setup Manual
**Official Technical Guide for Founder, Support Engineers & Onboarding Staff**

---

## 📌 မာတိကာ (Table of Contents)
1. [နိဒါန်းနှင့် လိုအပ်ချက်များ (Prerequisites)](#1-prerequisites)
2. [Facebook Messenger ချိတ်ဆက်နည်း (Step-by-Step)](#2-facebook-messenger)
3. [Telegram Bot ချိတ်ဆက်နည်း (Step-by-Step)](#3-telegram-bot)
4. [Viber Business & Bot ချိတ်ဆက်နည်း (Step-by-Step)](#4-viber-bot)
5. [TikTok Direct Messages ချိတ်ဆက်နည်း (Step-by-Step)](#5-tiktok-dm)
6. [Website Live Chat Widget ထည့်သွင်းနည်း](#6-website-widget)
7. [Google Gemini AI API Key အခမဲ့ ရယူနည်း](#7-gemini-ai-key)
8. [ငွေပေးချေမှုနှင့် Agent Seats စည်းမျဉ်းများ (Pricing & Seats Rule)](#8-pricing-rules)

---

<a name="1-prerequisites"></a>
## ၁။ နိဒါန်းနှင့် လိုအပ်ချက်များ (Prerequisites)
ChateChat စနစ်သည် Facebook, Telegram, Viber, TikTok တို့မှ စာများကို Webhook နည်းပညာဖြင့် Real-time ရယူပါသည်။
- **Domain & SSL**: ချိတ်ဆက်ရန်အတွက် Server တွင် **HTTPS (SSL Certificate)** မဖြစ်မနေ လိုအပ်ပါသည် (Local စမ်းသပ်စဉ်တွင် `ngrok` သို့မဟုတ် `cloudflared` ကို အသုံးပြုနိုင်ပါသည်)။
- **Server Webhook Base URL**: `https://your-domain.com/api/v1/webhooks`

---

<a name="2-facebook-messenger"></a>
## ၂။ Facebook Messenger ချိတ်ဆက်နည်း (Meta Graph API)

### အဆင့် ၁: Meta for Developers တွင် App တည်ဆောက်ခြင်း
1. [Meta for Developers Portal](https://developers.facebook.com/) သို့ သွား၍ Login ဝင်ပါ။
2. **My Apps** > **Create App** ကို နှိပ်ပါ။
3. App Type တွင် **Other** သို့မဟုတ် **Business** ကို ရွေးချယ်ပြီး App Name ပေးပါ (ဥပမာ - `ChateChat Messenger`).

### အဆင့် ၂: Messenger Product ထည့်သွင်းခြင်း
1. App Dashboard တွင် **Add a Product** သို့ သွားပြီး **Messenger** အောက်ရှိ **Set Up** ကို နှိပ်ပါ။
2. **Facebook Pages** ကဏ္ဍတွင် ဝယ်သူ၏ ဆိုင် Facebook Page ကို ရွေးချယ်၍ ချိတ်ဆက်ခွင့် (Permissions) ပေးပါ။
3. ချိတ်ဆက်ထားသော Page ဘေးရှိ **Generate Token** ခလုတ်ကို နှိပ်၍ **Page Access Token** ကို ကူးယူပြီး သိမ်းထားပါ။

### အဆင့် ၃: Webhook ချိတ်ဆက်ခြင်း (Webhooks Configuration)
1. Messenger Settings ရှိ **Webhooks** ကဏ္ဍတွင် **Configure Webhooks** ကို နှိပ်ပါ။
2. အောက်ပါ အချက်အလက်များကို ဖြည့်သွင်းပါ:
   - **Callback URL**: `https://your-domain.com/api/v1/webhooks/messenger`
   - **Verify Token**: `chatechat_verify_token` (သို့မဟုတ် မိမိသတ်မှတ်ထားသော Token)
3. **Verify and Save** ကို နှိပ်ပါ (Server မှ `hub.challenge` ကို လက်ခံရရှိပြီး အစိမ်းရောင် အမှန်ခြစ် တက်လာပါမည်)။

### အဆင့် ၄: Webhook Subscriptions ရွေးချယ်ခြင်း
Page Subscriptions တွင် အောက်ပါ Events များကို **Subscribe** လုပ်ပါ:
- ✅ `messages` (ဝယ်သူ စာပို့သမျှကို ရယူရန်)
- ✅ `messaging_postbacks` (ခလုတ်နှိပ်မှုများ ရယူရန်)
- ✅ `message_deliveries` (စာရောက်ရှိမှု စစ်ဆေးရန်)

### အဆင့် ၅: ChateChat Dashboard တွင် ထည့်သွင်းခြင်း
1. ChateChat Dashboard > **ချန်နယ်များ (Channels)** သို့ သွားပါ။
2. **Facebook Messenger** ကတ်တွင်:
   - **Page ID**: Facebook Page ID
   - **Page Access Token**: အထက်တွင် ကူးယူခဲ့သော Token ကို ထည့်ပြီး **ချိတ်ဆက်မည်** ကို နှိပ်ပါ။

---

<a name="3-telegram-bot"></a>
## ၃။ Telegram Bot ချိတ်ဆက်နည်း (Telegram Bot API)

Telegram သည် ၂၄ နာရီ ကန့်သတ်ချက်မရှိဘဲ စာပို့နိုင်ပြီး Promotion broadcast ပို့ရန် အကောင်းဆုံး ချန်နယ် ဖြစ်ပါသည်။

### အဆင့် ၁: Bot အသစ် တည်ဆောက်ခြင်း
1. Telegram App တွင် `@BotFather` ကို ရှာဖွေပြီး **Start** နှိပ်ပါ။
2. `/newbot` ဟု စာရိုက်ပို့ပါ။
3. Bot ၏ အမည်ပေးပါ (ဥပမာ - `Royal Fashion Store`).
4. Bot ၏ Username ပေးပါ (အဆုံးတွင် `bot` ပါရမည်၊ ဥပမာ - `RoyalFashion_store_bot`).
5. BotFather မှ ပေးပို့သော **HTTP API Token** ကို ကူးယူပါ (ဥပမာ - `7123456789:AAH...`).

### အဆင့် ၂: Webhook ချိတ်ဆက်ခြင်း (Set Webhook)
Browser သို့မဟုတ် Postman တွင် အောက်ပါ URL အတိုင်း ဖွင့်လိုက်ပါ:
```text
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/v1/webhooks/telegram/<CHANNEL_ID>
```
**အောင်မြင်ပါက ရရှိမည့် Response**:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### အဆင့် ၃: Dashboard တွင် Bot Token ထည့်သွင်းခြင်း
1. ChateChat Dashboard > **ချန်နယ်များ** > **Telegram Bot API** သို့ သွားပါ။
2. Bot Username နှင့် Bot Token ကို ထည့်သွင်းပြီး သိမ်းဆည်းပါ။

---

<a name="4-viber-bot"></a>
## ၄။ Viber Business & Bot ချိတ်ဆက်နည်း (Viber REST API)

### အဆင့် ၁: Viber Partner Account ဖွင့်ခြင်း
1. [Viber Partner Portal](https://partners.viber.com/) သို့ သွား၍ ဆိုင်၏ Viber ဖုန်းနံပါတ်ဖြင့် Login ဝင်ပါ။
2. **Create Bot Account** ကို နှိပ်ပါ။
3. ဆိုင်အမည် (Account Name)၊ Logo ပုံ၊ အမျိုးအစား (Category)၊ ဘာသာစကား (Burmese) နှင့် နိုင်ငံ (Myanmar) ကို ရွေးချယ်ပြီး သဘောတူညီချက်ကို နှိပ်ပါ။

### အဆင့် ၂: Auth Token ရယူခြင်း
- Bot တည်ဆောက်ပြီးပါက စာလုံး ၃၂ လုံးပါသော **Viber App Key / Auth Token** ထွက်လာပါမည် (ကူးယူသိမ်းဆည်းပါ)။

### အဆင့် ၃: Webhook Register ပြုလုပ်ခြင်း
Terminal (PowerShell / Bash) တွင် အောက်ပါ Command ဖြင့် Webhook ကို Viber ထံ မှတ်ပုံတင်ပါ:
```bash
curl -X POST "https://chatapi.viber.com/pa/set_webhook" \
     -H "Content-Type: application/json" \
     -H "X-Viber-Auth-Token: <YOUR_VIBER_AUTH_TOKEN>" \
     -d '{
       "url": "https://your-domain.com/api/v1/webhooks/viber/<CHANNEL_ID>",
       "event_types": ["delivered", "seen", "failed", "subscribed", "unsubscribed", "conversation_started"]
     }'
```
**အောင်မြင်ပါက Viber မှ ရရှိမည့် Response**:
```json
{
  "status": 0,
  "status_message": "ok",
  "event_types": ["delivered", "seen", "failed", "subscribed", "unsubscribed", "conversation_started"]
}
```

---

<a name="5-tiktok-dm"></a>
## ၅။ TikTok Direct Messages (TikTok Business API)

TikTok Live နှင့် TikTok Shop မှ ဝယ်သူများ၏ Direct Message (DM) များကို ရယူရန်:
1. [TikTok for Developers](https://business-api.tiktok.com/portal/) သို့ Login ဝင်ပါ။
2. **Manage Apps** > **Create an App** ကို နှိပ်ပါ။
3. **Business Messaging / Direct Message** Permissions ကို ရွေးချယ်ပါ။
4. Webhook URL တွင်:
   `https://your-domain.com/api/v1/webhooks/tiktok/<CHANNEL_ID>` ကို ထည့်သွင်းပါ။
5. ထွက်ရှိလာသော **Access Token** နှင့် **Client Secret** ကို ChateChat Dashboard ရှိ TikTok ကတ်တွင် ထည့်သွင်းပါ။

---

<a name="6-website-widget"></a>
## ၆။ Website Live Chat Widget ထည့်သွင်းနည်း (Web Component)

ဝယ်သူ၏ Website (WordPress, Shopify, Next.js, HTML) တွင် အောက်ပါ Code လေးကို `</body>` မပိတ်မီ ထည့်ပေးရုံဖြင့် JivoChat ကဲ့သို့ Floating Chat Widget ပေါ်လာပါမည်:

```html
<!-- ChateChat Live Chat Snippet -->
<script 
  src="https://your-domain.com/widget/chatechat.js" 
  data-org-id="YOUR_ORGANIZATION_ID"
  data-theme-color="#2563EB"
  defer>
</script>
```

---

<a name="7-gemini-ai-key"></a>
## ၇။ Google Gemini AI API Key အခမဲ့ ရယူနည်း

Gemini AI သည် Google ၏ Cloud ပေါ်တွင် လည်ပတ်သဖြင့် ဆိုင်၏ Server တွင် **Storage Space ၀ MB (လုံးဝ နေရာမယူပါ)**။

1. [Google AI Studio](https://aistudio.google.com/) သို့ Google Account ဖြင့် ဝင်ပါ။
2. **Get API Key** ကို နှိပ်ပြီး **Create API Key** ကို ရွေးပါ။
3. ရရှိလာသော Key ကို Server ၏ `.env` ဖိုင်တွင် ထည့်ပါ:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeneratedSecretKey..."
   ```
4. **ကုန်ကျစရိတ်**:
   - **Free Tier**: တစ်မိနစ်လျှင် မေးခွန်း ၁၅ ခုအထိ **လုံးဝ အခမဲ့ (100% Free)** အသုံးပြုနိုင်ပါသည်။
   - **Pay-as-you-go**: မေးခွန်း အခွန်း ၁ သန်း (1M Tokens) လျှင် မြန်မာငွေ **၂၅၀ - ၃၀၀ ကျပ်ခန့်သာ** ကျသင့်သဖြင့် အလွန်သက်သာပါသည်။

---

<a name="8-pricing-rules"></a>
## ၈။ စနစ်ကြေးနှုန်းထားနှင့် ဝန်ထမ်းခွင့်ပြုချက် စည်းမျဉ်းများ

Michael သတ်မှတ်ထားသော စီးပွားရေးဆိုင်ရာ စည်းမျဉ်းများအတိုင်း ChateChat တွင် တိကျစွာ ထည့်သွင်းတွက်ချက်ထားပါသည်:

### ၁။ အခြေခံ အစီအစဉ်များ (Base Plans)
- **၁ ချန်နယ် အစီအစဉ်**: ၅,၀၀၀ MMK / လ
- **၂ ချန်နယ် အစီအစဉ်**: ၁၀,၀၀၀ MMK / လ
- **၃ ချန်နယ် အစီအစဉ်**: ၁၂,၀၀၀ MMK / လ
- **ချန်နယ်အားလုံး (Omnichannel)**: ၁၅,၀၀၀ MMK / လ

### ၂။ ဝန်ထမ်း ခွင့်ပြုချက် စည်းမျဉ်း (Seat Quota Rule)
- အစီအစဉ်တိုင်းတွင် **Admin ၁ ဦး + Agent ၁ ဦး (စုစုပေါင်း ၂ ဦး) အခမဲ့ ပါဝင်သည်**။
- ဝန်ထမ်း ထပ်မံထည့်သွင်းလိုပါက **အပိုအေးဂျင့် ၁ ဦးလျှင် အသုံးပြုသည့် Plan တန်ဖိုး၏ 30%** ထပ်မံကျသင့်ပါမည်။
  - *ဥပမာ: ၁၂,၀၀၀ ကျပ်တန် 3 Channels Plan သုံးထားပြီး ဝန်ထမ်း စုစုပေါင်း ၃ ဦး (အပို ၁ ဦး) သုံးပါက* $\rightarrow$ $12,000 + 3,600 = 15,600$ MMK / လ။

### ၃။ ကာလရှည် လျှော့ဈေးများ (Billing Cycle Discounts)
- **၁ လ (Monthly)**: ပုံမှန်နှုန်းထား (၀%)
- **၃ လ (Quarterly)**: ၅% လျှော့ဈေး
- **၆ လ (Half-Yearly)**: ၁၀% လျှော့ဈေး
- **၁၂ လ (Annual)**: ၂၀% အထူးလျှော့ဈေး (သို့မဟုတ် ၂ လ အခမဲ့နှင့် ညီမျှသည်)
