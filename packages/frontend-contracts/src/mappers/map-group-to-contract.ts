import { GroupCardContract } from '../components/group-card.contract';
import { GroupDetailContract } from '../components/group-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapGroupToGroupCardContract(group: any, tenantId: string): GroupCardContract {
  if (group.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on group card mapping');
  }

  return {
    id: group.id,
    name: group.name || 'Worship Fellowship Group',
    description: group.description || null,
    type: group.type || 'cell',
    leaderName: group.leaderName || group.leader?.firstName || 'Fellowship Leader',
    schedule: group.schedule || 'Weekly',
    cta: getStandardCTA('join', { url: `/groups/${group.id}` })
  };
}

export function mapGroupToGroupDetailContract(group: any, tenantId: string): GroupDetailContract {
  if (group.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on group detail mapping');
  }

  return {
    id: group.id,
    name: group.name || 'Worship Fellowship Group',
    description: group.description || null,
    schedule: group.schedule || 'Weekly',
    location: group.location || 'Church Annex',
    membersCount: group.membersCount || (group.members?.length || 0),
    joinForm: {
      formKey: `join-group-${group.id}`,
      displayName: `Join Group: ${group.name}`,
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', validation: { required: true } },
        { name: 'email', label: 'Email', type: 'email', validation: { required: true } }
      ],
      submitUrl: `/api/groups/${group.id}/join`,
      submitMethod: 'POST'
    },
    seo: {
      title: group.name,
      description: group.description || null
    }
  };
}
