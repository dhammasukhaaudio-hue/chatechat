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
