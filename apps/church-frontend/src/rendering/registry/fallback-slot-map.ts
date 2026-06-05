import { ThemeSlotKey } from '@churchos/frontend-contracts';

export const fallbackSlotMap: Partial<Record<ThemeSlotKey, ThemeSlotKey>> = {
  // Specific card components fall back to generic cards
  'event.card': 'resource.card',
  'sermon.card': 'media.card',
  'store.productCard': 'resource.card',
  'giving.categoryCard': 'resource.card',
  'group.card': 'resource.card',
  'campaign.card': 'resource.card',
  'blog.articleCard': 'resource.card',
  
  // Specific detail components fall back to content layouts
  'course.detail': 'page.about',
  'group.detail': 'page.about',
  'event.detail': 'page.about',
  'store.productDetail': 'page.about',
  
  // Custom states fallback
  'state.setupRequired': 'state.locked'
};

export function getFallbackSlotKey(slotKey: ThemeSlotKey): ThemeSlotKey | null {
  return fallbackSlotMap[slotKey] || null;
}
