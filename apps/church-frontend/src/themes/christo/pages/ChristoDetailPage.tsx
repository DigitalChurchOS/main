import React from 'react';

export interface ChristoDetailPageProps {
  title: string;
  children: React.ReactNode;
}

export const ChristoDetailPage: React.FC<ChristoDetailPageProps> = ({ title, children }) => {
  return React.createElement(
    'div',
    { className: 'max-w-3xl mx-auto py-6 space-y-4 animate-fade-in' },
    React.createElement('h2', { className: 'text-2xl font-bold tracking-tight text-[var(--christo-text)]' }, title),
    children
  );
};
