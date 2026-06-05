import React, { useState } from 'react';
import { GivingFormContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultGivingForm: React.FC<{ data: GivingFormContract }> = ({ data }) => {
  if (!data) return null;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  // We can inject the selected amount into the form fields if needed
  const modifiedForm = {
    ...data.form,
    fields: data.form.fields.map((f: any) => {
      if (f.name === 'amount' && selectedAmount !== null) {
        return { ...f, defaultValue: selectedAmount };
      }
      return f;
    })
  };

  return React.createElement(
    'div',
    { className: 'max-w-xl mx-auto space-y-6 font-sans py-4' },
    React.createElement('div', { className: 'text-center space-y-1' },
      React.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, 'Support the Ministry'),
      React.createElement('p', { className: 'text-xs text-slate-500' }, 'Select an amount or input your custom donation in the form below.')
    ),
    
    // Suggested amounts selection buttons
    data.suggestedAmounts && data.suggestedAmounts.length > 0 && React.createElement(
      'div',
      { className: 'flex justify-center space-x-2 flex-wrap gap-y-2' },
      data.suggestedAmounts.map((amount: number) =>
        React.createElement(
          'button',
          {
            key: amount,
            onClick: () => setSelectedAmount(amount),
            className: `px-4 py-2 border rounded-md text-xs font-semibold transition ${
              selectedAmount === amount
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-800'
            }`
          },
          `$${amount}`
        )
      ),
      React.createElement(
        'button',
        {
          onClick: () => setSelectedAmount(null),
          className: `px-4 py-2 border rounded-md text-xs font-semibold transition ${
            selectedAmount === null
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-800'
          }`
        },
        'Custom'
      )
    ),
    
    // Core dynamic Form
    React.createElement(DefaultFormRenderer, {
      key: selectedAmount === null ? 'custom' : selectedAmount,
      formContract: modifiedForm
    })
  );
};
