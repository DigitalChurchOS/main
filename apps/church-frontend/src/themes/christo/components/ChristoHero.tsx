import React from 'react';
import { ChristoButton } from './ChristoButton';

export interface ChristoHeroProps {
  heading: string;
  subheading?: string;
  actionCta?: {
    label: string;
    url: string;
  };
  backgroundImageUrl?: string;
}

export const ChristoHero: React.FC<ChristoHeroProps> = ({
  heading,
  subheading,
  actionCta,
  backgroundImageUrl
}) => {
  return React.createElement(
    'div',
    {
      className: 'relative min-h-[400px] flex items-center justify-center text-center p-8 border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] overflow-hidden shadow-lg'
    },
    // Background image placeholder or url
    backgroundImageUrl && React.createElement(
      'div',
      {
        className: 'absolute inset-0 bg-cover bg-center z-0',
        style: { backgroundImage: `url(${backgroundImageUrl})` }
      }
    ),
    // Gradient / Glow Overlay
    React.createElement('div', { className: 'absolute inset-0 christo-hero-gradient mix-blend-multiply z-10' }),
    React.createElement('div', { className: 'absolute inset-0 bg-stone-900/40 z-10' }),
    
    // Content Container
    React.createElement(
      'div',
      { className: 'relative z-20 max-w-2xl mx-auto space-y-6 text-white' },
      React.createElement('h1', { className: 'text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md' }, heading),
      subheading && React.createElement('p', { className: 'text-lg text-slate-100 drop-shadow' }, subheading),
      actionCta && React.createElement(
        'div',
        { className: 'pt-4 flex justify-center' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = actionCta.url; }
          },
          actionCta.label
        )
      )
    )
  );
};
