import React from 'react';
import { EventCardContract } from '@churchos/frontend-contracts';

export const DefaultEventCard: React.FC<{ data: EventCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 font-sans flex flex-col justify-between h-full' },
    
    React.createElement('div', { className: 'space-y-2' },
      data.imageUrl && React.createElement('img', {
        src: data.imageUrl,
        alt: data.title,
        className: 'w-full h-40 object-cover rounded-lg border border-slate-100'
      }),
      React.createElement('h3', { className: 'text-base font-bold text-slate-800' }, data.title),
      data.description && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-3' }, data.description),
      React.createElement(
        'div',
        { className: 'text-2xs text-slate-400 space-y-1' },
        React.createElement('div', null, `📅 Start: ${new Date(data.startDateTime).toLocaleString()}`),
        React.createElement('div', null, `⏳ End: ${new Date(data.endDateTime).toLocaleString()}`),
        data.location && React.createElement('div', null, `📍 Location: ${data.location}`)
      )
    ),
    
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition mt-3 w-full'
      },
      data.cta.label || 'Register'
    )
  );
};
