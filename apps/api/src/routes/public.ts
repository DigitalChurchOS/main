import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'app',
  'api',
  'www',
  'support',
  'billing',
  'dashboard',
  'login',
  'signup',
  'register',
  'pricing',
  'features',
  'demo',
  'themes',
  'plugins',
  'super-admin',
  'platform',
]);

/**
 * POST /api/public/check-subdomain
 * Body: { subdomain }
 * Validates a preferred church subdomain.
 */
router.post('/check-subdomain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subdomain } = req.body;

    if (!subdomain || typeof subdomain !== 'string') {
      res.status(400).json({ error: 'subdomain is required' });
      return;
    }

    const clean = subdomain.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

    if (clean !== subdomain) {
      res.json({
        available: false,
        error: 'Subdomain must contain lowercase letters, numbers, and hyphens only, with no spaces.',
      });
      return;
    }

    if (clean.length < 4) {
      res.json({
        available: false,
        error: 'Subdomain must be at least 4 characters long.',
      });
      return;
    }

    if (clean.length > 63) {
      res.json({
        available: false,
        error: 'Subdomain cannot exceed 63 characters.',
      });
      return;
    }

    if (clean.startsWith('-') || clean.endsWith('-')) {
      res.json({
        available: false,
        error: 'Subdomain cannot start or end with a hyphen.',
      });
      return;
    }

    if (RESERVED_SUBDOMAINS.has(clean)) {
      res.json({
        available: false,
        error: `Subdomain '${clean}' is reserved for the platform.`,
      });
      return;
    }

    const duplicate = await prisma.tenant.findUnique({
      where: { subdomain: clean },
    });

    if (duplicate) {
      res.json({
        available: false,
        error: `Subdomain '${clean}' is already taken.`,
      });
      return;
    }

    res.json({
      available: true,
      subdomain: clean,
    });
  } catch (err: any) {
    console.error('Check subdomain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/public/resolve-subdomain
 * Body: { subdomain }
 * Returns the tenantId for a given subdomain if it exists.
 */
router.post('/resolve-subdomain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subdomain } = req.body;

    if (!subdomain || typeof subdomain !== 'string') {
      res.status(400).json({ error: 'subdomain is required' });
      return;
    }

    const clean = subdomain.toLowerCase().trim();

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: clean },
    });

    if (!tenant) {
      res.status(404).json({ error: `Church subdomain '${clean}' not found` });
      return;
    }

    res.json({
      tenantId: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
    });
  } catch (err: any) {
    console.error('Resolve subdomain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
