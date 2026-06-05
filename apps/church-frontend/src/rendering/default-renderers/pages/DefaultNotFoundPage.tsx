import React from 'react';

export const DefaultNotFoundPage: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'text-center py-16 px-4 font-sans space-y-4 max-w-md mx-auto' },
    React.createElement('span', { className: 'text-5xl' }, '🔍'),
    React.createElement('h1', { className: 'text-3xl font-extrabold text-slate-800' }, '404 Page Not Found'),
    React.createElement('p', { className: 'text-sm text-slate-500' }, 'The resource you are looking for has been moved, renamed, or is temporarily offline.'),
    React.createElement(
      'a',
      {
        href: '/',
        className: 'inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition'
      },
      'Return to Home'
    )
  );
};
