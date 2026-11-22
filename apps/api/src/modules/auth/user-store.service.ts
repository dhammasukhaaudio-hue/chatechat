import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
  // Allow matching plain directly for dev presets, or hashed
  return hash === plain || hash === hashPassword(plain);
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
    id: 'user_agent_saung',
    name: 'Saung (Shop Assistant)',
    email: 'saung@chatechat.com',
    phone: '09791112233',
    passwordHash: hashPassword('Agent!123'),
    userType: 'APP',
    shopName: "Yoon's Fashion Shop",
    organizationId: 'org_yoon',
    role: 'SHOP_ASSISTANT',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['MESSENGER', 'TELEGRAM'],
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
];

class UserStoreService {
  private users: StoredUser[] = [];

  constructor() {
    this.init();
  }

  private normalizeUser(u: StoredUser): StoredUser {
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();

    if (!u.userType) {
      if (
        email.includes('michael') ||
        email.includes('admin@') ||
        email.includes('susuwin') ||
        email.includes('kyawkyaw') ||
        email.includes('thiri') ||
        name.includes('ceo') ||
        name.includes('system administrator') ||
        name.includes('finance lead')
      ) {
        u.userType = 'SYSTEM';
        if (email.includes('michael') || name.includes('ceo')) {
          u.role = 'SUPER_ADMIN';
        } else if (email.includes('admin') || email.includes('susuwin')) {
          u.role = 'ADMIN';
        } else {
          u.role = 'AGENT';
        }
      } else {
        u.userType = 'APP';
        if (name.includes('yoon') || email.includes('yoon')) {
          u.role = 'SHOP_OWNER';
          u.shopName = "Yoon's Fashion Shop";
          u.organizationId = 'org_yoon';
        } else if (name.includes('mexes') || email.includes('mexes')) {
          u.role = 'SHOP_OWNER';
          u.shopName = 'Mexes Official Shop';
          u.organizationId = 'org_mexes';
        } else if (name.includes('saung') || email.includes('saung')) {
          u.role = 'SHOP_ASSISTANT';
          u.shopName = "Yoon's Fashion Shop";
          u.organizationId = 'org_yoon';
        } else {
          u.role = 'HELPER';
          u.shopName = u.shopName || 'Mexes Official Shop';
          u.organizationId = u.organizationId || 'org_mexes';
        }
      }
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
          this.saveToFile();
          return;
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not read users.json, initializing with default users', e);
    }

    this.users = [...DEFAULT_USERS];
    this.saveToFile();
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to save users to file:', err);
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
    return this.users.find((u) => {
      const emailMatch = u.email.toLowerCase() === clean;
      const nameMatch = u.name.toLowerCase() === clean || u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean;
      const phoneMatch = u.phone && (u.phone.replace(/[\s-]/g, '') === clean.replace(/[\s-]/g, '') || u.phone.includes(clean));
      return emailMatch || nameMatch || phoneMatch;
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
    const uType = payload.userType || (payload.role?.includes('SHOP') || payload.role === 'HELPER' ? 'APP' : 'SYSTEM');
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: (payload.phone || '').trim(),
      passwordHash: hashPassword(payload.password || 'Agent!123'),
      userType: uType,
      shopName: payload.shopName?.trim() || (uType === 'APP' ? `${payload.name.trim()}'s Shop` : undefined),
      organizationId: payload.organizationId?.trim() || (uType === 'APP' ? `org_${payload.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'org_royal'),
      role: payload.role || (uType === 'SYSTEM' ? 'AGENT' : 'HELPER'),
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

  public deleteUser(id: string): boolean {
    const prevLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    if (this.users.length !== prevLen) {
      this.saveToFile();
      return true;
    }
    return false;
  }
}

export const userStore = new UserStoreService();
