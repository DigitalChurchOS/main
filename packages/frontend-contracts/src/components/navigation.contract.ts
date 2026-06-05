import { VisibilityState } from '../core/visibility.types';

export interface NavigationItemContract {
  label: string;
  url: string;
  target?: '_self' | '_blank';
  isMemberOnly?: boolean;
  requiredPermissions?: string[];
  children?: NavigationItemContract[];
}

export interface NavigationMenuContract {
  id: string;
  name: string;
  items: NavigationItemContract[];
  visibility: VisibilityState;
}
