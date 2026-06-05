import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

export const BILLING_MODULE_KEY = 'billing-subscription-management';

export const BILLING_PERMISSIONS = [
  'billing-subscription-management.read',
  'billing-subscription-management.create',
  'billing-subscription-management.update',
  'billing-subscription-management.delete',
  'billing-subscription-management.manage_settings',
  'billing-subscription-management.view_reports',
];

type JsonLike = Record<string, any> | any[];

type BillingRecordInput = {
  title?: string;
  name?: string;
  description?: string | null;
  status?: string;
  settingsJson?: any;
  visibility?: string;
};

type PlanInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  currency?: string;
  billingInterval?: string;
  basePrice?: number;
  includedMembers?: number;
  includedSms?: number;
  includedEmail?: number;
  includedStorageGb?: number;
  includedVideoBandwidthGb?: number;
  includedAiTokens?: number;
  includedMeetingParticipantHours?: number;
  memberOverageRate?: number;
  smsOverageRate?: number;
  emailOverageRate?: number;
  storageOverageRate?: number;
  videoBandwidthOverageRate?: number;
  aiTokenOverageRate?: number;
  meetingParticipantHourRate?: number;
  featuresJson?: any;
  modulesJson?: any;
  isActive?: boolean;
};

type AddOnInput = {
  key?: string;
  name?: string;
  description?: string | null;
  moduleKey?: string | null;
  price?: number;
  billingMode?: string;
  usageMetricKey?: string | null;
  includedQuantity?: number;
  overageRate?: number;
  isActive?: boolean;
};

type CouponInput = {
  code?: string;
  description?: string | null;
  discountType?: string;
  discountValue?: number;
  maxRedemptions?: number | null;
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
  isActive?: boolean;
  metadataJson?: any;
};

const DEFAULT_SETTINGS_CONFIG = {
  paymentProviders: ['stripe', 'paypal', 'flutterwave', 'paystack', 'paddle'],
  defaultProvider: 'stripe',
  allowTenantPreview: true,
  publicPublishingRequiresPaidAccess: true,
  invoicePrefix: 'INV',
  moduleAccessMode: 'preview_in_dashboard',
};

const METRIC_DEFINITIONS = [
  {
    key: 'active_members',
    aliases: [] as string[],
    label: 'Active members',
    planIncludedField: 'includedMembers',
    planRateField: 'memberOverageRate',
    unit: 'members',
  },
  {
    key: 'sms_sent',
    aliases: [] as string[],
    label: 'SMS messages',
    planIncludedField: 'includedSms',
    planRateField: 'smsOverageRate',
    unit: 'messages',
  },
  {
    key: 'email_sent',
    aliases: [] as string[],
    label: 'Email messages',
    planIncludedField: 'includedEmail',
    planRateField: 'emailOverageRate',
    unit: 'messages',
  },
  {
    key: 'storage_gb',
    aliases: [] as string[],
    label: 'Media storage',
    planIncludedField: 'includedStorageGb',
    planRateField: 'storageOverageRate',
    unit: 'GB',
  },
  {
    key: 'video_bandwidth_gb',
    aliases: [] as string[],
    label: 'Video bandwidth',
    planIncludedField: 'includedVideoBandwidthGb',
    planRateField: 'videoBandwidthOverageRate',
    unit: 'GB',
  },
  {
    key: 'ai_tokens',
    aliases: [] as string[],
    label: 'AI tokens',
    planIncludedField: 'includedAiTokens',
    planRateField: 'aiTokenOverageRate',
    unit: 'tokens',
  },
  {
    key: 'meeting_participant_hours',
    aliases: ['meeting_hours'],
    label: 'Meeting participant-hours',
    planIncludedField: 'includedMeetingParticipantHours',
    planRateField: 'meetingParticipantHourRate',
    unit: 'hours',
  },
];

const DEFAULT_PLANS: PlanInput[] = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'A calm entry plan for churches getting their site and member tools online.',
    basePrice: 0,
    includedMembers: 75,
    includedSms: 100,
    includedEmail: 1000,
    includedStorageGb: 5,
    includedVideoBandwidthGb: 25,
    includedAiTokens: 0,
    includedMeetingParticipantHours: 0,
    memberOverageRate: 0,
    smsOverageRate: 0,
    emailOverageRate: 0,
    storageOverageRate: 0,
    videoBandwidthOverageRate: 0,
    aiTokenOverageRate: 0,
    meetingParticipantHourRate: 0,
    featuresJson: ['Website CMS preview', 'Member directory preview', 'Basic support'],
    modulesJson: ['website-cms', 'member-crm'],
  },
  {
    name: 'Growth',
    slug: 'growth',
    description: 'For active churches using communications, media, and admin workflows weekly.',
    basePrice: 49,
    includedMembers: 500,
    includedSms: 1000,
    includedEmail: 10000,
    includedStorageGb: 100,
    includedVideoBandwidthGb: 500,
    includedAiTokens: 50000,
    includedMeetingParticipantHours: 100,
    memberOverageRate: 0.25,
    smsOverageRate: 0.05,
    emailOverageRate: 0.001,
    storageOverageRate: 1.5,
    videoBandwidthOverageRate: 0.12,
    aiTokenOverageRate: 0.0001,
    meetingParticipantHourRate: 1.5,
    featuresJson: ['Module add-ons', 'Usage billing', 'Invoices', 'Email and SMS metering'],
    modulesJson: ['website-cms', 'member-crm', 'media-sermons', 'giving-donations'],
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For multi-campus churches that need custom contracts, limits, and providers.',
    basePrice: 199,
    includedMembers: 5000,
    includedSms: 10000,
    includedEmail: 100000,
    includedStorageGb: 1000,
    includedVideoBandwidthGb: 5000,
    includedAiTokens: 500000,
    includedMeetingParticipantHours: 1000,
    memberOverageRate: 0.1,
    smsOverageRate: 0.035,
    emailOverageRate: 0.0005,
    storageOverageRate: 1,
    videoBandwidthOverageRate: 0.08,
    aiTokenOverageRate: 0.000075,
    meetingParticipantHourRate: 1,
    featuresJson: ['Enterprise contracts', 'White-label options', 'Advanced provider controls', 'Priority support'],
    modulesJson: ['website-cms', 'member-crm', 'media-sermons', 'giving-donations', 'live-meetings', 'commerce'],
  },
];

const DEFAULT_ADD_ONS: AddOnInput[] = [
  {
    key: 'media-hosting',
    name: 'Managed media hosting',
    description: 'Extra sermon and video storage hosted by the platform.',
    moduleKey: 'media-sermons',
    price: 29,
    billingMode: 'monthly',
    usageMetricKey: 'storage_gb',
    includedQuantity: 250,
    overageRate: 1,
  },
  {
    key: 'live-meetings',
    name: 'Live meetings',
    description: 'Prayer rooms, fellowship meetings, webinars, and participant-hour billing.',
    moduleKey: 'live-meetings',
    price: 19,
    billingMode: 'monthly',
    usageMetricKey: 'meeting_participant_hours',
    includedQuantity: 100,
    overageRate: 1,
  },
  {
    key: 'ai-ministry-pack',
    name: 'AI ministry pack',
    description: 'AI generation, transcription, summaries, and content drafting usage.',
    moduleKey: 'ai-assistant-ministry-copilot',
    price: 39,
    billingMode: 'monthly',
    usageMetricKey: 'ai_tokens',
    includedQuantity: 250000,
    overageRate: 0.00008,
  },
];

function jsonString(value: any, fallback: JsonLike = {}): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value ?? fallback);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function nonNegativeNumber(value: any, field: string, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return numeric;
}

function integerNumber(value: any, field: string, fallback = 0): number {
  const numeric = nonNegativeNumber(value, field, fallback);
  if (!Number.isInteger(numeric)) {
    throw new Error(`${field} must be a whole number`);
  }
  return numeric;
}

function nullableDate(value: string | Date | null | undefined, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return date;
}

function normalizeMetricKey(metricKey: string): string {
  const match = METRIC_DEFINITIONS.find((metric) => metric.key === metricKey || metric.aliases.includes(metricKey));
  return match ? match.key : metricKey;
}

function metricDefinition(metricKey: string) {
  const normalized = normalizeMetricKey(metricKey);
  return METRIC_DEFINITIONS.find((metric) => metric.key === normalized);
}

function planIncluded(plan: any, metricKey: string): number {
  const definition = metricDefinition(metricKey);
  if (!definition) return 0;
  return Number(plan[definition.planIncludedField] || 0);
}

function planRate(plan: any, metricKey: string): number {
  const definition = metricDefinition(metricKey);
  if (!definition) return 0;
  return Number(plan[definition.planRateField] || 0);
}

async function recordBillingEvent(tenantId: string, name: string, metadata: Record<string, any>, userId?: string | null) {
  try {
    await trackEvent(tenantId, {
      category: 'billing',
      name,
      entityId: metadata.entityId || null,
      value: metadata.value !== undefined ? Number(metadata.value) : null,
      userId: userId || null,
      metadata,
    });
  } catch {
    // Analytics hooks should not block billing state changes.
  }
}

export class BillingService {
  static async ensureDefaultPlans() {
    const count = await prisma.subscriptionPlan.count();
    if (count > 0) return;

    for (const plan of DEFAULT_PLANS) {
      await prisma.subscriptionPlan.create({ data: this.normalizePlanInput(plan, true) as any });
    }
  }

  static async ensureTenantCatalog(tenantId: string) {
    await this.ensureDefaultPlans();

    await prisma.moduleDefinition.upsert({
      where: { key: BILLING_MODULE_KEY },
      update: { name: 'Billing & Subscription Management', category: 'Admin', dependencies: '[]' },
      create: {
        key: BILLING_MODULE_KEY,
        name: 'Billing & Subscription Management',
        category: 'Admin',
        dependencies: '[]',
      },
    });

    const addOnCount = await prisma.billingAddOn.count({ where: { tenantId } });
    if (addOnCount === 0) {
      for (const addOn of DEFAULT_ADD_ONS) {
        await prisma.billingAddOn.create({ data: this.normalizeAddOnInput(tenantId, addOn, true) as any });
      }
    }

    await this.getSettings(tenantId);
  }

  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.billingSubscriptionManagementModuleActivity.create({
      data: {
        tenantId,
        userId: userId || null,
        actionType,
        metadataJson: jsonString(metadata, {}),
      },
    });

    await recordBillingEvent(tenantId, actionType, metadata, userId);
    return activity;
  }

  static async listRecords(tenantId: string) {
    return prisma.billingSubscriptionManagementModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getRecord(tenantId: string, id: string) {
    const record = await prisma.billingSubscriptionManagementModule.findFirst({ where: { tenantId, id } });
    if (!record) {
      throw new Error('Billing record not found');
    }
    return record;
  }

  static async createRecord(tenantId: string, userId: string | null, input: BillingRecordInput) {
    const title = input.title || input.name;
    if (!title) {
      throw new Error('title is required');
    }

    const record = await prisma.billingSubscriptionManagementModule.create({
      data: {
        tenantId,
        title,
        description: input.description || null,
        status: input.status || 'active',
        settingsJson: jsonString(input.settingsJson, {}),
        visibility: input.visibility || 'private',
        createdById: userId,
      },
    });

    await this.logActivity(tenantId, userId, 'billing_record_create', { entityId: record.id, title });
    return record;
  }

  static async updateRecord(tenantId: string, userId: string | null, id: string, input: BillingRecordInput) {
    const existing = await this.getRecord(tenantId, id);

    const updated = await prisma.billingSubscriptionManagementModule.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.name !== undefined && { title: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.settingsJson !== undefined && { settingsJson: jsonString(input.settingsJson, {}) }),
        ...(input.visibility !== undefined && { visibility: input.visibility }),
      },
    });

    await this.logActivity(tenantId, userId, 'billing_record_update', {
      entityId: updated.id,
      updatedFields: Object.keys(input),
    });
    return updated;
  }

  static async deleteRecord(tenantId: string, userId: string | null, id: string) {
    const existing = await this.getRecord(tenantId, id);
    await prisma.billingSubscriptionManagementModule.delete({ where: { id: existing.id } });
    await this.logActivity(tenantId, userId, 'billing_record_delete', { entityId: id, title: existing.title });
    return existing;
  }

  static normalizePlanInput(input: PlanInput, forCreate = false): Record<string, any> {
    const name = input.name?.trim();
    if (forCreate && !name) {
      throw new Error('name is required');
    }

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (input.slug !== undefined || forCreate) data.slug = input.slug || (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (input.description !== undefined) data.description = input.description;
    if (input.currency !== undefined || forCreate) data.currency = (input.currency || 'USD').toUpperCase();
    if (input.billingInterval !== undefined || forCreate) data.billingInterval = input.billingInterval || 'month';
    if (input.basePrice !== undefined || forCreate) data.basePrice = nonNegativeNumber(input.basePrice, 'basePrice');
    if (input.includedMembers !== undefined || forCreate) data.includedMembers = integerNumber(input.includedMembers, 'includedMembers');
    if (input.includedSms !== undefined || forCreate) data.includedSms = integerNumber(input.includedSms, 'includedSms');
    if (input.includedEmail !== undefined || forCreate) data.includedEmail = integerNumber(input.includedEmail, 'includedEmail');
    if (input.includedStorageGb !== undefined || forCreate) data.includedStorageGb = nonNegativeNumber(input.includedStorageGb, 'includedStorageGb');
    if (input.includedVideoBandwidthGb !== undefined || forCreate) data.includedVideoBandwidthGb = nonNegativeNumber(input.includedVideoBandwidthGb, 'includedVideoBandwidthGb');
    if (input.includedAiTokens !== undefined || forCreate) data.includedAiTokens = integerNumber(input.includedAiTokens, 'includedAiTokens');
    if (input.includedMeetingParticipantHours !== undefined || forCreate) data.includedMeetingParticipantHours = nonNegativeNumber(input.includedMeetingParticipantHours, 'includedMeetingParticipantHours');
    if (input.memberOverageRate !== undefined || forCreate) data.memberOverageRate = nonNegativeNumber(input.memberOverageRate, 'memberOverageRate');
    if (input.smsOverageRate !== undefined || forCreate) data.smsOverageRate = nonNegativeNumber(input.smsOverageRate, 'smsOverageRate');
    if (input.emailOverageRate !== undefined || forCreate) data.emailOverageRate = nonNegativeNumber(input.emailOverageRate, 'emailOverageRate');
    if (input.storageOverageRate !== undefined || forCreate) data.storageOverageRate = nonNegativeNumber(input.storageOverageRate, 'storageOverageRate');
    if (input.videoBandwidthOverageRate !== undefined || forCreate) data.videoBandwidthOverageRate = nonNegativeNumber(input.videoBandwidthOverageRate, 'videoBandwidthOverageRate');
    if (input.aiTokenOverageRate !== undefined || forCreate) data.aiTokenOverageRate = nonNegativeNumber(input.aiTokenOverageRate, 'aiTokenOverageRate');
    if (input.meetingParticipantHourRate !== undefined || forCreate) data.meetingParticipantHourRate = nonNegativeNumber(input.meetingParticipantHourRate, 'meetingParticipantHourRate');
    if (input.featuresJson !== undefined || forCreate) data.featuresJson = jsonString(input.featuresJson, []);
    if (input.modulesJson !== undefined || forCreate) data.modulesJson = jsonString(input.modulesJson, []);
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
    return data;
  }

  static async listPlans() {
    await this.ensureDefaultPlans();
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ basePrice: 'asc' }, { name: 'asc' }],
    });
  }

  static async createPlan(userId: string | null, tenantId: string, input: PlanInput) {
    const plan = await prisma.subscriptionPlan.create({
      data: this.normalizePlanInput(input, true) as any,
    });
    await this.logActivity(tenantId, userId, 'plan_create', { entityId: plan.id, name: plan.name, value: plan.basePrice });
    return plan;
  }

  static async updatePlan(userId: string | null, tenantId: string, id: string, input: PlanInput) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Plan not found');
    }
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: this.normalizePlanInput(input, false) as any,
    });
    await this.logActivity(tenantId, userId, 'plan_update', { entityId: plan.id, updatedFields: Object.keys(input) });
    return plan;
  }

  static async subscribeTenant(tenantId: string, userId: string | null, input: { planId: string; couponCode?: string; provider?: string; providerMode?: string; trialDays?: number }) {
    const { planId } = input;
    if (!planId) {
      throw new Error('planId is required');
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new Error('Plan not found');
    }

    if (input.couponCode) {
      await this.assertValidCoupon(tenantId, input.couponCode);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const trialDays = input.trialDays !== undefined ? integerNumber(input.trialDays, 'trialDays') : 0;
    const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

    const subscription = await prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId,
        status: trialEndsAt ? 'trialing' : 'active',
        provider: input.provider || 'internal',
        providerMode: input.providerMode || 'platform_managed',
        couponCode: input.couponCode ? input.couponCode.trim().toUpperCase() : undefined,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        tenantId,
        planId,
        status: trialEndsAt ? 'trialing' : 'active',
        provider: input.provider || 'internal',
        providerMode: input.providerMode || 'platform_managed',
        couponCode: input.couponCode ? input.couponCode.trim().toUpperCase() : null,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true, addOns: { include: { addOn: true } } },
    });

    await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'active' } });
    await this.syncPlanEntitlements(tenantId, plan, userId);
    await this.logActivity(tenantId, userId, 'subscription_change', {
      entityId: subscription.id,
      planId,
      planName: plan.name,
      couponCode: subscription.couponCode,
    });

    return subscription;
  }

  static async syncPlanEntitlements(tenantId: string, plan: any, userId?: string | null) {
    const moduleKeys = parseJson<string[]>(plan.modulesJson, []);
    for (const moduleKey of moduleKeys) {
      await prisma.moduleDefinition.upsert({
        where: { key: moduleKey },
        update: {},
        create: {
          key: moduleKey,
          name: moduleKey.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
          category: 'Plan',
          dependencies: '[]',
        },
      });

      await prisma.tenantModule.upsert({
        where: { tenantId_moduleKey: { tenantId, moduleKey } },
        update: { status: 'active', billingRule: 'plan_included' },
        create: { tenantId, moduleKey, status: 'active', billingRule: 'plan_included' },
      });
    }

    if (moduleKeys.length > 0) {
      await this.logActivity(tenantId, userId || null, 'entitlements_sync', { modules: moduleKeys, planId: plan.id });
    }
  }

  static async getActiveSubscription(tenantId: string) {
    return prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        addOns: {
          where: { status: 'active' },
          include: { addOn: true },
        },
      },
    });
  }

  static async getCurrentUsage(tenantId: string) {
    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) {
      return null;
    }

    const usage = await this.calculateUsageForSubscription(tenantId, sub);
    return { subscription: sub, usage };
  }

  static async calculateUsageForSubscription(tenantId: string, subscription: any) {
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;
    const meters = await prisma.usageMeter.findMany({
      where: {
        tenantId,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      },
    });

    const quantityByKey = new Map<string, number>();
    for (const meter of meters) {
      const key = normalizeMetricKey(meter.metricKey);
      quantityByKey.set(key, (quantityByKey.get(key) || 0) + Number(meter.quantity || 0));
    }

    const activeMembers = await prisma.member.count({ where: { tenantId } });
    quantityByKey.set('active_members', activeMembers);

    const activeAddOns = subscription.addOns || [];
    const metrics = METRIC_DEFINITIONS.map((definition) => {
      const addOnIncluded = activeAddOns
        .filter((item: any) => item.addOn?.usageMetricKey && normalizeMetricKey(item.addOn.usageMetricKey) === definition.key)
        .reduce((sum: number, item: any) => sum + Number(item.addOn.includedQuantity || 0) * Number(item.quantity || 1), 0);

      const included = planIncluded(subscription.plan, definition.key) + addOnIncluded;
      const current = quantityByKey.get(definition.key) || 0;
      const overage = Math.max(0, current - included);
      const addOnRate = activeAddOns
        .filter((item: any) => item.addOn?.usageMetricKey && normalizeMetricKey(item.addOn.usageMetricKey) === definition.key)
        .reduce((rate: number, item: any) => Math.max(rate, Number(item.addOn.overageRate || 0)), 0);
      const rate = addOnRate || planRate(subscription.plan, definition.key);

      return {
        key: definition.key,
        label: definition.label,
        unit: definition.unit,
        current,
        included,
        baseIncluded: planIncluded(subscription.plan, definition.key),
        addOnIncluded,
        overage,
        rate,
        overageCost: Math.round(overage * rate * 100) / 100,
      };
    });

    const flattened: Record<string, any> = {};
    for (const metric of metrics) {
      flattened[metric.key] = metric.current;
      flattened[`${metric.key}_included`] = metric.included;
      flattened[`${metric.key}_overage`] = metric.overage;
      flattened[`${metric.key}_overage_cost`] = metric.overageCost;
    }
    flattened.meeting_hours = flattened.meeting_participant_hours || 0;
    flattened.metrics = metrics;
    flattened.periodStart = periodStart;
    flattened.periodEnd = periodEnd;
    flattened.projectedOverageTotal = Math.round(metrics.reduce((sum, metric) => sum + metric.overageCost, 0) * 100) / 100;
    return flattened;
  }

  static async recordUsage(tenantId: string, metricKey: string, quantity: number, userId?: string | null): Promise<void> {
    if (!metricKey) {
      throw new Error('metricKey is required');
    }
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('quantity must be a positive number');
    }

    const normalizedMetric = normalizeMetricKey(metricKey);
    const period = await getBillingPeriod(tenantId);

    const existing = await prisma.usageMeter.findFirst({
      where: {
        tenantId,
        metricKey: normalizedMetric,
        billingPeriodStart: period.start,
        billingPeriodEnd: period.end,
      },
    });

    if (existing) {
      await prisma.usageMeter.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + amount },
      });
    } else {
      await prisma.usageMeter.create({
        data: {
          tenantId,
          metricKey: normalizedMetric,
          quantity: amount,
          billingPeriodStart: period.start,
          billingPeriodEnd: period.end,
        },
      });
    }

    await this.logActivity(tenantId, userId || null, 'usage_recorded', {
      metricKey: normalizedMetric,
      quantity: amount,
      periodStart: period.start,
      periodEnd: period.end,
      value: amount,
    });
  }

  static async checkSubscriptionLimit(tenantId: string, metricKey: string, requiredQuantity: number = 1) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found' };
    }
    if (tenant.status === 'suspended') {
      return { allowed: false, reason: 'Tenant account is suspended' };
    }

    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) {
      return { allowed: false, reason: 'No active subscription plan found' };
    }

    if (sub.status === 'suspended' || sub.status === 'unpaid') {
      return { allowed: false, reason: `Subscription status is ${sub.status}` };
    }

    const definition = metricDefinition(metricKey);
    if (!definition) {
      return { allowed: true };
    }

    const usage = await this.calculateUsageForSubscription(tenantId, sub);
    const metric = usage.metrics.find((item: any) => item.key === definition.key);
    const required = Number(requiredQuantity || 1);
    if (metric && metric.current + required > metric.included && sub.plan.basePrice === 0) {
      return {
        allowed: false,
        reason: `Plan ${definition.label.toLowerCase()} limit of ${metric.included} reached`,
      };
    }

    return { allowed: true };
  }

  static normalizeAddOnInput(tenantId: string, input: AddOnInput, forCreate = false): Record<string, any> {
    const key = input.key?.trim();
    const name = input.name?.trim();
    if (forCreate && !key) throw new Error('key is required');
    if (forCreate && !name) throw new Error('name is required');

    const data: Record<string, any> = { tenantId };
    if (key !== undefined) data.key = key;
    if (name !== undefined) data.name = name;
    if (input.description !== undefined) data.description = input.description;
    if (input.moduleKey !== undefined) data.moduleKey = input.moduleKey;
    if (input.price !== undefined || forCreate) data.price = nonNegativeNumber(input.price, 'price');
    if (input.billingMode !== undefined || forCreate) data.billingMode = input.billingMode || 'monthly';
    if (input.usageMetricKey !== undefined) data.usageMetricKey = input.usageMetricKey ? normalizeMetricKey(input.usageMetricKey) : null;
    if (input.includedQuantity !== undefined || forCreate) data.includedQuantity = nonNegativeNumber(input.includedQuantity, 'includedQuantity');
    if (input.overageRate !== undefined || forCreate) data.overageRate = nonNegativeNumber(input.overageRate, 'overageRate');
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
    return data;
  }

  static async listAddOns(tenantId: string) {
    await this.ensureTenantCatalog(tenantId);
    const [addOns, active] = await Promise.all([
      prisma.billingAddOn.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
      prisma.tenantSubscriptionAddOn.findMany({
        where: { tenantId },
        include: { addOn: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { addOns, active };
  }

  static async createAddOn(tenantId: string, userId: string | null, input: AddOnInput) {
    const addOn = await prisma.billingAddOn.create({
      data: this.normalizeAddOnInput(tenantId, input, true) as any,
    });
    await this.logActivity(tenantId, userId, 'add_on_create', { entityId: addOn.id, key: addOn.key, value: addOn.price });
    return addOn;
  }

  static async updateAddOn(tenantId: string, userId: string | null, id: string, input: AddOnInput) {
    const existing = await prisma.billingAddOn.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Add-on not found');
    const addOn = await prisma.billingAddOn.update({
      where: { id: existing.id },
      data: this.normalizeAddOnInput(tenantId, input, false) as any,
    });
    await this.logActivity(tenantId, userId, 'add_on_update', { entityId: addOn.id, updatedFields: Object.keys(input) });
    return addOn;
  }

  static async activateAddOn(tenantId: string, userId: string | null, addOnId: string, quantity = 1) {
    const addOn = await prisma.billingAddOn.findFirst({ where: { id: addOnId, tenantId, isActive: true } });
    if (!addOn) throw new Error('Add-on not found');

    const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    if (!subscription) throw new Error('No active subscription found for tenant');

    const normalizedQuantity = integerNumber(quantity, 'quantity', 1);

    const active = await prisma.tenantSubscriptionAddOn.upsert({
      where: { tenantId_addOnId: { tenantId, addOnId } },
      update: {
        subscriptionId: subscription.id,
        quantity: normalizedQuantity,
        status: 'active',
        endsAt: null,
      },
      create: {
        tenantId,
        subscriptionId: subscription.id,
        addOnId,
        quantity: normalizedQuantity,
        status: 'active',
      },
      include: { addOn: true },
    });

    if (addOn.moduleKey) {
      await this.updateEntitlement(tenantId, userId, addOn.moduleKey, {
        status: 'active',
        billingRule: 'add_on',
        usageLimits: { usageMetricKey: addOn.usageMetricKey, includedQuantity: addOn.includedQuantity },
      });
    }

    await this.logActivity(tenantId, userId, 'add_on_activate', {
      entityId: active.id,
      addOnId,
      quantity: normalizedQuantity,
      value: addOn.price * normalizedQuantity,
    });
    return active;
  }

  static async deactivateAddOn(tenantId: string, userId: string | null, id: string) {
    const active = await prisma.tenantSubscriptionAddOn.findFirst({
      where: { id, tenantId },
      include: { addOn: true },
    });
    if (!active) throw new Error('Active add-on not found');

    const updated = await prisma.tenantSubscriptionAddOn.update({
      where: { id: active.id },
      data: { status: 'inactive', endsAt: new Date() },
      include: { addOn: true },
    });

    await this.logActivity(tenantId, userId, 'add_on_deactivate', { entityId: id, addOnId: active.addOnId });
    return updated;
  }

  static normalizeCouponInput(input: CouponInput, forCreate = false) {
    const code = input.code?.trim().toUpperCase();
    if (forCreate && !code) throw new Error('code is required');

    const discountType = input.discountType || 'percent';
    if ((input.discountType !== undefined || forCreate) && !['percent', 'amount'].includes(discountType)) {
      throw new Error('discountType must be percent or amount');
    }

    const data: Record<string, any> = {};
    if (code !== undefined) data.code = code;
    if (input.description !== undefined) data.description = input.description;
    if (input.discountType !== undefined || forCreate) data.discountType = discountType;
    if (input.discountValue !== undefined || forCreate) {
      data.discountValue = nonNegativeNumber(input.discountValue, 'discountValue');
      if (discountType === 'percent' && data.discountValue > 100) {
        throw new Error('percent discountValue cannot exceed 100');
      }
    }
    if (input.maxRedemptions !== undefined) data.maxRedemptions = input.maxRedemptions === null ? null : integerNumber(input.maxRedemptions, 'maxRedemptions');
    const startsAt = nullableDate(input.startsAt, 'startsAt');
    const expiresAt = nullableDate(input.expiresAt, 'expiresAt');
    if (startsAt !== undefined) data.startsAt = startsAt;
    if (expiresAt !== undefined) data.expiresAt = expiresAt;
    if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
    if (input.metadataJson !== undefined || forCreate) data.metadataJson = jsonString(input.metadataJson, {});
    return data;
  }

  static async listCoupons(tenantId: string) {
    return prisma.billingCoupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createCoupon(tenantId: string, userId: string | null, input: CouponInput) {
    const coupon = await prisma.billingCoupon.create({
      data: {
        tenantId,
        ...this.normalizeCouponInput(input, true),
      } as any,
    });
    await this.logActivity(tenantId, userId, 'coupon_create', {
      entityId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
    return coupon;
  }

  static async updateCoupon(tenantId: string, userId: string | null, id: string, input: CouponInput) {
    const existing = await prisma.billingCoupon.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Coupon not found');

    const coupon = await prisma.billingCoupon.update({
      where: { id: existing.id },
      data: this.normalizeCouponInput(input, false) as any,
    });
    await this.logActivity(tenantId, userId, 'coupon_update', { entityId: coupon.id, updatedFields: Object.keys(input) });
    return coupon;
  }

  static async assertValidCoupon(tenantId: string, code: string) {
    const coupon = await prisma.billingCoupon.findUnique({
      where: { tenantId_code: { tenantId, code: code.trim().toUpperCase() } },
    });
    if (!coupon || !coupon.isActive) {
      throw new Error('Coupon not found or inactive');
    }
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new Error('Coupon is not active yet');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new Error('Coupon has expired');
    }
    if (coupon.maxRedemptions !== null && coupon.maxRedemptions !== undefined && coupon.redeemedCount >= coupon.maxRedemptions) {
      throw new Error('Coupon redemption limit reached');
    }
    return coupon;
  }

  static async applyCoupon(tenantId: string, userId: string | null, code: string) {
    if (!code) throw new Error('code is required');
    const coupon = await this.assertValidCoupon(tenantId, code);
    const subscription = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
    if (!subscription) throw new Error('No active subscription found for tenant');

    const updated = await prisma.tenantSubscription.update({
      where: { tenantId },
      data: { couponCode: coupon.code },
      include: { plan: true },
    });
    await this.logActivity(tenantId, userId, 'coupon_apply', { entityId: coupon.id, code: coupon.code });
    return updated;
  }

  static calculateDiscount(coupon: any | null, subtotal: number): number {
    if (!coupon) return 0;
    if (coupon.discountType === 'percent') {
      return Math.round(subtotal * (Number(coupon.discountValue) / 100) * 100) / 100;
    }
    return Math.min(subtotal, Math.round(Number(coupon.discountValue) * 100) / 100);
  }

  static async generateInvoice(tenantId: string, userId?: string | null): Promise<any> {
    const sub = await this.getActiveSubscription(tenantId);
    if (!sub) {
      throw new Error('No active subscription found for tenant');
    }

    const usage = await this.calculateUsageForSubscription(tenantId, sub);
    const lineItems: any[] = [
      {
        type: 'plan',
        label: `${sub.plan.name} base subscription`,
        quantity: 1,
        unitPrice: sub.plan.basePrice,
        amount: sub.plan.basePrice,
      },
    ];

    for (const active of sub.addOns || []) {
      const quantity = Number(active.quantity || 1);
      const amount = Math.round(Number(active.addOn.price || 0) * quantity * 100) / 100;
      lineItems.push({
        type: 'add_on',
        label: active.addOn.name,
        addOnId: active.addOnId,
        quantity,
        unitPrice: active.addOn.price,
        amount,
      });
    }

    for (const metric of usage.metrics) {
      if (metric.overageCost > 0) {
        lineItems.push({
          type: 'usage',
          metricKey: metric.key,
          label: `${metric.label} overage`,
          quantity: metric.overage,
          unit: metric.unit,
          unitPrice: metric.rate,
          amount: metric.overageCost,
        });
      }
    }

    const subtotal = Math.round(lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) * 100) / 100;
    let coupon: any = null;
    if (sub.couponCode) {
      try {
        coupon = await this.assertValidCoupon(tenantId, sub.couponCode);
      } catch {
        coupon = null;
      }
    }
    const discount = this.calculateDiscount(coupon, subtotal);
    const amount = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
    const invoiceNumber = `${(await this.invoicePrefix(tenantId))}-${Date.now().toString().slice(-8)}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        currency: sub.plan.currency || 'USD',
        subtotal,
        discount,
        amount,
        status: 'open',
        lineItemsJson: JSON.stringify(lineItems),
        billingPeriodStart: sub.currentPeriodStart,
        billingPeriodEnd: sub.currentPeriodEnd,
      },
    });

    if (coupon && discount > 0) {
      await prisma.billingCoupon.update({
        where: { id: coupon.id },
        data: { redeemedCount: coupon.redeemedCount + 1 },
      });
    }

    const nextStart = sub.currentPeriodEnd;
    const nextEnd = new Date(sub.currentPeriodEnd);
    nextEnd.setMonth(nextEnd.getMonth() + 1);

    await prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodStart: nextStart,
        currentPeriodEnd: nextEnd,
      },
    });

    await this.logActivity(tenantId, userId || null, 'invoice_generate', {
      entityId: invoice.id,
      invoiceNumber,
      subtotal,
      discount,
      value: amount,
    });

    return invoice;
  }

  static async invoicePrefix(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    const config = parseJson<Record<string, any>>(settings.configJson, DEFAULT_SETTINGS_CONFIG);
    return String(config.invoicePrefix || 'INV').toUpperCase();
  }

  static async handlePaymentWebhook(tenantId: string, invoiceId: string, event: 'payment_intent.succeeded' | 'payment_intent.payment_failed', userId?: string | null): Promise<void> {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (event === 'payment_intent.succeeded') {
      await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'paid' } });
      await prisma.tenantSubscription.update({ where: { tenantId }, data: { status: 'active' } });
      await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'active' } });
      await this.logActivity(tenantId, userId || null, 'payment_succeeded', { entityId: invoiceId, value: invoice.amount });
      return;
    }

    if (event === 'payment_intent.payment_failed') {
      await prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'open' } });
      await prisma.tenantSubscription.update({ where: { tenantId }, data: { status: 'unpaid' } });
      await prisma.tenant.update({ where: { id: tenantId }, data: { status: 'suspended' } });
      await this.logActivity(tenantId, userId || null, 'payment_failed', { entityId: invoiceId, value: invoice.amount });
      return;
    }

    throw new Error('Invalid event type');
  }

  static async getSettings(tenantId: string) {
    const record = await prisma.billingSubscriptionManagementModuleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: BILLING_MODULE_KEY } },
    });

    if (record) return record;

    return prisma.billingSubscriptionManagementModuleSettings.create({
      data: {
        tenantId,
        moduleKey: BILLING_MODULE_KEY,
        enabled: true,
        billingPlan: 'platform',
        providerMode: 'platform_managed',
        configJson: JSON.stringify(DEFAULT_SETTINGS_CONFIG),
      },
    });
  }

  static async updateSettings(tenantId: string, userId: string | null, input: { enabled?: boolean; billingPlan?: string; providerMode?: string; configJson?: any }) {
    const current = await this.getSettings(tenantId);
    const currentConfig = parseJson<Record<string, any>>(current.configJson, DEFAULT_SETTINGS_CONFIG);
    const configJson = input.configJson !== undefined
      ? JSON.stringify({ ...currentConfig, ...(typeof input.configJson === 'string' ? parseJson<Record<string, any>>(input.configJson, {}) : input.configJson) })
      : undefined;

    const updated = await prisma.billingSubscriptionManagementModuleSettings.update({
      where: { id: current.id },
      data: {
        ...(input.enabled !== undefined && { enabled: Boolean(input.enabled) }),
        ...(input.billingPlan !== undefined && { billingPlan: input.billingPlan }),
        ...(input.providerMode !== undefined && { providerMode: input.providerMode }),
        ...(configJson !== undefined && { configJson }),
      },
    });

    await this.logActivity(tenantId, userId, 'settings_update', { updatedFields: Object.keys(input) });
    return updated;
  }

  static async listActivities(tenantId: string) {
    return prisma.billingSubscriptionManagementModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  static async listEntitlements(tenantId: string) {
    return prisma.tenantModule.findMany({
      where: { tenantId },
      include: { module: true },
      orderBy: { moduleKey: 'asc' },
    });
  }

  static async updateEntitlement(
    tenantId: string,
    userId: string | null | undefined,
    moduleKey: string,
    input: { status?: string; billingRule?: string; usageLimits?: any }
  ) {
    if (!moduleKey) throw new Error('moduleKey is required');
    const status = input.status || 'active';
    if (!['pending', 'active', 'suspended', 'trialing', 'inactive'].includes(status)) {
      throw new Error('Invalid entitlement status');
    }

    await prisma.moduleDefinition.upsert({
      where: { key: moduleKey },
      update: {},
      create: {
        key: moduleKey,
        name: moduleKey.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
        category: 'Billing',
        dependencies: '[]',
      },
    });

    if (status === 'inactive') {
      await prisma.tenantModule.deleteMany({ where: { tenantId, moduleKey } });
      await this.logActivity(tenantId, userId || null, 'entitlement_deactivate', { moduleKey });
      return { moduleKey, status: 'inactive' };
    }

    const entitlement = await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      update: {
        status,
        ...(input.billingRule !== undefined && { billingRule: input.billingRule }),
        ...(input.usageLimits !== undefined && { usageLimits: jsonString(input.usageLimits, {}) }),
      },
      create: {
        tenantId,
        moduleKey,
        status,
        billingRule: input.billingRule || 'free',
        usageLimits: jsonString(input.usageLimits, {}),
      },
    });

    await this.logActivity(tenantId, userId || null, 'entitlement_update', {
      entityId: entitlement.id,
      moduleKey,
      status,
      billingRule: entitlement.billingRule,
    });
    return entitlement;
  }

  static async getReports(tenantId: string) {
    const [invoiceAgg, openInvoices, paidInvoices, coupons, addOns, activities, entitlements] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true, subtotal: true, discount: true },
        _count: true,
        where: { tenantId },
      }),
      prisma.invoice.count({ where: { tenantId, status: 'open' } }),
      prisma.invoice.count({ where: { tenantId, status: 'paid' } }),
      prisma.billingCoupon.count({ where: { tenantId, isActive: true } }),
      prisma.tenantSubscriptionAddOn.count({ where: { tenantId, status: 'active' } }),
      prisma.billingSubscriptionManagementModuleActivity.count({ where: { tenantId } }),
      prisma.tenantModule.count({ where: { tenantId, status: 'active' } }),
    ]);

    return {
      invoiceCount: invoiceAgg._count,
      totalBilled: Math.round(Number(invoiceAgg._sum.amount || 0) * 100) / 100,
      subtotal: Math.round(Number(invoiceAgg._sum.subtotal || 0) * 100) / 100,
      totalDiscounts: Math.round(Number(invoiceAgg._sum.discount || 0) * 100) / 100,
      openInvoices,
      paidInvoices,
      activeCoupons: coupons,
      activeAddOns: addOns,
      activeEntitlements: entitlements,
      activityCount: activities,
    };
  }

  static async getOverview(tenantId: string) {
    await this.ensureTenantCatalog(tenantId);
    const [plans, usageResult, invoices, addOns, coupons, settings, reports, entitlements] = await Promise.all([
      this.listPlans(),
      this.getCurrentUsage(tenantId),
      prisma.invoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      this.listAddOns(tenantId),
      this.listCoupons(tenantId),
      this.getSettings(tenantId),
      this.getReports(tenantId),
      this.listEntitlements(tenantId),
    ]);

    return {
      plans,
      subscription: usageResult?.subscription || null,
      usage: usageResult?.usage || null,
      invoices,
      addOns: addOns.addOns,
      activeAddOns: addOns.active,
      coupons,
      settings,
      reports,
      entitlements,
    };
  }
}

/**
 * Helper to get or default the billing period dates for a tenant.
 */
async function getBillingPeriod(tenantId: string): Promise<{ start: Date; end: Date }> {
  const sub = await prisma.tenantSubscription.findUnique({ where: { tenantId } });
  if (sub) {
    return { start: sub.currentPeriodStart, end: sub.currentPeriodEnd };
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function recordUsage(
  tenantId: string,
  metricKey: string,
  quantity: number
): Promise<void> {
  return BillingService.recordUsage(tenantId, metricKey, quantity);
}

export async function checkSubscriptionLimit(
  tenantId: string,
  metricKey: string,
  requiredQuantity: number = 1
): Promise<{ allowed: boolean; reason?: string }> {
  return BillingService.checkSubscriptionLimit(tenantId, metricKey, requiredQuantity);
}

export async function generateInvoice(tenantId: string): Promise<any> {
  return BillingService.generateInvoice(tenantId);
}

export async function handlePaymentWebhook(
  tenantId: string,
  invoiceId: string,
  event: 'payment_intent.succeeded' | 'payment_intent.payment_failed'
): Promise<void> {
  return BillingService.handlePaymentWebhook(tenantId, invoiceId, event);
}
