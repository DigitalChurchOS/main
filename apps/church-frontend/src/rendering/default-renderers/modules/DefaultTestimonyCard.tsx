import React from 'react';
import { TestimonyCardContract } from '@churchos/frontend-contracts';

export const DefaultTestimonyCard: React.FC<{ data: TestimonyCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement(
      'div',
      { className: 'space-y-2' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center text-2xs text-slate-400 font-semibold' },
        React.createElement('span', { className: 'text-slate-700 font-bold' }, data.authorName),
        React.createElement('span', null, new Date(data.date).toLocaleDateString())
      ),
      data.content && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-3 leading-relaxed italic' }, `"${data.content}"`)
    ),
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 border border-slate-350 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Read Story'
    )
  );
};
