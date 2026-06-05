import React from 'react';
import { CourseDetailContract } from '@churchos/frontend-contracts';

export const DefaultCourseDetail: React.FC<{ data: CourseDetailContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 font-sans' },
    
    // Core body and lessons list
    React.createElement(
      'div',
      { className: 'lg:col-span-2 space-y-6' },
      data.thumbnailUrl && React.createElement('img', {
        src: data.thumbnailUrl,
        alt: data.title,
        className: 'w-full h-64 object-cover rounded-xl border border-slate-100 shadow-sm'
      }),
      React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, data.title),
      data.description && React.createElement('p', { className: 'text-sm text-slate-600 leading-relaxed' }, data.description),
      
      // Lessons
      React.createElement('hr', { className: 'border-slate-200' }),
      React.createElement('h3', { className: 'text-base font-bold text-slate-800' }, 'Curriculum'),
      React.createElement(
        'div',
        { className: 'space-y-3' },
        data.lessons.map((lesson, idx) =>
          React.createElement(
            'div',
            { key: lesson.id || idx, className: 'p-4 border border-slate-150 rounded-xl bg-white flex items-center justify-between' },
            React.createElement(
              'div',
              { className: 'space-y-1' },
              React.createElement('span', { className: 'text-2xs font-semibold text-slate-400' }, `Lesson ${idx + 1}`),
              React.createElement('h4', { className: 'text-sm font-bold text-slate-800' }, lesson.title),
              lesson.durationMinutes && React.createElement('span', { className: 'text-xs text-slate-400' }, `⏱️ ${lesson.durationMinutes} mins`)
            ),
            lesson.isFreePreview && React.createElement('span', { className: 'px-2 py-0.5 bg-green-50 text-green-700 text-2xs font-semibold rounded' }, 'Preview')
          )
        )
      )
    ),
    
    // Sidebar details card
    React.createElement(
      'div',
      { className: 'lg:col-span-1' },
      React.createElement(
        'div',
        { className: 'p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 sticky top-24' },
        React.createElement('h4', { className: 'text-xs font-bold text-slate-800 uppercase tracking-wider' }, 'LMS Enrollment'),
        React.createElement('p', { className: 'text-xs text-slate-500' }, 'Unlock unlimited access to all course lessons and materials.'),
        React.createElement(
          'a',
          {
            href: data.cta.url || '#',
            className: 'block text-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition mt-4 w-full'
          },
          data.cta.label || 'Enroll Now'
        )
      )
    )
  );
};
