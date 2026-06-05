import React from 'react';
import { SermonPlayerContract } from '@churchos/frontend-contracts';

export const DefaultSermonPlayer: React.FC<{ data: SermonPlayerContract }> = ({ data }) => {
  if (!data) return null;

  const videoUrl = data.media?.sources?.[0]?.url;
  const isVideo = data.media?.type === 'video' || videoUrl?.endsWith('.mp4');

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
    
    // Media Player element
    React.createElement(
      'div',
      { className: 'w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm flex items-center justify-center' },
      videoUrl
        ? (isVideo
            ? React.createElement('video', {
                src: videoUrl,
                controls: true,
                poster: data.media.thumbnailUrl || undefined,
                className: 'w-full h-full object-contain'
              })
            : React.createElement('audio', {
                src: videoUrl,
                controls: true,
                className: 'w-3/4 mx-auto'
              })
          )
        : React.createElement('div', { className: 'text-slate-500 text-sm' }, 'No audio/video resource available.')
    ),
    
    // Details block
    React.createElement(
      'div',
      { className: 'space-y-3' },
      React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, data.title),
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-4 text-xs font-semibold text-slate-400 uppercase tracking-wider' },
        React.createElement('span', null, `🗣️ Speaker: ${data.speaker}`),
        data.seriesName && React.createElement('span', null, `📚 Series: ${data.seriesName}`),
        React.createElement('span', null, `📅 Date: ${new Date(data.date).toLocaleDateString()}`)
      ),
      data.description && React.createElement('p', { className: 'text-sm text-slate-600 leading-relaxed' }, data.description)
    ),
    
    // Sermon notes tab
    data.notesHtml && React.createElement(
      'div',
      { className: 'p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs' },
      React.createElement('h3', { className: 'text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5' }, '📝 Sermon Notes'),
      React.createElement('div', {
        className: 'prose prose-slate text-xs text-slate-500 leading-relaxed',
        dangerouslySetInnerHTML: { __html: data.notesHtml }
      })
    )
  );
};
