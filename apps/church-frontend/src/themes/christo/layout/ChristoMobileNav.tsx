import React from 'react';
import { NavigationMenuContract } from '@churchos/frontend-contracts';

export interface ChristoMobileNavProps {
  data?: NavigationMenuContract;
  isOpen: boolean;
  onClose: () => void;
}

export const ChristoMobileNav: React.FC<ChristoMobileNavProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;

  const menuItems = data?.items || [];

  return React.createElement(
    'div',
    { className: 'fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-sm md:hidden font-sans' },
    React.createElement('div', { className: 'absolute inset-0', onClick: onClose }),
    React.createElement(
      'div',
      { className: 'relative w-4/5 max-w-sm bg-[var(--christo-surface)] border-l border-[var(--christo-border)] h-full p-6 flex flex-col space-y-6 shadow-2xl overflow-y-auto animate-fade-in' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center pb-4 border-b border-[var(--christo-border)]' },
        React.createElement('span', { className: 'font-bold text-base text-[var(--christo-text)]' }, 'Menu'),
        React.createElement(
          'button',
          { onClick: onClose, className: 'text-2xl text-[var(--christo-muted)] hover:text-[var(--christo-text)]' },
          '×'
        )
      ),
      React.createElement(
        'nav',
        { className: 'flex flex-col space-y-4' },
        menuItems.map((item) =>
          React.createElement(
            'a',
            {
              key: item.label,
              href: item.url,
              onClick: onClose,
              className: 'text-sm font-semibold text-[var(--christo-text)] hover:text-[var(--christo-accent)] py-2 border-b border-[var(--christo-surface-soft)]'
            },
            item.label
          )
        )
      )
    )
  );
};
