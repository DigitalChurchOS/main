import React from 'react';
import { ThemeAdapter } from '@churchos/frontend-contracts';

// Layout Slots
import { ChristoAnnouncementBar } from './layout/ChristoAnnouncementBar';
import { ChristoHeader } from './layout/ChristoHeader';
import { ChristoFooter } from './layout/ChristoFooter';
import { ChristoMobileNav } from './layout/ChristoMobileNav';

// Pages Slots
import { ChristoHomePage } from './pages/ChristoHomePage';
import { ChristoContentPage } from './pages/ChristoContentPage';
import { ChristoSearchPage } from './pages/ChristoSearchPage';
import { ChristoMemberPage } from './pages/ChristoMemberPage';

// Module Slots
import { ChristoEventCard } from './modules/ChristoEventCard';
import { ChristoEventDetail } from './modules/ChristoEventDetail';
import { ChristoEventRegistrationForm } from './modules/ChristoEventRegistrationForm';
import { ChristoGivingForm } from './modules/ChristoGivingForm';
import { ChristoGivingCategoryCard } from './modules/ChristoGivingCategoryCard';
import { ChristoSermonCard } from './modules/ChristoSermonCard';
import { ChristoSermonPlayer } from './modules/ChristoSermonPlayer';
import { ChristoMediaCard } from './modules/ChristoMediaCard';
import { ChristoMediaPlayer } from './modules/ChristoMediaPlayer';
import { ChristoLivestreamPlayer } from './modules/ChristoLivestreamPlayer';
import { ChristoLivestreamCountdown } from './modules/ChristoLivestreamCountdown';
import { ChristoLivestreamChat } from './modules/ChristoLivestreamChat';
import { ChristoCourseCard } from './modules/ChristoCourseCard';
import { ChristoCourseDetail } from './modules/ChristoCourseDetail';
import { ChristoPrayerSessionCard } from './modules/ChristoPrayerSessionCard';
import { ChristoPrayerRoom } from './modules/ChristoPrayerRoom';
import { ChristoPrayerRequestForm } from './modules/ChristoPrayerRequestForm';
import { ChristoPrayerWall } from './modules/ChristoPrayerWall';
import { ChristoTestimonyCard } from './modules/ChristoTestimonyCard';
import { ChristoTestimonyWall } from './modules/ChristoTestimonyWall';
import { ChristoCampaignCard } from './modules/ChristoCampaignCard';
import { ChristoCampaignProgress } from './modules/ChristoCampaignProgress';
import { ChristoProductCard } from './modules/ChristoProductCard';
import { ChristoProductDetail } from './modules/ChristoProductDetail';
import { ChristoGroupCard } from './modules/ChristoGroupCard';
import { ChristoGroupDetail } from './modules/ChristoGroupDetail';
import { ChristoSalvationResponseForm } from './modules/ChristoSalvationResponseForm';
import { ChristoNewVisitorForm } from './modules/ChristoNewVisitorForm';
import { ChristoResourceCard } from './modules/ChristoResourceCard';
import { ChristoBlogArticleCard } from './modules/ChristoBlogArticleCard';
import { ChristoServiceCard } from './modules/ChristoServiceCard';
import { ChristoMemberProfile } from './modules/ChristoMemberProfile';
import { ChristoMemberDashboard } from './modules/ChristoMemberDashboard';

// State Overrides
import {
  ChristoLoadingState,
  ChristoEmptyState,
  ChristoErrorState,
  ChristoLockedState,
  ChristoSetupRequiredState
} from './components/ChristoStateBlocks';

// Plugins
import { ChristoPluginCard } from './plugins/ChristoPluginCard';
import { ChristoPluginPanel } from './plugins/ChristoPluginPanel';
import { ChristoPluginWidget } from './plugins/ChristoPluginWidget';
import { ChristoPluginInlineAction } from './plugins/ChristoPluginInlineAction';

const slotsBase: Record<string, React.ComponentType<any>> = {
  'layout.announcementBar': ChristoAnnouncementBar,
  'layout.header': ChristoHeader,
  'layout.footer': ChristoFooter,
  'layout.mobileNav': ChristoMobileNav,

  'page.home': ChristoHomePage,
  'page.about': ChristoContentPage,
  'page.contact': ChristoContentPage,
  'page.search': ChristoSearchPage,
  'page.member': ChristoMemberPage,

  'event.card': ChristoEventCard,
  'event.detail': ChristoEventDetail,
  'event.registrationForm': ChristoEventRegistrationForm,

  'giving.form': ChristoGivingForm,
  'giving.categoryCard': ChristoGivingCategoryCard,

  'sermon.card': ChristoSermonCard,
  'sermon.player': ChristoSermonPlayer,

  'media.card': ChristoMediaCard,
  'media.player': ChristoMediaPlayer,

  'livestream.player': ChristoLivestreamPlayer,
  'livestream.countdown': ChristoLivestreamCountdown,
  'livestream.chatSlot': ChristoLivestreamChat,

  'course.card': ChristoCourseCard,
  'course.detail': ChristoCourseDetail,

  'prayer.sessionCard': ChristoPrayerSessionCard,
  'prayer.room': ChristoPrayerRoom,
  'prayer.requestForm': ChristoPrayerRequestForm,
  'prayer.wall': ChristoPrayerWall,

  'testimony.card': ChristoTestimonyCard,
  'testimony.wall': ChristoTestimonyWall,

  'campaign.card': ChristoCampaignCard,
  'campaign.progress': ChristoCampaignProgress,

  'store.productCard': ChristoProductCard,
  'store.productDetail': ChristoProductDetail,

  'group.card': ChristoGroupCard,
  'group.detail': ChristoGroupDetail,

  'salvation.responseForm': ChristoSalvationResponseForm,
  'visitor.newHereForm': ChristoNewVisitorForm,

  'resource.card': ChristoResourceCard,
  'blog.articleCard': ChristoBlogArticleCard,
  'service.card': ChristoServiceCard,

  'member.profile': ChristoMemberProfile,
  'member.dashboard': ChristoMemberDashboard,

  'state.loading': ChristoLoadingState,
  'state.empty': ChristoEmptyState,
  'state.error': ChristoErrorState,
  'state.locked': ChristoLockedState,
  'state.setupRequired': ChristoSetupRequiredState
};

const supportedKeys = new Set(Object.keys(slotsBase));

export const christoTheme: ThemeAdapter = {
  themeKey: 'christo',
  displayName: 'Christo Premium Theme',
  version: '1.0.0',
  slots: new Proxy(slotsBase, {
    get(target, prop) {
      if (typeof prop === 'string') {
        if (prop in target) {
          return target[prop];
        }
        if (prop.endsWith('.card')) {
          return ChristoPluginCard;
        }
        if (prop.endsWith('.panel')) {
          return ChristoPluginPanel;
        }
        if (prop.endsWith('.widget')) {
          return ChristoPluginWidget;
        }
        if (prop.endsWith('.inline') || prop.endsWith('.action')) {
          return ChristoPluginInlineAction;
        }
      }
      return target[prop as any];
    }
  }) as any,
  supportsSlot: (slot: any) => {
    const slotStr = String(slot);
    if (supportedKeys.has(slotStr)) return true;
    if (
      slotStr.endsWith('.card') ||
      slotStr.endsWith('.panel') ||
      slotStr.endsWith('.widget') ||
      slotStr.endsWith('.inline') ||
      slotStr.endsWith('.action')
    ) {
      return true;
    }
    return false;
  }
};
