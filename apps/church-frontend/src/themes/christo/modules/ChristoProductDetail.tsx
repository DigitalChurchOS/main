import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';
import { ChristoBadge } from '../components/ChristoBadge';

export interface ChristoProductDetailProps {
  data: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl: string;
  };
}

export const ChristoProductDetail: React.FC<ChristoProductDetailProps> = ({ data }) => {
  const [purchased, setPurchased] = useState(false);

  const handlePurchase = () => {
    setPurchased(true);
  };

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      ChristoCard,
      { highlighted: true },
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
        
        // Thumbnail Column
        React.createElement('img', {
          src: data.thumbnailUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
          alt: data.title,
          className: 'w-full object-cover max-h-[300px] border border-[var(--christo-border)] rounded-[var(--christo-radius-image)]'
        }),

        // Detail / Checkout Column
        React.createElement(
          'div',
          { className: 'space-y-4 flex flex-col justify-between' },
          React.createElement(
            'div',
            { className: 'space-y-2' },
            React.createElement(ChristoBadge, { variant: 'accent' }, `$${data.price.toFixed(2)}`),
            React.createElement('h1', { className: 'text-xl font-black text-[var(--christo-text)]' }, data.title),
            React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] leading-relaxed' }, data.description)
          ),

          React.createElement(
            'div',
            { className: 'pt-4 border-t border-[var(--christo-border)]' },
            purchased ? React.createElement(
              'div',
              { className: 'text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-[var(--christo-radius-input)] text-center' },
              '✓ Thank you! Product added to cart.'
            ) : React.createElement(
              ChristoButton,
              {
                variant: 'primary',
                onClick: handlePurchase,
                className: 'w-full py-2.5'
              },
              'Purchase Item'
            )
          )
        )
      )
    )
  );
};
