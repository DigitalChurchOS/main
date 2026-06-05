import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoSermonCardProps {
  data: {
    id: string;
    title: string;
    speaker: string;
    date: string;
    thumbnailUrl: string;
    cta?: { label: string; url: string };
  };
}

export const ChristoSermonCard: React.FC<ChristoSermonCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { className: 'flex flex-col p-0 overflow-hidden' },
    
    // Thumbnail Image
    React.createElement('img', {
      src: data.thumbnailUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600',
      alt: data.title,
      className: 'w-full h-40 object-cover border-b border-[var(--christo-border)]'
    }),

    // Content container
    React.createElement(
      'div',
      { className: 'p-4 flex-grow flex flex-col justify-between space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-2xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-widest' }, data.speaker),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] line-clamp-1' }, data.title),
        React.createElement('span', { className: 'text-2xs text-[var(--christo-muted)] block' }, new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
      ),

      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = `/church/sermons/${data.id}`; },
            className: 'w-full text-center py-2'
          },
          data.cta?.label || 'Listen / Watch'
        )
      )
    )
  );
};
