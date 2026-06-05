-- Extend Church Services records with module-level metadata.
ALTER TABLE "church_services" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'public';
ALTER TABLE "church_services" ADD COLUMN "location_mode" TEXT NOT NULL DEFAULT 'hybrid';
ALTER TABLE "church_services" ADD COLUMN "settings_json" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "church_services" ADD COLUMN "created_by" TEXT;
ALTER TABLE "church_services" ADD COLUMN "archive_order" INTEGER;

-- Create Church Services module profile records.
CREATE TABLE "church_services_module" (
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
    CONSTRAINT "church_services_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Church Services module activity records.
CREATE TABLE "church_services_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "church_services_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Church Services module settings records.
CREATE TABLE "church_services_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'hybrid',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "church_services_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "church_services_tenant_id_status_idx" ON "church_services"("tenant_id", "status");
CREATE INDEX "church_services_tenant_id_service_type_idx" ON "church_services"("tenant_id", "service_type");
CREATE INDEX "church_services_tenant_id_service_date_idx" ON "church_services"("tenant_id", "service_date");
CREATE INDEX "church_services_visibility_idx" ON "church_services"("visibility");

CREATE INDEX "church_services_module_tenant_id_idx" ON "church_services_module"("tenant_id");
CREATE INDEX "church_services_module_tenant_id_status_idx" ON "church_services_module"("tenant_id", "status");
CREATE INDEX "church_services_module_status_idx" ON "church_services_module"("status");
CREATE INDEX "church_services_module_visibility_idx" ON "church_services_module"("visibility");

CREATE INDEX "church_services_module_activity_tenant_id_idx" ON "church_services_module_activity"("tenant_id");
CREATE INDEX "church_services_module_activity_tenant_id_action_type_idx" ON "church_services_module_activity"("tenant_id", "action_type");
CREATE INDEX "church_services_module_activity_action_type_idx" ON "church_services_module_activity"("action_type");

CREATE UNIQUE INDEX "church_services_module_settings_tenant_id_module_key_key" ON "church_services_module_settings"("tenant_id", "module_key");
CREATE INDEX "church_services_module_settings_tenant_id_idx" ON "church_services_module_settings"("tenant_id");
CREATE INDEX "church_services_module_settings_module_key_idx" ON "church_services_module_settings"("module_key");
