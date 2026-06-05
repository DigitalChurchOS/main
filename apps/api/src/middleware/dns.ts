import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

// Standard base domains used to extract subdomains
const BASE_DOMAINS = ['churchos.local', 'churchos.com', 'localhost'];

/**
 * DNS & Domain Resolver Middleware
 * --------------------------------
 * Dynamically resolves `tenantId` (and `websiteId`) based on the request's
 * host headers. Supports custom white-labeled domains and subdomain routing.
 *
 * Replaces the need for administrative 'x-tenant-id' headers on public pages.
 */
export async function dnsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawHost = (req.headers['x-forwarded-host'] || req.headers.host) as string | undefined;

  if (!rawHost) {
    next();
    return;
  }

  // Strip port from host header (e.g. "grace.localhost:3000" -> "grace.localhost")
  const host = rawHost.split(':')[0].toLowerCase();

  try {
    // 1. Try to resolve via custom domain mapping on Website entity
    const websiteByDomain = await prisma.website.findUnique({
      where: { domain: host, isActive: true },
      include: { tenant: true },
    });

    if (websiteByDomain && websiteByDomain.tenant.status === 'active') {
      req.tenantId = websiteByDomain.tenantId;
      (req as any).websiteId = websiteByDomain.id;
      next();
      return;
    }

    // 2. Try to extract and resolve subdomain
    let subdomain: string | null = null;

    // Check against standard base domains
    for (const base of BASE_DOMAINS) {
      if (host === base) {
        // Direct platform domain (no tenant context)
        break;
      }
      if (host.endsWith(`.${base}`)) {
        subdomain = host.slice(0, -(base.length + 1));
        break;
      }
    }

    // Fallback: if host has a subdomain format not explicitly matched, try extracting first label
    if (!subdomain && host.includes('.') && !BASE_DOMAINS.includes(host)) {
      const parts = host.split('.');
      if (parts.length > 2) {
        subdomain = parts[0];
      }
    }

    if (subdomain) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
      });

      if (tenant && tenant.status === 'active') {
        req.tenantId = tenant.id;

        // Auto-resolve primary website for this tenant
        const primaryWebsite = await prisma.website.findFirst({
          where: { tenantId: tenant.id, isActive: true },
        });
        if (primaryWebsite) {
          (req as any).websiteId = primaryWebsite.id;
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
