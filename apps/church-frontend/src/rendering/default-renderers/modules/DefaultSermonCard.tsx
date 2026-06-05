import React from 'react';
import { SermonCardContract } from '@churchos/frontend-contracts';

export const DefaultSermonCard: React.FC<{ data: SermonCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement('div', { className: 'space-y-2' },
      data.thumbnailUrl && React.createElement('img', {
        src: data.thumbnailUrl,
        alt: data.title,
        className: 'w-full h-36 object-cover rounded-lg border border-slate-100'
      }),
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.title),
      React.createElement(
        'div',
        { className: 'text-2xs text-slate-400 space-y-0.5' },
        React.createElement('div', null, `🗣️ Speaker: ${data.speaker}`),
        data.seriesName && React.createElement('div', null, `📚 Series: ${data.seriesName}`),
        React.createElement('div', null, `📅 Date: ${new Date(data.date).toLocaleDateString()}`)
      )
    ),
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Listen / Watch'
    )
  );
};
