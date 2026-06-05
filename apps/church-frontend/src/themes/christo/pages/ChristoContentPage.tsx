import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoSection } from '../components/ChristoSection';

export interface ChristoContentPageProps {
  data?: any;
}

export const ChristoContentPage: React.FC<ChristoContentPageProps> = ({ data }) => {
  if (!data) return React.createElement('div', { className: 'text-center py-8' }, 'No Content Data');

  const title = data.title || data.heading || 'About Us';
  const story = data.story || data.description || '';
  const imageUrl = data.imageUrl || '';
  const email = data.email || '';
  const phone = data.phone || '';
  const address = data.address || '';

  return React.createElement(
    'div',
    { className: 'max-w-4xl mx-auto py-6 space-y-8 animate-fade-in' },
    React.createElement('h1', { className: 'text-3xl font-extrabold tracking-tight text-[var(--christo-text)] border-b border-[var(--christo-border)] pb-4' }, title),
    
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-3 gap-8' },
      // Main Content Column
      React.createElement(
        'div',
        { className: 'md:col-span-2 space-y-6' },
        imageUrl && React.createElement('img', {
          src: imageUrl,
          alt: title,
          className: 'w-full object-cover max-h-[300px] border border-[var(--christo-border)] rounded-[var(--christo-radius-image)] shadow-sm'
        }),
        story && React.createElement('p', { className: 'text-sm text-[var(--christo-text)] leading-relaxed whitespace-pre-line' }, story),
        data.sections && data.sections.map((section: any, idx: number) => {
          return React.createElement(
            'div',
            { key: idx, className: 'space-y-3 pt-4' },
            section.title && React.createElement('h3', { className: 'text-lg font-bold text-[var(--christo-text)]' }, section.title),
            React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, JSON.stringify(section.blocks || section.properties))
          );
        })
      ),

      // Sidebar Column for contact info if present
      React.createElement(
        'div',
        { className: 'space-y-6' },
        (email || phone || address) ? React.createElement(
          ChristoCard,
          { highlighted: true },
          React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] uppercase tracking-wider mb-4 border-b border-[var(--christo-border)] pb-2' }, 'Information'),
          React.createElement(
            'ul',
            { className: 'space-y-3 text-xs' },
            email && React.createElement('li', null, React.createElement('span', { className: 'font-semibold text-[var(--christo-muted)] block' }, 'Email:'), React.createElement('a', { href: `mailto:${email}`, className: 'text-[var(--christo-link)] hover:underline font-medium' }, email)),
            phone && React.createElement('li', null, React.createElement('span', { className: 'font-semibold text-[var(--christo-muted)] block' }, 'Phone:'), React.createElement('span', { className: 'font-medium' }, phone)),
            address && React.createElement('li', null, React.createElement('span', { className: 'font-semibold text-[var(--christo-muted)] block' }, 'Address:'), React.createElement('span', { className: 'font-medium' }, address))
          )
        ) : React.createElement(
          ChristoCard,
          null,
          React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] uppercase tracking-wider mb-2' }, 'Connect'),
          React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] mb-4' }, 'We would love to connect with you. Reach out to our ministry leaders.'),
          React.createElement('a', { href: '/church/contact', className: 'text-xs font-bold text-[var(--christo-accent-strong)] hover:underline' }, 'Contact Directory →')
        )
      )
    )
  );
};
