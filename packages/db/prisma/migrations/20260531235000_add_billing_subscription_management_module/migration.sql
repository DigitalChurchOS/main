-- Extend existing subscription plans with module billing, richer limits, and display metadata.
ALTER TABLE "subscription_plans" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "subscription_plans" ADD COLUMN "description" TEXT;
ALTER TABLE "subscription_plans" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "subscription_plans" ADD COLUMN "billing_interval" TEXT NOT NULL DEFAULT 'month';
ALTER TABLE "subscription_plans" ADD COLUMN "included_email" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "included_video_bandwidth_gb" REAL NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "included_ai_tokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "included_meeting_participant_hours" REAL NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "email_overage_rate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "video_bandwidth_overage_rate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "ai_token_overage_rate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "meeting_participant_hour_rate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "subscription_plans" ADD COLUMN "features_json" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "subscription_plans" ADD COLUMN "modules_json" TEXT NOT NULL DEFAULT '[]';

-- Extend tenant subscriptions with provider and coupon metadata.
ALTER TABLE "tenant_subscriptions" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE "tenant_subscriptions" ADD COLUMN "provider_mode" TEXT NOT NULL DEFAULT 'platform_managed';
ALTER TABLE "tenant_subscriptions" ADD COLUMN "external_subscription_id" TEXT;
ALTER TABLE "tenant_subscriptions" ADD COLUMN "coupon_code" TEXT;

-- Extend invoices with line items and discount details.
ALTER TABLE "invoices" ADD COLUMN "invoice_number" TEXT;
ALTER TABLE "invoices" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "invoices" ADD COLUMN "subtotal" REAL NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "discount" REAL NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN "line_items_json" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "invoices" ADD COLUMN "pdf_url" TEXT;

-- Documented generic module records for Billing & Subscription Management.
CREATE TABLE "billing_subscription_management_module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings_json" TEXT NOT NULL DEFAULT '{}',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "billing_subscription_management_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "billing_subscription_management_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_subscription_management_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "billing_subscription_management_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'platform',
    "provider_mode" TEXT NOT NULL DEFAULT 'platform_managed',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "billing_subscription_management_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "billing_add_ons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module_key" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "billing_mode" TEXT NOT NULL DEFAULT 'monthly',
    "usage_metric_key" TEXT,
    "included_quantity" REAL NOT NULL DEFAULT 0,
    "overage_rate" REAL NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "billing_add_ons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "tenant_subscription_add_ons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "add_on_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_subscription_add_ons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_subscription_add_ons_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_subscription_add_ons_add_on_id_fkey" FOREIGN KEY ("add_on_id") REFERENCES "billing_add_ons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "billing_coupons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" TEXT NOT NULL DEFAULT 'percent',
    "discount_value" REAL NOT NULL,
    "max_redemptions" INTEGER,
    "redeemed_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" DATETIME,
    "expires_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "billing_coupons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "billing_subscription_management_module_tenant_id_idx" ON "billing_subscription_management_module"("tenant_id");
CREATE INDEX "billing_subscription_management_module_activity_tenant_id_idx" ON "billing_subscription_management_module_activity"("tenant_id");
CREATE INDEX "billing_subscription_management_module_activity_action_type_idx" ON "billing_subscription_management_module_activity"("action_type");
CREATE UNIQUE INDEX "billing_subscription_management_module_settings_tenant_id_module_key_key" ON "billing_subscription_management_module_settings"("tenant_id", "module_key");
CREATE INDEX "billing_subscription_management_module_settings_tenant_id_idx" ON "billing_subscription_management_module_settings"("tenant_id");
CREATE UNIQUE INDEX "billing_add_ons_tenant_id_key_key" ON "billing_add_ons"("tenant_id", "key");
CREATE INDEX "billing_add_ons_tenant_id_idx" ON "billing_add_ons"("tenant_id");
CREATE INDEX "billing_add_ons_module_key_idx" ON "billing_add_ons"("module_key");
CREATE UNIQUE INDEX "tenant_subscription_add_ons_tenant_id_add_on_id_key" ON "tenant_subscription_add_ons"("tenant_id", "add_on_id");
CREATE INDEX "tenant_subscription_add_ons_tenant_id_idx" ON "tenant_subscription_add_ons"("tenant_id");
CREATE INDEX "tenant_subscription_add_ons_subscription_id_idx" ON "tenant_subscription_add_ons"("subscription_id");
CREATE INDEX "tenant_subscription_add_ons_add_on_id_idx" ON "tenant_subscription_add_ons"("add_on_id");
CREATE UNIQUE INDEX "billing_coupons_tenant_id_code_key" ON "billing_coupons"("tenant_id", "code");
CREATE INDEX "billing_coupons_tenant_id_idx" ON "billing_coupons"("tenant_id");
