import React from 'react';
import { ChristoButton } from '../components/ChristoButton';

export interface ChristoPluginInlineActionProps {
  data: any;
  context: any;
}

export const ChristoPluginInlineAction: React.FC<ChristoPluginInlineActionProps> = ({ data }) => {
  return React.createElement(
    'span',
    { className: 'inline-block my-1' },
    React.createElement(
      ChristoButton,
      {
        variant: 'accent-text',
        onClick: () => { if (data?.url) window.location.href = data.url; },
        className: 'px-2 py-1 text-xs'
      },
      React.createElement('span', null, `⚡ ${data?.label || 'Action'}`)
    )
  );
};
export default ChristoPluginInlineAction;
