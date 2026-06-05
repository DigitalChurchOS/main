import React from 'react';
import { ChristoCard } from '../components/ChristoCard';

export interface ChristoPluginWidgetProps {
  data: any;
  context: any;
}

export const ChristoPluginWidget: React.FC<ChristoPluginWidgetProps> = ({ data }) => {
  return React.createElement(
    ChristoCard,
    { className: 'p-4 bg-[var(--christo-surface-soft)] my-2' },
    React.createElement('h4', { className: 'font-bold text-xs text-[var(--christo-text)] mb-1' }, data?.title || 'Extension Widget'),
    React.createElement('p', { className: 'text-[11px] text-[var(--christo-muted)]' }, data?.description || 'Extension widget content details.')
  );
};
export default ChristoPluginWidget;
