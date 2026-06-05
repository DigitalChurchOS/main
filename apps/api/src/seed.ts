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

  console.log('🌱 Seeding module sections...');
  const SECTIONS = [
    { id: 'core-foundation', name: 'Core Platform & Foundation', displayOrder: 1 },
    { id: 'content-media', name: 'Content, Media & Worship', displayOrder: 2 },
    { id: 'giving-commerce', name: 'Giving, Partnership & Commerce', displayOrder: 3 },
    { id: 'member-engagement', name: 'Member, Community & Engagement', displayOrder: 4 },
    { id: 'salvation-training', name: 'Salvation, Discipleship & Training', displayOrder: 5 },
    { id: 'events-meetings', name: 'Events, Meetings & Interaction', displayOrder: 6 },
    { id: 'mobile-app', name: 'Mobile & App Ecosystem', displayOrder: 7 },
    { id: 'multibranch-global', name: 'Multi-Branch & Global Infrastructure', displayOrder: 8 },
    { id: 'ai-layer', name: 'AI & Intelligence Layer', displayOrder: 9 },
  ];
  for (const sec of SECTIONS) {
    await prisma.moduleSection.upsert({
      where: { id: sec.id },
      update: { name: sec.name, displayOrder: sec.displayOrder },
      create: sec,
    });
  }
  console.log(`✅ Seeded ${SECTIONS.length} module sections.`);

  console.log('🌱 Seeding module definitions...');
  const MODULES = [
    // Section A: Core Platform & Foundation
    { key: 'website-cms', name: 'Content Management Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Core builder and content manager for church websites.', icon: 'layout', status: 'active', isAddOn: false },
    { key: 'theme-engine', name: 'Theme Engine Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Visual skin, styles, and custom typography compiler.', icon: 'palette', status: 'active', isAddOn: false },
    { key: 'user-role-management', name: 'User & Role Management Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Centralized RBAC security, staff roles, and permissions.', icon: 'users', status: 'active', isAddOn: false },
    { key: 'domain-tenant-management', name: 'Domain & Tenant Management Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Multi-tenant settings, verification, subdomains, and domains.', icon: 'globe', status: 'active', isAddOn: false },
    { key: 'billing-subscription-management', name: 'Billing & Subscription Management Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'SaaS plan selector, payment portals, and credit audits.', icon: 'credit-card', status: 'active', isAddOn: false },
    { key: 'analytics-reporting', name: 'Analytics & Reporting Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Usage analytics, visitor graphs, and active session trends.', icon: 'bar-chart', status: 'active', isAddOn: false },
    { key: 'plugin-extensions-engine', name: 'Plugin & Extensions Engine Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Core app extensions runner and sandbox hooks compiler.', icon: 'cpu', status: 'active', isAddOn: false },
    { key: 'marketplace', name: 'Marketplace Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Ecosystem plugin store for developers and third parties.', icon: 'shopping-bag', status: 'active', isAddOn: false },
    { key: 'localization-multilingual-engine', name: 'Localization & Multilingual Engine Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Translation engine mapping languages across interfaces.', icon: 'languages', status: 'active', isAddOn: false },
    { key: 'centralized-settings-engine', name: 'Centralized Settings Engine Module', category: 'Core', dependencies: '[]', sectionId: 'core-foundation', description: 'Central configuration registry mapping all setting variables.', icon: 'settings', status: 'active', isAddOn: false },

    // Section B: Content, Media & Worship
    { key: 'media', name: 'Media Module', category: 'Content', dependencies: '["website-cms"]', sectionId: 'content-media', description: 'Cloud storage library for video, audio, and slides.', icon: 'film', status: 'active', isAddOn: false },
    { key: 'livestream', name: 'Livestream Module', category: 'Content', dependencies: '["media"]', sectionId: 'content-media', description: 'RTMP stream ingestion and public live video players.', icon: 'tv', status: 'active', isAddOn: true },
    { key: 'church-services', name: 'Church Services Module', category: 'Content', dependencies: '["media"]', sectionId: 'content-media', description: 'Sunday outlines tracker, service sheets, and speaker bio tags.', icon: 'calendar', status: 'active', isAddOn: false },
    { key: 'dynamic-blog-publishing-engine', name: 'Dynamic Blog & Publishing Engine Module', category: 'Content', dependencies: '["website-cms"]', sectionId: 'content-media', description: 'Vibrant blog templates, commenting panels, and tags.', icon: 'file-text', status: 'active', isAddOn: false },
    { key: 'digital-library-resource-center', name: 'Digital Library & Resource Center Module', category: 'Content', dependencies: '[]', sectionId: 'content-media', description: 'Ebook, PDF download guides, and library categories.', icon: 'book-open', status: 'active', isAddOn: false },
    { key: 'podcast-audio-broadcasting', name: 'Podcast & Audio Broadcasting Module', category: 'Content', dependencies: '["website-cms"]', sectionId: 'content-media', description: 'Audio episode RSS generator and player embeds.', icon: 'mic', status: 'active', isAddOn: false },
    { key: 'ai-media-content', name: 'AI Media & Content Module', category: 'Content', dependencies: '["media"]', sectionId: 'content-media', description: 'AI transcription, captions writer, and summary generator.', icon: 'sparkles', status: 'active', isAddOn: true },
    { key: 'digital-signage-tv-display', name: 'Digital Signage & TV Display Module', category: 'Content', dependencies: '[]', sectionId: 'content-media', description: 'Lobby slide projector, TV screens renderer, and screens registry.', icon: 'monitor', status: 'active', isAddOn: true },
    { key: 'worship-experience', name: 'Worship Experience Module', category: 'Content', dependencies: '[]', sectionId: 'content-media', description: 'Chord library, song lyrics projector, and playlist creator.', icon: 'music', status: 'active', isAddOn: false },

    // Section C: Giving, Partnership & Commerce
    { key: 'giving-donations', name: 'Tithes & Offerings Module', category: 'Finance', dependencies: '[]', sectionId: 'giving-commerce', description: 'Stripe card reader, donation links, and tax receipts compiler.', icon: 'dollar-sign', status: 'active', isAddOn: false },
    { key: 'partnerships-contributions', name: 'Partnerships & Contributions Module', category: 'Finance', dependencies: '[]', sectionId: 'giving-commerce', description: 'Pledges logger, donor milestones, and billing updates.', icon: 'handshake', status: 'active', isAddOn: false },
    { key: 'campaigns-causes', name: 'Campaigns & Causes Module', category: 'Finance', dependencies: '[]', sectionId: 'giving-commerce', description: 'Special projects crowdfunding, thermometer charts, and updates.', icon: 'heart', status: 'active', isAddOn: false },
    { key: 'ecommerce-store', name: 'E-Commerce / Church Store Module', category: 'Finance', dependencies: '[]', sectionId: 'giving-commerce', description: 'Bookstore checkout, digital downloads delivery, and orders tracker.', icon: 'shopping-cart', status: 'active', isAddOn: true },
    { key: 'financial-management-accounting', name: 'Financial Management & Accounting Module', category: 'Finance', dependencies: '[]', sectionId: 'giving-commerce', description: 'Expense ledger, budget targets tracker, and payouts log.', icon: 'calculator', status: 'active', isAddOn: true },

    // Section D: Member, Community & Engagement
    { key: 'ministry-funnels-landing-pages', name: 'Ministry Funnels & Landing Pages Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Conversion landing pages, signup forms, and analytics.', icon: 'filter', status: 'active', isAddOn: false },
    { key: 'member-management', name: 'Member Management Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Congregation member profiles registry and tagging panels.', icon: 'user-check', status: 'active', isAddOn: false },
    { key: 'community-engagement', name: 'Community & Engagement Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Social discussion channels, reactions system, and comments.', icon: 'message-square', status: 'active', isAddOn: false },
    { key: 'member-crm', name: 'Ministry CRM Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Pipeline stages, follow-up alerts, and visitor assigner.', icon: 'users-round', status: 'active', isAddOn: false },
    { key: 'communication-notification-followup', name: 'Communication, Notification & Follow-Up Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Bulk SMS sender, Resend mailings compiler, and push notifications.', icon: 'mail', status: 'active', isAddOn: false },
    { key: 'live-chat-pastoral-care', name: 'Live Chat, Pastoral Care & Support Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Counselling chats box and pastoral care tickets board.', icon: 'heart-handshake', status: 'active', isAddOn: true },
    { key: 'member-outreach-invite', name: 'Member Outreach & Invite Campaign Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Digital flyers share buttons and clicks velocity analytics.', icon: 'send', status: 'active', isAddOn: false },
    { key: 'check-in-attendance', name: 'Check-In & Attendance Management Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Kiosk scanner, visitor printer, and attendance logging.', icon: 'check-square', status: 'active', isAddOn: false },
    { key: 'volunteer-workforce', name: 'Volunteer & Workforce Management Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Roster builder, shift scheduling, and reminders scheduler.', icon: 'briefcase', status: 'active', isAddOn: false },
    { key: 'forms-workflow-automation', name: 'Forms & Workflow Automation Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Form constructor, approval paths, and webhook integrations.', icon: 'clipboard', status: 'active', isAddOn: false },
    { key: 'prayer-testimony', name: 'Prayer & Testimony Module', category: 'Engagement', dependencies: '[]', sectionId: 'member-engagement', description: 'Prayer requests wall, testimony submissions box, and logs.', icon: 'sparkles', status: 'active', isAddOn: false },

    // Section E: Salvation, Discipleship & Training
    { key: 'salvation-new-believer-journey', name: 'Salvation & New Believer Journey Module', category: 'Discipleship', dependencies: '[]', sectionId: 'salvation-training', description: 'First steps checklist, discipleship tracks, and CRM assigner.', icon: 'smile', status: 'active', isAddOn: false },
    { key: 'lms-discipleship-training', name: 'LMS & Discipleship Training Module', category: 'Discipleship', dependencies: '[]', sectionId: 'salvation-training', description: 'Quizzes compiler, course player, and assignments tracker.', icon: 'graduation-cap', status: 'active', isAddOn: false },
    { key: 'bible-scripture-engagement', name: 'Bible & Scripture Engagement Module', category: 'Discipleship', dependencies: '[]', sectionId: 'salvation-training', description: 'Bible search, reading plans tracker, and verses tags.', icon: 'book', status: 'active', isAddOn: false },
    { key: 'cell-fellowship', name: 'Cell / Fellowship Module', category: 'Discipleship', dependencies: '["member-crm"]', sectionId: 'salvation-training', description: 'Home cells map finder, attendance tracker, and scorecards.', icon: 'home', status: 'active', isAddOn: false },
    { key: 'children-family-ministry', name: 'Children & Family Ministry Module', category: 'Discipleship', dependencies: '[]', sectionId: 'salvation-training', description: 'Guardian linkages, children classrooms assigner, and logs.', icon: 'baby', status: 'active', isAddOn: false },

    // Section F: Events, Meetings & Interaction
    { key: 'events-registration', name: 'Events & Registration Module', category: 'Meetings', dependencies: '[]', sectionId: 'events-meetings', description: 'Ticket sales checkout, badge printer, and RSVP lists.', icon: 'calendar-days', status: 'active', isAddOn: false },
    { key: 'live-meetings', name: 'Live Meetings Module', category: 'Meetings', dependencies: '[]', sectionId: 'events-meetings', description: 'Zoom SDK calls room, LiveKit meetings panel, and chats.', icon: 'video', status: 'active', isAddOn: true },
    { key: 'booking-appointment-management', name: 'Booking & Appointment Management Module', category: 'Meetings', dependencies: '[]', sectionId: 'events-meetings', description: 'Staff availability grids, client scheduler, and reminders.', icon: 'clock', status: 'active', isAddOn: false },

    // Section G: Mobile & App Ecosystem
    { key: 'mobile-app-access', name: 'Mobile App Access Module', category: 'Mobile', dependencies: '[]', sectionId: 'mobile-app', description: 'JSON backend mappings, push tokens logger, and app config.', icon: 'smartphone', status: 'active', isAddOn: false },
    { key: 'dedicated-whitelabel-app', name: 'Dedicated White-Label Church App Module', category: 'Mobile', dependencies: '[]', sectionId: 'mobile-app', description: 'White-label app compiler details and builds registry.', icon: 'app-window', status: 'active', isAddOn: true },

    // Section H: Multi-Branch & Global Infrastructure
    { key: 'multibranch-multicampus', name: 'Multi-Branch / Multi-Campus Management Module', category: 'Global', dependencies: '[]', sectionId: 'multibranch-global', description: 'Multi-campus structures logger and regional pastors table.', icon: 'git-fork', status: 'active', isAddOn: true },
    { key: 'advanced-translation-multilingual', name: 'Advanced Translation & Multilingual Module', category: 'Global', dependencies: '[]', sectionId: 'multibranch-global', description: 'AI page translator and translation jobs database.', icon: 'languages', status: 'active', isAddOn: true },

    // Section I: AI & Intelligence Layer
    { key: 'ai-assistant-ministry-copilot', name: 'AI Assistant / Ministry Copilot Module', category: 'Intelligence', dependencies: '[]', sectionId: 'ai-layer', description: 'Ministry copilot chat prompts and AI assistant jobs logger.', icon: 'brain', status: 'active', isAddOn: true }
  ];

  for (const mod of MODULES) {
    await prisma.moduleDefinition.upsert({
      where: { key: mod.key },
      update: {
        name: mod.name,
        category: mod.category,
        dependencies: mod.dependencies,
        sectionId: mod.sectionId,
        description: mod.description,
        icon: mod.icon,
        status: mod.status,
        isAddOn: mod.isAddOn
      },
      create: {
        key: mod.key,
        name: mod.name,
        category: mod.category,
        dependencies: mod.dependencies,
        sectionId: mod.sectionId,
        description: mod.description,
        icon: mod.icon,
        status: mod.status,
        isAddOn: mod.isAddOn
      },
    });
  }
  console.log(`✅ Seeded ${MODULES.length} modules.`);

  console.log('🌱 Seeding platform permissions...');
  const PLATFORM_PERMISSIONS = [
    { name: 'platform.read', description: 'Read platform statistics, tenants and configurations' },
    { name: 'platform.write', description: 'Create and edit platform configurations, tenants and plans' },
    { name: 'platform.admin', description: 'Perform dangerous destructive operations like suspending/archiving tenants' },
  ];
  for (const perm of PLATFORM_PERMISSIONS) {
    await prisma.platformPermission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ Seeded ${PLATFORM_PERMISSIONS.length} platform permissions.`);

  console.log('🌱 Seeding platform roles...');
  const roleName = 'Super Admin';
  const superAdminRole = await prisma.platformRole.upsert({
    where: { name: roleName },
    update: { description: 'Full access platform administrator' },
    create: {
      name: roleName,
      description: 'Full access platform administrator',
    },
  });
  console.log(`✅ Seeded ${roleName} platform role.`);

  // Link all platform permissions to Super Admin role
  const dbPlatformPerms = await prisma.platformPermission.findMany();
  for (const p of dbPlatformPerms) {
    await prisma.platformRolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: p.id,
      },
    });
  }
  console.log('✅ Linked permissions to Platform Role.');

  console.log('🌱 Seeding default super-admin user...');
  const adminEmail = 'superadmin@churchos.local';
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash('Password123!', 12);
  
  await prisma.platformUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      roleId: superAdminRole.id,
    },
    create: {
      email: adminEmail,
      passwordHash,
      roleId: superAdminRole.id,
      status: 'active',
    },
  });
  console.log(`✅ Seeded default platform user: ${adminEmail} (password: Password123!)`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
