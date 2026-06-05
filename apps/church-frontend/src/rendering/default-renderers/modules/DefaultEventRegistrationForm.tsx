import React from 'react';
import { EventRegistrationFormContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultEventRegistrationForm: React.FC<{ data: EventRegistrationFormContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'max-w-xl mx-auto space-y-4 font-sans py-4' },
    React.createElement('div', { className: 'text-center space-y-1' },
      React.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, `Register for ${data.eventTitle}`),
      React.createElement('p', { className: 'text-xs text-slate-500' }, 'Please fill in the details below to secure your registration.')
    ),
    React.createElement(DefaultFormRenderer, {
      formContract: data.form
    })
  );
};
