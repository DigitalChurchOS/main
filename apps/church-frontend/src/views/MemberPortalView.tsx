import React from 'react';
import { useLocation } from 'react-router-dom';
import { useRendererContext, RenderSlot, DefaultMemberOnlyState, PluginInjectionRenderer } from '../rendering';

export const MemberPortalView: React.FC<{ onSimulateLogin?: () => void }> = ({ onSimulateLogin }) => {
  const context = useRendererContext();
  const location = useLocation();

  const isUserAuthenticated = !!context.memberId;
  const isProfile = location.pathname.endsWith('/profile');

  if (!isUserAuthenticated) {
    return React.createElement(DefaultMemberOnlyState, {
      message: 'Access your church member profile, registered events, and courses.',
      onLogin: onSimulateLogin
    });
  }

  // Mock dashboard data matching MemberDashboardContract
  const profileData = {
    id: context.memberId || 'member-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@gmail.com',
    phone: '555-0199',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    branchName: 'Main Campus',
    joinedDate: '2024-01-15'
  };

  const dashboardData = {
    profile: profileData,
    quickLinks: [
      { label: 'Edit Profile', action: 'link', url: '/members/profile' },
      { label: 'Giving History', action: 'link', url: '/giving' },
      { label: 'Livestream', action: 'link', url: '/live' }
    ],
    recentActivities: [
      { id: 'act-1', type: 'event_rsvp', title: 'RSVPed to Easter Celebration', occurredAt: '2026-06-03T10:00:00Z' },
      { id: 'act-2', type: 'course_start', title: 'Started Membership 101', occurredAt: '2026-06-02T14:30:00Z' }
    ],
    registeredEvents: [
      {
        id: 'easter-2026',
        title: 'Easter Sunday Celebration',
        description: 'Easter celebration service',
        startDateTime: '2026-04-05T09:00:00Z',
        endDateTime: '2026-04-05T11:00:00Z',
        location: 'Main Auditorium',
        cta: { label: 'View Details', action: 'link', url: '/events/easter-2026' },
        visibility: 'public' as const
      }
    ],
    enrolledCourses: [
      {
        id: 'membership-101',
        title: 'Church Membership 101',
        description: 'Learn about our history and values',
        lessonsCount: 4,
        cta: { label: 'Resume', action: 'link', url: '/courses/membership-101' }
      }
    ]
  };

  const slotKey = isProfile ? 'member.profile' : 'member.dashboard';
  const data = isProfile ? profileData : dashboardData;

  return React.createElement(
    'div',
    { className: 'max-w-6xl mx-auto py-6 font-sans space-y-4' },
    
    // Portal Sub-Navigation Tabs
    React.createElement(
      'div',
      { className: 'flex items-center space-x-4 border-b border-slate-200 pb-4 mb-6' },
      React.createElement(
        'a',
        {
          href: '/church/members',
          className: `text-sm font-semibold pb-2 border-b-2 transition ${
            !isProfile ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
          }`
        },
        'Dashboard'
      ),
      React.createElement(
        'a',
        {
          href: '/church/members/profile',
          className: `text-sm font-semibold pb-2 border-b-2 transition ${
            isProfile ? 'text-slate-900 border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-600'
          }`
        },
        'My Profile'
      )
    ),

    React.createElement(PluginInjectionRenderer, { point: (isProfile ? 'member.profile.tab' : 'member.dashboard.before') as any, parentData: data }),

    React.createElement(RenderSlot, {
      slotKey,
      contractData: data,
      moduleKey: 'member-portal'
    }),

    React.createElement(PluginInjectionRenderer, { point: (isProfile ? 'member.profile.sidebar' : 'member.dashboard.after') as any, parentData: data })
  );
};
