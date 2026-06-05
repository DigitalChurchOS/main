import React from 'react';
import { ChristoCard } from '../components/ChristoCard';

export interface ChristoPluginPanelProps {
  data: any;
  context: any;
}

export const ChristoPluginPanel: React.FC<ChristoPluginPanelProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { className: 'p-6 my-4' },
    React.createElement('h3', { className: 'font-bold text-sm text-[var(--christo-text)] mb-3 border-l-2 border-[var(--christo-accent)] pl-2' }, data?.title || 'Extension Panel Workspace'),
    React.createElement('div', { className: 'text-xs text-[var(--christo-muted)] leading-relaxed' }, data?.content || 'Extension workspace details.')
  );
};
export default ChristoPluginPanel;
