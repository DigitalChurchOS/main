import { ThemeSlotKey, ThemeSlotContract } from '../core/theme-slot.types';

const slotsMap = new Map<ThemeSlotKey, ThemeSlotContract>();

export function registerThemeSlot(slot: ThemeSlotContract): void {
  if (slotsMap.has(slot.slotKey)) {
    throw new Error('Duplicate theme slot key: ' + slot.slotKey + ' is already registered.');
  }
  slotsMap.set(slot.slotKey, slot);
}

export function getThemeSlot(slotKey: ThemeSlotKey): ThemeSlotContract | undefined {
  return slotsMap.get(slotKey);
}

export function isThemeSlotRegistered(slotKey: string): boolean {
  return slotsMap.has(slotKey as ThemeSlotKey);
}

export function listThemeSlots(): ThemeSlotContract[] {
  return Array.from(slotsMap.values());
}

export function clearThemeSlotRegistry(): void {
  slotsMap.clear();
}

// Auto-register default theme slots
const defaultSlots: ThemeSlotContract[] = [
  { slotKey: 'layout.announcementBar', displayName: 'Announcement Bar', expectedDataType: 'AnnouncementBarContract' },
  { slotKey: 'layout.header', displayName: 'Header', expectedDataType: 'NavigationMenuContract' },
  { slotKey: 'layout.footer', displayName: 'Footer', expectedDataType: 'CmsFooterContract' },
  { slotKey: 'layout.mobileNav', displayName: 'Mobile Navigation', expectedDataType: 'NavigationMenuContract' },
  { slotKey: 'page.home', displayName: 'Home Page', expectedDataType: 'CMSPageContract' },
  { slotKey: 'page.about', displayName: 'About Page', expectedDataType: 'CMSPageContract' },
  { slotKey: 'page.contact', displayName: 'Contact Page', expectedDataType: 'CMSPageContract' },
  { slotKey: 'event.card', displayName: 'Event Card', expectedDataType: 'EventCardContract' },
  { slotKey: 'event.detail', displayName: 'Event Detail', expectedDataType: 'EventDetailContract' },
  { slotKey: 'event.registrationForm', displayName: 'Event Registration Form', expectedDataType: 'EventRegistrationFormContract' },
  { slotKey: 'giving.form', displayName: 'Giving Form', expectedDataType: 'GivingFormContract' },
  { slotKey: 'giving.categoryCard', displayName: 'Giving Category Card', expectedDataType: 'GivingCategoryCardContract' },
  { slotKey: 'sermon.card', displayName: 'Sermon Card', expectedDataType: 'SermonCardContract' },
  { slotKey: 'sermon.player', displayName: 'Sermon Player', expectedDataType: 'SermonPlayerContract' },
  { slotKey: 'media.card', displayName: 'Media Card', expectedDataType: 'MediaCardContract' },
  { slotKey: 'media.player', displayName: 'Media Player', expectedDataType: 'MediaPlayerContract' },
  { slotKey: 'livestream.player', displayName: 'Livestream Player', expectedDataType: 'LivestreamPlayerContract' },
  { slotKey: 'livestream.countdown', displayName: 'Livestream Countdown', expectedDataType: 'LivestreamCountdownContract' },
  { slotKey: 'livestream.chatSlot', displayName: 'Livestream Chat Slot', expectedDataType: 'LivestreamChatContract' },
  { slotKey: 'course.card', displayName: 'Course Card', expectedDataType: 'CourseCardContract' },
  { slotKey: 'course.detail', displayName: 'Course Detail', expectedDataType: 'CourseDetailContract' },
  { slotKey: 'prayer.sessionCard', displayName: 'Prayer Session Card', expectedDataType: 'PrayerSessionCardContract' },
  { slotKey: 'prayer.room', displayName: 'Prayer Room', expectedDataType: 'PrayerRoomContract' },
  { slotKey: 'prayer.requestForm', displayName: 'Prayer Request Form', expectedDataType: 'PrayerRequestFormContract' },
  { slotKey: 'prayer.wall', displayName: 'Prayer Wall', expectedDataType: 'PrayerWallContract' },
  { slotKey: 'testimony.card', displayName: 'Testimony Card', expectedDataType: 'TestimonyCardContract' },
  { slotKey: 'testimony.wall', displayName: 'Testimony Wall', expectedDataType: 'TestimonyWallContract' },
  { slotKey: 'campaign.card', displayName: 'Campaign Card', expectedDataType: 'CampaignCardContract' },
  { slotKey: 'campaign.progress', displayName: 'Campaign Progress', expectedDataType: 'CampaignProgressContract' },
  { slotKey: 'store.productCard', displayName: 'Product Card', expectedDataType: 'ProductCardContract' },
  { slotKey: 'store.productDetail', displayName: 'Product Detail', expectedDataType: 'ProductDetailContract' },
  { slotKey: 'group.card', displayName: 'Group Card', expectedDataType: 'GroupCardContract' },
  { slotKey: 'group.detail', displayName: 'Group Detail', expectedDataType: 'GroupDetailContract' },
  { slotKey: 'salvation.responseForm', displayName: 'Salvation Response Form', expectedDataType: 'SalvationResponseFormContract' },
  { slotKey: 'visitor.newHereForm', displayName: 'Visitor Form', expectedDataType: 'NewVisitorFormContract' },
  { slotKey: 'resource.card', displayName: 'Resource Card', expectedDataType: 'ResourceCardContract' },
  { slotKey: 'blog.articleCard', displayName: 'Blog Article Card', expectedDataType: 'BlogCardContract' },
  { slotKey: 'service.card', displayName: 'Service Card', expectedDataType: 'ServiceCardContract' },
  { slotKey: 'member.profile', displayName: 'Member Profile', expectedDataType: 'MemberProfileContract' },
  { slotKey: 'member.dashboard', displayName: 'Member Dashboard', expectedDataType: 'MemberDashboardContract' },
  { slotKey: 'state.loading', displayName: 'Loading State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.empty', displayName: 'Empty State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.error', displayName: 'Error State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.locked', displayName: 'Locked State', expectedDataType: 'UIStateContract' },
  { slotKey: 'state.setupRequired', displayName: 'Setup Required State', expectedDataType: 'UIStateContract' }
];

defaultSlots.forEach(registerThemeSlot);
