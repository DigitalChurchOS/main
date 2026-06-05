export type ThemeSlotKey =
  // Layout
  | 'layout.announcementBar'
  | 'layout.header'
  | 'layout.footer'
  | 'layout.mobileNav'
  // Pages
  | 'page.home'
  | 'page.about'
  | 'page.contact'
  // Events
  | 'event.card'
  | 'event.detail'
  | 'event.registrationForm'
  // Giving
  | 'giving.form'
  | 'giving.categoryCard'
  // Sermons
  | 'sermon.card'
  | 'sermon.player'
  // Media & Video
  | 'media.card'
  | 'media.player'
  | 'livestream.player'
  | 'livestream.countdown'
  | 'livestream.chatSlot'
  // Courses / LMS
  | 'course.card'
  | 'course.detail'
  // Prayer & Testimony
  | 'prayer.sessionCard'
  | 'prayer.room'
  | 'prayer.requestForm'
  | 'prayer.wall'
  | 'testimony.card'
  | 'testimony.wall'
  // Campaigns
  | 'campaign.card'
  | 'campaign.progress'
  // Store
  | 'store.productCard'
  | 'store.productDetail'
  // Small Groups
  | 'group.card'
  | 'group.detail'
  // Connection / Forms
  | 'salvation.responseForm'
  | 'visitor.newHereForm'
  // Resources, Blog, and Services
  | 'resource.card'
  | 'blog.articleCard'
  | 'service.card'
  // Member Dashboard
  | 'member.profile'
  | 'member.dashboard'
  // Global / Fallback states
  | 'state.loading'
  | 'state.empty'
  | 'state.error'
  | 'state.locked'
  | 'state.setupRequired';

export interface ThemeSlotContract {
  slotKey: ThemeSlotKey;
  displayName: string;
  description?: string;
  expectedDataType: string; // The data interface name required by this slot
}
