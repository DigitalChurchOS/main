import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DefaultSearchPage, useRendererContext } from '../rendering';

export const SearchPageView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);

  // Simple static index of mock content to search
  const contentDatabase = [
    { id: '1', title: 'Home Page', category: 'Page', snippet: 'Welcome to our church. Join us for Sunday services.', url: '/church/' },
    { id: '2', title: 'About Us', category: 'Page', snippet: 'Learn about our beliefs, values, and leadership team.', url: '/church/about' },
    { id: '3', title: 'Easter Sunday Celebration', category: 'Event', snippet: 'Join us for our special Easter celebration service!', url: '/church/events' },
    { id: '4', title: 'Walking in Wisdom', category: 'Sermon', snippet: 'A study on how to apply biblical wisdom in daily life.', url: '/church/sermons' },
    { id: '5', title: 'Church Membership 101', category: 'Course', snippet: 'Learn about our history, values, and covenant membership.', url: '/church/courses' },
    { id: '6', title: 'Prayer Request Wall', category: 'Prayer', snippet: 'Submit your prayer needs or lift up requests from the community.', url: '/church/prayer' }
  ];

  const performSearch = (query: string) => {
    if (!query) {
      setResults([]);
      return;
    }
    const lowercaseQuery = query.toLowerCase();
    const filtered = contentDatabase.filter(
      (item) =>
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.snippet.toLowerCase().includes(lowercaseQuery) ||
        item.category.toLowerCase().includes(lowercaseQuery)
    );
    setResults(filtered);
  };

  // Run initial search
  React.useEffect(() => {
    performSearch(initialQuery);
  }, [initialQuery]);

  const searchData = {
    onQueryChange: (q: string) => {
      setSearchParams({ q });
      performSearch(q);
    },
    results,
    renderResultItem: (item: any) => {
      return React.createElement(
        'div',
        { className: 'space-y-1.5' },
        React.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          React.createElement('span', { className: 'text-2xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase font-bold' }, item.category),
          React.createElement(
            'a',
            { href: item.url, className: 'text-sm font-semibold text-slate-800 hover:text-slate-900 hover:underline' },
            item.title
          )
        ),
        React.createElement('p', { className: 'text-xs text-slate-500' }, item.snippet)
      );
    }
  };

  const context = useRendererContext() as any;
  const Component = context?.activeTheme?.slots?.['page.search'] || DefaultSearchPage;
  return React.createElement(Component, { data: searchData });
};
