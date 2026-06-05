import React, { useState } from 'react';

export interface DefaultSearchPageProps {
  data?: {
    onQueryChange?: (query: string) => void;
    results: any[];
    renderResultItem: (item: any) => React.ReactNode;
  };
}

export const DefaultSearchPage: React.FC<DefaultSearchPageProps> = ({ data }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (data?.onQueryChange) {
      data.onQueryChange(query);
    }
  };

  const results = data?.results || [];

  return React.createElement(
    'div',
    { className: 'space-y-6 py-6 font-sans max-w-4xl mx-auto' },
    React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, 'Search Site Content'),
    
    // Search Form
    React.createElement(
      'form',
      { onSubmit: handleSearch, className: 'flex space-x-2' },
      React.createElement('input', {
        type: 'text',
        value: query,
        onChange: (e) => setQuery(e.target.value),
        placeholder: 'Search for pages, events, media...',
        className: 'flex-grow px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900'
      }),
      React.createElement(
        'button',
        {
          type: 'submit',
          className: 'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-semibold transition'
        },
        'Search'
      )
    ),
    
    // Results Listing
    React.createElement('hr', { className: 'border-slate-200' }),
    React.createElement('div', { className: 'space-y-4' },
      results.length === 0 ? React.createElement('div', { className: 'text-center p-8 text-slate-400 text-sm' }, 'No search results found.') :
      results.map((item, idx) =>
        React.createElement('div', { key: item.id || idx, className: 'p-4 border border-slate-100 rounded-md bg-white hover:bg-slate-50' },
          data!.renderResultItem(item)
        )
      )
    )
  );
};
