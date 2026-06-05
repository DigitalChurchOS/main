import prisma from './lib/prisma';
import { seedDemoTenant } from './seed-demo-helper';

async function main() {
  console.log('🌱 Seeding demo tenant...');
  
  // Clean up existing records for clean seeding
  await prisma.pluginWebhook.deleteMany({});
  await prisma.tenantPlugin.deleteMany({});
  await prisma.pluginDefinition.deleteMany({});
  await prisma.pageRevision.deleteMany({});
  await prisma.page.deleteMany({});
  await prisma.website.deleteMany({});
  await prisma.theme.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenantModule.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.eventCategory.deleteMany({});
  await prisma.givingCategory.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.recurringGiving.deleteMany({});
  await prisma.mediaAsset.deleteMany({});
  await prisma.mediaCategory.deleteMany({});
  await prisma.mediaTag.deleteMany({});
  await prisma.mediaSeries.deleteMany({});
  await prisma.speaker.deleteMany({});
  await prisma.livestream.deleteMany({});
  await prisma.livestreamModuleSettings.deleteMany({});
  await prisma.prayerSession.deleteMany({});
  await prisma.testimony.deleteMany({});
  await prisma.lmsLesson.deleteMany({});
  await prisma.lmsModule.deleteMany({});
  await prisma.lmsCourse.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.groupType.deleteMany({});
  await prisma.groupSettings.deleteMany({});
  await prisma.tenant.deleteMany({});

  const result = await seedDemoTenant('grace-fellowship');
  console.log('✅ Seeded demo tenant successfully:', result);

  // Seed a suspended tenant too for suspension testing
  const suspendedResult = await seedDemoTenant('suspended-church', true);
  console.log('✅ Seeded suspended tenant successfully:', suspendedResult);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Demo seeding failed:', err);
  process.exit(1);
});
