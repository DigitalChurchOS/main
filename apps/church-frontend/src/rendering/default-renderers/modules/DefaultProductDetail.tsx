import React from 'react';
import { ProductDetailContract } from '@churchos/frontend-contracts';
import { DefaultFormRenderer } from '../forms/DefaultFormRenderer';

export const DefaultProductDetail: React.FC<{ data: ProductDetailContract }> = ({ data }) => {
  if (!data) return null;

  const mainImage = data.images && data.images.length > 0 ? data.images[0] : null;

  return React.createElement(
    'div',
    { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 font-sans' },
    
    // Product Image
    React.createElement(
      'div',
      { className: 'flex justify-center' },
      mainImage
        ? React.createElement('img', {
            src: mainImage,
            alt: data.title,
            className: 'w-full h-80 object-cover rounded-xl border border-slate-100 shadow-sm'
          })
        : React.createElement('div', { className: 'w-full h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm' }, 'No image available.')
    ),
    
    // Product details & buy form
    React.createElement(
      'div',
      { className: 'space-y-6' },
      React.createElement('div', { className: 'space-y-2' },
        React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, data.title),
        React.createElement('div', { className: 'text-xl font-bold text-slate-900' }, `$${data.price.toFixed(2)}`)
      ),
      React.createElement('hr', { className: 'border-slate-200' }),
      
      data.descriptionHtml
        ? React.createElement('div', {
            className: 'text-sm text-slate-600 leading-relaxed prose prose-slate',
            dangerouslySetInnerHTML: { __html: data.descriptionHtml }
          })
        : React.createElement('p', { className: 'text-sm text-slate-500' }, 'No description available.'),
      
      React.createElement('div', { className: 'mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl' },
        React.createElement('h3', { className: 'text-xs font-bold text-slate-800 uppercase tracking-wider mb-3' }, 'Purchase Details'),
        React.createElement(DefaultFormRenderer, { formContract: data.purchaseForm })
      )
    )
  );
};
