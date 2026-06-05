import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoCourseCardProps {
  data: {
    id: string;
    title: string;
    description: string;
    lessonsCount?: number;
    cta?: { label: string; url: string };
  };
}

export const ChristoCourseCard: React.FC<ChristoCourseCardProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { highlighted: true },
    React.createElement(
      'div',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('span', { className: 'text-3xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, 'Academy Discipleship'),
        React.createElement('h4', { className: 'text-sm font-bold text-[var(--christo-text)]' }, data.title),
        React.createElement('p', { className: 'text-xs text-[var(--christo-muted)] line-clamp-2' }, data.description)
      ),
      
      // Lessons count & Progress bar
      React.createElement(
        'div',
        { className: 'space-y-1.5' },
        React.createElement('div', { className: 'flex justify-between text-3xs text-[var(--christo-muted)] font-semibold' }, React.createElement('span', null, `${data.lessonsCount || 4} Lessons`), React.createElement('span', null, '0% Complete')),
        React.createElement(
          'div',
          { className: 'h-1.5 w-full bg-[var(--christo-surface-soft)] rounded-full overflow-hidden' },
          React.createElement('div', { className: 'h-full bg-[var(--christo-accent-muted)] rounded-full', style: { width: '0%' } })
        )
      ),

      React.createElement(
        'div',
        { className: 'pt-2' },
        React.createElement(
          ChristoButton,
          {
            variant: 'primary',
            onClick: () => { window.location.href = `/church/courses/${data.id}`; },
            className: 'w-full text-center py-1.5'
          },
          data.cta?.label || 'Enroll in Course'
        )
      )
    )
  );
};
