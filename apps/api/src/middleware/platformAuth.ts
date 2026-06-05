import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

interface PlatformTokenPayload {
  platformUserId: string;
  email: string;
}

/**
 * Platform Authentication Middleware
 * ---------------------------------
 * Verifies that the Authorization header contains a valid Platform JWT.
 * Injects `req.platformUser` for downstream platform handlers.
 */
export async function platformAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or malformed token.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as PlatformTokenPayload;

    if (!payload.platformUserId) {
      res.status(403).json({ error: 'Access denied. Valid platform user session required.' });
      return;
    }

    const platformUser = await prisma.platformUser.findUnique({
      where: { id: payload.platformUserId },
      include: {
        platformRole: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!platformUser) {
      res.status(401).json({ error: 'Platform user account not found.' });
      return;
    }

    if (platformUser.status !== 'active') {
      res.status(403).json({ error: `Platform user account is ${platformUser.status}.` });
      return;
    }

    const permissions = platformUser.platformRole
      ? platformUser.platformRole.permissions.map(p => p.permission.name)
      : [];

    req.platformUser = {
      userId: platformUser.id,
      email: platformUser.email,
      roleName: platformUser.platformRole?.name || 'User',
      permissions,
    };

    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    next(err);
  }
}

/**
 * Platform RBAC Gate
 * ------------------
 * Returns Express middleware that blocks requests unless the platform user
 * possesses all of the required platform-wide permissions.
 */
export function requirePlatformPermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.platformUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userPerms = new Set(req.platformUser.permissions);
    const missing = requiredPermissions.filter((p) => !userPerms.has(p));

    if (missing.length > 0) {
      res.status(403).json({
        error: 'Insufficient platform permissions',
        missing,
      });
      return;
    }

    next();
  };
}
