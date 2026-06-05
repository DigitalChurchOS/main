import { Request, Response, NextFunction } from 'express';

/**
 * RBAC Gate Factory
 * ------------------
 * Returns Express middleware that blocks the request unless
 * `req.user.permissions` contains ALL of the required permission keys.
 *
 * Usage:
 *   router.get('/members', requirePermission('member.read'), handler);
 *   router.post('/finance', requirePermission('finance.create', 'finance.approve'), handler);
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userPerms = new Set(req.user.permissions);
    const missing = requiredPermissions.filter((p) => !userPerms.has(p));

    if (missing.length > 0) {
      res.status(403).json({
        error: 'Insufficient permissions',
        missing,
      });
      return;
    }

    next();
  };
}

export function requireAnyPermission(...allowedPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userPerms = new Set(req.user.permissions);
    const allowed = allowedPermissions.some((permission) => userPerms.has(permission));

    if (!allowed) {
      res.status(403).json({
        error: 'Insufficient permissions',
        requiredAny: allowedPermissions,
      });
      return;
    }

    next();
  };
}
