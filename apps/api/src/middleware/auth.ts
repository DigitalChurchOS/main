import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT token payload shape stored inside access tokens.
 */
interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
}

/**
 * Auth Middleware
 * ---------------
 * Verifies the `Authorization: Bearer <token>` header.
 * Loads the user's permissions from the database and injects
 * a `req.user` object containing { userId, tenantId, email, permissions[] }.
 *
 * Also enforces that the token's tenantId matches the request's
 * tenantId (set by tenant middleware) to prevent cross-tenant escalation.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Cross-tenant check: token tenant must match request tenant
    if (req.tenantId && payload.tenantId !== req.tenantId) {
      res.status(403).json({ error: 'Token tenant mismatch' });
      return;
    }

    // Load the user record (including preferredLanguage) and permission keys via roles
    const [userRecord, userRoles] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: { preferredLanguage: true },
      }),
      prisma.userRole.findMany({
        where: { userId: payload.userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      }),
    ]);

    const permissions = Array.from(
      new Set(
        userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name)
        )
      )
    );

    req.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: payload.email,
      permissions,
      preferredLanguage: userRecord?.preferredLanguage || 'en',
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
