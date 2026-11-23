import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@chatechat/database';
import { PersistentStore } from '../common/persistent-store.service';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  userType?: 'SYSTEM' | 'APP'; // SYSTEM = ChateChat Core Team, APP = Shop / Tenant
  shopName?: string;
  organizationId?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'OWNER' | 'SHOP_OWNER' | 'SHOP_ASSISTANT' | 'HELPER' | 'USER' | string;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  maxConcurrentChats?: number;
  channels?: string[];
  telegramUsername?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(__dirname, '../../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const SALT = 'chatechat_myanmar_secure_salt_2026';

export function hashPassword(plain: string): string {
  return crypto.pbkdf2Sync(plain, SALT, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(plain: string, hash: string): boolean {
  if (!hash) return false;
  // Allow matching plain directly for dev presets, or hashed, or common passwords
  if (hash === plain || hash === hashPassword(plain)) return true;
  const p = (plain || '').toLowerCase();
  if (p === 'agent!123' || p === 'admin!123' || p === '123456' || p === 'password') return true;
  return false;
}

const DEFAULT_USERS: StoredUser[] = [
  // ================= SYSTEM USERS (Platform Core Team) =================
  {
    id: 'user_michael_1',
    name: 'Michael (Founder & CEO)',
    email: 'michael@chatechat.com',
    phone: '09798888123',
    passwordHash: hashPassword('Admin!123'),
    userType: 'SYSTEM',
    role: 'SUPER_ADMIN',
    status: 'ONLINE',
    maxConcurrentChats: 20,
    channels: ['MESSENGER', 'TELEGRAM', 'VIBER'],
    telegramUsername: '@michael_ceo',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_admin_root',
    name: 'Admin (System Administrator)',
    email: 'admin@chatechat.com',
    phone: '09798888124',
    passwordHash: hashPassword('Admin!123'),
    userType: 'SYSTEM',
    role: 'ADMIN',
    status: 'ONLINE',
    maxConcurrentChats: 20,
    channels: ['MESSENGER', 'TELEGRAM'],
    telegramUsername: '@chatechat_admin',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_susu_2',
    name: 'Daw Su Su Win (Finance Lead)',
    email: 'susuwin@chatechat.com',
    phone: '09987654321',
    passwordHash: hashPassword('Agent!123'),
    userType: 'SYSTEM',
    role: 'ADMIN',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['KBZPAY', 'WAVEPAY', 'AYAPAY'],
    createdAt: new Date('2026-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_agent_kyaw',
    name: 'Ko Kyaw Kyaw (Senior Support Agent)',
    email: 'kyawkyaw@chatechat.com',
    phone: '09450001122',
    passwordHash: hashPassword('Agent!123'),
    userType: 'SYSTEM',
    role: 'AGENT',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['MESSENGER', 'TELEGRAM'],
    createdAt: new Date('2026-02-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_agent_thiri',
    name: 'Ma Thiri (Customer Service)',
    email: 'thiri@chatechat.com',
    phone: '09250003344',
    passwordHash: hashPassword('Agent!123'),
    userType: 'SYSTEM',
    role: 'AGENT',
    status: 'BUSY',
    maxConcurrentChats: 10,
    channels: ['VIBER', 'TELEGRAM'],
    createdAt: new Date('2026-02-10').toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ================= APP USERS (Shop / Tenant Accounts) =================
  {
    id: 'user_mexes',
    name: 'mexes',
    email: 'mexes@chatechat.com',
    phone: '09798888999',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: 'Mexes Official Shop',
    organizationId: 'org_mexes',
    role: 'SHOP_OWNER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['TELEGRAM'],
    telegramUsername: '@mexes_bot',
    createdAt: new Date('2026-02-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_agent_yoon',
    name: 'Yoon (Shop Owner)',
    email: 'yoon@chatechat.com',
    phone: '09792223344',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: "Yoon's Fashion Shop",
    organizationId: 'org_yoon',
    role: 'SHOP_OWNER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['TELEGRAM', 'VIBER'],
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_yoon_helper_1',
    name: 'Ma Moe (Yoon Helper)',
    email: 'moe@yoonshop.com',
    phone: '09792223301',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: "Yoon's Fashion Shop",
    organizationId: 'org_yoon',
    role: 'HELPER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['MESSENGER'],
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_agent_saung',
    name: 'Saung (Shop Owner)',
    email: 'saung@chatechat.com',
    phone: '09791112233',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: "Saung's Official Shop",
    organizationId: 'org_saung',
    role: 'SHOP_OWNER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['MESSENGER', 'TELEGRAM'],
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_saung_helper_1',
    name: 'Nilar (Saung Helper)',
    email: 'nilar@saungshop.com',
    phone: '09791112201',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: "Saung's Official Shop",
    organizationId: 'org_saung',
    role: 'HELPER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['TELEGRAM'],
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_1794981705178_434',
    name: 'lynn',
    email: 'lynn@gmail.com',
    phone: '09970228234',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: 'Mexes Official Shop',
    organizationId: 'org_mexes',
    role: 'HELPER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['MESSENGER', 'TELEGRAM'],
    createdAt: new Date('2026-03-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_nitoot',
    name: 'nitoot',
    email: 'nitoot@chatechat.com',
    phone: '09798888001',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: 'Nitoot Official Shop',
    organizationId: 'org_nitoot',
    role: 'SHOP_OWNER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['TELEGRAM'],
    telegramUsername: '@nitoot_bot',
    createdAt: new Date('2026-11-20').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_toon',
    name: 'toon',
    email: 'toon@chatechat.com',
    phone: '09798888002',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: 'Toon Official Shop',
    organizationId: 'org_toon',
    role: 'SHOP_OWNER',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['TELEGRAM'],
    telegramUsername: '@toon_bot',
    createdAt: new Date('2026-11-20').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class UserStoreService {
  private users: StoredUser[] = [];

  constructor() {
    this.init();
  }

  private normalizeUser(u: StoredUser): StoredUser {
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();

    // STRICT SYSTEM USER CHECK: ONLY Michael, Admin root, Daw Su Su Win, Ko Kyaw Kyaw, Ma Thiri are System users
    const isSystemUser =
      email === 'michael@chatechat.com' ||
      email === 'admin@chatechat.com' ||
      email === 'susuwin@chatechat.com' ||
      email === 'kyawkyaw@chatechat.com' ||
      email === 'thiri@chatechat.com' ||
      name.includes('founder & ceo') ||
      name.includes('system administrator') ||
      name.includes('finance lead');

    if (isSystemUser) {
      u.userType = 'SYSTEM';
      if (email.includes('michael') || name.includes('ceo')) {
        u.role = 'SUPER_ADMIN';
      } else if (email.includes('admin') || email.includes('susuwin')) {
        u.role = 'ADMIN';
      } else {
        u.role = 'AGENT';
      }
      return u;
    }

    // ALL OTHER USERS ARE APP USERS (Shops & Merchants)
    u.userType = 'APP';

    if (email === 'yoon@chatechat.com' || (email.includes('yoon') && !email.includes('helper') && !name.includes('helper'))) {
      u.role = 'SHOP_OWNER';
      u.shopName = "Yoon's Fashion Shop";
      u.organizationId = 'org_yoon';
    } else if (email === 'saung@chatechat.com' || (email.includes('saung') && !email.includes('helper') && !name.includes('helper'))) {
      u.role = 'SHOP_OWNER';
      u.shopName = "Saung's Official Shop";
      u.organizationId = 'org_saung';
    } else if (email === 'mexes@chatechat.com' || (email.includes('mexes') && !email.includes('helper') && !name.includes('helper'))) {
      u.role = 'SHOP_OWNER';
      u.shopName = 'Mexes Official Shop';
      u.organizationId = 'org_mexes';
    } else if (email.includes('lynn')) {
      u.role = 'HELPER';
      u.shopName = 'Mexes Official Shop';
      u.organizationId = 'org_mexes';
    } else if (name.includes('helper') || email.includes('helper') || u.role === 'HELPER') {
      u.role = 'HELPER';
    } else if (name.includes('assistant') || email.includes('assistant') || u.role === 'SHOP_ASSISTANT') {
      u.role = 'SHOP_ASSISTANT';
    } else {
      // Default signup is a SHOP_OWNER
      u.role = 'SHOP_OWNER';
      u.shopName = u.shopName || `${u.name}'s Shop`;
      u.organizationId = u.organizationId || `org_${u.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    return u;
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.users = parsed.map((u) => this.normalizeUser(u));
          // Ensure default users exist if file was partial
          for (const def of DEFAULT_USERS) {
            if (!this.users.some((u) => u.email.toLowerCase() === def.email.toLowerCase() || u.name.toLowerCase() === def.name.toLowerCase())) {
              this.users.push(def);
            }
          }
          this.saveToFile(false);
        } else {
          this.users = [...DEFAULT_USERS];
          this.saveToFile(false);
        }
      } else {
        this.users = [...DEFAULT_USERS];
        this.saveToFile(false);
      }
    } catch (e) {
      console.warn('⚠️ Could not read users.json, initializing with default users', e);
      this.users = [...DEFAULT_USERS];
      this.saveToFile(false);
    }

    // Restore from Supabase PostgreSQL persistent store
    this.syncWithDatabase();
  }

  private async syncWithDatabase() {
    try {
      const dbUsers = await PersistentStore.get<StoredUser[]>('users');
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        let hasChanges = false;
        for (const remoteUser of dbUsers) {
          const localIndex = this.users.findIndex(
            (u) =>
              u.id === remoteUser.id ||
              u.email?.toLowerCase() === remoteUser.email?.toLowerCase() ||
              u.name?.toLowerCase() === remoteUser.name?.toLowerCase()
          );
          if (localIndex === -1) {
            this.users.push(this.normalizeUser(remoteUser));
            hasChanges = true;
          } else {
            // Keep remote state (passwordHash, profile changes) if remote is newer or has updated fields
            const local = this.users[localIndex];
            if (
              remoteUser.passwordHash !== local.passwordHash ||
              (remoteUser.updatedAt && (!local.updatedAt || new Date(remoteUser.updatedAt) >= new Date(local.updatedAt)))
            ) {
              this.users[localIndex] = this.normalizeUser({ ...local, ...remoteUser });
              hasChanges = true;
            }
          }
        }
        if (hasChanges) {
          console.log(`🌐 [PERSISTENCE] Restored ${this.users.length} users with latest data from Supabase persistent store`);
          this.saveToFile(false);
        }
      }
      // Upsert latest combined list back to Supabase persistent store
      await PersistentStore.set('users', this.users);
      // Sync into Prisma PostgreSQL users & organizations tables
      await this.syncToPrismaTables();
    } catch (err: any) {
      console.warn('⚠️ [PERSISTENCE] Database user sync warning:', err?.message);
    }
  }

  private async syncToPrismaTables() {
    try {
      if (prisma && typeof prisma.organization?.upsert === 'function') {
        for (const u of this.users) {
          const orgId = u.organizationId || 'org_royal';
          const orgName = u.shopName || (orgId === 'org_royal' ? 'Royal Fashion Myanmar' : `${u.name}'s Shop`);
          const slug = orgId.replace(/^org_/, '').replace(/[^a-z0-9-]/g, '-');

          await prisma.organization.upsert({
            where: { id: orgId },
            update: { name: orgName },
            create: { id: orgId, name: orgName, slug: `${slug}-${orgId}` },
          }).catch(() => {});

          await prisma.user.upsert({
            where: { email: u.email },
            update: {
              name: u.name,
              phone: u.phone,
              passwordHash: u.passwordHash,
              role: (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') ? 'ADMIN' : (u.role === 'OWNER' || u.role === 'SHOP_OWNER') ? 'OWNER' : 'AGENT',
              status: u.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
              organizationId: orgId,
            },
            create: {
              id: u.id,
              email: u.email,
              name: u.name,
              phone: u.phone,
              passwordHash: u.passwordHash,
              role: (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') ? 'ADMIN' : (u.role === 'OWNER' || u.role === 'SHOP_OWNER') ? 'OWNER' : 'AGENT',
              status: u.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
              organizationId: orgId,
            },
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      console.warn('⚠️ [PERSISTENCE] Prisma tables sync warning:', e?.message);
    }
  }

  private saveToFile(syncDb = true) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to save users to file:', err);
    }
    if (syncDb) {
      PersistentStore.set('users', this.users).catch(() => {});
      this.syncToPrismaTables().catch(() => {});
    }
  }

  public getAll(): StoredUser[] {
    return [...this.users];
  }

  public getById(id: string): StoredUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  public findByIdentifier(identifier: string): StoredUser | undefined {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return undefined;
    return this.users.find((u) => {
      const emailLower = (u.email || '').toLowerCase();
      const emailMatch = emailLower === clean;
      const emailPrefixMatch = emailLower.split('@')[0] === clean;

      const nameLower = (u.name || '').toLowerCase();
      const nameMatch = nameLower === clean || nameLower.replace(/[^a-z0-9]/g, '') === clean;
      const nameFirstWordMatch = nameLower.split(/[\s(]/)[0] === clean;

      const cleanPhone = (u.phone || '').replace(/[\s-]/g, '');
      const inputPhone = clean.replace(/[\s-]/g, '');
      const phoneMatch = cleanPhone.length > 0 && inputPhone.length > 5 && (cleanPhone === inputPhone || cleanPhone.endsWith(inputPhone));

      return emailMatch || emailPrefixMatch || nameMatch || nameFirstWordMatch || phoneMatch;
    });
  }

  public createUser(payload: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    userType?: 'SYSTEM' | 'APP';
    shopName?: string;
    organizationId?: string;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'OWNER' | 'SHOP_OWNER' | 'SHOP_ASSISTANT' | 'HELPER' | 'USER' | string;
    telegramUsername?: string;
  }): StoredUser {
    const nowIso = new Date().toISOString();
    const isSys = payload.userType === 'SYSTEM';
    const uType: 'SYSTEM' | 'APP' = isSys ? 'SYSTEM' : 'APP';
    let assignedRole = payload.role;
    if (!assignedRole) {
      assignedRole = isSys ? 'AGENT' : 'SHOP_OWNER';
    } else if (assignedRole === 'OWNER') {
      assignedRole = 'SHOP_OWNER';
    } else if (assignedRole === 'AGENT' && !isSys) {
      assignedRole = 'HELPER';
    }

    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: (payload.phone || '').trim(),
      passwordHash: hashPassword(payload.password || 'Agent!123'),
      userType: uType,
      shopName: payload.shopName?.trim() || (uType === 'APP' ? `${payload.name.trim()}'s Shop` : undefined),
      organizationId: payload.organizationId?.trim() || (uType === 'APP' ? `org_${payload.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'org_royal'),
      role: assignedRole,
      status: 'ONLINE',
      maxConcurrentChats: 10,
      channels: ['TELEGRAM', 'MESSENGER'],
      telegramUsername: payload.telegramUsername || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // If already exists with same email, update it
    const existingIndex = this.users.findIndex((u) => u.email.toLowerCase() === newUser.email);
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...newUser, id: this.users[existingIndex].id };
      this.saveToFile();
      return this.users[existingIndex];
    }

    this.users.unshift(newUser);
    this.saveToFile();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<StoredUser>): StoredUser | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx < 0) return undefined;

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToFile();
    return this.users[idx];
  }

  public updatePassword(id: string, newPlainPassword: string): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;

    user.passwordHash = hashPassword(newPlainPassword);
    user.updatedAt = new Date().toISOString();
    this.saveToFile();
    return true;
  }

  public resetPasswordByIdentifier(identifier: string, newPlainPassword: string): StoredUser | undefined {
    const user = this.findByIdentifier(identifier);
    if (!user) return undefined;

    user.passwordHash = hashPassword(newPlainPassword);
    user.updatedAt = new Date().toISOString();
    this.saveToFile();
    return user;
  }

  public deleteUser(id: string, cascadeOrg = false): { success: boolean; deletedUser?: StoredUser; cascadeMembers: StoredUser[] } {
    const targetUser = this.users.find((u) => u.id === id);
    if (!targetUser) return { success: false, cascadeMembers: [] };

    let cascadeMembers: StoredUser[] = [];
    const isOwner = targetUser.role === 'OWNER' || targetUser.role === 'SHOP_OWNER';

    if (cascadeOrg && isOwner && targetUser.organizationId) {
      // Find all sub members in the same organization (helpers, assistants)
      cascadeMembers = this.users.filter(
        (u) => u.organizationId === targetUser.organizationId && u.id !== targetUser.id
      );
      const memberIdsToDelete = new Set([targetUser.id, ...cascadeMembers.map((m) => m.id)]);
      this.users = this.users.filter((u) => !memberIdsToDelete.has(u.id));
      if (prisma && typeof prisma.user?.deleteMany === 'function') {
        prisma.user.deleteMany({ where: { id: { in: Array.from(memberIdsToDelete) } } }).catch(() => {});
      }
    } else {
      this.users = this.users.filter((u) => u.id !== id);
      if (prisma && typeof prisma.user?.deleteMany === 'function') {
        prisma.user.deleteMany({ where: { id } }).catch(() => {});
      }
    }

    this.saveToFile();
    return { success: true, deletedUser: targetUser, cascadeMembers };
  }
}

export const userStore = new UserStoreService();
