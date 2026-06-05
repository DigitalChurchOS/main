import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';
import { ChristoButton } from '../components/ChristoButton';

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  author: string;
  prayedCount: number;
}

export interface ChristoPrayerWallProps {
  data?: {
    requests?: PrayerRequest[];
  };
}

export const ChristoPrayerWall: React.FC<ChristoPrayerWallProps> = ({ data }) => {
  const initialRequests: PrayerRequest[] = data?.requests || [
    { id: 'req-1', title: 'Complete healing from upcoming surgery', description: 'Requesting community backing for surgery scheduled this coming Tuesday.', author: 'Anonymous', prayedCount: 14 },
    { id: 'req-2', title: 'Restoration of family unity', description: 'Praying for open communication and reconciliation among siblings.', author: 'David S.', prayedCount: 9 }
  ];

  const [requests, setRequests] = useState<PrayerRequest[]>(initialRequests);
  const [userPrayedList, setUserPrayedList] = useState<string[]>([]);

  const handlePray = (id: string) => {
    if (userPrayedList.includes(id)) return;
    
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, prayedCount: r.prayedCount + 1 } : r))
    );
    setUserPrayedList([...userPrayedList, id]);
  };

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
      requests.map((req) => {
        const hasUserPrayed = userPrayedList.includes(req.id);
        return React.createElement(
          ChristoCard,
          { key: req.id, className: 'flex flex-col justify-between space-y-4' },
          React.createElement(
            'div',
            { className: 'space-y-2' },
            React.createElement(
              'div',
              { className: 'flex justify-between items-center' },
              React.createElement('span', { className: 'text-2xs text-[var(--christo-accent-strong)] font-bold' }, `Submitted by ${req.author}`),
              React.createElement(
                ChristoBadge,
                { variant: 'accent' },
                `🙏 ${req.prayedCount} Prayers`
              )
            ),
            React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)]' }, req.title),
            React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] leading-relaxed' }, req.description)
          ),
          
          React.createElement(
            'div',
            { className: 'pt-2 border-t border-[var(--christo-border)]' },
            React.createElement(
              ChristoButton,
              {
                variant: hasUserPrayed ? 'secondary' : 'primary',
                onClick: () => handlePray(req.id),
                disabled: hasUserPrayed,
                className: 'w-full py-1.5 text-xs'
              },
              hasUserPrayed ? '✓ You Prayed' : 'I Prayed For This'
            )
          )
        );
      })
    )
  );
};
