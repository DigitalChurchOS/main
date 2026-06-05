import { CourseCardContract } from '../components/course-card.contract';
import { CourseDetailContract } from '../components/course-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapCourseToCourseCardContract(course: any, tenantId: string): CourseCardContract {
  if (course.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on course card mapping');
  }

  return {
    id: course.id,
    title: course.title || 'New Course',
    description: course.description || null,
    thumbnailUrl: course.thumbnailUrl || null,
    lessonsCount: course.lessonsCount || (course.lessons?.length || 0),
    durationMinutes: course.durationMinutes || null,
    cta: getStandardCTA('enroll', { url: `/academy/${course.id}` })
  };
}

export function mapCourseToCourseDetailContract(course: any, tenantId: string): CourseDetailContract {
  if (course.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on course detail mapping');
  }

  return {
    id: course.id,
    title: course.title || 'New Course',
    description: course.description || null,
    thumbnailUrl: course.thumbnailUrl || null,
    lessons: (course.lessons || []).map((les: any) => ({
      id: les.id,
      courseId: course.id,
      title: les.title || 'Untitled Lesson',
      order: les.order ?? les.stepOrder ?? 1,
      durationMinutes: les.durationMinutes || null,
      isFreePreview: !!les.isFreePreview,
      cta: getStandardCTA('view', { url: `/academy/${course.id}/lessons/${les.id}` })
    })),
    cta: getStandardCTA('enroll', { url: `/academy/${course.id}/enroll` }),
    seo: {
      title: course.title,
      description: course.description || null
    }
  };
}
