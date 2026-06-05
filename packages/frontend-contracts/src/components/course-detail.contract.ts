import { CTAContract } from '../core/cta.types';
import { SEOContract } from '../core/seo.types';
import { LessonPreviewContract } from './lesson-preview.contract';

export interface CourseDetailContract {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  lessons: LessonPreviewContract[];
  cta: CTAContract;
  seo: SEOContract;
}
