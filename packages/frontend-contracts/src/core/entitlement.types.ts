export type BillingPlanTier = 'free' | 'growth' | 'enterprise';

export interface EntitlementRuleContract {
  moduleKey: string;
  minBillingTier?: BillingPlanTier;
  allowTrial?: boolean;
  requiredUsageMeter?: string;
  usageLimit?: number;
}
