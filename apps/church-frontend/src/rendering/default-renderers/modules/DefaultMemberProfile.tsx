import React from 'react';
import { MemberProfileContract } from '@churchos/frontend-contracts';

export const DefaultMemberProfile: React.FC<{ data: MemberProfileContract }> = ({ data }) => {
  if (!data) return null;

  return React.createElement(
    'div',
    { className: 'p-6 bg-white border border-slate-200 rounded-xl space-y-4 font-sans max-w-md' },
    React.createElement('div', { className: 'flex items-center space-x-4' },
      data.photoUrl
        ? React.createElement('img', {
            src: data.photoUrl,
            alt: `${data.firstName} ${data.lastName}`,
            className: 'w-16 h-16 rounded-full border border-slate-100'
          })
        : React.createElement('div', { className: 'w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold' }, `${data.firstName[0]}${data.lastName[0]}`),
      React.createElement(
        'div',
        null,
        React.createElement('h3', { className: 'text-base font-bold text-slate-800' }, `${data.firstName} ${data.lastName}`),
        React.createElement('span', { className: 'text-2xs text-slate-400 font-semibold uppercase tracking-wider' }, `Joined: ${new Date(data.joinedDate).toLocaleDateString()}`)
      )
    ),
    React.createElement('hr', { className: 'border-slate-100' }),
    React.createElement(
      'div',
      { className: 'space-y-2 text-xs text-slate-600' },
      data.email && React.createElement('div', null, `📧 Email: ${data.email}`),
      data.phone && React.createElement('div', null, `📞 Phone: ${data.phone}`),
      data.branchName && React.createElement('div', null, `🏢 Branch: ${data.branchName}`)
    )
  );
};
