-- CreateTable
CREATE TABLE "livestream_module" (
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
    CONSTRAINT "livestream_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestream_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "livestream_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestream_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'hybrid',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "livestream_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "livestream_module_tenant_id_idx" ON "livestream_module"("tenant_id");

-- CreateIndex
CREATE INDEX "livestream_module_tenant_id_status_idx" ON "livestream_module"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "livestream_module_status_idx" ON "livestream_module"("status");

-- CreateIndex
CREATE INDEX "livestream_module_visibility_idx" ON "livestream_module"("visibility");

-- CreateIndex
CREATE INDEX "livestream_module_activity_tenant_id_idx" ON "livestream_module_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "livestream_module_activity_tenant_id_action_type_idx" ON "livestream_module_activity"("tenant_id", "action_type");

-- CreateIndex
CREATE INDEX "livestream_module_activity_action_type_idx" ON "livestream_module_activity"("action_type");

-- CreateIndex
CREATE INDEX "livestream_module_settings_tenant_id_idx" ON "livestream_module_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "livestream_module_settings_module_key_idx" ON "livestream_module_settings"("module_key");

-- CreateIndex
CREATE UNIQUE INDEX "livestream_module_settings_tenant_id_module_key_key" ON "livestream_module_settings"("tenant_id", "module_key");
