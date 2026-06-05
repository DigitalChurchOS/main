import React from 'react';

export interface DefaultAnnouncementBarProps {
  data?: {
    text: string;
    ctaUrl?: string;
    ctaLabel?: string;
    isActive: boolean;
  };
}

export const DefaultAnnouncementBar: React.FC<DefaultAnnouncementBarProps> = ({ data }) => {
  if (!data || !data.isActive) return null;

  return React.createElement(
    'div',
    { className: 'bg-slate-900 text-white py-2 px-4 text-center text-xs font-sans font-medium flex items-center justify-center space-x-2' },
    React.createElement('span', null, data.text),
    data.ctaUrl && React.createElement(
      'a',
      {
        href: data.ctaUrl,
        className: 'underline text-slate-350 hover:text-white transition ml-1'
      },
      data.ctaLabel || 'Learn More'
    )
  );
};
