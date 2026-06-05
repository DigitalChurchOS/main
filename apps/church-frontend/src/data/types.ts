import { TenantContextContract } from '@churchos/frontend-contracts';

export interface ModuleRoute {
  moduleKey: string;
  path: string;
  type: 'listing' | 'detail' | 'embedded' | 'screen';
  displayName: string;
}

export interface SiteContextResponse {
  data: {
    tenant: TenantContextContract;
    moduleEntitlements: string[];
    navigation: {
      id: string;
      name: string;
      items: any[];
    } | null;
    footer: {
      id: string;
      copyrightText: string | null;
      socialLinks: any[];
      secondaryLinks: any[];
    } | null;
    theme: {
      name: string;
      settings: any;
    };
    moduleRoutes: ModuleRoute[];
    enabledPlugins?: string[];
    pluginSettings?: Record<string, any>;
  };
}

export interface CMSPageResponse {
  data: {
    pageId: string;
    title: string;
    slug: string;
    isHome: boolean;
    contentBlocks: any[];
    seoTitle?: string | null;
    seoDescription?: string | null;
    seoKeywords?: string | null;
    navigation: {
      id: string;
      name: string;
      items: any[];
    } | null;
    footer: {
      id: string;
      copyrightText: string | null;
      socialLinks: any[];
      secondaryLinks: any[];
    } | null;
    theme: {
      name: string;
      settings: any;
    };
    isPreviewMode?: boolean;
    enabledPlugins?: string[];
    pluginSettings?: Record<string, any>;
  };
}
