import { EventCardContract } from '../components/event-card.contract';
import { EventDetailContract } from '../components/event-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapEventToEventCardContract(event: any, tenantId: string): EventCardContract {
  if (event.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation: record tenantId does not match context.');
  }

  return {
    id: event.id,
    title: event.title || 'Untitled Event',
    description: event.description || null,
    imageUrl: event.imageUrl || event.photoUrl || null,
    startDateTime: new Date(event.startDateTime || event.startTime || Date.now()).toISOString(),
    endDateTime: new Date(event.endDateTime || event.endTime || Date.now()).toISOString(),
    location: event.location || 'Online',
    cta: getStandardCTA('register', { url: `/events/${event.id}` }),
    visibility: (event.visibility || 'public_active')
  };
}

export function mapEventToEventDetailContract(event: any, tenantId: string): EventDetailContract {
  if (event.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation: record tenantId does not match context.');
  }

  return {
    id: event.id,
    title: event.title || 'Untitled Event',
    description: event.description || null,
    contentHtml: event.contentHtml || event.description || null,
    imageUrl: event.imageUrl || event.photoUrl || null,
    startDateTime: new Date(event.startDateTime || event.startTime || Date.now()).toISOString(),
    endDateTime: new Date(event.endDateTime || event.endTime || Date.now()).toISOString(),
    location: event.location || 'Online',
    organizer: event.organizer || 'Church Admin',
    capacity: event.capacity || null,
    registeredCount: event.registeredCount || 0,
    registrationCta: getStandardCTA('register', { url: `/events/${event.id}/register` }),
    seo: {
      title: event.seoTitle || event.title || 'Church Event Details',
      description: event.seoDescription || event.description || null
    },
    visibility: (event.visibility || 'public_active')
  };
}
