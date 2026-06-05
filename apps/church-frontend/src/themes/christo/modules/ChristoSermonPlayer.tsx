import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoSermonPlayerProps {
  data: {
    id: string;
    title: string;
    speaker: string;
    date: string;
    description: string;
    thumbnailUrl: string;
    sourceUrl?: string;
    durationSeconds?: number;
    bibleReferences?: string[];
  };
}

export const ChristoSermonPlayer: React.FC<ChristoSermonPlayerProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25); // Mock 25% completed

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    
    // Player interface
    React.createElement(
      'div',
      { className: 'relative w-full aspect-video bg-stone-900 border border-[var(--christo-border)] rounded-[var(--christo-radius-image)] overflow-hidden shadow-lg flex items-center justify-center' },
      
      !isPlaying ? React.createElement(
        React.Fragment,
        null,
        React.createElement('img', {
          src: data.thumbnailUrl || 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200',
          alt: data.title,
          className: 'absolute inset-0 w-full h-full object-cover opacity-60 z-0'
        }),
        React.createElement(
          'button',
          {
            onClick: () => setIsPlaying(true),
            className: 'w-16 h-16 rounded-full bg-[var(--christo-accent)] text-white hover:bg-[var(--christo-accent-strong)] flex items-center justify-center shadow-lg transition transform hover:scale-105 z-10 font-bold text-xl'
          },
          '▶'
        )
      ) : React.createElement(
        'div',
        { className: 'w-full h-full flex flex-col justify-end bg-stone-950 p-4 z-10 space-y-4' },
        React.createElement('p', { className: 'text-white text-xs font-semibold self-center' }, '📺 Playing Sermon Stream...'),
        
        // Progress Slider
        React.createElement(
          'div',
          { className: 'space-y-1' },
          React.createElement(
            'div',
            { className: 'h-1.5 w-full bg-slate-800 rounded-full overflow-hidden' },
            React.createElement('div', { className: 'h-full bg-[var(--christo-accent)] rounded-full', style: { width: `${progress}%` } })
          ),
          React.createElement(
            'div',
            { className: 'flex justify-between text-3xs text-slate-400 font-semibold' },
            React.createElement('span', null, '12:30'),
            React.createElement('span', null, data.durationSeconds ? `${Math.floor(data.durationSeconds / 60)}:00` : '30:00')
          )
        ),

        // Controls
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement(
            'button',
            { onClick: () => setIsPlaying(false), className: 'text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded' },
            '⏸ Pause'
          ),
          React.createElement('span', { className: 'text-3xs text-slate-400 font-bold' }, 'Vol 100% 🔊')
        )
      )
    ),

    // Info details Card
    React.createElement(
      ChristoCard,
      null,
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement(
          'div',
          { className: 'flex flex-wrap gap-2 justify-between items-center' },
          React.createElement(
            'div',
            { className: 'space-y-0.5' },
            React.createElement('span', { className: 'text-2xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-widest' }, data.speaker),
            React.createElement('h3', { className: 'text-lg font-black text-[var(--christo-text)]' }, data.title)
          ),
          React.createElement(ChristoBadge, { variant: 'accent' }, new Date(data.date).toLocaleDateString())
        ),
        
        // Bible References
        data.bibleReferences && data.bibleReferences.length > 0 && React.createElement(
          'div',
          { className: 'space-y-2' },
          React.createElement('h5', { className: 'text-xs font-bold text-[var(--christo-text)] uppercase tracking-wider' }, 'Scripture Readings'),
          React.createElement(
            'div',
            { className: 'flex flex-wrap gap-1.5' },
            data.bibleReferences.map((ref) =>
              React.createElement(ChristoBadge, { key: ref, variant: 'accent', className: 'text-xs font-medium' }, `📖 ${ref}`)
            )
          )
        ),

        React.createElement('p', { className: 'text-sm text-[var(--christo-muted)] leading-relaxed' }, data.description)
      )
    )
  );
};
