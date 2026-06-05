import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';

export interface ChristoPluginCardProps {
  data: any;
  context: any;
}

export const ChristoPluginCard: React.FC<ChristoPluginCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: true, className: 'flex flex-col justify-between h-full space-y-4' },
    React.createElement(
      'div',
      { className: 'space-y-3' },
      React.createElement(ChristoBadge, { variant: 'accent' }, 'Extension Card'),
      React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, data?.title || 'Plugin Feature'),
      React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-3' }, data?.summary || 'Extension content details.')
    ),
    data?.cta && React.createElement(
      'a',
      {
        href: data.cta.url || '#',
        className: 'text-xs font-bold text-[var(--christo-accent-strong)] hover:underline inline-block'
      },
      `${data.cta.label || 'Learn More'} →`
    )
  );
};
export default ChristoPluginCard;
