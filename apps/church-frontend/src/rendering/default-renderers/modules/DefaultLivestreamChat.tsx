import React from 'react';

export interface LivestreamChatSlotContract {
  chatUrl?: string;
  chatEnabled?: boolean;
}

export const DefaultLivestreamChat: React.FC<{ data: LivestreamChatSlotContract }> = ({ data }) => {
  if (data?.chatEnabled === false) {
    return React.createElement(
      'div',
      { className: 'p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 font-sans' },
      'Chat is disabled for this broadcast.'
    );
  }

  const url = data?.chatUrl || 'https://www.youtube.com/live_chat?v=demo&embed_domain=' + window.location.hostname;

  return React.createElement(
    'div',
    { className: 'flex flex-col h-[500px] w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans bg-white' },
    
    // Chat Header
    React.createElement(
      'div',
      { className: 'px-4 py-3 bg-slate-900 text-white flex items-center justify-between' },
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' }),
        React.createElement('span', { className: 'text-xs font-semibold' }, 'Live Chat')
      )
    ),

    // Chat Frame
    React.createElement('iframe', {
      src: url,
      className: 'w-full flex-1 border-none',
      title: 'Livestream Chat',
      sandbox: 'allow-scripts allow-same-origin allow-popups'
    })
  );
};
