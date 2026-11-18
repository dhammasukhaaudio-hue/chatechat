import { GoogleGenAI } from '@google/genai';
import { prisma } from '@chatechat/database';
import { OutboundService } from '../chat/outbound.service';
import { HandoverService } from './handover.service';

export class GeminiService {
  private static aiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDummyKeyForMockFallback';
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  /**
   * Evaluate and automatically reply to an incoming customer message
   */
  public static async handleIncomingMessage(
    conversationId: string,
    messageContent: string,
    messageType: string = 'TEXT',
    mediaUrl?: string,
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    try {
      // 1. Fetch conversation details, organization AI config, and ecommerce knowledge
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          organization: {
            include: {
              aiConfig: true,
              ecommerceConfig: true,
            },
          },
          customer: true,
        },
      });

      if (!conversation) return;

      const aiConfig = conversation.organization.aiConfig;
      // If AI is disabled or conversation is not in BOT_HANDLING mode, skip
      if (!aiConfig?.isEnabled || conversation.handoverStatus !== 'BOT_HANDLING') {
        return;
      }

      // 2. Check for Payment Slip or Image Upload
      if (messageType === 'IMAGE' || mediaUrl) {
        console.log(`📸 Image received for Conv ${conversationId}. Handling as potential payment slip.`);
        // Acknowledge slip and request agent verification
        const slipAckReply =
          'ငွေလွှဲပြေစာ (Payment Slip) ပေးပို့ပေးသည့်အတွက် ကျေးဇူးတင်ရှိပါသည်ခင်ဗျာ။ လူကြီးမင်း၏ ငွေလွှဲပြေစာအား တာဝန်ကျ စာရင်းကိုင်နှင့် အရောင်းကိုယ်စားလှယ်မှ အမြန်ဆုံး စစ်ဆေးအတည်ပြုပေးပါမည်ခင်ဗျာ။ ခဏလေး စောင့်ဆိုင်းပေးပါရှင့်/ခင်ဗျာ။ 🙏';

        await OutboundService.dispatchOutboundMessage(
          conversationId,
          { type: 'BOT', name: 'ChateChat AI Bot' },
          slipAckReply,
          'TEXT',
          undefined,
          socketEmitter
        );

        // Transition to human agent for manual slip verification
        await HandoverService.requestHumanHandover(
          conversationId,
          'Customer sent payment slip screenshot for verification',
          socketEmitter
        );
        return;
      }

      // 3. Keyword-Based Rapid Handover Detection (Burmese & English)
      const handoverKeywords = aiConfig.handoverKeywords || [
        'လူနဲ့ပြောချင်တယ်',
        'လူနဲ့',
        'လူ',
        'အေးဂျင့်',
        'အက်မင်',
        'agent',
        'human',
        'admin',
        'အော်ဒါတင်ချင်တယ်',
        'အော်ဒါမှာချင်လို့',
        'ဖုန်းဆက်',
        'မရှင်းဘူး',
        'တိုင်ကြား',
      ];

      const lowerContent = messageContent.toLowerCase();
      const hasHandoverKeyword = handoverKeywords.some((keyword) =>
        lowerContent.includes(keyword.toLowerCase())
      );

      if (hasHandoverKeyword) {
        await HandoverService.requestHumanHandover(
          conversationId,
          `Triggered by customer keyword: "${messageContent}"`,
          socketEmitter
        );
        return;
      }

      // 4. Retrieve recent message history (last 8 messages for contextual awareness)
      const recentMessages = await prisma.message.findMany({
        where: { conversationId, isInternal: false },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });
      recentMessages.reverse();

      // Format conversation history for Gemini
      const formattedHistory = recentMessages.map((msg) => ({
        role: msg.senderType === 'CUSTOMER' ? 'user' : 'model',
        parts: [{ text: `${msg.senderName}: ${msg.content}` }],
      }));

      // 5. Construct Grounded Knowledge Base & System Instruction
      const ecom = conversation.organization.ecommerceConfig;
      const bankAccountsStr = ecom?.bankAccounts ? JSON.stringify(ecom.bankAccounts) : 'KBZPay: 09987654321 (Daw Su Su Win), WavePay: 09987654321, AYAPay: 09987654321 (Daw Su Su Win)';
      const deliveryRatesStr = ecom?.deliveryRates ? JSON.stringify(ecom.deliveryRates) : 'ရန်ကုန်: ၂၅၀၀ ကျပ် (၁-၂ ရက်၊ COD ရရှိ), မန္တလေး: ၃၅၀၀ ကျပ်, အခြားနယ်: ကားဂိတ်ချောပို့';
      const faqStr = ecom?.standardFaq ? JSON.stringify(ecom.standardFaq) : 'ပစ္စည်းမှားယွင်းပါက ၃ ရက်အတွင်း လဲလှယ်ပေးပါသည်။';

      const systemPrompt = `
${aiConfig.systemPrompt || 'သင်သည် မြန်မာအွန်လိုင်းဆိုင်၏ ယဉ်ကျေးဖော်ရွေသော AI အရောင်းလက်ထောက်ဖြစ်သည်။'}

[ဆိုင်၏ တရားဝင် အချက်အလက်များ]:
- ဘဏ်နှင့် ငွေလွှဲအကောင့်များ (KBZPay, WavePay, AYAPay, CB Bank): ${bankAccountsStr}
- ပို့ဆောင်ခနှင့် ကြာချိန်: ${deliveryRatesStr}
- ဆိုင်မူဝါဒနှင့် အမေးအဖြေများ: ${faqStr}

[မြန်မာဝယ်သူများ၏ စကားပြောပုံ အထူးနားလည်မှု စည်းကမ်းချက်များ]:
1. အမြဲတမ်း ယဉ်ကျေးသိမ်မွေ့သော မြန်မာစကား (ခင်ဗျာ/ရှင့်၊ လူကြီးမင်း) ဖြင့် ဖြေကြားပါ။
2. [အလွန်အရေးကြီးသည်] ဝယ်သူသည် ဆိုင်မှ နာမည်/လိပ်စာ မေးထားစဉ်တွင် နာမည်မပေးဘဲ "အမဲရောင်ရှိလား"၊ "ဘယ်လောက်ကြာမလဲ"၊ "AYApay နဲ့ ရှင်းလို့ရမလား" စသဖြင့် အခြားမေးခွန်းများကို ကြားဖြတ်မေးတတ်သည်။
   - ထိုသို့မေးလာပါက စိတ်မတိုဘဲ ဝယ်သူမေးသော မေးခွန်း (အရောင်၊ ကြာချိန်၊ AYAPay လက်ခံကြောင်း) ကို ဦးစွာ ရှင်းလင်းစွာ ဖြေကြားပေးပါ။
   - ဝယ်သူမေးသော မေးခွန်းစာသားများကို ဝယ်သူ၏ နာမည် သို့မဟုတ် လိပ်စာအဖြစ် လုံးဝ မမှတ်ယူပါနှင့်။
   - မေးခွန်းဖြေပြီးမှသာ အော်ဒါဆက်လက်အတည်ပြုရန် နာမည်/ဖုန်း/လိပ်စာကို ယဉ်ကျေးစွာ ထပ်မံမေးမြန်းပါ။
3. ငွေလွှဲအချက်အလက် မေးမြန်းပါက KPay, WavePay သို့မဟုတ် AYAPay နံပါတ်များကို ရှင်းလင်းစွာ ညွှန်ပြပေးပါ။
4. ပို့ဆောင်ခနှင့် ကြာချိန်မေးပါက ရန်ကုန် (၁-၂ ရက်)၊ မန္တလေးနှင့် နယ်မြို့ပို့ဆောင်ပုံကို ရှင်းပြပေးပါ။
5. ဝယ်သူမှ အော်ဒါအပြီးသတ် အတည်ပြုလိုပါက သို့မဟုတ် လူကိုယ်တိုင်နှင့်သာ ဆွေးနွေးလိုပါက "တာဝန်ကျ အရောင်းကိုယ်စားလှယ်ထံ လွှဲပေးပါမည်" ဟု ဖြေပြီး အဆုံးသတ်တွင် [HANDOVER] ဟု ထည့်သွင်းပါ။
6. မသိသော အကြောင်းအရာများ သို့မဟုတ် မသေချာသော ဈေးနှုန်းများကို ကိုယ်တိုင်မခန့်မှန်းဘဲ [HANDOVER] ဟု ပြန်လည်ညွှန်းပါ။
`;

      let aiResponseText = '';

      try {
        const client = this.getClient();
        const modelName = aiConfig.model || 'gemini-2.5-flash';

        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            ...formattedHistory,
            { role: 'user', parts: [{ text: messageContent }] },
          ],
          config: {
            systemInstruction: systemPrompt,
            temperature: aiConfig.temperature || 0.2,
          },
        });

        aiResponseText = response.text || '';
      } catch (geminiError: any) {
        console.warn('⚠️ Gemini API Live Call Failed (using fallback reply):', geminiError.message);
        // Resilient Fallback Engine for offline / quota demo modes
        aiResponseText = this.generateLocalFallbackReply(messageContent, ecom);
      }

      if (!aiResponseText) {
        aiResponseText = 'မင်္ဂလာပါခင်ဗျာ။ လူကြီးမင်း မေးမြန်းလိုသည်များကို အသေးစိတ် ဖြေကြားပေးရန် အသင့်ရှိပါသည်ခင်ဗျာ။';
      }

      // Check if Gemini determined a handover is required
      if (aiResponseText.includes('[HANDOVER]')) {
        const cleanText = aiResponseText.replace(/\[HANDOVER\]/g, '').trim();
        if (cleanText) {
          await OutboundService.dispatchOutboundMessage(
            conversationId,
            { type: 'BOT', name: 'ChateChat AI Bot' },
            cleanText,
            'TEXT',
            undefined,
            socketEmitter
          );
        }
        await HandoverService.requestHumanHandover(
          conversationId,
          'AI determined customer requires human agent assistance',
          socketEmitter
        );
        return;
      }

      // 6. Dispatch Gemini's Reply to the Customer via Outbound Service
      await OutboundService.dispatchOutboundMessage(
        conversationId,
        { type: 'BOT', name: 'ChateChat AI Bot' },
        aiResponseText.trim(),
        'TEXT',
        undefined,
        socketEmitter
      );

      console.log(`🤖 AI replied to Conv ${conversationId} on ${conversation.channelType}`);
    } catch (err: any) {
      console.error('❌ Error in GeminiService:', err.message);
    }
  }

  /**
   * High-fidelity Burmese local rule-based fallback when external API is unreachable
   */
  private static generateLocalFallbackReply(text: string, ecom: any): string {
    const lower = text.toLowerCase();

    // Contact and Phone Sharing
    if (
      lower.includes('ဖုန်းနံပါတ်') ||
      lower.includes('share my phone') ||
      lower.includes('shared contact') ||
      /(?:\+?959|09)[0-9]{7,9}/.test(lower.replace(/[\s-]/g, ''))
    ) {
      return 'ဟုတ်ကဲ့ပါခင်ဗျာ! ဆက်သွယ်ရမည့် ဖုန်းနံပါတ်ကို စနစ်တွင် အောင်မြင်စွာ မှတ်သားထားရှိပြီး ဖြစ်ပါသည်ခင်ဗျာ။ အော်ဒါပို့ဆောင်ရမည့် မြို့နယ်နှင့် လိပ်စာအပြည့်အစုံလေးကိုလည်း ဆက်လက်ပြောပြပေးပါခင်ဗျာ။ 🙏';
    }

    if (lower.includes('kpay') || lower.includes('wave') || lower.includes('ayapay') || lower.includes('aya') || lower.includes('ငွေလွှဲ') || lower.includes('လွှဲ') || lower.includes('ရှင်း')) {
      return 'ဟုတ်ကဲ့ပါခင်ဗျာ။ KBZPay, WavePay နှင့် AYAPay (09987654321 - ဒေါ်စုစုဝင်း) တို့ဖြင့် အဆင်ပြေစွာ ငွေလွှဲရှင်းနိုင်ပါသည်ခင်ဗျာ။ ငွေလွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။ 🙏';
    }

    if (lower.includes('အရောင်') || lower.includes('အမဲ') || lower.includes('အဖြူ') || lower.includes('size')) {
      return 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ! အမဲရောင်ရော အဖြူရောင်ပါ stock အသင့်ရှိပါသေးသည်ခင်ဗျာ။ လူကြီးမင်း မှာယူလိုသည့် size လေးနှင့် ဆက်သွယ်ရမည့် အမည်/ဖုန်းနံပါတ်လေး ပြောပြပေးပါခင်ဗျာ။ 😊';
    }

    if (lower.includes('deli') || lower.includes('ပို့ခ') || lower.includes('ပို့ဆောင်') || lower.includes('ဘယ်လောက်ကြာ') || lower.includes('ကြာမလဲ') || lower.includes('ကြာချိန်')) {
      return 'ဟုတ်ကဲ့ပါခင်ဗျာ။ ရန်ကုန်မြို့တွင်း ပို့ခ ၂၅၀၀ ကျပ် (၁-၂ ရက်အတွင်း အိမ်ရောက်ငွေချေ Cash On Delivery ရရှိပါသည်)။ မန္တလေး ၃၅၀၀ ကျပ်နှင့် အခြားနယ်မြို့များအတွက် ကားဂိတ်ချောပို့ဖြင့် ဂိတ်အရောက် ပို့ဆောင်ပေးပါသည်ခင်ဗျာ။ 🚚';
    }

    if (lower.includes('ဈေး') || lower.includes('ဘယ်လောက်') || lower.includes('price')) {
      return 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ။ ပစ္စည်းအမျိုးအမည်နှင့် size လေး ရွေးချယ်ပေးပါက တိကျသော ဈေးနှုန်းလေး တွက်ချက်ပြောပြပေးပါမည်ခင်ဗျာ။ 😊';
    }

    return 'မင်္ဂလာပါခင်ဗျာ! ပစ္စည်းမှာယူလိုပါက သို့မဟုတ် သိရှိလိုသည်များရှိပါက လွတ်လပ်စွာ မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။ (အော်ဒါတင်လိုပါက သို့မဟုတ် လူကိုယ်တိုင်နှင့် ပြောကြားလိုပါက "လူနဲ့ပြောချင်တယ်" ဟု ရိုက်ပို့နိုင်ပါသည်ခင်ဗျာ)';
  }

  /**
   * Interactive test playground evaluation for test console
   */
  public static async generateTestReply(
    messageText: string,
    options?: {
      kpay?: string;
      wave?: string;
      aya?: string;
      ygnDeli?: string;
      mdyDeli?: string;
      systemPrompt?: string;
    }
  ): Promise<{ reply: string; detectedIntent: string }> {
    const lower = messageText.toLowerCase().trim();

    // 1. Check Handover
    const handoverKeywords = [
      'လူနဲ့ပြောချင်', 'လူနဲ့', 'လူ', 'အေးဂျင့်', 'အက်မင်', 'agent', 'admin', 'human',
      'ဖုန်းဆက်', 'တိုင်ကြား', 'လွှဲပြီး'
    ];
    if (handoverKeywords.some((kw) => lower.includes(kw))) {
      return {
        reply: 'ဟုတ်ကဲ့ပါခင်ဗျာ။ လူကြီးမင်းအား အသေးစိတ် ကူညီဆောင်ရွက်ပေးနိုင်ရန် တာဝန်ကျ အရောင်းကိုယ်စားလှယ် (Agent) ထံသို့ ချက်ချင်း လွှဲပြောင်းပေးလိုက်ပါပြီခင်ဗျာ။ ခဏလေး စောင့်ဆိုင်းပေးပါရှင့်/ခင်ဗျာ။ 🙏',
        detectedIntent: 'HUMAN_HANDOVER',
      };
    }

    // 2. Try Gemini API first if key configured
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('Dummy')) {
      try {
        const client = this.getClient();
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: messageText }] }],
          config: {
            systemInstruction: options?.systemPrompt || 'သင်သည် မြန်မာအွန်လိုင်းဆိုင်၏ ယဉ်ကျေးဖော်ရွေသော AI အရောင်းလက်ထောက်ဖြစ်သည်။',
            temperature: 0.2,
          },
        });
        if (response.text) {
          return {
            reply: response.text.trim(),
            detectedIntent: response.text.includes('[HANDOVER]') ? 'HUMAN_HANDOVER' : 'GEMINI_LIVE_AI',
          };
        }
      } catch (err: any) {
        console.warn('Gemini test call fallback:', err.message);
      }
    }

    // 3. Realistic Dynamic Burmese Intent Matching (Checked in proper priority order)

    // Payment methods: AYAPay, KPay, WavePay, ငွေရှင်း
    if (lower.includes('aya') || lower.includes('ayapay')) {
      return {
        reply: `ဟုတ်ကဲ့ပါခင်ဗျာ! AYA Pay ဖြင့်လည်း အဆင်ပြေစွာ ငွေလွှဲရှင်းနိုင်ပါသည်ခင်ဗျာ။ AYA Pay အကောင့်မှာ ${options?.aya || '09987654321 (ဒေါ်စုစုဝင်း)'} ဖြစ်ပါသည်ခင်ဗျာ။ 🙏`,
        detectedIntent: 'PAYMENT_FAQ (AYAPAY)',
      };
    }

    if (
      lower.includes('kpay') ||
      lower.includes('wave') ||
      lower.includes('ငွေလွှဲ') ||
      lower.includes('လွှဲ') ||
      lower.includes('ငွေရှင်း') ||
      lower.includes('ရှင်းလို့')
    ) {
      return {
        reply: `ဟုတ်ကဲ့ပါခင်ဗျာ။ KBZPay အကောင့် ${options?.kpay || '09987654321 (ဒေါ်စုစုဝင်း)'} သို့မဟုတ် WavePay ${options?.wave || '09987654321'} သို့ လွှဲပေးပို့နိုင်ပါသည်။ လွှဲပြီးပါက ပြေစာ screenshot လေး ပို့ပေးပါခင်ဗျာ။ 🙏`,
        detectedIntent: 'PAYMENT_FAQ',
      };
    }

    // Contact / Phone Sharing (e.g. "ဖုန်းနံပါတ် ပေးပို့ရန်", "Share My Phone number", "+959...", "09...")
    const phonePattern = /(?:\+?959|09)[0-9]{7,9}/;
    if (
      lower.includes('ဖုန်းနံပါတ်') ||
      lower.includes('share my phone number') ||
      lower.includes('share contact') ||
      lower.includes('shared contact') ||
      (lower.includes('ဖုန်း') && !lower.includes('ဈေး') && !lower.includes('ဘယ်လောက်')) ||
      phonePattern.test(lower.replace(/[\s-]/g, ''))
    ) {
      return {
        reply: 'ဟုတ်ကဲ့ပါခင်ဗျာ! လူကြီးမင်း၏ ဆက်သွယ်ရန် ဖုန်းနံပါတ်ကို စနစ်တွင် အောင်မြင်စွာ မှတ်သားထားရှိပြီးဖြစ်ပါသည်ခင်ဗျာ။ အော်ဒါပို့ဆောင်ပေးရမည့် မြို့နယ်နှင့် လိပ်စာအပြည့်အစုံလေးကိုလည်း ဆက်လက်ပေးပို့ပေးပါခင်ဗျာ။ 🙏',
        detectedIntent: 'CONTACT_SHARE',
      };
    }

    // Color and Stock Inquiry (e.g. "အမဲရောင်ရှိလား")
    if (lower.includes('အရောင်') || lower.includes('အမဲ') || lower.includes('အဖြူ') || lower.includes('size')) {
      return {
        reply: 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ! အမဲရောင်ရော အဖြူရောင်ပါ stock အသင့်ရှိပါသေးသည်ခင်ဗျာ။ လူကြီးမင်း မှာယူလိုသည့် size လေးနှင့် ဆက်သွယ်ရမည့် အမည်/ဖုန်းနံပါတ်လေး ပြောပြပေးပါခင်ဗျာ။ 😊',
        detectedIntent: 'PRODUCT_STOCK_FAQ',
      };
    }

    // Delivery duration and fees (e.g. "ဘယ်လောက်ကြာမလဲ", "ကြာမလဲ", "ပို့ခ", "ပို့ဆောင်ခ")
    if (
      lower.includes('ဘယ်လောက်ကြာ') ||
      lower.includes('ကြာမလဲ') ||
      lower.includes('ကြာချိန်') ||
      lower.includes('ဘယ်တော့ရ') ||
      lower.includes('ရက်ကြာ') ||
      lower.includes('ပို့ခ') ||
      lower.includes('ပို့ဆောင်ခ') ||
      lower.includes('ပို့ဆောင်ချိန်') ||
      lower.includes('deli') ||
      lower.includes('ကြာ')
    ) {
      return {
        reply: `ဟုတ်ကဲ့ပါခင်ဗျာ။ ပို့ဆောင်ချိန်မှာ ${options?.ygnDeli || 'ရန်ကုန် ၁-၂ ရက် (အိမ်ရောက်ငွေချေ ရရှိပါသည်)'} ဖြစ်ပါသည်ခင်ဗျာ။ အော်ဒါမှတ်သားရန် ဝယ်ယူမည့်သူ အမည်နှင့် ဖုန်းနံပါတ်လေး ဆက်လက်ပြောပြပေးပါခင်ဗျာ။ 🚚`,
        detectedIntent: 'DELIVERY_DURATION_FAQ',
      };
    }

    // Confused / clarification questions like "ဘာပြောတာလဲ", "ဘာလဲ", "မရှင်းဘူး"
    if (
      lower.includes('ဘာပြော') ||
      lower.includes('ဘာလဲ') ||
      lower.includes('မရှင်းဘူး') ||
      lower.includes('မရှင်းပါ') ||
      lower.includes('နားမလည်') ||
      lower === 'ဘာလဲဟ' ||
      lower === 'ရှင်' ||
      lower === 'ရှင်?'
    ) {
      return {
        reply: 'ဟုတ်ကဲ့ လူကြီးမင်း မေးမြန်းလိုသည်များကို သေချာစွာ ရှင်းပြပေးပါမည်ခင်ဗျာ။ ကျွန်တော်တို့ဆိုင်တွင် အဝတ်အထည်နှင့် ဖိနပ်များ ရောင်းချပေးနေပြီး ဈေးနှုန်း၊ ပို့ဆောင်ခနှင့် ငွေလွှဲအချက်အလက်များကို မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။ 😊',
        detectedIntent: 'CLARIFICATION',
      };
    }

    // Price
    if (lower.includes('ဈေး') || lower.includes('ဘယ်လောက်') || lower.includes('price')) {
      return {
        reply: 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ။ ပစ္စည်းအမျိုးအမည်နှင့် size လေး ရွေးချယ်ပေးပါက တိကျသော ဈေးနှုန်းလေး တွက်ချက်ပြောပြပေးပါမည်ခင်ဗျာ။ 😊',
        detectedIntent: 'PRICE_INQUIRY',
      };
    }

    // Greeting
    if (lower.includes('မင်္ဂလာ') || lower.includes('ဟဲလို') || lower === 'hi' || lower === 'hello') {
      return {
        reply: 'မင်္ဂလာပါခင်ဗျာ! ChateChat e-Commerce ဆိုင်မှ နွေးထွေးစွာ ကြိုဆိုပါသည်ခင်ဗျာ။ ပစ္စည်းမှာယူလိုပါက သို့မဟုတ် သိရှိလိုသည်များရှိပါက မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။',
        detectedIntent: 'GREETING',
      };
    }

    return {
      reply: 'ဟုတ်ကဲ့ မင်္ဂလာပါခင်ဗျာ! ပစ္စည်းအမျိုးအမည်၊ ဈေးနှုန်း၊ ငွေလွှဲအကောင့်နှင့် ပို့ဆောင်ခ အချက်အလက်များကို မေးမြန်းနိုင်ပါသည်ခင်ဗျာ။ (အော်ဒါတင်လိုပါက ဖုန်း/လိပ်စာ ပေးပို့နိုင်ပါသည်ခင်ဗျာ)',
      detectedIntent: 'GENERAL_INQUIRY',
    };
  }
}
