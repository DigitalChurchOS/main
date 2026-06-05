import React from 'react';

export interface TabItem {
  key: string;
  label: string;
}

export interface ChristoTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export const ChristoTabs: React.FC<ChristoTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return React.createElement(
    'div',
    {
      className: `flex border-b border-[var(--christo-border)] space-x-4 overflow-x-auto ${className}`
    },
    tabs.map((tab) => {
      const isActive = tab.key === activeTab;
      return React.createElement(
        'button',
        {
          key: tab.key,
          onClick: () => onChange(tab.key),
          className: `py-2.5 px-4 text-sm font-medium border-b-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--christo-accent-ring)] ${
            isActive 
              ? 'border-[var(--christo-accent)] text-[var(--christo-accent)] font-semibold' 
              : 'border-transparent text-[var(--christo-muted)] hover:text-[var(--christo-text)]'
          }`
        },
        tab.label
      );
    })
  );
};
