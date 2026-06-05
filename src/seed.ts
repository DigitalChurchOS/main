import prisma from './lib/prisma';

/**
 * Seed Script
 * -----------
 * Populates the Permission table with the baseline permission keys
 * required by the kernel RBAC system. Safe to run multiple times
 * (upserts by unique `name`).
 */
const PERMISSIONS = [
  // Member module
  { name: 'member.create', description: 'Create new member profiles' },
  { name: 'member.read', description: 'View member profiles' },
  { name: 'member.update', description: 'Edit member profiles' },
  { name: 'member.delete', description: 'Delete member profiles' },

  // Branch module
  { name: 'branch.create', description: 'Create new branches / campuses' },
  { name: 'branch.read', description: 'View branch details' },
  { name: 'branch.update', description: 'Edit branch details' },
  { name: 'branch.delete', description: 'Delete branches' },

  // Role management
  { name: 'role.create', description: 'Create custom roles' },
  { name: 'role.read', description: 'View roles and permissions' },
  { name: 'role.update', description: 'Modify role permissions' },
  { name: 'role.delete', description: 'Delete custom roles' },

  // User management
  { name: 'user.create', description: 'Invite new users' },
  { name: 'user.read', description: 'View user accounts' },
  { name: 'user.update', description: 'Edit user accounts' },
  { name: 'user.delete', description: 'Deactivate user accounts' },

  // Tenant administration
  { name: 'tenant.settings', description: 'Manage church/tenant settings' },

  // Churchfront module
  { name: 'core-website-cms.read', description: 'View Churchfront pages, menus, reusable sections, and settings' },
  { name: 'core-website-cms.create', description: 'Create Churchfront pages and reusable sections' },
  { name: 'core-website-cms.update', description: 'Edit Churchfront pages, navigation, footers, and reusable sections' },
  { name: 'core-website-cms.delete', description: 'Delete or deactivate Churchfront records' },
  { name: 'core-website-cms.manage_settings', description: 'Manage Churchfront module configuration' },
  { name: 'core-website-cms.view_reports', description: 'View Churchfront analytics and activity reports' },

  // Theme Engine module
  { name: 'theme-engine.read', description: 'View Theme Engine themes, templates, previews, and settings' },
  { name: 'theme-engine.create', description: 'Install themes and create Theme Engine templates or records' },
  { name: 'theme-engine.update', description: 'Customize, preview, and activate Theme Engine themes' },
  { name: 'theme-engine.delete', description: 'Delete or deactivate Theme Engine records' },
  { name: 'theme-engine.manage_settings', description: 'Manage Theme Engine billing, provider, and publishing settings' },
  { name: 'theme-engine.view_reports', description: 'View Theme Engine activity and analytics reports' },

  // Media module
  { name: 'media.read', description: 'View media library assets, playlists, providers, templates, and settings' },
  { name: 'media.create', description: 'Create media records, uploads, categories, speakers, series, tags, and playlists' },
  { name: 'media.update', description: 'Edit media records, metadata, playlists, provider routing, and publication status' },
  { name: 'media.delete', description: 'Archive or remove media records and playlist entries' },
  { name: 'media.manage_settings', description: 'Manage Media Module billing, provider, upload, and publishing settings' },
  { name: 'media.view_reports', description: 'View Media Module activity, usage, playback, and storage reports' },

  // Church Services module
  { name: 'church-services.read', description: 'View church service records, templates, archive data, settings, and linked resources' },
  { name: 'church-services.create', description: 'Create service records, recurring schedules, scriptures, and service attachments' },
  { name: 'church-services.update', description: 'Edit service details, workflow status, linked media, attendance, giving, and response totals' },
  { name: 'church-services.delete', description: 'Archive or remove church service records and linked materials' },
  { name: 'church-services.manage_settings', description: 'Manage Church Services module settings, defaults, providers, billing, and workflow rules' },
  { name: 'church-services.view_reports', description: 'View Church Services reports, activity history, archive metrics, and engagement summaries' },

  // Billing & Subscription Management module
  { name: 'billing-subscription-management.read', description: 'View billing plans, usage, invoices, coupons, and add-ons' },
  { name: 'billing-subscription-management.create', description: 'Create billing records, coupons, add-ons, usage records, and invoices' },
  { name: 'billing-subscription-management.update', description: 'Update subscriptions, billing records, coupons, add-ons, and payment status' },
  { name: 'billing-subscription-management.delete', description: 'Delete or deactivate billing records' },
  { name: 'billing-subscription-management.manage_settings', description: 'Manage billing module settings, providers, and entitlements' },
  { name: 'billing-subscription-management.view_reports', description: 'View billing activity and financial reports' },

  // Developer Marketplace module
  { name: 'developer-marketplace.read', description: 'View Developer Marketplace records, submissions, sandbox tenants, payouts, and configurations' },
  { name: 'developer-marketplace.create', description: 'Register as developer, submit asset versions, create sandbox tenants, and register custom profiles' },
  { name: 'developer-marketplace.update', description: 'Modify developer marketplace records and details securely' },
  { name: 'developer-marketplace.delete', description: 'Remove or deactivate developer marketplace records' },
  { name: 'developer-marketplace.manage_settings', description: 'Manage Developer Marketplace module configuration' },
  { name: 'developer-marketplace.view_reports', description: 'View Developer Marketplace audit logs, sales splits, and payout reports' },

  // Church Details module
  { name: 'domain-tenant-management.read', description: 'View Church Details settings, modules, checklist, and activities' },
  { name: 'domain-tenant-management.create', description: 'Create Church Details records' },
  { name: 'domain-tenant-management.update', description: 'Modify Church Details configurations and records' },
  { name: 'domain-tenant-management.delete', description: 'Remove Church Details records' },
  { name: 'domain-tenant-management.manage_settings', description: 'Manage Church Details module settings' },
  { name: 'domain-tenant-management.view_reports', description: 'View Church Details audit logs and checklist reports' },

  // Digital Library & Resource Center Module
  { name: 'digital-library-resource-center.read', description: 'View Digital Library resources, categories, details, settings, and activity history' },
  { name: 'digital-library-resource-center.create', description: 'Create new categories and upload new digital library resources' },
  { name: 'digital-library-resource-center.update', description: 'Modify digital library categories, resources, profiles, and configurations' },
  { name: 'digital-library-resource-center.delete', description: 'Remove category links or soft-delete/archive library resources' },
  { name: 'digital-library-resource-center.manage_settings', description: 'Manage Digital Library configuration keys, billing configurations, and integration rules' },
  { name: 'digital-library-resource-center.view_reports', description: 'View Digital Library downloads counts, sales reports, and activity logs' },

  // Dynamic Blog & Publishing Engine Module
  { name: 'dynamic-blog-publishing-engine.read', description: 'View Dynamic Blog channels, categories, tags, posts, comments, settings, and activity reports' },
  { name: 'dynamic-blog-publishing-engine.create', description: 'Create new blogs, posts, categories, and tags' },
  { name: 'dynamic-blog-publishing-engine.update', description: 'Modify blog channels, posts, comments status, and configurations' },
  { name: 'dynamic-blog-publishing-engine.delete', description: 'Remove or archive blog channels, posts, comments, categories, or tags' },
  { name: 'dynamic-blog-publishing-engine.manage_settings', description: 'Manage Dynamic Blog configuration keys, billing plan, and integration rules' },
  { name: 'dynamic-blog-publishing-engine.view_reports', description: 'View Dynamic Blog comments, metrics, and activity history logs' },

  // Livestream Module
  { name: 'livestream.read', description: 'View livestream broadcasts, schedules, chat logs, settings, and performance reports' },
  { name: 'livestream.create', description: 'Schedule new livestream broadcasts and define countdown configuration' },
  { name: 'livestream.update', description: 'Start, stop, or edit scheduled livestream broadcasts and replay archives' },
  { name: 'livestream.delete', description: 'Remove or archive livestream broadcasts and replay assets' },
  { name: 'livestream.manage_settings', description: 'Configure livestream provider settings, CTA rules, chat, and attachment preferences' },
  { name: 'livestream.view_reports', description: 'View livestream concurrent viewers, engagement funnels, and interaction logs' },

  // Podcast & Audio Broadcasting Module permissions
  { name: 'podcast-audio-broadcasting.read', description: 'View podcast channels, episodes, playlists, speakers, and settings' },
  { name: 'podcast-audio-broadcasting.create', description: 'Create podcast channels, episodes, playlists, speakers, and series' },
  { name: 'podcast-audio-broadcasting.update', description: 'Modify podcast channels, episodes, playlists, speakers, series, and settings' },
  { name: 'podcast-audio-broadcasting.delete', description: 'Delete or archive podcast channels, episodes, playlists, speakers, or series' },
  { name: 'podcast-audio-broadcasting.manage_settings', description: 'Manage Podcast & Audio settings' },
  { name: 'podcast-audio-broadcasting.view_reports', description: 'View podcast analytics and listener activity reports' },

  // Cell / Fellowship module permissions
  { name: 'cell-fellowship.read', description: 'View cell groups, rosters, meetings, notice boards, and member portals' },
  { name: 'cell-fellowship.create', description: 'Create cell groups, group types, meetings, notices, and invite links' },
  { name: 'cell-fellowship.update', description: 'Update cells, assign leaders, transfer members, log attendance, and submit reports' },
  { name: 'cell-fellowship.delete', description: 'Archive, deactivate, or remove cell fellowship records' },
  { name: 'cell-fellowship.manage_settings', description: 'Manage cell hierarchy, public access, scorecards, maps, and integration settings' },
  { name: 'cell-fellowship.view_reports', description: 'View cell analytics, scorecards, audit activity, and promotion recommendations' },
];


const PROVIDER_CATEGORIES = [
  { id: 'payment', name: 'Payment Gateway' },
  { id: 'sms', name: 'SMS Gateway' },
  { id: 'media_storage', name: 'Media Storage' },
  { id: 'video_streaming', name: 'Video Streaming Integration' },
  { id: 'ai_copilot', name: 'AI Copilot Gateway' },
];

const PROVIDERS = [
  { id: 'stripe', categoryId: 'payment', name: 'Stripe Payment Engine' },
  { id: 'paystack', categoryId: 'payment', name: 'Paystack Checkout' },
  { id: 'twilio', categoryId: 'sms', name: 'Twilio SMS' },
  { id: 'africastalking', categoryId: 'sms', name: "Africa's Talking Gateway" },
  { id: 'cloudinary', categoryId: 'media_storage', name: 'Cloudinary Media Library' },
  { id: 'aws_s3', categoryId: 'media_storage', name: 'AWS S3 Storage' },
  { id: 'cloudflare_r2', categoryId: 'media_storage', name: 'Cloudflare R2 Bucket' },
  { id: 'bunny_storage', categoryId: 'media_storage', name: 'Bunny Storage' },
  { id: 'wasabi', categoryId: 'media_storage', name: 'Wasabi Object Storage' },
  { id: 'backblaze_b2', categoryId: 'media_storage', name: 'Backblaze B2 Storage' },
  { id: 'vimeo', categoryId: 'video_streaming', name: 'Vimeo Video Cloud' },
  { id: 'mux', categoryId: 'video_streaming', name: 'Mux Video' },
  { id: 'youtube', categoryId: 'video_streaming', name: 'YouTube Video Links' },
  { id: 'livekit', categoryId: 'video_streaming', name: 'LiveKit WebRTC' },
  { id: 'openai', categoryId: 'ai_copilot', name: 'OpenAI Copilot' },
  { id: 'gemini', categoryId: 'ai_copilot', name: 'Google Gemini AI' },
];

async function seed() {
  console.log('🌱 Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ Seeded ${PERMISSIONS.length} permissions.`);

  console.log('🌱 Seeding provider categories...');
  for (const cat of PROVIDER_CATEGORIES) {
    await prisma.providerCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: cat,
    });
  }
  console.log(`✅ Seeded ${PROVIDER_CATEGORIES.length} categories.`);

  console.log('🌱 Seeding providers...');
  for (const prov of PROVIDERS) {
    await prisma.provider.upsert({
      where: { id: prov.id },
      update: { name: prov.name, categoryId: prov.categoryId },
      create: prov,
    });
  }
  console.log(`✅ Seeded ${PROVIDERS.length} providers.`);

  console.log('🌱 Seeding module definitions...');
  const MODULES = [
    { key: 'website-cms', name: 'Churchfront', category: 'Core', dependencies: '[]' },
    { key: 'theme-engine', name: 'Theme Engine', category: 'Core', dependencies: '[]' },
    { key: 'billing-subscription-management', name: 'Billing & Subscription Management', category: 'Admin', dependencies: '[]' },
    { key: 'member-crm', name: 'Member CRM', category: 'Engagement', dependencies: '[]' },
    { key: 'media', name: 'Media Module', category: 'Content', dependencies: '["website-cms"]' },
    { key: 'media-sermons', name: 'Media Streaming & Sermons', category: 'Content', dependencies: '["website-cms"]' },
    { key: 'church-services', name: 'Church Services', category: 'Content', dependencies: '["media"]' },
    { key: 'giving-donations', name: 'Tithes & Offerings', category: 'Finance', dependencies: '[]' },
    { key: 'developer-marketplace', name: 'Developer Marketplace', category: 'Core', dependencies: '[]' },
    { key: 'domain-tenant-management', name: 'Church Details', category: 'Core', dependencies: '[]' },
    { key: 'digital-library-resource-center', name: 'Digital Library & Resource Center', category: 'Content', dependencies: '[]' },
    { key: 'dynamic-blog-publishing-engine', name: 'Dynamic Blog & Publishing Engine', category: 'Content', dependencies: '[]' },
    { key: 'livestream', name: 'Livestream Module', category: 'Content', dependencies: '["media"]' },
    { key: 'podcast-audio-broadcasting', name: 'Podcast & Audio Broadcasting', category: 'Content', dependencies: '["website-cms"]' },
    { key: 'bible', name: 'Scripture Engagement Module', category: 'Discipleship', dependencies: '[]' },
    { key: 'cell-fellowship', name: 'Cell / Fellowship Module', category: 'Discipleship', dependencies: '["member-crm","lms","giving-donations","live-meetings"]' },
  ];
  for (const mod of MODULES) {
    await prisma.moduleDefinition.upsert({
      where: { key: mod.key },
      update: { name: mod.name, category: mod.category, dependencies: mod.dependencies },
      create: mod,
    });
  }
  console.log(`✅ Seeded ${MODULES.length} modules.`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
