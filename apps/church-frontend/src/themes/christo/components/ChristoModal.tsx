import React from 'react';
import { ChristoButton } from './ChristoButton';

export interface ChristoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
}

export const ChristoModal: React.FC<ChristoModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return React.createElement(
    'div',
    { className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm' },
    React.createElement(
      'div',
      {
        className: 'bg-[var(--christo-surface)] border border-[var(--christo-border)] rounded-[var(--christo-radius-modal)] w-full max-w-lg shadow-2xl p-6 relative flex flex-col space-y-4 animate-fade-in'
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center border-b border-[var(--christo-border)] pb-3' },
        React.createElement('h3', { className: 'text-lg font-bold text-[var(--christo-text)]' }, title),
        React.createElement(
          'button',
          {
            onClick: onClose,
            className: 'text-[var(--christo-muted)] hover:text-[var(--christo-text)] w-6 h-6 flex items-center justify-center font-bold text-lg'
          },
          '×'
        )
      ),
      React.createElement('div', { className: 'flex-grow py-2 text-sm text-[var(--christo-text)]' }, children),
      React.createElement(
        'div',
        { className: 'flex justify-end pt-2' },
        React.createElement(ChristoButton, { variant: 'secondary', onClick: onClose }, 'Close')
      )
    )
  );
};
