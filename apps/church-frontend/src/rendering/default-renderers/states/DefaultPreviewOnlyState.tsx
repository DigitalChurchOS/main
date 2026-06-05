import React from 'react';

export const DefaultPreviewOnlyState: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'p-3 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-800 font-sans text-xs flex items-center justify-between mx-auto my-2' },
    React.createElement('div', { className: 'flex items-center space-x-2' },
      React.createElement('span', null, '👁️'),
      React.createElement('span', { className: 'font-medium' }, 'Preview Mode: This block is only visible in editor drafts.')
    )
  );
};
