const componentsSet = new Set<string>();

export function registerComponentContract(name: string): void {
  componentsSet.add(name);
}

export function isComponentContractRegistered(name: string): boolean {
  return componentsSet.has(name);
}

export function listComponentContracts(): string[] {
  return Array.from(componentsSet.values());
}

// Register default contracts
const defaults = [
  'EventCardContract', 'EventDetailContract', 'EventRegistrationFormContract',
  'GivingFormContract', 'GivingCategoryCardContract',
  'SermonCardContract', 'SermonPlayerContract',
  'MediaCardContract', 'MediaPlayerContract', 'LivestreamPlayerContract',
  'LivestreamCountdownContract', 'LivestreamChatContract', 'LivestreamChatSlotContract',
  'CourseCardContract', 'CourseDetailContract', 'LessonPreviewContract',
  'PrayerSessionCardContract', 'PrayerRoomContract', 'PrayerRequestFormContract', 'PrayerWallContract',
  'TestimonyCardContract', 'TestimonyWallContract',
  'CampaignCardContract', 'CampaignProgressContract',
  'ProductCardContract', 'ProductDetailContract',
  'GroupCardContract', 'GroupDetailContract',
  'SalvationResponseFormContract', 'NewVisitorFormContract',
  'ResourceCardContract', 'BlogCardContract', 'ServiceCardContract',
  'MemberProfileContract', 'MemberDashboardContract',
  'NavigationMenuContract', 'CMSPageContract', 'PageSectionContract'
];
defaults.forEach(registerComponentContract);
