import React from 'react';

export interface FormGroupProps {
  label: string;
  error?: string;
  children?: React.ReactNode;
}

export const ChristoFormGroup: React.FC<FormGroupProps> = ({ label, error, children }) => {
  return React.createElement(
    'div',
    { className: 'space-y-1.5' },
    React.createElement('label', { className: 'block text-xs font-semibold text-[var(--christo-text)] uppercase tracking-wider' }, label),
    children,
    error && React.createElement('p', { className: 'text-xs text-[var(--christo-danger)] font-medium' }, error)
  );
};

export const ChristoInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return React.createElement('input', {
      ref,
      className: `christo-input ${className}`,
      ...props
    });
  }
);

export const ChristoTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return React.createElement('textarea', {
      ref,
      className: `christo-input min-h-[100px] ${className}`,
      ...props
    });
  }
);

export const ChristoSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, className = '', ...props }, ref) => {
    return React.createElement(
      'select',
      {
        ref,
        className: `christo-input bg-[var(--christo-surface)] ${className}`,
        ...props
      },
      children
    );
  }
);
