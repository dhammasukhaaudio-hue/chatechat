import { io, Socket } from 'socket.io-client';

class MobileSocketService {
  private socket: Socket | null = null;
  private serverUrl: string = 'https://chatechat.onrender.com';

  public connect(url: string, agentId: string, orgId: string, onConnect?: () => void) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.serverUrl = url;
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'], // Fallback polling for Myanmar cellular / firewalls
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('📱 Android Mobile connected to ChateChat backend:', this.socket?.id);
      this.socket?.emit('agent:auth', {
        agentId,
        organizationId: orgId,
      });
      if (onConnect) onConnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📱 Mobile socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ Mobile socket connection error:', error.message);
    });
  }

  public onIncomingMessage(callback: (data: any) => void) {
    this.socket?.on('chat:incoming_message', callback);
    this.socket?.on('INCOMING_MESSAGE', callback);
  }

  public onOutgoingMessage(callback: (data: any) => void) {
    this.socket?.on('chat:outgoing_message', callback);
  }

  public onHandoverRequested(callback: (data: any) => void) {
    this.socket?.on('conv:handover_requested', callback);
  }

  public joinConversation(convId: string) {
    this.socket?.emit('agent:join_conv', { conversationId: convId });
  }

  public leaveConversation(convId: string) {
    this.socket?.emit('agent:leave_conv', { conversationId: convId });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const mobileSocket = new MobileSocketService();
