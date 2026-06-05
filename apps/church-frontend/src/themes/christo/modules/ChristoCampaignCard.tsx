import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';
import { RenderSlot } from '../../../rendering/core/render-slot';

export interface ChristoCampaignCardProps {
  data: {
    id: string;
    title: string;
    description: string;
    targetAmount: number;
    raisedAmount: number;
    cta?: { label: string; url: string };
  };
}

export const ChristoCampaignCard: React.FC<ChristoCampaignCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-3xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, 'Faith Initiative'),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)]' }, data.title),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.description)
      ),

      // Progress bar using campaign progress slot
      React.createElement(RenderSlot, {
        slotKey: 'campaign.progress',
        contractData: { targetAmount: data.targetAmount, raisedAmount: data.raisedAmount },
        moduleKey: 'giving-tithes'
      }),

      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = data.cta?.url || '/church/giving'; },
            className: 'w-full text-center py-1.5'
          },
          data.cta?.label || 'Support Campaign'
        )
      )
    )
  );
};
