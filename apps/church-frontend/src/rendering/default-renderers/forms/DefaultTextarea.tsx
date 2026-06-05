import React from 'react';

export interface DefaultTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
}

export const DefaultTextarea: React.FC<DefaultTextareaProps> = ({
  label,
  name,
  error,
  ...props
}) => {
  return React.createElement(
    'div',
    { className: 'flex flex-col space-y-1 w-full font-sans' },
    React.createElement(
      'label',
      { htmlFor: name, className: 'text-xs font-semibold text-slate-700' },
      label,
      props.required && React.createElement('span', { className: 'text-red-500 ml-0.5' }, '*')
    ),
    React.createElement('textarea', {
      id: name,
      name: name,
      rows: 4,
      className: `px-3 py-2 border rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900 ${
        error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
      }`,
      ...props
    }),
    error && React.createElement('span', { className: 'text-xs text-red-500 font-medium' }, error)
  );
};
