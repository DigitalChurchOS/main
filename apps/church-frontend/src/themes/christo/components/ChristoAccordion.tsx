import React, { useState } from 'react';

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export interface ChristoAccordionProps {
  items: AccordionItem[];
  className?: string;
}

export const ChristoAccordion: React.FC<ChristoAccordionProps> = ({
  items,
  className = ''
}) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return React.createElement(
    'div',
    { className: `space-y-3 ${className}` },
    items.map((item, idx) => {
      const isOpen = openIdx === idx;
      return React.createElement(
        'div',
        {
          key: idx,
          className: 'border border-[var(--christo-border)] rounded-[var(--christo-radius-input)] overflow-hidden bg-[var(--christo-surface)]'
        },
        React.createElement(
          'button',
          {
            onClick: () => setOpenIdx(isOpen ? null : idx),
            className: 'w-full px-5 py-4 flex items-center justify-between text-left font-semibold text-sm text-[var(--christo-text)] hover:bg-[var(--christo-surface-soft)] transition'
          },
          React.createElement('span', null, item.title),
          React.createElement(
            'span',
            { className: `transform transition-transform text-[var(--christo-accent)]` },
            isOpen ? '▲' : '▼'
          )
        ),
        isOpen && React.createElement(
          'div',
          { className: 'px-5 py-4 border-t border-[var(--christo-border)] text-sm text-[var(--christo-muted)] bg-[var(--christo-bg)]' },
          item.content
        )
      );
    })
  );
};
