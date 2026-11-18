/**
 * ChateChat (ချိတ်ချက်) - Local Webhook & Real-Time Simulator
 * Run this script to simulate incoming customer messages from
 * Facebook Messenger, Telegram, Viber, and TikTok directly to your local backend.
 *
 * Usage: node scripts/simulate-webhook.js [messenger|telegram|viber|tiktok]
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000/api/v1/webhooks';

const SCENARIOS = {
  // 1. Facebook Messenger Simulation
  messenger: {
    url: `${API_BASE}/messenger`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      object: 'page',
      entry: [
        {
          id: 'page_royal_fashion',
          messaging: [
            {
              sender: { id: 'fb_user_101' },
              recipient: { id: 'page_royal_fashion' },
              timestamp: Date.now(),
              message: {
                mid: `mid_fb_${Date.now()}`,
                text: 'မင်္ဂလာပါရှင် အကျီ size M အနက်ရောင် ရသေးလားရှင့်? ဈေးဘယ်လောက်လဲ?',
              },
            },
          ],
        },
      ],
    },
  },

  // 2. Telegram Bot Simulation
  telegram: {
    url: `${API_BASE}/telegram/chan_tg_test`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      update_id: Date.now(),
      message: {
        message_id: Math.floor(Math.random() * 10000),
        from: {
          id: 99887766,
          first_name: 'Ko Min',
          last_name: 'Thu',
          username: 'min_thu_mdy',
        },
        chat: { id: 99887766, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: 'မင်္ဂလာပါ ရန်ကုန် ပို့ခ ဘယ်လောက်ကျပါသလဲဗျ? အိမ်ရောက်ငွေချေ ရလား?',
      },
    },
  },

  // 3. Viber Business Simulation
  viber: {
    url: `${API_BASE}/viber/chan_viber_test`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      event: 'message',
      timestamp: Date.now(),
      message_token: Date.now(),
      sender: {
        id: 'viber_user_5544',
        name: 'Daw Hla Hla',
      },
      message: {
        type: 'text',
        text: 'KBZPay နံပါတ်လေး ပေးပါရှင်.. အခုချက်ချင်း ငွေလွှဲချင်လို့ပါ',
      },
    },
  },

  // 4. TikTok Direct Message Simulation
  tiktok: {
    url: `${API_BASE}/tiktok/chan_tiktok_test`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      event: {
        from_user_id: 'tt_customer_88',
        sender_name: 'mg_mg_style',
        create_time: Math.floor(Date.now() / 1000),
        content: {
          text: 'လူနဲ့ပြောချင်တယ်ဗျ.. အော်ဒါအရေးကြီးတင်ချင်လို့ admin ခေါ်ပေးပါ',
        },
      },
    },
  },
};

async function runSimulation() {
  const channel = process.argv[2] || 'all';

  console.log('====================================================');
  console.log('🚀 ChateChat (ချိတ်ချက်) - Local Webhook Test Simulator');
  console.log('====================================================\n');

  const targets = channel === 'all' ? Object.keys(SCENARIOS) : [channel];

  for (const key of targets) {
    const scenario = SCENARIOS[key];
    if (!scenario) {
      console.error(`❌ Unknown channel: ${key}. Options: messenger, telegram, viber, tiktok`);
      return;
    }

    console.log(`📡 Simulating incoming message from [${key.toUpperCase()}]...`);
    try {
      const res = await fetch(scenario.url, {
        method: 'POST',
        headers: scenario.headers,
        body: JSON.stringify(scenario.body),
      });

      console.log(`   Response Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`   Response Body: ${text.slice(0, 120)}\n`);
    } catch (err) {
      console.error(`   ❌ Failed to connect to ${scenario.url}: ${err.message}`);
      console.log(`   💡 Make sure the backend API is running on http://localhost:4000\n`);
    }
  }
}

runSimulation();
