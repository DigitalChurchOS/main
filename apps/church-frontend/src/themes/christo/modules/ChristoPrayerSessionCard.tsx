import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoPrayerSessionCardProps {
  data: {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    cta?: { label: string; url: string };
  };
}

export const ChristoPrayerSessionCard: React.FC<ChristoPrayerSessionCardProps> = ({ data }) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  const dateStr = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center' },
        React.createElement(ChristoBadge, { variant: 'accent' }, 'Corporate Prayer'),
        React.createElement('span', { className: 'text-2xs text-[var(--christo-muted)] font-semibold' }, dateStr)
      ),
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)]' }, data.title),
        React.createElement('span', { className: 'text-2xs text-[var(--christo-muted)] block font-semibold' }, timeStr),
        data.description && React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.description)
      ),
      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = data.cta?.url || `/church/prayer/session/${data.id}`; },
            className: 'w-full py-2'
          },
          data.cta?.label || 'Join Prayer Session'
        )
      )
    )
  );
};
