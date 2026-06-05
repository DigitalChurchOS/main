import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoGivingCategoryCardProps {
  data: {
    id: string;
    title: string;
    description: string;
    cta?: { label: string; url: string };
  };
}

export const ChristoGivingCategoryCard: React.FC<ChristoGivingCategoryCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement('h4', { className: 'text-base font-bold text-[var(--christo-text)]' }, data.title),
      React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] min-h-[40px]' }, data.description),
      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = data.cta?.url || '/church/giving'; },
            className: 'w-full text-center'
          },
          data.cta?.label || 'Give to Fund'
        )
      )
    )
  );
};
