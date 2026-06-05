import { CTAContract } from '../core/cta.types';

export interface SermonCardContract {
  id: string;
  title: string;
  speaker: string;
  seriesName?: string | null;
  date: string;
  thumbnailUrl?: string | null;
  cta: CTAContract;
}
