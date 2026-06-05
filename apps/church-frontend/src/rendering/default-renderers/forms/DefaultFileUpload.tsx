import React from 'react';

export interface DefaultFileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

export const DefaultFileUpload: React.FC<DefaultFileUploadProps> = ({
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
    React.createElement('input', {
      id: name,
      name: name,
      type: 'file',
      className: `text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer ${
        error ? 'border-red-500' : 'border-slate-300'
      }`,
      ...props
    }),
    error && React.createElement('span', { className: 'text-xs text-red-500 font-medium' }, error)
  );
};
