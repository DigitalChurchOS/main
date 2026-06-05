/*
  Warnings:

  - You are about to drop the `media_module` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media_module_activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media_module_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- Drop statements removed to fix migration sequence


-- CreateTable
CREATE TABLE "digital_library_resource_center_module" (
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
    CONSTRAINT "digital_library_resource_center_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_library_resource_center_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digital_library_resource_center_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_library_resource_center_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'bring_your_own',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "digital_library_resource_center_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "digital_library_resource_center_module_tenant_id_idx" ON "digital_library_resource_center_module"("tenant_id");

-- CreateIndex
CREATE INDEX "digital_library_resource_center_module_status_idx" ON "digital_library_resource_center_module"("status");

-- CreateIndex
CREATE INDEX "digital_library_resource_center_module_activity_tenant_id_idx" ON "digital_library_resource_center_module_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "digital_library_resource_center_module_activity_action_type_idx" ON "digital_library_resource_center_module_activity"("action_type");

-- CreateIndex
CREATE INDEX "digital_library_resource_center_module_settings_tenant_id_idx" ON "digital_library_resource_center_module_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "digital_library_resource_center_module_settings_tenant_id_module_key_key" ON "digital_library_resource_center_module_settings"("tenant_id", "module_key");
