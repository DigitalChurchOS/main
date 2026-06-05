import React from 'react';

export interface DefaultDetailPageProps {
  data?: {
    title: string;
    meta?: string;
    imageUrl?: string;
    content: string;
    sidebar?: React.ReactNode;
  };
}

export const DefaultDetailPage: React.FC<DefaultDetailPageProps> = ({ data }) => {
  if (!data) return React.createElement('div', null, 'No detail content available.');

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 font-sans' },
    
    // Primary detail body column
    React.createElement(
      'div',
      { className: 'lg:col-span-2 space-y-6' },
      data.imageUrl && React.createElement('img', {
        src: data.imageUrl,
        alt: data.title,
        className: 'w-full h-64 object-cover rounded-xl border border-slate-100 shadow-sm'
      }),
      React.createElement('div', { className: 'space-y-2' },
        React.createElement('h1', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, data.title),
        data.meta && React.createElement('span', { className: 'text-xs text-slate-400 font-semibold uppercase tracking-wider' }, data.meta)
      ),
      React.createElement('hr', { className: 'border-slate-200' }),
      React.createElement('div', {
        className: 'prose prose-slate text-sm text-slate-600 leading-relaxed space-y-4',
        dangerouslySetInnerHTML: { __html: data.content }
      })
    ),
    
    // Sidebar column if provided
    data.sidebar && React.createElement(
      'div',
      { className: 'space-y-6' },
      data.sidebar
    )
  );
};
