import { io, Socket } from 'socket.io-client';

class MobileSocketService {
  private socket: Socket | null = null;
  private serverUrl: string = 'http://10.0.2.2:4000'; // Default Android Emulator to Host loopback

  public connect(url: string, agentId: string, orgId: string, onConnect?: () => void) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.serverUrl = url;
    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
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
