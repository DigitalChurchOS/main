import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoFormGroup, ChristoInput, ChristoSelect } from '../components/ChristoFormControls';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoSalvationResponseFormProps {
  data?: any;
}

export const ChristoSalvationResponseForm: React.FC<ChristoSalvationResponseFormProps> = () => {
  const [decision, setDecision] = useState('First Time Decision');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact) return;
    setSubmitted(true);
  };

  if (submitted) {
    return React.createElement(
      ChristoCard,
      null,
      React.createElement(
        'div',
        { className: 'text-center py-6 space-y-3 animate-fade-in' },
        React.createElement('span', { className: 'text-3xl' }, '🕊️'),
        React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Thank you for sharing!'),
        React.createElement(
          'p',
          { className: 'text-xs text-[var(--christo-muted)]' },
          `We rejoice with you on your decision: "${decision}". Our ministry team will connect with you soon at ${contact}.`
        )
      )
    );
  }

  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4' },
      React.createElement(
        ChristoFormGroup,
        { label: 'My Decision Today' },
        React.createElement(
          ChristoSelect,
          {
            value: decision,
            onChange: (e) => setDecision(e.target.value)
          },
          React.createElement('option', { value: 'First Time Decision' }, 'I am accepting Jesus Christ as my Savior for the first time'),
          React.createElement('option', { value: 'Recommitting Life' }, 'I am recommitting my life to Christ'),
          React.createElement('option', { value: 'Want to learn' }, 'I want to learn more about faith')
        )
      ),
      React.createElement(
        ChristoFormGroup,
        { label: 'Full Name' },
        React.createElement(ChristoInput, {
          type: 'text',
          placeholder: 'John Doe',
          required: true,
          value: name,
          onChange: (e) => setName(e.target.value)
        })
      ),
      React.createElement(
        ChristoFormGroup,
        { label: 'Email or Phone Number' },
        React.createElement(ChristoInput, {
          type: 'text',
          placeholder: 'john@gmail.com',
          required: true,
          value: contact,
          onChange: (e) => setContact(e.target.value)
        })
      ),
      React.createElement(
        ChristoButton,
        {
          variant: 'primary',
          type: 'submit',
          className: 'w-full py-2.5'
        },
        'Submit Decision Card'
      )
    )
  );
};
