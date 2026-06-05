export interface SEOContract {
  title: string;
  description?: string | null;
  keywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  ogType?: 'website' | 'article' | 'video' | 'profile';
  canonicalUrl?: string | null;
  structuredData?: string | null; // JSON-LD payload
}
