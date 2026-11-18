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

  // Native Web Audio chime for incoming messages
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
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

    socket.on(SOCKET_EVENTS.INCOMING_MESSAGE, (data) => {
      playChime();
      if (onIncomingMessage) onIncomingMessage(data);
    });

    socket.on(SOCKET_EVENTS.OUTGOING_MESSAGE, (data) => {
      if (onOutgoingMessage) onOutgoingMessage(data);
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_ASSIGNED, (data) => {
      if (onConversationAssigned) onConversationAssigned(data);
    });

    socket.on(SOCKET_EVENTS.CONVERSATION_RESOLVED, (data) => {
      if (onConversationResolved) onConversationResolved(data);
    });

    return () => {
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
