import { Request, Response, Router } from 'express';
import { prisma } from '@chatechat/database';
import { GeminiService } from './gemini.service';

export const aiRouter = Router();

/**
 * 1. GET /api/v1/ai/config
 * Retrieve AI settings and grounded knowledge
 */
aiRouter.get('/config', async (req: Request, res: Response) => {
  const orgId = (req.query.organizationId as string) || 'default-org-id';

  try {
    const aiConfig = await prisma.aiConfig.findUnique({
      where: { organizationId: orgId },
    });

    const ecommerceConfig = await prisma.ecommerceKnowledge.findUnique({
      where: { organizationId: orgId },
    });

    res.json({
      success: true,
      data: {
        aiConfig: aiConfig || {
          isEnabled: true,
          model: 'gemini-2.5-flash',
          systemPrompt: 'သင်သည် မြန်မာအွန်လိုင်းဆိုင်၏ ဖော်ရွေသော AI အရောင်းလက်ထောက်ဖြစ်သည်။ ဝယ်သူမေးမြန်းသော ပစ္စည်းဈေးနှုန်း၊ ပို့ဆောင်ခနှင့် ငွေလွှဲအချက်အလက်များကို ယဉ်ကျေးသိမ်မွေ့စွာ ဖြေကြားပေးပါ။',
          temperature: 0.2,
          handoverKeywords: ['လူနဲ့ပြောချင်တယ်', 'လူနဲ့', 'အော်ဒါတင်ချင်တယ်', 'ဖုန်းနံပါတ်', 'လွှဲပြီးပါပြီ', 'agent', 'human', 'admin'],
        },
        ecommerceConfig: ecommerceConfig || {
          bankAccounts: {
            kpay: '09987654321 (ဒေါ်စုစုဝင်း)',
            wave: '09987654321 (ဒေါ်စုစုဝင်း)',
            cbbank: '0123456789 (Royal Fashion Co., Ltd.)',
          },
          deliveryRates: {
            yangon: '၂၅၀၀ ကျပ် (၁-၂ ရက်၊ COD ရရှိပါသည်)',
            mandalay: '၃၅၀၀ ကျပ်',
            other: 'ကားဂိတ်ချောပို့ဖြင့် ဂိတ်အရောက် ပို့ဆောင်ပေးပါသည်',
          },
          standardFaq: {
            returnPolicy: 'ပစ္စည်းမှားယွင်းပါက ၃ ရက်အတွင်း မူလအတိုင်း အသစ်လဲလှယ်ပေးပါသည်။',
          },
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. PUT /api/v1/ai/config
 * Update AI assistant configuration
 */
aiRouter.put('/config', async (req: Request, res: Response) => {
  const { organizationId, isEnabled, model, systemPrompt, temperature, handoverKeywords } = req.body;

  try {
    const updated = await prisma.aiConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        isEnabled,
        model,
        systemPrompt,
        temperature,
        handoverKeywords,
      },
      update: {
        isEnabled,
        model,
        systemPrompt,
        temperature,
        handoverKeywords,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. PUT /api/v1/ai/knowledge
 * Update grounded e-commerce knowledge (Bank Accounts, Delivery rates, FAQ)
 */
aiRouter.put('/knowledge', async (req: Request, res: Response) => {
  const { organizationId, bankAccounts, deliveryRates, standardFaq } = req.body;

  try {
    const updated = await prisma.ecommerceKnowledge.upsert({
      where: { organizationId },
      create: {
        organizationId,
        bankAccounts,
        deliveryRates,
        standardFaq,
      },
      update: {
        bankAccounts,
        deliveryRates,
        standardFaq,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. POST /api/v1/ai/test-reply
 * Live test playground for merchant/agent to test Burmese customer inputs
 */
aiRouter.post('/test-reply', async (req: Request, res: Response) => {
  const { messageText, kpay, wave, aya, ygnDeli, mdyDeli, systemPrompt } = req.body;

  try {
    const result = await GeminiService.generateTestReply(messageText, {
      kpay,
      wave,
      aya,
      ygnDeli,
      mdyDeli,
      systemPrompt,
    });

    res.json({
      success: true,
      input: messageText,
      reply: result.reply,
      detectedIntent: result.detectedIntent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
