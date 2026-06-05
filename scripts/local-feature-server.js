const fs = require('fs');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'churchos-dev-secret-change-in-production';
process.env.VAULT_SECRET = process.env.VAULT_SECRET || 'churchos-vault-secret-change-in-production';

const apiApp = require('../dist/app').default;
const prisma = require('../dist/lib/prisma').default;

const port = Number(process.env.PORT || 3100);
const tenantId = 'demo-church-local';
const adminEmail = 'admin@demo.churchos.local';
const adminPassword = 'churchos-demo-password';

function readSourcePermissions() {
  const srcDir = path.resolve(__dirname, '..', 'src');
  const permissions = new Set([
    'member.create',
    'member.read',
    'member.update',
    'member.delete',
    'tenant.settings',
    'role.create',
    'role.read',
    'role.update',
    'role.delete',
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
  ]);
  const modules = new Set(['website-cms', 'ministry-funnels', 'ai-assistant-ministry-copilot', 'domain-tenant-management']);

  for (const file of fs.readdirSync(path.join(srcDir, 'routes'))) {
    if (!file.endsWith('.ts')) continue;
    const text = fs.readFileSync(path.join(srcDir, 'routes', file), 'utf8');
    for (const match of text.matchAll(/requirePermission\(([\s\S]*?)\)/g)) {
      for (const key of match[1].matchAll(/['"`]([^'"`]+)['"`]/g)) {
        permissions.add(key[1]);
      }
    }
    for (const match of text.matchAll(/requireModule\(([\s\S]*?)\)/g)) {
      for (const key of match[1].matchAll(/['"`]([^'"`]+)['"`]/g)) {
        modules.add(key[1]);
      }
    }
  }

  return { permissions: Array.from(permissions), modules: Array.from(modules) };
}

async function upsertDemoData() {
  const { permissions, modules } = readSourcePermissions();

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'Demo Church', subdomain: 'demo', status: 'active' },
    create: { id: tenantId, name: 'Demo Church', subdomain: 'demo', status: 'active' },
  });

  const plan = await prisma.subscriptionPlan.upsert({
    where: { id: 'demo-plan' },
    update: {
      name: 'Demo Unlimited',
      basePrice: 49,
      includedMembers: 100000,
      includedSms: 100000,
      includedStorageGb: 1000,
      memberOverageRate: 0,
      smsOverageRate: 0,
      storageOverageRate: 0,
      isActive: true,
    },
    create: {
      id: 'demo-plan',
      name: 'Demo Unlimited',
      basePrice: 49,
      includedMembers: 100000,
      includedSms: 100000,
      includedStorageGb: 1000,
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
    update: { planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: nextMonth },
    create: { tenantId, planId: plan.id, status: 'active', currentPeriodStart: now, currentPeriodEnd: nextMonth },
  });

  for (const name of permissions) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: `Demo permission for ${name}` },
    });
  }

  const role = await prisma.role.upsert({
    where: { id: 'demo-admin-role' },
    update: { tenantId, name: 'Demo Admin', isCustom: false },
    create: { id: 'demo-admin-role', tenantId, name: 'Demo Admin', description: 'Local preview administrator', isCustom: false },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: adminEmail } },
    update: { passwordHash, status: 'active' },
    create: { tenantId, email: adminEmail, passwordHash, status: 'active' },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  await prisma.member.upsert({
    where: { userId: user.id },
    update: { firstName: 'Demo', lastName: 'Admin', membershipStatus: 'leader' },
    create: { tenantId, userId: user.id, firstName: 'Demo', lastName: 'Admin', email: adminEmail, membershipStatus: 'leader' },
  });

  for (const moduleKey of modules) {
    await prisma.moduleDefinition.upsert({
      where: { key: moduleKey },
      update: {},
      create: { key: moduleKey, name: moduleKey, category: 'Demo', dependencies: '[]' },
    });
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      update: { status: 'active' },
      create: { tenantId, moduleKey, status: 'active', billingRule: 'free', usageLimits: '{}' },
    });
  }

  const token = jwt.sign({ userId: user.id, tenantId, email: adminEmail }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { tenantId: tenant.id, email: adminEmail, password: adminPassword, token, modules: modules.length, permissions: allPermissions.length };
}

const host = express();
host.use(express.json({ limit: '1mb' }));

host.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'feature-console.html'));
});

host.get('/feature-console.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'feature-console.html'));
});

host.post('/dev/bootstrap', async (_req, res) => {
  try {
    res.json(await upsertDemoData());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

host.use(apiApp);

host.listen(port, () => {
  console.log(`ChurchOS feature console running at http://localhost:${port}`);
});
