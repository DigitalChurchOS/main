import { CTAContract } from '../core/cta.types';

export interface GroupCardContract {
  id: string;
  name: string;
  description?: string | null;
  type: string; // e.g. cell, fellowship, interestGroup
  leaderName: string;
  schedule?: string | null;
  cta: CTAContract;
}
