import React from 'react';
import { EventDetailContract } from '@churchos/frontend-contracts';

export const DefaultEventDetail: React.FC<{ data: EventDetailContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 font-sans' },
    
    // Core details body
    React.createElement(
      'div',
      { className: 'lg:col-span-2 space-y-6' },
      data.imageUrl && React.createElement('img', {
        src: data.imageUrl,
        alt: data.title,
        className: 'w-full h-72 object-cover rounded-2xl border border-slate-100 shadow-sm'
      }),
      React.createElement('div', { className: 'space-y-2' },
        React.createElement('h1', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, data.title),
        React.createElement(
          'div',
          { className: 'flex flex-wrap gap-4 text-xs text-slate-400 font-medium' },
          data.organizer && React.createElement('span', null, `Organized by: ${data.organizer}`),
          data.capacity && React.createElement('span', null, `Capacity: ${data.registeredCount || 0}/${data.capacity}`)
        )
      ),
      React.createElement('hr', { className: 'border-slate-200' }),
      React.createElement('div', {
        className: 'prose prose-slate text-sm text-slate-600 leading-relaxed space-y-4',
        dangerouslySetInnerHTML: { __html: data.contentHtml || data.description || 'No description provided.' }
      })
    ),
    
    // Sidebar card for dates and quick registration action
    React.createElement(
      'div',
      { className: 'lg:col-span-1' },
      React.createElement(
        'div',
        { className: 'p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 sticky top-24' },
        React.createElement('h4', { className: 'text-xs font-bold text-slate-800 uppercase tracking-wider' }, 'Event Details'),
        React.createElement(
          'div',
          { className: 'space-y-3 text-xs text-slate-600' },
          React.createElement(
            'div',
            { className: 'flex flex-col' },
            React.createElement('span', { className: 'font-semibold text-slate-500' }, 'Starts'),
            React.createElement('span', null, new Date(data.startDateTime).toLocaleString())
          ),
          React.createElement(
            'div',
            { className: 'flex flex-col' },
            React.createElement('span', { className: 'font-semibold text-slate-500' }, 'Ends'),
            React.createElement('span', null, new Date(data.endDateTime).toLocaleString())
          ),
          data.location && React.createElement(
            'div',
            { className: 'flex flex-col' },
            React.createElement('span', { className: 'font-semibold text-slate-500' }, 'Location'),
            React.createElement('span', null, data.location)
          )
        ),
        React.createElement(
          'a',
          {
            href: data.registrationCta.url || '#',
            className: 'block text-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition mt-4 w-full'
          },
          data.registrationCta.label || 'Register Now'
        )
      )
    )
  );
};
