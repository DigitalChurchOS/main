"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClient = getPrismaClient;
const client_1 = require("./generated/prisma/client");
let prisma = null;
/**
 * Shared Prisma client for ChurchOS.
 * Uses Cloudflare D1 in Workers when available.
 */
function getPrismaClient() {
    if (prisma) {
        return prisma;
    }
    if (typeof globalThis === 'object' && 'D1' in globalThis) {
        // Cloudflare Worker binding should provide a D1 adapter binding.
        try {
            const { PrismaD1 } = require('@prisma/adapter-d1');
            prisma = new client_1.PrismaClient({
                adapter: new PrismaD1(globalThis.D1),
            });
            return prisma;
        }
        catch (err) {
            console.error('Failed to initialize Prisma D1 adapter:', err);
        }
    }
    prisma = new client_1.PrismaClient({});
    return prisma;
}
//# sourceMappingURL=client.js.map