import React from 'react';

export const DefaultMemberOnlyState: React.FC<{ message?: string; onLogin?: () => void }> = ({
  message = 'This content is restricted to church members only. Please sign in to continue.',
  onLogin
}) => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-xl font-sans max-w-lg mx-auto my-6 flex flex-col items-center justify-center space-y-4' },
    React.createElement('span', { className: 'text-3xl' }, '👤'),
    React.createElement('div', null,
      React.createElement('div', { className: 'font-semibold text-base mb-1' }, 'Members Only'),
      React.createElement('div', { className: 'text-sm text-slate-500' }, message)
    ),
    React.createElement(
      'button',
      {
        onClick: onLogin || (() => window.location.href = '/login'),
        className: 'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition'
      },
      'Sign In'
    )
  );
};
