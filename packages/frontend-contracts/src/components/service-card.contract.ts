import { CTAContract } from '../core/cta.types';

export interface ServiceCardContract {
  id: string;
  title: string;
  timeString: string;
  branchName?: string | null;
  location?: string | null;
  livestreamCta?: CTAContract | null;
}
