import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@chatechat/shared-types';
import { getApiBaseUrl } from '../lib/api-config';

interface UseSocketProps {
  organizationId: string;
  agentId: string;
  onIncomingMessage?: (data: any) => void;
  onOutgoingMessage?: (data: any) => void;
  onConversationAssigned?: (data: any) => void;
  onConversationResolved?: (data: any) => void;
}

export function useSocket({
  organizationId,
  agentId,
  onIncomingMessage,
  onOutgoingMessage,
  onConversationAssigned,
  onConversationResolved,
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  const onIncomingMessageRef = useRef(onIncomingMessage);
  onIncomingMessageRef.current = onIncomingMessage;

  const onOutgoingMessageRef = useRef(onOutgoingMessage);
  onOutgoingMessageRef.current = onOutgoingMessage;

  const onConversationAssignedRef = useRef(onConversationAssigned);
  onConversationAssignedRef.current = onConversationAssigned;

  const onConversationResolvedRef = useRef(onConversationResolved);
  onConversationResolvedRef.current = onConversationResolved;

  // Native Web Audio chime for incoming messages
  const playChime = () => {
    try {
      if (typeof window === 'undefined') return;
      if (typeof (window as any).playAlertChime === 'function') {
        (window as any).playAlertChime();
        return;
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([120, 60, 140]); } catch {}
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy
    }
  };

  useEffect(() => {
    const socketUrl = getApiBaseUrl();
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to ChateChat Real-Time Server');
      socket.emit(SOCKET_EVENTS.AGENT_AUTH, { organizationId, agentId });
    });

    const handleIncoming = (data: any) => {
      console.log('⚡ [SOCKET EVENT RECEIVED] Inbound customer message:', data);
      playChime();
      if (onIncomingMessageRef.current) onIncomingMessageRef.current(data);
    };

    const handleOutgoing = (data: any) => {
      console.log('⚡ [SOCKET EVENT RECEIVED] Outbound message:', data);
      if (onOutgoingMessageRef.current) onOutgoingMessageRef.current(data);
    };

    // Clean single-listener registrations (no duplicates)
    socket.on('chat:incoming_message', handleIncoming);
    socket.on('chat:outgoing_message', handleOutgoing);

    socket.on(SOCKET_EVENTS.CONVERSATION_ASSIGNED, (data) => {
      if (onConversationAssignedRef.current) onConversationAssignedRef.current(data);
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_RESOLVED, (data) => {
      if (onConversationResolvedRef.current) onConversationResolvedRef.current(data);
    });

    return () => {
      socket.off('chat:incoming_message', handleIncoming);
      socket.off('chat:outgoing_message', handleOutgoing);
      socket.off(SOCKET_EVENTS.CONVERSATION_ASSIGNED);
      socket.off(SOCKET_EVENTS.CONVERSATION_RESOLVED);
      socket.disconnect();
    };
  }, [organizationId, agentId]);

  const joinConversation = (conversationId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.AGENT_JOIN_CONVERSATION, { conversationId });
  };

  const leaveConversation = (conversationId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.AGENT_LEAVE_CONVERSATION, { conversationId });
  };

  const sendOutgoingMessage = (payload: {
    conversationId: string;
    agentId: string;
    agentName: string;
    content: string;
    mediaUrl?: string;
    clientMessageId?: string;
  }) => {
    socketRef.current?.emit(SOCKET_EVENTS.OUTGOING_MESSAGE, payload);
  };

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendOutgoingMessage,
  };
}
