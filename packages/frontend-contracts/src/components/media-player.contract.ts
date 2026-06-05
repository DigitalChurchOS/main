import { MediaAssetContract } from '../core/media.types';
import { SEOContract } from '../core/seo.types';

export interface MediaPlayerContract {
  id: string;
  title: string;
  description?: string | null;
  media: MediaAssetContract;
  seo: SEOContract;
}
