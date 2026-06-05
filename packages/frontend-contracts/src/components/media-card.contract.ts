import { MediaType } from '../core/media.types';
import { CTAContract } from '../core/cta.types';

export interface MediaCardContract {
  id: string;
  title: string;
  type: MediaType;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  date: string;
  cta: CTAContract;
}
