import React from 'react';
import { LivestreamPlayerContract } from '@churchos/frontend-contracts';

export const DefaultLivestreamPlayer: React.FC<{ data: LivestreamPlayerContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
    
    // Video Container / Status View
    React.createElement(
      'div',
      { className: 'w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center relative' },
      
      data.status === 'live' && data.streamUrl
        ? React.createElement('video', {
            src: data.streamUrl,
            controls: true,
            autoPlay: true,
            className: 'w-full h-full object-contain'
          })
        : data.status === 'countdown'
        ? React.createElement(
            'div',
            { className: 'text-center text-white space-y-3' },
            React.createElement('div', { className: 'text-2xs uppercase tracking-wider text-slate-400 font-semibold' }, 'Live stream starts in'),
            React.createElement('div', { className: 'text-3xl font-mono font-bold' }, data.countdownTarget ? new Date(data.countdownTarget).toLocaleTimeString() : '00:00:00'),
            React.createElement('span', { className: 'text-xs text-slate-500' }, 'Stay tuned!')
          )
        : React.createElement(
            'div',
            { className: 'text-center text-slate-400 space-y-1' },
            React.createElement('span', { className: 'text-3xl' }, '📺'),
            React.createElement('div', { className: 'text-sm font-semibold' }, 'Stream is Offline'),
            React.createElement('div', { className: 'text-xs text-slate-500' }, 'No live broadcast is currently scheduled.')
          )
    ),
    
    // Details & Chat Section
    React.createElement(
      'div',
      { className: 'flex flex-col md:flex-row md:justify-between items-start md:items-center border-t border-slate-200 pt-4 gap-4' },
      React.createElement(
        'div',
        { className: 'space-y-1.5' },
        React.createElement('div', { className: 'flex items-center space-x-2' },
          data.status === 'live' && React.createElement('span', { className: 'px-2 py-0.5 bg-red-600 text-white rounded text-2xs font-extrabold uppercase animate-pulse' }, 'Live'),
          React.createElement('h1', { className: 'text-xl font-bold text-slate-800' }, data.title)
        ),
        React.createElement('p', { className: 'text-xs text-slate-400 font-medium' }, `Chat feature: ${data.chatEnabled ? 'Enabled' : 'Disabled'}`)
      ),
      data.cta && React.createElement(
        'a',
        {
          href: data.cta.url || '#',
          className: 'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition'
        },
        data.cta.label || 'Action'
      )
    )
  );
};
