import React from 'react';

export const DefaultMaintenancePage: React.FC<{ message?: string }> = ({
  message = 'We are currently performing routine upgrades to improve your experience. Please check back shortly.'
}) => {
  return React.createElement(
    'div',
    { className: 'text-center py-20 px-4 font-sans space-y-4 max-w-lg mx-auto' },
    React.createElement('span', { className: 'text-5xl animate-bounce inline-block' }, '⚙️'),
    React.createElement('h1', { className: 'text-2xl font-extrabold text-slate-800' }, 'Under Maintenance'),
    React.createElement('p', { className: 'text-sm text-slate-500 leading-relaxed' }, message)
  );
};
