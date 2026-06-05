import React from 'react';
import { ChristoCard } from '../components/ChristoCard';
import { ChristoButton } from '../components/ChristoButton';
import { ChristoAccordion } from '../components/ChristoAccordion';

export interface Lesson {
  title: string;
  content: string;
}

export interface ChristoCourseDetailProps {
  data: {
    id: string;
    title: string;
    description: string;
    lessons?: Lesson[];
  };
}

export const ChristoCourseDetail: React.FC<ChristoCourseDetailProps> = ({ data }) => {
  const lessons = data.lessons || [
    { title: 'Lesson 1: Introduction & Foundations', content: 'In this lesson we cover the historical background and foundational principles.' },
    { title: 'Lesson 2: Core Values and Applications', content: 'Applying core values in day to day tasks and ministerial responsibilities.' },
    { title: 'Lesson 3: Advanced Methods and Wrap-up', content: 'Advanced tools and final assessments to complete your learning path.' }
  ];

  const accordionItems = lessons.map((l) => ({
    title: l.title,
    content: React.createElement('p', null, l.content)
  }));

  return React.createElement(
    'div',
    { className: 'space-y-6 py-4 animate-fade-in' },
    React.createElement(
      ChristoCard,
      { highlighted: true },
      React.createElement(
        'div',
        { className: 'space-y-4' },
        React.createElement('span', { className: 'text-2xs text-[var(--christo-accent-strong)] font-bold uppercase tracking-wider' }, 'Discipleship Curriculum'),
        React.createElement('h1', { className: 'text-2xl font-black text-[var(--christo-text)]' }, data.title),
        React.createElement('p', { className: 'text-sm text-[var(--christo-muted)] leading-relaxed' }, data.description),
        React.createElement(
          'div',
          { className: 'pt-2 flex justify-start' },
          React.createElement(ChristoButton, { variant: 'primary' }, 'Start Course')
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'space-y-3' },
      React.createElement('h3', { className: 'text-base font-bold text-[var(--christo-text)] border-l-2 border-[var(--christo-accent)] pl-2' }, 'Course Curriculum Lessons'),
      React.createElement(ChristoAccordion, { items: accordionItems })
    )
  );
};
