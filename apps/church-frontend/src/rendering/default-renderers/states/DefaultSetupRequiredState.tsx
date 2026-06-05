import React from 'react';

export const DefaultSetupRequiredState: React.FC<{ message?: string }> = ({
  message = 'Module configuration is required. Please visit your Tenant Dashboard.'
}) => {
  return React.createElement(
    'div',
    { className: 'p-8 text-center text-blue-800 bg-blue-50 border border-blue-100 rounded-xl font-sans max-w-lg mx-auto my-4' },
    React.createElement('div', { className: 'text-2xl mb-2' }, '🛠️'),
    React.createElement('div', { className: 'font-semibold text-base mb-1' }, 'Configuration Required'),
    React.createElement('div', { className: 'text-sm text-blue-700' }, message)
  );
};
