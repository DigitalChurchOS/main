import React from 'react';
import { MemberDashboardContract } from '@churchos/frontend-contracts';
import { DefaultMemberProfile } from './DefaultMemberProfile';
import { DefaultEventCard } from './DefaultEventCard';
import { DefaultCourseCard } from './DefaultCourseCard';

export const DefaultMemberDashboard: React.FC<{ data: MemberDashboardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'space-y-8 font-sans py-4' },
    
    // Core details header
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
      React.createElement(
        'div',
        { className: 'md:col-span-1' },
        React.createElement(DefaultMemberProfile, { data: data.profile })
      ),
      React.createElement(
        'div',
        { className: 'md:col-span-2 p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm' },
        React.createElement('h3', { className: 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5' }, '🔗 Quick Links'),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          data.quickLinks.map((link: any) =>
            React.createElement(
              'a',
              {
                key: link.label,
                href: link.url,
                className: 'px-4 py-2 border border-slate-200 hover:border-slate-800 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 transition flex items-center justify-between'
              },
              React.createElement('span', null, link.label),
              React.createElement('span', null, '→')
            )
          )
        )
      )
    ),
    
    // Activities
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
      
      // Registered events list
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement('h3', { className: 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5' }, '📅 My Registered Events'),
        data.registeredEvents.length === 0
          ? React.createElement('div', { className: 'text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded' }, 'You have not registered for any events yet.')
          : React.createElement(
              'div',
              { className: 'grid grid-cols-1 gap-4' },
              data.registeredEvents.map((evt: any) =>
                React.createElement(DefaultEventCard, { key: evt.id, data: evt })
              )
            )
      ),
      
      // Enrolled courses list
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement('h3', { className: 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5' }, '📚 My Enrolled Courses'),
        data.enrolledCourses.length === 0
          ? React.createElement('div', { className: 'text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded' }, 'You have not enrolled in any courses yet.')
          : React.createElement(
              'div',
              { className: 'grid grid-cols-1 gap-4' },
              data.enrolledCourses.map((crs: any) =>
                React.createElement(DefaultCourseCard, { key: crs.id, data: crs })
              )
            )
      )
    ),
    
    // Recent activities list
    React.createElement(
      'div',
      { className: 'p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm' },
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5' }, '📜 Recent Activities'),
      data.recentActivities.length === 0
        ? React.createElement('div', { className: 'text-xs text-slate-400 p-2' }, 'No recent activity recorded.')
        : React.createElement(
            'div',
            { className: 'space-y-3' },
            data.recentActivities.map((act: any) =>
              React.createElement(
                'div',
                { key: act.id, className: 'flex justify-between items-center text-xs text-slate-600 border-b border-slate-50 pb-2' },
                React.createElement('div', { className: 'space-x-2' },
                  React.createElement('span', { className: 'px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-3xs font-semibold' }, act.type),
                  React.createElement('span', null, act.title)
                ),
                React.createElement('span', { className: 'text-3xs text-slate-400' }, new Date(act.occurredAt).toLocaleString())
              )
            )
          )
    )
  );
};
