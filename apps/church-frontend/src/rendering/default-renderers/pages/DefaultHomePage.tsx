import React from 'react';
import { CMSPageContract } from '@churchos/frontend-contracts';

export interface DefaultHomePageProps {
  data?: CMSPageContract;
}

export const DefaultHomePage: React.FC<DefaultHomePageProps> = ({ data }) => {
  if (!data) return React.createElement('div', null, 'No Page Data');

  return React.createElement(
    'div',
    { className: 'space-y-12 py-6 font-sans' },
    
    // Top Hero block if any section is featured or hero
    data.sections.map((section: any, idx: number) => {
      return React.createElement(
        'section',
        {
          key: section.id || idx,
          className: 'p-8 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4'
        },
        React.createElement('h2', { className: 'text-2xl font-bold text-slate-800' }, section.title || 'Welcome Section'),
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 gap-6 md:grid-cols-2' },
          section.blocks.map((block: any, bIdx: number) => {
            return React.createElement(
              'div',
              { key: block.id || bIdx, className: 'p-4 border border-slate-100 rounded-lg bg-slate-50' },
              React.createElement('h4', { className: 'font-semibold text-slate-700 text-sm mb-2' }, block.type),
              React.createElement('p', { className: 'text-xs text-slate-500' }, JSON.stringify(block.properties))
            );
          })
        )
      );
    })
  );
};
