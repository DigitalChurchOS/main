import React from 'react';
import { CampaignCardContract } from '@churchos/frontend-contracts';

export const DefaultCampaignCard: React.FC<{ data: CampaignCardContract }> = ({ data }) => {
  if (!data) return null;

  const percent = data.targetAmount > 0 ? Math.min(100, Math.round((data.currentAmount / data.targetAmount) * 100)) : 0;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 font-sans flex flex-col justify-between h-full' },
    
    React.createElement('div', { className: 'space-y-3' },
      data.thumbnailUrl && React.createElement('img', {
        src: data.thumbnailUrl,
        alt: data.title,
        className: 'w-full h-36 object-cover rounded-lg border border-slate-100'
      }),
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.title),
      data.description && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-2' }, data.description),
      
      // Progress Bar
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement(
          'div',
          { className: 'flex justify-between items-center text-3xs font-semibold text-slate-500' },
          React.createElement('span', null, `$${data.currentAmount.toLocaleString()} raised`),
          React.createElement('span', null, `${percent}% of $${data.targetAmount.toLocaleString()}`)
        ),
        React.createElement(
          'div',
          { className: 'w-full bg-slate-100 h-2 rounded-full overflow-hidden' },
          React.createElement('div', {
            style: { width: `${percent}%` },
            className: 'bg-slate-900 h-full rounded-full transition-all duration-500'
          })
        )
      )
    ),
    
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Support Campaign'
    )
  );
};
