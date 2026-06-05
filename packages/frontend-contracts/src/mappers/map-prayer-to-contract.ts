import { PrayerSessionCardContract } from '../components/prayer-session-card.contract';
import { PrayerRoomContract } from '../components/prayer-room.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapPrayerSessionToPrayerSessionContract(session: any, tenantId: string): PrayerSessionCardContract {
  if (session.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on prayer session mapping');
  }

  return {
    id: session.id,
    title: session.title || 'Worship Prayer Room',
    startTime: new Date(session.startTime || Date.now()).toISOString(),
    endTime: new Date(session.endTime || Date.now() + 3600000).toISOString(),
    hostName: session.hostName || session.host?.name || 'Prayer Leader',
    activeParticipants: session.activeParticipants || 0,
    cta: getStandardCTA('join', { url: `/prayer/room/${session.id}` })
  };
}

export function mapPrayerRequestToPrayerWallContract(requests: any[], tenantId: string): any {
  return {
    requests: requests.map(req => {
      if (req.tenantId !== tenantId) {
        throw new Error('Tenant isolation violation on prayer request mapping');
      }
      return {
        id: req.id,
        requesterName: req.isAnonymous ? 'Anonymous' : (req.requesterName || req.member?.firstName || 'Someone'),
        requestText: req.requestText || req.content || '',
        date: new Date(req.createdAt || Date.now()).toISOString(),
        prayersCount: req.prayersCount || 0,
        hasPrayed: !!req.hasPrayed
      };
    }),
    submitRequestCta: getStandardCTA('pray', { url: '/prayer/new' })
  };
}
