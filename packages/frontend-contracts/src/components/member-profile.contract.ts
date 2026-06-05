export interface MemberProfileContract {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  branchName?: string | null;
  joinedDate: string;
}
