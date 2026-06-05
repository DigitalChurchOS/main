import React from 'react';

export interface ChristoMemberPageProps {
  title?: string;
  children: React.ReactNode;
}

export const ChristoMemberPage: React.FC<ChristoMemberPageProps> = ({ title = 'Member Area', children }) => {
  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      'div',
      { className: 'border-b border-[var(--christo-border)] pb-4 flex justify-between items-center' },
      React.createElement('h2', { className: 'text-2xl font-black text-[var(--christo-text)]' }, title),
      React.createElement('span', { className: 'text-xs px-2.5 py-1 bg-[var(--christo-accent-soft)] text-[var(--christo-accent-strong)] rounded-full font-bold' }, 'Active Member')
    ),
    children
  );
};
