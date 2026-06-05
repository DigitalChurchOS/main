import React from 'react';

export interface DefaultFormStateProps {
  isSubmitting: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
  onReset?: () => void;
}

export const DefaultFormState: React.FC<DefaultFormStateProps> = ({
  isSubmitting,
  successMessage,
  errorMessage,
  onReset
}) => {
  if (isSubmitting) {
    return React.createElement(
      'div',
      { className: 'p-4 bg-slate-50 border border-slate-100 rounded-md text-slate-600 font-sans flex items-center space-x-2 text-sm justify-center' },
      React.createElement('div', { className: 'w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin' }),
      React.createElement('span', null, 'Submitting details, please wait...')
    );
  }

  if (successMessage) {
    return React.createElement(
      'div',
      { className: 'p-5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center font-sans space-y-3' },
      React.createElement('div', { className: 'text-2xl' }, '✅'),
      React.createElement('div', { className: 'font-semibold text-sm' }, 'Submission Successful'),
      React.createElement('p', { className: 'text-xs text-green-600' }, successMessage),
      onReset && React.createElement(
        'button',
        {
          onClick: onReset,
          type: 'button',
          className: 'px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition'
        },
        'Submit Another Form'
      )
    );
  }

  if (errorMessage) {
    return React.createElement(
      'div',
      { className: 'p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm font-sans' },
      React.createElement('div', { className: 'font-semibold text-xs mb-1' }, 'Submission Failed'),
      React.createElement('p', { className: 'text-xs text-red-600' }, errorMessage)
    );
  }

  return null;
};
