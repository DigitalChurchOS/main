import React from 'react';

export interface DefaultContentPageProps {
  data?: {
    title: string;
    subtitle?: string;
    body: string;
  };
}

export const DefaultContentPage: React.FC<DefaultContentPageProps> = ({ data }) => {
  if (!data) return React.createElement('div', null, 'No page content');

  return React.createElement(
    'article',
    { className: 'max-w-3xl mx-auto py-8 font-sans space-y-4' },
    React.createElement('h1', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, data.title),
    data.subtitle && React.createElement('p', { className: 'text-lg text-slate-500 font-medium' }, data.subtitle),
    React.createElement('hr', { className: 'border-slate-200 my-4' }),
    React.createElement('div', {
      className: 'prose prose-slate text-sm text-slate-600 leading-relaxed space-y-4',
      dangerouslySetInnerHTML: { __html: data.body }
    })
  );
};
