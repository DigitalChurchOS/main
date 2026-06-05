import React from 'react';
import { PluginInjectionRenderer } from '../../../rendering/plugins';
import { ChristoButton } from '../components/ChristoButton';
import { ChristoInput } from '../components/ChristoFormControls';

export interface ChristoFooterProps {
  data?: {
    copyrightText?: string;
    sections?: {
      title: string;
      links: { label: string; url: string; openInNewTab?: boolean }[];
    }[];
    socialLinks?: { provider: string; url: string }[];
    secondaryLinks?: { label: string; url: string }[];
  };
}

export const ChristoFooter: React.FC<ChristoFooterProps> = ({ data }) => {
  const sections = data?.sections || [
    {
      title: 'Ministries',
      links: [
        { label: 'Youth Ministry', url: '#' },
        { label: 'Small Groups', url: '/church/groups' },
        { label: 'LMS Courses', url: '/church/courses' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Sermons', url: '/church/sermons' },
        { label: 'Events Schedule', url: '/church/events' },
        { label: 'Online Prayer Wall', url: '/church/prayer' }
      ]
    }
  ];

  const copyright = data?.copyrightText || `© ${new Date().getFullYear()} Christo Premium Theme. All rights reserved.`;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(PluginInjectionRenderer, { point: 'navigation.footer.before' }),
    React.createElement(
      'footer',
      { className: 'bg-[var(--christo-surface)] border-t border-[var(--christo-border)] py-12 px-4 sm:px-6 lg:px-8 mt-auto relative z-10 transition-colors' },
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[var(--christo-border)]' },
        
        // Brand & Service Info column
        React.createElement(
          'div',
          { className: 'space-y-4' },
          React.createElement('div', { className: 'text-lg font-black text-[var(--christo-text)] tracking-tight' }, '⛪ Christo Theme'),
          React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, 'Join us for Sunday Services in-person or online at 9:00 AM & 11:00 AM.'),
          React.createElement('p', { className: 'text-xs font-semibold text-[var(--christo-accent-strong)]' }, '📍 100 Grace Way, Faith City')
        ),
        
        // Dynamic / fallback sections
        sections.map((section) =>
          React.createElement(
            'div',
            { key: section.title, className: 'space-y-3' },
            React.createElement('h4', { className: 'text-xs font-bold text-[var(--christo-text)] uppercase tracking-widest border-l-2 border-[var(--christo-accent)] pl-2' }, section.title),
            React.createElement(
              'ul',
              { className: 'space-y-2' },
              section.links.map((link) =>
                React.createElement(
                  'li',
                  { key: link.label },
                  React.createElement(
                    'a',
                    {
                      href: link.url,
                      target: link.openInNewTab ? '_blank' : undefined,
                      className: 'text-xs text-[var(--christo-muted)] hover:text-[var(--christo-accent)] transition font-medium'
                    },
                    link.label
                  )
                )
              )
            )
          )
        ),

        // Newsletter / Subscription Column
        React.createElement(
          'div',
          { className: 'space-y-3' },
          React.createElement('h4', { className: 'text-xs font-bold text-[var(--christo-text)] uppercase tracking-widest border-l-2 border-[var(--christo-accent)] pl-2' }, 'Get Updates'),
          React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, 'Subscribe to our weekly news bulletin.'),
          React.createElement(
            'form',
            {
              onSubmit: (e: React.FormEvent) => { e.preventDefault(); alert('Subscribed!'); },
              className: 'space-y-2'
            },
            React.createElement(ChristoInput, {
              type: 'email',
              placeholder: 'name@church.org',
              required: true,
              className: 'py-1.5'
            }),
            React.createElement(
              ChristoButton,
              {
                variant: 'primary',
                type: 'submit',
                className: 'w-full py-1.5'
              },
              'Subscribe'
            )
          )
        )
      ),
      
      // Bottom Bar
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--christo-muted)] space-y-4 md:space-y-0' },
        React.createElement('div', { className: 'font-medium' }, copyright),
        React.createElement(
          'div',
          { className: 'flex space-x-6 items-center font-semibold' },
          React.createElement(PluginInjectionRenderer, { point: 'navigation.footer.extra' }),
          data?.socialLinks?.map((soc) =>
            React.createElement(
              'a',
              {
                key: soc.provider,
                href: soc.url,
                className: 'hover:text-[var(--christo-accent)] transition capitalize'
              },
              soc.provider
            )
          ) || React.createElement(
            React.Fragment,
            null,
            React.createElement('a', { href: '#', className: 'hover:text-[var(--christo-accent)] transition' }, 'Facebook'),
            React.createElement('a', { href: '#', className: 'hover:text-[var(--christo-accent)] transition' }, 'YouTube')
          )
        )
      )
    ),
    React.createElement(PluginInjectionRenderer, { point: 'navigation.footer.after' })
  );
};
