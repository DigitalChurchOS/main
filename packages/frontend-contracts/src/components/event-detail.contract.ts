import { VisibilityState } from '../core/visibility.types';
import { CTAContract } from '../core/cta.types';
import { SEOContract } from '../core/seo.types';

export interface EventDetailContract {
  id: string;
  title: string;
  description?: string | null;
  contentHtml?: string | null;
  imageUrl?: string | null;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  organizer?: string | null;
  capacity?: number | null;
  registeredCount?: number | null;
  registrationCta: CTAContract;
  seo: SEOContract;
  visibility: VisibilityState;
}
