import React from 'react';

export const DefaultLockedState: React.FC<{ message?: string }> = ({
  message = 'This module is currently locked or requires subscription activation.'
}) => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center text-amber-800 bg-amber-50 border border-amber-100 rounded-xl font-sans max-w-lg mx-auto my-4' },
    React.createElement('div', { className: 'text-2xl mb-2' }, '🔒'),
    React.createElement('div', { className: 'font-semibold text-base mb-1' }, 'Section Locked'),
    React.createElement('div', { className: 'text-sm text-amber-700' }, message)
  );
};
