import { prisma } from '@chatechat/database';
import { SUBSCRIPTION_TIERS, PlanTier, ChannelType } from '@chatechat/shared-types';

export class QuotaExceededError extends Error {
  public maxAllowed: number;
  public currentActive: number;

  constructor(message: string, maxAllowed: number, currentActive: number) {
    super(message);
    this.name = 'QuotaExceededError';
    this.maxAllowed = maxAllowed;
    this.currentActive = currentActive;
  }
}

export class SubscriptionInactiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionInactiveError';
  }
}

export class SubscriptionQuotaService {
  /**
   * Check if organization has an active subscription and retrieve their quota
   */
  public static async getSubscriptionDetails(organizationId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    if (!sub) {
      throw new SubscriptionInactiveError(
        'Subscription not found. Please choose a plan (1 Channel: 5,000 MMK, 2 Channels: 10,000 MMK, 3 Channels: 12,000 MMK).'
      );
    }

    const isExpired = new Date() > new Date(sub.endDate);
    if (sub.status !== 'ACTIVE' || isExpired) {
      throw new SubscriptionInactiveError(
        `Your subscription is currently ${isExpired ? 'EXPIRED' : sub.status}. Please renew your plan.`
      );
    }

    const planConfig = SUBSCRIPTION_TIERS[sub.tier as PlanTier];

    // Count currently active channel bindings
    const activeChannelsCount = await prisma.channelConnection.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    return {
      subscription: sub,
      planConfig,
      maxChannels: sub.maxChannels,
      activeChannelsCount,
      remainingSlots: Math.max(0, sub.maxChannels - activeChannelsCount),
    };
  }

  /**
   * Validate whether a new channel can be activated.
   * Throws QuotaExceededError if limit is reached.
   */
  public static async validateChannelActivation(organizationId: string, channelIdToActivate?: string): Promise<void> {
    const details = await this.getSubscriptionDetails(organizationId);

    // If we are re-activating an existing channel that's already active, it's allowed
    if (channelIdToActivate) {
      const targetChannel = await prisma.channelConnection.findUnique({
        where: { id: channelIdToActivate },
      });
      if (targetChannel && targetChannel.isActive) {
        return; // Already active, no new slot consumed
      }
    }

    if (details.activeChannelsCount >= details.maxChannels) {
      throw new QuotaExceededError(
        `Channel quota exceeded! Your current plan (${details.planConfig.name}) allows up to ${details.maxChannels} active channel(s). You currently have ${details.activeChannelsCount} active channels. Please upgrade your subscription to connect more channels.`,
        details.maxChannels,
        details.activeChannelsCount
      );
    }
  }

  /**
   * Safely bind/activate a channel within an atomic transaction
   */
  public static async activateChannel(organizationId: string, channelId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch subscription and lock checks
      const sub = await tx.subscription.findUnique({
        where: { organizationId },
      });

      if (!sub || sub.status !== 'ACTIVE' || new Date() > new Date(sub.endDate)) {
        throw new SubscriptionInactiveError('Cannot activate channel: Active subscription required.');
      }

      // 2. Count active channels
      const activeCount = await tx.channelConnection.count({
        where: { organizationId, isActive: true, NOT: { id: channelId } },
      });

      if (activeCount >= sub.maxChannels) {
        throw new QuotaExceededError(
          `Cannot activate channel: You have reached the maximum quota of ${sub.maxChannels} active channel(s).`,
          sub.maxChannels,
          activeCount
        );
      }

      // 3. Mark channel as active
      return await tx.channelConnection.update({
        where: { id: channelId },
        data: { isActive: true },
      });
    });
  }

  /**
   * Deactivate a channel connection (frees up a quota slot)
   */
  public static async deactivateChannel(organizationId: string, channelId: string) {
    return await prisma.channelConnection.update({
      where: { id: channelId, organizationId },
      data: { isActive: false },
    });
  }
}
