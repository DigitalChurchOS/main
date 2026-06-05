import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register-tenant
// ─────────────────────────────────────────────────────────────
// Body: { name, subdomain, ownerName, ownerEmail, ownerPassword }
// Creates a Tenant, default core modules, owner User & Member.
// ─────────────────────────────────────────────────────────────
router.post('/register-tenant', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subdomain, ownerName, ownerEmail, ownerPassword } = req.body;

    if (!name || !subdomain || !ownerEmail || !ownerPassword) {
      res.status(400).json({ error: 'name, subdomain, ownerEmail, ownerPassword are required' });
      return;
    }

    let normalizedSubdomain = subdomain.trim().toLowerCase();
    if (normalizedSubdomain.includes('.')) {
      normalizedSubdomain = normalizedSubdomain.split('.')[0];
    }
    normalizedSubdomain = normalizedSubdomain.replace(/[^a-z0-9-]/g, '');

    if (!normalizedSubdomain) {
      res.status(400).json({ error: 'Invalid subdomain format' });
      return;
    }

    // Check duplicate subdomain
    const duplicate = await prisma.tenant.findUnique({
      where: { subdomain: normalizedSubdomain }
    });
    if (duplicate) {
      res.status(409).json({ error: `Subdomain '${normalizedSubdomain}' is already taken` });
      return;
    }

    const tenant = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const newTenant = await tx.tenant.create({
        data: {
          name,
          subdomain: normalizedSubdomain,
          status: 'active',
        },
      });

      // 2. Create Owner User
      const passwordHash = await bcrypt.hash(ownerPassword, 12);
      const user = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: ownerEmail,
          passwordHash,
          status: 'active',
        },
      });

      // 3. Create Member profile for Owner
      const names = (ownerName || ownerEmail.split('@')[0]).split(' ');
      await tx.member.create({
        data: {
          tenantId: newTenant.id,
          userId: user.id,
          firstName: names[0] || 'Admin',
          lastName: names[1] || 'User',
          email: ownerEmail,
          membershipStatus: 'leader',
        },
      });

      // 4. Entitle default core modules
      await tx.tenantModule.createMany({
        data: [
          { tenantId: newTenant.id, moduleKey: 'website-cms', status: 'active', billingRule: 'free' },
          { tenantId: newTenant.id, moduleKey: 'theme-engine', status: 'active', billingRule: 'free' },
          { tenantId: newTenant.id, moduleKey: 'domain-tenant-management', status: 'active', billingRule: 'free' },
        ],
      });

      // 5. Find or create the "Admin" role for this tenant
      let adminRole = await tx.role.findFirst({
        where: { tenantId: newTenant.id, name: 'Admin' },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: { tenantId: newTenant.id, name: 'Admin', description: 'Full access administrator', isCustom: false },
        });

        // Attach all existing permissions to Admin role
        const allPerms = await tx.permission.findMany();
        if (allPerms.length > 0) {
          await tx.rolePermission.createMany({
            data: allPerms.map((p) => ({ roleId: adminRole!.id, permissionId: p.id })),
          });
        }
      }

      await tx.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      return newTenant;
    });

    res.status(201).json({ data: tenant });
  } catch (err: any) {
    console.error('Tenant public onboarding error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
// Body: { email, password, firstName, lastName }
// Creates a User, a linked Member profile, and assigns the
// default "Admin" role (auto-created for the tenant if missing).
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const tenantId = req.tenantId!;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'email, password, firstName, lastName are required' });
      return;
    }

    // Check for duplicate email within tenant
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    if (existing) {
      res.status(409).json({ error: 'Email already registered in this church' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Transaction: create user + member + assign default role
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { tenantId, email, passwordHash },
      });

      const member = await tx.member.create({
        data: {
          tenantId,
          userId: user.id,
          firstName,
          lastName,
          membershipStatus: 'member',
        },
      });

      // Find or create the "Admin" role for this tenant
      let adminRole = await tx.role.findFirst({
        where: { tenantId, name: 'Admin' },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: { tenantId, name: 'Admin', description: 'Full access administrator', isCustom: false },
        });

        // Attach all existing permissions to Admin role
        const allPerms = await tx.permission.findMany();
        if (allPerms.length > 0) {
          await tx.rolePermission.createMany({
            data: allPerms.map((p) => ({ roleId: adminRole!.id, permissionId: p.id })),
          });
        }
      }

      await tx.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      return { user, member };
    });

    // Issue JWT
    const token = jwt.sign(
      { userId: result.user.id, tenantId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        member: {
          id: result.member.id,
          firstName: result.member.firstName,
          lastName: result.member.lastName,
        },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.tenantId!;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      include: { member: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, tenantId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        member: user.member
          ? { id: user.member.id, firstName: user.member.firstName, lastName: user.member.lastName }
          : null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// SECURE USER & ROLE MANAGEMENT API ENDPOINTS (Tenant Isolated)
// ─────────────────────────────────────────────────────────────
import { authMiddleware } from '../middleware/auth';

// 1. GET /api/auth/users - Retrieve active users in the tenant
router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const users = await prisma.user.findMany({
      where: { tenantId, status: { not: 'invited' } },
      include: {
        member: true,
        userRoles: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: users });
  } catch (err: any) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. DELETE /api/auth/users/:id - Delete a user from the tenant
router.delete('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id as string;

    // Verify user belongs to tenant
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });
    if (!targetUser || targetUser.tenantId !== tenantId) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Do not allow deleting yourself
    if (targetUser.id === req.user?.userId) {
      res.status(400).json({ error: 'Cannot delete the currently logged-in user account' });
      return;
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.member.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. POST /api/auth/invitations - Invite a staff member
router.post('/invitations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { email, roleName } = req.body;

    if (!email || !roleName) {
      res.status(400).json({ error: 'email and roleName are required' });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } }
    });
    if (existing) {
      res.status(409).json({ error: 'Email already exists in this church tenant' });
      return;
    }

    // Find the role or create a default if missing
    let role = await prisma.role.findFirst({
      where: { tenantId, name: roleName }
    });
    if (!role) {
      role = await prisma.role.create({
        data: { tenantId, name: roleName, description: `${roleName} level staff role`, isCustom: true }
      });
    }

    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordPlaceholder = await bcrypt.hash(randomPassword, 12);
    
    // Create invited user
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          email,
          passwordHash: passwordPlaceholder,
          status: 'invited'
        }
      });

      // Create dummy placeholder member profile
      const names = email.split('@')[0].split('.');
      const firstName = names[0] ? names[0].charAt(0).toUpperCase() + names[0].slice(1) : 'Invited';
      const lastName = names[1] ? names[1].charAt(0).toUpperCase() + names[1].slice(1) : 'Staff';

      await tx.member.create({
        data: {
          tenantId,
          userId: user.id,
          firstName,
          lastName,
          email,
          membershipStatus: 'visitor'
        }
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: role!.id }
      });

      return user;
    });

    res.status(201).json({ data: result });
  } catch (err: any) {
    console.error('Invite staff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. GET /api/auth/invitations - List pending invitations
router.get('/invitations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const invitations = await prisma.user.findMany({
      where: { tenantId, status: 'invited' },
      include: {
        userRoles: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: invitations });
  } catch (err: any) {
    console.error('List invitations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. DELETE /api/auth/invitations/:id - Revoke staff invitation
router.delete('/invitations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id as string;

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });
    if (!targetUser || targetUser.tenantId !== tenantId || targetUser.status !== 'invited') {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.member.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ message: 'Invitation revoked successfully' });
  } catch (err: any) {
    console.error('Revoke invitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. GET /api/auth/roles - Retrieve roles and permission matrices for the tenant
router.get('/roles', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null } // System-wide default roles
        ]
      },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    res.json({ data: roles });
  } catch (err: any) {
    console.error('Get roles error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. PATCH /api/auth/roles/:id - Update permissions or information on a role
router.patch('/roles/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id as string;
    const { name, description, permissionNames } = req.body;

    const targetRole = await prisma.role.findUnique({
      where: { id }
    });
    if (!targetRole || (targetRole.tenantId && targetRole.tenantId !== tenantId)) {
      res.status(404).json({ error: 'Role not found or access denied' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update basic fields if provided
      if (name || description) {
        await tx.role.update({
          where: { id },
          data: {
            name: name ?? undefined,
            description: description ?? undefined
          }
        });
      }

      // Update permissions if provided
      if (permissionNames && Array.isArray(permissionNames)) {
        // Clear current permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id }
        });

        // Resolve permission ids, creating permission definitions if they don't exist
        for (const permName of permissionNames) {
          let permission = await tx.permission.findUnique({
            where: { name: permName }
          });
          if (!permission) {
            permission = await tx.permission.create({
              data: { name: permName, description: `Autogenerated permission for ${permName}` }
            });
          }

          await tx.rolePermission.create({
            data: {
              roleId: id,
              permissionId: permission.id
            }
          });
        }
      }
    });

    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    res.json({ data: updatedRole });
  } catch (err: any) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. PUT /api/auth/users/:id/role - Update a user's assigned role
router.put('/users/:id/role', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const id = req.params.id as string;
    const { roleId } = req.body;

    if (!roleId) {
      res.status(400).json({ error: 'roleId is required' });
      return;
    }

    const [targetUser, targetRole] = await Promise.all([
      prisma.user.findUnique({ where: { id } }),
      prisma.role.findUnique({ where: { id: roleId } })
    ]);

    if (!targetUser || targetUser.tenantId !== tenantId) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!targetRole || (targetRole.tenantId && targetRole.tenantId !== tenantId)) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: id } }),
      prisma.userRole.create({
        data: { userId: id, roleId }
      })
    ]);

    res.json({ message: 'User role updated successfully' });
  } catch (err: any) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, subdomain } = req.body;

    if (!email || !subdomain) {
      res.status(400).json({ error: 'email and subdomain are required' });
      return;
    }

    let normalizedSubdomain = subdomain.trim().toLowerCase();
    if (normalizedSubdomain.includes('.')) {
      normalizedSubdomain = normalizedSubdomain.split('.')[0];
    }
    normalizedSubdomain = normalizedSubdomain.replace(/[^a-z0-9-]/g, '');

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: normalizedSubdomain }
    });

    if (!tenant) {
      res.status(404).json({ error: `Church subdomain '${normalizedSubdomain}' not found` });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found under this church subdomain' });
      return;
    }

    // Generate a secure reset token
    const token = jwt.sign(
      { userId: user.id, email: user.email, currentHash: user.passwordHash },
      JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // In a real application, we would email this link. For preview, we display it directly.
    res.json({
      message: 'Reset token generated successfully. In production, this would be emailed to the user.',
      token,
      resetLink: `http://localhost:3000/admin?resetToken=${token}`
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'token and newPassword are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET || 'secret');
    } catch (verifyErr) {
      res.status(400).json({ error: 'Invalid, expired, or malformed reset token' });
      return;
    }

    const { userId, currentHash } = decoded;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(400).json({ error: 'User associated with this token no longer exists' });
      return;
    }

    // Check if password has been changed since token was generated (token invalidation check)
    if (user.passwordHash !== currentHash) {
      res.status(400).json({ error: 'This reset token has already been used or is no longer valid' });
      return;
    }

    // Hash the new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;
