import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoBlogArticleCardProps {
  data: {
    id: string;
    title: string;
    summary?: string;
    readTime?: string;
    publishedDate?: string;
    cta?: { label: string; url: string };
  };
}

export const ChristoBlogArticleCard: React.FC<ChristoBlogArticleCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-3xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, data.readTime || '5 Min Read'),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] line-clamp-1' }, data.title),
        data.summary && React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.summary)
      ),
      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = data.cta?.url || '#'; },
            className: 'w-full text-center py-1.5 text-xs'
          },
          data.cta?.label || 'Read Article'
        )
      )
    )
  );
};
