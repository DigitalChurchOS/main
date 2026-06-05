import { CTAContract } from '../core/cta.types';

export interface LessonPreviewContract {
  id: string;
  courseId: string;
  title: string;
  order: number;
  durationMinutes?: number | null;
  isFreePreview: boolean;
  cta: CTAContract;
}
