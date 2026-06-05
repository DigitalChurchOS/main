-- CreateTable
CREATE TABLE "plugin_extensions_engine_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "plugin_engine_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "plugin_extensions_engine_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plugin_extensions_engine_modules_plugin_engine_id_fkey" FOREIGN KEY ("plugin_engine_id") REFERENCES "plugin_engine_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plugin_extensions_engine_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plugin_extensions_engine_activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plugin_extensions_engine_activities_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "plugin_extensions_engine_modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plugin_extensions_engine_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "plugin_extensions_engine_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plugin_extensions_engine_settings_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "plugin_extensions_engine_modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "developer_marketplace_module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings_json" TEXT NOT NULL DEFAULT '{}',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "developer_marketplace_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "developer_marketplace_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "developer_marketplace_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "developer_marketplace_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'bring_your_own',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "developer_marketplace_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "plugin_extensions_engine_modules_tenant_id_idx" ON "plugin_extensions_engine_modules"("tenant_id");

-- CreateIndex
CREATE INDEX "plugin_extensions_engine_modules_plugin_engine_id_idx" ON "plugin_extensions_engine_modules"("plugin_engine_id");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_extensions_engine_modules_tenant_id_key_key" ON "plugin_extensions_engine_modules"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "plugin_extensions_engine_activities_tenant_id_idx" ON "plugin_extensions_engine_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "plugin_extensions_engine_activities_module_id_idx" ON "plugin_extensions_engine_activities"("module_id");

-- CreateIndex
CREATE INDEX "plugin_extensions_engine_settings_tenant_id_idx" ON "plugin_extensions_engine_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "plugin_extensions_engine_settings_module_id_idx" ON "plugin_extensions_engine_settings"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_extensions_engine_settings_tenant_id_module_id_key_key" ON "plugin_extensions_engine_settings"("tenant_id", "module_id", "key");

-- CreateIndex
CREATE INDEX "developer_marketplace_module_tenant_id_idx" ON "developer_marketplace_module"("tenant_id");

-- CreateIndex
CREATE INDEX "developer_marketplace_module_status_idx" ON "developer_marketplace_module"("status");

-- CreateIndex
CREATE INDEX "developer_marketplace_module_activity_tenant_id_idx" ON "developer_marketplace_module_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "developer_marketplace_module_activity_action_type_idx" ON "developer_marketplace_module_activity"("action_type");

-- CreateIndex
CREATE INDEX "developer_marketplace_module_settings_tenant_id_idx" ON "developer_marketplace_module_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "developer_marketplace_module_settings_tenant_id_module_key_key" ON "developer_marketplace_module_settings"("tenant_id", "module_key");
