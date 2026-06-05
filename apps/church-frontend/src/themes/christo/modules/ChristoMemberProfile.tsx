import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoFormGroup, ChristoInput } from '../components/ChristoFormControls';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoMemberProfileProps {
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photoUrl?: string;
    branchName?: string;
    joinedDate?: string;
  };
}

export const ChristoMemberProfile: React.FC<ChristoMemberProfileProps> = ({ data }) => {
  const [firstName, setFirstName] = useState(data.firstName);
  const [lastName, setLastName] = useState(data.lastName);
  const [phone, setPhone] = useState(data.phone || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in' },
    
    // Left: Member Card summary
    React.createElement(
      'div',
      { className: 'md:col-span-1' },
      React.createElement(
        ChristoCard,
        { highlighted: true, className: 'text-center space-y-4' },
        React.createElement('img', {
          src: data.photoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          alt: `${firstName} ${lastName}`,
          className: 'w-24 h-24 rounded-full mx-auto object-cover border-2 border-[var(--christo-accent)]'
        }),
        React.createElement(
          'div',
          null,
          React.createElement('h3', { className: 'font-bold text-base text-[var(--christo-text)]' }, `${firstName} ${lastName}`),
          React.createElement('span', { className: 'text-3xs text-[var(--christo-muted)] font-semibold' }, data.email)
        ),
        React.createElement(
          'div',
          { className: 'text-3xs text-[var(--christo-muted)] space-y-1 font-medium text-left bg-[var(--christo-bg)] p-3 rounded-[var(--christo-radius-input)] border border-[var(--christo-border)]' },
          React.createElement('div', null, '🏫 Campus: ', data.branchName || 'Main Campus'),
          React.createElement('div', null, '📅 Joined: ', data.joinedDate || '2026-06-04')
        )
      )
    ),

    // Right: Edit Form
    React.createElement(
      'div',
      { className: 'md:col-span-2' },
      React.createElement(
        ChristoCard,
        null,
        React.createElement('h3', { className: 'font-bold text-sm text-[var(--christo-text)] mb-4 border-b border-[var(--christo-border)] pb-2' }, 'Edit Profile Details'),
        React.createElement(
          'form',
          { onSubmit: handleSave, className: 'space-y-4' },
          React.createElement(
            'div',
            { className: 'grid grid-cols-2 gap-4' },
            React.createElement(
              ChristoFormGroup,
              { label: 'First Name' },
              React.createElement(ChristoInput, {
                type: 'text',
                value: firstName,
                onChange: (e) => setFirstName(e.target.value),
                required: true
              })
            ),
            React.createElement(
              ChristoFormGroup,
              { label: 'Last Name' },
              React.createElement(ChristoInput, {
                type: 'text',
                value: lastName,
                onChange: (e) => setLastName(e.target.value),
                required: true
              })
            )
          ),
          React.createElement(
            ChristoFormGroup,
            { label: 'Phone Number' },
            React.createElement(ChristoInput, {
              type: 'tel',
              value: phone,
              onChange: (e) => setPhone(e.target.value)
            })
          ),
          React.createElement(
            'div',
            { className: 'flex justify-between items-center pt-2' },
            React.createElement(
              ChristoButton,
              { variant: 'primary', type: 'submit' },
              'Save Profile Changes'
            ),
            saved && React.createElement('span', { className: 'text-xs text-emerald-600 font-bold' }, '✓ Settings Saved!')
          )
        )
      )
    )
  );
};
