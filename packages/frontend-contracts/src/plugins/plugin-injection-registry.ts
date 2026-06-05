import { PluginInjectionPoint, allowedInjectionPoints } from './plugin-injection-point.types';
import { PluginSurfaceType } from './plugin-surface.types';
import { PluginManifest } from './plugin-manifest.types';

export class PluginInjectionRegistry {
  private injectionPoints = new Map<string, PluginSurfaceType[]>();

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings() {
    // Page
    const pageSurfaces: PluginSurfaceType[] = ['public', 'page_builder'];
    this.injectionPoints.set('page.before', pageSurfaces);
    this.injectionPoints.set('page.after', pageSurfaces);
    this.injectionPoints.set('page.section.before', pageSurfaces);
    this.injectionPoints.set('page.section.after', pageSurfaces);
    this.injectionPoints.set('page.hero.before', pageSurfaces);
    this.injectionPoints.set('page.hero.after', pageSurfaces);
    this.injectionPoints.set('page.content.before', pageSurfaces);
    this.injectionPoints.set('page.content.after', pageSurfaces);
    this.injectionPoints.set('page.cta.before', pageSurfaces);
    this.injectionPoints.set('page.cta.after', pageSurfaces);
    this.injectionPoints.set('page.footer.before', pageSurfaces);

    // Navigation
    const navSurfaces: PluginSurfaceType[] = ['public', 'navigation_builder'];
    this.injectionPoints.set('navigation.header.before', navSurfaces);
    this.injectionPoints.set('navigation.header.after', navSurfaces);
    this.injectionPoints.set('navigation.header.extra', navSurfaces);
    this.injectionPoints.set('navigation.footer.before', navSurfaces);
    this.injectionPoints.set('navigation.footer.after', navSurfaces);
    this.injectionPoints.set('navigation.footer.extra', navSurfaces);
    this.injectionPoints.set('navigation.mobile.before', navSurfaces);
    this.injectionPoints.set('navigation.mobile.after', navSurfaces);
    this.injectionPoints.set('navigation.mobile.extra', navSurfaces);
    this.injectionPoints.set('navigation.memberMenu.extra', navSurfaces);

    // Modules
    const moduleSurfaces: PluginSurfaceType[] = ['public', 'module_extension'];
    this.injectionPoints.set('event.list.before', moduleSurfaces);
    this.injectionPoints.set('event.list.after', moduleSurfaces);
    this.injectionPoints.set('event.card.badge', moduleSurfaces);
    this.injectionPoints.set('event.detail.before', moduleSurfaces);
    this.injectionPoints.set('event.detail.after', moduleSurfaces);
    this.injectionPoints.set('event.detail.afterRegistration', moduleSurfaces);
    this.injectionPoints.set('giving.form.before', moduleSurfaces);
    this.injectionPoints.set('giving.form.afterAmount', moduleSurfaces);
    this.injectionPoints.set('giving.form.after', moduleSurfaces);
    this.injectionPoints.set('sermon.player.before', moduleSurfaces);
    this.injectionPoints.set('sermon.player.after', moduleSurfaces);
    this.injectionPoints.set('sermon.player.below', moduleSurfaces);
    this.injectionPoints.set('media.detail.after', moduleSurfaces);
    this.injectionPoints.set('livestream.sidebar', moduleSurfaces);
    this.injectionPoints.set('livestream.player.overlay', moduleSurfaces);
    this.injectionPoints.set('livestream.afterPlayer', moduleSurfaces);
    this.injectionPoints.set('prayer.requestForm.before', moduleSurfaces);
    this.injectionPoints.set('prayer.requestForm.after', moduleSurfaces);
    this.injectionPoints.set('prayer.room.sidebar', moduleSurfaces);
    this.injectionPoints.set('prayer.wall.before', moduleSurfaces);
    this.injectionPoints.set('prayer.wall.after', moduleSurfaces);
    this.injectionPoints.set('testimony.wall.before', moduleSurfaces);
    this.injectionPoints.set('testimony.wall.after', moduleSurfaces);
    this.injectionPoints.set('course.lesson.before', moduleSurfaces);
    this.injectionPoints.set('course.lesson.afterContent', moduleSurfaces);
    this.injectionPoints.set('course.detail.sidebar', moduleSurfaces);
    this.injectionPoints.set('group.detail.sidebar', moduleSurfaces);
    this.injectionPoints.set('product.detail.afterPurchase', moduleSurfaces);
    this.injectionPoints.set('campaign.progress.after', moduleSurfaces);

    // Forms
    const formSurfaces: PluginSurfaceType[] = ['public', 'module_extension']; // forms sits on module extension or pages
    this.injectionPoints.set('form.before', formSurfaces);
    this.injectionPoints.set('form.after', formSurfaces);
    this.injectionPoints.set('form.beforeSubmit', formSurfaces);
    this.injectionPoints.set('form.afterSubmit', formSurfaces);
    this.injectionPoints.set('form.hiddenFields', formSurfaces);
    this.injectionPoints.set('form.successActions', formSurfaces);
    this.injectionPoints.set('form.validationHooks', formSurfaces);

    // Member Portal
    const memberSurfaces: PluginSurfaceType[] = ['member'];
    this.injectionPoints.set('member.dashboard.before', memberSurfaces);
    this.injectionPoints.set('member.dashboard.after', memberSurfaces);
    this.injectionPoints.set('member.dashboard.card', memberSurfaces);
    this.injectionPoints.set('member.profile.tab', memberSurfaces);
    this.injectionPoints.set('member.profile.sidebar', memberSurfaces);
    this.injectionPoints.set('member.notifications.item', memberSurfaces);
    this.injectionPoints.set('member.prayer.sidebar', memberSurfaces);
    this.injectionPoints.set('member.giving.panel', memberSurfaces);
    this.injectionPoints.set('member.course.sidebar', memberSurfaces);
    this.injectionPoints.set('member.events.panel', memberSurfaces);

    // Dashboard / Admin Panel
    const dashSurfaces: PluginSurfaceType[] = ['dashboard', 'admin'];
    this.injectionPoints.set('dashboard.home.card', dashSurfaces);
    this.injectionPoints.set('dashboard.module.settings', dashSurfaces);
    this.injectionPoints.set('dashboard.module.sidebar', dashSurfaces);
    this.injectionPoints.set('dashboard.tenant.settings', dashSurfaces);
    this.injectionPoints.set('dashboard.analytics.panel', dashSurfaces);
    this.injectionPoints.set('dashboard.integrations.panel', dashSurfaces);
    this.injectionPoints.set('dashboard.pageBuilder.sidebar', dashSurfaces);
    this.injectionPoints.set('dashboard.navigationBuilder.sidebar', dashSurfaces);
  }

  public registerInjectionPoint(point: string, allowedSurfaces: PluginSurfaceType[]): void {
    if (!allowedInjectionPoints.includes(point as any)) {
      throw new Error(`Cannot register unauthorized injection point key: "${point}"`);
    }
    this.injectionPoints.set(point, allowedSurfaces);
  }

  public getInjectionPoint(point: string): { point: string; allowedSurfaces: PluginSurfaceType[] } | null {
    const surfaces = this.injectionPoints.get(point);
    return surfaces ? { point, allowedSurfaces: surfaces } : null;
  }

  public listInjectionPoints(): string[] {
    return Array.from(this.injectionPoints.keys());
  }

  public listInjectionPointsBySurface(surface: PluginSurfaceType): string[] {
    const results: string[] = [];
    for (const [point, surfaces] of this.injectionPoints.entries()) {
      if (surfaces.includes(surface)) {
        results.push(point);
      }
    }
    return results;
  }

  public listPluginsForInjectionPoint(point: string, enabledPlugins: PluginManifest[]): PluginManifest[] {
    return enabledPlugins.filter(plugin =>
      plugin.injectionPoints && plugin.injectionPoints.includes(point)
    );
  }

  public validateInjectionPointUsage(pluginKey: string, point: string): string[] {
    const errors: string[] = [];
    const registered = this.getInjectionPoint(point);

    if (!registered) {
      errors.push(`Injection point "${point}" is not registered on this platform.`);
    }

    return errors;
  }
}

export const pluginInjectionRegistry = new PluginInjectionRegistry();
export default pluginInjectionRegistry;
