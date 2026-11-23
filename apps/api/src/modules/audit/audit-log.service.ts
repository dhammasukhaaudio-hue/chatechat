import fs from 'fs';
import path from 'path';
import { PersistentStore } from '../common/persistent-store.service';

export interface DeleteAuditLog {
  id: string;
  timestamp: string;
  formattedMmtTime: string;
  action: 'DELETE_USER' | 'CASCADE_DELETE_SHOP_OWNER';
  deletedBy: {
    id: string;
    name: string;
    email?: string;
    role: string;
    userType?: string;
  };
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    userType?: string;
    shopName?: string;
    organizationId?: string;
  };
  reason: string;
  cascadeDeletedCount: number;
  cascadeDeletedMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

const DATA_DIR = path.resolve(__dirname, '../../../data');
const AUDIT_FILE = path.join(DATA_DIR, 'delete-logs.json');

export class AuditLogService {
  private logs: DeleteAuditLog[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        this.logs = JSON.parse(raw);
      } else {
        this.logs = [];
        this.saveToFile(false);
      }
    } catch (e) {
      console.warn('⚠️ Could not load delete-logs.json, initializing empty list:', e);
      this.logs = [];
    }

    // Sync from Supabase persistent store
    this.syncFromDatabase();
  }

  private async syncFromDatabase() {
    try {
      const dbLogs = await PersistentStore.get<DeleteAuditLog[]>('delete_logs');
      if (Array.isArray(dbLogs) && dbLogs.length > 0) {
        const idSet = new Set(this.logs.map((l) => l.id));
        let added = false;
        for (const log of dbLogs) {
          if (!idSet.has(log.id)) {
            this.logs.push(log);
            added = true;
          }
        }
        if (added) {
          this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.saveToFile(false);
        }
      }
      await PersistentStore.set('delete_logs', this.logs);
    } catch (err: any) {
      console.warn('⚠️ [PERSISTENCE] Delete logs sync warning:', err?.message);
    }
  }

  private saveToFile(syncDb = true) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.logs, null, 2), 'utf-8');
    } catch (e) {
      console.error('❌ Failed to save delete-logs.json:', e);
    }
    if (syncDb) {
      PersistentStore.set('delete_logs', this.logs).catch(() => {});
    }
  }

  public getDeleteLogs(): DeleteAuditLog[] {
    return this.logs;
  }

  public recordDelete(entry: {
    action?: 'DELETE_USER' | 'CASCADE_DELETE_SHOP_OWNER';
    deletedBy: {
      id: string;
      name: string;
      email?: string;
      role: string;
      userType?: string;
    };
    targetUser: {
      id: string;
      name: string;
      email: string;
      role: string;
      userType?: string;
      shopName?: string;
      organizationId?: string;
    };
    reason: string;
    cascadeDeletedMembers?: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
  }): DeleteAuditLog {
    const now = new Date();
    // Calculate Myanmar Time (UTC + 6:30)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const mmt = new Date(utc + (6.5 * 3600000));
    const formattedMmtTime = `${mmt.getFullYear()}-${String(mmt.getMonth() + 1).padStart(2, '0')}-${String(mmt.getDate()).padStart(2, '0')} ${mmt.toLocaleTimeString('en-US', { hour12: true })} MMT`;

    const cascadeMembers = entry.cascadeDeletedMembers || [];
    const newLog: DeleteAuditLog = {
      id: `log_del_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toISOString(),
      formattedMmtTime,
      action: entry.action || (cascadeMembers.length > 0 ? 'CASCADE_DELETE_SHOP_OWNER' : 'DELETE_USER'),
      deletedBy: entry.deletedBy,
      targetUser: entry.targetUser,
      reason: entry.reason?.trim() || 'အကြောင်းပြချက် မဖော်ပြထားပါ (No reason specified)',
      cascadeDeletedCount: cascadeMembers.length,
      cascadeDeletedMembers: cascadeMembers,
    };

    this.logs.unshift(newLog);
    this.saveToFile();

    console.log(
      `🗑️ [AUDIT LOG RECORDED] User '${entry.targetUser.name}' (${entry.targetUser.role}) deleted by '${entry.deletedBy.name}' (${entry.deletedBy.role}). Reason: ${newLog.reason}. Cascade deleted: ${cascadeMembers.length}`
    );

    return newLog;
  }
}

export const auditLogService = new AuditLogService();
