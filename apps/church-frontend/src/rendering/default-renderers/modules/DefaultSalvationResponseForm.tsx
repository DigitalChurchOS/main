import React from 'react';
import { SalvationResponseFormContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultSalvationResponseForm: React.FC<{ data: SalvationResponseFormContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'max-w-xl mx-auto space-y-4 font-sans py-4' },
    React.createElement('div', { className: 'text-center space-y-1' },
      React.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, 'I Decided to Follow Christ'),
      React.createElement('p', { className: 'text-xs text-slate-500' }, 'Congratulations on making this decision! We would love to support you in your walk with God.')
    ),
    React.createElement(DefaultFormRenderer, {
      formContract: data.form
    })
  );
};
