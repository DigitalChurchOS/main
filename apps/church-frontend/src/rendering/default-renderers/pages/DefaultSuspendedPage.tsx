import React from 'react';

export const DefaultSuspendedPage: React.FC<{ message?: string }> = ({
  message = 'The service subscription for this account has ended or is temporarily suspended. Please contact customer support.'
}) => {
  return React.createElement(
    'div',
    { className: 'text-center py-20 px-4 font-sans space-y-4 max-w-lg mx-auto' },
    React.createElement('span', { className: 'text-5xl' }, '⚠️'),
    React.createElement('h1', { className: 'text-2xl font-extrabold text-slate-800' }, 'Account Suspended'),
    React.createElement('p', { className: 'text-sm text-slate-500 leading-relaxed' }, message)
  );
};
