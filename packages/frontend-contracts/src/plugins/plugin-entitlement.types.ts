import { BillingPlanTier } from '../core/entitlement.types';

export interface PluginEntitlementRule {
  minBillingTier?: BillingPlanTier;
  requiredModules?: string[];
  activeSubscriptionRequired?: boolean;
  tenantFeatureFlag?: string;
  pluginLicenseStatusRequired?: 'active' | 'trialing' | 'any';
  integrationConnectionStatusRequired?: string;
  publicVisibilityApproved?: boolean;
  marketplaceApprovalRequired?: boolean;
}
