import React from 'react';
import { GroupCardContract } from '@churchos/frontend-contracts';

export const DefaultGroupCard: React.FC<{ data: GroupCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement('div', { className: 'space-y-2' },
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.name),
      data.description && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-2' }, data.description),
      data.schedule && React.createElement(
        'div',
        { className: 'text-2xs text-slate-400 font-semibold uppercase tracking-wider' },
        `📅 Schedule: ${data.schedule}`
      )
    ),
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Join Group'
    )
  );
};
