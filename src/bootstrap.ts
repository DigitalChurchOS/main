import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting Database Bootstrap...\n');

  // 1. Seed Permissions, Provider Categories, and Module Definitions
  // (Runs standard seeds to ensure database integrity)
  const permissions = [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'branch.create', 'branch.read', 'branch.update', 'branch.delete',
    'role.create', 'role.read', 'role.update', 'role.delete',
    'user.create', 'user.read', 'user.update', 'user.delete',
    'tenant.settings'
  ];

  console.log('🔑 Seeding permissions...');
  for (const name of permissions) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: `System permission for ${name}` },
    });
  }

  // 2. Create the Tenant Admin Workspace (demo-church-local)
  console.log('\n⛪ Seeding Demo Church workspace...');
  const tenantId = 'demo-church-local';
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'Demo Cathedral', subdomain: 'demo', status: 'active' },
    create: { id: tenantId, name: 'Demo Cathedral', subdomain: 'demo', status: 'active' },
  });

  // Assign base plan
  const plan = await prisma.subscriptionPlan.upsert({
    where: { id: 'demo-plan' },
    update: { name: 'Unlimited Plan', isActive: true },
    create: {
      id: 'demo-plan',
      name: 'Unlimited Plan',
      basePrice: 0,
      includedMembers: 10000,
      includedSms: 10000,
      includedStorageGb: 100,
      memberOverageRate: 0,
      smsOverageRate: 0,
      storageOverageRate: 0,
      isActive: true,
    },
  });

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  await prisma.tenantSubscription.upsert({
    where: { tenantId },
    update: { status: 'active' },
    create: { tenantId, planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: nextMonth },
  });

  // Seed Admin Role for Demo Church (and connect all permissions)
  const adminRole = await prisma.role.upsert({
    where: { id: 'demo-admin-role' },
    update: { tenantId, name: 'Admin', isCustom: false },
    create: { id: 'demo-admin-role', tenantId, name: 'Admin', description: 'Full access administrator', isCustom: false },
  });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Create Tenant Admin User
  const passHash = await bcrypt.hash('churchos-demo-password', 12);
  const email = 'admin@demo.churchos.local';
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email } },
    update: { passwordHash: passHash, status: 'active' },
    create: { tenantId, email, passwordHash: passHash, status: 'active' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  await prisma.member.upsert({
    where: { userId: adminUser.id },
    update: { firstName: 'Demo', lastName: 'Admin', membershipStatus: 'leader' },
    create: { tenantId, userId: adminUser.id, firstName: 'Demo', lastName: 'Admin', email, membershipStatus: 'leader' },
  });

  // Seed default active modules
  const modules = ['website-cms', 'theme-engine', 'member-crm'];
  for (const moduleKey of modules) {
    await prisma.moduleDefinition.upsert({
      where: { key: moduleKey },
      update: {},
      create: { key: moduleKey, name: moduleKey, category: 'Core', dependencies: '[]' },
    });
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      update: { status: 'active' },
      create: { tenantId, moduleKey, status: 'active', billingRule: 'free', usageLimits: '{}' },
    });
  }

  // 3. Create the Platform Super Admin Account
  console.log('\n👑 Seeding Platform Super Admin account...');
  const platformTenantId = 'platform-super-admin';
  await prisma.tenant.upsert({
    where: { id: platformTenantId },
    update: { name: 'ChurchOS Platform', subdomain: 'platform', status: 'active' },
    create: { id: platformTenantId, name: 'ChurchOS Platform', subdomain: 'platform', status: 'active' },
  });

  // Create global SuperAdmin Role (tenantId is null)
  const superAdminRole = await prisma.role.upsert({
    where: { id: 'platform-superadmin-role' },
    update: { tenantId: null, name: 'SuperAdmin', isCustom: false },
    create: { id: 'platform-superadmin-role', tenantId: null, name: 'SuperAdmin', description: 'Global Super Admin', isCustom: false },
  });

  // Create Super Admin User
  const superPassHash = await bcrypt.hash('churchos-super-password', 12);
  const superEmail = 'superadmin@platform.com';
  const superUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: platformTenantId, email: superEmail } },
    update: { passwordHash: superPassHash, status: 'active' },
    create: { tenantId: platformTenantId, email: superEmail, passwordHash: superPassHash, status: 'active' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superUser.id, roleId: superAdminRole.id },
  });

  console.log('\n🌟 Database Bootstrapped successfully!');
  console.log('\n🔑 Tenant Admin Credentials:');
  console.log(`   - Email:    ${email}`);
  console.log('   - Password:  churchos-demo-password');
  console.log('\n👑 Platform Super Admin Credentials:');
  console.log(`   - Email:    ${superEmail}`);
  console.log('   - Password:  churchos-super-password\n');
}

main()
  .catch((e) => {
    console.error('❌ Bootstrap failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
