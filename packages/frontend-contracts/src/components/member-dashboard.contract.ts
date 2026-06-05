import { MemberProfileContract } from './member-profile.contract';
import { CTAContract } from '../core/cta.types';
import { EventCardContract } from './event-card.contract';
import { CourseCardContract } from './course-card.contract';

export interface MemberDashboardContract {
  profile: MemberProfileContract;
  quickLinks: CTAContract[];
  recentActivities: { id: string; type: string; title: string; occurredAt: string }[];
  registeredEvents: EventCardContract[];
  enrolledCourses: CourseCardContract[];
}
