import React from 'react';
import { PrayerRoomContract } from '@churchos/frontend-contracts';

export const DefaultPrayerRoom: React.FC<{ data: PrayerRoomContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
    React.createElement(
      'div',
      { className: 'w-full min-h-[350px] bg-slate-900 text-white rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 relative' },
      React.createElement('span', { className: 'text-4xl' }, '🙏'),
      React.createElement('h2', { className: 'text-lg font-bold' }, data.title),
      React.createElement('div', { className: 'text-2xs text-slate-400 font-mono' }, `Room ID: ${data.id}`),
      React.createElement(
        'button',
        {
          onClick: () => alert('Connecting to prayer room audio/video...'),
          className: 'px-5 py-2.5 bg-white text-slate-900 rounded-md text-xs font-bold hover:bg-slate-100 transition'
        },
        'Connect Audio & Video'
      ),
      data.chatEnabled && React.createElement('div', { className: 'absolute bottom-4 right-4 bg-slate-800 text-slate-300 px-3 py-1 rounded text-2xs' }, '💬 Live Chat Connected')
    )
  );
};
