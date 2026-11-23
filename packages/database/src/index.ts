import { PrismaClient } from '@prisma/client';

try {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    dotenv.config();
    if (!process.env.DATABASE_URL) {
      dotenv.config({ path: path.resolve(__dirname, '../../../apps/api/.env') });
      dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });
      dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
      dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    }
  }
} catch {}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let client: any = null;

function initClient() {
  if (!client) {
    try {
      client =
        global.prisma ||
        new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
      if (process.env.NODE_ENV !== 'production') {
        global.prisma = client;
      }
    } catch (e: any) {
      console.warn('⚠️ PrismaClient initialization deferred or failed:', e?.message);
      client = new Proxy({}, {
        get() {
          return new Proxy({}, {
            get() {
              return async () => null;
            },
          });
        },
      });
    }
  }
  return client;
}

export const prisma: any = new Proxy({}, {
  get(_target, prop) {
    const c = initClient();
    const val = c[prop];
    if (typeof val === 'function') {
      return val.bind(c);
    }
    return val;
  },
});

export * from '@prisma/client';
