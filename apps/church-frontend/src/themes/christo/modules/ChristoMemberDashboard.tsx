import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';
import { ChristoBadge } from '../components/ChristoBadge';

export interface Activity {
  id: string;
  type: string;
  title: string;
  occurredAt: string;
}

export interface RegisteredEvent {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  location: string;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  lessonsCount?: number;
}

export interface ChristoMemberDashboardProps {
  data: {
    profile: { firstName: string; lastName: string; email: string };
    quickLinks: { label: string; url: string }[];
    recentActivities?: Activity[];
    registeredEvents?: RegisteredEvent[];
    enrolledCourses?: EnrolledCourse[];
  };
}

export const ChristoMemberDashboard: React.FC<ChristoMemberDashboardProps> = ({ data }) => {
  const activities = data.recentActivities || [];
  const events = data.registeredEvents || [];
  const courses = data.enrolledCourses || [];

  return React.createElement(
    'div',
    { className: 'space-y-8 animate-fade-in' },
    
    // Welcome Greeting Card
    React.createElement(
      'div',
      { className: 'p-6 bg-gradient-to-r from-[var(--christo-accent-soft)] to-[var(--christo-surface)] border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] flex flex-wrap justify-between items-center gap-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('h3', { className: 'text-xl font-black text-[var(--christo-text)]' }, `Welcome back, ${data.profile.firstName}!`),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] font-medium' }, 'Keep up with your discipleship path and scheduled events.')
      ),
      React.createElement(
        'div',
        { className: 'flex gap-2' },
        data.quickLinks.map((link) =>
          React.createElement(
            ChristoButton,
            {
              key: link.label,
              variant: 'secondary',
              onClick: () => { window.location.href = link.url; }
            },
            link.label
          )
        )
      )
    ),

    // Grid panels
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
      
      // RSVPed Events Column
      React.createElement(
        'div',
        { className: 'md:col-span-2 space-y-4' },
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] uppercase tracking-wider' }, 'My Registered Events'),
        events.length === 0 
          ? React.createElement(ChristoCard, null, React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, 'You have not RSVPed to any upcoming events.'))
          : React.createElement(
              'div',
              { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
              events.map((evt) =>
                React.createElement(
                  ChristoCard,
                  { key: evt.id, highlighted: true },
                  React.createElement('h5', { className: 'font-bold text-xs text-[var(--christo-text)]' }, evt.title),
                  React.createElement('p', { className: 'text-3xs text-[var(--christo-muted)] mt-1' }, `📅 ${new Date(evt.startDateTime).toLocaleDateString()}`),
                  React.createElement('p', { className: 'text-3xs text-[var(--christo-muted)]' }, `📍 ${evt.location}`),
                  React.createElement(
                    'div',
                    { className: 'pt-3' },
                    React.createElement(
                      ChristoButton,
                      {
                        variant: 'secondary',
                        onClick: () => { window.location.href = `/church/events/${evt.id}`; },
                        className: 'w-full py-1 text-3xs font-semibold'
                      },
                      'View Details'
                    )
                  )
                )
              )
            ),

        // Enrolled Courses
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] uppercase tracking-wider pt-2' }, 'My Active Courses'),
        courses.length === 0 
          ? React.createElement(ChristoCard, null, React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, 'You are not enrolled in any courses right now.'))
          : React.createElement(
              'div',
              { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
              courses.map((c) =>
                React.createElement(
                  ChristoCard,
                  { key: c.id },
                  React.createElement('h5', { className: 'font-bold text-xs text-[var(--christo-text)]' }, c.title),
                  React.createElement(
                    'div',
                    { className: 'mt-3 space-y-1.5' },
                    React.createElement('div', { className: 'flex justify-between text-3xs text-[var(--christo-muted)] font-semibold' }, React.createElement('span', null, `${c.lessonsCount || 4} Lessons`), React.createElement('span', null, '33%')),
                    React.createElement(
                      'div',
                      { className: 'h-1.5 w-full bg-[var(--christo-surface-soft)] rounded-full overflow-hidden' },
                      React.createElement('div', { className: 'h-full bg-[var(--christo-accent)] rounded-full', style: { width: '33%' } })
                    )
                  ),
                  React.createElement(
                    'div',
                    { className: 'pt-3' },
                    React.createElement(
                      ChristoButton,
                      {
                        variant: 'primary',
                        onClick: () => { window.location.href = `/church/courses/${c.id}`; },
                        className: 'w-full py-1 text-3xs font-semibold'
                      },
                      'Resume Learning'
                    )
                  )
                )
              )
            )
      ),

      // Recent Activity Column
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] uppercase tracking-wider' }, 'Recent Activities'),
        React.createElement(
          ChristoCard,
          null,
          activities.length === 0 
            ? React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, 'No recent activity records.')
            : React.createElement(
                'ul',
                { className: 'space-y-4' },
                activities.map((act) =>
                  React.createElement(
                    'li',
                    { key: act.id, className: 'flex items-start space-x-3 text-xs border-b border-[var(--christo-border)] last:border-b-0 pb-3 last:pb-0' },
                    React.createElement('span', { className: 'text-base' }, act.type === 'event_rsvp' ? '🎫' : '📖'),
                    React.createElement(
                      'div',
                      { className: 'space-y-0.5' },
                      React.createElement('p', { className: 'font-semibold text-[var(--christo-text)]' }, act.title),
                      React.createElement('span', { className: 'text-3xs text-[var(--christo-muted)]' }, new Date(act.occurredAt).toLocaleDateString())
                    )
                  )
                )
              )
        )
      )
    )
  );
};
