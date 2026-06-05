import React from 'react';
import { ServiceCardContract } from '@churchos/frontend-contracts';

export const DefaultServiceCard: React.FC<{ data: ServiceCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement('div', { className: 'space-y-2' },
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.title),
      React.createElement(
        'div',
        { className: 'text-2xs text-slate-400 space-y-0.5' },
        React.createElement('div', null, `⏰ Time: ${data.timeString}`),
        data.branchName && React.createElement('div', null, `🏢 Branch: ${data.branchName}`),
        data.location && React.createElement('div', null, `📍 Location: ${data.location}`)
      )
    ),
    data.livestreamCta && React.createElement(
      'a',
      {
        href: data.livestreamCta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.livestreamCta.label || 'Watch Live'
    )
  );
};
