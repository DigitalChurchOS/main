import { CampaignCardContract } from '../components/campaign-card.contract';
import { CampaignProgressContract } from '../components/campaign-progress.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapCampaignToCampaignCardContract(camp: any, tenantId: string): CampaignCardContract {
  if (camp.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on campaign card mapping');
  }

  return {
    id: camp.id,
    title: camp.title || 'Kingdom Project',
    description: camp.description || null,
    thumbnailUrl: camp.thumbnailUrl || camp.imageUrl || null,
    targetAmount: camp.targetAmount || camp.goalAmount || 0,
    currentAmount: camp.currentAmount || 0,
    cta: getStandardCTA('partner', { url: `/campaigns/${camp.id}` })
  };
}

export function mapCampaignToProgressContract(camp: any, tenantId: string): CampaignProgressContract {
  if (camp.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on campaign progress mapping');
  }

  const target = camp.targetAmount || camp.goalAmount || 1;
  const current = camp.currentAmount || 0;
  const percent = Math.min(Math.round((current / target) * 100), 100);

  return {
    campaignId: camp.id,
    targetAmount: target,
    currentAmount: current,
    donorsCount: camp.donorsCount || 0,
    percentComplete: percent,
    progressColor: camp.progressColor || '#4f46e5'
  };
}
