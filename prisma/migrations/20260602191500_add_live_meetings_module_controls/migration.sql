-- Create Live Meetings module profile records.
CREATE TABLE "live_meetings_module" (
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
    CONSTRAINT "live_meetings_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Live Meetings module activity records.
CREATE TABLE "live_meetings_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "live_meetings_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Live Meetings module settings records.
CREATE TABLE "live_meetings_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'hybrid',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "live_meetings_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "live_meetings_module_tenant_id_idx" ON "live_meetings_module"("tenant_id");
CREATE INDEX "live_meetings_module_tenant_id_status_idx" ON "live_meetings_module"("tenant_id", "status");
CREATE INDEX "live_meetings_module_status_idx" ON "live_meetings_module"("status");
CREATE INDEX "live_meetings_module_visibility_idx" ON "live_meetings_module"("visibility");

CREATE INDEX "live_meetings_module_activity_tenant_id_idx" ON "live_meetings_module_activity"("tenant_id");
CREATE INDEX "live_meetings_module_activity_tenant_id_action_type_idx" ON "live_meetings_module_activity"("tenant_id", "action_type");
CREATE INDEX "live_meetings_module_activity_action_type_idx" ON "live_meetings_module_activity"("action_type");

CREATE UNIQUE INDEX "live_meetings_module_settings_tenant_id_module_key_key" ON "live_meetings_module_settings"("tenant_id", "module_key");
CREATE INDEX "live_meetings_module_settings_tenant_id_idx" ON "live_meetings_module_settings"("tenant_id");
CREATE INDEX "live_meetings_module_settings_module_key_idx" ON "live_meetings_module_settings"("module_key");
