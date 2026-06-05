import { LivestreamPlayerContract } from '../components/livestream-player.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapLivestreamToContract(stream: any, tenantId: string): LivestreamPlayerContract {
  if (stream.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on livestream mapping');
  }

  return {
    id: stream.id,
    title: stream.title || 'Sunday Worship Service',
    status: (stream.status || 'offline'),
    streamUrl: stream.streamUrl || null,
    countdownTarget: stream.countdownTarget || null,
    chatEnabled: !!stream.chatEnabled,
    cta: stream.status === 'live' ? getStandardCTA('watch', { url: '/live' }) : null
  };
}
