import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import path from 'path';

let prisma: PrismaClient | undefined;

// Check if running inside Cloudflare Workers/Pages V8 isolate context
const isCloudflare =
  process.env.VERCEL !== '1' &&
  typeof (globalThis as any).WebSocket !== 'undefined' &&
  typeof (globalThis as any).caches !== 'undefined';

function createPrismaClient(): PrismaClient {
  if (isCloudflare) {
    try {
      // Dynamically require Cloudflare Workers modules to avoid compiling them in Node
      const { env } = require('cloudflare:workers');
      const { PrismaD1 } = require('@prisma/adapter-d1');

      // env.DB is the D1 Database binding configured in wrangler.toml
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    } catch (err) {
      console.error('Failed to initialize Cloudflare D1 adapter:', err);
      throw err;
    }
  }

  // Node.js environment (Local dev, Vercel Serverless, or AWS)
  const rawUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

  if (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://') || rawUrl.startsWith('http://')) {
    // Turso / LibSQL deployment (common on Vercel Serverless SQLite setups)
    try {
      const { createClient } = require('@libsql/client');
      const { PrismaLibSQL } = require('@prisma/adapter-libsql');

      const client = createClient({
        url: rawUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      const adapter = new PrismaLibSQL(client);
      return new PrismaClient({ adapter });
    } catch (err) {
      console.error('Failed to initialize LibSQL adapter:', err);
      throw err;
    }
  } else if (rawUrl.startsWith('file:')) {
    // Local SQLite file database (Local dev / testing)
    try {
      if (process.env.VERCEL === '1') {
        throw new Error(
          'Vercel requires a serverless database. Set DATABASE_URL to a LibSQL/Turso, PostgreSQL, or other hosted database URL instead of file: SQLite.'
        );
      } else {
        const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
        const relativePath = rawUrl.replace(/^file:/, '');
        const dbPath = path.isAbsolute(relativePath)
          ? relativePath
          : path.resolve(process.cwd(), relativePath);

        const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
        return new PrismaClient({ adapter });
      }
    } catch (err) {
      console.error('Failed to initialize SQLite client:', err);
      throw err;
    }
  } else {
    // Fallback to PostgreSQL or other server databases (e.g. AWS RDS or Vercel Postgres)
    try {
      return new (PrismaClient as any)();
    } catch (err) {
      console.error('Failed to initialize default Prisma Client:', err);
      throw err;
    }
  }
}

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient();
  }

  return prisma;
}

const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getPrismaClient() as any, property, receiver);
  },
});

export default prismaProxy;
