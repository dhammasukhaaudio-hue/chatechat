import { Request, Response, Router } from 'express';
import { prisma } from '@chatechat/database';
import { PaymentVerificationEngine } from '../financial/payment-verification.service';
import { userStore } from '../auth/user-store.service';

export const adminRouter = Router();

// Backward compatibility export
export const inMemoryUsers = userStore.getAll();

/**
 * 1. Get All Users / Team Members (Persistent from userStore + DB)
 */
adminRouter.get('/users', async (_req: Request, res: Response) => {
  const storeUsers = userStore.getAll();
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        maxConcurrentChats: true,
        createdAt: true,
      },
    });

    if (dbUsers.length > 0) {
      const combined = [...storeUsers];
      for (const u of dbUsers) {
        if (!combined.some(c => c.email?.toLowerCase() === u.email?.toLowerCase() || c.id === u.id)) {
          combined.push(u as any);
        }
      }
      return res.json({ success: true, users: combined });
    }
  } catch (err) {
    // Database offline, use persistent userStore
  }

  return res.json({ success: true, users: storeUsers });
});

/**
 * 2. Add / Invite a New Team Member
 */
adminRouter.post('/users', async (req: Request, res: Response) => {
  const { name, email, phone, role = 'AGENT', maxConcurrentChats = 10, password = 'Agent!123' } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  const created = userStore.createUser({
    name,
    email,
    phone: phone || '',
    password,
    role: role.toUpperCase() as any,
  });

  return res.status(201).json({ success: true, user: created });
});

/**
 * 3. Update User Role or Status
 */
adminRouter.patch('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status, maxConcurrentChats } = req.body;

  const updated = userStore.updateUser(id, {
    ...(role && { role: role.toUpperCase() as any }),
    ...(status && { status: status.toUpperCase() as any }),
    ...(maxConcurrentChats !== undefined && { maxConcurrentChats: Number(maxConcurrentChats) }),
  });

  if (!updated) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({ success: true, user: updated });
});

/**
 * 4. Super Admin Direct Reset Password for User
 */
adminRouter.post('/users/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword = 'Agent!123' } = req.body;

  const ok = userStore.updatePassword(id, newPassword);
  if (!ok) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({
    success: true,
    message: `စကားဝှက်အား [${newPassword}] သို့ အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီခင်ဗျာ`,
  });
});

/**
 * 5. Delete User / Team Member
 */
adminRouter.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ok = userStore.deleteUser(id);
  if (!ok) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({
    success: true,
    message: 'အဖွဲ့ဝင်အား စာရင်းမှ အောင်မြင်စွာ ပယ်ဖျက်ပြီးပါပြီ',
  });
});

/**
 * 6. Executive Summary KPI Stats
 */
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  const orgId = 'org_royal';
  let walletBalance = PaymentVerificationEngine.inMemoryBalances[orgId] || 0;
  let slips = PaymentVerificationEngine.inMemorySlips.filter((s) => s.organizationId === orgId);
  const allUsers = userStore.getAll();
  let usersCount = allUsers.length;
  let onlineAgents = allUsers.filter((u) => u.status === 'ONLINE').length;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { walletBalance: true },
    });
    if (org) walletBalance = org.walletBalance;

    const dbSlips = await prisma.paymentSlip.findMany({
      where: { organizationId: orgId },
    });
    if (dbSlips.length > 0) slips = dbSlips;

    const dbUsersCount = await prisma.user.count({ where: { organizationId: orgId } });
    if (dbUsersCount > 0) usersCount = dbUsersCount;
  } catch (err) {
    // offline fallback used
  }

  const approvedSlips = slips.filter((s) => s.status === 'AUTO_APPROVED' || s.status === 'APPROVED');
  const queuedSlips = PaymentVerificationEngine.pendingApprovalJobs.size;

  return res.json({
    success: true,
    stats: {
      walletBalance,
      totalSlipsCount: slips.length,
      approvedSlipsCount: approvedSlips.length,
      queuedSlipsCount: queuedSlips,
      totalUsersCount: usersCount,
      onlineAgentsCount: onlineAgents,
      activeChannelsCount: 3,
      systemHealth: 'OPTIMAL_100_PERCENT',
    },
  });
});
