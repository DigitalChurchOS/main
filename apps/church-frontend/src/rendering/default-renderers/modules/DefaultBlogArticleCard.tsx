import React from 'react';
import { BlogCardContract } from '@churchos/frontend-contracts';

export const DefaultBlogArticleCard: React.FC<{ data: BlogCardContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 font-sans flex flex-col justify-between h-full' },
    React.createElement('div', { className: 'space-y-2' },
      data.imageUrl && React.createElement('img', {
        src: data.imageUrl,
        alt: data.title,
        className: 'w-full h-36 object-cover rounded-lg border border-slate-100'
      }),
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800' }, data.title),
      data.excerpt && React.createElement('p', { className: 'text-xs text-slate-500 line-clamp-2' }, data.excerpt),
      React.createElement(
        'div',
        { className: 'text-2xs text-slate-400 space-y-0.5' },
        React.createElement('div', null, `✍️ Author: ${data.author}`),
        data.readTimeMinutes && React.createElement('div', null, `⏱️ Read Time: ${data.readTimeMinutes} mins`),
        React.createElement('div', null, `📅 Date: ${new Date(data.publishedDate).toLocaleDateString()}`)
      )
    ),
    React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'inline-block text-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition mt-2 w-full'
      },
      data.cta.label || 'Read Article'
    )
  );
};
