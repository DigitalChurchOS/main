import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Tenant Middleware
 * -----------------
 * Extracts tenant identity from the `x-tenant-id` header.
 * Validates that the tenant exists and is active.
 * Injects `req.tenantId` for all downstream handlers.
 *
 * Every data query in the platform MUST be scoped to this tenantId
 * to guarantee multi-tenant isolation.
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Allow Super Admin, public CMS render endpoint, public podcast RSS feeds, and signage TV render/ping endpoints to bypass the X-Tenant-ID header check
  // Page context is dynamically resolved via dnsMiddleware, URL params, or resource lookups
  if (
    req.originalUrl.startsWith('/api/super-admin') ||
    req.originalUrl.startsWith('/api/cms/render') ||
    req.originalUrl.includes('/podcast/feeds/') ||
    req.originalUrl.includes('/api/bible/graphics/render/') ||
    req.originalUrl.includes('/api/mobile/config/') ||
    req.originalUrl.includes('/api/mobile/deeplinks/') ||
    (req.originalUrl.includes('/api/signage/screens/') && (req.originalUrl.endsWith('/render') || req.originalUrl.endsWith('/ping')))
  ) {
    next();
    return;
  }

  const tenantId = req.headers['x-tenant-id'] as string | undefined;

  if (!tenantId) {
    console.log('MISSING TENANT ID FOR URL:', req.originalUrl);
    res.status(400).json({ error: 'Missing x-tenant-id header' });
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    if (tenant.status !== 'active' && !req.originalUrl.startsWith('/api/billing/webhook')) {
      res.status(403).json({ error: `Tenant is ${tenant.status}` });
      return;
    }

    req.tenantId = tenant.id;
    next();
  } catch (err) {
    next(err);
  }
}
