import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Super Admin Middleware
 * ----------------------
 * Validates that the logged-in user possesses the system-wide
 * "SuperAdmin" role (where tenant_id is null).
 */
export async function superAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId: req.user.userId },
      include: {
        role: true,
      },
    });

    const isSuperAdmin = userRoles.some(
      (ur) => ur.role.tenantId === null && ur.role.name === 'SuperAdmin'
    );

    if (!isSuperAdmin) {
      res.status(403).json({ error: 'Forbidden: Super Admin access required' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
