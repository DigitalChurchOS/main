export type VisibilityState =
  | 'public_active'
  | 'member_only'
  | 'password_protected'
  | 'preview_only'
  | 'disabled'
  | 'locked'
  | 'setup_required'
  | 'coming_soon'
  | 'suspended'
  | 'trial_expired'
  | 'no_content'
  | 'error';

export interface VisibilityRuleContract {
  state: VisibilityState;
  passwordHash?: string; // If password protected
  allowedRoles?: string[]; // If role-restricted / member portal
  branchId?: string; // If branch-scoped
}
