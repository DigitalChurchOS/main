import React from 'react';

export interface ChristoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export const ChristoDrawer: React.FC<ChristoDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return React.createElement(
    'div',
    { className: 'fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-sm' },
    // Underlay Click handler
    React.createElement('div', { className: 'absolute inset-0', onClick: onClose }),
    
    // Side content panel
    React.createElement(
      'div',
      {
        className: 'relative w-full max-w-md bg-[var(--christo-surface)] border-l border-[var(--christo-border)] h-full p-6 flex flex-col space-y-4 shadow-2xl overflow-y-auto animate-fade-in'
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center border-b border-[var(--christo-border)] pb-3' },
        React.createElement('h3', { className: 'text-lg font-bold text-[var(--christo-text)]' }, title),
        React.createElement(
          'button',
          {
            onClick: onClose,
            className: 'text-[var(--christo-muted)] hover:text-[var(--christo-text)] w-8 h-8 flex items-center justify-center font-bold text-xl'
          },
          '×'
        )
      ),
      React.createElement('div', { className: 'flex-grow py-2 text-sm text-[var(--christo-text)]' }, children)
    )
  );
};
