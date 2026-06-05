import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoEventCardProps {
  data: {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location: string;
    cta?: { label: string; url: string };
  };
}

export const ChristoEventCard: React.FC<ChristoEventCardProps> = ({ data }) => {
  const dateObj = new Date(data.startDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      
      // Top row info
      React.createElement(
        'div',
        { className: 'flex justify-between items-start' },
        React.createElement(ChristoBadge, { variant: 'accent' }, formattedDate),
        React.createElement('span', { className: 'text-2xs text-[var(--christo-muted)] font-medium' }, formattedTime)
      ),

      // Title & description
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('h4', { className: 'text-base font-bold text-[var(--christo-text)]' }, data.title),
        data.description && React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.description)
      ),

      // Location Info
      React.createElement(
        'div',
        { className: 'text-xs text-[var(--christo-text)] font-semibold flex items-center space-x-1' },
        React.createElement('span', null, '📍'),
        React.createElement('span', null, data.location)
      ),

      // CTA Trigger
      data.cta && React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = `/church/events/${data.id}`; },
            className: 'w-full text-center'
          },
          data.cta.label || 'Register Now'
        )
      )
    )
  );
};
