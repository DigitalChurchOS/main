import React from 'react';

export const DefaultErrorState: React.FC<{ message?: string; retryAction?: () => void }> = ({
  message = 'Something went wrong. Please try again later.',
  retryAction
}) => {
  return React.createElement(
    'div',
    { className: 'p-6 bg-red-50 border border-red-100 rounded-xl text-red-800 font-sans text-center max-w-lg mx-auto my-4' },
    React.createElement('div', { className: 'font-semibold text-base mb-1' }, '⚠️ Error Loading Content'),
    React.createElement('div', { className: 'text-sm text-red-600 mb-4' }, message),
    retryAction && React.createElement(
      'button',
      {
        onClick: retryAction,
        className: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition'
      },
      'Retry Loading'
    )
  );
};
