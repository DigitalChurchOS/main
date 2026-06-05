import React, { useState } from 'react';
import { PrayerWallContract } from '@churchos/frontend-contracts';

export const DefaultPrayerWall: React.FC<{ data: PrayerWallContract }> = ({ data }) => {
  if (!data) return null;

  const [prayedStates, setPrayedStates] = useState<Record<string, { count: number; active: boolean }>>(() => {
    const states: Record<string, { count: number; active: boolean }> = {};
    data.requests.forEach((r: any) => {
      states[r.id] = { count: r.prayersCount, active: !!r.hasPrayed };
    });
    return states;
  });

  const handlePray = (id: string) => {
    setPrayedStates(prev => {
      const current = prev[id];
      if (current.active) {
        return { ...prev, [id]: { count: current.count - 1, active: false } };
      } else {
        return { ...prev, [id]: { count: current.count + 1, active: true } };
      }
    });
  };

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
    
    // Header section with action to submit request
    React.createElement(
      'div',
      { className: 'flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4' },
      React.createElement(
        'div',
        { className: 'space-y-1' },
        React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, 'Prayer Wall'),
        React.createElement('p', { className: 'text-xs text-slate-500' }, 'Bear one another\'s burdens, and so fulfill the law of Christ.')
      ),
      React.createElement(
        'a',
        {
          href: data.submitRequestCta.url || '#',
          className: 'px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition'
        },
        data.submitRequestCta.label || 'Submit Request'
      )
    ),
    
    // Grid of active requests
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      data.requests.map((req: any) => {
        const pState = prayedStates[req.id] || { count: req.prayersCount, active: !!req.hasPrayed };
        
        return React.createElement(
          'div',
          { key: req.id, className: 'p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4 flex flex-col justify-between' },
          React.createElement(
            'div',
            { className: 'space-y-2' },
            React.createElement(
              'div',
              { className: 'flex justify-between items-center text-2xs text-slate-400 font-medium' },
              React.createElement('span', { className: 'font-semibold text-slate-700' }, req.requesterName || 'Anonymous'),
              React.createElement('span', null, new Date(req.date).toLocaleDateString())
            ),
            React.createElement('p', { className: 'text-xs text-slate-600 italic leading-relaxed' }, `"${req.requestText}"`)
          ),
          React.createElement(
            'div',
            { className: 'flex items-center justify-between border-t border-slate-100 pt-3' },
            React.createElement('span', { className: 'text-2xs text-slate-400 font-semibold' }, `🙏 Prayed for ${pState.count} times`),
            React.createElement(
              'button',
              {
                onClick: () => handlePray(req.id),
                className: `px-3 py-1.5 border rounded text-2xs font-bold transition ${
                  pState.active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-800'
                }`
              },
              pState.active ? 'I Prayed!' : 'Pray'
            )
          )
        );
      })
    )
  );
};
