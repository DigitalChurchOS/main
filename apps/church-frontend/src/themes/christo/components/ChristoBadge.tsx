import React from 'react';

export interface ChristoBadgeProps {
  children?: React.ReactNode;
  variant?: 'accent' | 'live' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const ChristoBadge: React.FC<ChristoBadgeProps> = ({
  children,
  variant = 'accent',
  className = ''
}) => {
  let badgeClass = 'christo-badge-accent';
  if (variant === 'live') badgeClass = 'christo-badge-live';
  else if (variant === 'success') badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
  else if (variant === 'warning') badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  else if (variant === 'danger') badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

  return React.createElement(
    'span',
    {
      className: `christo-badge ${badgeClass} ${className}`
    },
    children
  );
};
