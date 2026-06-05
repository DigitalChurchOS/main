import React from 'react';

export const DefaultEmptyState: React.FC<{ message?: string }> = ({ message = 'No content is currently available here.' }) => {
  return React.createElement(
    'div',
    { className: 'p-12 text-center text-gray-400 font-sans border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center space-y-2' },
    React.createElement('span', { className: 'text-2xl' }, '📁'),
    React.createElement('div', { className: 'text-sm font-medium' }, message)
  );
};
