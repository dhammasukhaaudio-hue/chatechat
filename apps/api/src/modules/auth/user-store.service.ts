import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'OWNER' | 'ADMIN' | 'AGENT' | 'USER';
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
  {
    id: 'user_michael_1',
    name: 'Michael (Founder & CEO)',
    email: 'michael@chatechat.com',
    phone: '09798888123',
    passwordHash: hashPassword('Admin!123'),
    role: 'OWNER',
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
    role: 'ADMIN',
    status: 'ONLINE',
    maxConcurrentChats: 20,
    channels: ['MESSENGER', 'TELEGRAM'],
    telegramUsername: '@chatechat_admin',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_mexes',
    name: 'mexes',
    email: 'mexes@chatechat.com',
    phone: '09798888999',
    passwordHash: hashPassword('Agent!123'),
    role: 'AGENT',
    status: 'ONLINE',
    maxConcurrentChats: 10,
    channels: ['TELEGRAM'],
    telegramUsername: '@mexes_bot',
    createdAt: new Date('2026-02-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_susu_2',
    name: 'Daw Su Su Win (Finance Lead)',
    email: 'susuwin@chatechat.com',
    phone: '09987654321',
    passwordHash: hashPassword('Agent!123'),
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
    role: 'AGENT',
    status: 'BUSY',
    maxConcurrentChats: 10,
    channels: ['VIBER', 'TELEGRAM'],
    createdAt: new Date('2026-02-10').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class UserStoreService {
  private users: StoredUser[] = [];

  constructor() {
    this.init();
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
          this.users = parsed;
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
    role?: 'OWNER' | 'ADMIN' | 'AGENT' | 'USER';
    telegramUsername?: string;
  }): StoredUser {
    const nowIso = new Date().toISOString();
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: (payload.phone || '').trim(),
      passwordHash: hashPassword(payload.password || 'Agent!123'),
      role: payload.role || 'AGENT',
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
