-- Theme Engine module: tenant-scoped records, audit logs, and module settings.
CREATE TABLE IF NOT EXISTS "theme_engine_module" (
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
    CONSTRAINT "theme_engine_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "theme_engine_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "theme_engine_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "theme_engine_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'bring_your_own',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "theme_engine_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "theme_engine_module_tenant_id_idx" ON "theme_engine_module"("tenant_id");
CREATE INDEX IF NOT EXISTS "theme_engine_module_status_idx" ON "theme_engine_module"("status");
CREATE INDEX IF NOT EXISTS "theme_engine_module_activity_tenant_id_idx" ON "theme_engine_module_activity"("tenant_id");
CREATE INDEX IF NOT EXISTS "theme_engine_module_activity_action_type_idx" ON "theme_engine_module_activity"("action_type");
CREATE UNIQUE INDEX IF NOT EXISTS "theme_engine_module_settings_tenant_id_module_key_key" ON "theme_engine_module_settings"("tenant_id", "module_key");
CREATE INDEX IF NOT EXISTS "theme_engine_module_settings_tenant_id_idx" ON "theme_engine_module_settings"("tenant_id");
