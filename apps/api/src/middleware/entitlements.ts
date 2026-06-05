import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Entitlement Check Middleware Factory
 * -----------------------------------
 * Restricts access to routes unless the requesting tenant has an active
 * or trialing subscription entitlement for the given moduleKey.
 *
 * Usage:
 *   router.post('/sermons', requireModule('media-sermons'), handler);
 */
export function requireModule(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    try {
      const entitlement = await prisma.tenantModule.findUnique({
        where: {
          tenantId_moduleKey: { tenantId, moduleKey },
        },
      });

      if (!entitlement) {
        res.status(403).json({
          error: 'Module not activated',
          moduleKey,
          message: `The '${moduleKey}' module is not activated for this church. Please check subscription plans.`,
        });
        return;
      }

      const activeStatuses = ['active', 'trialing'];
      if (!activeStatuses.includes(entitlement.status)) {
        res.status(403).json({
          error: 'Module suspended',
          moduleKey,
          status: entitlement.status,
          message: `Your access to '${moduleKey}' is suspended or expired (current status: ${entitlement.status}).`,
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
