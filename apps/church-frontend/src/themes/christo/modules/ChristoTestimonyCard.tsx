import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';

export interface ChristoTestimonyCardProps {
  data: {
    id: string;
    title: string;
    content: string;
    authorName?: string;
    isFeatured?: boolean;
  };
}

export const ChristoTestimonyCard: React.FC<ChristoTestimonyCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: data.isFeatured },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center' },
        React.createElement(ChristoBadge, { variant: 'accent' }, 'Answered Prayer'),
        data.isFeatured && React.createElement('span', { className: 'text-3xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, '⭐ Featured')
      ),
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)]' }, data.title),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] italic leading-relaxed' }, `"${data.content}"`)
      ),
      data.authorName && React.createElement(
        'div',
        { className: 'text-2xs text-[var(--christo-text)] font-bold pt-2 border-t border-[var(--christo-border)]' },
        `— ${data.authorName}`
      )
    )
  );
};
