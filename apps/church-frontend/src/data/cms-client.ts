import { SiteContextResponse, CMSPageResponse } from './types';

export async function fetchSiteContext(): Promise<SiteContextResponse> {
  const res = await fetch('/api/cms/site-context');
  if (!res.ok) {
    throw new Error(`Failed to fetch site context: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPage(slug: string): Promise<CMSPageResponse> {
  const res = await fetch(`/api/cms/render?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch page ${slug}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPreviewPage(slug: string, token: string): Promise<CMSPageResponse> {
  const res = await fetch(`/api/cms/render/preview?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch preview page ${slug}: ${res.statusText}`);
  }
  return res.json();
}
