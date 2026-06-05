import React from 'react';

export interface DefaultCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

export const DefaultCheckbox: React.FC<DefaultCheckboxProps> = ({
  label,
  name,
  error,
  ...props
}) => {
  return React.createElement(
    'div',
    { className: 'flex flex-col space-y-1 font-sans' },
    React.createElement(
      'div',
      { className: 'flex items-start space-x-2' },
      React.createElement('input', {
        id: name,
        name: name,
        type: 'checkbox',
        className: 'mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900',
        ...props
      }),
      React.createElement(
        'label',
        { htmlFor: name, className: 'text-sm text-slate-700 font-medium select-none' },
        label,
        props.required && React.createElement('span', { className: 'text-red-500 ml-0.5' }, '*')
      )
    ),
    error && React.createElement('span', { className: 'text-xs text-red-500 font-medium' }, error)
  );
};
