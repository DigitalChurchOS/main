import React from 'react';

export interface LivestreamChatSlotContract {
  chatUrl?: string;
  chatEnabled?: boolean;
}

export const ChristoLivestreamChat: React.FC<{ data: LivestreamChatSlotContract }> = ({ data }) => {
  if (data?.chatEnabled === false) {
    return React.createElement(
      'div',
      { className: 'p-6 bg-[var(--christo-surface-soft)] border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] text-center text-[var(--christo-muted)] font-medium text-xs' },
      'Live chat is disabled for this broadcast.'
    );
  }

  const url = data?.chatUrl || 'https://www.youtube.com/live_chat?v=demo&embed_domain=' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost');

  return React.createElement(
    'div',
    { className: 'flex flex-col h-[500px] w-full border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] overflow-hidden shadow-sm font-sans bg-[var(--christo-surface)]' },
    
    // Chat Header with accent background
    React.createElement(
      'div',
      { className: 'px-4 py-3 bg-[var(--christo-accent-strong)] text-[var(--christo-accent-foreground)] flex items-center justify-between' },
      React.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        React.createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' }),
        React.createElement('span', { className: 'text-xs font-semibold' }, 'Live Chat Room')
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
