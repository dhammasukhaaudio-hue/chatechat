import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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

// Health check endpoint for Render / UptimeRobot Keep-Alive
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ChateChat Fullstack Platform (Frontend & Backend)',
    timestamp: new Date().toISOString(),
  });
});

// Super Admin & Payment Engine Back-Office Portal
app.get(['/admin', '/admin-login', '/super-admin', '/admin/portal'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(getAdminPortalHtml());
});

// Register Webhook Pipeline, Chat REST APIs, Admin & Auth Controllers
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/financial', financialRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/auth', authRouter);

// =========================================================================
// Mobile Android APK Download Service (Capacitor Standalone APK)
// =========================================================================
app.get(['/download/apk', '/app.apk', '/download/chatechat.apk'], (_req, res) => {
  const possiblePaths = [
    path.resolve(__dirname, '../static/releases/ChateChat.apk'),
    path.resolve(__dirname, '../../api/static/releases/ChateChat.apk'),
    path.resolve(__dirname, '../../dashboard/android/app/build/outputs/apk/debug/app-debug.apk'),
    path.resolve(__dirname, '../../dashboard/android/app/build/outputs/apk/release/app-release.apk'),
    path.resolve(__dirname, '../../../releases/ChateChat.apk'),
  ];

  for (const apkPath of possiblePaths) {
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      return res.download(apkPath, 'ChateChat.apk', (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ status: 'error', message: 'Download error' });
        }
      });
    }
  }

  // Fallback response with friendly guidance
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="my">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Download ChateChat Android APK</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; text-align: center; }
        .card { max-width: 480px; margin: 40px auto; background: #1e293b; padding: 32px; border-radius: 24px; border: 1px solid #334155; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>📱 ChateChat (ချိတ်ချက်) Android App</h2>
        <p>Capacitor Android APK ထုတ်ယူခြင်း စနစ်ကို အောင်မြင်စွာ တပ်ဆင်ထားပြီး ဖြစ်ပါသည်။</p>
        <p>မိမိစက်တွင် APK တိုက်ရိုက် ထုတ်ယူလိုပါက Terminal တွင် Run ပါ:</p>
        <code style="background: #0f172a; display: block; padding: 12px; border-radius: 8px; margin: 16px 0; color: #38bdf8; font-family: monospace;">
          cd apps/dashboard/android<br>
          .\\gradlew.bat assembleDebug
        </code>
        <a href="/" class="btn">🌐 Web App သို့ ဝင်မည်</a>
      </div>
    </body>
    </html>
  `);
});

// Frontend Dashboard: Serve Next.js Static Export on root and all client routes
const DASHBOARD_OUT = path.resolve(__dirname, '../../dashboard/out');
if (fs.existsSync(DASHBOARD_OUT)) {
  console.log(`📦 Serving static dashboard from ${DASHBOARD_OUT}`);
  app.use(express.static(DASHBOARD_OUT));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/admin')) {
      return next();
    }
    const indexPath = path.join(DASHBOARD_OUT, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
} else {
  // Fallback if static dashboard not yet generated
  app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(getAdminPortalHtml());
  });
}

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
        await telegramPollingService.sendMessage(chatId, data.content, data.agentName);
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
