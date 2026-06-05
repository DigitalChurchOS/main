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
