import React from 'react';

export interface DefaultRadioGroupProps {
  label: string;
  name: string;
  options?: { label: string; value: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}

export const DefaultRadioGroup: React.FC<DefaultRadioGroupProps> = ({
  label,
  name,
  options = [],
  value,
  onChange,
  required,
  error
}) => {
  return React.createElement(
    'div',
    { className: 'flex flex-col space-y-2 font-sans w-full' },
    React.createElement(
      'span',
      { className: 'text-xs font-semibold text-slate-700' },
      label,
      required && React.createElement('span', { className: 'text-red-500 ml-0.5' }, '*')
    ),
    React.createElement(
      'div',
      { className: 'flex flex-col space-y-1.5' },
      options.map((opt) => {
        const optionId = `${name}_${opt.value}`;
        return React.createElement(
          'div',
          { key: opt.value, className: 'flex items-center space-x-2' },
          React.createElement('input', {
            type: 'radio',
            id: optionId,
            name: name,
            value: opt.value,
            checked: value === opt.value,
            onChange: onChange,
            className: 'h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900'
          }),
          React.createElement(
            'label',
            { htmlFor: optionId, className: 'text-sm text-slate-700 select-none' },
            opt.label
          )
        );
      })
    ),
    error && React.createElement('span', { className: 'text-xs text-red-500 font-medium' }, error)
  );
};
