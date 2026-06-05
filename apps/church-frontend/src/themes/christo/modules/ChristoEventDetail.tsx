import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';
import { RenderSlot } from '../../../rendering/core/render-slot';

export interface ChristoEventDetailProps {
  data: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    pricingType?: 'free' | 'paid';
    price?: number;
    locationType?: 'physical' | 'online';
    location: string;
  };
}

export const ChristoEventDetail: React.FC<ChristoEventDetailProps> = ({ data }) => {
  const startObj = new Date(data.startDate);
  const formattedDate = startObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formattedTime = startObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      ChristoCard,
      { highlighted: true },
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement(
          'div',
          { className: 'flex flex-wrap gap-2 items-center' },
          React.createElement(ChristoBadge, { variant: 'accent' }, data.pricingType === 'free' ? 'Free Event' : `$${data.price || 0}`),
          React.createElement(ChristoBadge, { variant: 'accent' }, data.locationType === 'online' ? 'Online' : 'Physical In-person')
        ),
        React.createElement('h1', { className: 'text-2xl font-black text-[var(--christo-text)]' }, data.title),
        React.createElement(
          'div',
          { className: 'border-y border-[var(--christo-border)] py-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-[var(--christo-text)]' },
          React.createElement('div', null, '📅 ', formattedDate, ' @ ', formattedTime),
          React.createElement('div', null, '📍 ', data.location)
        ),
        React.createElement('p', { className: 'text-sm text-[var(--christo-muted)] leading-relaxed whitespace-pre-line' }, data.description)
      )
    ),
    // Embedded registration form slot
    React.createElement(
      'div',
      { className: 'max-w-xl mx-auto space-y-4' },
      React.createElement('h3', { className: 'text-base font-bold text-[var(--christo-text)]' }, 'Event RSVP Registration'),
      React.createElement(RenderSlot, {
        slotKey: 'event.registrationForm',
        contractData: { eventId: data.id, eventTitle: data.title },
        moduleKey: 'events-registration'
      })
    )
  );
};
