import { prisma } from '@chatechat/database';
import { PlanTier, SUBSCRIPTION_TIERS, PaymentMethod } from '@chatechat/shared-types';

export class SubscriptionService {
  /**
   * Create or Upgrade an Organization Subscription
   */
  public static async createOrUpgradeSubscription(
    organizationId: string,
    tier: PlanTier,
    durationMonths: number = 1
  ) {
    const planConfig = SUBSCRIPTION_TIERS[tier];
    const totalAmount = planConfig.priceMmk * durationMonths;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30 * durationMonths);

    const subscription = await prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        tier,
        priceMmk: planConfig.priceMmk,
        maxChannels: planConfig.maxChannels,
        status: 'ACTIVE',
        startDate,
        endDate,
      },
      update: {
        tier,
        priceMmk: planConfig.priceMmk,
        maxChannels: planConfig.maxChannels,
        status: 'ACTIVE',
        endDate,
      },
    });

    return { subscription, totalAmount };
  }

  /**
   * Submit KPay / WavePay Payment Slip for Manual Verification
   */
  public static async submitPaymentSlip(
    organizationId: string,
    data: {
      amountMmk: number;
      paymentMethod: PaymentMethod;
      transactionId?: string;
      slipImageUrl: string;
      notes?: string;
    }
  ) {
    return await prisma.paymentSlip.create({
      data: {
        organizationId,
        amountMmk: data.amountMmk,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        slipImageUrl: data.slipImageUrl,
        notes: data.notes,
        status: 'PENDING',
      },
    });
  }

  /**
   * Admin approves payment slip and activates subscription
   */
  public static async verifyPaymentSlip(slipId: string, adminUserId: string, approved: boolean, tier: PlanTier) {
    const slip = await prisma.paymentSlip.findUnique({ where: { id: slipId } });
    if (!slip) throw new Error('Slip not found');

    if (approved) {
      await prisma.$transaction([
        prisma.paymentSlip.update({
          where: { id: slipId },
          data: {
            status: 'APPROVED',
            verifiedBy: adminUserId,
            verifiedAt: new Date(),
          },
        }),
        prisma.subscription.upsert({
          where: { organizationId: slip.organizationId },
          create: {
            organizationId: slip.organizationId,
            tier,
            priceMmk: SUBSCRIPTION_TIERS[tier].priceMmk,
            maxChannels: SUBSCRIPTION_TIERS[tier].maxChannels,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {
            tier,
            priceMmk: SUBSCRIPTION_TIERS[tier].priceMmk,
            maxChannels: SUBSCRIPTION_TIERS[tier].maxChannels,
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);
    } else {
      await prisma.paymentSlip.update({
        where: { id: slipId },
        data: {
          status: 'REJECTED',
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
        },
      });
    }
  }
}
