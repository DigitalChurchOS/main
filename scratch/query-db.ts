import prisma from '../apps/api/src/lib/prisma';

async function main() {
  console.log("=== Tenants ===");
  const tenants = await prisma.tenant.findMany({
    include: {
      users: true,
      tenantModules: true
    }
  });
  console.log(JSON.stringify(tenants, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
