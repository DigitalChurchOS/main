/*
  Warnings:

  - You are about to drop the `asset_feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `asset_purchases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `asset_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `developer_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "asset_feedbacks_asset_id_idx";

-- DropIndex
DROP INDEX "asset_feedbacks_tenant_id_idx";

-- DropIndex
DROP INDEX "asset_purchases_asset_id_idx";

-- DropIndex
DROP INDEX "asset_purchases_tenant_id_idx";

-- DropIndex
DROP INDEX "developer_profiles_user_id_key";

-- AlterTable
ALTER TABLE "themes" ADD COLUMN "draft_settings" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "asset_feedbacks";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "asset_purchases";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "asset_submissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "developer_profiles";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "marketplace_developers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payout_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "marketplace_developers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_submissions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_reviews_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "amount_paid" REAL NOT NULL,
    "developer_share" REAL NOT NULL,
    "platform_share" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_purchases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_purchases_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_asset_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "manifest_json" TEXT NOT NULL DEFAULT '{}',
    "changelog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "marketplace_asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_installations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings_json" TEXT NOT NULL DEFAULT '{}',
    "granted_permissions" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "marketplace_installations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_installations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_installations_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "marketplace_asset_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_security_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'passed',
    "reviewer_id" TEXT,
    "notes" TEXT,
    "scanned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_security_reviews_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_security_reviews_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "marketplace_asset_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_onboarding_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "step_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" DATETIME,
    "skipped_at" DATETIME,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_onboarding_steps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_marketplace_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "pricing_type" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0.0,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "asset_config" TEXT NOT NULL DEFAULT '{}',
    "revenue_share_pct" REAL NOT NULL DEFAULT 0.70,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "marketplace_assets_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "marketplace_developers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_marketplace_assets" ("asset_config", "created_at", "description", "developer_id", "id", "name", "price", "pricing_type", "revenue_share_pct", "status", "type", "updated_at", "version") SELECT "asset_config", "created_at", "description", "developer_id", "id", "name", "price", "pricing_type", "revenue_share_pct", "status", "type", "updated_at", "version" FROM "marketplace_assets";
DROP TABLE "marketplace_assets";
ALTER TABLE "new_marketplace_assets" RENAME TO "marketplace_assets";
CREATE TABLE "new_sandbox_tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developer_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sandbox_tenants_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "marketplace_developers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sandbox_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sandbox_tenants" ("created_at", "developer_id", "expires_at", "id", "tenant_id") SELECT "created_at", "developer_id", "expires_at", "id", "tenant_id" FROM "sandbox_tenants";
DROP TABLE "sandbox_tenants";
ALTER TABLE "new_sandbox_tenants" RENAME TO "sandbox_tenants";
CREATE UNIQUE INDEX "sandbox_tenants_tenant_id_key" ON "sandbox_tenants"("tenant_id");
CREATE INDEX "sandbox_tenants_developer_id_idx" ON "sandbox_tenants"("developer_id");
CREATE TABLE "new_submission_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submission_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submission_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "marketplace_submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_submission_reviews" ("created_at", "decision", "id", "notes", "reviewer_id", "submission_id") SELECT "created_at", "decision", "id", "notes", "reviewer_id", "submission_id" FROM "submission_reviews";
DROP TABLE "submission_reviews";
ALTER TABLE "new_submission_reviews" RENAME TO "submission_reviews";
CREATE TABLE "new_tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "custom_domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "country" TEXT,
    "city" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "onboarding_status" TEXT NOT NULL DEFAULT 'pending',
    "onboarding_completed_at" DATETIME,
    "owner_user_id" TEXT,
    "trial_started_at" DATETIME,
    "trial_ends_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_tenants" ("created_at", "custom_domain", "id", "name", "status", "subdomain", "updated_at") SELECT "created_at", "custom_domain", "id", "name", "status", "subdomain", "updated_at" FROM "tenants";
DROP TABLE "tenants";
ALTER TABLE "new_tenants" RENAME TO "tenants";
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");
CREATE UNIQUE INDEX "tenants_custom_domain_key" ON "tenants"("custom_domain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_developers_user_id_key" ON "marketplace_developers"("user_id");

-- CreateIndex
CREATE INDEX "marketplace_reviews_tenant_id_idx" ON "marketplace_reviews"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_reviews_asset_id_idx" ON "marketplace_reviews"("asset_id");

-- CreateIndex
CREATE INDEX "marketplace_purchases_tenant_id_idx" ON "marketplace_purchases"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_purchases_asset_id_idx" ON "marketplace_purchases"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_asset_versions_asset_id_version_key" ON "marketplace_asset_versions"("asset_id", "version");

-- CreateIndex
CREATE INDEX "marketplace_installations_tenant_id_idx" ON "marketplace_installations"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_installations_asset_id_idx" ON "marketplace_installations"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_installations_tenant_id_asset_id_key" ON "marketplace_installations"("tenant_id", "asset_id");

-- CreateIndex
CREATE INDEX "marketplace_security_reviews_asset_id_idx" ON "marketplace_security_reviews"("asset_id");

-- CreateIndex
CREATE INDEX "marketplace_security_reviews_version_id_idx" ON "marketplace_security_reviews"("version_id");

-- CreateIndex
CREATE INDEX "marketplace_audit_logs_tenant_id_idx" ON "marketplace_audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_audit_logs_asset_id_idx" ON "marketplace_audit_logs"("asset_id");

-- CreateIndex
CREATE INDEX "tenant_onboarding_steps_tenant_id_idx" ON "tenant_onboarding_steps"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_onboarding_steps_tenant_id_step_key_key" ON "tenant_onboarding_steps"("tenant_id", "step_key");
