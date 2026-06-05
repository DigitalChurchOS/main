import React from 'react';
import { CampaignProgressContract } from '@churchos/frontend-contracts';

export const DefaultCampaignProgress: React.FC<{ data: CampaignProgressContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-sans' },
    React.createElement('h3', { className: 'text-xs font-bold text-slate-700 uppercase tracking-wider' }, 'Campaign Progress'),
    React.createElement(
      'div',
      { className: 'space-y-1' },
      React.createElement(
        'div',
        { className: 'flex justify-between text-2xs font-semibold text-slate-500' },
        React.createElement('span', null, `$${data.currentAmount.toLocaleString()} raised of $${data.targetAmount.toLocaleString()}`),
        React.createElement('span', null, `${data.percentComplete}%`)
      ),
      React.createElement(
        'div',
        { className: 'w-full bg-slate-200 h-2 rounded-full overflow-hidden' },
        React.createElement('div', {
          style: { width: `${data.percentComplete}%` },
          className: 'bg-slate-900 h-full rounded-full transition-all duration-500'
        })
      ),
      data.donorsCount !== undefined && React.createElement('div', { className: 'text-3xs text-slate-400 font-medium pt-1' }, `Supported by ${data.donorsCount} donors`)
    )
  );
};
