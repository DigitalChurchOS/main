import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoFormGroup, ChristoInput, ChristoTextarea } from '../components/ChristoFormControls';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoNewVisitorFormProps {
  data?: any;
}

export const ChristoNewVisitorForm: React.FC<ChristoNewVisitorFormProps> = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
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
        { className: 'text-center py-6 space-y-3 animate-fade-in' },
        React.createElement('span', { className: 'text-3xl' }, '👋'),
        React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Welcome to the Family!'),
        React.createElement(
          'p',
          { className: 'text-xs text-[var(--christo-muted)]' },
          `Thank you ${name} for filling out our connection card. We will reach out to you at ${email}.`
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
        { label: 'My Name' },
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
        { label: 'My Email' },
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
        { label: 'Questions or Prayer Needs?' },
        React.createElement(ChristoTextarea, {
          placeholder: 'Tell us a bit about yourself or how we can serve you today...',
          value: comments,
          onChange: (e) => setComments(e.target.value)
        })
      ),
      React.createElement(
        ChristoButton,
        {
          variant: 'primary',
          type: 'submit',
          className: 'w-full py-2.5'
        },
        'Submit Connect Card'
      )
    )
  );
};
