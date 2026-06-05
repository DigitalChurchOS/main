const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\Administrator\\Documents\\ChurchOS\\packages\\frontend-contracts\\src';

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function writeFile(relPath, content) {
  const fullPath = path.join(baseDir, relPath);
  ensureDirectoryExistence(fullPath);
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Wrote: ${relPath}`);
}

// -------------------------------------------------------------
// DATA MAPPERS
// -------------------------------------------------------------

writeFile('mappers/map-event-to-contract.ts', `
import { EventCardContract } from '../components/event-card.contract';
import { EventDetailContract } from '../components/event-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapEventToEventCardContract(event: any, tenantId: string): EventCardContract {
  if (event.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation: record tenantId does not match context.');
  }

  return {
    id: event.id,
    title: event.title || 'Untitled Event',
    description: event.description || null,
    imageUrl: event.imageUrl || event.photoUrl || null,
    startDateTime: new Date(event.startDateTime || event.startTime || Date.now()).toISOString(),
    endDateTime: new Date(event.endDateTime || event.endTime || Date.now()).toISOString(),
    location: event.location || 'Online',
    cta: getStandardCTA('register', { url: \`/events/\${event.id}\` }),
    visibility: (event.visibility || 'public_active')
  };
}

export function mapEventToEventDetailContract(event: any, tenantId: string): EventDetailContract {
  if (event.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation: record tenantId does not match context.');
  }

  return {
    id: event.id,
    title: event.title || 'Untitled Event',
    description: event.description || null,
    contentHtml: event.contentHtml || event.description || null,
    imageUrl: event.imageUrl || event.photoUrl || null,
    startDateTime: new Date(event.startDateTime || event.startTime || Date.now()).toISOString(),
    endDateTime: new Date(event.endDateTime || event.endTime || Date.now()).toISOString(),
    location: event.location || 'Online',
    organizer: event.organizer || 'Church Admin',
    capacity: event.capacity || null,
    registeredCount: event.registeredCount || 0,
    registrationCta: getStandardCTA('register', { url: \`/events/\${event.id}/register\` }),
    seo: {
      title: event.seoTitle || event.title || 'Church Event Details',
      description: event.seoDescription || event.description || null
    },
    visibility: (event.visibility || 'public_active')
  };
}
`);

writeFile('mappers/map-giving-to-contract.ts', `
import { GivingFormContract } from '../components/giving-form.contract';
import { GivingCategoryCardContract } from '../components/giving-category-card.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapGivingCategoryToGivingFormContract(categories: any[], tenantId: string): GivingFormContract {
  const normalizedCategories: GivingCategoryCardContract[] = categories.map(cat => {
    if (cat.tenantId !== tenantId) {
      throw new Error('Tenant isolation violation on giving category');
    }
    return {
      id: cat.id,
      name: cat.name || 'General Fund',
      description: cat.description || null,
      imageUrl: cat.imageUrl || null,
      cta: getStandardCTA('give', { url: \`/give/\${cat.id}\` })
    };
  });

  return {
    categories: normalizedCategories,
    form: {
      formKey: 'online-giving-form',
      displayName: 'Online Giving Form',
      fields: [
        { name: 'amount', label: 'Donation Amount', type: 'number', validation: { required: true, min: 1 } },
        { name: 'categoryId', label: 'Giving Fund / Category', type: 'select', validation: { required: true } }
      ],
      submitUrl: '/api/giving/donate',
      submitMethod: 'POST'
    },
    suggestedAmounts: [10, 20, 50, 100, 250, 500],
    submitCta: getStandardCTA('donate', { url: '/give/submit' })
  };
}
`);

writeFile('mappers/map-sermon-to-contract.ts', `
import { SermonCardContract } from '../components/sermon-card.contract';
import { SermonPlayerContract } from '../components/sermon-player.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapSermonToSermonCardContract(sermon: any, tenantId: string): SermonCardContract {
  if (sermon.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on sermon card mapping');
  }

  return {
    id: sermon.id,
    title: sermon.title || 'Untitled Sermon',
    speaker: sermon.speaker || 'Guest Speaker',
    seriesName: sermon.seriesName || sermon.series || null,
    date: new Date(sermon.date || sermon.createdAt || Date.now()).toISOString(),
    thumbnailUrl: sermon.thumbnailUrl || null,
    cta: getStandardCTA('watch', { url: \`/sermons/\${sermon.id}\` })
  };
}

export function mapSermonToSermonPlayerContract(sermon: any, tenantId: string): SermonPlayerContract {
  if (sermon.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on sermon player mapping');
  }

  return {
    id: sermon.id,
    title: sermon.title || 'Untitled Sermon',
    speaker: sermon.speaker || 'Guest Speaker',
    seriesName: sermon.seriesName || sermon.series || null,
    date: new Date(sermon.date || sermon.createdAt || Date.now()).toISOString(),
    description: sermon.description || null,
    media: {
      id: sermon.mediaId || sermon.id,
      type: 'video',
      title: sermon.title,
      sources: [{ url: sermon.videoUrl || sermon.streamUrl || '', mimeType: 'video/mp4' }]
    },
    notesHtml: sermon.notesHtml || sermon.notes || null,
    seo: {
      title: sermon.title,
      description: sermon.description || null
    }
  };
}
`);

writeFile('mappers/map-media-to-contract.ts', `
import { MediaCardContract } from '../components/media-card.contract';
import { MediaPlayerContract } from '../components/media-player.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapMediaItemToMediaCardContract(item: any, tenantId: string): MediaCardContract {
  if (item.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on media card mapping');
  }

  return {
    id: item.id,
    title: item.title || 'Untitled Media',
    type: (item.fileType || item.type || 'video'),
    thumbnailUrl: item.thumbnailUrl || null,
    durationSeconds: item.durationSeconds || item.duration || null,
    date: new Date(item.createdAt || Date.now()).toISOString(),
    cta: getStandardCTA('view', { url: \`/media/\${item.id}\` })
  };
}

export function mapMediaItemToMediaPlayerContract(item: any, tenantId: string): MediaPlayerContract {
  if (item.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on media player mapping');
  }

  return {
    id: item.id,
    title: item.title || 'Untitled Media',
    description: item.description || null,
    media: {
      id: item.id,
      type: (item.fileType || item.type || 'video'),
      title: item.title,
      sources: [{ url: item.storageProviderRef || item.url || '', mimeType: item.fileType || 'video/mp4' }]
    },
    seo: {
      title: item.title,
      description: item.description || null
    }
  };
}
`);

writeFile('mappers/map-livestream-to-contract.ts', `
import { LivestreamPlayerContract } from '../components/livestream-player.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapLivestreamToContract(stream: any, tenantId: string): LivestreamPlayerContract {
  if (stream.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on livestream mapping');
  }

  return {
    id: stream.id,
    title: stream.title || 'Sunday Worship Service',
    status: (stream.status || 'offline'),
    streamUrl: stream.streamUrl || null,
    countdownTarget: stream.countdownTarget || null,
    chatEnabled: !!stream.chatEnabled,
    cta: stream.status === 'live' ? getStandardCTA('watch', { url: '/live' }) : null
  };
}
`);

writeFile('mappers/map-prayer-to-contract.ts', `
import { PrayerSessionCardContract } from '../components/prayer-session-card.contract';
import { PrayerRoomContract } from '../components/prayer-room.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapPrayerSessionToPrayerSessionContract(session: any, tenantId: string): PrayerSessionCardContract {
  if (session.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on prayer session mapping');
  }

  return {
    id: session.id,
    title: session.title || 'Worship Prayer Room',
    startTime: new Date(session.startTime || Date.now()).toISOString(),
    endTime: new Date(session.endTime || Date.now() + 3600000).toISOString(),
    hostName: session.hostName || session.host?.name || 'Prayer Leader',
    activeParticipants: session.activeParticipants || 0,
    cta: getStandardCTA('join', { url: \`/prayer/room/\${session.id}\` })
  };
}

export function mapPrayerRequestToPrayerWallContract(requests: any[], tenantId: string): any {
  return {
    requests: requests.map(req => {
      if (req.tenantId !== tenantId) {
        throw new Error('Tenant isolation violation on prayer request mapping');
      }
      return {
        id: req.id,
        requesterName: req.isAnonymous ? 'Anonymous' : (req.requesterName || req.member?.firstName || 'Someone'),
        requestText: req.requestText || req.content || '',
        date: new Date(req.createdAt || Date.now()).toISOString(),
        prayersCount: req.prayersCount || 0,
        hasPrayed: !!req.hasPrayed
      };
    }),
    submitRequestCta: getStandardCTA('pray', { url: '/prayer/new' })
  };
}
`);

writeFile('mappers/map-testimony-to-contract.ts', `
import { TestimonyCardContract } from '../components/testimony-card.contract';
import { TestimonyWallContract } from '../components/testimony-wall.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapTestimonyToTestimonyCardContract(testimony: any, tenantId: string): TestimonyCardContract {
  if (testimony.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on testimony mapping');
  }

  return {
    id: testimony.id,
    authorName: testimony.isAnonymous ? 'Anonymous' : (testimony.authorName || testimony.member?.firstName || 'A Believer'),
    content: testimony.content || testimony.testimonyText || '',
    date: new Date(testimony.createdAt || Date.now()).toISOString(),
    likesCount: testimony.likesCount || 0,
    cta: getStandardCTA('share', { url: \`/testimonies/\${testimony.id}\` })
  };
}

export function mapTestimoniesToWallContract(testimonies: any[], tenantId: string): TestimonyWallContract {
  return {
    testimonies: testimonies.map(t => mapTestimonyToTestimonyCardContract(t, tenantId)),
    submitTestimonyCta: getStandardCTA('share', { url: '/testimonies/new' })
  };
}
`);

writeFile('mappers/map-course-to-contract.ts', `
import { CourseCardContract } from '../components/course-card.contract';
import { CourseDetailContract } from '../components/course-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapCourseToCourseCardContract(course: any, tenantId: string): CourseCardContract {
  if (course.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on course card mapping');
  }

  return {
    id: course.id,
    title: course.title || 'New Course',
    description: course.description || null,
    thumbnailUrl: course.thumbnailUrl || null,
    lessonsCount: course.lessonsCount || (course.lessons?.length || 0),
    durationMinutes: course.durationMinutes || null,
    cta: getStandardCTA('enroll', { url: \`/academy/\${course.id}\` })
  };
}

export function mapCourseToCourseDetailContract(course: any, tenantId: string): CourseDetailContract {
  if (course.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on course detail mapping');
  }

  return {
    id: course.id,
    title: course.title || 'New Course',
    description: course.description || null,
    thumbnailUrl: course.thumbnailUrl || null,
    lessons: (course.lessons || []).map((les: any) => ({
      id: les.id,
      courseId: course.id,
      title: les.title || 'Untitled Lesson',
      order: les.order ?? les.stepOrder ?? 1,
      durationMinutes: les.durationMinutes || null,
      isFreePreview: !!les.isFreePreview,
      cta: getStandardCTA('view', { url: \`/academy/\${course.id}/lessons/\${les.id}\` })
    })),
    cta: getStandardCTA('enroll', { url: \`/academy/\${course.id}/enroll\` }),
    seo: {
      title: course.title,
      description: course.description || null
    }
  };
}
`);

writeFile('mappers/map-group-to-contract.ts', `
import { GroupCardContract } from '../components/group-card.contract';
import { GroupDetailContract } from '../components/group-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapGroupToGroupCardContract(group: any, tenantId: string): GroupCardContract {
  if (group.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on group card mapping');
  }

  return {
    id: group.id,
    name: group.name || 'Worship Fellowship Group',
    description: group.description || null,
    type: group.type || 'cell',
    leaderName: group.leaderName || group.leader?.firstName || 'Fellowship Leader',
    schedule: group.schedule || 'Weekly',
    cta: getStandardCTA('join', { url: \`/groups/\${group.id}\` })
  };
}

export function mapGroupToGroupDetailContract(group: any, tenantId: string): GroupDetailContract {
  if (group.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on group detail mapping');
  }

  return {
    id: group.id,
    name: group.name || 'Worship Fellowship Group',
    description: group.description || null,
    schedule: group.schedule || 'Weekly',
    location: group.location || 'Church Annex',
    membersCount: group.membersCount || (group.members?.length || 0),
    joinForm: {
      formKey: \`join-group-\${group.id}\`,
      displayName: \`Join Group: \${group.name}\`,
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', validation: { required: true } },
        { name: 'email', label: 'Email', type: 'email', validation: { required: true } }
      ],
      submitUrl: \`/api/groups/\${group.id}/join\`,
      submitMethod: 'POST'
    },
    seo: {
      title: group.name,
      description: group.description || null
    }
  };
}
`);

writeFile('mappers/map-product-to-contract.ts', `
import { ProductCardContract } from '../components/product-card.contract';
import { ProductDetailContract } from '../components/product-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapProductToProductCardContract(prod: any, tenantId: string): ProductCardContract {
  if (prod.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on product card mapping');
  }

  return {
    id: prod.id,
    title: prod.title || 'Store Product',
    price: prod.price || 0,
    compareAtPrice: prod.compareAtPrice || null,
    thumbnailUrl: prod.thumbnailUrl || prod.imageUrl || null,
    isDigital: !!prod.isDigital,
    cta: getStandardCTA('view', { url: \`/store/\${prod.id}\` })
  };
}

export function mapProductToProductDetailContract(prod: any, tenantId: string): ProductDetailContract {
  if (prod.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on product detail mapping');
  }

  return {
    id: prod.id,
    title: prod.title || 'Store Product',
    price: prod.price || 0,
    descriptionHtml: prod.descriptionHtml || prod.description || null,
    images: prod.images || (prod.imageUrl ? [prod.imageUrl] : []),
    isDigital: !!prod.isDigital,
    purchaseForm: {
      formKey: \`buy-product-\${prod.id}\`,
      displayName: 'Purchase Product',
      fields: [
        { name: 'quantity', label: 'Quantity', type: 'number', validation: { required: true, min: 1 } }
      ],
      submitUrl: \`/api/store/cart/add/\${prod.id}\`,
      submitMethod: 'POST'
    },
    seo: {
      title: prod.title,
      description: prod.description || null
    }
  };
}
`);

writeFile('mappers/map-campaign-to-contract.ts', `
import { CampaignCardContract } from '../components/campaign-card.contract';
import { CampaignProgressContract } from '../components/campaign-progress.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapCampaignToCampaignCardContract(camp: any, tenantId: string): CampaignCardContract {
  if (camp.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on campaign card mapping');
  }

  return {
    id: camp.id,
    title: camp.title || 'Kingdom Project',
    description: camp.description || null,
    thumbnailUrl: camp.thumbnailUrl || camp.imageUrl || null,
    targetAmount: camp.targetAmount || camp.goalAmount || 0,
    currentAmount: camp.currentAmount || 0,
    cta: getStandardCTA('partner', { url: \`/campaigns/\${camp.id}\` })
  };
}

export function mapCampaignToProgressContract(camp: any, tenantId: string): CampaignProgressContract {
  if (camp.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on campaign progress mapping');
  }

  const target = camp.targetAmount || camp.goalAmount || 1;
  const current = camp.currentAmount || 0;
  const percent = Math.min(Math.round((current / target) * 100), 100);

  return {
    campaignId: camp.id,
    targetAmount: target,
    currentAmount: current,
    donorsCount: camp.donorsCount || 0,
    percentComplete: percent,
    progressColor: camp.progressColor || '#4f46e5'
  };
}
`);

writeFile('mappers/map-member-to-contract.ts', `
import { MemberProfileContract } from '../components/member-profile.contract';

export function mapMemberToMemberProfileContract(member: any, tenantId: string): MemberProfileContract {
  if (member.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on member profile mapping');
  }

  return {
    id: member.id,
    firstName: member.firstName || 'First',
    lastName: member.lastName || 'Last',
    email: member.email || null,
    phone: member.phone || null,
    photoUrl: member.photoUrl || null,
    branchName: member.branchName || member.branch?.name || null,
    joinedDate: new Date(member.createdAt || Date.now()).toISOString()
  };
}
`);

writeFile('mappers/map-cms-to-contract.ts', `
import { CMSPageContract, PageSectionContract, ContentBlockContract } from '../components/cms-page.contract';
import { NavigationMenuContract } from '../components/navigation.contract';

export function mapCMSPageToCMSPageContract(page: any, tenantId: string): CMSPageContract {
  if (page.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on CMS page mapping');
  }

  const rawBlocks = typeof page.content === 'string' ? JSON.parse(page.content) : (page.content || []);
  
  // Transform layout block items into standard ContentBlockContract format
  const blocks: ContentBlockContract[] = rawBlocks.map((b: any) => ({
    id: b.id || Math.random().toString(),
    type: b.type || 'text',
    props: b.props || {},
    styles: b.styles || {}
  }));

  // Chunk blocks into layout sections
  const sections: PageSectionContract[] = [{
    id: 'default-section',
    type: 'section',
    blocks
  }];

  return {
    id: page.id,
    title: page.title || 'Untitled Page',
    slug: page.slug || '',
    isHome: !!page.isHome,
    sections,
    seo: {
      title: page.seoTitle || page.title || '',
      description: page.seoDescription || null,
      keywords: page.seoKeywords || null
    },
    visibility: (page.status === 'published' ? 'public_active' : 'preview_only')
  };
}

export function mapNavigationToNavigationMenuContract(menu: any, tenantId: string): NavigationMenuContract {
  if (menu.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on navigation menu mapping');
  }

  const rawItems = typeof menu.items === 'string' ? JSON.parse(menu.items) : (menu.items || []);

  return {
    id: menu.id,
    name: menu.name || 'Header Navigation',
    items: rawItems.map((itm: any) => ({
      label: itm.label || 'Home',
      url: itm.url || '/',
      target: itm.target || '_self',
      isMemberOnly: !!itm.isMemberOnly,
      requiredPermissions: itm.requiredPermissions || []
    })),
    visibility: menu.isActive ? 'public_active' : 'disabled'
  };
}
`);

writeFile('mappers/index.ts', `
export * from './map-event-to-contract';
export * from './map-giving-to-contract';
export * from './map-sermon-to-contract';
export * from './map-media-to-contract';
export * from './map-livestream-to-contract';
export * from './map-prayer-to-contract';
export * from './map-testimony-to-contract';
export * from './map-course-to-contract';
export * from './map-group-to-contract';
export * from './map-product-to-contract';
export * from './map-campaign-to-contract';
export * from './map-member-to-contract';
export * from './map-cms-to-contract';
`);

console.log('Data mappers generated successfully.');
