import React from 'react';
import { ThemeSlotKey } from '../core/theme-slot.types';
import { RenderingState } from '../core/state.types';
import { ClientContextContract } from '../core/base.types';
import { ThemeAdapter } from './theme-adapter';
import { validateComponentContractData } from '../validation/validate-component-contract';

export interface ThemeSlotRendererProps {
  slotKey: ThemeSlotKey;
  contractData: any;
  clientContext: ClientContextContract;
  activeTheme: ThemeAdapter;
  moduleKey?: string; // Optional: triggers module entitlement check if provided
  fallbackComponent?: React.ComponentType<any>;
}

// Standard fallback mock components
const DefaultLoading = () => React.createElement('div', { className: 'p-8 text-center text-gray-500 animate-pulse font-sans' }, 'Loading content...');
const DefaultEmpty = () => React.createElement('div', { className: 'p-8 text-center text-gray-400 font-sans border-2 border-dashed border-gray-200 rounded-xl' }, 'No content to display.');
const DefaultError = ({ message }: { message?: string }) => React.createElement(
  'div',
  { className: 'p-6 text-center text-red-600 bg-red-50 border border-red-100 rounded-xl font-sans' },
  React.createElement('div', { className: 'font-semibold' }, 'Failed to render block'),
  message && React.createElement('div', { className: 'text-xs mt-1 text-red-500' }, message)
);
const DefaultLocked = () => React.createElement(
  'div',
  { className: 'p-8 text-center text-amber-700 bg-amber-50 border border-amber-100 rounded-xl font-sans' },
  React.createElement('div', { className: 'font-semibold' }, '🔒 Content Locked'),
  React.createElement('div', { className: 'text-xs mt-1' }, 'This section requires active church module activation.')
);

export const ThemeSlotRenderer: React.FC<ThemeSlotRendererProps> = ({
  slotKey,
  contractData,
  clientContext,
  activeTheme,
  moduleKey,
  fallbackComponent
}) => {
  // 1. Entitlement verification
  if (moduleKey) {
    const isModuleEntitled = clientContext.isPreviewMode || (clientContext.tenant.status === 'active');
    if (!isModuleEntitled) {
      return React.createElement(DefaultLocked, null);
    }
  }

  // 2. Validate component contract data (security audit guard)
  const validation = validateComponentContractData(slotKey, contractData);
  if (!validation.isValid) {
    console.error('Frontend Contract Violation on slot ' + slotKey + ':', validation.errors);
    return React.createElement(DefaultError, { message: validation.errors.join(', ') });
  }

  // 3. Resolve active tenant slot or fallback
  let Component = activeTheme.slots[slotKey];

  if (!Component && activeTheme.getFallbackSlot) {
    Component = activeTheme.getFallbackSlot(slotKey);
  }

  if (!Component) {
    Component = fallbackComponent;
  }

  // 4. Final defaults check
  if (!Component) {
    if (slotKey.startsWith('state.loading') || slotKey === 'state.loading') {
      Component = DefaultLoading;
    } else if (slotKey.startsWith('state.error') || slotKey === 'state.error') {
      Component = DefaultError;
    } else if (slotKey.startsWith('state.locked') || slotKey === 'state.locked' || slotKey === 'state.setupRequired') {
      Component = DefaultLocked;
    } else {
      Component = DefaultEmpty;
    }
  }

  try {
    return React.createElement(Component, { data: contractData, context: clientContext });
  } catch (err) {
    console.error('Runtime render crash inside theme component for slot ' + slotKey + ':', err);
    return React.createElement(DefaultError, { message: err instanceof Error ? err.message : String(err) });
  }
};
