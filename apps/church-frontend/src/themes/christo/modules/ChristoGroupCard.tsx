import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoGroupCardProps {
  data: {
    id: string;
    name: string;
    description: string;
    locationGeocoding?: string | any;
    cta?: { label: string; url: string };
  };
}

export const ChristoGroupCard: React.FC<ChristoGroupCardProps> = ({ data }) => {
  let locationAddress = 'Location not specified';
  if (data.locationGeocoding) {
    try {
      const geo = typeof data.locationGeocoding === 'string' 
        ? JSON.parse(data.locationGeocoding) 
        : data.locationGeocoding;
      locationAddress = geo.safeAddress || geo.address || locationAddress;
    } catch (e) {
      // safe fallback
    }
  }

  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-3xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, 'Small Group Fellowship'),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] line-clamp-1' }, data.name),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.description)
      ),

      React.createElement(
        'div',
        { className: 'text-2xs text-[var(--christo-text)] font-semibold flex items-center space-x-1' },
        React.createElement('span', null, '📍'),
        React.createElement('span', null, locationAddress)
      ),

      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = `/church/groups/${data.id}`; },
            className: 'w-full text-center py-1.5'
          },
          data.cta?.label || 'View Fellowship Details'
        )
      )
    )
  );
};
