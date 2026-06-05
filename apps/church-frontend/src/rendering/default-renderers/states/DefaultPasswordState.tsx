import React, { useState } from 'react';

export const DefaultPasswordState: React.FC<{
  onSubmitPassword?: (password: string) => void;
  incorrectAttempt?: boolean;
}> = ({ onSubmitPassword, incorrectAttempt }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitPassword) {
      onSubmitPassword(value);
    }
  };

  return React.createElement(
    'div',
    { className: 'p-8 text-center text-slate-800 bg-white border border-slate-200 rounded-xl font-sans max-w-md mx-auto my-8 space-y-4' },
    React.createElement('div', { className: 'text-3xl' }, '🔑'),
    React.createElement('div', { className: 'font-semibold text-lg' }, 'Password Protected'),
    React.createElement('div', { className: 'text-sm text-slate-500' }, 'This page requires a password to view. Please enter the password below.'),
    React.createElement(
      'form',
      { onSubmit: handleSubmit, className: 'flex flex-col space-y-3' },
      React.createElement('input', {
        type: 'password',
        value: value,
        onChange: (e) => setValue(e.target.value),
        placeholder: 'Enter password',
        className: 'px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900'
      }),
      incorrectAttempt && React.createElement('div', { className: 'text-xs text-red-500 text-left' }, 'Incorrect password, please try again.'),
      React.createElement(
        'button',
        {
          type: 'submit',
          className: 'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition'
        },
        'Submit'
      )
    )
  );
};
