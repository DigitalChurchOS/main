import { MediaAssetContract } from '../core/media.types';
import { SEOContract } from '../core/seo.types';

export interface SermonPlayerContract {
  id: string;
  title: string;
  speaker: string;
  seriesName?: string | null;
  date: string;
  description?: string | null;
  media: MediaAssetContract;
  notesHtml?: string | null;
  seo: SEOContract;
}
