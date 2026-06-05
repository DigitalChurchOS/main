import React from 'react';
import { MediaPlayerContract } from '@churchos/frontend-contracts';

export const DefaultMediaPlayer: React.FC<{ data: MediaPlayerContract }> = ({ data }) => {
  if (!data) return null;

  const videoUrl = data.media?.sources?.[0]?.url;
  const isVideo = data.media?.type === 'video' || videoUrl?.endsWith('.mp4');

  return React.createElement(
    'div',
    { className: 'space-y-6 font-sans py-4 max-w-4xl mx-auto' },
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
        : React.createElement('div', { className: 'text-slate-500 text-sm' }, 'No media asset source configured.')
    ),
    React.createElement(
      'div',
      { className: 'space-y-2' },
      React.createElement('h1', { className: 'text-2xl font-bold text-slate-800' }, data.title),
      data.description && React.createElement('p', { className: 'text-sm text-slate-600 leading-relaxed' }, data.description)
    )
  );
};
