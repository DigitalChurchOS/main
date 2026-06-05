import React from 'react';
import { ChristoTestimonyCard } from './ChristoTestimonyCard';

export interface Testimony {
  id: string;
  title: string;
  content: string;
  authorName?: string;
  isFeatured?: boolean;
}

export interface ChristoTestimonyWallProps {
  data?: {
    testimonies?: Testimony[];
  };
}

export const ChristoTestimonyWall: React.FC<ChristoTestimonyWallProps> = ({ data }) => {
  const testimonies = data?.testimonies || [
    { id: '1', title: 'Faithful Financial Provision', content: 'We prayed for rental assistance and received a surprise utility credit of the exact amount the next day.', authorName: 'Sarah M.', isFeatured: true },
    { id: '2', title: 'Complete Restoration of Friendship', content: 'After years of estrangement, we reconnected during the reconciliation study and rebuilt our fellowship.', authorName: 'John K.', isFeatured: false }
  ];

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
      testimonies.map((testimony) =>
        React.createElement(ChristoTestimonyCard, {
          key: testimony.id,
          data: testimony
        })
      )
    )
  );
};
