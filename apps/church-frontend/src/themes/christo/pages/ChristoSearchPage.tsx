import React from 'react';
import { ChristoInput } from '../components/ChristoFormControls';
import { ChristoCard } from '../components/ChristoCard';

export interface ChristoSearchPageProps {
  data?: {
    onQueryChange: (q: string) => void;
    results: any[];
    renderResultItem?: (item: any) => React.ReactNode;
  };
}

export const ChristoSearchPage: React.FC<ChristoSearchPageProps> = ({ data }) => {
  const results = data?.results || [];

  return React.createElement(
    'div',
    { className: 'space-y-6 max-w-2xl mx-auto py-6 animate-fade-in' },
    React.createElement('h2', { className: 'text-2xl font-black text-[var(--christo-text)]' }, 'Search portal'),
    React.createElement(
      'div',
      { className: 'relative' },
      React.createElement(ChristoInput, {
        type: 'text',
        placeholder: 'Search events, sermons, courses...',
        onChange: (e) => data?.onQueryChange(e.target.value),
        className: 'pl-4 pr-10 py-3 shadow-sm'
      })
    ),
    React.createElement(
      'div',
      { className: 'space-y-4' },
      results.length === 0 
        ? React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] text-center py-6' }, 'Type to begin searching or no results found.')
        : results.map((item, idx) => {
            if (data?.renderResultItem) {
              return React.createElement(
                ChristoCard,
                { key: item.id || idx, className: 'py-4' },
                data.renderResultItem(item)
              );
            }
            return React.createElement(
              ChristoCard,
              { key: item.id || idx },
              React.createElement(
                'div',
                { className: 'flex justify-between items-center' },
                React.createElement('span', { className: 'text-xs font-bold text-[var(--christo-accent-strong)]' }, item.category || 'General'),
                React.createElement('a', { href: item.url, className: 'text-sm font-semibold hover:underline text-[var(--christo-text)]' }, item.title)
              ),
              React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] mt-1' }, item.snippet)
            );
          })
    )
  );
};
