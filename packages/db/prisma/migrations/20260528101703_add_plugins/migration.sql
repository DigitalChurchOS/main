-- CreateTable
CREATE TABLE "plugin_definitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "required_permissions" TEXT NOT NULL DEFAULT '[]',
    "required_os_version" TEXT NOT NULL DEFAULT '1.0.0',
    "price" REAL NOT NULL DEFAULT 0.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tenant_plugins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "plugin_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "granted_permissions" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_plugins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_plugins_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin_definitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plugin_webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "tenant_plugin_id" TEXT NOT NULL,
    "event_trigger" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "plugin_webhooks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plugin_webhooks_tenant_plugin_id_fkey" FOREIGN KEY ("tenant_plugin_id") REFERENCES "tenant_plugins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "tenant_plugins_tenant_id_idx" ON "tenant_plugins"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_plugins_plugin_id_idx" ON "tenant_plugins"("plugin_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_plugins_tenant_id_plugin_id_key" ON "tenant_plugins"("tenant_id", "plugin_id");

-- CreateIndex
CREATE INDEX "plugin_webhooks_tenant_id_idx" ON "plugin_webhooks"("tenant_id");

-- CreateIndex
CREATE INDEX "plugin_webhooks_tenant_plugin_id_idx" ON "plugin_webhooks"("tenant_plugin_id");

-- CreateIndex
CREATE INDEX "plugin_webhooks_event_trigger_idx" ON "plugin_webhooks"("event_trigger");
