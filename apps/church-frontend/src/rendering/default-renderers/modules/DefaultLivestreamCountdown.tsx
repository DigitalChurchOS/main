import React, { useEffect, useState } from 'react';

export interface LivestreamCountdownContract {
  title: string;
  countdownTarget?: string; // ISO timestamp
  scheduledTime?: string; // Display time string
  thumbnailUrl?: string;
}

export const DefaultLivestreamCountdown: React.FC<{ data: LivestreamCountdownContract }> = ({ data }) => {
  if (!data) return null;

  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  useEffect(() => {
    if (!data.countdownTarget) return;

    const targetTime = new Date(data.countdownTarget).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data.countdownTarget]);

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
    
    // Video Area Placeholder with Countdown Overlaid
    React.createElement(
      'div',
      { className: 'w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center relative' },
      
      data.thumbnailUrl && React.createElement('img', {
        src: data.thumbnailUrl,
        className: 'absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none'
      }),

      React.createElement(
        'div',
        { className: 'text-center text-white space-y-4 z-10 p-6' },
        React.createElement('div', { className: 'text-xs uppercase tracking-widest text-slate-400 font-semibold' }, 'Live stream starts in'),
        React.createElement('div', { className: 'text-5xl md:text-6xl font-mono font-bold tracking-tight text-white drop-shadow-sm' }, timeLeft),
        React.createElement(
          'div',
          { className: 'text-sm text-slate-300' },
          data.scheduledTime ? `Scheduled for: ${data.scheduledTime}` : 'Coming up next'
        )
      )
    ),
    
    // Details
    React.createElement(
      'div',
      { className: 'border-t border-slate-200 pt-4' },
      React.createElement('h1', { className: 'text-xl font-bold text-slate-800' }, data.title)
    )
  );
};
