import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoFormGroup, ChristoInput, ChristoTextarea } from '../components/ChristoFormControls';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoPrayerRequestFormProps {
  data?: any;
}

export const ChristoPrayerRequestForm: React.FC<ChristoPrayerRequestFormProps> = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    setSubmitted(true);
  };

  if (submitted) {
    return React.createElement(
      ChristoCard,
      null,
      React.createElement(
        'div',
        { className: 'text-center py-6 space-y-3 animate-fade-in' },
        React.createElement('span', { className: 'text-3xl' }, '🙏'),
        React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Request Submitted'),
        React.createElement(
          'p',
          { className: 'text-xs text-[var(--christo-muted)]' },
          'Your prayer request has been sent to our intercession team. God bless you.'
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
        { label: 'Prayer Need Title' },
        React.createElement(ChristoInput, {
          type: 'text',
          placeholder: 'e.g. Healing for my mother',
          required: true,
          value: title,
          onChange: (e) => setTitle(e.target.value)
        })
      ),
      React.createElement(
        ChristoFormGroup,
        { label: 'Prayer Request Description' },
        React.createElement(ChristoTextarea, {
          placeholder: 'Please share details of your prayer need...',
          required: true,
          value: description,
          onChange: (e) => setDescription(e.target.value)
        })
      ),
      React.createElement(
        'label',
        { className: 'flex items-center space-x-2 text-xs font-semibold text-[var(--christo-text)] cursor-pointer py-1' },
        React.createElement('input', {
          type: 'checkbox',
          checked: isAnonymous,
          onChange: (e) => setIsAnonymous(e.target.checked),
          className: 'rounded border-[var(--christo-border)] text-[var(--christo-accent)] focus:ring-[var(--christo-accent-ring)]'
        }),
        React.createElement('span', null, 'Submit request anonymously')
      ),
      React.createElement(
        ChristoButton,
        {
          variant: 'primary',
          type: 'submit',
          className: 'w-full'
        },
        'Submit Request'
      )
    )
  );
};
