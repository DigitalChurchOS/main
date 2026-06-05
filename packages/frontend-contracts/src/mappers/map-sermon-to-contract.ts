import { SermonCardContract } from '../components/sermon-card.contract';
import { SermonPlayerContract } from '../components/sermon-player.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapSermonToSermonCardContract(sermon: any, tenantId: string): SermonCardContract {
  if (sermon.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on sermon card mapping');
  }

  return {
    id: sermon.id,
    title: sermon.title || 'Untitled Sermon',
    speaker: sermon.speaker || 'Guest Speaker',
    seriesName: sermon.seriesName || sermon.series || null,
    date: new Date(sermon.date || sermon.createdAt || Date.now()).toISOString(),
    thumbnailUrl: sermon.thumbnailUrl || null,
    cta: getStandardCTA('watch', { url: `/sermons/${sermon.id}` })
  };
}

export function mapSermonToSermonPlayerContract(sermon: any, tenantId: string): SermonPlayerContract {
  if (sermon.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on sermon player mapping');
  }

  return {
    id: sermon.id,
    title: sermon.title || 'Untitled Sermon',
    speaker: sermon.speaker || 'Guest Speaker',
    seriesName: sermon.seriesName || sermon.series || null,
    date: new Date(sermon.date || sermon.createdAt || Date.now()).toISOString(),
    description: sermon.description || null,
    media: {
      id: sermon.mediaId || sermon.id,
      type: 'video',
      title: sermon.title,
      sources: [{ url: sermon.videoUrl || sermon.streamUrl || '', mimeType: 'video/mp4' }]
    },
    notesHtml: sermon.notesHtml || sermon.notes || null,
    seo: {
      title: sermon.title,
      description: sermon.description || null
    }
  };
}
