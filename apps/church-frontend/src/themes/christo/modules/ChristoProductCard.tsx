import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoProductCardProps {
  data: {
    id: string;
    title: string;
    description?: string;
    price: number;
    thumbnailUrl: string;
    cta?: { label: string; url: string };
  };
}

export const ChristoProductCard: React.FC<ChristoProductCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { className: 'flex flex-col p-0 overflow-hidden' },
    React.createElement('img', {
      src: data.thumbnailUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600',
      alt: data.title,
      className: 'w-full h-40 object-cover border-b border-[var(--christo-border)]'
    }),
    React.createElement(
      'div',
      { className: 'p-4 flex-grow flex flex-col justify-between space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-2xs text-[var(--christo-accent-strong)] font-bold' }, `$${data.price.toFixed(2)}`),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] line-clamp-1' }, data.title),
        data.description && React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.description)
      ),
      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = `/church/store/${data.id}`; },
            className: 'w-full text-center py-2'
          },
          data.cta?.label || 'View Product'
        )
      )
    )
  );
};
