import React from 'react';

export const DefaultDisabledState: React.FC<{ message?: string }> = ({
  message = 'This module has been disabled by the site administrator.'
}) => {
  return React.createElement(
    'div',
    { className: 'p-6 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 font-sans text-center max-w-md mx-auto my-4' },
    React.createElement('div', { className: 'font-semibold text-sm mb-1' }, '🚫 Module Disabled'),
    React.createElement('div', { className: 'text-xs' }, message)
  );
};
