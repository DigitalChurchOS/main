import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoFormGroup, ChristoInput, ChristoSelect } from '../components/ChristoFormControls';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoEventRegistrationFormProps {
  data: {
    eventId: string;
    eventTitle: string;
  };
}

export const ChristoEventRegistrationForm: React.FC<ChristoEventRegistrationFormProps> = ({ data }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Attendee');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitted(true);
  };

  if (submitted) {
    return React.createElement(
      ChristoCard,
      null,
      React.createElement(
        'div',
        { className: 'text-center py-6 space-y-3' },
        React.createElement('span', { className: 'text-3xl' }, '🎉'),
        React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'RSVP Confirmed!'),
        React.createElement(
          'p',
          { className: 'text-xs text-[var(--christo-muted)]' },
          `Thank you ${name}. You are successfully registered for: "${data.eventTitle}". Confirmation details sent to ${email}.`
        )
      )
    );
  }

  return React.createElement(
    ChristoCard,
    null,
    React.createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-4' },
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
        { label: 'Email Address' },
        React.createElement(ChristoInput, {
          type: 'email',
          placeholder: 'john@doe.com',
          required: true,
          value: email,
          onChange: (e) => setEmail(e.target.value)
        })
      ),
      React.createElement(
        ChristoFormGroup,
        { label: 'Registration Type' },
        React.createElement(
          ChristoSelect,
          {
            value: role,
            onChange: (e) => setRole(e.target.value)
          },
          React.createElement('option', { value: 'Attendee' }, 'General Attendee'),
          React.createElement('option', { value: 'Volunteer' }, 'Serving as Volunteer'),
          React.createElement('option', { value: 'VIP' }, 'Special Guest')
        )
      ),
      React.createElement(
        ChristoButton,
        {
          variant: 'primary',
          type: 'submit',
          className: 'w-full'
        },
        'Confirm RSVP'
      )
    )
  );
};
