import { prisma } from '@chatechat/database';
import { SOCKET_EVENTS } from '@chatechat/shared-types';
import { OutboundService } from '../chat/outbound.service';

export class HandoverService {
  /**
   * Transition conversation from Bot to Human Agent
   */
  public static async requestHumanHandover(
    conversationId: string,
    reason: string = 'Customer requested human agent',
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        organization: true,
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 1. Update status to HUMAN_REQUESTED & UNASSIGNED
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        handoverStatus: 'HUMAN_REQUESTED',
        status: 'UNASSIGNED',
      },
      include: { customer: true },
    });

    // 2. Dispatch polite transition message to customer on social channel
    const handoverBurmeseNotice =
      'ဟုတ်ကဲ့ပါခင်ဗျာ။ လူကြီးမင်းအား အသေးစိတ် ကူညီဆောင်ရွက်ပေးနိုင်ရန် တာဝန်ကျ အရောင်းကိုယ်စားလှယ် (Customer Support Agent) ထံသို့ ချက်ချင်း လွှဲပြောင်းပေးလိုက်ပါပြီခင်ဗျာ။ ခဏလေး စောင့်ဆိုင်းပေးပါရှင့်/ခင်ဗျာ။ 🙏';

    await OutboundService.dispatchOutboundMessage(
      conversationId,
      {
        type: 'SYSTEM',
        name: 'ChateChat System',
      },
      handoverBurmeseNotice,
      'TEXT',
      undefined,
      socketEmitter
    );

    // 3. Emit high-priority urgent alert to all agents in organization
    if (socketEmitter) {
      socketEmitter(SOCKET_EVENTS.HANDOVER_REQUESTED, `org:${conversation.organizationId}`, {
        conversationId: conversation.id,
        customer: conversation.customer,
        channelType: conversation.channelType,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`🚨 Handover triggered for Conv ${conversationId} (${conversation.channelType}): ${reason}`);
    return updated;
  }

  /**
   * Transfer conversation to a specific human agent
   */
  public static async transferToAgent(
    conversationId: string,
    agentId: string,
    agentName: string,
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedAgentId: agentId,
        handoverStatus: 'TRANSFERRED_TO_AGENT',
        status: 'ACTIVE',
      },
      include: {
        assignedAgent: { select: { id: true, name: true } },
        customer: true,
      },
    });

    if (socketEmitter) {
      socketEmitter(SOCKET_EVENTS.CONVERSATION_ASSIGNED, `org:${updated.organizationId}`, {
        conversationId,
        assignedAgent: updated.assignedAgent,
      });
    }

    return updated;
  }

  /**
   * Return conversation back to AI Bot handling
   */
  public static async returnToBot(
    conversationId: string,
    socketEmitter?: (event: string, room: string, data: any) => void
  ) {
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        handoverStatus: 'BOT_HANDLING',
        assignedAgentId: null,
      },
    });

    if (socketEmitter) {
      socketEmitter('conv:handover_status_changed', `conv:${conversationId}`, {
        conversationId,
        handoverStatus: 'BOT_HANDLING',
      });
    }

    return updated;
  }
}
