import React, { useState } from 'react';
import { NavigationMenuContract } from '@churchos/frontend-contracts';
import { PluginInjectionRenderer } from '../../plugins';

export interface DefaultMobileNavProps {
  data?: NavigationMenuContract;
}

export const DefaultMobileNav: React.FC<DefaultMobileNavProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const items = data?.items || [];

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(PluginInjectionRenderer, { point: 'navigation.mobile.before' }),
    React.createElement(
      'div',
      { className: 'md:hidden font-sans' },
      React.createElement(
        'button',
        {
          onClick: () => setIsOpen(!isOpen),
          className: 'p-2 text-slate-600 hover:text-slate-900 focus:outline-none'
        },
        isOpen ? '✕ Close' : '☰ Menu'
      ),
      isOpen && React.createElement(
        'div',
        { className: 'absolute top-16 left-0 right-0 bg-white border-b border-slate-200 z-50 p-4 space-y-3' },
        items.map(item =>
          React.createElement(
            'div',
            { key: item.label, className: 'space-y-1' },
            React.createElement(
              'a',
              {
                href: item.url,
                className: 'block font-semibold text-slate-800 text-sm py-1.5'
              },
              item.label
            ),
            item.children?.map(child =>
              React.createElement(
                'a',
                {
                  key: child.label,
                  href: child.url,
                  className: 'block text-xs text-slate-500 pl-4 py-1 hover:text-slate-900'
                },
                child.label
              )
            )
          )
        ),
        React.createElement(PluginInjectionRenderer, { point: 'navigation.mobile.extra' })
      )
    ),
    React.createElement(PluginInjectionRenderer, { point: 'navigation.mobile.after' })
  );
};
