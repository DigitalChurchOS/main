import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoGroupDetailProps {
  data: {
    id: string;
    name: string;
    description: string;
    locationGeocoding?: string | any;
  };
}

export const ChristoGroupDetail: React.FC<ChristoGroupDetailProps> = ({ data }) => {
  const [joined, setJoined] = useState(false);
  
  let locationAddress = 'Location details upon joining';
  if (data.locationGeocoding) {
    try {
      const geo = typeof data.locationGeocoding === 'string' 
        ? JSON.parse(data.locationGeocoding) 
        : data.locationGeocoding;
      locationAddress = geo.address || locationAddress;
    } catch (e) {
      // safe fallback
    }
  }

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      ChristoCard,
      { highlighted: true },
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement('span', { className: 'text-2xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, 'Fellowship Group Details'),
        React.createElement('h1', { className: 'text-2xl font-black text-[var(--christo-text)]' }, data.name),
        React.createElement('p', { className: 'text-sm text-[var(--christo-muted)] leading-relaxed' }, data.description),
        
        React.createElement(
          'div',
          { className: 'border-y border-[var(--christo-border)] py-3 space-y-2 text-xs font-semibold text-[var(--christo-text)]' },
          React.createElement('div', null, '📅 Meets weekly on Wednesday evenings at 7:00 PM'),
          React.createElement('div', null, '📍 Address: ', locationAddress)
        ),

        React.createElement(
          'div',
          { className: 'pt-2 flex justify-start' },
          React.createElement(
            ChristoButton,
            {
              variant: joined ? 'secondary' : 'primary',
              onClick: () => setJoined(!joined)
            },
            joined ? '✓ Joined Fellowship' : 'Join Small Group'
          )
        )
      )
    )
  );
};
