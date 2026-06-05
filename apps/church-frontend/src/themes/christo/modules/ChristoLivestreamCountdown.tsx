import React, { useEffect, useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoBadge } from '../components/ChristoBadge';

export interface ChristoLivestreamCountdownProps {
  data: {
    scheduledAt: string;
    title: string;
  };
}

export const ChristoLivestreamCountdown: React.FC<ChristoLivestreamCountdownProps> = ({ data }) => {
  const targetDate = new Date(data.scheduledAt);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 15, seconds: 0 });

  useEffect(() => {
    // Dynamic countdown logic matching remaining time
    const interval = setInterval(() => {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        clearInterval(interval);
        return;
      }
      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
    }, 1000);

    return () => clearInterval(interval);
  }, [data.scheduledAt]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return React.createElement(
    'div',
    { className: 'space-y-4 animate-fade-in' },
    React.createElement(
      'div',
      { className: 'relative w-full aspect-video bg-stone-900 rounded-[var(--christo-radius-image)] overflow-hidden shadow-2xl flex flex-col items-center justify-center border border-[var(--christo-border)] space-y-4 text-white' },
      React.createElement(ChristoBadge, { variant: 'accent' }, 'Upcoming Service'),
      React.createElement('h3', { className: 'text-lg font-black tracking-tight drop-shadow' }, data.title),
      
      // Timer blocks
      React.createElement(
        'div',
        { className: 'flex space-x-3 text-2xl font-extrabold text-[var(--christo-accent)] drop-shadow-md' },
        React.createElement('div', null, pad(timeLeft.hours), React.createElement('span', { className: 'text-3xs text-slate-400 block text-center mt-1 font-semibold' }, 'HRS')),
        React.createElement('span', null, ':'),
        React.createElement('div', null, pad(timeLeft.minutes), React.createElement('span', { className: 'text-3xs text-slate-400 block text-center mt-1 font-semibold' }, 'MINS')),
        React.createElement('span', null, ':'),
        React.createElement('div', null, pad(timeLeft.seconds), React.createElement('span', { className: 'text-3xs text-slate-400 block text-center mt-1 font-semibold' }, 'SECS'))
      )
    ),
    React.createElement(
      ChristoCard,
      null,
      React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] font-medium text-center' }, `Broadcasting starts scheduled at ${targetDate.toLocaleString()}.`)
    )
  );
};
