// Thin per-module data clients that fetch from the backend API,
// with clean contract-shaped mock data fallbacks if the database is unpopulated or requires authentication.

export async function fetchModuleList(moduleKey: string): Promise<any[]> {
  const pathMap: Record<string, string> = {
    'events-management': '/api/events',
    'sermons-media': '/api/media',
    'giving-tithes': '/api/giving/categories',
    'groups-community': '/api/cells',
    'lms-courses': '/api/lms/courses',
    'blog': '/api/blog/posts',
    'store': '/api/store/products',
  };

  const path = pathMap[moduleKey];
  if (!path) return [];

  try {
    const res = await fetch(path);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) return json.data;
    }
  } catch (e) {
    console.warn(`Failed fetching ${moduleKey} list, using mock fallback:`, e);
  }

  // Contract-compliant mock fallbacks
  return getMockList(moduleKey);
}

export async function fetchModuleDetail(moduleKey: string, id: string): Promise<any> {
  const pathMap: Record<string, string> = {
    'events-management': `/api/events/${id}`,
    'sermons-media': `/api/media/${id}`,
    'groups-community': `/api/cells/${id}`,
    'lms-courses': `/api/lms/courses/${id}`,
    'blog': `/api/blog/posts/${id}`,
    'store': `/api/store/products/${id}`,
    'livestream-broadcasting': '/api/public/livestream',
  };

  const path = pathMap[moduleKey];
  if (!path) return null;

  try {
    const res = await fetch(path);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (e) {
    console.warn(`Failed fetching ${moduleKey} detail for ${id}, using mock fallback:`, e);
  }

  return getMockDetail(moduleKey, id);
}

function getMockList(moduleKey: string): any[] {
  switch (moduleKey) {
    case 'events-management':
      return [
        {
          id: 'easter-2026',
          title: 'Easter Sunday Celebration',
          description: 'Join us for our special Easter celebration service!',
          imageUrl: 'https://images.unsplash.com/photo-1544427928-c49cdfebf194?w=800',
          startDateTime: new Date(Date.now() + 86400000 * 3).toISOString(),
          endDateTime: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
          location: 'Main Auditorium',
          cta: { label: 'Register', action: 'link', url: '/events/easter-2026' },
          visibility: 'public'
        },
        {
          id: 'youth-camp',
          title: 'Youth Encounter Camp',
          description: 'A weekend of worship, fellowship, and encountering God.',
          imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
          startDateTime: new Date(Date.now() + 86400000 * 10).toISOString(),
          endDateTime: new Date(Date.now() + 86400000 * 13).toISOString(),
          location: 'Pine Lake Retreat',
          cta: { label: 'Register', action: 'link', url: '/events/youth-camp' },
          visibility: 'public'
        }
      ];
    case 'sermons-media':
      return [
        {
          id: 'sermon-1',
          title: 'Walking in Wisdom',
          speaker: 'Pastor John Doe',
          seriesName: 'The Book of Proverbs',
          date: '2026-06-01',
          thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
          cta: { label: 'Watch Now', action: 'link', url: '/sermons/sermon-1' }
        },
        {
          id: 'sermon-2',
          title: 'Faith Over Fear',
          speaker: 'Pastor Jane Smith',
          seriesName: 'Courageous Faith',
          date: '2026-05-25',
          thumbnailUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
          cta: { label: 'Watch Now', action: 'link', url: '/sermons/sermon-2' }
        }
      ];
    case 'giving-tithes':
      return [
        {
          id: 'general-fund',
          title: 'General Fund',
          description: 'Supports the day-to-day operations and ministries of the church.',
          cta: { label: 'Give Now', action: 'link', url: '/giving' }
        },
        {
          id: 'missions',
          title: 'Global Missions',
          description: 'Directly funds our global mission partners and outreach efforts.',
          cta: { label: 'Support Missions', action: 'link', url: '/giving' }
        }
      ];
    case 'groups-community':
      return [
        {
          id: 'young-adults',
          title: 'Young Adults Group',
          description: 'Weekly bible study and community for ages 18-30.',
          imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
          meetingTime: 'Tuesdays at 7:00 PM',
          location: 'West Campus Cafe',
          cta: { label: 'Join Group', action: 'link', url: '/groups/young-adults' },
          visibility: 'public'
        },
        {
          id: 'womens-fellowship',
          title: 'Womens Bible Study',
          description: 'A study on the names of God, meeting twice a month.',
          imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
          meetingTime: 'Saturdays at 9:00 AM',
          location: 'Online (Zoom)',
          cta: { label: 'Join Group', action: 'link', url: '/groups/womens-fellowship' },
          visibility: 'public'
        }
      ];
    case 'lms-courses':
      return [
        {
          id: 'membership-101',
          title: 'Church Membership 101',
          description: 'Learn about our history, values, and how you can get involved.',
          imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
          lessonsCount: 4,
          cta: { label: 'Enroll', action: 'link', url: '/courses/membership-101' }
        }
      ];
    case 'blog':
      return [
        {
          id: 'blog-1',
          title: 'Why Community Matters Now More Than Ever',
          summary: 'In an isolated world, the church is a lighthouse of connection.',
          publishedDate: '2026-06-03',
          imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
          author: 'Pastor John Doe',
          cta: { label: 'Read Article', action: 'link', url: '/blog/blog-1' }
        }
      ];
    case 'store':
      return [
        {
          id: 'book-wisdom',
          title: 'Proverbs: Walking in Wisdom Study Guide',
          price: 15.00,
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
          cta: { label: 'Add to Cart', action: 'link', url: '/store/book-wisdom' }
        }
      ];
    default:
      return [];
  }
}

function getMockDetail(moduleKey: string, id: string): any {
  switch (moduleKey) {
    case 'events-management':
      return {
        id,
        title: id === 'easter-2026' ? 'Easter Sunday Celebration' : 'Youth Encounter Camp',
        description: 'Join us for an inspiring time together.',
        contentHtml: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>',
        imageUrl: 'https://images.unsplash.com/photo-1544427928-c49cdfebf194?w=1200',
        startDateTime: new Date(Date.now() + 86400000 * 3).toISOString(),
        endDateTime: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
        location: 'Main Auditorium & Live Online',
        organizer: 'Events Committee',
        capacity: 500,
        registeredCount: 342,
        registrationCta: { label: 'Register Now', action: 'link', url: `/events/${id}` },
        seo: { title: 'Easter Sunday', description: 'Easter event details' },
        visibility: 'public'
      };
    case 'sermons-media':
      return {
        id,
        title: 'Walking in Wisdom',
        speaker: 'Pastor John Doe',
        seriesName: 'The Book of Proverbs',
        date: '2026-06-01',
        description: 'A study on how to apply biblical wisdom in modern daily life.',
        mediaAsset: {
          id: 'asset-1',
          type: 'video',
          title: 'Walking in Wisdom Video',
          sources: [{ url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', mimeType: 'video/mp4' }]
        },
        cta: { label: 'Download Notes', action: 'link', url: '#' }
      };
    case 'groups-community':
      return {
        id,
        title: 'Young Adults Group',
        description: 'Weekly bible study and community for ages 18-30.',
        meetingTime: 'Tuesdays at 7:00 PM',
        location: 'West Campus Cafe',
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200',
        leaders: ['John & Sarah Doe'],
        membersCount: 15,
        cta: { label: 'Join Group', action: 'link', url: '#' },
        visibility: 'public'
      };
    case 'lms-courses':
      return {
        id,
        title: 'Church Membership 101',
        description: 'Learn about our history, values, and how you can get involved.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
        lessons: [
          { id: 'l1', title: 'Lesson 1: Our History & Foundations', durationSeconds: 600 },
          { id: 'l2', title: 'Lesson 2: Our Beliefs & Doctrine', durationSeconds: 900 },
          { id: 'l3', title: 'Lesson 3: Ministry Opportunities', durationSeconds: 720 },
          { id: 'l4', title: 'Lesson 4: Covenants & Next Steps', durationSeconds: 450 }
        ],
        cta: { label: 'Start Course', action: 'link', url: '#' }
      };
    case 'blog':
      return {
        id,
        title: 'Why Community Matters Now More Than Ever',
        contentHtml: '<p>Community is at the core of human flourishing. When we join together, we share burdens and double our joy.</p>',
        publishedDate: '2026-06-03',
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200',
        author: 'Pastor John Doe',
        seo: { title: 'Community Matters', description: 'Why community is vital' }
      };
    case 'store':
      return {
        id,
        title: 'Proverbs: Walking in Wisdom Study Guide',
        price: 15.00,
        description: 'An inductive study guide through the wisdom of Proverbs.',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200',
        cta: { label: 'Purchase Now', action: 'link', url: '#' }
      };
    case 'livestream-broadcasting':
      return {
        id: 'live-stream',
        title: 'Sunday Morning Worship',
        status: 'live', // live | countdown | offline
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        chatEnabled: true,
        countdownTarget: new Date(Date.now() + 3600000).toISOString(),
        scheduledTime: 'Sunday at 9:00 AM',
        cta: { label: 'Online Giving', action: 'link', url: '/giving' }
      };
    default:
      return null;
  }
}
