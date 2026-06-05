import React from 'react';
import { ThemeSlotKey } from '@churchos/frontend-contracts';
import * as Defaults from '../default-renderers';

export const defaultRendererRegistry: Record<ThemeSlotKey, React.ComponentType<any>> = {
  // Layout
  'layout.announcementBar': Defaults.DefaultAnnouncementBar,
  'layout.header': Defaults.DefaultHeader,
  'layout.footer': Defaults.DefaultFooter,
  'layout.mobileNav': Defaults.DefaultMobileNav,
  
  // Pages
  'page.home': Defaults.DefaultHomePage,
  'page.about': Defaults.DefaultContentPage,
  'page.contact': Defaults.DefaultContentPage,
  
  // Events
  'event.card': Defaults.DefaultEventCard,
  'event.detail': Defaults.DefaultEventDetail,
  'event.registrationForm': Defaults.DefaultEventRegistrationForm,
  
  // Giving
  'giving.form': Defaults.DefaultGivingForm,
  'giving.categoryCard': Defaults.DefaultGivingCategoryCard,
  
  // Sermons
  'sermon.card': Defaults.DefaultSermonCard,
  'sermon.player': Defaults.DefaultSermonPlayer,
  
  // Media & Video
  'media.card': Defaults.DefaultMediaCard,
  'media.player': Defaults.DefaultMediaPlayer,
  'livestream.player': Defaults.DefaultLivestreamPlayer,
  'livestream.countdown': Defaults.DefaultLivestreamCountdown,
  'livestream.chatSlot': Defaults.DefaultLivestreamChat,
  
  // Courses / LMS
  'course.card': Defaults.DefaultCourseCard,
  'course.detail': Defaults.DefaultCourseDetail,
  
  // Prayer & Testimony
  'prayer.sessionCard': Defaults.DefaultPrayerSessionCard,
  'prayer.room': Defaults.DefaultPrayerRoom,
  'prayer.requestForm': Defaults.DefaultPrayerRequestForm,
  'prayer.wall': Defaults.DefaultPrayerWall,
  'testimony.card': Defaults.DefaultTestimonyCard,
  'testimony.wall': Defaults.DefaultTestimonyWall,
  
  // Campaigns
  'campaign.card': Defaults.DefaultCampaignCard,
  'campaign.progress': Defaults.DefaultCampaignProgress,
  
  // Store
  'store.productCard': Defaults.DefaultProductCard,
  'store.productDetail': Defaults.DefaultProductDetail,
  
  // Small Groups
  'group.card': Defaults.DefaultGroupCard,
  'group.detail': Defaults.DefaultGroupDetail,
  
  // Connection / Forms
  'salvation.responseForm': Defaults.DefaultSalvationResponseForm,
  'visitor.newHereForm': Defaults.DefaultNewVisitorForm,
  
  // Resources, Blog, and Services
  'resource.card': Defaults.DefaultResourceCard,
  'blog.articleCard': Defaults.DefaultBlogArticleCard,
  'service.card': Defaults.DefaultServiceCard,
  
  // Member Dashboard
  'member.profile': Defaults.DefaultMemberProfile,
  'member.dashboard': Defaults.DefaultMemberDashboard,
  
  // Global / Fallback states
  'state.loading': Defaults.DefaultLoadingState,
  'state.empty': Defaults.DefaultEmptyState,
  'state.error': Defaults.DefaultErrorState,
  'state.locked': Defaults.DefaultLockedState,
  'state.setupRequired': Defaults.DefaultSetupRequiredState
};
