import prisma from '../apps/api/src/lib/prisma';

async function main() {
  console.log("Keys in prisma client:", Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
