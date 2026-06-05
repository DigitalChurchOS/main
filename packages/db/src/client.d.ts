import { PrismaClient } from './generated/prisma/client';
/**
 * Shared Prisma client for ChurchOS.
 * Uses Cloudflare D1 in Workers when available.
 */
export declare function getPrismaClient(): PrismaClient;
