import React from 'react';

export interface DefaultSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  options?: { label: string; value: string }[];
  error?: string;
}

export const DefaultSelect: React.FC<DefaultSelectProps> = ({
  label,
  name,
  options = [],
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
    React.createElement(
      'select',
      {
        id: name,
        name: name,
        className: `px-3 py-2 border rounded-md text-sm bg-white transition focus:outline-none focus:ring-2 focus:ring-slate-900 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
        }`,
        ...props
      },
      React.createElement('option', { value: '' }, 'Select an option...'),
      options.map((opt) =>
        React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
      )
    ),
    error && React.createElement('span', { className: 'text-xs text-red-500 font-medium' }, error)
  );
};
