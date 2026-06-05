import { TestimonyCardContract } from '../components/testimony-card.contract';
import { TestimonyWallContract } from '../components/testimony-wall.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapTestimonyToTestimonyCardContract(testimony: any, tenantId: string): TestimonyCardContract {
  if (testimony.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on testimony mapping');
  }

  return {
    id: testimony.id,
    authorName: testimony.isAnonymous ? 'Anonymous' : (testimony.authorName || testimony.member?.firstName || 'A Believer'),
    content: testimony.content || testimony.testimonyText || '',
    date: new Date(testimony.createdAt || Date.now()).toISOString(),
    likesCount: testimony.likesCount || 0,
    cta: getStandardCTA('share', { url: `/testimonies/${testimony.id}` })
  };
}

export function mapTestimoniesToWallContract(testimonies: any[], tenantId: string): TestimonyWallContract {
  return {
    testimonies: testimonies.map(t => mapTestimonyToTestimonyCardContract(t, tenantId)),
    submitTestimonyCta: getStandardCTA('share', { url: '/testimonies/new' })
  };
}
