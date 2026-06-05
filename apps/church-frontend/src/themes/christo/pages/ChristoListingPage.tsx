import React from 'react';

export interface ChristoListingPageProps {
  title: string;
  children: React.ReactNode;
}

export const ChristoListingPage: React.FC<ChristoListingPageProps> = ({ title, children }) => {
  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement('h2', { className: 'text-2xl font-bold tracking-tight text-[var(--christo-text)] capitalize' }, title),
    children
  );
};
