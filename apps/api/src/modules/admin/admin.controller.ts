import { Request, Response, Router } from 'express';
import { prisma } from '@chatechat/database';
import { PaymentVerificationEngine } from '../financial/payment-verification.service';
import { userStore } from '../auth/user-store.service';
import { auditLogService } from '../audit/audit-log.service';

export const adminRouter = Router();

// Backward compatibility export
export const inMemoryUsers = userStore.getAll();

/**
 * 1. Get All Users / Team Members (Persistent from userStore + DB)
 * If organizationId is provided, filter by shop. If omitted, returns all (Super Admin view).
 */
adminRouter.get('/users', async (req: Request, res: Response) => {
  const { organizationId } = req.query;
  let storeUsers = userStore.getAll();

  if (organizationId && typeof organizationId === 'string' && organizationId.trim()) {
    const cleanOrg = organizationId.trim().toLowerCase();
    storeUsers = storeUsers.filter((u) => {
      const uOrg = (u.organizationId || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();

      if (uOrg && uOrg === cleanOrg) return true;
      if (cleanOrg.includes('yoon') && (uOrg.includes('yoon') || uEmail.includes('yoon') || uName.includes('yoon'))) return true;
      if (cleanOrg.includes('saung') && (uOrg.includes('saung') || uEmail.includes('saung') || uName.includes('saung'))) return true;
      if (cleanOrg.includes('mexes') && (uOrg.includes('mexes') || uEmail.includes('mexes') || uEmail.includes('lynn'))) return true;
      return false;
    });
    return res.json({ success: true, users: storeUsers });
  }

  return res.json({ success: true, users: storeUsers });
});

/**
 * 2. Add / Invite a New Team Member
 */
adminRouter.post('/users', async (req: Request, res: Response) => {
  const { name, email, phone, role = 'AGENT', userType = 'APP', shopName, organizationId, maxConcurrentChats = 10, password = 'Agent!123' } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  const created = userStore.createUser({
    name,
    email,
    phone: phone || '',
    password,
    userType: userType as any,
    shopName,
    organizationId,
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

  const targetUser = userStore.getById(id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (targetUser.role === 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Owner (ပိုင်ရှင်) ၏ စကားဝှက်အား အခြားသူများမှ Reset ချခွင့်မရှိပါခင်ဗျာ',
    });
  }

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
 * 5. Delete User / Team Member with Role-based Access Control & Audit Logging
 */
adminRouter.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reason = (req.body?.reason || req.query?.reason || '').toString().trim() || 'အကြောင်းပြချက် မဖော်ပြထားပါ (No reason provided)';
  const cascadeParam = req.body?.cascade === true || req.body?.cascade === 'true' || req.query?.cascade === 'true';

  // Extract Actor Identity & Privilege
  const actorRole = (req.headers['x-actor-role'] || req.body?.actorRole || req.query?.actorRole || 'SUPER_ADMIN').toString().trim().toUpperCase();
  const actorId = (req.headers['x-actor-id'] || req.body?.actorId || req.query?.actorId || 'admin_root').toString().trim();
  const actorName = (req.headers['x-actor-name'] || req.body?.actorName || req.query?.actorName || 'Super Admin').toString().trim();
  const actorOrgId = (req.headers['x-actor-org'] || req.body?.actorOrg || req.query?.actorOrg || '').toString().trim();

  const targetUser = userStore.getById(id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found (အကောင့် မတွေ့ရှိပါ)' });
  }

  const isTargetAppUser = targetUser.userType === 'APP' || targetUser.role === 'SHOP_OWNER' || targetUser.role === 'SHOP_ASSISTANT' || targetUser.role === 'HELPER';
  const isTargetOwner = targetUser.role === 'OWNER' || targetUser.role === 'SHOP_OWNER';

  // Check if this request is from App User frontend (Shop Owner deleting their own member)
  const isShopOwnerDeletingOwnMember = 
    (actorRole === 'OWNER' || actorRole === 'SHOP_OWNER') && 
    actorOrgId && 
    actorOrgId === targetUser.organizationId;

  if (isTargetAppUser) {
    if (isShopOwnerDeletingOwnMember) {
      // RULE 2: In App User side, only Owner can delete Assistants and Helpers
      if (isTargetOwner) {
        return res.status(403).json({
          success: false,
          error: 'ဆိုင်ပိုင်ရှင် (Shop Owner) အကောင့်အား ဆိုင်အတွင်းမှ ဖယ်ရှားခွင့် မရှိပါ။ Super Admin သာ ဖျက်ခွင့်ရှိပါသည်',
        });
      }
    } else {
      // Deleting from Admin Backend: ONLY Super Admin has privilege!
      if (actorRole !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'App User Accounts များကို ပယ်ဖျက်ရန် Super Admin တွင်သာ အခွင့်အာဏာ (Privilege) ရှိပါသည်ခင်ဗျာ',
        });
      }
    }
  } else {
    // Target is SYSTEM USER: Only Super Admin can delete system users
    if (actorRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'System User Accounts များကို ပယ်ဖျက်ရန် Super Admin တွင်သာ အခွင့်အာဏာ ရှိပါသည်',
      });
    }
    if (targetUser.role === 'SUPER_ADMIN' || targetUser.id === 'user_michael_1') {
      return res.status(403).json({
        success: false,
        error: 'ChateChat Founder & Super Admin အကောင့်အား ဖျက်ခွင့်မရှိပါ',
      });
    }
  }

  // RULE 3: If Super Admin deletes a Shop Owner, cascade delete all team members under that Owner's organization!
  const shouldCascade = (actorRole === 'SUPER_ADMIN' && isTargetOwner) || cascadeParam;

  const result = userStore.deleteUser(id, shouldCascade);
  if (!result.success) {
    return res.status(404).json({ success: false, error: 'User could not be deleted' });
  }

  // RULE 4: Audit Logging for all deletions
  const auditLog = auditLogService.recordDelete({
    action: result.cascadeMembers.length > 0 ? 'CASCADE_DELETE_SHOP_OWNER' : 'DELETE_USER',
    deletedBy: {
      id: actorId,
      name: actorName,
      role: actorRole,
      userType: isShopOwnerDeletingOwnMember ? 'APP' : 'SYSTEM',
    },
    targetUser: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      userType: targetUser.userType,
      shopName: targetUser.shopName,
      organizationId: targetUser.organizationId,
    },
    reason,
    cascadeDeletedMembers: result.cascadeMembers.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
  });

  return res.json({
    success: true,
    message: result.cascadeMembers.length > 0
      ? `ဆိုင်ပိုင်ရှင် (${targetUser.name}) နှင့် ၎င်းအောက်ရှိ ဝန်ထမ်း (${result.cascadeMembers.length} ဦး) အားလုံးကို အောင်မြင်စွာ ပယ်ဖျက်ပြီးပါပြီ`
      : `${targetUser.name} အား စာရင်းမှ အောင်မြင်စွာ ပယ်ဖျက်ပြီးပါပြီ`,
    auditLog,
    cascadeDeletedCount: result.cascadeMembers.length,
    cascadeDeletedMembers: result.cascadeMembers,
  });
});

/**
 * 5.1 Get Deletion Audit Logs
 */
adminRouter.get('/delete-logs', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    logs: auditLogService.getDeleteLogs(),
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
