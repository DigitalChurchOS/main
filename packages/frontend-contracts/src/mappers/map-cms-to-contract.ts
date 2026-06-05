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
