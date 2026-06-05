import React from 'react';
import { GivingCategoryCardContract } from '@churchos/frontend-contracts';

export const DefaultGivingCategoryCard: React.FC<{ data: GivingCategoryCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement('div', { className: 'space-y-1' },
      data.imageUrl && React.createElement('img', {
        src: data.imageUrl,
        alt: data.name,
        className: 'w-full h-32 object-cover rounded-lg border border-slate-100'
      }),
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.name),
      data.description && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-2' }, data.description)
    ),
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 border border-slate-350 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Select'
    )
  );
};
