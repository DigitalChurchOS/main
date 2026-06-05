import React from 'react';

export interface DefaultListingPageProps {
  data?: {
    title: string;
    description?: string;
    items: any[];
    renderItem: (item: any) => React.ReactNode;
  };
}

export const DefaultListingPage: React.FC<DefaultListingPageProps> = ({ data }) => {
  if (!data) return React.createElement('div', null, 'No listing items available.');

  return React.createElement(
    'div',
    { className: 'space-y-6 py-6 font-sans' },
    React.createElement('div', { className: 'border-b border-slate-200 pb-4' },
      React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, data.title),
      data.description && React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, data.description)
    ),
    data.items.length === 0 ? React.createElement('div', { className: 'text-center p-8 text-slate-400 border border-dashed border-slate-200 rounded-lg text-sm' }, 'No listings to show.') :
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
      data.items.map((item, index) =>
        React.createElement('div', { key: item.id || index }, data.renderItem(item))
      )
    )
  );
};
