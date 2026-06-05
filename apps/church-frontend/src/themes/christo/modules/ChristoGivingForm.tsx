import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoFormGroup, ChristoInput, ChristoSelect } from '../components/ChristoFormControls';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoGivingFormProps {
  data?: {
    categories?: { id: string; name: string; description?: string }[];
  };
}

export const ChristoGivingForm: React.FC<ChristoGivingFormProps> = ({ data }) => {
  const categories = data?.categories || [
    { id: 'general', name: 'General Tithes & Offerings' },
    { id: 'missions', name: 'Missions & Outreach' },
    { id: 'building', name: 'Building & Expansion Fund' }
  ];

  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time');
  const [category, setCategory] = useState(categories[0]?.id || 'general');
  const [submitted, setSubmitted] = useState(false);

  const amounts = [10, 25, 50, 100, 250];
  const finalAmount = selectedAmount !== null ? selectedAmount : parseFloat(customAmount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;
    setSubmitted(true);
  };

  if (submitted) {
    return React.createElement(
      ChristoCard,
      null,
      React.createElement(
        'div',
        { className: 'text-center py-6 space-y-3' },
        React.createElement('span', { className: 'text-3xl' }, '❤️'),
        React.createElement('h4', { className: 'font-bold text-sm text-[var(--christo-text)]' }, 'Donation Received!'),
        React.createElement(
          'p',
          { className: 'text-xs text-[var(--christo-muted)]' },
          `Thank you for your generous gift of $${finalAmount.toFixed(2)} toward "${categories.find(c => c.id === category)?.name || 'General Offerings'}". Frequency: ${frequency === 'monthly' ? 'Monthly Partner' : 'One-time donation'}.`
        )
      )
    );
  }

  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'form',
      { onSubmit: handleSubmit, className: 'space-y-5' },
      
      // Amount selector buttons
      React.createElement(
        'div',
        { className: 'space-y-2' },
        React.createElement('label', { className: 'block text-xs font-semibold text-[var(--christo-text)] uppercase tracking-wider' }, 'Select Amount'),
        React.createElement(
          'div',
          { className: 'grid grid-cols-5 gap-2' },
          amounts.map((amount) => {
            const isSelected = selectedAmount === amount;
            return React.createElement(
              'button',
              {
                key: amount,
                type: 'button',
                onClick: () => { setSelectedAmount(amount); setCustomAmount(''); },
                className: `py-2 text-xs font-bold border rounded-[var(--christo-radius-input)] transition ${
                  isSelected 
                    ? 'bg-[var(--christo-accent)] text-[var(--christo-accent-foreground)] border-transparent' 
                    : 'bg-[var(--christo-surface)] text-[var(--christo-text)] border-[var(--christo-border)] hover:bg-[var(--christo-surface-soft)]'
                }`
              },
              `$${amount}`
            );
          })
        )
      ),

      // Custom Amount Input
      React.createElement(
        ChristoFormGroup,
        { label: 'Or Enter Custom Amount ($)' },
        React.createElement(ChristoInput, {
          type: 'number',
          placeholder: 'Other amount',
          value: customAmount,
          onChange: (e) => { setSelectedAmount(null); setCustomAmount(e.target.value); }
        })
      ),

      // Frequency switch
      React.createElement(
        'div',
        { className: 'space-y-2' },
        React.createElement('label', { className: 'block text-xs font-semibold text-[var(--christo-text)] uppercase tracking-wider' }, 'Frequency'),
        React.createElement(
          'div',
          { className: 'flex space-x-4' },
          React.createElement(
            'label',
            { className: 'flex items-center space-x-2 text-xs font-medium text-[var(--christo-text)] cursor-pointer' },
            React.createElement('input', {
              type: 'radio',
              name: 'frequency',
              checked: frequency === 'one_time',
              onChange: () => setFrequency('one_time'),
              className: 'text-[var(--christo-accent)] focus:ring-[var(--christo-accent-ring)]'
            }),
            React.createElement('span', null, 'Give One-Time')
          ),
          React.createElement(
            'label',
            { className: 'flex items-center space-x-2 text-xs font-medium text-[var(--christo-text)] cursor-pointer' },
            React.createElement('input', {
              type: 'radio',
              name: 'frequency',
              checked: frequency === 'monthly',
              onChange: () => setFrequency('monthly'),
              className: 'text-[var(--christo-accent)] focus:ring-[var(--christo-accent-ring)]'
            }),
            React.createElement('span', null, 'Give Monthly')
          )
        )
      ),

      // Select category
      React.createElement(
        ChristoFormGroup,
        { label: 'Giving Fund Destination' },
        React.createElement(
          ChristoSelect,
          {
            value: category,
            onChange: (e) => setCategory(e.target.value)
          },
          categories.map((c) =>
            React.createElement('option', { key: c.id, value: c.id }, c.name)
          )
        )
      ),

      // Submit Button
      React.createElement(
        ChristoButton,
        {
          variant: 'primary',
          type: 'submit',
          className: 'w-full py-3'
        },
        `Confirm Donation of $${finalAmount.toFixed(2)}`
      )
    )
  );
};
