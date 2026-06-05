import React from 'react';

export interface ChristoAnnouncementBarProps {
  data?: {
    text: string;
    ctaUrl?: string;
    ctaLabel?: string;
    isActive: boolean;
  };
}

export const ChristoAnnouncementBar: React.FC<ChristoAnnouncementBarProps> = ({ data }) => {
  if (!data || !data.isActive) return null;

  return React.createElement(
    'div',
    {
      className: 'w-full py-2.5 px-4 text-center text-xs font-semibold bg-[var(--christo-accent-soft)] text-[var(--christo-accent-strong)] flex items-center justify-center space-x-2 border-b border-[var(--christo-accent-muted)]'
    },
    React.createElement('span', null, data.text),
    data.ctaUrl && React.createElement(
      'a',
      {
        href: data.ctaUrl,
        className: 'underline hover:text-[var(--christo-accent)] transition font-bold ml-1'
      },
      data.ctaLabel || 'Learn More'
    )
  );
};
