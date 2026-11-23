import { prisma } from '@chatechat/database';

export class PersistentStore {
  private static tableEnsured = false;

  public static async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      if (prisma && typeof prisma.$executeRawUnsafe === 'function') {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS system_persistent_store (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        this.tableEnsured = true;
      }
    } catch (e: any) {
      console.warn('⚠️ [PERSISTENCE] Database table ensure warning:', e?.message);
    }
  }

  public static async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureTable();
      if (prisma && typeof prisma.$queryRawUnsafe === 'function') {
        const rows: any = await prisma.$queryRawUnsafe(
          `SELECT data FROM system_persistent_store WHERE key = $1 LIMIT 1`,
          key
        );
        if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
          return JSON.parse(rows[0].data) as T;
        }
      }
    } catch (e: any) {
      console.warn(`⚠️ [PERSISTENCE] Failed to fetch key "${key}" from Supabase:`, e?.message);
    }
    return null;
  }

  public static async set<T>(key: string, data: T): Promise<void> {
    try {
      await this.ensureTable();
      if (prisma && typeof prisma.$executeRawUnsafe === 'function') {
        const jsonStr = JSON.stringify(data);
        await prisma.$executeRawUnsafe(
          `INSERT INTO system_persistent_store (key, data, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = NOW()`,
          key,
          jsonStr
        );
      }
    } catch (e: any) {
      console.warn(`⚠️ [PERSISTENCE] Failed to save key "${key}" to Supabase:`, e?.message);
    }
  }
}
