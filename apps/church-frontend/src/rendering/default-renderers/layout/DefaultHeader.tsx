import React, { useState } from 'react';
import { NavigationMenuContract } from '@churchos/frontend-contracts';
import { PluginInjectionRenderer } from '../../plugins';

export interface DefaultHeaderProps {
  data?: NavigationMenuContract;
}

export const DefaultHeader: React.FC<DefaultHeaderProps> = ({ data }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const menuItems = data?.items || [];

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(PluginInjectionRenderer, { point: 'navigation.header.before' }),
    React.createElement(
      'header',
      { className: 'w-full bg-white border-b border-slate-200 sticky top-0 z-40 font-sans' },
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between' },
        
        // Brand Logo
        React.createElement(
          'a',
          { href: '/', className: 'flex items-center space-x-2' },
          React.createElement('span', { className: 'text-lg font-extrabold text-slate-900 tracking-tight' }, 'ChurchOS')
        ),
        
        // Navigation Menu Items
        React.createElement(
          'nav',
          { className: 'hidden md:flex space-x-8 h-full items-center' },
          menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            
            if (hasChildren) {
              return React.createElement(
                'div',
                { key: item.label, className: 'relative' },
                React.createElement(
                  'button',
                  {
                    onClick: () => setOpenDropdown(openDropdown === item.label ? null : item.label),
                    className: 'text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1 focus:outline-none'
                  },
                  React.createElement('span', null, item.label),
                  React.createElement('span', { className: 'text-xs text-slate-400' }, '▼')
                ),
                openDropdown === item.label && React.createElement(
                  'div',
                  { className: 'absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50' },
                  item.children!.map((child) =>
                    React.createElement(
                      'a',
                      {
                        key: child.label,
                        href: child.url,
                        target: child.target,
                        className: 'block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      },
                      child.label
                    )
                  )
                )
              );
            }
            
            return React.createElement(
              'a',
              {
                key: item.label,
                href: item.url,
                target: item.target,
                className: 'text-sm font-medium text-slate-600 hover:text-slate-900 transition'
              },
              item.label
            );
          })
        ),
        
        // User / Actions
        React.createElement(
          'div',
          { className: 'flex items-center space-x-4' },
          React.createElement(PluginInjectionRenderer, { point: 'navigation.header.extra' }),
          React.createElement(
            'a',
            {
              href: '/portal',
              className: 'px-3 py-1.5 border border-slate-300 hover:border-slate-800 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 transition'
            },
            'Member Portal'
          )
        )
      )
    ),
    React.createElement(PluginInjectionRenderer, { point: 'navigation.header.after' })
  );
};
