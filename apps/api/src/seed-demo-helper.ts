import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

export async function seedDemoTenant(subdomain: string, isTenantSuspended = false): Promise<{
  tenantId: string;
  websiteId: string;
  adminUserId: string;
  memberId: string;
}> {
  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: subdomain === 'grace-fellowship' ? 'Grace Fellowship Church' : 'Suspended Demo Church',
      subdomain,
      status: isTenantSuspended ? 'suspended' : 'active',
    },
  });
  const tenantId = tenant.id;

  // 2. Seed Tenant Module Entitlements
  const modulesToEntitle = [
    'website-cms',
    'events-registration',
    'giving-donations',
    'media',
    'livestream',
    'prayer-testimony',
    'lms-discipleship-training',
    'cell-fellowship',
    'member-management',
    'dynamic-blog-publishing-engine',
    'ecommerce-store'
  ];

  for (const moduleKey of modulesToEntitle) {
    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleKey,
        status: 'active',
      },
    });
  }

  // 3. Create Theme
  const theme = await prisma.theme.create({
    data: {
      tenantId,
      name: 'Grace Default Theme',
      settings: JSON.stringify({
        primaryColor: '#4f46e5',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter'
      }),
      isCustom: true,
    },
  });

  // 4. Create Website
  const website = await prisma.website.create({
    data: {
      tenantId,
      themeId: theme.id,
      title: 'Grace Fellowship Church',
      description: 'A community of faith, hope, and love.',
      isActive: true,
    },
  });
  const websiteId = website.id;

  // 5. Create Pages (Home, About, Contact, Draft, Password Protected)
  // Home Page
  await prisma.page.create({
    data: {
      tenantId,
      websiteId,
      slug: '',
      title: 'Welcome to Grace Fellowship',
      isHome: true,
      status: 'published',
      content: JSON.stringify([
        {
          slotKey: 'page.home',
          moduleKey: 'website-cms',
          data: {
            heading: 'Welcome to Grace Fellowship',
            subheading: 'A community of faith, hope, and love.',
            actionCta: { label: 'Connect With Us', action: 'link', url: '/about' }
          }
        },
        {
          slotKey: 'event.card',
          moduleKey: 'events-management',
          data: {
            id: `annual-conf-${subdomain}`,
            title: 'Annual Leadership Conference',
            description: 'Grow your leadership capability and join us for worship.',
            startDateTime: '2026-06-15T09:00:00Z',
            endDateTime: '2026-06-15T17:00:00Z',
            location: 'Main Auditorium',
            cta: { label: 'Register', action: 'link', url: `/events/annual-conf-${subdomain}` }
          }
        }
      ]),
      seoTitle: 'Grace Fellowship Church - Home',
      seoDescription: 'Official website of Grace Fellowship Church',
      seoKeywords: 'church, grace, faith, worship',
    },
  });

  // About Page
  await prisma.page.create({
    data: {
      tenantId,
      websiteId,
      slug: 'about',
      title: 'About Us',
      isHome: false,
      status: 'published',
      content: JSON.stringify([
        {
          slotKey: 'page.about',
          moduleKey: 'website-cms',
          data: {
            title: 'Our Story',
            story: 'Grace Fellowship was established with a deep desire to cultivate authentic community and share Christ\'s love.',
            imageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800'
          }
        }
      ]),
    },
  });

  // Contact Page
  await prisma.page.create({
    data: {
      tenantId,
      websiteId,
      slug: 'contact',
      title: 'Contact Us',
      isHome: false,
      status: 'published',
      content: JSON.stringify([
        {
          slotKey: 'page.contact',
          moduleKey: 'website-cms',
          data: {
            title: 'Get in Touch',
            email: 'hello@gracefellowship.local',
            phone: '555-0155',
            address: '100 Grace Way, Faith City',
            mapCoordinates: '34.0522,-118.2437'
          }
        }
      ]),
    },
  });

  // Draft / Preview Page
  await prisma.page.create({
    data: {
      tenantId,
      websiteId,
      slug: 'draft-preview-route',
      title: 'Upcoming Secret Project (Draft)',
      isHome: false,
      status: 'draft',
      content: JSON.stringify([
        {
          slotKey: 'page.about',
          moduleKey: 'website-cms',
          data: {
            title: 'Draft Secret Page',
            story: 'This content is unpublished draft. If you see this, you are in preview mode!',
            visibility: 'preview_only'
          }
        }
      ]),
    },
  });

  // Password Protected Page
  await prisma.page.create({
    data: {
      tenantId,
      websiteId,
      slug: 'members-confidential',
      title: 'Confidential Info',
      isHome: false,
      status: 'published',
      content: JSON.stringify([
        {
          slotKey: 'page.about',
          moduleKey: 'website-cms',
          data: {
            title: 'Confidential Details',
            story: 'This contains sensitive members-only administrative updates.',
            visibility: 'password_protected',
            password: 'grace_password'
          }
        }
      ]),
    },
  });

  // 6. Create Navigation (Header & Footer Menu)
  await prisma.navigationMenu.create({
    data: {
      tenantId,
      websiteId,
      name: 'Header Menu',
      isActive: true,
      items: JSON.stringify([
        { label: 'Home', url: '/' },
        { label: 'Events', url: '/events' },
        { label: 'Sermons', url: '/sermons' },
        { label: 'Giving', url: '/giving' },
        { label: 'Live', url: '/live' },
        { label: 'Groups', url: '/groups' },
        { label: 'Courses', url: '/courses' },
        { label: 'Prayer', url: '/prayer' },
        { label: 'Members', url: '/members' }
      ]),
    },
  });

  await prisma.cmsFooter.create({
    data: {
      tenantId,
      websiteId,
      copyrightText: '© 2026 Grace Fellowship Church. All rights reserved.',
      socialLinks: JSON.stringify([
        { platform: 'facebook', url: 'https://facebook.com/grace' },
        { platform: 'youtube', url: 'https://youtube.com/grace' }
      ]),
      secondaryLinks: JSON.stringify([
        { label: 'About Us', url: '/about' },
        { label: 'Contact Us', url: '/contact' }
      ]),
    },
  });

  // 7. Seed Events Data
  const eventCategory = await prisma.eventCategory.create({
    data: {
      tenantId,
      name: 'Church Conferences',
    },
  });

  await prisma.event.create({
    data: {
      id: `annual-conf-${subdomain}`,
      tenantId,
      categoryId: eventCategory.id,
      title: 'Annual Leadership Conference',
      description: 'Grow your leadership capability and join us for worship.',
      startDate: new Date('2026-06-15T09:00:00Z'),
      endDate: new Date('2026-06-15T17:00:00Z'),
      pricingType: 'free',
      price: 0,
      locationType: 'physical',
      location: 'Main Auditorium',
      status: 'published',
    },
  });

  // 8. Seed Giving Category
  const givingCategory = await prisma.givingCategory.create({
    data: {
      tenantId,
      name: 'General Tithes & Offerings',
      description: 'Main tithing fund supporting local church ministries',
      isActive: true,
    },
  });

  // 9. Seed Media/Sermons Data
  const mediaCategory = await prisma.mediaCategory.create({
    data: {
      tenantId,
      name: 'Sermons',
      slug: 'sermons',
    },
  });

  const mediaTag = await prisma.mediaTag.create({
    data: {
      tenantId,
      name: 'Wisdom',
      slug: 'wisdom',
    },
  });

  const mediaSeries = await prisma.mediaSeries.create({
    data: {
      tenantId,
      title: 'The Book of Proverbs',
      description: 'Exploring practical wisdom for modern living.',
    },
  });

  const speaker = await prisma.speaker.create({
    data: {
      tenantId,
      name: 'Pastor Mark Stevenson',
      title: 'Lead Pastor',
      bio: 'Pastor Mark Stevenson serves as Lead Pastor of Grace Fellowship.',
    },
  });

  await prisma.mediaAsset.create({
    data: {
      id: `sermon-wisdom-${subdomain}`,
      tenantId,
      categoryId: mediaCategory.id,
      seriesId: mediaSeries.id,
      speakerId: speaker.id,
      title: 'Living Wisely in a Complex World',
      description: 'Pastor Mark Stevenson shares insights on Proverbs chapter 3.',
      type: 'video',
      providerType: 'external_link',
      providerKey: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
      durationSeconds: 1800,
      status: 'published',
      visibility: 'public',
      publishedAt: new Date(),
    },
  });

  // 10. Seed Livestream State & Module Settings
  await prisma.livestreamModuleSettings.create({
    data: {
      tenantId,
      moduleKey: 'livestream',
      enabled: true,
      billingPlan: 'free',
      providerMode: 'hybrid',
      configJson: JSON.stringify({
        enabled: true,
        publicPublishingEnabled: true,
        chatEnabled: true,
        givingButtonEnabled: true,
        prayerRequestEnabled: true,
      }),
    },
  });

  // Create stream associated with public router detail mapping
  await prisma.livestream.create({
    data: {
      id: `demo-livestream-${subdomain}`,
      tenantId,
      title: 'Sunday Morning Service LIVE',
      description: 'Welcome to our online worship service! Join live chat and pray with us.',
      scheduledAt: new Date('2026-06-07T09:00:00Z'),
      streamKey: 'live_demo_stream_key',
      rtmpIngestUrl: 'rtmp://ingest.churchos.io/live/live_demo_stream_key',
      countdownEnabled: true,
      chatEnabled: true,
      status: 'live',
      startedAt: new Date(),
    },
  });

  // 11. Seed Prayer & Testimony Data
  await prisma.prayerSession.create({
    data: {
      id: `friday-prayer-${subdomain}`,
      tenantId,
      title: 'Friday Night Corporate Prayer',
      description: 'Interceding together for our community, church, and nation.',
      startTime: new Date('2026-06-05T19:00:00Z'),
      endTime: new Date('2026-06-05T20:30:00Z'),
      status: 'scheduled',
    },
  });


  // 12. Seed LMS / Courses Data
  const course = await prisma.lmsCourse.create({
    data: {
      id: `discipleship-101-${subdomain}`,
      tenantId,
      title: 'Discipleship 101',
      slug: `discipleship-101-${subdomain}`,
      description: 'Understanding the fundamentals of Christian life.',
      status: 'published',
    },
  });

  const courseModule = await prisma.lmsModule.create({
    data: {
      tenantId,
      courseId: course.id,
      title: 'Foundations of Faith',
      sequenceOrder: 1,
    },
  });

  await prisma.lmsLesson.create({
    data: {
      tenantId,
      moduleId: courseModule.id,
      title: 'Lesson 1: The Word and Prayer',
      content: 'Consistent prayer and reading scripture are key foundations.',
      sequenceOrder: 1,
    },
  });

  // 13. Seed Cell Groups Data
  // Upsert group settings
  await prisma.groupSettings.create({
    data: {
      tenantId,
      cellSizeLimit: 15,
      superCellSizeLimit: 50,
      autoNamingRuleEnabled: true,
      hierarchyDeepLimit: 3,
    },
  });

  const groupType = await prisma.groupType.create({
    data: {
      tenantId,
      name: 'Cell Fellowship',
      tierLevel: 1,
    },
  });

  await prisma.group.create({
    data: {
      id: `demo-cell-group-${subdomain}`,
      tenantId,
      groupTypeId: groupType.id,
      name: 'Grace Fellowship North Cell',
      description: 'Home fellowship group meeting in North Faith City',
      status: 'active',
      locationGeocoding: JSON.stringify({
        address: '100 Faith Ave, North City',
        safeAddress: 'North Faith City',
        city: 'Faith City',
        lat: 34.0522,
        lng: -118.2437,
      }),
    },
  });

  // 14. Create Users, Admins, and Members
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const adminUser = await prisma.user.create({
    data: {
      tenantId,
      email: subdomain === 'grace-fellowship' ? 'admin@gracefellowship.local' : 'admin@suspended.local',
      passwordHash,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      tenantId,
      email: subdomain === 'grace-fellowship' ? 'member@gracefellowship.local' : 'member@suspended.local',
      passwordHash,
    },
  });

  const member = await prisma.member.create({
    data: {
      tenantId,
      userId: memberUser.id,
      firstName: 'John',
      lastName: 'Doe',
      email: memberUser.email,
      membershipStatus: 'member',
    },
  });

  await prisma.testimony.create({
    data: {
      tenantId,
      memberId: member.id,
      title: 'Miraculous Healing from Back Pain',
      content: 'During last Friday\'s prayer session, the pastor prayed for healing and my chronic back pain vanished immediately! Praise the Lord.',
      status: 'published',
      isFeatured: true,
    },
  });

  // 14.5 Seed Plugin Definitions
  const pluginDefinitions = [
    { id: 'mock-giving-booster', name: 'Giving Booster', description: 'Boosts tithes and donations' },
    { id: 'mock-sermon-notes', name: 'Sermon Notes', description: 'Allows taking notes during sermons' },
    { id: 'mock-analytics-tracker', name: 'Analytics Tracker', description: 'Tracks member views and conversions' },
    { id: 'mock-header-link', name: 'Header Link Plugin', description: 'Injects a call-to-action button in the header navigation' },
    { id: 'mock-event-badge', name: 'Event Badge Plugin', description: 'Displays a badge on the event detail view' },
    { id: 'mock-dashboard-widget', name: 'Member Dashboard Widget', description: 'Injects a customizable widget into the member dashboard page' }
  ];

  for (const pd of pluginDefinitions) {
    await prisma.pluginDefinition.upsert({
      where: { id: pd.id },
      update: {},
      create: pd
    });
  }

  // 15. Seed Plugins (TenantPlugin records)
  // Enabled: Giving Booster
  await prisma.tenantPlugin.create({
    data: {
      tenantId,
      pluginId: 'mock-giving-booster',
      status: 'active',
      settings: JSON.stringify({
        buttonColor: '#4f46e5',
        apiKey: 'secret-key-giving-booster-123',
        webhookUrl: 'https://gracefellowship.local/giving/webhook'
      }),
    },
  });

  // Disabled: Sermon Notes
  await prisma.tenantPlugin.create({
    data: {
      tenantId,
      pluginId: 'mock-sermon-notes',
      status: 'disabled',
      settings: JSON.stringify({}),
    },
  });

  // Enabled: Analytics Tracker (Secret settings)
  await prisma.tenantPlugin.create({
    data: {
      tenantId,
      pluginId: 'mock-analytics-tracker',
      status: 'active',
      settings: JSON.stringify({
        secretToken: 'super-secret-stripe-token-xyz',
        propertyId: 'UA-998877-1'
      }),
    },
  });

  // Enabled: Injected into Navigation
  await prisma.tenantPlugin.create({
    data: {
      tenantId,
      pluginId: 'mock-header-link',
      status: 'active',
      settings: JSON.stringify({
        linkText: 'Donate General Tithes',
        linkUrl: '/giving'
      }),
    },
  });

  // Enabled: Injected into event detail
  await prisma.tenantPlugin.create({
    data: {
      tenantId,
      pluginId: 'mock-event-badge',
      status: 'active',
      settings: JSON.stringify({}),
    },
  });

  // Enabled: Injected into member dashboard
  await prisma.tenantPlugin.create({
    data: {
      tenantId,
      pluginId: 'mock-dashboard-widget',
      status: 'active',
      settings: JSON.stringify({}),
    },
  });

  return {
    tenantId,
    websiteId,
    adminUserId: adminUser.id,
    memberId: member.id,
  };
}
