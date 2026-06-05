import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';

export interface ChristoLivestreamPlayerProps {
  data: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
}

export const ChristoLivestreamPlayer: React.FC<ChristoLivestreamPlayerProps> = ({ data }) => {
  return React.createElement(
    'div',
    { className: 'space-y-4 animate-fade-in' },
    React.createElement(
      'div',
      { className: 'relative w-full aspect-video bg-black rounded-[var(--christo-radius-image)] overflow-hidden shadow-2xl flex items-center justify-center border border-[var(--christo-border)]' },
      React.createElement(
        'div',
        { className: 'absolute top-4 left-4 z-20' },
        React.createElement(ChristoBadge, { variant: 'live' }, '● LIVE')
      ),
      React.createElement(
        'div',
        { className: 'text-center text-white z-10 font-bold space-y-2' },
        React.createElement('div', { className: 'text-lg' }, '📺 Livestream Broadcast Active'),
        React.createElement('p', { className: 'text-xs text-slate-400 font-medium' }, 'Connected to ingest server')
      )
    ),
    React.createElement(
      ChristoCard,
      null,
      React.createElement('h3', { className: 'text-lg font-black text-[var(--christo-text)]' }, data.title),
      React.createElement('p', { className: 'text-sm text-[var(--christo-muted)] mt-2' }, data.description)
    )
  );
};
