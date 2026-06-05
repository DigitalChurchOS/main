import React, { useState } from 'react';
import { ChristoCard } from './ChristoCard';
import { ChristoButton } from './ChristoButton';
import { ChristoInput } from './ChristoFormControls';

// 1. Loading Skeleton
export const ChristoLoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return React.createElement('div', {
    className: `christo-animate-shimmer rounded-[var(--christo-radius-xs)] ${className}`
  });
};

export const ChristoLoadingState: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'space-y-4 max-w-lg mx-auto py-12' },
    React.createElement(ChristoLoadingSkeleton, { className: 'h-10 w-2/3 mx-auto' }),
    React.createElement(ChristoLoadingSkeleton, { className: 'h-24 w-full' }),
    React.createElement(ChristoLoadingSkeleton, { className: 'h-12 w-1/3 mx-auto' })
  );
};

// 2. Empty State
export const ChristoEmptyState: React.FC<{ message: string; title?: string }> = ({ message, title = 'No Items Found' }) => {
  return React.createElement(
    'div',
    { className: 'text-center py-12 px-6 border border-dashed border-[var(--christo-border)] rounded-[var(--christo-radius-card)] bg-[var(--christo-surface)] max-w-md mx-auto space-y-3' },
    React.createElement('div', { className: 'text-4xl' }, '📭'),
    React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, title),
    React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, message)
  );
};

// 3. Error State
export const ChristoErrorState: React.FC<{ message: string }> = ({ message }) => {
  return React.createElement(
    'div',
    { className: 'p-5 border border-[var(--christo-danger)] bg-rose-50 dark:bg-rose-950/20 text-[var(--christo-danger)] rounded-[var(--christo-radius-card)] max-w-lg mx-auto flex items-start space-x-3 text-sm font-semibold' },
    React.createElement('span', { className: 'text-lg' }, '⚠️'),
    React.createElement(
      'div',
      { className: 'space-y-1' },
      React.createElement('p', { className: 'font-bold' }, 'System Error'),
      React.createElement('p', { className: 'text-xs font-medium text-[var(--christo-muted)]' }, message)
    )
  );
};

// 4. Locked State (Suspended Subscription)
export const ChristoLockedState: React.FC<{ message?: string }> = ({ message = 'Access Denied: Subscription Expired.' }) => {
  return React.createElement(
    'div',
    { className: 'text-center py-12 px-6 border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] bg-[var(--christo-surface)] max-w-md mx-auto space-y-4 shadow-sm' },
    React.createElement('div', { className: 'text-4xl text-[var(--christo-accent)]' }, '🔒'),
    React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Portal Locked'),
    React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] leading-relaxed' }, message),
    React.createElement(ChristoButton, { variant: 'primary', onClick: () => { window.location.href = 'mailto:support@churchos.io'; } }, 'Contact Platform Support')
  );
};

// 5. Setup Required State
export const ChristoSetupRequiredState: React.FC<{ message?: string }> = ({ message = 'This module has not been configured yet.' }) => {
  return React.createElement(
    'div',
    { className: 'text-center py-12 px-6 border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] bg-[var(--christo-surface)] max-w-md mx-auto space-y-4' },
    React.createElement('div', { className: 'text-4xl text-[var(--christo-accent-strong)]' }, '⚙️'),
    React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Configuration Pending'),
    React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, message),
    React.createElement(ChristoButton, { variant: 'secondary' }, 'Open Dashboard settings')
  );
};

// 6. Member Only Gate
export const ChristoMemberOnlyState: React.FC<{ message?: string; onLogin?: () => void }> = ({
  message = 'Please log in to view this premium member content.',
  onLogin
}) => {
  return React.createElement(
    'div',
    { className: 'text-center py-10 px-6 border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] bg-[var(--christo-surface)] max-w-md mx-auto space-y-4 shadow' },
    React.createElement('div', { className: 'text-4xl' }, '👤'),
    React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Members Only Area'),
    React.createElement('p', { className: 'text-xs text-[var(--christo-muted)]' }, message),
    React.createElement(
      ChristoButton,
      {
        variant: 'primary',
        onClick: onLogin || (() => { window.location.href = '/church/members'; })
      },
      'Log In / Join Portal'
    )
  );
};

// 7. Password Gate
export const ChristoPasswordState: React.FC<{
  onSubmitPassword: (pwd: string) => void;
  incorrectAttempt?: boolean;
}> = ({ onSubmitPassword, incorrectAttempt }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPassword(password);
  };

  return React.createElement(
    'div',
    { className: 'py-10 px-6 border border-[var(--christo-border)] rounded-[var(--christo-radius-card)] bg-[var(--christo-surface)] max-w-md mx-auto space-y-4 shadow' },
    React.createElement('div', { className: 'text-center text-4xl' }, '🔑'),
    React.createElement('h4', { className: 'text-center font-bold text-sm text-[var(--christo-text)]' }, 'Password Protected'),
    React.createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4' },
      React.createElement(ChristoInput, {
        type: 'password',
        placeholder: 'Enter access password',
        required: true,
        value: password,
        onChange: (e) => setPassword(e.target.value)
      }),
      incorrectAttempt && React.createElement('p', { className: 'text-2xs text-[var(--christo-danger)] font-bold text-center' }, 'Incorrect password. Please try again.'),
      React.createElement(ChristoButton, { type: 'submit', variant: 'primary', className: 'w-full' }, 'Unlock Content')
    )
  );
};

// 8. Preview Only State
export const ChristoPreviewOnlyState: React.FC = () => {
  return React.createElement(
    'div',
    { className: 'w-full py-1.5 px-4 bg-amber-500 text-stone-950 text-2xs font-extrabold tracking-widest text-center uppercase z-50 sticky top-0 shadow-inner' },
    '👁️ Preview Mode: Viewing unpublished draft content'
  );
};

// 9. Disabled State
export const ChristoDisabledState: React.FC<{ message?: string }> = ({ message = 'This section has been deactivated.' }) => {
  return React.createElement(
    'div',
    { className: 'text-center py-8 px-4 border border-[var(--christo-border)] bg-[var(--christo-surface-soft)] rounded-[var(--christo-radius-card)] max-w-md mx-auto space-y-2' },
    React.createElement('span', { className: 'text-xl' }, '🚫'),
    React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] font-semibold' }, message)
  );
};
