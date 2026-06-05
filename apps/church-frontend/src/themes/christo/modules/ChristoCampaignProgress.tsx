import React from 'react';

export interface ChristoCampaignProgressProps {
  data: {
    targetAmount: number;
    raisedAmount: number;
  };
}

export const ChristoCampaignProgress: React.FC<ChristoCampaignProgressProps> = ({ data }) => {
  const percent = Math.min(100, Math.max(0, Math.round((data.raisedAmount / data.targetAmount) * 100)));

  return React.createElement(
    'div',
    { className: 'space-y-1.5' },
    React.createElement(
      'div',
      { className: 'flex justify-between text-3xs text-[var(--christo-muted)] font-semibold' },
      React.createElement('span', null, `$${data.raisedAmount.toLocaleString()} Raised`),
      React.createElement('span', null, `${percent}% of $${data.targetAmount.toLocaleString()} Goal`)
    ),
    React.createElement(
      'div',
      { className: 'h-2 w-full bg-[var(--christo-surface-soft)] rounded-full overflow-hidden' },
      React.createElement('div', { className: 'h-full bg-[var(--christo-accent)] rounded-full transition-all duration-500', style: { width: `${percent}%` } })
    )
  );
};
