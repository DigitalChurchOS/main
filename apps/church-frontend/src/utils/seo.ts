interface SEOProps {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
}

export function updatePageSEO(seo: SEOProps): void {
  if (seo.title) {
    document.title = seo.title;
  }

  const setMetaTag = (name: string, content: string | null | undefined) => {
    if (!content) return;
    let tag = document.head.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  setMetaTag('description', seo.description);
  setMetaTag('keywords', seo.keywords);
}

export function resetPageSEO(): void {
  document.title = 'ChurchOS';
  const desc = document.head.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', 'Digital Church OS');
}
