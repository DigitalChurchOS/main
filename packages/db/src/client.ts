import { PrismaClient } from './generated/prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Shared Prisma client for ChurchOS.
 * Uses Cloudflare D1 in Workers when available.
 */
export function getPrismaClient(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  if (typeof globalThis === 'object' && 'D1' in globalThis) {
    // Cloudflare Worker binding should provide a D1 adapter binding.
    try {
      const { PrismaD1 } = require('@prisma/adapter-d1');
      prisma = new PrismaClient({
        adapter: new PrismaD1((globalThis as any).D1),
      });
      return prisma;
    } catch (err) {
      console.error('Failed to initialize Prisma D1 adapter:', err);
    }
  }

  prisma = new PrismaClient({} as any);
  return prisma;
}
