import React from 'react';

export interface DefaultMemberPageProps {
  data?: {
    memberName: string;
    sections: { label: string; key: string; component: React.ReactNode }[];
    activeSectionKey?: string;
    onSectionChange?: (key: string) => void;
  };
}

export const DefaultMemberPage: React.FC<DefaultMemberPageProps> = ({ data }) => {
  if (!data) return React.createElement('div', null, 'No member profile loaded.');
  
  const activeKey = data.activeSectionKey || data.sections[0]?.key;
  const activeSection = data.sections.find(s => s.key === activeKey);

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 md:grid-cols-4 gap-8 py-6 font-sans' },
    
    // Sidebar Tabs
    React.createElement(
      'div',
      { className: 'md:col-span-1 space-y-2' },
      React.createElement('div', { className: 'px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider' }, `Welcome, ${data.memberName}`),
      data.sections.map(section =>
        React.createElement(
          'button',
          {
            key: section.key,
            onClick: () => data.onSectionChange?.(section.key),
            className: `w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition ${
              activeKey === section.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          },
          section.label
        )
      )
    ),
    
    // Core active view content
    React.createElement(
      'div',
      { className: 'md:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[300px]' },
      activeSection ? activeSection.component : React.createElement('div', null, 'Select a tab from the sidebar.')
    )
  );
};
