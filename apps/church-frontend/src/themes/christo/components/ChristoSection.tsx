import React from 'react';

export interface ChristoSectionProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  withBlobs?: boolean;
  className?: string;
}

export const ChristoSection: React.FC<ChristoSectionProps> = ({
  title,
  subtitle,
  children,
  withBlobs = false,
  className = ''
}) => {
  return React.createElement(
    'section',
    {
      className: `py-10 px-4 md:px-8 border-b border-[var(--christo-border)] last:border-b-0 relative overflow-hidden ${className}`
    },
    withBlobs && React.createElement(
      React.Fragment,
      null,
      React.createElement('div', { className: 'christo-blob-1' }),
      React.createElement('div', { className: 'christo-blob-2' })
    ),
    React.createElement(
      'div',
      { className: 'max-w-7xl mx-auto relative z-10' },
      (title || subtitle) && React.createElement(
        'div',
        { className: 'mb-8 space-y-2' },
        title && React.createElement('h3', { className: 'text-2xl font-bold tracking-tight text-[var(--christo-text)]' }, title),
        subtitle && React.createElement('p', { className: 'text-sm text-[var(--christo-muted)]' }, subtitle)
      ),
      children
    )
  );
};
