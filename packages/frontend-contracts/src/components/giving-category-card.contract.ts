import { CTAContract } from '../core/cta.types';

export interface GivingCategoryCardContract {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  cta: CTAContract;
}
