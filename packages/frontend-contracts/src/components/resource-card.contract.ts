import { CTAContract } from '../core/cta.types';

export interface ResourceCardContract {
  id: string;
  title: string;
  description?: string | null;
  downloadUrl: string;
  fileType: string;
  thumbnailUrl?: string | null;
  cta: CTAContract;
}
