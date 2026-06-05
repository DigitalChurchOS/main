import React, { useState } from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';
import { ChristoInput } from '../components/ChristoFormControls';

export interface ChristoPrayerRoomProps {
  data?: {
    id: string;
    title: string;
  };
}

export const ChristoPrayerRoom: React.FC<ChristoPrayerRoomProps> = ({ data }) => {
  const [messages, setMessages] = useState([
    { id: '1', author: 'Mark', text: 'Praying for healing over the families in our local communities.' },
    { id: '2', author: 'Sarah', text: 'Thankful for answered prayers last week!' }
  ]);
  const [newMsg, setNewMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg) return;
    setMessages([...messages, { id: Date.now().toString(), author: 'You', text: newMsg }]);
    setNewMsg('');
  };

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in py-4' },
    
    // Left: Live Intercession Room
    React.createElement(
      'div',
      { className: 'lg:col-span-2' },
      React.createElement(
        ChristoCard,
        { highlighted: true },
        React.createElement('h3', { className: 'text-lg font-black text-[var(--christo-text)] mb-2' }, data?.title || 'Interactive Prayer Room'),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] border-b border-[var(--christo-border)] pb-4 mb-4' }, 'Lift up requests or share testimonies in real time.'),
        
        // Active Requests feed
        React.createElement(
          'div',
          { className: 'space-y-4 max-h-[300px] overflow-y-auto mb-4 p-2' },
          messages.map((m) =>
            React.createElement(
              'div',
              { key: m.id, className: 'p-3 border border-[var(--christo-border)] bg-[var(--christo-bg)] rounded-[var(--christo-radius-input)] space-y-1' },
              React.createElement('span', { className: 'text-xs font-bold text-[var(--christo-accent-strong)]' }, m.author),
              React.createElement('p', { className: 'text-xs text-[var(--christo-text)]' }, m.text)
            )
          )
        ),

        // Submit form
        React.createElement(
          'form',
          { onSubmit: handleSend, className: 'flex space-x-2' },
          React.createElement(ChristoInput, {
            type: 'text',
            placeholder: 'Type prayer request or amen...',
            value: newMsg,
            onChange: (e) => setNewMsg(e.target.value)
          }),
          React.createElement(ChristoButton, { type: 'submit', variant: 'primary' }, 'Submit')
        )
      )
    ),

    // Right: Intercession details panel
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        ChristoCard,
        null,
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)] uppercase tracking-wider mb-2' }, 'Prayer Guide'),
        React.createElement(
          'ul',
          { className: 'space-y-2 text-xs text-[var(--christo-muted)] font-medium list-disc pl-4' },
          React.createElement('li', null, 'Pray for regional leaders and pastors.'),
          React.createElement('li', null, 'Intercede for families facing health trials.'),
          React.createElement('li', null, 'Submit your needs using the Request Form.')
        )
      )
    )
  );
};
