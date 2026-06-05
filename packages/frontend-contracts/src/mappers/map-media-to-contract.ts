import { MediaCardContract } from '../components/media-card.contract';
import { MediaPlayerContract } from '../components/media-player.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapMediaItemToMediaCardContract(item: any, tenantId: string): MediaCardContract {
  if (item.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on media card mapping');
  }

  return {
    id: item.id,
    title: item.title || 'Untitled Media',
    type: (item.fileType || item.type || 'video'),
    thumbnailUrl: item.thumbnailUrl || null,
    durationSeconds: item.durationSeconds || item.duration || null,
    date: new Date(item.createdAt || Date.now()).toISOString(),
    cta: getStandardCTA('view', { url: `/media/${item.id}` })
  };
}

export function mapMediaItemToMediaPlayerContract(item: any, tenantId: string): MediaPlayerContract {
  if (item.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on media player mapping');
  }

  return {
    id: item.id,
    title: item.title || 'Untitled Media',
    description: item.description || null,
    media: {
      id: item.id,
      type: (item.fileType || item.type || 'video'),
      title: item.title,
      sources: [{ url: item.storageProviderRef || item.url || '', mimeType: item.fileType || 'video/mp4' }]
    },
    seo: {
      title: item.title,
      description: item.description || null
    }
  };
}
