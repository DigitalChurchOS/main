import React from 'react';
import { PluginInjectionRenderer } from '../../plugins';

export interface DefaultFooterProps {
  data?: {
    copyrightText?: string;
    sections?: {
      title: string;
      links: { label: string; url: string; openInNewTab?: boolean }[];
    }[];
    socialLinks?: { provider: string; url: string }[];
  };
}

export const DefaultFooter: React.FC<DefaultFooterProps> = ({ data }) => {
  const sections = data?.sections || [];
  const copyright = data?.copyrightText || `© ${new Date().getFullYear()} ChurchOS. All rights reserved.`;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(PluginInjectionRenderer, { point: 'navigation.footer.before' }),
    React.createElement(
      'footer',
      { className: 'bg-slate-50 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 font-sans mt-auto' },
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200' },
        
        // Brand column
        React.createElement(
          'div',
          { className: 'space-y-4' },
          React.createElement('div', { className: 'text-base font-bold text-slate-900' }, 'ChurchOS'),
          React.createElement('p', { className: 'text-xs text-slate-500' }, 'Empowering local congregations with unified cloud solutions.')
        ),
        
        // Dynamic link sections
        sections.map((section) =>
          React.createElement(
            'div',
            { key: section.title, className: 'space-y-3' },
            React.createElement('h4', { className: 'text-xs font-semibold text-slate-800 uppercase tracking-wider' }, section.title),
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
                      className: 'text-xs text-slate-500 hover:text-slate-900 transition'
                    },
                    link.label
                  )
                )
              )
            )
          )
        )
      ),
      
      // Bottom copyright and socials bar
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 space-y-4 md:space-y-0' },
        React.createElement('div', null, copyright),
        React.createElement(
          'div',
          { className: 'flex space-x-6 items-center' },
          React.createElement(PluginInjectionRenderer, { point: 'navigation.footer.extra' }),
          data?.socialLinks?.map((soc) =>
            React.createElement(
              'a',
              {
                key: soc.provider,
                href: soc.url,
                className: 'hover:text-slate-600 transition capitalize'
              },
              soc.provider
            )
          )
        )
      )
    ),
    React.createElement(PluginInjectionRenderer, { point: 'navigation.footer.after' })
  );
};
