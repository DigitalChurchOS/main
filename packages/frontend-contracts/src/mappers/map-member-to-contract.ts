import { MemberProfileContract } from '../components/member-profile.contract';

export function mapMemberToMemberProfileContract(member: any, tenantId: string): MemberProfileContract {
  if (member.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on member profile mapping');
  }

  return {
    id: member.id,
    firstName: member.firstName || 'First',
    lastName: member.lastName || 'Last',
    email: member.email || null,
    phone: member.phone || null,
    photoUrl: member.photoUrl || null,
    branchName: member.branchName || member.branch?.name || null,
    joinedDate: new Date(member.createdAt || Date.now()).toISOString()
  };
}
