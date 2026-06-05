import React from 'react';
import { PrayerRequestFormContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultPrayerRequestForm: React.FC<{ data: PrayerRequestFormContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'max-w-xl mx-auto space-y-4 font-sans py-4' },
    React.createElement('div', { className: 'text-center space-y-1' },
      React.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, 'Request Prayer'),
      React.createElement('p', { className: 'text-xs text-slate-500' }, 'Our prayer ministry team stands with you in faith. Submit your requests below.')
    ),
    React.createElement(DefaultFormRenderer, {
      formContract: data.form
    })
  );
};
