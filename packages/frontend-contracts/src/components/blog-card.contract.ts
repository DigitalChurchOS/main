import { CTAContract } from '../core/cta.types';

export interface BlogCardContract {
  id: string;
  title: string;
  excerpt?: string | null;
  author: string;
  publishedDate: string;
  imageUrl?: string | null;
  readTimeMinutes?: number | null;
  cta: CTAContract;
}
