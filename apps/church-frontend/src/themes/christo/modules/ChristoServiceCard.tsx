import React from 'react';
import { ChristoCard } from '../components/ChristoCard';

export interface ChristoServiceCardProps {
  data: {
    id: string;
    title: string;
    description: string;
    time: string;
  };
}

export const ChristoServiceCard: React.FC<ChristoServiceCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-3xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, 'Service Times'),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)]' }, data.title),
        React.createElement('span', { className: 'text-xs text-[var(--christo-accent)] font-bold block' }, data.time),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, data.description)
      )
    )
  );
};
