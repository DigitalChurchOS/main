import { CTAContract } from '../core/cta.types';

export interface CampaignCardContract {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  targetAmount: number;
  currentAmount: number;
  cta: CTAContract;
}
