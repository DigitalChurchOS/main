import prisma from '../apps/api/src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const name = 'CE Bunga';
  const subdomain = 'cebunga';
  const ownerName = 'Pastor Walter';
  const ownerEmail = 'admin@walter.com';
  const ownerPassword = 'Password123!';

  console.log("Simulating registration transaction...");

  try {
    const tenant = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      console.log("Creating tenant...");
      const newTenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
          status: 'active',
        },
      });
      console.log("Tenant created:", newTenant.id);

      // 2. Create Owner User
      console.log("Creating owner user...");
      const passwordHash = await bcrypt.hash(ownerPassword, 12);
      const user = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: ownerEmail,
          passwordHash,
          status: 'active',
        },
      });
      console.log("User created:", user.id);

      // 3. Create Member profile for Owner
      console.log("Creating member profile...");
      const names = (ownerName || ownerEmail.split('@')[0]).split(' ');
      const member = await tx.member.create({
        data: {
          tenantId: newTenant.id,
          userId: user.id,
          firstName: names[0] || 'Admin',
          lastName: names[1] || 'User',
          email: ownerEmail,
          membershipStatus: 'leader',
        },
      });
      console.log("Member created:", member.id);

      // 4. Entitle default core modules
      console.log("Entitling default core modules...");
      await tx.tenantModule.createMany({
        data: [
          { tenantId: newTenant.id, moduleKey: 'website-cms', status: 'active', billingRule: 'free' },
          { tenantId: newTenant.id, moduleKey: 'theme-engine', status: 'active', billingRule: 'free' },
          { tenantId: newTenant.id, moduleKey: 'domain-tenant-management', status: 'active', billingRule: 'free' },
        ],
      });

      // 5. Find or create the "Admin" role for this tenant
      console.log("Setting up role...");
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

      console.log("Linking user to role...");
      await tx.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      return newTenant;
    });

    console.log("Transaction succeeded! Tenant details:", tenant);
  } catch (err) {
    console.error("TRANSACTION FAILED WITH ERROR:");
    console.error(err);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
