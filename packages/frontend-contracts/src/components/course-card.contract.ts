import { CTAContract } from '../core/cta.types';

export interface CourseCardContract {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  lessonsCount: number;
  durationMinutes?: number | null;
  cta: CTAContract;
}
