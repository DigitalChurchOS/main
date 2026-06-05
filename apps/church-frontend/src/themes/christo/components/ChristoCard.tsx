import React from 'react';

export interface ChristoCardProps {
  children?: React.ReactNode;
  highlighted?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ChristoCard: React.FC<ChristoCardProps> = ({
  children,
  highlighted = false,
  className = '',
  onClick
}) => {
  const classes = `christo-card ${highlighted ? 'christo-card-highlight' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`;

  return React.createElement(
    'div',
    {
      className: classes,
      onClick
    },
    children
  );
};
