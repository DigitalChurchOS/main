export type PluginInjectionPoint =
  // Global page injection points
  | 'page.before'
  | 'page.after'
  | 'page.section.before'
  | 'page.section.after'
  | 'page.hero.before'
  | 'page.hero.after'
  | 'page.content.before'
  | 'page.content.after'
  | 'page.cta.before'
  | 'page.cta.after'
  | 'page.footer.before'

  // Navigation injection points
  | 'navigation.header.before'
  | 'navigation.header.after'
  | 'navigation.header.extra'
  | 'navigation.footer.before'
  | 'navigation.footer.after'
  | 'navigation.footer.extra'
  | 'navigation.mobile.before'
  | 'navigation.mobile.after'
  | 'navigation.mobile.extra'
  | 'navigation.memberMenu.extra'

  // Module injection points
  | 'event.list.before'
  | 'event.list.after'
  | 'event.card.badge'
  | 'event.detail.before'
  | 'event.detail.after'
  | 'event.detail.afterRegistration'
  | 'giving.form.before'
  | 'giving.form.afterAmount'
  | 'giving.form.after'
  | 'sermon.player.before'
  | 'sermon.player.after'
  | 'sermon.player.below'
  | 'media.detail.after'
  | 'livestream.sidebar'
  | 'livestream.player.overlay'
  | 'livestream.afterPlayer'
  | 'prayer.requestForm.before'
  | 'prayer.requestForm.after'
  | 'prayer.room.sidebar'
  | 'prayer.wall.before'
  | 'prayer.wall.after'
  | 'testimony.wall.before'
  | 'testimony.wall.after'
  | 'course.lesson.before'
  | 'course.lesson.afterContent'
  | 'course.detail.sidebar'
  | 'group.detail.sidebar'
  | 'product.detail.afterPurchase'
  | 'campaign.progress.after'

  // Form injection points
  | 'form.before'
  | 'form.after'
  | 'form.beforeSubmit'
  | 'form.afterSubmit'
  | 'form.hiddenFields'
  | 'form.successActions'
  | 'form.validationHooks'

  // Member portal injection points
  | 'member.dashboard.before'
  | 'member.dashboard.after'
  | 'member.dashboard.card'
  | 'member.profile.tab'
  | 'member.profile.sidebar'
  | 'member.notifications.item'
  | 'member.prayer.sidebar'
  | 'member.giving.panel'
  | 'member.course.sidebar'
  | 'member.events.panel'

  // Dashboard injection points
  | 'dashboard.home.card'
  | 'dashboard.module.settings'
  | 'dashboard.module.sidebar'
  | 'dashboard.tenant.settings'
  | 'dashboard.analytics.panel'
  | 'dashboard.integrations.panel'
  | 'dashboard.pageBuilder.sidebar'
  | 'dashboard.navigationBuilder.sidebar';

export const allowedInjectionPoints: PluginInjectionPoint[] = [
  'page.before',
  'page.after',
  'page.section.before',
  'page.section.after',
  'page.hero.before',
  'page.hero.after',
  'page.content.before',
  'page.content.after',
  'page.cta.before',
  'page.cta.after',
  'page.footer.before',
  'navigation.header.before',
  'navigation.header.after',
  'navigation.header.extra',
  'navigation.footer.before',
  'navigation.footer.after',
  'navigation.footer.extra',
  'navigation.mobile.before',
  'navigation.mobile.after',
  'navigation.mobile.extra',
  'navigation.memberMenu.extra',
  'event.list.before',
  'event.list.after',
  'event.card.badge',
  'event.detail.before',
  'event.detail.after',
  'event.detail.afterRegistration',
  'giving.form.before',
  'giving.form.afterAmount',
  'giving.form.after',
  'sermon.player.before',
  'sermon.player.after',
  'sermon.player.below',
  'media.detail.after',
  'livestream.sidebar',
  'livestream.player.overlay',
  'livestream.afterPlayer',
  'prayer.requestForm.before',
  'prayer.requestForm.after',
  'prayer.room.sidebar',
  'prayer.wall.before',
  'prayer.wall.after',
  'testimony.wall.before',
  'testimony.wall.after',
  'course.lesson.before',
  'course.lesson.afterContent',
  'course.detail.sidebar',
  'group.detail.sidebar',
  'product.detail.afterPurchase',
  'campaign.progress.after',
  'form.before',
  'form.after',
  'form.beforeSubmit',
  'form.afterSubmit',
  'form.hiddenFields',
  'form.successActions',
  'form.validationHooks',
  'member.dashboard.before',
  'member.dashboard.after',
  'member.dashboard.card',
  'member.profile.tab',
  'member.profile.sidebar',
  'member.notifications.item',
  'member.prayer.sidebar',
  'member.giving.panel',
  'member.course.sidebar',
  'member.events.panel',
  'dashboard.home.card',
  'dashboard.module.settings',
  'dashboard.module.sidebar',
  'dashboard.tenant.settings',
  'dashboard.analytics.panel',
  'dashboard.integrations.panel',
  'dashboard.pageBuilder.sidebar',
  'dashboard.navigationBuilder.sidebar'
];
