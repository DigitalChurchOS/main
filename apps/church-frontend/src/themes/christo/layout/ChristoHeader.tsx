import React, { useState } from 'react';
import { NavigationMenuContract } from '@churchos/frontend-contracts';
import { PluginInjectionRenderer } from '../../../rendering/plugins';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoHeaderProps {
  data?: NavigationMenuContract;
  context?: any;
}

export const ChristoHeader: React.FC<ChristoHeaderProps> = ({ data, context }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = data?.items || [];
  const tenantName = context?.tenant?.name || 'My Church';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(PluginInjectionRenderer, { point: 'navigation.header.before' }),
    React.createElement(
      'header',
      { className: 'w-full bg-[var(--christo-surface)] border-b border-[var(--christo-border)] sticky top-0 z-40 shadow-sm transition-colors' },
      React.createElement(
        'div',
        { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between' },
        
        // Brand Logo & Name
        React.createElement(
          'a',
          { href: '/church', className: 'flex items-center space-x-2' },
          React.createElement('span', { className: 'text-xl font-black text-[var(--christo-accent-strong)] tracking-tight' }, '⛪'),
          React.createElement('span', { className: 'text-base font-bold text-[var(--christo-text)] tracking-tight' }, tenantName)
        ),
        
        // Desktop Navigation Menu
        React.createElement(
          'nav',
          { className: 'hidden md:flex space-x-6 h-full items-center' },
          menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = currentPath === item.url || (item.url !== '/' && currentPath.startsWith(item.url));
            
            if (hasChildren) {
              return React.createElement(
                'div',
                { key: item.label, className: 'relative' },
                React.createElement(
                  'button',
                  {
                    onClick: () => setOpenDropdown(openDropdown === item.label ? null : item.label),
                    className: `text-sm font-medium flex items-center space-x-1 outline-none focus:text-[var(--christo-accent)] ${
                      isActive ? 'text-[var(--christo-accent-strong)] font-semibold' : 'text-[var(--christo-text)] hover:text-[var(--christo-accent)]'
                    }`
                  },
                  React.createElement('span', null, item.label),
                  React.createElement('span', { className: 'text-[10px] text-[var(--christo-muted)]' }, '▼')
                ),
                openDropdown === item.label && React.createElement(
                  'div',
                  { className: 'absolute top-full left-0 mt-2 w-48 bg-[var(--christo-surface)] border border-[var(--christo-border)] rounded-[var(--christo-radius-input)] shadow-lg py-1 z-50 animate-fade-in' },
                  item.children!.map((child) => {
                    const isChildActive = currentPath === child.url;
                    return React.createElement(
                      'a',
                      {
                        key: child.label,
                        href: child.url,
                        target: child.target,
                        className: `block px-4 py-2 text-xs font-semibold ${
                          isChildActive 
                            ? 'text-[var(--christo-accent-strong)] bg-[var(--christo-accent-soft)]' 
                            : 'text-[var(--christo-text)] hover:bg-[var(--christo-surface-soft)] hover:text-[var(--christo-accent)]'
                        }`
                      },
                      child.label
                    );
                  })
                )
              );
            }
            
            return React.createElement(
              'a',
              {
                key: item.label,
                href: item.url,
                target: item.target,
                className: `text-sm font-medium px-2.5 py-1.5 rounded-[var(--christo-radius-sm)] transition ${
                  isActive 
                    ? 'text-[var(--christo-accent-strong)] bg-[var(--christo-accent-soft)] font-semibold' 
                    : 'text-[var(--christo-text)] hover:text-[var(--christo-accent)]'
                }`
              },
              item.label
            );
          })
        ),
        
        // Desktop User / Actions
        React.createElement(
          'div',
          { className: 'hidden md:flex items-center space-x-3' },
          React.createElement(PluginInjectionRenderer, { point: 'navigation.header.extra' }),
          React.createElement(
            'a',
            {
              href: '/church/live',
              className: 'text-xs font-bold text-[var(--christo-live)] hover:underline flex items-center space-x-1 px-2.5 py-1.5'
            },
            React.createElement('span', { className: 'w-2 h-2 rounded-full bg-red-650 animate-ping mr-1' }),
            React.createElement('span', null, 'Watch Live')
          ),
          React.createElement(
            ChristoButton,
            {
              variant: 'secondary',
              onClick: () => { window.location.href = '/church/giving'; }
            },
            'Give'
          ),
          React.createElement(
            ChristoButton,
            {
              variant: 'primary',
              onClick: () => { window.location.href = '/church/members'; }
            },
            context?.memberId ? 'Portal' : 'Login'
          )
        ),

        // Mobile Menu Button
        React.createElement(
          'div',
          { className: 'md:hidden flex items-center space-x-2' },
          React.createElement(PluginInjectionRenderer, { point: 'navigation.header.extra' }),
          React.createElement(
            'button',
            {
              onClick: () => setMobileMenuOpen(!mobileMenuOpen),
              className: 'p-2 rounded-[var(--christo-radius-sm)] text-[var(--christo-text)] focus:outline-none'
            },
            React.createElement('span', { className: 'text-xl' }, mobileMenuOpen ? '✕' : '☰')
          )
        )
      ),

      // Mobile Menu Panel
      mobileMenuOpen && React.createElement(
        'div',
        { className: 'md:hidden bg-[var(--christo-surface)] border-t border-[var(--christo-border)] px-4 py-4 space-y-3 shadow-inner' },
        menuItems.map((item) =>
          React.createElement(
            'a',
            {
              key: item.label,
              href: item.url,
              className: `block py-2 text-sm font-semibold border-b border-[var(--christo-border)] ${
                currentPath === item.url ? 'text-[var(--christo-accent-strong)]' : 'text-[var(--christo-text)] hover:text-[var(--christo-accent)]'
              }`
            },
            item.label
          )
        ),
        React.createElement(
          'div',
          { className: 'pt-2 flex flex-col space-y-2' },
          React.createElement(
            ChristoButton,
            {
              variant: 'primary',
              onClick: () => { window.location.href = '/church/giving'; }
            },
            'Give Online'
          ),
          React.createElement(
            ChristoButton,
            {
              variant: 'secondary',
              onClick: () => { window.location.href = '/church/members'; }
            },
            context?.memberId ? 'Member Dashboard' : 'Sign In'
          )
        )
      )
    ),
    React.createElement(PluginInjectionRenderer, { point: 'navigation.header.after' })
  );
};
