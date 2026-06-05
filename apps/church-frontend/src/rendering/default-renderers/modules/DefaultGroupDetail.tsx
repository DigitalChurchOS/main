import React from 'react';
import { GroupDetailContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultGroupDetail: React.FC<{ data: GroupDetailContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 font-sans' },
    
    // Group information
    React.createElement(
      'div',
      { className: 'lg:col-span-2 space-y-6' },
      React.createElement('div', { className: 'space-y-2' },
        React.createElement('h1', { className: 'text-3xl font-extrabold text-slate-900 tracking-tight' }, data.name),
        React.createElement(
          'div',
          { className: 'flex flex-wrap gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider' },
          data.schedule && React.createElement('span', null, `📅 Schedule: ${data.schedule}`),
          data.location && React.createElement('span', null, `📍 Location: ${data.location}`),
          React.createElement('span', null, `👥 Members: ${data.membersCount}`)
        )
      ),
      React.createElement('hr', { className: 'border-slate-200' }),
      React.createElement('p', { className: 'text-sm text-slate-600 leading-relaxed' }, data.description || 'No description available.')
    ),
    
    // Join form card sidebar
    React.createElement(
      'div',
      { className: 'lg:col-span-1' },
      React.createElement(
        'div',
        { className: 'p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4' },
        React.createElement('h4', { className: 'text-xs font-bold text-slate-800 uppercase tracking-wider text-center' }, 'Join this Group'),
        React.createElement(DefaultFormRenderer, {
          formContract: data.joinForm
        })
      )
    )
  );
};
