const path = require('path');

const { PrismaClient } = require(path.join(process.cwd(), 'src/generated/prisma/client'));
const { PrismaLibSql } = require('@prisma/adapter-libsql');

try {
  const url = 'file:prisma/dev.db';
  console.log('Connecting to PrismaLibSql with config URL:', url);

  const adapter = new PrismaLibSql({ url });
  const prisma = new PrismaClient({ adapter });
  
  console.log('Successfully instantiated PrismaClient using PrismaLibSql adapter!');
  
  // Try running a fast query to check if connection works
  prisma.tenant.findMany({ take: 1 })
    .then(res => {
      console.log('Database query successful! Result count:', res.length);
      process.exit(0);
    })
    .catch(err => {
      console.error('Database query failed:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Failed to initialize PrismaLibSql:', err);
  process.exit(1);
}
