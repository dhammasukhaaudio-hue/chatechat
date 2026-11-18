import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { webhookRouter } from './modules/webhooks/webhook.controller';
import { chatRouter } from './modules/chat/chat.controller';
import { aiRouter } from './modules/ai/ai.controller';
import { financialRouter } from './modules/financial/financial.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { authRouter } from './modules/auth/auth.controller';
import { getAdminPortalHtml } from './modules/admin/admin-view';
import { SOCKET_EVENTS } from '@chatechat/shared-types';
import { OutboundService } from './modules/chat/outbound.service';
import { telegramPollingService } from './modules/webhooks/telegram-polling.service';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware with rawBody preservation for HMAC signature verification
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check endpoint for Render / Cloud Orchestrators
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'chatechat-api', timestamp: new Date().toISOString() });
});

// Attach socket emitter and io instance to request object for controllers
app.use((req: any, _res, next) => {
  req.io = io;
  req.socketEmitter = (event: string, room: string, data: any) => {
    io.to(room).emit(event, data);
  };
  next();
});

// Root landing & Super Admin Back-Office Portal
app.get(['/', '/admin', '/admin-login', '/dashboard'], (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html')) {
    return res.json({
      status: 'online',
      service: 'ChateChat API, Super Admin & Real-time Engine',
      version: '1.0.0',
      adminPortal: 'http://localhost:4000',
      agentDashboard: 'http://localhost:3000',
      endpoints: {
        admin: '/api/v1/admin',
        financial: '/api/v1/financial',
        webhooks: '/api/v1/webhooks',
        chat: '/api/v1/chat',
        ai: '/api/v1/ai',
        health: '/health',
      },
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(getAdminPortalHtml());
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ChateChat API & Multi-Channel Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Register Webhook Pipeline, Chat REST APIs, Admin & Auth Controllers
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/financial', financialRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/auth', authRouter);

// Socket.io Real-time Event Management
io.on('connection', (socket) => {
  console.log(`⚡ Client connected to socket: ${socket.id}`);

  // Agent joins organization and conversation rooms
  socket.on(SOCKET_EVENTS.AGENT_AUTH, ({ organizationId, agentId }: { organizationId: string; agentId: string }) => {
    socket.join(`org:${organizationId}`);
    socket.join(`agent:${agentId}`);
    console.log(`👨‍💻 Agent ${agentId} authenticated into org:${organizationId}`);
  });

  socket.on(SOCKET_EVENTS.AGENT_JOIN_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on(SOCKET_EVENTS.AGENT_LEAVE_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
    socket.leave(`conv:${conversationId}`);
  });

  // Outbound message dispatched by Agent in Dashboard
  socket.on(
    SOCKET_EVENTS.OUTGOING_MESSAGE,
    async (data: {
      conversationId: string;
      agentId: string;
      agentName: string;
      content: string;
      mediaUrl?: string;
    }) => {
      // 1. Direct Telegram dispatch if conversation is from Telegram
      if (data.conversationId.startsWith('conv_tg_')) {
        const chatId = data.conversationId.replace('conv_tg_', '');
        await telegramPollingService.sendMessage(chatId, data.content);
      }

      // 2. Dispatch via OutboundService with database persistence
      try {
        await OutboundService.dispatchOutboundMessage(
          data.conversationId,
          {
            type: 'AGENT',
            id: data.agentId,
            name: data.agentName,
          },
          data.content,
          'TEXT',
          data.mediaUrl,
          (event, room, payload) => io.to(room).emit(event, payload)
        );
      } catch (err: any) {
        // In-memory / development fallback: broadcast to other agents
        io.to(`org:org_royal`).emit(SOCKET_EVENTS.OUTGOING_MESSAGE, {
          message: {
            id: `msg_agent_${Date.now()}`,
            conversationId: data.conversationId,
            senderType: 'AGENT',
            senderName: data.agentName,
            content: data.content,
            createdAt: new Date().toISOString(),
          },
          conversationId: data.conversationId,
        });
      }
    }
  );

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 ChateChat (ချိတ်ချက်) Backend running on http://localhost:${PORT}`);
  console.log(`📡 Inbound Webhooks: http://localhost:${PORT}/api/v1/webhooks`);
  console.log(`💬 Chat & Unified Inbox REST: http://localhost:${PORT}/api/v1/chat`);
  console.log(`🤖 Gemini Burmese AI Assistant: http://localhost:${PORT}/api/v1/ai`);

  // Start / auto-resume 24/7 Telegram Long Polling
  telegramPollingService.autoResume(io);
});
