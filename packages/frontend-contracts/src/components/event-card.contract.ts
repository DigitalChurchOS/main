import { VisibilityState } from '../core/visibility.types';
import { CTAContract } from '../core/cta.types';

export interface EventCardContract {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  cta: CTAContract;
  visibility: VisibilityState;
}
