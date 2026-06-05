import React from 'react';

export interface ChristoIconPanelProps {
  icon: React.ReactNode;
  className?: string;
}

export const ChristoIconPanel: React.FC<ChristoIconPanelProps> = ({
  icon,
  className = ''
}) => {
  return React.createElement(
    'div',
    {
      className: `w-12 h-12 flex items-center justify-center rounded-lg bg-[var(--christo-accent-soft)] text-[var(--christo-accent)] ${className}`
    },
    React.createElement('span', { className: 'w-6 h-6 flex items-center justify-center' }, icon)
  );
};
