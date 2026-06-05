import { VisibilityRuleContract } from './visibility.types';
import { EntitlementRuleContract } from './entitlement.types';
import { SEOContract } from './seo.types';
import { AnalyticsEventContract } from './analytics.types';
import { UIStateContract } from './state.types';
import { CTAContract } from './cta.types';
import { ThemeSlotContract } from './theme-slot.types';
import { FormContract } from './form.types';

export interface PublicRouteContract {
  path: string;
  type: 'listing' | 'detail' | 'embedded' | 'screen';
  displayName: string;
  isLocked?: boolean;
}

export interface WidgetContract {
  widgetKey: string;
  displayName: string;
  exposedThemeSlots: string[];
  supportedCTAs: string[];
}

export interface MemberSurfaceContract {
  screenKey: string;
  displayName: string;
  requiredRoles: string[];
  isLocked?: boolean;
}

export interface TenantContextContract {
  tenantId: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  status: 'active' | 'suspended' | 'trialing';
}

export interface ClientContextContract {
  tenant: TenantContextContract;
  activeBranchId?: string;
  memberId?: string;
  roles?: string[];
  preferredLanguage: string;
  isPreviewMode: boolean;
}

export interface ModuleUIContract {
  moduleKey: string;
  displayName: string;
  publicRoutes: PublicRouteContract[];
  widgets: WidgetContract[];
  forms: FormContract[];
  memberSurfaces: MemberSurfaceContract[];
  ctas: CTAContract[];
  states: UIStateContract[];
  dataContracts: string[];
  themeSlots: ThemeSlotContract[];
  entitlementRules: EntitlementRuleContract[];
  seo: SEOContract;
  localizationKeys: string[];
  analyticsEvents: AnalyticsEventContract[];
  dependencies?: string[];
  permissions?: string[];
}
