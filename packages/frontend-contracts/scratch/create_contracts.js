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
// COMPONENT CONTRACTS
// -------------------------------------------------------------

writeFile('components/event-card.contract.ts', `
import { VisibilityState } from '../core/visibility.types';
import { CTAContract } from '../core/cta.types';

export interface EventCardContract {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  cta: CTAContract;
  visibility: VisibilityState;
}
`);

writeFile('components/event-detail.contract.ts', `
import { VisibilityState } from '../core/visibility.types';
import { CTAContract } from '../core/cta.types';
import { SEOContract } from '../core/seo.types';

export interface EventDetailContract {
  id: string;
  title: string;
  description?: string | null;
  contentHtml?: string | null;
  imageUrl?: string | null;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  organizer?: string | null;
  capacity?: number | null;
  registeredCount?: number | null;
  registrationCta: CTAContract;
  seo: SEOContract;
  visibility: VisibilityState;
}
`);

writeFile('components/event-registration-form.contract.ts', `
import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface EventRegistrationFormContract {
  eventId: string;
  eventTitle: string;
  form: FormContract;
  submitCta: CTAContract;
}
`);

writeFile('components/giving-form.contract.ts', `
import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';
import { GivingCategoryCardContract } from './giving-category-card.contract';

export interface GivingFormContract {
  categories: GivingCategoryCardContract[];
  form: FormContract;
  suggestedAmounts: number[];
  submitCta: CTAContract;
}
`);

writeFile('components/giving-category-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface GivingCategoryCardContract {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  cta: CTAContract;
}
`);

writeFile('components/sermon-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface SermonCardContract {
  id: string;
  title: string;
  speaker: string;
  seriesName?: string | null;
  date: string;
  thumbnailUrl?: string | null;
  cta: CTAContract;
}
`);

writeFile('components/sermon-player.contract.ts', `
import { MediaAssetContract } from '../core/media.types';
import { SEOContract } from '../core/seo.types';

export interface SermonPlayerContract {
  id: string;
  title: string;
  speaker: string;
  seriesName?: string | null;
  date: string;
  description?: string | null;
  media: MediaAssetContract;
  notesHtml?: string | null;
  seo: SEOContract;
}
`);

writeFile('components/media-card.contract.ts', `
import { MediaType } from '../core/media.types';
import { CTAContract } from '../core/cta.types';

export interface MediaCardContract {
  id: string;
  title: string;
  type: MediaType;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  date: string;
  cta: CTAContract;
}
`);

writeFile('components/media-player.contract.ts', `
import { MediaAssetContract } from '../core/media.types';
import { SEOContract } from '../core/seo.types';

export interface MediaPlayerContract {
  id: string;
  title: string;
  description?: string | null;
  media: MediaAssetContract;
  seo: SEOContract;
}
`);

writeFile('components/livestream-player.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface LivestreamPlayerContract {
  id: string;
  title: string;
  status: 'live' | 'offline' | 'countdown';
  streamUrl?: string | null;
  countdownTarget?: string | null;
  chatEnabled: boolean;
  cta?: CTAContract | null;
}
`);

writeFile('components/course-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface CourseCardContract {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  lessonsCount: number;
  durationMinutes?: number | null;
  cta: CTAContract;
}
`);

writeFile('components/course-detail.contract.ts', `
import { CTAContract } from '../core/cta.types';
import { SEOContract } from '../core/seo.types';
import { LessonPreviewContract } from './lesson-preview.contract';

export interface CourseDetailContract {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  lessons: LessonPreviewContract[];
  cta: CTAContract;
  seo: SEOContract;
}
`);

writeFile('components/lesson-preview.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface LessonPreviewContract {
  id: string;
  courseId: string;
  title: string;
  order: number;
  durationMinutes?: number | null;
  isFreePreview: boolean;
  cta: CTAContract;
}
`);

writeFile('components/prayer-session-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface PrayerSessionCardContract {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hostName: string;
  activeParticipants: number;
  cta: CTAContract;
}
`);

writeFile('components/prayer-room.contract.ts', `
import { VisibilityState } from '../core/visibility.types';

export interface PrayerRoomContract {
  id: string;
  title: string;
  meetingToken: string;
  chatEnabled: boolean;
  hostId?: string | null;
  visibility: VisibilityState;
}
`);

writeFile('components/prayer-request-form.contract.ts', `
import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface PrayerRequestFormContract {
  form: FormContract;
  submitCta: CTAContract;
}
`);

writeFile('components/prayer-wall.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface PrayerRequestItem {
  id: string;
  requesterName: string;
  requestText: string;
  date: string;
  prayersCount: number;
  hasPrayed?: boolean;
}

export interface PrayerWallContract {
  requests: PrayerRequestItem[];
  submitRequestCta: CTAContract;
}
`);

writeFile('components/testimony-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface TestimonyCardContract {
  id: string;
  authorName: string;
  content: string;
  date: string;
  likesCount: number;
  cta: CTAContract;
}
`);

writeFile('components/testimony-wall.contract.ts', `
import { CTAContract } from '../core/cta.types';
import { TestimonyCardContract } from './testimony-card.contract';

export interface TestimonyWallContract {
  testimonies: TestimonyCardContract[];
  submitTestimonyCta: CTAContract;
}
`);

writeFile('components/campaign-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface CampaignCardContract {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  targetAmount: number;
  currentAmount: number;
  cta: CTAContract;
}
`);

writeFile('components/campaign-progress.contract.ts', `
export interface CampaignProgressContract {
  campaignId: string;
  targetAmount: number;
  currentAmount: number;
  donorsCount: number;
  percentComplete: number;
  progressColor?: string;
}
`);

writeFile('components/product-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface ProductCardContract {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnailUrl?: string | null;
  isDigital: boolean;
  cta: CTAContract;
}
`);

writeFile('components/product-detail.contract.ts', `
import { FormContract } from '../core/form.types';
import { SEOContract } from '../core/seo.types';

export interface ProductDetailContract {
  id: string;
  title: string;
  price: number;
  descriptionHtml?: string | null;
  images: string[];
  isDigital: boolean;
  purchaseForm: FormContract;
  seo: SEOContract;
}
`);

writeFile('components/group-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface GroupCardContract {
  id: string;
  name: string;
  description?: string | null;
  type: string; // e.g. cell, fellowship, interestGroup
  leaderName: string;
  schedule?: string | null;
  cta: CTAContract;
}
`);

writeFile('components/group-detail.contract.ts', `
import { FormContract } from '../core/form.types';
import { SEOContract } from '../core/seo.types';

export interface GroupDetailContract {
  id: string;
  name: string;
  description?: string | null;
  schedule?: string | null;
  location?: string | null;
  membersCount: number;
  joinForm: FormContract;
  seo: SEOContract;
}
`);

writeFile('components/salvation-response-form.contract.ts', `
import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface SalvationResponseFormContract {
  form: FormContract;
  submitCta: CTAContract;
}
`);

writeFile('components/new-visitor-form.contract.ts', `
import { FormContract } from '../core/form.types';
import { CTAContract } from '../core/cta.types';

export interface NewVisitorFormContract {
  form: FormContract;
  submitCta: CTAContract;
}
`);

writeFile('components/resource-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface ResourceCardContract {
  id: string;
  title: string;
  description?: string | null;
  downloadUrl: string;
  fileType: string;
  thumbnailUrl?: string | null;
  cta: CTAContract;
}
`);

writeFile('components/blog-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface BlogCardContract {
  id: string;
  title: string;
  excerpt?: string | null;
  author: string;
  publishedDate: string;
  imageUrl?: string | null;
  readTimeMinutes?: number | null;
  cta: CTAContract;
}
`);

writeFile('components/service-card.contract.ts', `
import { CTAContract } from '../core/cta.types';

export interface ServiceCardContract {
  id: string;
  title: string;
  timeString: string;
  branchName?: string | null;
  location?: string | null;
  livestreamCta?: CTAContract | null;
}
`);

writeFile('components/member-profile.contract.ts', `
export interface MemberProfileContract {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  branchName?: string | null;
  joinedDate: string;
}
`);

writeFile('components/member-dashboard.contract.ts', `
import { MemberProfileContract } from './member-profile.contract';
import { CTAContract } from '../core/cta.types';
import { EventCardContract } from './event-card.contract';
import { CourseCardContract } from './course-card.contract';

export interface MemberDashboardContract {
  profile: MemberProfileContract;
  quickLinks: CTAContract[];
  recentActivities: { id: string; type: string; title: string; occurredAt: string }[];
  registeredEvents: EventCardContract[];
  enrolledCourses: CourseCardContract[];
}
`);

writeFile('components/navigation.contract.ts', `
import { VisibilityState } from '../core/visibility.types';

export interface NavigationItemContract {
  label: string;
  url: string;
  target?: '_self' | '_blank';
  isMemberOnly?: boolean;
  requiredPermissions?: string[];
  children?: NavigationItemContract[];
}

export interface NavigationMenuContract {
  id: string;
  name: string;
  items: NavigationItemContract[];
  visibility: VisibilityState;
}
`);

writeFile('components/cms-page.contract.ts', `
import { VisibilityState } from '../core/visibility.types';
import { SEOContract } from '../core/seo.types';

export interface ContentBlockContract {
  id: string;
  type: string;
  props: Record<string, any>;
  styles: Record<string, any>;
  children?: ContentBlockContract[];
}

export interface PageSectionContract {
  id: string;
  type: 'section' | 'container' | 'flexbox' | 'grid';
  blocks: ContentBlockContract[];
  styles?: Record<string, any>;
}

export interface CMSPageContract {
  id: string;
  title: string;
  slug: string;
  isHome: boolean;
  sections: PageSectionContract[];
  seo: SEOContract;
  visibility: VisibilityState;
}
`);

console.log('Component contracts generated successfully.');
