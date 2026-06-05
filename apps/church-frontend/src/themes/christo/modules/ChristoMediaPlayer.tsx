import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';

export interface ChristoMediaPlayerProps {
  data: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    type: string;
    sourceUrl?: string;
  };
}

export const ChristoMediaPlayer: React.FC<ChristoMediaPlayerProps> = ({ data }) => {
  const [playing, setPlaying] = useState(false);

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      'div',
      { className: 'relative w-full aspect-video bg-stone-900 border border-[var(--christo-border)] rounded-[var(--christo-radius-image)] overflow-hidden shadow-lg flex items-center justify-center' },
      !playing ? React.createElement(
        React.Fragment,
        null,
        React.createElement('img', {
          src: data.thumbnailUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200',
          alt: data.title,
          className: 'absolute inset-0 w-full h-full object-cover opacity-60'
        }),
        React.createElement(
          'button',
          {
            onClick: () => setPlaying(true),
            className: 'w-16 h-16 rounded-full bg-[var(--christo-accent)] text-white hover:bg-[var(--christo-accent-strong)] flex items-center justify-center shadow-lg transition transform hover:scale-105 z-10 font-bold text-xl'
          },
          '▶'
        )
      ) : React.createElement(
        'div',
        { className: 'w-full h-full flex items-center justify-center bg-stone-950 p-4 text-white z-10 font-bold text-xs' },
        `🎥 Playing Media Stream: ${data.title}`
      )
    ),
    React.createElement(
      ChristoCard,
      null,
      React.createElement(
        'div',
        { className: 'space-y-2' },
        React.createElement(
          'div',
          { className: 'flex justify-between items-center' },
          React.createElement('h3', { className: 'text-lg font-black text-[var(--christo-text)]' }, data.title),
          React.createElement(ChristoBadge, { variant: 'accent' }, data.type)
        ),
        React.createElement('p', { className: 'text-sm text-[var(--christo-muted)]' }, data.description)
      )
    )
  );
};
