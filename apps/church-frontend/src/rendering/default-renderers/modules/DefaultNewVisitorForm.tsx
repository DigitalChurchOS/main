import React from 'react';
import { NewVisitorFormContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultNewVisitorForm: React.FC<{ data: NewVisitorFormContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'max-w-xl mx-auto space-y-4 font-sans py-4' },
    React.createElement('div', { className: 'text-center space-y-1' },
      React.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, 'I\'m New Here'),
      React.createElement('p', { className: 'text-xs text-slate-500' }, 'Welcome! We would love to connect with you. Please share your details below.')
    ),
    React.createElement(DefaultFormRenderer, {
      formContract: data.form
    })
  );
};
