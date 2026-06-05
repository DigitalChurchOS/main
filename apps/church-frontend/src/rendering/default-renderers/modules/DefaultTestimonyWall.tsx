import React from 'react';
import { TestimonyWallContract } from '@churchos/frontend-contracts';
import { DefaultTestimonyCard } from './DefaultTestimonyCard';

export const DefaultTestimonyWall: React.FC<{ data: TestimonyWallContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
    
    // Header section with action to submit testimony
    React.createElement(
      'div',
      { className: 'flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, 'Stories of Faith'),
        React.createElement('p', { className: 'text-xs text-slate-500' }, 'Discover and share testimonies of what God is doing in our lives.')
      ),
      React.createElement(
        'a',
        {
          href: data.submitTestimonyCta.url || '#',
          className: 'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition'
        },
        data.submitTestimonyCta.label || 'Share Your Story'
      )
    ),
    
    // Grid of testimonies
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
      data.testimonies.map((testimony: any, idx: number) =>
        React.createElement(DefaultTestimonyCard, { key: testimony.id || idx, data: testimony })
      )
    )
  );
};
