import React from 'react';

export interface ChristoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent-text';
  icon?: React.ReactNode;
}

export const ChristoButton: React.FC<ChristoButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  className = '',
  ...props
}) => {
  const btnClass = variant === 'primary' 
    ? 'christo-btn-primary' 
    : variant === 'secondary' 
    ? 'christo-btn-secondary' 
    : 'christo-btn-accent-text';

  return React.createElement(
    'button',
    {
      className: `christo-btn ${btnClass} flex items-center justify-center space-x-2 ${className}`,
      ...props
    },
    icon && React.createElement('span', { className: 'w-4 h-4 flex items-center' }, icon),
    React.createElement('span', null, children)
  );
};
