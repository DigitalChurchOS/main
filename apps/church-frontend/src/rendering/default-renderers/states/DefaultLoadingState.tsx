import React from 'react';

export const DefaultLoadingState: React.FC<{ message?: string }> = ({ message = 'Loading content, please wait...' }) => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center text-gray-500 font-sans flex flex-col items-center justify-center space-y-2' },
    React.createElement('div', { className: 'w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin' }),
    React.createElement('span', { className: 'text-sm text-gray-400' }, message)
  );
};
