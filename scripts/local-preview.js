const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleSuperAdminApi } = require('./local-super-admin-preview');

const root = path.resolve(__dirname, '..');
const customizerEcclesiaFullTheme = path.join(root, 'theme-customizer', 'public', 'themes', 'ecclesia-full-theme');
const rootEcclesiaFullTheme = path.join(root, 'ecclesia-full-theme');
const ecclesiaFullTheme = fs.existsSync(customizerEcclesiaFullTheme) ? customizerEcclesiaFullTheme : rootEcclesiaFullTheme;
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
};

const demoTenantId = 'demo-church-local';
const demoWebsiteId = 'christ-embassy-next-main';
const now = () => new Date().toISOString();
const localEcclesiaGlobalContent = {
  churchIdentity: {
    churchName: 'Demo Church',
    tagline: 'A place to belong, grow, serve, and encounter God.',
    description: 'A Spirit-filled, digital-first church community built for worship, discipleship, prayer, media, giving, and outreach.',
    logoUrl: '',
    faviconUrl: '',
  },
  leadership: {
    leadPastor: 'Pastor Daniel Okafor',
    pastorBio: 'Leads teaching, pastoral care, and strategic ministry development.',
    pastorImage: '',
  },
  contact: {
    phone: '+1 555 000 0000',
    email: 'hello@nextchurch.local',
    address: 'Next Church Campus, 221 Victory Avenue, Lagos',
    mapUrl: '',
  },
  social: {
    facebook: 'https://facebook.com/christembassynext',
    instagram: 'https://instagram.com/christembassynext',
    youtube: 'https://youtube.com/@christembassynext',
    tiktok: '',
    x: '',
    linkedIn: '',
  },
  services: {
    serviceTimes: [
      { label: 'Sunday Celebration Service', time: '9:00 AM and 11:30 AM', location: 'Main Auditorium' },
      { label: 'Wednesday Word & Prayer', time: '7:00 PM', location: 'Main Campus and online' },
    ],
    serviceLocations: [
      { name: 'Next Church Campus', address: '221 Victory Avenue, Lagos' },
    ],
  },
  callsToAction: {
    primary: { label: 'Plan a Visit', url: '/new-visitor' },
    secondary: { label: 'Watch Live', url: '/livestream' },
    giving: { label: 'Give Now', url: '/giving' },
  },
};
const localEcclesiaThemeSettings = {
  metadata: { key: 'ecclesia', name: 'Ecclesia', version: '1.0.0', systemTheme: true, builderFirst: true, sourcePackage: 'ecclesia-full-theme' },
  sourcePackage: {
    assetBase: '/themes/ecclesia',
    previewUrl: '/themes/ecclesia/index.html',
    localPath: 'ecclesia-full-theme',
    pages: [
      'index.html', 'about.html', 'sermons.html', 'events.html', 'ministries.html', 'prayer.html', 'contact.html',
      'login.html', 'account.html',
      'giving.html', 'giving-partnership.html', 'livestream-page.html', 'media-archive.html', 'media-single.html',
      'podcast-archive.html', 'podcast-episode.html', 'blog-archive.html', 'blog-single.html', 'services-archive.html',
      'service-single.html', 'library-archive.html', 'resource-single.html', 'courses-archive.html', 'course-main.html',
      'lesson-single.html', 'events-archive.html', 'event-single.html', 'event-register.html', 'prayer-home.html',
      'prayer-wall.html', 'prayer-room.html', 'testimony-wall.html', 'testimony-single.html', 'testimony-submit.html',
      'worship.html'
    ],
    stylesheets: [
      '/themes/ecclesia/assets/styles.css',
      '/themes/ecclesia/assets/media.css',
      '/themes/ecclesia/assets/livestream.css',
      '/themes/ecclesia/assets/podcast.css',
      '/themes/ecclesia/assets/blog.css',
      '/themes/ecclesia/assets/events.css',
      '/themes/ecclesia/assets/giving.css',
      '/themes/ecclesia/assets/library.css',
      '/themes/ecclesia/assets/lms.css',
      '/themes/ecclesia/assets/prayer.css',
      '/themes/ecclesia/assets/services.css',
      '/themes/ecclesia/assets/worship.css'
    ],
    scripts: [
      '/themes/ecclesia/assets/app.js',
      '/themes/ecclesia/assets/media.js',
      '/themes/ecclesia/assets/livestream.js',
      '/themes/ecclesia/assets/podcast.js',
      '/themes/ecclesia/assets/blog.js',
      '/themes/ecclesia/assets/events.js',
      '/themes/ecclesia/assets/giving.js',
      '/themes/ecclesia/assets/library.js',
      '/themes/ecclesia/assets/lms.js',
      '/themes/ecclesia/assets/prayer.js',
      '/themes/ecclesia/assets/services.js',
      '/themes/ecclesia/assets/worship.js'
    ]
  },
  colorMode: 'light',
  accentPreset: 'orange',
  typographyPreset: 'sans',
  edgeStyle: 'smooth',
  glassHeader: true,
  themeGlow: false,
  pageBodyWidth: 'full',
  design: { colorMode: 'light', accentPreset: 'orange', colorPalette: 'warm', typographyPreset: 'sans', fontPairing: 'outfitInter', glow: false, glass: true, layout: false },
  colors: {
    primary: '#f97316',
    secondary: '#0f172a',
    accent: '#f97316',
    accentSecondary: '#facc15',
    accentSoft: 'rgba(249,115,22,.14)',
    background: '#fffaf3',
    surface: '#ffffff',
    mutedSurface: '#f6efe6',
    textPrimary: '#1d1812',
    textSecondary: '#74685e',
    border: 'rgba(29,24,18,.12)',
    gradientA: '#fff7ed',
    gradientB: '#ffedd5',
    gradientC: '#fed7aa',
  },
  fonts: { heading: 'Outfit', body: 'Inter' },
  typography: { headingFont: 'Outfit', bodyFont: 'Inter', fontScale: 'fluid', lineHeight: '1.55', letterSpacing: '0' },
  layout: { contentWidth: '1180px', headerStyle: 'sticky', footerStyle: 'expanded', mobileLayout: 'stacked', sectionPadding: '104px', pageBodyWidth: 'full' },
  components: { buttonStyle: 'solid', cardStyle: 'shadow', borderRadius: '34px', edgeStyle: 'smooth', shadowDepth: 'soft' },
  motion: { animationLevel: 'subtle', transitionSpeed: '220ms' },
  header: { style: 'sticky', logoDisplay: 'markAndName', glass: true, ctaLabel: 'Watch Live', ctaUrl: '/livestream' },
  footer: { style: 'expanded' },
  customizer: {
    storageKey: 'ecclesia-theme-customizer',
    defaults: { mode: 'light', accent: 'orange', font: 'sans', radius: 'smooth', glow: false, glass: true, layout: false },
    controls: {
      mode: ['light', 'dark', 'sepia', 'slate'],
      accent: ['orange', 'blue', 'green', 'red', 'purple', 'rose'],
      font: ['sans', 'serif', 'geometric', 'slab'],
      radius: ['sharp', 'medium', 'smooth', 'pillow']
    }
  },
  websiteSettings: { homepageSlug: '', notFoundSlug: '404', maintenanceMode: false, language: 'en', rtlReady: true },
  seo: { openGraph: true, twitterCards: true, canonicalUrls: true, structuredData: true, sitemap: true, robots: 'index,follow' },
};
const state = {
  themes: [
    {
      id: 'theme-ecclesia',
      name: 'Ecclesia',
      tenantId: demoTenantId,
      isCustom: false,
      settings: localEcclesiaThemeSettings,
      createdAt: now(),
    },
  ],
  websites: [
    {
      id: demoWebsiteId,
      title: 'Demo Church',
      description: 'Digital-first demo church for testing every ChurchOS website and ministry workflow.',
      domain: 'nextchurch.churched.online',
      themeId: 'theme-ecclesia',
      createdAt: now(),
    },
  ],
  themeEngineSettings: {
    id: 'theme-engine-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'theme-engine',
    enabled: true,
    billingPlan: 'premium',
    providerMode: 'bring_your_own',
    configJson: JSON.stringify({
      allowMarketplaceThemes: true,
      allowCustomCss: true,
      publicPublishingRequiresActiveEntitlement: true,
      defaultHeaderStyle: 'default',
      defaultFooterStyle: 'simple',
      mobileLayout: 'stacked',
      sections: [],
      pageTemplates: [],
    }),
    updatedAt: now(),
  },
  themeEngineActivities: [
    { id: 'theme-activity-1', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'activate_theme', metadataJson: JSON.stringify({ themeId: 'theme-ecclesia', websiteId: demoWebsiteId }), createdAt: now() },
    { id: 'theme-activity-2', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'provision_ecclesia', metadataJson: JSON.stringify({ themeId: 'theme-ecclesia' }), createdAt: now() },
  ],
  sectionTemplates: [
    { name: 'Hero Section', key: 'hero-section', type: 'section', category: 'Core', description: 'Headline, media, and primary calls to action.', structure: { type: 'hero', fields: ['kicker', 'title', 'subtitle', 'buttonText', 'buttonUrl'] } },
    { name: 'Service Times', key: 'service-times', type: 'section', category: 'Church Identity', description: 'Global service rhythm and campus details.', structure: { type: 'service_times', source: 'global.services' } },
    { name: 'Ministry Grid', key: 'ministry-grid', type: 'section', category: 'Ministries', description: 'Responsive ministry cards.', structure: { type: 'ministries_list', fields: ['items'] } },
    { name: 'Giving CTA', key: 'giving-cta', type: 'section', category: 'Giving', description: 'Giving, campaign, and partnership prompt.', structure: { type: 'giving_cta', source: 'giving' } },
  ],
  pageTemplates: [
    { name: 'Home', title: 'Home', key: 'home', slug: '', icon: 'home', description: 'Ecclesia homepage with worship, services, ministries, media, prayer, giving, and visitor paths.', type: 'page', status: 'published', structure: { sections: ['hero', 'service_times', 'ministries_list', 'giving_cta'], widgetAware: true, builderEditable: true } },
    { name: 'About', title: 'About', key: 'about', slug: 'about', icon: 'badge-info', description: 'Mission, vision, values, story, and church identity.', type: 'page', status: 'published', structure: { sections: ['hero', 'about_template', 'leadership_team'], widgetAware: true, builderEditable: true } },
    { name: 'Giving', title: 'Giving', key: 'giving', slug: 'giving', icon: 'hand-coins', description: 'Giving form, campaigns, recurring gifts, and impact stories.', type: 'page', status: 'published', structure: { sections: ['hero', 'giving_cta'], widgetAware: true, builderEditable: true } },
  ],
  marketplaceAssets: [
    { id: 'asset-neon-youth', name: 'Neon Youth Style', description: 'Vibrant gradients and bold typography for youth ministries.', type: 'theme', pricingType: 'free', price: 0, status: 'approved', assetConfig: JSON.stringify({ colors: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00' }, fonts: { heading: 'Outfit', body: 'Inter' } }), version: '1.0.0' },
    { id: 'asset-traditional-hymnal', name: 'Traditional Hymnal', description: 'Classic serif fonts and clean layout styles for traditional services.', type: 'theme', pricingType: 'free', price: 0, status: 'approved', assetConfig: JSON.stringify({ colors: { primary: '#4b5563', secondary: '#ffffff', accent: '#7c3aed' }, fonts: { heading: 'Playfair Display', body: 'Georgia' } }), version: '1.0.0' },
    { id: 'asset-modern-dynamic', name: 'Modern Dynamic', description: 'Sleek dark overlays and custom blocks for media ministries.', type: 'theme', pricingType: 'free', price: 0, status: 'approved', assetConfig: JSON.stringify({ colors: { primary: '#0f172a', secondary: '#f8fafc', accent: '#14b8a6' }, fonts: { heading: 'Montserrat', body: 'Inter' } }), version: '1.0.0' },
  ],
  pages: [
    {
      id: 'page-home',
      websiteId: demoWebsiteId,
      title: 'Home',
      slug: 'home',
      status: 'published',
      isHome: true,
      seoTitle: 'Demo Church | Home',
      seoDescription: 'A vibrant digital-first Christ Embassy demo church for testing ChurchOS website, CMS, and ministry features.',
      content: [
        { type: 'hero', title: 'Demo Church', subtitle: 'A Spirit-filled, digital-first church community built for worship, discipleship, prayer, media, giving, and outreach.', bgImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=80', buttonText: 'Join This Sunday', buttonUrl: '/services' },
        { type: 'service_times', title: 'Weekly Service Rhythm', sundayTimes: 'Sunday Celebration Service - 9:00 AM and 11:30 AM', midWeekTimes: 'Wednesday Word & Prayer - 7:00 PM, Friday Youth Ignite - 6:30 PM', address: 'Next Church Campus, 221 Victory Avenue, Lagos' },
        { type: 'ministries_list', title: 'Featured Ministry Pathways', items: [{ name: 'NextGen Youth', desc: 'Youth services, mentorship, creative teams, and campus outreach.' }, { name: 'Prayer & Testimony Hub', desc: 'Prayer requests, testimony moderation, prayer rooms, and corporate prayer schedules.' }, { name: 'Digital Media Team', desc: 'Livestream, sermon clips, podcast publishing, and social media campaigns.' }] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-about',
      websiteId: demoWebsiteId,
      title: 'About Next Church',
      slug: 'about',
      status: 'published',
      isHome: false,
      seoTitle: 'About Demo Church',
      seoDescription: 'Learn the mission, leadership, values, and digital ministry culture of Demo Church.',
      content: [
        { type: 'about_template', headline: 'A Church Built for the Next Generation', storyText: 'Demo Church is a demo ministry environment for testing how a modern church can run public pages, member experiences, media, giving, events, groups, and pastoral care from one operating system.', valuesList: ['Word', 'Worship', 'Prayer', 'Innovation', 'Community'] },
        { type: 'leadership_team', headline: 'Pastoral & Ministry Leadership', members: [{ name: 'Pastor Daniel Okafor', role: 'Resident Pastor', bio: 'Leads teaching, pastoral care, and strategic ministry development.' }, { name: 'Minister Amara Cole', role: 'Digital Ministry Director', bio: 'Oversees livestream, page publishing, content, and volunteer media teams.' }] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-services',
      websiteId: demoWebsiteId,
      title: 'Services',
      slug: 'services',
      status: 'published',
      isHome: false,
      seoTitle: 'Services | Demo Church',
      seoDescription: 'Service times, locations, countdowns, livestream links, and order of service.',
      content: [
        { type: 'service_times', title: 'Service Times & Locations', sundayTimes: 'Sunday Celebration - 9:00 AM and 11:30 AM', midWeekTimes: 'Wednesday Word & Prayer - 7:00 PM', address: '221 Victory Avenue, Lagos and online' },
        { type: 'hero', title: 'Plan Your Visit', subtitle: 'Find parking, children check-in, service schedule, and first-time guest support.', bgImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80', buttonText: 'I Am Visiting', buttonUrl: '/first-time' },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-livestream',
      websiteId: demoWebsiteId,
      title: 'Watch Live',
      slug: 'live',
      status: 'published',
      isHome: false,
      seoTitle: 'Watch Live | Demo Church',
      seoDescription: 'Livestream player, live prayer, sermon notes, chat, and giving CTA test page.',
      content: [
        { type: 'hero', title: 'Watch Live', subtitle: 'Live service player placeholder with prayer, chat, notes, reactions, and giving actions.', bgImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80', buttonText: 'Join Live Service', buttonUrl: '#live-player' },
        { type: 'dynamic_livestream', title: 'Live Video Player', sourceModule: 'Livestream', fields: ['player', 'chat', 'viewerCount', 'prayerRequest', 'givingCTA'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-sermons',
      websiteId: demoWebsiteId,
      title: 'Sermons & Media',
      slug: 'sermons',
      status: 'published',
      isHome: false,
      seoTitle: 'Sermons & Media | Demo Church',
      seoDescription: 'Sermon grid, series pages, podcast feed, media filters, and replay content.',
      content: [
        { type: 'dynamic_sermon_grid', title: 'Latest Sermons', sourceModule: 'Sermons / Media', filters: ['series', 'speaker', 'topic', 'date'] },
        { type: 'dynamic_media_library', title: 'Media Library', sourceModule: 'Media', fields: ['video', 'audio', 'resources'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-events',
      websiteId: demoWebsiteId,
      title: 'Events',
      slug: 'events',
      status: 'published',
      isHome: false,
      seoTitle: 'Events | Demo Church',
      seoDescription: 'Event grid, registration, countdowns, venue maps, reminders, and capacity testing.',
      content: [
        { type: 'hero', title: 'Upcoming Events', subtitle: 'Conference nights, worship experiences, youth events, and leadership training.', bgImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80', buttonText: 'Register Now', buttonUrl: '#events' },
        { type: 'dynamic_events_grid', title: 'Event Calendar', sourceModule: 'Events', fields: ['date', 'location', 'registration', 'capacity', 'reminders'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-giving',
      websiteId: demoWebsiteId,
      title: 'Giving',
      slug: 'give',
      status: 'published',
      isHome: false,
      seoTitle: 'Give | Demo Church',
      seoDescription: 'Giving forms, campaigns, pledges, recurring giving, confirmations, and receipts.',
      content: [
        { type: 'hero', title: 'Give Securely', subtitle: 'Support ministry, missions, outreach, media, welfare, and discipleship work.', bgImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80', buttonText: 'Start Giving', buttonUrl: '#giving-form' },
        { type: 'dynamic_giving_campaign', title: 'Kingdom Expansion Campaign', sourceModule: 'Giving', fields: ['progress', 'recurringGiving', 'pledges', 'receipts'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-prayer',
      websiteId: demoWebsiteId,
      title: 'Prayer & Testimonies',
      slug: 'prayer',
      status: 'published',
      isHome: false,
      seoTitle: 'Prayer & Testimonies | Demo Church',
      seoDescription: 'Prayer request form, prayer wall, testimony wall, prayer sessions, and reactions.',
      content: [
        { type: 'hero', title: 'Prayer & Testimonies', subtitle: 'Submit prayer requests, join corporate prayer, and share testimonies for moderation.', bgImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1400&q=80', buttonText: 'Request Prayer', buttonUrl: '#prayer-request' },
        { type: 'dynamic_prayer_wall', title: 'Prayer Wall', sourceModule: 'Prayer & Testimony', fields: ['requests', 'iPrayed', 'testimonies', 'sessions'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-ministries',
      websiteId: demoWebsiteId,
      title: 'Ministries',
      slug: 'ministries',
      status: 'published',
      isHome: false,
      seoTitle: 'Ministries | Demo Church',
      seoDescription: 'Ministry directory, volunteer opportunities, leaders, events, and media connections.',
      content: [
        { type: 'ministries_list', title: 'Find Your Ministry', items: [{ name: 'Worship & Creative Arts', desc: 'Choir, music direction, stage design, dance, and creative production.' }, { name: 'Hospitality & First Impressions', desc: 'Guest welcome, ushers, follow-up, and visitor care.' }, { name: 'Outreach & Missions', desc: 'Evangelism campaigns, local care, and missions support.' }] },
        { type: 'dynamic_ministry_directory', title: 'Ministry Directory', sourceModule: 'Ministries', fields: ['leader', 'meetingTimes', 'joinForm'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-groups',
      websiteId: demoWebsiteId,
      title: 'Cell Groups',
      slug: 'groups',
      status: 'published',
      isHome: false,
      seoTitle: 'Cell Groups | Demo Church',
      seoDescription: 'Cell group finder, leader cards, meeting schedules, and join requests.',
      content: [
        { type: 'dynamic_cell_finder', title: 'Find a Cell Group', sourceModule: 'Cell Groups', fields: ['location', 'language', 'day', 'leader', 'joinRequest'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-courses',
      websiteId: demoWebsiteId,
      title: 'Discipleship Courses',
      slug: 'courses',
      status: 'published',
      isHome: false,
      seoTitle: 'Courses | Demo Church',
      seoDescription: 'Course list, lesson player, progress, quizzes, certificates, and recommendations.',
      content: [
        { type: 'dynamic_course_list', title: 'Discipleship Tracks', sourceModule: 'Discipleship / Courses', fields: ['enrollment', 'lessonProgress', 'quizzes', 'certificates'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-branches',
      websiteId: demoWebsiteId,
      title: 'Branches',
      slug: 'branches',
      status: 'published',
      isHome: false,
      seoTitle: 'Branches | Demo Church',
      seoDescription: 'Branch finder, branch service schedules, campus pastors, maps, and location-aware content.',
      content: [
        { type: 'dynamic_branch_finder', title: 'Find a Next Church Branch', sourceModule: 'Branches', fields: ['nearestBranch', 'pastor', 'serviceTimes', 'map', 'contact'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-volunteer',
      websiteId: demoWebsiteId,
      title: 'Volunteer',
      slug: 'volunteer',
      status: 'published',
      isHome: false,
      seoTitle: 'Volunteer | Demo Church',
      seoDescription: 'Volunteer opportunities, ministry signup, team assignment, schedules, and serving interests.',
      content: [
        { type: 'dynamic_volunteer_opportunities', title: 'Serve With Us', sourceModule: 'Volunteers', fields: ['teams', 'openRoles', 'availability', 'applicationForm'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-announcements',
      websiteId: demoWebsiteId,
      title: 'Announcements',
      slug: 'announcements',
      status: 'published',
      isHome: false,
      seoTitle: 'Announcements | Demo Church',
      seoDescription: 'Featured announcements, alert banners, notification signup, and branch messages.',
      content: [
        { type: 'dynamic_announcement_list', title: 'Latest Church Updates', sourceModule: 'Announcements', fields: ['featured', 'branch', 'alertBanner', 'notificationSignup'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-mobile-app',
      websiteId: demoWebsiteId,
      title: 'Mobile App Screen',
      slug: 'mobile-app',
      status: 'draft',
      isHome: false,
      seoTitle: 'Mobile App Screen | Demo Church',
      seoDescription: 'Mobile app screen composition for member dashboard, giving, livestream, prayer, and notifications.',
      content: [
        { type: 'dynamic_mobile_home', title: 'Next Church Mobile Home', sourceModule: 'Mobile App', fields: ['quickActions', 'liveService', 'giving', 'prayer', 'notifications'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-first-time',
      websiteId: demoWebsiteId,
      title: 'First-Time Visitor',
      slug: 'first-time',
      status: 'draft',
      isHome: false,
      seoTitle: 'First-Time Visitor | Demo Church',
      seoDescription: 'Visitor capture, welcome flow, CRM routing, pastoral follow-up, and next steps.',
      content: [
        { type: 'contact_form', header: 'Plan Your First Visit', email: 'hello@nextchurch.example', phone: '+234 800 000 0000', showMap: true },
        { type: 'dynamic_visitor_capture', title: 'First-Time Visitor Capture', sourceModule: 'Member CRM', fields: ['guestDetails', 'familyInfo', 'followUp', 'assignedCareAgent'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-contact',
      websiteId: demoWebsiteId,
      title: 'Contact',
      slug: 'contact',
      status: 'published',
      isHome: false,
      seoTitle: 'Contact | Demo Church',
      seoDescription: 'Contact form, location map, branch details, pastoral care request, and communication opt-in.',
      content: [
        { type: 'contact_form', header: 'Contact Demo Church', email: 'hello@nextchurch.example', phone: '+234 800 000 0000', showMap: true },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-member-dashboard',
      websiteId: demoWebsiteId,
      title: 'Member Dashboard',
      slug: 'member-dashboard',
      status: 'draft',
      isHome: false,
      seoTitle: 'Member Dashboard | Demo Church',
      seoDescription: 'Personalized member actions, events, groups, courses, giving history, and prayer sessions.',
      content: [
        { type: 'dynamic_member_dashboard', title: 'Personalized Member Dashboard', sourceModule: 'Member Management', fields: ['profile', 'events', 'givingHistory', 'groups', 'courses', 'notifications'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  navigation: [
    {
      id: 'nav-main',
      websiteId: demoWebsiteId,
      name: 'Header Navigation',
      items: [
        { label: 'Home', url: '/' },
        { label: 'About', url: '/about' },
        { label: 'Contact', url: '/contact' },
        { label: 'Account', url: '/login' },
        { label: 'Media', url: '/media' },
        { label: 'Livestream', url: '/livestream' },
        { label: 'Podcast', url: '/podcast' },
        { label: 'Articles', url: '/blog' },
        { label: 'Services', url: '/services' },
        { label: 'Library', url: '/library' },
        { label: 'LMS', url: '/courses' },
        { label: 'Worship', url: '/worship' },
      ],
      isActive: true,
      updatedAt: now(),
    },
  ],
  footers: [
    {
      id: 'footer-main',
      websiteId: demoWebsiteId,
      copyrightText: `&copy; ${new Date().getFullYear()} Demo Church. All rights reserved.`,
      socialLinks: [
        { name: 'facebook', url: 'https://facebook.com/christembassynext' },
        { name: 'instagram', url: 'https://instagram.com/christembassynext' },
        { name: 'youtube', url: 'https://youtube.com/@christembassynext' },
      ],
      secondaryLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Plan a Visit', url: '/first-time' },
        { label: 'Volunteer', url: '/volunteer' },
        { label: 'Branches', url: '/branches' },
      ],
      updatedAt: now(),
    },
  ],
  reusableBlocks: [
    {
      id: 'block-ecclesia-global-content',
      name: 'Ecclesia Global Content',
      key: 'ecclesia-global-content',
      content: localEcclesiaGlobalContent,
      updatedAt: now(),
    },
    {
      id: 'block-service-cta',
      name: 'Sunday Celebration CTA',
      key: 'sunday-service-cta',
      content: { type: 'hero', title: 'Join Demo Church This Sunday', subtitle: 'Two services, one family, one mission.', buttonText: 'Plan a Visit' },
      updatedAt: now(),
    },
  ],
  billingPlans: [
    {
      id: 'plan-starter',
      name: 'Starter',
      slug: 'starter',
      description: 'For smaller churches launching core ChurchOS operations.',
      basePrice: 0,
      currency: 'USD',
      billingInterval: 'month',
      includedMembers: 50,
      includedSms: 100,
      includedEmail: 500,
      includedStorageGb: 5,
      includedVideoBandwidthGb: 0,
      includedAiTokens: 0,
      includedMeetingParticipantHours: 0,
      memberOverageRate: 0,
      smsOverageRate: 0,
      storageOverageRate: 0,
      emailOverageRate: 0,
      videoBandwidthOverageRate: 0,
      aiTokenOverageRate: 0,
      meetingParticipantHourRate: 0,
      featuresJson: JSON.stringify(['Member directory', 'Basic CMS', 'Giving setup']),
      modulesJson: JSON.stringify(['members', 'core-website-cms', 'giving']),
    },
    {
      id: 'plan-growth',
      name: 'Growth',
      slug: 'growth',
      description: 'Usage-based plan for growing ministries and media teams.',
      basePrice: 49,
      currency: 'USD',
      billingInterval: 'month',
      includedMembers: 500,
      includedSms: 1000,
      includedEmail: 10000,
      includedStorageGb: 100,
      includedVideoBandwidthGb: 250,
      includedAiTokens: 50000,
      includedMeetingParticipantHours: 40,
      memberOverageRate: 5,
      smsOverageRate: 0.02,
      storageOverageRate: 2,
      emailOverageRate: 0.001,
      videoBandwidthOverageRate: 0.08,
      aiTokenOverageRate: 0.0001,
      meetingParticipantHourRate: 2,
      featuresJson: JSON.stringify(['Usage billing', 'Paid add-ons', 'AI ministry copilots']),
      modulesJson: JSON.stringify(['members', 'communications', 'media', 'live-meetings', 'ai']),
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Multi-campus plan with extended usage pools and premium support.',
      basePrice: 199,
      currency: 'USD',
      billingInterval: 'month',
      includedMembers: 5000,
      includedSms: 20000,
      includedEmail: 150000,
      includedStorageGb: 1000,
      includedVideoBandwidthGb: 2500,
      includedAiTokens: 500000,
      includedMeetingParticipantHours: 400,
      memberOverageRate: 3,
      smsOverageRate: 0.015,
      storageOverageRate: 1.25,
      emailOverageRate: 0.0008,
      videoBandwidthOverageRate: 0.05,
      aiTokenOverageRate: 0.00008,
      meetingParticipantHourRate: 1.25,
      featuresJson: JSON.stringify(['Multi-campus controls', 'Premium support', 'Advanced reporting']),
      modulesJson: JSON.stringify(['members', 'communications', 'media', 'live-meetings', 'ai', 'analytics']),
    },
  ],
  billingSubscription: {
    id: 'sub-local-growth',
    tenantId: demoTenantId,
    planId: 'plan-growth',
    status: 'active',
    provider: 'internal',
    providerMode: 'platform_managed',
    couponCode: 'WELCOME10',
    currentPeriodStart: now(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  billingUsage: {
    active_members: 612,
    sms_sent: 1320,
    email_sent: 12480,
    storage_gb: 96,
    video_bandwidth_gb: 310,
    ai_tokens: 74000,
    meeting_participant_hours: 54,
  },
  billingInvoices: [
    {
      id: 'invoice-local-001',
      invoiceNumber: 'INV-2026-0001',
      tenantId: demoTenantId,
      subscriptionId: 'sub-local-growth',
      amount: 86.91,
      subtotal: 96.57,
      discount: 9.66,
      currency: 'USD',
      status: 'open',
      lineItemsJson: JSON.stringify([
        { label: 'Growth plan', amount: 49 },
        { label: 'Usage overages', amount: 17.57 },
        { label: 'Livestream Studio add-on', amount: 30 },
      ]),
      billingPeriodStart: now(),
      billingPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: now(),
    },
  ],
  billingAddOns: [
    {
      id: 'addon-live-studio',
      tenantId: demoTenantId,
      key: 'live-studio',
      name: 'Livestream Studio',
      description: 'Unlock hosted livestream rooms and participant-hour tracking.',
      moduleKey: 'live-meetings',
      price: 30,
      billingMode: 'monthly',
      usageMetricKey: 'meeting_participant_hours',
      includedQuantity: 20,
      overageRate: 1.5,
      isActive: true,
    },
    {
      id: 'addon-ai-care',
      tenantId: demoTenantId,
      key: 'ai-care',
      name: 'AI Pastoral Care',
      description: 'AI-assisted follow-up drafts, prayer categorization, and response summaries.',
      moduleKey: 'ai',
      price: 45,
      billingMode: 'monthly',
      usageMetricKey: 'ai_tokens',
      includedQuantity: 100000,
      overageRate: 0.00008,
      isActive: true,
    },
  ],
  billingActiveAddOns: [
    {
      id: 'active-addon-live-studio',
      tenantId: demoTenantId,
      subscriptionId: 'sub-local-growth',
      addOnId: 'addon-live-studio',
      quantity: 1,
      status: 'active',
      activatedAt: now(),
    },
  ],
  billingCoupons: [
    {
      id: 'coupon-welcome',
      tenantId: demoTenantId,
      code: 'WELCOME10',
      description: 'Preview coupon for the current subscription.',
      discountType: 'percent',
      discountValue: 10,
      maxRedemptions: 100,
      redeemedCount: 1,
      isActive: true,
      expiresAt: null,
    },
  ],
  billingSettings: {
    id: 'billing-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'billing-subscription-management',
    enabled: true,
    billingPlan: 'platform',
    providerMode: 'platform_managed',
    configJson: JSON.stringify({
      invoicePrefix: 'INV',
      enableUsageBilling: true,
      trialDays: 14,
      invoiceGraceDays: 7,
      publicPublishingRequiresPaidAccess: true,
    }),
    updatedAt: now(),
  },
  billingEntitlements: [
    { id: 'ent-core-cms', tenantId: demoTenantId, moduleKey: 'core-website-cms', status: 'active', billingRule: 'included', module: { name: 'Churchfront' } },
    { id: 'ent-dt', tenantId: demoTenantId, moduleKey: 'domain-tenant-management', status: 'active', billingRule: 'included', module: { name: 'Church Details' } },
    { id: 'ent-media', tenantId: demoTenantId, moduleKey: 'media', status: 'active', billingRule: 'included', module: { name: 'Media Module' } },
    { id: 'ent-church-services', tenantId: demoTenantId, moduleKey: 'church-services', status: 'active', billingRule: 'included', module: { name: 'Church Services' } },
    { id: 'ent-live', tenantId: demoTenantId, moduleKey: 'live-meetings', status: 'active', billingRule: 'paid_add_on', module: { name: 'Live Meetings' } },
    { id: 'ent-ai', tenantId: demoTenantId, moduleKey: 'ai', status: 'active', billingRule: 'metered', module: { name: 'AI Copilot' } },
    { id: 'ent-analytics', tenantId: demoTenantId, moduleKey: 'analytics', status: 'suspended', billingRule: 'plan_required', module: { name: 'Analytics & Reporting' } },
  ],
  billingActivities: [
    { id: 'billing-activity-1', tenantId: demoTenantId, actionType: 'coupon_applied', metadataJson: JSON.stringify({ code: 'WELCOME10' }), createdAt: now() },
    { id: 'billing-activity-2', tenantId: demoTenantId, actionType: 'addon_activated', metadataJson: JSON.stringify({ addOn: 'Livestream Studio' }), createdAt: now() },
    { id: 'billing-activity-3', tenantId: demoTenantId, actionType: 'usage_recorded', metadataJson: JSON.stringify({ metricKey: 'sms_sent', quantity: 1320 }), createdAt: now() },
  ],
  billingRecords: [
    { id: 'billing-record-1', tenantId: demoTenantId, title: 'Local Preview Billing Console', description: 'Demo record for the documented module CRUD surface.', status: 'active', visibility: 'private', settingsJson: '{}', createdAt: now(), updatedAt: now() },
  ],
  mediaSettings: {
    id: 'media-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'media',
    enabled: true,
    billingPlan: 'premium',
    providerMode: 'hybrid',
    configJson: JSON.stringify({
      enablePlatformHosting: true,
      enableExternalEmbeds: true,
      enableShortClips: true,
      enableImageGalleries: true,
      enableDownloads: true,
      enableAutoTranscripts: true,
      defaultVisibility: 'public',
      defaultStatus: 'draft',
      defaultStreamingQuality: '720p',
      maxUploadSizeMb: 500,
      monthlyStorageGbLimit: 100,
      monthlyBandwidthGbLimit: 250,
      defaultStorageProvider: 'platform',
      providerMode: 'hybrid',
      publishRequiresThumbnail: false,
      allowedExternalProviders: ['youtube', 'vimeo', 'cloudinary', 'aws_s3', 'cloudflare_r2', 'mux'],
    }),
    updatedAt: now(),
  },
  mediaRecords: [
    { id: 'media-record-main', tenantId: demoTenantId, title: 'Next Church Media Archive', description: 'Primary sermon, replay, clip, gallery, and download library.', status: 'active', settingsJson: '{}', visibility: 'private', createdBy: 'Local Preview', createdAt: now(), updatedAt: now() },
  ],
  mediaCategories: [
    { id: 'media-cat-sermons', tenantId: demoTenantId, name: 'Sunday Messages', slug: 'sunday-messages', parentId: null, createdAt: now(), updatedAt: now(), children: [] },
    { id: 'media-cat-worship', tenantId: demoTenantId, name: 'Worship Sets', slug: 'worship-sets', parentId: null, createdAt: now(), updatedAt: now(), children: [] },
  ],
  mediaTags: [
    { id: 'media-tag-faith', tenantId: demoTenantId, name: 'Faith', slug: 'faith', createdAt: now() },
    { id: 'media-tag-prayer', tenantId: demoTenantId, name: 'Prayer', slug: 'prayer', createdAt: now() },
  ],
  mediaSpeakers: [
    { id: 'media-speaker-daniel', tenantId: demoTenantId, name: 'Pastor Daniel Okafor', title: 'Resident Pastor', bio: 'Weekly teaching pastor for Next Church services.', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', createdAt: now(), updatedAt: now() },
  ],
  mediaSeries: [
    { id: 'media-series-faith', tenantId: demoTenantId, title: 'Walking in Faith', description: 'A four-part sermon series on bold discipleship.', coverImageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80', createdAt: now(), updatedAt: now() },
  ],
  mediaAssets: [
    {
      id: 'media-asset-faith-1',
      tenantId: demoTenantId,
      title: 'Walking in Faith Part 1',
      description: 'Sunday replay with teaching notes and resource links.',
      type: 'video',
      providerType: 'external_link',
      providerKey: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80',
      durationSeconds: 2700,
      fileSizeBytes: 524288000,
      mimeType: 'video/mp4',
      categoryId: 'media-cat-sermons',
      seriesId: 'media-series-faith',
      seriesOrder: 1,
      speakerId: 'media-speaker-daniel',
      visibility: 'public',
      status: 'published',
      publishedAt: now(),
      createdAt: now(),
      updatedAt: now(),
      assetTags: [{ tagId: 'media-tag-faith', tag: { id: 'media-tag-faith', name: 'Faith', slug: 'faith' } }],
    },
    {
      id: 'media-asset-prayer-audio',
      tenantId: demoTenantId,
      title: 'Midweek Prayer Audio',
      description: 'Podcast-ready audio message for the church app.',
      type: 'audio',
      providerType: 'platform_managed',
      providerKey: 'platform',
      sourceUrl: '/media/midweek-prayer.mp3',
      thumbnailUrl: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&w=600&q=80',
      durationSeconds: 1800,
      fileSizeBytes: 42000000,
      mimeType: 'audio/mpeg',
      categoryId: 'media-cat-worship',
      seriesId: null,
      seriesOrder: null,
      speakerId: 'media-speaker-daniel',
      visibility: 'members_only',
      status: 'published',
      publishedAt: now(),
      createdAt: now(),
      updatedAt: now(),
      assetTags: [{ tagId: 'media-tag-prayer', tag: { id: 'media-tag-prayer', name: 'Prayer', slug: 'prayer' } }],
    },
  ],
  mediaPlaylists: [
    { id: 'media-playlist-growth', tenantId: demoTenantId, name: 'Growth Fundamentals', description: 'A guided playlist for new believers and small groups.', coverImageUrl: '', isPublic: true, createdAt: now(), updatedAt: now(), _count: { items: 2 } },
  ],
  mediaPlaylistItems: [
    { id: 'media-playlist-item-1', playlistId: 'media-playlist-growth', assetId: 'media-asset-faith-1', order: 1 },
    { id: 'media-playlist-item-2', playlistId: 'media-playlist-growth', assetId: 'media-asset-prayer-audio', order: 2 },
  ],
  mediaActivities: [
    { id: 'media-activity-1', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'asset_created', metadataJson: JSON.stringify({ assetId: 'media-asset-faith-1', title: 'Walking in Faith Part 1' }), createdAt: now() },
    { id: 'media-activity-2', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'settings_updated', metadataJson: JSON.stringify({ providerMode: 'hybrid' }), createdAt: now() },
  ],
  churchServicesSettings: {
    id: 'church-services-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'church-services',
    enabled: true,
    billingPlan: 'premium',
    providerMode: 'hybrid',
    configJson: JSON.stringify({
      enableSundayServices: true,
      enableMidweekServices: true,
      enablePrayerServices: true,
      enableCommunionServices: true,
      enableHealingServices: true,
      enableThanksgivingServices: true,
      enableYouthServices: true,
      enableSpecialServices: true,
      enableRecurringSchedules: true,
      enablePublicArchive: true,
      enableReplayAttachments: true,
      enableAudioAttachments: true,
      enableGivingIntegration: true,
      enableAttendanceIntegration: true,
      enableSalvationIntegration: true,
      enableCalendarSync: false,
      enableAiSummaries: false,
      defaultVisibility: 'public',
      defaultStatus: 'draft',
      defaultLocationMode: 'hybrid',
      archiveSortOrder: 'desc',
      providerMode: 'hybrid',
      defaultReplayProvider: 'media',
      allowedVideoProviders: ['platform', 'youtube', 'vimeo', 'mux', 'cloudinary', 'cloudflare_r2'],
      recurringMaxBatchSize: 52,
      publishRequiresSpeaker: false,
      publishRequiresMedia: false,
    }),
    updatedAt: now(),
  },
  churchServicesProfiles: [
    { id: 'church-services-profile-main', tenantId: demoTenantId, title: 'Weekly Service Archive', description: 'Primary archive for Sunday, midweek, prayer, communion, and special services.', status: 'active', settingsJson: '{}', visibility: 'private', createdBy: 'Local Preview', createdAt: now(), updatedAt: now() },
  ],
  churchServices: [
    {
      id: 'service-sunday-faith',
      tenantId: demoTenantId,
      title: 'Sunday Morning Service - Walking in Faith',
      serviceType: 'sunday',
      serviceDate: '2026-05-31T09:00:00.000Z',
      description: 'Main weekend gathering with worship, teaching, prayer, and ministry time.',
      notes: 'Topic: Walking in Faith. Key points: trust God, act on the Word, stand firm.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80',
      speakerId: 'media-speaker-daniel',
      sermonMediaId: 'media-asset-faith-1',
      serviceAudioId: 'media-asset-prayer-audio',
      livestreamId: null,
      attendanceCount: 412,
      givingTotal: 18420.5,
      salvationCount: 7,
      status: 'published',
      visibility: 'public',
      locationMode: 'hybrid',
      settingsJson: '{}',
      createdById: 'Local Preview',
      archiveOrder: 1,
      createdAt: now(),
      updatedAt: now(),
      scriptures: [
        { id: 'scripture-faith-1', serviceId: 'service-sunday-faith', reference: 'Hebrews 11:1', order: 1 },
        { id: 'scripture-faith-2', serviceId: 'service-sunday-faith', reference: 'Romans 8:28', order: 2 },
      ],
      attachments: [
        { id: 'attachment-faith-1', serviceId: 'service-sunday-faith', title: 'Sunday Bulletin and Sermon Notes', fileUrl: '/documents/sunday-faith-notes.pdf', fileType: 'pdf', createdAt: now() },
      ],
    },
    {
      id: 'service-midweek-prayer',
      tenantId: demoTenantId,
      title: 'Wednesday Word and Prayer',
      serviceType: 'midweek',
      serviceDate: '2026-06-03T19:00:00.000Z',
      description: 'Midweek Bible study and corporate prayer.',
      notes: 'Prayer focus: family restoration, ministry teams, and outreach.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&w=600&q=80',
      speakerId: 'media-speaker-daniel',
      sermonMediaId: null,
      serviceAudioId: 'media-asset-prayer-audio',
      livestreamId: null,
      attendanceCount: 168,
      givingTotal: 3425,
      salvationCount: 1,
      status: 'published',
      visibility: 'members_only',
      locationMode: 'hybrid',
      settingsJson: '{}',
      createdById: 'Local Preview',
      archiveOrder: 2,
      createdAt: now(),
      updatedAt: now(),
      scriptures: [{ id: 'scripture-prayer-1', serviceId: 'service-midweek-prayer', reference: 'Acts 4:31', order: 1 }],
      attachments: [],
    },
    {
      id: 'service-communion-preview',
      tenantId: demoTenantId,
      title: 'First Sunday Communion Service',
      serviceType: 'communion',
      serviceDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      description: 'Upcoming monthly communion service placeholder.',
      notes: '',
      thumbnailUrl: '',
      speakerId: null,
      sermonMediaId: null,
      serviceAudioId: null,
      livestreamId: null,
      attendanceCount: 0,
      givingTotal: 0,
      salvationCount: 0,
      status: 'draft',
      visibility: 'public',
      locationMode: 'physical',
      settingsJson: '{}',
      createdById: 'Local Preview',
      archiveOrder: 3,
      createdAt: now(),
      updatedAt: now(),
      scriptures: [],
      attachments: [],
    },
  ],
  churchServicesActivities: [
    { id: 'church-services-activity-1', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'service_created', metadataJson: JSON.stringify({ serviceId: 'service-sunday-faith', title: 'Sunday Morning Service - Walking in Faith' }), createdAt: now() },
    { id: 'church-services-activity-2', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'settings_updated', metadataJson: JSON.stringify({ providerMode: 'hybrid' }), createdAt: now() },
  ],
  activityLogs: [
    { id: 'activity-1', actionType: 'page_create', metadataJson: 'Seeded Demo Church homepage', createdAt: now(), actor: 'Local Preview' },
    { id: 'activity-2', actionType: 'page_update', metadataJson: 'Configured navigation for service, livestream, events, sermons, prayer, and giving', createdAt: now(), actor: 'Local Preview' },
    { id: 'activity-3', actionType: 'page_publish', metadataJson: 'Published demo pages for CMS testing', createdAt: now(), actor: 'Local Preview' },
  ],
  domainTenantManagementModules: [
    { id: 'dt-module-default', tenantId: demoTenantId, title: 'Demo Church Workspace', description: 'Primary production workspace configured for DNS mapping.', status: 'active', settingsJson: '{}', visibility: 'public', createdBy: 'Local Preview', createdAt: now(), updatedAt: now() },
  ],
  domainTenantManagementSettings: {
    id: 'domain-tenant-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'domain-tenant-management',
    enabled: true,
    billingPlan: 'free',
    providerMode: 'bring_your_own',
    configJson: JSON.stringify({
      allowCustomDomains: true,
      requireDnsVerification: true,
      enableAutoSsl: true,
      defaultSubdomainSuffix: 'churchos.com',
    }),
    updatedAt: now(),
  },
  domainTenantManagementActivities: [
    { id: 'dt-activity-1', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'create_profile', metadataJson: JSON.stringify({ title: 'Default Workspace Profile' }), createdAt: now() },
  ],
  libraryCategories: [
    { id: 'lib-cat-ebooks', tenantId: demoTenantId, name: 'E-Books & Guides', slug: 'ebooks-guides', parentId: null, createdAt: now(), updatedAt: now() },
    { id: 'lib-cat-templates', tenantId: demoTenantId, name: 'Ministry Templates', slug: 'templates', parentId: null, createdAt: now(), updatedAt: now() },
  ],
  libraryResources: [
    {
      id: 'lib-res-growth',
      tenantId: demoTenantId,
      title: 'Spiritual Growth Playbook',
      slug: 'spiritual-growth-playbook',
      description: 'A comprehensive guide to developing spiritual disciplines.',
      author: 'Pastor Daniel Okafor',
      fileUrl: '/library/playbook.pdf',
      fileSize: 1048576,
      fileType: 'pdf',
      coverImageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400',
      pricingType: 'free',
      price: 0,
      visibility: 'public',
      status: 'published',
      downloadCount: 42,
      categoryId: 'lib-cat-ebooks',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'lib-res-worship-guide',
      tenantId: demoTenantId,
      title: 'Worship Team Manual 2026',
      slug: 'worship-manual-2026',
      description: 'Guidelines and templates for the worship ministry team.',
      author: 'Worship Director',
      fileUrl: '/library/worship-manual.pdf',
      fileSize: 2097152,
      fileType: 'pdf',
      coverImageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
      pricingType: 'paid',
      price: 9.99,
      visibility: 'leaders_only',
      status: 'published',
      downloadCount: 15,
      categoryId: 'lib-cat-templates',
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  libraryPurchases: [
    { id: 'purchase-1', tenantId: demoTenantId, resourceId: 'lib-res-worship-guide', userId: 'user-1', amountPaid: 9.99, createdAt: now() },
  ],
  digitalLibrarySettings: {
    id: 'digital-library-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'digital-library-resource-center',
    enabled: true,
    billingPlan: 'free',
    providerMode: 'bring_your_own',
    configJson: JSON.stringify({
      allowPublicDownloads: true,
      allowPaidResources: true,
      maxUploadSizeMb: 50,
      acceptedFileTypes: ['pdf', 'epub', 'docx', 'xlsx', 'zip'],
    }),
    updatedAt: now(),
  },
  digitalLibraryModules: [
    { id: 'dl-module-default', tenantId: demoTenantId, title: 'Main Church Digital Library', description: 'Public resource center and downloads.', status: 'active', settingsJson: '{}', visibility: 'public', createdBy: 'Local Preview', createdAt: now(), updatedAt: now() },
  ],
  digitalLibraryActivities: [
    { id: 'dl-activity-1', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'create_profile', metadataJson: JSON.stringify({ title: 'Main Church Digital Library' }), createdAt: now() },
  ],
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function addActivity(action) {
  state.activityLogs.unshift({ id: createId('activity'), action, actor: 'Local Preview', createdAt: now() });
}

function addBillingActivity(actionType, metadata = {}) {
  state.billingActivities.unshift({
    id: createId('billing-activity'),
    tenantId: demoTenantId,
    actionType,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  });
}

function addThemeActivity(actionType, metadata = {}) {
  state.themeEngineActivities.unshift({
    id: createId('theme-activity'),
    tenantId: demoTenantId,
    userId: 'Local Preview',
    actionType,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  });
}

function addMediaActivity(actionType, metadata = {}) {
  state.mediaActivities.unshift({
    id: createId('media-activity'),
    tenantId: demoTenantId,
    userId: 'Local Preview',
    actionType,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  });
}

function addChurchServicesActivity(actionType, metadata = {}) {
  state.churchServicesActivities.unshift({
    id: createId('church-services-activity'),
    tenantId: demoTenantId,
    userId: 'Local Preview',
    actionType,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  });
}

function normalizePreviewServiceType(value) {
  const slug = String(value || 'sunday').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const map = {
    'sunday-main': 'sunday',
    'sunday-service': 'sunday',
    'mid-week-service': 'midweek',
    'midweek-service': 'midweek',
    'prayer-service': 'prayer',
    'communion-service': 'communion',
    'healing-service': 'healing',
    'thanksgiving-service': 'thanksgiving',
    'youth-service': 'youth',
    'special-service': 'special',
  };
  return map[slug] || slug || 'sunday';
}

function decorateChurchService(service) {
  return {
    ...service,
    speaker: state.mediaSpeakers.find((item) => item.id === service.speakerId) || null,
    sermonMedia: state.mediaAssets.find((item) => item.id === service.sermonMediaId) || null,
    serviceAudio: state.mediaAssets.find((item) => item.id === service.serviceAudioId) || null,
    livestream: null,
    scriptures: service.scriptures || [],
    attachments: service.attachments || [],
  };
}

function churchServicesOverviewPayload() {
  const services = state.churchServices.map(decorateChurchService);
  const byStatus = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {});
  const byType = services.reduce((acc, service) => {
    acc[service.serviceType] = (acc[service.serviceType] || 0) + 1;
    return acc;
  }, {});
  const totals = services.reduce((acc, service) => {
    acc.attendance += Number(service.attendanceCount || 0);
    acc.giving += Number(service.givingTotal || 0);
    acc.salvation += Number(service.salvationCount || 0);
    return acc;
  }, { attendance: 0, giving: 0, salvation: 0 });
  const upcoming = services
    .filter((service) => service.status !== 'archived' && new Date(service.serviceDate) >= new Date())
    .sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate))
    .slice(0, 5);
  return {
    moduleKey: 'church-services',
    settings: state.churchServicesSettings,
    counts: {
      services: services.length,
      profiles: state.churchServicesProfiles.length,
      published: byStatus.published || 0,
      draft: byStatus.draft || 0,
      archived: byStatus.archived || 0,
      upcoming: upcoming.length,
      activity: state.churchServicesActivities.length,
    },
    totals: {
      attendance: totals.attendance,
      giving: Number(totals.giving.toFixed(2)),
      salvation: totals.salvation,
    },
    breakdowns: { byStatus, byType },
    recentServices: services.slice(0, 8),
    upcomingServices: upcoming,
    recentActivity: state.churchServicesActivities.slice(0, 10),
  };
}

function churchServicesReportsPayload() {
  const overview = churchServicesOverviewPayload();
  const services = state.churchServices.map(decorateChurchService);
  const eventCounts = state.churchServicesActivities.reduce((acc, activity) => {
    acc[activity.actionType] = (acc[activity.actionType] || 0) + 1;
    return acc;
  }, {});
  const volumeByMonth = {};
  const attendanceByType = {};
  const givingByType = {};
  const salvationByType = {};
  services.forEach((service) => {
    const month = new Date(service.serviceDate).toISOString().slice(0, 7);
    volumeByMonth[month] = (volumeByMonth[month] || 0) + 1;
    attendanceByType[service.serviceType] = (attendanceByType[service.serviceType] || 0) + Number(service.attendanceCount || 0);
    givingByType[service.serviceType] = (givingByType[service.serviceType] || 0) + Number(service.givingTotal || 0);
    salvationByType[service.serviceType] = (salvationByType[service.serviceType] || 0) + Number(service.salvationCount || 0);
  });
  return {
    summary: {
      services: overview.counts.services,
      published: overview.counts.published,
      attendance: overview.totals.attendance,
      giving: overview.totals.giving,
      salvation: overview.totals.salvation,
      replays: eventCounts.replay_requested || 0,
      activityCount: state.churchServicesActivities.length,
    },
    charts: {
      serviceVolumeByMonth: Object.entries(volumeByMonth).map(([month, count]) => ({ month, count })),
      attendanceByType: Object.entries(attendanceByType).map(([serviceType, count]) => ({ serviceType, count })),
      givingByType: Object.entries(givingByType).map(([serviceType, total]) => ({ serviceType, total })),
      salvationByType: Object.entries(salvationByType).map(([serviceType, count]) => ({ serviceType, count })),
    },
    byStatus: overview.breakdowns.byStatus,
    byType: overview.breakdowns.byType,
    eventCounts,
    recentActivity: state.churchServicesActivities.slice(0, 25),
    recentEvents: state.churchServicesActivities.slice(0, 25),
  };
}

function normalizePreviewProvider(body) {
  let providerType = body.providerType || 'platform_managed';
  let providerKey = body.providerKey || null;
  if (providerType === 'youtube' || providerType === 'vimeo') {
    providerKey = providerType;
    providerType = 'external_link';
  }
  if (providerType === 's3') {
    providerKey = 'aws_s3';
    providerType = 'bring_your_own';
  }
  if (['cloudinary', 'aws_s3', 'cloudflare_r2', 'mux', 'bunny_storage', 'wasabi', 'backblaze_b2'].includes(providerType)) {
    providerKey = providerType;
    providerType = 'bring_your_own';
  }
  if (!providerKey && providerType === 'platform_managed') providerKey = 'platform';
  if (!providerKey && body.sourceUrl && body.sourceUrl.includes('youtube')) providerKey = 'youtube';
  if (!providerKey && body.sourceUrl && body.sourceUrl.includes('vimeo')) providerKey = 'vimeo';
  if (!providerKey && providerType === 'external_link') providerKey = 'external';
  return { providerType, providerKey };
}

function decorateMediaAsset(asset) {
  return {
    ...asset,
    category: state.mediaCategories.find((item) => item.id === asset.categoryId) || null,
    series: state.mediaSeries.find((item) => item.id === asset.seriesId) || null,
    speaker: state.mediaSpeakers.find((item) => item.id === asset.speakerId) || null,
    assetTags: asset.assetTags || [],
  };
}

function mediaOverviewPayload() {
  const assets = state.mediaAssets.map(decorateMediaAsset);
  const byStatus = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {});
  const byType = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {});
  const storageBytes = assets.reduce((sum, asset) => sum + Number(asset.fileSizeBytes || 0), 0);
  return {
    moduleKey: 'media',
    settings: state.mediaSettings,
    counts: {
      moduleRecords: state.mediaRecords.length,
      assets: assets.length,
      published: byStatus.published || 0,
      draft: byStatus.draft || 0,
      archived: byStatus.archived || 0,
      categories: state.mediaCategories.length,
      tags: state.mediaTags.length,
      series: state.mediaSeries.length,
      playlists: state.mediaPlaylists.length,
      speakers: state.mediaSpeakers.length,
    },
    usage: {
      storageBytes,
      storageGb: Number((storageBytes / 1024 / 1024 / 1024).toFixed(2)),
      providerModes: assets.reduce((acc, asset) => {
        const key = asset.providerKey || asset.providerType;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    },
    breakdowns: { byStatus, byType },
    recentAssets: assets.slice(0, 8),
    recentActivity: state.mediaActivities.slice(0, 10),
  };
}

function mediaReportsPayload() {
  const overview = mediaOverviewPayload();
  const eventCounts = state.mediaActivities.reduce((acc, activity) => {
    acc[activity.actionType] = (acc[activity.actionType] || 0) + 1;
    return acc;
  }, {});
  return {
    summary: {
      assets: overview.counts.assets,
      published: overview.counts.published,
      storageGb: overview.usage.storageGb,
      plays: eventCounts.playback_requested || 0,
      downloads: eventCounts.download_requested || 0,
      activityCount: state.mediaActivities.length,
    },
    eventCounts,
    providerModes: overview.usage.providerModes,
    byStatus: overview.breakdowns.byStatus,
    byType: overview.breakdowns.byType,
    recentActivity: state.mediaActivities.slice(0, 25),
    recentEvents: state.mediaActivities.slice(0, 25),
  };
}

function mediaEmbedForAsset(asset) {
  if (asset.providerKey === 'youtube' && asset.sourceUrl) {
    const match = asset.sourceUrl.match(/(?:v=|youtu\.be\/)([^"&?/\s]{11})/);
    if (match) return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${match[1]}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
  }
  if (asset.providerKey === 'vimeo' && asset.sourceUrl) {
    const match = asset.sourceUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return `<iframe width="560" height="315" src="https://player.vimeo.com/video/${match[1]}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<iframe width="560" height="315" src="/embed/media/${asset.id}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
}

function getBillingPlan(planId = state.billingSubscription.planId) {
  return state.billingPlans.find((plan) => plan.id === planId) || state.billingPlans[0];
}

function withBillingAddOn(item) {
  return {
    ...item,
    addOn: state.billingAddOns.find((addOn) => addOn.id === item.addOnId) || null,
  };
}

function billingSubscriptionSnapshot() {
  if (!state.billingSubscription) return null;
  return {
    ...state.billingSubscription,
    plan: getBillingPlan(state.billingSubscription.planId),
  };
}

function billingMetric(label, key, current, included, rate, unit) {
  const overage = Math.max(0, Number(current || 0) - Number(included || 0));
  return {
    key,
    label,
    current: Number(current || 0),
    included: Number(included || 0),
    rate: Number(rate || 0),
    unit,
    overage,
    overageCost: Number((overage * Number(rate || 0)).toFixed(2)),
  };
}

function billingUsageSnapshot() {
  const plan = getBillingPlan();
  const metrics = [
    billingMetric('Active members', 'active_members', state.billingUsage.active_members, plan.includedMembers, plan.memberOverageRate, 'members'),
    billingMetric('SMS messages', 'sms_sent', state.billingUsage.sms_sent, plan.includedSms, plan.smsOverageRate, 'messages'),
    billingMetric('Email sends', 'email_sent', state.billingUsage.email_sent, plan.includedEmail, plan.emailOverageRate, 'messages'),
    billingMetric('Media storage', 'storage_gb', state.billingUsage.storage_gb, plan.includedStorageGb, plan.storageOverageRate, 'GB'),
    billingMetric('Video bandwidth', 'video_bandwidth_gb', state.billingUsage.video_bandwidth_gb, plan.includedVideoBandwidthGb, plan.videoBandwidthOverageRate, 'GB'),
    billingMetric('AI tokens', 'ai_tokens', state.billingUsage.ai_tokens, plan.includedAiTokens, plan.aiTokenOverageRate, 'tokens'),
    billingMetric('Meeting participant-hours', 'meeting_participant_hours', state.billingUsage.meeting_participant_hours, plan.includedMeetingParticipantHours, plan.meetingParticipantHourRate, 'hours'),
  ];
  return {
    ...state.billingUsage,
    metrics,
    projectedOverageTotal: Number(metrics.reduce((sum, metric) => sum + metric.overageCost, 0).toFixed(2)),
  };
}

function billingReportsSnapshot() {
  const paidInvoices = state.billingInvoices.filter((invoice) => invoice.status === 'paid');
  const openInvoices = state.billingInvoices.filter((invoice) => invoice.status === 'open');
  return {
    invoiceCount: state.billingInvoices.length,
    openInvoices: openInvoices.length,
    paidInvoices: paidInvoices.length,
    totalBilled: Number(paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0).toFixed(2)),
    totalDiscounts: Number(state.billingInvoices.reduce((sum, invoice) => sum + Number(invoice.discount || 0), 0).toFixed(2)),
    activeCoupons: state.billingCoupons.filter((coupon) => coupon.isActive).length,
    activeAddOns: state.billingActiveAddOns.filter((item) => item.status === 'active').length,
    activeEntitlements: state.billingEntitlements.filter((item) => item.status === 'active').length,
    activityCount: state.billingActivities.length,
  };
}

function billingOverviewPayload() {
  return {
    plans: state.billingPlans,
    subscription: billingSubscriptionSnapshot(),
    usage: billingUsageSnapshot(),
    invoices: state.billingInvoices,
    addOns: state.billingAddOns,
    activeAddOns: state.billingActiveAddOns.map(withBillingAddOn),
    coupons: state.billingCoupons,
    settings: state.billingSettings,
    reports: billingReportsSnapshot(),
    entitlements: state.billingEntitlements,
    records: state.billingRecords,
  };
}

function mergeLocalThemeSettings(current, customizations) {
  const merged = { ...(current || {}), ...(customizations || {}) };
  [
    'assets',
    'colors',
    'components',
    'customizer',
    'design',
    'fonts',
    'footer',
    'header',
    'layout',
    'logo',
    'logos',
    'motion',
    'seo',
    'sourcePackage',
    'typography',
    'websiteSettings',
  ].forEach((key) => {
    merged[key] = {
      ...((current || {})[key] || {}),
      ...((customizations || {})[key] || {}),
    };
  });
  return merged;
}

function titleFromEcclesiaFile(fileName) {
  if (fileName === 'index.html') return 'Home';
  return fileName
    .replace(/\.html$/, '')
    .split('-')
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : part)
    .join(' ');
}

const ECCLESIA_SOURCE_FILE_SLUGS = {
  'index.html': '',
  'about.html': 'about',
  'sermons.html': 'sermons',
  'events.html': 'events',
  'ministries.html': 'ministries',
  'prayer.html': 'prayer',
  'contact.html': 'contact',
  'login.html': 'login',
  'account.html': 'account',
  'giving.html': 'giving',
  'giving-partnership.html': 'partnership',
  'livestream-page.html': 'livestream',
  'media-archive.html': 'media',
  'media-single.html': 'media/sample-message',
  'podcast-archive.html': 'podcast',
  'podcast-episode.html': 'podcast/sample-episode',
  'blog-archive.html': 'blog',
  'blog-single.html': 'blog/sample-post',
  'services-archive.html': 'services',
  'service-single.html': 'services/sample-service',
  'library-archive.html': 'library',
  'resource-single.html': 'library/sample-resource',
  'courses-archive.html': 'courses',
  'course-main.html': 'courses/main',
  'lesson-single.html': 'courses/lesson',
  'events-archive.html': 'events/archive',
  'event-single.html': 'events/sample-event',
  'event-register.html': 'events/register',
  'prayer-home.html': 'prayer-home',
  'prayer-wall.html': 'prayer/wall',
  'prayer-room.html': 'prayer/room',
  'testimony-wall.html': 'testimonies',
  'testimony-single.html': 'testimonies/sample-story',
  'testimony-submit.html': 'testimonies/submit',
  'worship.html': 'worship',
};

function slugFromEcclesiaFile(fileName) {
  if (Object.prototype.hasOwnProperty.call(ECCLESIA_SOURCE_FILE_SLUGS, fileName)) {
    return ECCLESIA_SOURCE_FILE_SLUGS[fileName];
  }
  if (fileName === 'index.html') return '';
  return fileName
    .replace(/\.html$/, '')
    .replace(/-archive$/, '')
    .replace(/-page$/, '')
    .replace(/-single$/, '/sample')
    .replace(/-main$/, '/main');
}

function localEcclesiaPageTemplatesPayload() {
  const templates = new Map(state.pageTemplates.map((template) => [template.key, template]));
  const pages = localEcclesiaThemeSettings.sourcePackage?.pages || [];
  pages.forEach((fileName) => {
    const key = fileName.replace(/\.html$/, '');
    if (templates.has(key)) return;
    const title = titleFromEcclesiaFile(fileName);
    templates.set(key, {
      name: title,
      title,
      key,
      slug: slugFromEcclesiaFile(fileName),
      icon: 'file-text',
      description: `Source-backed Ecclesia page from ${fileName}.`,
      type: 'page',
      status: 'published',
      sourceFile: fileName,
      sourceUrl: `/themes/ecclesia/${fileName}`,
      structure: {
        template: key,
        sections: ['hero', 'cta_section'],
        widgetAware: true,
        builderEditable: true,
        staticSource: true,
        sourceFile: fileName,
        sourceUrl: `/themes/ecclesia/${fileName}`,
        assetBase: '/themes/ecclesia',
      },
    });
  });
  return Array.from(templates.values());
}

function sourcePageRecordFromEcclesiaFile(fileName) {
  const slug = slugFromEcclesiaFile(fileName);
  const slugKey = slug ? slug.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') : 'home';
  const title = titleFromEcclesiaFile(fileName);
  return {
    id: `page-ecclesia-${slugKey || 'home'}`,
    websiteId: demoWebsiteId,
    title,
    slug,
    status: 'published',
    isHome: slug === '',
    seoTitle: `${title} | Demo Church`,
    seoDescription: `Source-backed Ecclesia page from ${fileName}.`,
    content: [],
    draftContent: null,
    sourceFile: fileName,
    sourceUrl: `/themes/ecclesia/${fileName}`,
    module: 'Ecclesia',
    createdAt: now(),
    updatedAt: now(),
  };
}

function ensureLocalEcclesiaSourcePages() {
  const files = localEcclesiaThemeSettings.sourcePackage?.pages || [];
  files.forEach((fileName) => {
    const sourcePage = sourcePageRecordFromEcclesiaFile(fileName);
    const existing = state.pages.find((page) => page.slug === sourcePage.slug || page.id === sourcePage.id);
    if (existing) {
      Object.assign(existing, {
        sourceFile: sourcePage.sourceFile,
        sourceUrl: sourcePage.sourceUrl,
        module: sourcePage.module,
        isHome: sourcePage.isHome || existing.isHome,
        updatedAt: now(),
      });
    } else {
      state.pages.push(sourcePage);
    }
  });
}

ensureLocalEcclesiaSourcePages();

function createPreviewInvoice(status = 'open') {
  const usage = billingUsageSnapshot();
  const plan = getBillingPlan();
  const activeAddOnTotal = state.billingActiveAddOns
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => {
      const addOn = state.billingAddOns.find((entry) => entry.id === item.addOnId);
      return sum + Number(addOn?.price || 0) * Number(item.quantity || 1);
    }, 0);
  const subtotal = Number((plan.basePrice + usage.projectedOverageTotal + activeAddOnTotal).toFixed(2));
  const coupon = state.billingCoupons.find((item) => item.code === state.billingSubscription.couponCode && item.isActive);
  const discount = coupon
    ? Number((coupon.discountType === 'percent' ? subtotal * (coupon.discountValue / 100) : coupon.discountValue).toFixed(2))
    : 0;
  const invoice = {
    id: createId('invoice'),
    invoiceNumber: `${JSON.parse(state.billingSettings.configJson || '{}').invoicePrefix || 'INV'}-${String(state.billingInvoices.length + 1).padStart(4, '0')}`,
    tenantId: demoTenantId,
    subscriptionId: state.billingSubscription.id,
    amount: Number(Math.max(0, subtotal - discount).toFixed(2)),
    subtotal,
    discount,
    currency: plan.currency || 'USD',
    status,
    lineItemsJson: JSON.stringify([{ label: `${plan.name} plan`, amount: plan.basePrice }, { label: 'Usage overages', amount: usage.projectedOverageTotal }]),
    billingPeriodStart: state.billingSubscription.currentPeriodStart,
    billingPeriodEnd: state.billingSubscription.currentPeriodEnd,
    createdAt: now(),
  };
  state.billingInvoices.unshift(invoice);
  addBillingActivity('invoice_generated', { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount });
  return invoice;
}

async function handleBillingApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/billing/overview' && method === 'GET') {
    return sendJson(res, 200, { data: billingOverviewPayload() });
  }

  if (pathname === '/api/billing/activity' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingActivities });
  }

  if (pathname === '/api/billing/plans' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingPlans });
  }

  if (pathname === '/api/billing/usage' && method === 'GET') {
    return sendJson(res, 200, { data: { subscription: billingSubscriptionSnapshot(), usage: billingUsageSnapshot() } });
  }

  if (pathname === '/api/billing/usage' && method === 'POST') {
    const metricKey = body.metricKey || 'sms_sent';
    const quantity = Number(body.quantity || 0);
    state.billingUsage[metricKey] = Number(state.billingUsage[metricKey] || 0) + quantity;
    addBillingActivity('usage_recorded', { metricKey, quantity });
    return sendJson(res, 201, { data: billingUsageSnapshot() });
  }

  if (pathname === '/api/billing/invoices' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingInvoices });
  }

  if (pathname === '/api/billing/invoice/trigger' && method === 'POST') {
    return sendJson(res, 201, { data: createPreviewInvoice('open') });
  }

  if (pathname === '/api/billing/webhook' && method === 'POST') {
    const invoice = state.billingInvoices.find((item) => item.id === body.invoiceId);
    if (!invoice) return sendJson(res, 404, { error: 'Invoice not found' });
    if (body.event === 'payment_intent.succeeded' || body.event === 'invoice.paid') {
      invoice.status = 'paid';
      state.billingSubscription.status = 'active';
    }
    if (body.event === 'payment_intent.payment_failed' || body.event === 'invoice.payment_failed') {
      invoice.status = 'failed';
      state.billingSubscription.status = 'past_due';
    }
    addBillingActivity('payment_webhook_processed', { invoiceId: invoice.id, event: body.event });
    return sendJson(res, 200, { data: { invoice, subscription: billingSubscriptionSnapshot() } });
  }

  if (pathname === '/api/billing/subscribe' && method === 'POST') {
    const plan = getBillingPlan(body.planId);
    state.billingSubscription.planId = plan.id;
    state.billingSubscription.status = Number(body.trialDays || 0) > 0 ? 'trialing' : 'active';
    state.billingSubscription.providerMode = body.providerMode || state.billingSubscription.providerMode;
    if (body.couponCode) state.billingSubscription.couponCode = String(body.couponCode).toUpperCase();
    addBillingActivity('subscription_updated', { planId: plan.id, couponCode: state.billingSubscription.couponCode });
    return sendJson(res, 200, { data: billingSubscriptionSnapshot() });
  }

  if (pathname === '/api/billing/add-ons' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingAddOns });
  }

  if (pathname === '/api/billing/add-ons' && method === 'POST') {
    const addOn = {
      id: createId('addon'),
      tenantId: demoTenantId,
      key: body.key || createId('custom-addon'),
      name: body.name || 'Custom Add-on',
      description: body.description || '',
      moduleKey: body.moduleKey || null,
      price: Number(body.price || 0),
      billingMode: body.billingMode || 'monthly',
      usageMetricKey: body.usageMetricKey || null,
      includedQuantity: Number(body.includedQuantity || 0),
      overageRate: Number(body.overageRate || 0),
      isActive: true,
    };
    state.billingAddOns.push(addOn);
    addBillingActivity('addon_created', { addOnId: addOn.id, name: addOn.name });
    return sendJson(res, 201, { data: addOn });
  }

  const addOnActivateMatch = pathname.match(/^\/api\/billing\/add-ons\/([^/]+)\/activate$/);
  if (addOnActivateMatch && method === 'POST') {
    const addOn = state.billingAddOns.find((item) => item.id === addOnActivateMatch[1]);
    if (!addOn) return sendJson(res, 404, { error: 'Add-on not found' });
    let active = state.billingActiveAddOns.find((item) => item.addOnId === addOn.id);
    if (!active) {
      active = { id: createId('active-addon'), tenantId: demoTenantId, subscriptionId: state.billingSubscription.id, addOnId: addOn.id, quantity: Number(body.quantity || 1), status: 'active', activatedAt: now() };
      state.billingActiveAddOns.push(active);
    } else {
      active.status = 'active';
      active.quantity = Number(body.quantity || active.quantity || 1);
    }
    if (addOn.moduleKey) {
      const entitlement = state.billingEntitlements.find((item) => item.moduleKey === addOn.moduleKey);
      if (entitlement) entitlement.status = 'active';
    }
    addBillingActivity('addon_activated', { addOnId: addOn.id, name: addOn.name });
    return sendJson(res, 200, { data: withBillingAddOn(active) });
  }

  const addOnDeactivateMatch = pathname.match(/^\/api\/billing\/subscription-add-ons\/([^/]+)\/deactivate$/);
  if (addOnDeactivateMatch && method === 'POST') {
    const active = state.billingActiveAddOns.find((item) => item.id === addOnDeactivateMatch[1]);
    if (!active) return sendJson(res, 404, { error: 'Active add-on not found' });
    active.status = 'cancelled';
    addBillingActivity('addon_deactivated', { activeAddOnId: active.id });
    return sendJson(res, 200, { data: withBillingAddOn(active) });
  }

  if (pathname === '/api/billing/coupons' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingCoupons });
  }

  if (pathname === '/api/billing/coupons' && method === 'POST') {
    const coupon = {
      id: createId('coupon'),
      tenantId: demoTenantId,
      code: String(body.code || createId('coupon-code')).toUpperCase(),
      description: body.description || '',
      discountType: body.discountType || 'percent',
      discountValue: Number(body.discountValue || 0),
      maxRedemptions: body.maxRedemptions === undefined || body.maxRedemptions === null ? null : Number(body.maxRedemptions),
      redeemedCount: 0,
      isActive: true,
      expiresAt: body.expiresAt || null,
    };
    state.billingCoupons.push(coupon);
    addBillingActivity('coupon_created', { code: coupon.code });
    return sendJson(res, 201, { data: coupon });
  }

  if (pathname === '/api/billing/coupons/apply' && method === 'POST') {
    const coupon = state.billingCoupons.find((item) => item.code === String(body.code || '').toUpperCase() && item.isActive);
    if (!coupon) return sendJson(res, 404, { error: 'Coupon not found' });
    state.billingSubscription.couponCode = coupon.code;
    coupon.redeemedCount += 1;
    addBillingActivity('coupon_applied', { code: coupon.code });
    return sendJson(res, 200, { data: billingSubscriptionSnapshot() });
  }

  if (pathname === '/api/billing/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingSettings });
  }

  if (pathname === '/api/billing/settings' && method === 'PATCH') {
    state.billingSettings = { ...state.billingSettings, ...body, updatedAt: now() };
    if (body.config) {
      state.billingSettings.configJson = JSON.stringify({ ...JSON.parse(state.billingSettings.configJson || '{}'), ...body.config });
    }
    addBillingActivity('settings_updated', { providerMode: state.billingSettings.providerMode });
    return sendJson(res, 200, { data: state.billingSettings });
  }

  const entitlementMatch = pathname.match(/^\/api\/billing\/entitlements\/([^/]+)$/);
  if (entitlementMatch && method === 'PATCH') {
    let entitlement = state.billingEntitlements.find((item) => item.moduleKey === entitlementMatch[1]);
    if (!entitlement) {
      entitlement = { id: createId('entitlement'), tenantId: demoTenantId, moduleKey: entitlementMatch[1], status: 'active', billingRule: 'manual', module: { name: entitlementMatch[1] } };
      state.billingEntitlements.push(entitlement);
    }
    entitlement.status = body.status || entitlement.status;
    entitlement.billingRule = body.billingRule || entitlement.billingRule;
    addBillingActivity('entitlement_updated', { moduleKey: entitlement.moduleKey, status: entitlement.status });
    return sendJson(res, 200, { data: entitlement });
  }

  if (pathname === '/api/billing/reports' && method === 'GET') {
    return sendJson(res, 200, { data: billingReportsSnapshot() });
  }

  if (pathname === '/api/billing' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingRecords });
  }

  if (pathname === '/api/billing' && method === 'POST') {
    const record = { id: createId('billing-record'), tenantId: demoTenantId, title: body.title || 'Billing Record', description: body.description || '', status: body.status || 'active', visibility: body.visibility || 'private', settingsJson: JSON.stringify(body.settings || {}), createdAt: now(), updatedAt: now() };
    state.billingRecords.push(record);
    addBillingActivity('record_created', { recordId: record.id, title: record.title });
    return sendJson(res, 201, { data: record });
  }

  return sendJson(res, 404, { error: 'Billing preview endpoint not found' });
}

async function handleThemeEngineApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  const themeOverview = () => {
    const activeWebsite = state.websites.find((website) => website.id === demoWebsiteId) || state.websites[0];
    const activeTheme = state.themes.find((theme) => theme.id === activeWebsite?.themeId) || state.themes[0];
    return {
      moduleKey: 'theme-engine',
      settings: state.themeEngineSettings,
      counts: {
        moduleProfiles: 1,
        installedThemes: state.themes.length,
        globalThemes: 0,
        websites: state.websites.length,
        sectionTemplates: state.sectionTemplates.length,
        pageTemplates: state.pageTemplates.length,
      },
      activeWebsite: activeWebsite ? {
        id: activeWebsite.id,
        title: activeWebsite.title,
        themeId: activeWebsite.themeId,
        themeName: activeTheme?.name,
      } : null,
      recentActivity: state.themeEngineActivities.slice(0, 5),
    };
  };

  if (pathname === '/api/theme-engine/overview' && method === 'GET') {
    return sendJson(res, 200, { data: themeOverview() });
  }

  if (pathname === '/api/theme-engine/themes' && method === 'GET') {
    return sendJson(res, 200, { data: state.themes });
  }

  if (pathname === '/api/theme-engine/sections' && method === 'GET') {
    return sendJson(res, 200, { data: state.sectionTemplates });
  }

  if (pathname === '/api/theme-engine/page-templates' && method === 'GET') {
    return sendJson(res, 200, { data: localEcclesiaPageTemplatesPayload() });
  }

  if (pathname === '/api/theme-engine/reports' && method === 'GET') {
    return sendJson(res, 200, { data: state.themeEngineActivities });
  }

  if (pathname === '/api/theme-engine/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.themeEngineSettings });
  }

  if (pathname === '/api/theme-engine/settings' && method === 'PATCH') {
    const currentConfig = JSON.parse(state.themeEngineSettings.configJson || '{}');
    state.themeEngineSettings = {
      ...state.themeEngineSettings,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : state.themeEngineSettings.enabled,
      billingPlan: body.billingPlan || state.themeEngineSettings.billingPlan,
      providerMode: body.providerMode || state.themeEngineSettings.providerMode,
      configJson: JSON.stringify({ ...currentConfig, ...(body.configJson || {}) }),
      updatedAt: now(),
    };
    addThemeActivity('settings_update', { updatedFields: Object.keys(body) });
    return sendJson(res, 200, { data: state.themeEngineSettings });
  }

  if (pathname === '/api/theme-engine/themes/install' && method === 'POST') {
    const asset = state.marketplaceAssets.find((item) => item.id === body.assetId || item.name === body.themeName) || state.marketplaceAssets[0];
    const exists = state.themes.find((theme) => theme.name === asset.name);
    if (exists) return sendJson(res, 409, { error: 'Theme is already installed' });

    const theme = {
      id: createId('theme'),
      tenantId: demoTenantId,
      name: asset.name,
      settings: JSON.parse(asset.assetConfig || '{}'),
      isCustom: true,
      createdAt: now(),
      updatedAt: now(),
    };
    state.themes.unshift(theme);
    addThemeActivity('install_theme', { themeId: theme.id, name: theme.name });
    return sendJson(res, 201, { data: theme });
  }

  const activateMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/activate$/);
  if (activateMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === activateMatch[1]);
    const website = state.websites.find((item) => item.id === (body.websiteId || demoWebsiteId));
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    if (!website) return sendJson(res, 404, { error: 'Website not found' });
    website.themeId = theme.id;
    website.updatedAt = now();
    addThemeActivity('activate_theme', { themeId: theme.id, websiteId: website.id });
    return sendJson(res, 200, { data: website });
  }

  const customizeMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/customize$/);
  if (customizeMatch && method === 'PATCH') {
    const theme = state.themes.find((item) => item.id === customizeMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    const current = typeof theme.settings === 'string' ? JSON.parse(theme.settings || '{}') : (theme.settings || {});
    theme.settings = mergeLocalThemeSettings(current, body);
    theme.updatedAt = now();
    addThemeActivity('customize_theme', { themeId: theme.id });
    return sendJson(res, 200, { data: theme });
  }

  const draftMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/customization\/draft$/);
  if (draftMatch && method === 'PATCH') {
    const theme = state.themes.find((item) => item.id === draftMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    const currentSettings = theme.draftSettings || theme.settings || {};
    const current = typeof currentSettings === 'string' ? JSON.parse(currentSettings || '{}') : currentSettings;
    theme.draftSettings = mergeLocalThemeSettings(current, body);
    theme.updatedAt = now();
    addThemeActivity('save_customization_draft', { themeId: theme.id });
    return sendJson(res, 200, { data: theme });
  }

  const publishMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/customization\/publish$/);
  if (publishMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === publishMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    if (theme.draftSettings) theme.settings = theme.draftSettings;
    theme.draftSettings = null;
    theme.updatedAt = now();
    addThemeActivity('publish_customization', { themeId: theme.id });
    return sendJson(res, 200, { data: theme });
  }

  const discardMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/customization\/discard$/);
  if (discardMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === discardMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    theme.draftSettings = null;
    theme.updatedAt = now();
    addThemeActivity('discard_customization', { themeId: theme.id });
    return sendJson(res, 200, { data: theme });
  }

  const resetMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/customization\/reset$/);
  if (resetMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === resetMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    theme.settings = JSON.parse(JSON.stringify(localEcclesiaThemeSettings));
    theme.draftSettings = null;
    theme.updatedAt = now();
    addThemeActivity('reset_customization', { themeId: theme.id });
    return sendJson(res, 200, { data: theme });
  }

  const previewMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/preview$/);
  if (previewMatch && method === 'GET') {
    const theme = state.themes.find((item) => item.id === previewMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    return sendJson(res, 200, { data: { themeId: theme.id, name: theme.name, settings: theme.settings, isPreview: true, timestamp: now() } });
  }

  const previewCustomizeMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/preview\/customize$/);
  if (previewCustomizeMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === previewCustomizeMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    const current = typeof theme.settings === 'string' ? JSON.parse(theme.settings || '{}') : (theme.settings || {});
    return sendJson(res, 200, {
      data: {
        themeId: theme.id,
        settings: {
          ...current,
          ...body,
          colors: { ...(current.colors || {}), ...(body.colors || {}) },
        },
        isPreview: true,
        staging: true,
      },
    });
  }

  return sendJson(res, 404, { error: 'Theme Engine preview endpoint not found' });
}

async function handleMediaApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/media/overview' && method === 'GET') {
    return sendJson(res, 200, { data: mediaOverviewPayload() });
  }

  if (pathname === '/api/media/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaSettings });
  }

  if (pathname === '/api/media/settings' && method === 'PATCH') {
    const currentConfig = JSON.parse(state.mediaSettings.configJson || '{}');
    state.mediaSettings = {
      ...state.mediaSettings,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : state.mediaSettings.enabled,
      billingPlan: body.billingPlan || state.mediaSettings.billingPlan,
      providerMode: body.providerMode || state.mediaSettings.providerMode,
      configJson: JSON.stringify({ ...currentConfig, ...(body.configJson || {}) }),
      updatedAt: now(),
    };
    addMediaActivity('settings_updated', { fields: Object.keys(body), providerMode: state.mediaSettings.providerMode });
    return sendJson(res, 200, { data: state.mediaSettings });
  }

  if (pathname === '/api/media/reports' && method === 'GET') {
    return sendJson(res, 200, { data: mediaReportsPayload() });
  }

  if (pathname === '/api/media/activity' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaActivities });
  }

  if (pathname === '/api/media/templates' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        categories: state.mediaCategories,
        tags: state.mediaTags,
        series: state.mediaSeries,
        playlists: state.mediaPlaylists,
        speakers: state.mediaSpeakers,
      },
    });
  }

  if (pathname === '/api/media/uploads/intent' && method === 'POST') {
    const config = JSON.parse(state.mediaSettings.configJson || '{}');
    const maxBytes = Number(config.maxUploadSizeMb || 500) * 1024 * 1024;
    if (Number(body.fileSizeBytes || 0) > maxBytes) {
      return sendJson(res, 400, { error: `File exceeds the ${config.maxUploadSizeMb || 500} MB upload limit` });
    }
    const providerKey = body.providerKey || config.defaultStorageProvider || 'platform';
    const intent = {
      id: createId('upload'),
      tenantId: demoTenantId,
      moduleKey: 'media',
      fileName: body.fileName || 'media-upload.bin',
      fileSizeBytes: Number(body.fileSizeBytes || 0),
      mimeType: body.mimeType || 'application/octet-stream',
      type: body.type || 'video',
      providerMode: state.mediaSettings.providerMode,
      providerKey,
      uploadUrl: providerKey === 'platform' ? `/api/media/uploads/${Date.now()}` : null,
      instructions: providerKey === 'platform' ? 'Upload through ChurchOS preview storage.' : `Use ${providerKey} and save the returned URL.`,
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    };
    addMediaActivity('upload_intent_created', { providerKey, fileName: intent.fileName });
    return sendJson(res, 201, { data: intent });
  }

  if (pathname === '/api/media/categories' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaCategories });
  }

  if (pathname === '/api/media/categories' && method === 'POST') {
    const name = body.name || 'New Category';
    const category = { id: createId('media-cat'), tenantId: demoTenantId, name, slug: String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-'), parentId: body.parentId || null, createdAt: now(), updatedAt: now(), children: [] };
    state.mediaCategories.push(category);
    addMediaActivity('category_created', { categoryId: category.id, name });
    return sendJson(res, 201, { data: category });
  }

  if (pathname === '/api/media/tags' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaTags });
  }

  if (pathname === '/api/media/tags' && method === 'POST') {
    const name = body.name || 'New Tag';
    const tag = { id: createId('media-tag'), tenantId: demoTenantId, name, slug: String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-'), createdAt: now() };
    state.mediaTags.push(tag);
    addMediaActivity('tag_created', { tagId: tag.id, name });
    return sendJson(res, 201, { data: tag });
  }

  if (pathname === '/api/media/speakers' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaSpeakers });
  }

  if (pathname === '/api/media/speakers' && method === 'POST') {
    const speaker = { id: createId('media-speaker'), tenantId: demoTenantId, name: body.name || 'Guest Speaker', title: body.title || '', bio: body.bio || '', photoUrl: body.photoUrl || '', createdAt: now(), updatedAt: now() };
    state.mediaSpeakers.push(speaker);
    addMediaActivity('speaker_created', { speakerId: speaker.id, name: speaker.name });
    return sendJson(res, 201, { data: speaker });
  }

  const speakerMatch = pathname.match(/^\/api\/media\/speakers\/([^/]+)$/);
  if (speakerMatch && (method === 'PATCH' || method === 'PUT')) {
    const speaker = state.mediaSpeakers.find((item) => item.id === speakerMatch[1]);
    if (!speaker) return sendJson(res, 404, { error: 'Speaker not found' });
    Object.assign(speaker, body, { updatedAt: now() });
    addMediaActivity('speaker_updated', { speakerId: speaker.id });
    return sendJson(res, 200, { data: speaker });
  }

  if (pathname === '/api/media/series' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaSeries });
  }

  if (pathname === '/api/media/series' && method === 'POST') {
    const series = { id: createId('media-series'), tenantId: demoTenantId, title: body.title || 'New Series', description: body.description || '', coverImageUrl: body.coverImageUrl || '', createdAt: now(), updatedAt: now() };
    state.mediaSeries.unshift(series);
    addMediaActivity('series_created', { seriesId: series.id, title: series.title });
    return sendJson(res, 201, { data: series });
  }

  if (pathname === '/api/media/assets' && method === 'GET') {
    let assets = state.mediaAssets.map(decorateMediaAsset);
    const search = parsedUrl.searchParams.get('search');
    const type = parsedUrl.searchParams.get('type');
    const status = parsedUrl.searchParams.get('status');
    const categoryId = parsedUrl.searchParams.get('categoryId');
    const seriesId = parsedUrl.searchParams.get('seriesId');
    if (search) assets = assets.filter((asset) => asset.title.toLowerCase().includes(search.toLowerCase()) || String(asset.description || '').toLowerCase().includes(search.toLowerCase()));
    if (type) assets = assets.filter((asset) => asset.type === type);
    if (status) assets = assets.filter((asset) => asset.status === status);
    if (categoryId) assets = assets.filter((asset) => asset.categoryId === categoryId);
    if (seriesId) assets = assets.filter((asset) => asset.seriesId === seriesId);
    return sendJson(res, 200, { data: assets, meta: { total: assets.length, page: 1, pageSize: assets.length } });
  }

  if (pathname === '/api/media/assets' && method === 'POST') {
    const provider = normalizePreviewProvider(body);
    const config = JSON.parse(state.mediaSettings.configJson || '{}');
    if ((body.status === 'published' || body.status === 'ready') && config.publishRequiresThumbnail && !body.thumbnailUrl) {
      return sendJson(res, 400, { error: 'A thumbnail is required before publishing' });
    }
    const asset = {
      id: createId('media-asset'),
      tenantId: demoTenantId,
      title: body.title || 'Untitled Media Asset',
      description: body.description || '',
      type: body.type || 'video',
      providerType: provider.providerType,
      providerKey: provider.providerKey,
      sourceUrl: body.sourceUrl || '',
      thumbnailUrl: body.thumbnailUrl || '',
      durationSeconds: Number(body.durationSeconds || 0),
      fileSizeBytes: Number(body.fileSizeBytes || 0),
      mimeType: body.mimeType || '',
      categoryId: body.categoryId || null,
      seriesId: body.seriesId || null,
      seriesOrder: body.seriesOrder || null,
      speakerId: body.speakerId || null,
      visibility: body.visibility || config.defaultVisibility || 'public',
      status: body.status === 'ready' ? 'published' : (body.status || config.defaultStatus || 'draft'),
      publishedAt: (body.status === 'published' || body.status === 'ready') ? now() : null,
      createdAt: now(),
      updatedAt: now(),
      assetTags: [],
    };
    state.mediaAssets.unshift(asset);
    addMediaActivity('asset_created', { assetId: asset.id, title: asset.title, providerKey: asset.providerKey });
    return sendJson(res, 201, { data: decorateMediaAsset(asset) });
  }

  const assetTagsMatch = pathname.match(/^\/api\/media\/assets\/([^/]+)\/tags$/);
  if (assetTagsMatch && method === 'POST') {
    const asset = state.mediaAssets.find((item) => item.id === assetTagsMatch[1]);
    if (!asset) return sendJson(res, 404, { error: 'Asset not found' });
    const tagIds = Array.isArray(body.tagIds) ? body.tagIds : [];
    asset.assetTags = tagIds.map((tagId) => ({ tagId, tag: state.mediaTags.find((tag) => tag.id === tagId) || { id: tagId, name: tagId, slug: tagId } }));
    addMediaActivity('asset_tagged', { assetId: asset.id, tagIds });
    return sendJson(res, 200, { data: asset.assetTags });
  }

  const assetEmbedMatch = pathname.match(/^\/api\/media\/assets\/([^/]+)\/embed$/);
  if (assetEmbedMatch && method === 'GET') {
    const asset = state.mediaAssets.find((item) => item.id === assetEmbedMatch[1]);
    if (!asset) return sendJson(res, 404, { error: 'Asset not found' });
    return sendJson(res, 200, { data: { embedHtml: mediaEmbedForAsset(asset) } });
  }

  const assetPlaybackMatch = pathname.match(/^\/api\/media\/assets\/([^/]+)\/playback$/);
  if (assetPlaybackMatch && method === 'POST') {
    const asset = state.mediaAssets.find((item) => item.id === assetPlaybackMatch[1]);
    if (!asset) return sendJson(res, 404, { error: 'Asset not found' });
    addMediaActivity('playback_requested', { assetId: asset.id, title: asset.title });
    return sendJson(res, 200, { data: { assetId: asset.id, title: asset.title, sourceUrl: asset.sourceUrl, embedHtml: mediaEmbedForAsset(asset), quality: JSON.parse(state.mediaSettings.configJson || '{}').defaultStreamingQuality || '720p' } });
  }

  const assetMatch = pathname.match(/^\/api\/media\/assets\/([^/]+)$/);
  if (assetMatch) {
    const asset = state.mediaAssets.find((item) => item.id === assetMatch[1]);
    if (!asset) return sendJson(res, 404, { error: 'Asset not found' });
    if (method === 'GET') return sendJson(res, 200, { data: decorateMediaAsset(asset) });
    if (method === 'PATCH' || method === 'PUT') {
      Object.assign(asset, body, normalizePreviewProvider({ ...asset, ...body }), { updatedAt: now() });
      if (body.status === 'ready') asset.status = 'published';
      addMediaActivity('asset_updated', { assetId: asset.id, fields: Object.keys(body) });
      return sendJson(res, 200, { data: decorateMediaAsset(asset) });
    }
    if (method === 'DELETE') {
      asset.status = 'archived';
      asset.updatedAt = now();
      addMediaActivity('asset_archived', { assetId: asset.id, title: asset.title });
      return sendJson(res, 200, { data: decorateMediaAsset(asset), message: 'Asset archived successfully' });
    }
  }

  if (pathname === '/api/media/playlists' && method === 'GET') {
    const playlists = state.mediaPlaylists.map((playlist) => ({ ...playlist, _count: { items: state.mediaPlaylistItems.filter((item) => item.playlistId === playlist.id).length } }));
    return sendJson(res, 200, { data: playlists });
  }

  if (pathname === '/api/media/playlists' && method === 'POST') {
    const playlist = { id: createId('media-playlist'), tenantId: demoTenantId, name: body.name || 'New Playlist', description: body.description || '', coverImageUrl: body.coverImageUrl || '', isPublic: body.isPublic !== false, createdAt: now(), updatedAt: now(), _count: { items: 0 } };
    state.mediaPlaylists.unshift(playlist);
    addMediaActivity('playlist_created', { playlistId: playlist.id, name: playlist.name });
    return sendJson(res, 201, { data: playlist });
  }

  const playlistItemsMatch = pathname.match(/^\/api\/media\/playlists\/([^/]+)\/items$/);
  if (playlistItemsMatch && method === 'GET') {
    const items = state.mediaPlaylistItems
      .filter((item) => item.playlistId === playlistItemsMatch[1])
      .sort((a, b) => a.order - b.order)
      .map((item) => ({ ...item, asset: decorateMediaAsset(state.mediaAssets.find((asset) => asset.id === item.assetId) || {}) }));
    return sendJson(res, 200, { data: items });
  }

  if (playlistItemsMatch && method === 'POST') {
    const asset = state.mediaAssets.find((item) => item.id === body.assetId);
    if (!asset) return sendJson(res, 404, { error: 'Asset not found' });
    const item = { id: createId('media-playlist-item'), playlistId: playlistItemsMatch[1], assetId: asset.id, order: Number(body.order || 0) };
    state.mediaPlaylistItems = state.mediaPlaylistItems.filter((existing) => !(existing.playlistId === item.playlistId && existing.assetId === item.assetId));
    state.mediaPlaylistItems.push(item);
    addMediaActivity('playlist_item_added', { playlistId: item.playlistId, assetId: item.assetId, order: item.order });
    return sendJson(res, 201, { data: { ...item, asset: decorateMediaAsset(asset) } });
  }

  const playlistItemDeleteMatch = pathname.match(/^\/api\/media\/playlists\/([^/]+)\/items\/([^/]+)$/);
  if (playlistItemDeleteMatch && method === 'DELETE') {
    const before = state.mediaPlaylistItems.length;
    state.mediaPlaylistItems = state.mediaPlaylistItems.filter((item) => !(item.playlistId === playlistItemDeleteMatch[1] && item.assetId === playlistItemDeleteMatch[2]));
    const count = before - state.mediaPlaylistItems.length;
    addMediaActivity('playlist_item_removed', { playlistId: playlistItemDeleteMatch[1], assetId: playlistItemDeleteMatch[2], count });
    return sendJson(res, 200, { data: { count }, message: 'Item removed from playlist' });
  }

  if (pathname === '/api/media' && method === 'GET') {
    return sendJson(res, 200, { data: state.mediaRecords });
  }

  if (pathname === '/api/media' && method === 'POST') {
    const record = { id: createId('media-record'), tenantId: demoTenantId, title: body.title || 'Media Workspace', description: body.description || '', status: 'active', settingsJson: JSON.stringify(body.settingsJson || {}), visibility: body.visibility || 'private', createdBy: 'Local Preview', createdAt: now(), updatedAt: now() };
    state.mediaRecords.unshift(record);
    addMediaActivity('module_record_created', { recordId: record.id, title: record.title });
    return sendJson(res, 201, { data: record });
  }

  const recordMatch = pathname.match(/^\/api\/media\/([^/]+)$/);
  if (recordMatch) {
    const record = state.mediaRecords.find((item) => item.id === recordMatch[1]);
    if (!record) return sendJson(res, 404, { error: 'Media module record not found' });
    if (method === 'GET') return sendJson(res, 200, { data: record });
    if (method === 'PATCH') {
      Object.assign(record, body, { updatedAt: now() });
      addMediaActivity('module_record_updated', { recordId: record.id });
      return sendJson(res, 200, { data: record });
    }
    if (method === 'DELETE') {
      record.status = 'archived';
      record.updatedAt = now();
      addMediaActivity('module_record_archived', { recordId: record.id });
      return sendJson(res, 200, { data: record, success: true });
    }
  }

  return sendJson(res, 404, { error: 'Media preview endpoint not found' });
}

async function handleChurchServicesApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query || {};
  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/church-services/overview' && method === 'GET') {
    return sendJson(res, 200, { data: churchServicesOverviewPayload() });
  }

  if (pathname === '/api/church-services/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.churchServicesSettings });
  }

  if (pathname === '/api/church-services/settings' && method === 'PATCH') {
    const currentConfig = JSON.parse(state.churchServicesSettings.configJson || '{}');
    state.churchServicesSettings = {
      ...state.churchServicesSettings,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : state.churchServicesSettings.enabled,
      billingPlan: body.billingPlan || state.churchServicesSettings.billingPlan,
      providerMode: body.providerMode || state.churchServicesSettings.providerMode,
      configJson: JSON.stringify({ ...currentConfig, ...(body.configJson || {}), ...(body.providerMode ? { providerMode: body.providerMode } : {}) }),
      updatedAt: now(),
    };
    addChurchServicesActivity('settings_updated', { fields: Object.keys(body), providerMode: state.churchServicesSettings.providerMode });
    return sendJson(res, 200, { data: state.churchServicesSettings });
  }

  if (pathname === '/api/church-services/reports' && method === 'GET') {
    return sendJson(res, 200, { data: churchServicesReportsPayload() });
  }

  if (pathname === '/api/church-services/activity' && method === 'GET') {
    const limit = query.limit ? Number(query.limit) : state.churchServicesActivities.length;
    return sendJson(res, 200, { data: state.churchServicesActivities.slice(0, limit) });
  }

  if (pathname === '/api/church-services/templates' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        moduleKey: 'church-services',
        settings: state.churchServicesSettings,
        serviceTypes: [
          { key: 'sunday', label: 'Sunday Service' },
          { key: 'midweek', label: 'Midweek Service' },
          { key: 'prayer', label: 'Prayer Service' },
          { key: 'communion', label: 'Communion Service' },
          { key: 'healing', label: 'Healing Service' },
          { key: 'thanksgiving', label: 'Thanksgiving Service' },
          { key: 'youth', label: 'Youth Service' },
          { key: 'special', label: 'Special Service' },
        ],
        defaultSchedules: [
          { serviceType: 'sunday', titleTemplate: 'Sunday Morning Service', dayOfWeek: 0, frequency: 'weekly' },
          { serviceType: 'midweek', titleTemplate: 'Wednesday Word and Prayer', dayOfWeek: 3, frequency: 'weekly' },
          { serviceType: 'communion', titleTemplate: 'First Sunday Communion Service', dayOfWeek: 0, frequency: 'monthly' },
        ],
        integrations: {
          speakers: state.mediaSpeakers,
          mediaAssets: state.mediaAssets.filter((asset) => ['video', 'worship'].includes(asset.type)),
          audioAssets: state.mediaAssets.filter((asset) => asset.type === 'audio'),
          livestreams: [],
          supportedProviders: ['platform', 'youtube', 'vimeo', 'mux', 'cloudinary', 'cloudflare_r2'],
        },
      },
    });
  }

  if (pathname === '/api/church-services/profiles' && method === 'GET') {
    return sendJson(res, 200, { data: state.churchServicesProfiles });
  }

  if (pathname === '/api/church-services/profiles' && method === 'POST') {
    const profile = {
      id: createId('church-services-profile'),
      tenantId: demoTenantId,
      title: body.title || 'Church Services Workspace',
      description: body.description || '',
      status: 'active',
      settingsJson: JSON.stringify(body.settingsJson || {}),
      visibility: body.visibility || 'private',
      createdBy: 'Local Preview',
      createdAt: now(),
      updatedAt: now(),
    };
    state.churchServicesProfiles.unshift(profile);
    addChurchServicesActivity('profile_created', { profileId: profile.id, title: profile.title });
    return sendJson(res, 201, { data: profile });
  }

  const profileMatch = pathname.match(/^\/api\/church-services\/profiles\/([^/]+)$/);
  if (profileMatch) {
    const profile = state.churchServicesProfiles.find((item) => item.id === profileMatch[1]);
    if (!profile) return sendJson(res, 404, { error: 'Church Services profile not found' });
    if (method === 'GET') return sendJson(res, 200, { data: profile });
    if (method === 'PATCH') {
      Object.assign(profile, body, { updatedAt: now() });
      addChurchServicesActivity('profile_updated', { profileId: profile.id });
      return sendJson(res, 200, { data: profile });
    }
    if (method === 'DELETE') {
      profile.status = 'archived';
      profile.updatedAt = now();
      addChurchServicesActivity('profile_archived', { profileId: profile.id });
      return sendJson(res, 200, { data: profile, success: true });
    }
  }

  if (pathname === '/api/church-services/recurring' && method === 'POST') {
    const serviceType = normalizePreviewServiceType(body.serviceType);
    const titleTemplate = body.titleTemplate || 'Sunday Morning Service';
    const dayOfWeek = Number(body.dayOfWeek ?? 0);
    const count = Math.min(Math.max(Number(body.count || 1), 1), 52);
    const frequency = body.frequency || 'weekly';
    const start = new Date(body.startDate || Date.now());
    let daysUntilTarget = dayOfWeek - start.getDay();
    if (daysUntilTarget < 0) daysUntilTarget += 7;
    const firstDate = new Date(start);
    firstDate.setDate(firstDate.getDate() + daysUntilTarget);
    const created = [];
    for (let i = 0; i < count; i += 1) {
      const serviceDate = new Date(firstDate);
      if (frequency === 'monthly') serviceDate.setMonth(serviceDate.getMonth() + i);
      else serviceDate.setDate(serviceDate.getDate() + i * 7);
      const dateStr = serviceDate.toISOString().split('T')[0];
      const service = {
        id: createId('service'),
        tenantId: demoTenantId,
        title: `${titleTemplate} - ${dateStr}`,
        serviceType,
        serviceDate: serviceDate.toISOString(),
        description: '',
        notes: '',
        thumbnailUrl: '',
        speakerId: body.speakerId || null,
        sermonMediaId: null,
        serviceAudioId: null,
        livestreamId: null,
        attendanceCount: 0,
        givingTotal: 0,
        salvationCount: 0,
        status: 'draft',
        visibility: body.visibility || 'public',
        locationMode: body.locationMode || 'hybrid',
        settingsJson: '{}',
        createdById: 'Local Preview',
        archiveOrder: state.churchServices.length + i + 1,
        createdAt: now(),
        updatedAt: now(),
        scriptures: [],
        attachments: [],
      };
      state.churchServices.unshift(service);
      created.push(decorateChurchService(service));
    }
    addChurchServicesActivity('recurring_services_generated', { serviceType, count, serviceIds: created.map((service) => service.id) });
    return sendJson(res, 201, { data: created });
  }

  if (pathname === '/api/church-services' && method === 'GET') {
    let services = state.churchServices.map(decorateChurchService);
    if (query.serviceType) {
      const serviceType = normalizePreviewServiceType(query.serviceType);
      services = services.filter((service) => service.serviceType === serviceType);
    }
    if (query.status) services = services.filter((service) => service.status === query.status);
    if (query.visibility) services = services.filter((service) => service.visibility === query.visibility);
    if (query.search) {
      const search = String(query.search).toLowerCase();
      services = services.filter((service) =>
        [service.title, service.description, service.notes].some((value) => String(value || '').toLowerCase().includes(search))
      );
    }
    services.sort((a, b) => {
      const direction = query.sortOrder === 'asc' ? 1 : -1;
      return (new Date(a.serviceDate) - new Date(b.serviceDate)) * direction;
    });
    return sendJson(res, 200, { data: services, meta: { total: services.length, page: 1, pageSize: services.length } });
  }

  if (pathname === '/api/church-services' && method === 'POST') {
    const service = {
      id: createId('service'),
      tenantId: demoTenantId,
      title: body.title || 'New Service',
      serviceType: normalizePreviewServiceType(body.serviceType),
      serviceDate: new Date(body.serviceDate || Date.now()).toISOString(),
      description: body.description || '',
      notes: body.notes || '',
      thumbnailUrl: body.thumbnailUrl || '',
      speakerId: body.speakerId || null,
      sermonMediaId: body.sermonMediaId || null,
      serviceAudioId: body.serviceAudioId || null,
      livestreamId: body.livestreamId || null,
      attendanceCount: Number(body.attendanceCount || 0),
      givingTotal: Number(body.givingTotal || 0),
      salvationCount: Number(body.salvationCount || 0),
      status: body.status || 'draft',
      visibility: body.visibility || 'public',
      locationMode: body.locationMode || 'hybrid',
      settingsJson: JSON.stringify(body.settingsJson || {}),
      createdById: 'Local Preview',
      archiveOrder: body.archiveOrder || state.churchServices.length + 1,
      createdAt: now(),
      updatedAt: now(),
      scriptures: [],
      attachments: [],
    };
    state.churchServices.unshift(service);
    addChurchServicesActivity('service_created', { serviceId: service.id, title: service.title, serviceType: service.serviceType });
    return sendJson(res, 201, { data: decorateChurchService(service) });
  }

  const scriptureMatch = pathname.match(/^\/api\/church-services\/([^/]+)\/scriptures$/);
  if (scriptureMatch) {
    const service = state.churchServices.find((item) => item.id === scriptureMatch[1]);
    if (!service) return sendJson(res, 404, { error: 'Service not found' });
    if (method === 'GET') return sendJson(res, 200, { data: service.scriptures || [] });
    if (method === 'POST') {
      const references = Array.isArray(body.references) ? body.references : [];
      const created = references.map((item, index) => ({
        id: createId('scripture'),
        serviceId: service.id,
        reference: item.reference,
        order: item.order !== undefined ? Number(item.order) : (service.scriptures || []).length + index,
      }));
      service.scriptures = [...(service.scriptures || []), ...created];
      addChurchServicesActivity('scriptures_linked', { serviceId: service.id, count: created.length });
      return sendJson(res, 201, { data: created });
    }
  }

  const attachmentMatch = pathname.match(/^\/api\/church-services\/([^/]+)\/attachments$/);
  if (attachmentMatch) {
    const service = state.churchServices.find((item) => item.id === attachmentMatch[1]);
    if (!service) return sendJson(res, 404, { error: 'Service not found' });
    if (method === 'GET') return sendJson(res, 200, { data: service.attachments || [] });
    if (method === 'POST') {
      const attachment = {
        id: createId('attachment'),
        serviceId: service.id,
        title: body.title || 'Service Attachment',
        fileUrl: body.fileUrl || '/documents/service-notes.pdf',
        fileType: String(body.fileType || 'pdf').toLowerCase(),
        createdAt: now(),
      };
      service.attachments = [attachment, ...(service.attachments || [])];
      addChurchServicesActivity('attachment_added', { serviceId: service.id, attachmentId: attachment.id, title: attachment.title });
      return sendJson(res, 201, { data: attachment });
    }
  }

  const publishMatch = pathname.match(/^\/api\/church-services\/([^/]+)\/publish$/);
  if (publishMatch && method === 'POST') {
    const service = state.churchServices.find((item) => item.id === publishMatch[1]);
    if (!service) return sendJson(res, 404, { error: 'Service not found' });
    service.status = 'published';
    service.updatedAt = now();
    addChurchServicesActivity('service_updated', { serviceId: service.id, status: 'published' });
    return sendJson(res, 200, { data: decorateChurchService(service) });
  }

  const replayMatch = pathname.match(/^\/api\/church-services\/([^/]+)\/replay$/);
  if (replayMatch && method === 'POST') {
    const service = state.churchServices.find((item) => item.id === replayMatch[1]);
    if (!service) return sendJson(res, 404, { error: 'Service not found' });
    addChurchServicesActivity('replay_requested', { serviceId: service.id, title: service.title, value: 1 });
    return sendJson(res, 200, {
      data: {
        serviceId: service.id,
        title: service.title,
        serviceType: service.serviceType,
        sermonMedia: state.mediaAssets.find((item) => item.id === service.sermonMediaId) || null,
        serviceAudio: state.mediaAssets.find((item) => item.id === service.serviceAudioId) || null,
        livestream: null,
        replayAvailable: Boolean(service.sermonMediaId || service.livestreamId),
      },
    });
  }

  const serviceMatch = pathname.match(/^\/api\/church-services\/([^/]+)$/);
  if (serviceMatch) {
    const service = state.churchServices.find((item) => item.id === serviceMatch[1]);
    if (!service) return sendJson(res, 404, { error: 'Service not found' });
    if (method === 'GET') return sendJson(res, 200, { data: decorateChurchService(service) });
    if (method === 'PUT' || method === 'PATCH') {
      Object.assign(service, {
        ...body,
        serviceType: body.serviceType ? normalizePreviewServiceType(body.serviceType) : service.serviceType,
        serviceDate: body.serviceDate ? new Date(body.serviceDate).toISOString() : service.serviceDate,
        updatedAt: now(),
      });
      addChurchServicesActivity('service_updated', { serviceId: service.id, fields: Object.keys(body), status: service.status });
      return sendJson(res, 200, { data: decorateChurchService(service) });
    }
    if (method === 'DELETE') {
      service.status = 'archived';
      service.updatedAt = now();
      addChurchServicesActivity('service_archived', { serviceId: service.id, title: service.title });
      return sendJson(res, 200, { data: decorateChurchService(service), message: 'Service archived successfully' });
    }
  }

  return sendJson(res, 404, { error: 'Church Services preview endpoint not found' });
}

async function handleDomainTenantApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  // ── /api/tenant/... endpoints ──
  if (pathname === '/api/tenant/branding' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        tenant: {
          id: demoTenantId,
          name: state.websites[0]?.title || 'Demo Church',
          subdomain: 'demo',
          customDomain: state.websites[0]?.domain || null,
          status: 'active',
        },
        branding: {
          logo: state.themes[0]?.settings?.logo || '',
          favicon: '',
          timezone: 'UTC',
          accent: state.themes[0]?.settings?.colors?.primary || '#4f46e5',
          language: 'en',
        },
      },
    });
  }

  if (pathname === '/api/tenant/branding' && method === 'PATCH') {
    if (body.name && state.websites[0]) {
      state.websites[0].title = body.name;
    }
    if (body.accent && state.themes[0]) {
      state.themes[0].settings.colors.primary = body.accent;
    }
    return sendJson(res, 200, {
      data: {
        name: body.name || 'Demo Church',
        branding: {
          logo: body.logo || '',
          favicon: body.favicon || '',
          timezone: body.timezone || 'UTC',
          accent: body.accent || '#4f46e5',
          language: body.language || 'en',
        },
      },
    });
  }

  if (pathname === '/api/tenant/domain' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        subdomain: 'demo',
        customDomain: state.websites[0]?.domain || null,
        dnsStatus: {
          verified: !!state.websites[0]?.domain,
          sslStatus: state.websites[0]?.domain ? 'active' : 'none',
          aRecordMatch: !!state.websites[0]?.domain,
          cnameRecordMatch: !!state.websites[0]?.domain,
        },
        instructions: {
          ip: '76.76.21.21',
          cname: 'cname.churchos.com',
        },
      },
    });
  }

  if (pathname === '/api/tenant/domain' && method === 'PATCH') {
    if (state.websites[0]) {
      state.websites[0].domain = body.customDomain || null;
    }
    return sendJson(res, 200, {
      data: {
        subdomain: 'demo',
        customDomain: body.customDomain || null,
      },
    });
  }

  if (pathname === '/api/tenant/domain/verify' && method === 'POST') {
    return sendJson(res, 200, {
      data: {
        verified: true,
        sslStatus: 'active',
        aRecordMatch: true,
        cnameRecordMatch: true,
        lastChecked: now(),
      },
    });
  }

  if (pathname === '/api/tenant/modules' && method === 'GET') {
    const list = [
      { key: 'website-cms', name: 'Churchfront', category: 'Core', dependencies: [], status: 'active', billingRule: 'included' },
      { key: 'theme-engine', name: 'Theme Engine', category: 'Core', dependencies: [], status: 'active', billingRule: 'included' },
      { key: 'domain-tenant-management', name: 'Church Details', category: 'Core', dependencies: [], status: 'active', billingRule: 'included' },
      { key: 'billing-subscription-management', name: 'Billing & Subscription Management', category: 'Admin', dependencies: [], status: 'active', billingRule: 'platform' },
      { key: 'media', name: 'Media Module', category: 'Content', dependencies: ['website-cms'], status: 'active', billingRule: 'included' },
      { key: 'church-services', name: 'Church Services', category: 'Content', dependencies: ['media'], status: 'active', billingRule: 'included' },
      { key: 'giving-donations', name: 'Tithes & Offerings', category: 'Finance', dependencies: [], status: state.billingEntitlements.some(e => e.moduleKey === 'giving') ? 'active' : 'inactive', billingRule: 'free' },
      { key: 'digital-library-resource-center', name: 'Digital Library & Resource Center', category: 'Content', dependencies: [], status: 'active', billingRule: 'free' },
    ];
    return sendJson(res, 200, { data: list });
  }

  if (pathname.startsWith('/api/tenant/modules/') && method === 'PATCH') {
    const moduleKey = pathname.split('/').pop();
    const status = body.status || 'active';
    return sendJson(res, 200, {
      data: {
        moduleKey,
        status,
        billingRule: 'free',
      },
    });
  }

  if (pathname === '/api/tenant/checklist' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        domainSetup: !!state.websites[0]?.domain,
        brandingSetup: true,
        moduleRegistry: true,
        inviteTeam: false,
      },
    });
  }

  // ── /api/domain-tenant-management/... endpoints ──
  if (pathname === '/api/domain-tenant-management' && method === 'GET') {
    return sendJson(res, 200, { data: state.domainTenantManagementModules });
  }

  if (pathname === '/api/domain-tenant-management' && method === 'POST') {
    const record = {
      id: createId('dt-module'),
      tenantId: demoTenantId,
      title: body.title || 'Untitled Profile',
      description: body.description || '',
      status: 'active',
      settingsJson: '{}',
      visibility: body.visibility || 'public',
      createdBy: 'Local Preview',
      createdAt: now(),
      updatedAt: now(),
    };
    state.domainTenantManagementModules.push(record);
    state.domainTenantManagementActivities.unshift({
      id: createId('dt-act'),
      tenantId: demoTenantId,
      userId: 'Local Preview',
      actionType: 'create_profile',
      metadataJson: JSON.stringify({ title: record.title }),
      createdAt: now(),
    });
    return sendJson(res, 201, { data: record });
  }

  if (pathname === '/api/domain-tenant-management/overview' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        moduleKey: 'domain-tenant-management',
        settings: state.domainTenantManagementSettings,
        checklist: {
          domainSetup: !!state.websites[0]?.domain,
          brandingSetup: true,
          moduleRegistry: true,
          inviteTeam: false,
        },
        counts: {
          profilesCount: state.domainTenantManagementModules.length,
          activeModules: 4,
          activitiesCount: state.domainTenantManagementActivities.length,
        },
        recentActivity: state.domainTenantManagementActivities.slice(0, 10),
        profiles: state.domainTenantManagementModules,
      },
    });
  }

  if (pathname === '/api/domain-tenant-management/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.domainTenantManagementSettings });
  }

  if (pathname === '/api/domain-tenant-management/settings' && method === 'PATCH') {
    state.domainTenantManagementSettings = {
      ...state.domainTenantManagementSettings,
      ...body,
      updatedAt: now(),
    };
    return sendJson(res, 200, { data: state.domainTenantManagementSettings });
  }

  if (pathname === '/api/domain-tenant-management/reports' && method === 'GET') {
    return sendJson(res, 200, { data: state.domainTenantManagementActivities });
  }

  const singleMatch = pathname.match(/^\/api\/domain-tenant-management\/([^/]+)$/);
  if (singleMatch) {
    const id = singleMatch[1];
    const index = state.domainTenantManagementModules.findIndex(m => m.id === id);

    if (method === 'GET') {
      if (index === -1) return sendJson(res, 404, { error: 'Profile not found' });
      return sendJson(res, 200, { data: state.domainTenantManagementModules[index] });
    }

    if (method === 'PATCH') {
      if (index === -1) return sendJson(res, 404, { error: 'Profile not found' });
      const record = {
        ...state.domainTenantManagementModules[index],
        ...body,
        updatedAt: now(),
      };
      state.domainTenantManagementModules[index] = record;
      state.domainTenantManagementActivities.unshift({
        id: createId('dt-act'),
        tenantId: demoTenantId,
        userId: 'Local Preview',
        actionType: 'update_profile',
        metadataJson: JSON.stringify({ profileId: id }),
        createdAt: now(),
      });
      return sendJson(res, 200, { data: record });
    }

    if (method === 'DELETE') {
      if (index === -1) return sendJson(res, 404, { error: 'Profile not found' });
      const deleted = state.domainTenantManagementModules.splice(index, 1)[0];
      state.domainTenantManagementActivities.unshift({
        id: createId('dt-act'),
        tenantId: demoTenantId,
        userId: 'Local Preview',
        actionType: 'delete_profile',
        metadataJson: JSON.stringify({ title: deleted.title }),
        createdAt: now(),
      });
      return sendJson(res, 200, { success: true });
    }
  }

  return sendJson(res, 404, { error: 'Endpoint not found' });
}

async function handleDigitalLibraryApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/digital-library-resource-center' && method === 'GET') {
    return sendJson(res, 200, { data: state.digitalLibraryModules });
  }

  if (pathname === '/api/digital-library-resource-center' && method === 'POST') {
    const record = {
      id: createId('dl-module'),
      tenantId: demoTenantId,
      title: body.title || 'Untitled Library',
      description: body.description || '',
      status: 'active',
      settingsJson: '{}',
      visibility: body.visibility || 'public',
      createdBy: 'Local Preview',
      createdAt: now(),
      updatedAt: now(),
    };
    state.digitalLibraryModules.push(record);
    state.digitalLibraryActivities.unshift({
      id: createId('dl-act'),
      tenantId: demoTenantId,
      userId: 'Local Preview',
      actionType: 'create_profile',
      metadataJson: JSON.stringify({ title: record.title }),
      createdAt: now(),
    });
    return sendJson(res, 201, { data: record });
  }

  if (pathname === '/api/digital-library-resource-center/overview' && method === 'GET') {
    return sendJson(res, 200, {
      data: {
        moduleKey: 'digital-library-resource-center',
        settings: state.digitalLibrarySettings,
        counts: {
          profilesCount: state.digitalLibraryModules.length,
          categoriesCount: state.libraryCategories.length,
          resourcesCount: state.libraryResources.length,
          downloadsCount: state.libraryResources.reduce((acc, r) => acc + (r.downloadCount || 0), 0),
          activitiesCount: state.digitalLibraryActivities.length,
        },
        recentActivity: state.digitalLibraryActivities.slice(0, 10),
        profiles: state.digitalLibraryModules,
      },
    });
  }

  if (pathname === '/api/digital-library-resource-center/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.digitalLibrarySettings });
  }

  if (pathname === '/api/digital-library-resource-center/settings' && method === 'PATCH') {
    state.digitalLibrarySettings = {
      ...state.digitalLibrarySettings,
      ...body,
      updatedAt: now(),
    };
    return sendJson(res, 200, { data: state.digitalLibrarySettings });
  }

  if (pathname === '/api/digital-library-resource-center/reports' && method === 'GET') {
    return sendJson(res, 200, { data: state.digitalLibraryActivities });
  }

  const singleMatch = pathname.match(/^\/api\/digital-library-resource-center\/([^/]+)$/);
  if (singleMatch) {
    const id = singleMatch[1];
    const index = state.digitalLibraryModules.findIndex(m => m.id === id);

    if (method === 'GET') {
      if (index === -1) return sendJson(res, 404, { error: 'Profile not found' });
      return sendJson(res, 200, { data: state.digitalLibraryModules[index] });
    }

    if (method === 'PATCH') {
      if (index === -1) return sendJson(res, 404, { error: 'Profile not found' });
      const record = {
        ...state.digitalLibraryModules[index],
        ...body,
        updatedAt: now(),
      };
      state.digitalLibraryModules[index] = record;
      state.digitalLibraryActivities.unshift({
        id: createId('dl-act'),
        tenantId: demoTenantId,
        userId: 'Local Preview',
        actionType: 'update_profile',
        metadataJson: JSON.stringify({ profileId: id }),
        createdAt: now(),
      });
      return sendJson(res, 200, { data: record });
    }

    if (method === 'DELETE') {
      if (index === -1) return sendJson(res, 404, { error: 'Profile not found' });
      const deleted = state.digitalLibraryModules.splice(index, 1)[0];
      state.digitalLibraryActivities.unshift({
        id: createId('dl-act'),
        tenantId: demoTenantId,
        userId: 'Local Preview',
        actionType: 'delete_profile',
        metadataJson: JSON.stringify({ title: deleted.title }),
        createdAt: now(),
      });
      return sendJson(res, 200, { success: true });
    }
  }

  return sendJson(res, 404, { error: 'Endpoint not found' });
}

async function handleLibraryApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/library/categories' && method === 'GET') {
    return sendJson(res, 200, { data: state.libraryCategories });
  }

  if (pathname === '/api/library/categories' && method === 'POST') {
    const category = {
      id: createId('lib-cat'),
      tenantId: demoTenantId,
      name: body.name || 'Untitled Category',
      slug: body.slug || createId('slug'),
      description: body.description || '',
      parentId: body.parentId || null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.libraryCategories.push(category);
    state.digitalLibraryActivities.unshift({
      id: createId('dl-act'),
      tenantId: demoTenantId,
      userId: 'Local Preview',
      actionType: 'create_category',
      metadataJson: JSON.stringify({ categoryId: category.id, name: category.name }),
      createdAt: now(),
    });
    return sendJson(res, 201, { data: category });
  }

  if (pathname === '/api/library/resources' && method === 'GET') {
    return sendJson(res, 200, { data: state.libraryResources });
  }

  if (pathname === '/api/library/resources' && method === 'POST') {
    const resource = {
      id: createId('lib-res'),
      tenantId: demoTenantId,
      title: body.title || 'Untitled Resource',
      slug: body.slug || createId('slug'),
      description: body.description || '',
      author: body.author || '',
      fileUrl: body.fileUrl || '',
      fileSize: body.fileSize || 0,
      fileType: body.fileType || '',
      coverImageUrl: body.coverImageUrl || '',
      pricingType: body.pricingType || 'free',
      price: Number(body.price || 0),
      visibility: body.visibility || 'public',
      status: body.status || 'draft',
      downloadCount: 0,
      categoryId: body.categoryId || null,
      createdAt: now(),
      updatedAt: now(),
    };
    state.libraryResources.push(resource);
    state.digitalLibraryActivities.unshift({
      id: createId('dl-act'),
      tenantId: demoTenantId,
      userId: 'Local Preview',
      actionType: 'create_resource',
      metadataJson: JSON.stringify({ resourceId: resource.id, title: resource.title }),
      createdAt: now(),
    });
    return sendJson(res, 201, { data: resource });
  }

  if (pathname === '/api/library/audit' && method === 'GET') {
    const formatted = state.digitalLibraryActivities.map(item => {
      let title = 'System Config';
      try {
        const metadata = JSON.parse(item.metadataJson);
        title = metadata.title || metadata.resourceId || title;
      } catch (e) {}
      return {
        timestamp: item.createdAt,
        resource: title,
        user: item.userId || 'System',
        role: 'Tenant Owner',
        action: item.actionType.replace('_', ' ').toUpperCase(),
      };
    });
    return sendJson(res, 200, { data: formatted });
  }

  if (pathname === '/api/library/sales' && method === 'GET') {
    const formatted = state.libraryPurchases.map(item => {
      const resource = state.libraryResources.find(r => r.id === item.resourceId) || { title: 'Unknown Resource' };
      return {
        date: item.createdAt.split('T')[0],
        memberName: 'member@example.com',
        resource: resource.title,
        pricePaid: item.amountPaid,
        txId: `TXN-${item.id.slice(0, 8).toUpperCase()}`,
      };
    });
    return sendJson(res, 200, { data: formatted });
  }

  const resMatch = pathname.match(/^\/api\/library\/resources\/([^/]+)$/);
  if (resMatch) {
    const id = resMatch[1];
    const index = state.libraryResources.findIndex(r => r.id === id);

    if (method === 'GET') {
      if (index === -1) return sendJson(res, 404, { error: 'Resource not found' });
      return sendJson(res, 200, { data: state.libraryResources[index] });
    }

    if (method === 'PUT' || method === 'PATCH') {
      if (index === -1) return sendJson(res, 404, { error: 'Resource not found' });
      const record = {
        ...state.libraryResources[index],
        ...body,
        updatedAt: now(),
      };
      state.libraryResources[index] = record;
      state.digitalLibraryActivities.unshift({
        id: createId('dl-act'),
        tenantId: demoTenantId,
        userId: 'Local Preview',
        actionType: 'update_resource',
        metadataJson: JSON.stringify({ resourceId: id }),
        createdAt: now(),
      });
      return sendJson(res, 200, { data: record });
    }

    if (method === 'DELETE') {
      if (index === -1) return sendJson(res, 404, { error: 'Resource not found' });
      const deleted = state.libraryResources.splice(index, 1)[0];
      state.digitalLibraryActivities.unshift({
        id: createId('dl-act'),
        tenantId: demoTenantId,
        userId: 'Local Preview',
        actionType: 'delete_resource',
        metadataJson: JSON.stringify({ title: deleted.title }),
        createdAt: now(),
      });
      return sendJson(res, 200, { data: deleted });
    }
  }

  const downloadMatch = pathname.match(/^\/api\/library\/resources\/([^/]+)\/download$/);
  if (downloadMatch && method === 'POST') {
    const id = downloadMatch[1];
    const r = state.libraryResources.find(item => item.id === id);
    if (!r) return sendJson(res, 404, { error: 'Resource not found' });
    r.downloadCount = (r.downloadCount || 0) + 1;
    state.digitalLibraryActivities.unshift({
      id: createId('dl-act'),
      tenantId: demoTenantId,
      userId: 'Local Preview',
      actionType: 'download_resource',
      metadataJson: JSON.stringify({ resourceId: id, title: r.title }),
      createdAt: now(),
    });
    return sendJson(res, 200, { data: { fileUrl: r.fileUrl, downloadCount: r.downloadCount } });
  }

  const purchaseMatch = pathname.match(/^\/api\/library\/resources\/([^/]+)\/purchase$/);
  if (purchaseMatch && method === 'POST') {
    const id = purchaseMatch[1];
    const r = state.libraryResources.find(item => item.id === id);
    if (!r) return sendJson(res, 404, { error: 'Resource not found' });
    const purchase = {
      id: createId('purchase'),
      tenantId: demoTenantId,
      resourceId: id,
      userId: 'local-user',
      amountPaid: r.price,
      createdAt: now(),
    };
    state.libraryPurchases.push(purchase);
    state.digitalLibraryActivities.unshift({
      id: createId('dl-act'),
      tenantId: demoTenantId,
      userId: 'Local Preview',
      actionType: 'purchase_resource',
      metadataJson: JSON.stringify({ resourceId: id, title: r.title, amountPaid: r.price }),
      createdAt: now(),
    });
    return sendJson(res, 201, { data: purchase });
  }

  return sendJson(res, 404, { error: 'Endpoint not found' });
}

async function handleDemoApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;

  if (pathname === '/dev/bootstrap' && method === 'POST') {
    return sendJson(res, 200, {
      tenantId: demoTenantId,
      token: 'local-preview-token',
      email: 'admin@demo.churched.online',
    });
  }

  if (pathname.startsWith('/api/super-admin')) {
    return handleSuperAdminApi(req, res, parsedUrl, {
      state,
      sendJson,
      readJsonBody,
      createId,
      now,
      demoTenantId,
    });
  }

  if (pathname.startsWith('/api/billing')) {
    return handleBillingApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/theme-engine')) {
    return handleThemeEngineApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/media')) {
    return handleMediaApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/church-services')) {
    return handleChurchServicesApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/tenant') || pathname.startsWith('/api/domain-tenant-management')) {
    return handleDomainTenantApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/digital-library-resource-center')) {
    return handleDigitalLibraryApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/library')) {
    return handleLibraryApi(req, res, parsedUrl);
  }

  if (pathname === '/api/marketplace/assets' && method === 'GET') {
    return sendJson(res, 200, { data: state.marketplaceAssets });
  }

  if (!pathname.startsWith('/api/cms')) {
    return false;
  }

  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/cms/pages' && method === 'GET') {
    return sendJson(res, 200, { data: state.pages });
  }

  if (pathname === '/api/cms/pages' && method === 'POST') {
    const page = {
      id: createId('page'),
      websiteId: body.websiteId || demoWebsiteId,
      title: body.title || 'Untitled Page',
      slug: body.slug || createId('page-slug'),
      status: body.status || 'draft',
      isHome: Boolean(body.isHome),
      content: body.content || [],
      createdAt: now(),
      updatedAt: now(),
    };
    state.pages.push(page);
    addActivity(`Created page: ${page.title}`);
    return sendJson(res, 201, { data: page });
  }

  const draftMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/draft$/);
  if (draftMatch && method === 'PATCH') {
    const page = state.pages.find((item) => item.id === draftMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    page.draftContent = typeof body.draftContent === 'string' ? body.draftContent : JSON.stringify(body.draftContent || []);
    page.updatedAt = now();
    addActivity(`Updated page draft: ${page.title}`);
    return sendJson(res, 200, { data: page });
  }

  const publishMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/publish$/);
  if (publishMatch && method === 'POST') {
    const page = state.pages.find((item) => item.id === publishMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    const nextContent = page.draftContent || page.content;
    page.content = typeof nextContent === 'string' ? JSON.parse(nextContent || '[]') : nextContent;
    page.draftContent = null;
    page.status = 'published';
    page.updatedAt = now();
    addActivity(`Published page: ${page.title}`);
    return sendJson(res, 200, { data: page });
  }

  const previewMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/preview$/);
  if (previewMatch && method === 'POST') {
    const page = state.pages.find((item) => item.id === previewMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    return sendJson(res, 200, {
      data: {
        previewToken: 'local-preview-token',
        previewUrl: `/api/cms/render?slug=${page.slug}&previewToken=local-preview-token`,
      },
    });
  }

  const pageMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)$/);
  if (pageMatch) {
    const page = state.pages.find((item) => item.id === pageMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    if (method === 'GET') return sendJson(res, 200, { data: page });
    if (method === 'PATCH') {
      Object.assign(page, body, { updatedAt: now() });
      addActivity(`Updated page: ${page.title}`);
      return sendJson(res, 200, { data: page });
    }
  }

  const revisionsMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/revisions$/);
  if (revisionsMatch && method === 'GET') {
    return sendJson(res, 200, {
      data: [
        { id: `${revisionsMatch[1]}-rev-1`, pageId: revisionsMatch[1], createdAt: now(), summary: 'Current local preview version' },
      ],
    });
  }

  const rollbackMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/rollback$/);
  if (rollbackMatch && method === 'POST') {
    const page = state.pages.find((item) => item.id === rollbackMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    addActivity(`Rolled back page: ${page.title}`);
    return sendJson(res, 200, { data: page });
  }

  if (pathname === '/api/cms/themes' && method === 'POST') {
    const theme = { id: createId('theme'), name: body.name || 'New Theme', settings: body.settings || {}, createdAt: now() };
    state.themes.push(theme);
    return sendJson(res, 201, { data: theme });
  }

  if (pathname === '/api/cms/websites' && method === 'POST') {
    const website = { id: createId('website'), title: body.title || 'Church Website', description: body.description || '', domain: body.domain || 'localhost', themeId: body.themeId || 'theme-ecclesia' };
    state.websites.push(website);
    return sendJson(res, 201, { data: website });
  }

  if (pathname === '/api/cms/navigation' && method === 'GET') {
    return sendJson(res, 200, { data: state.navigation });
  }

  if (pathname === '/api/cms/navigation' && method === 'POST') {
    const existing = state.navigation.find((item) => item.websiteId === (body.websiteId || demoWebsiteId));
    const menu = Object.assign(existing || { id: createId('nav') }, body, { websiteId: body.websiteId || demoWebsiteId, updatedAt: now() });
    if (!existing) state.navigation.push(menu);
    addActivity(`Saved navigation: ${menu.name || 'Header Navigation'}`);
    return sendJson(res, 200, { data: menu });
  }

  if (pathname === '/api/cms/footer' && method === 'GET') {
    const websiteId = parsedUrl.searchParams.get('websiteId') || demoWebsiteId;
    return sendJson(res, 200, { data: state.footers.find((item) => item.websiteId === websiteId) || null });
  }

  if (pathname === '/api/cms/footer' && method === 'POST') {
    const existing = state.footers.find((item) => item.websiteId === (body.websiteId || demoWebsiteId));
    const footer = Object.assign(existing || { id: createId('footer') }, body, { websiteId: body.websiteId || demoWebsiteId, updatedAt: now() });
    if (!existing) state.footers.push(footer);
    addActivity('Saved footer configuration');
    return sendJson(res, 200, { data: footer });
  }

  if (pathname === '/api/cms/global-content' && method === 'GET') {
    let block = state.reusableBlocks.find((item) => item.key === 'ecclesia-global-content');
    if (!block) {
      block = { id: createId('block'), name: 'Ecclesia Global Content', key: 'ecclesia-global-content', content: localEcclesiaGlobalContent, updatedAt: now() };
      state.reusableBlocks.unshift(block);
    }
    return sendJson(res, 200, { data: { ...block, content: block.content || localEcclesiaGlobalContent } });
  }

  if (pathname === '/api/cms/global-content' && method === 'PATCH') {
    let block = state.reusableBlocks.find((item) => item.key === 'ecclesia-global-content');
    if (!block) {
      block = { id: createId('block'), name: 'Ecclesia Global Content', key: 'ecclesia-global-content', content: localEcclesiaGlobalContent, updatedAt: now() };
      state.reusableBlocks.unshift(block);
    }
    block.content = { ...(block.content || {}), ...(body.content || body || {}) };
    block.updatedAt = now();
    addActivity('Saved Ecclesia global content');
    return sendJson(res, 200, { data: { ...block, content: block.content } });
  }

  if (pathname === '/api/cms/reusable-blocks' && method === 'GET') {
    return sendJson(res, 200, { data: state.reusableBlocks });
  }

  if (pathname === '/api/cms/reusable-blocks' && method === 'POST') {
    const block = { id: createId('block'), name: body.name || 'Reusable Block', key: body.key || createId('block-key'), content: body.content || {}, updatedAt: now() };
    state.reusableBlocks.push(block);
    addActivity(`Created reusable section: ${block.name}`);
    return sendJson(res, 201, { data: block });
  }

  const blockMatch = pathname.match(/^\/api\/cms\/reusable-blocks\/([^/]+)$/);
  if (blockMatch && method === 'PATCH') {
    const block = state.reusableBlocks.find((item) => item.id === blockMatch[1]);
    if (!block) return sendJson(res, 404, { error: 'Reusable block not found' });
    Object.assign(block, body, { updatedAt: now() });
    addActivity(`Updated reusable section: ${block.name}`);
    return sendJson(res, 200, { data: block });
  }

  if (pathname === '/api/cms/activity-logs' && method === 'GET') {
    return sendJson(res, 200, { data: state.activityLogs });
  }

  if (pathname === '/api/cms/render' && method === 'GET') {
    const slug = parsedUrl.searchParams.get('slug') || '';
    const isPreview = Boolean(parsedUrl.searchParams.get('previewToken'));
    const page = state.pages.find((item) => item.slug === slug || (!slug && item.isHome)) || state.pages[0];
    const contentBlocks = isPreview && page.draftContent
      ? JSON.parse(page.draftContent || '[]')
      : (typeof page.content === 'string' ? JSON.parse(page.content || '[]') : (page.content || []));
    return sendJson(res, 200, {
      data: {
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks,
        isPreview,
        globalContent: state.reusableBlocks.find((item) => item.key === 'ecclesia-global-content')?.content || localEcclesiaGlobalContent,
        navigation: state.navigation[0] || null,
        footer: state.footers[0] || null,
        theme: state.themes[0] || null,
        churchName: 'Demo Church',
      },
    });
  }

  return sendJson(res, 404, { error: 'CMS preview endpoint not found' });
}

http
  .createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const apiHandled = await handleDemoApi(req, res, parsedUrl);
    if (apiHandled !== false) return;

    let urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/') {
      urlPath = '/apps/web/public/index.html';
    } else if (urlPath === '/admin' || urlPath.startsWith('/admin/')) {
      urlPath = '/apps/tenant-dashboard/public/index.html';
    } else if (urlPath === '/central' || urlPath.startsWith('/central/')) {
      urlPath = '/apps/super-admin/public/index.html';
    } else if (urlPath === '/dashboard') {
      urlPath = '/dashboard.html';
    } else if (urlPath === '/marketplace/developer' || urlPath.startsWith('/marketplace/developer/')) {
      res.writeHead(301, { Location: '/developer' });
      res.end();
      return;
    } else if (urlPath === '/marketplace' || urlPath.startsWith('/marketplace/')) {
      urlPath = '/apps/marketplace/frontend/index.html';
    } else if (urlPath === '/developer' || urlPath.startsWith('/developer/')) {
      urlPath = '/apps/marketplace/developer/index.html';
    } else if (urlPath === '/super-admin' || urlPath.startsWith('/super-admin/')) {
      res.writeHead(301, { Location: '/central' });
      res.end();
      return;
    } else if (urlPath === '/cms') {
      res.writeHead(302, { Location: '/dashboard.html?module=cms' });
      res.end();
      return;
    } else if (urlPath === '/page-builder') {
      res.writeHead(302, { Location: '/admin?module=customizer&tab=pages' });
      res.end();
      return;
    } else if (urlPath === '/customizer' || urlPath.startsWith('/customizer/')) {
      if (urlPath === '/customizer') {
        res.writeHead(301, { Location: '/customizer/' });
        res.end();
        return;
      }
      const customizerRelativePath = urlPath.replace(/^\/customizer\/?/, '') || 'index.html';
      urlPath = `/apps/theme-customizer/dist/${customizerRelativePath}`;
    }

    let filePath;
    if (urlPath === '/themes/ecclesia' || urlPath.startsWith('/themes/ecclesia/') || urlPath === '/themes/ecclesia-full-theme' || urlPath.startsWith('/themes/ecclesia-full-theme/')) {
      const themeRelativePath = urlPath.replace(/^\/themes\/(?:ecclesia|ecclesia-full-theme)\/?/, '') || 'index.html';
      filePath = path.normalize(path.join(ecclesiaFullTheme, decodeURIComponent(themeRelativePath)));
      const relativeToTheme = path.relative(ecclesiaFullTheme, filePath);
      if (relativeToTheme.startsWith('..') || path.isAbsolute(relativeToTheme)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
    } else {
      filePath = path.normalize(path.join(root, decodeURIComponent(urlPath)));
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`ChurchOS preview running at http://localhost:${port}`);
  });
