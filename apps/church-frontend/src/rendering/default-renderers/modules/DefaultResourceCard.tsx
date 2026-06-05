import React from 'react';
import { ResourceCardContract } from '@churchos/frontend-contracts';

export const DefaultResourceCard: React.FC<{ data: ResourceCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement('div', { className: 'space-y-2' },
      data.thumbnailUrl && React.createElement('img', {
        src: data.thumbnailUrl,
        alt: data.title,
        className: 'w-full h-32 object-cover rounded-lg border border-slate-100'
      }),
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.title),
      data.description && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-2' }, data.description),
      React.createElement('span', { className: 'inline-block text-2xs font-semibold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-150' }, `📄 Format: ${data.fileType}`)
    ),
    React.createElement(
      'a',
      {
        href: data.downloadUrl || '#',
        className: 'inline-block text-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Download'
    )
  );
};
