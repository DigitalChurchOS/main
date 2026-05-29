import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import path from 'path';

let prisma: PrismaClient;

// Check if running inside Cloudflare Workers/Pages V8 isolate context
const isCloudflare =
  typeof (globalThis as any).WebSocket !== 'undefined' &&
  typeof (globalThis as any).caches !== 'undefined';

if (isCloudflare) {
  try {
    // Dynamically require Cloudflare Workers modules to avoid compiling them in Node
    const { env } = require('cloudflare:workers');
    const { PrismaD1 } = require('@prisma/adapter-d1');

    // env.DB is the D1 Database binding configured in wrangler.toml
    const adapter = new PrismaD1(env.DB);
    prisma = new PrismaClient({ adapter });
  } catch (err) {
    console.error('Failed to initialize Cloudflare D1 adapter:', err);
    throw err;
  }
} else {
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
      prisma = new PrismaClient({ adapter });
    } catch (err) {
      console.error('Failed to initialize LibSQL adapter:', err);
      throw err;
    }
  } else if (rawUrl.startsWith('file:')) {
    // Local SQLite file database (Local dev / testing)
    try {
      if (process.env.VERCEL === '1') {
        // In Vercel serverless environment, native modules like better-sqlite3 are not supported.
        // We use standard Prisma Client without adapter.
        prisma = new (PrismaClient as any)();
      } else {
        const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
        const relativePath = rawUrl.replace(/^file:/, '');
        const dbPath = path.isAbsolute(relativePath)
          ? relativePath
          : path.resolve(process.cwd(), relativePath);

        const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
        prisma = new PrismaClient({ adapter });
      }
    } catch (err) {
      console.error('Failed to initialize SQLite client:', err);
      throw err;
    }
  } else {
    // Fallback to PostgreSQL or other server databases (e.g. AWS RDS or Vercel Postgres)
    try {
      prisma = new (PrismaClient as any)();
    } catch (err) {
      console.error('Failed to initialize default Prisma Client:', err);
      throw err;
    }
  }
}

export default prisma;
