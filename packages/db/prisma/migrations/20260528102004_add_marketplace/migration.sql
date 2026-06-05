-- CreateTable
CREATE TABLE "developer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "payout_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "developer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketplace_assets" (
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
    CONSTRAINT "marketplace_assets_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "developer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_submissions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "submission_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submission_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submission_reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "asset_submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_feedbacks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asset_feedbacks_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "amount_paid" REAL NOT NULL,
    "developer_share" REAL NOT NULL,
    "platform_share" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_purchases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asset_purchases_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "marketplace_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sandbox_tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "developer_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sandbox_tenants_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "developer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sandbox_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "developer_profiles_user_id_key" ON "developer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "asset_feedbacks_tenant_id_idx" ON "asset_feedbacks"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_feedbacks_asset_id_idx" ON "asset_feedbacks"("asset_id");

-- CreateIndex
CREATE INDEX "asset_purchases_tenant_id_idx" ON "asset_purchases"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_purchases_asset_id_idx" ON "asset_purchases"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "sandbox_tenants_tenant_id_key" ON "sandbox_tenants"("tenant_id");

-- CreateIndex
CREATE INDEX "sandbox_tenants_developer_id_idx" ON "sandbox_tenants"("developer_id");
