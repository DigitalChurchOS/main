-- CreateTable
CREATE TABLE "provider_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "providers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "provider_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tenant_connected_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "encrypted_credentials" TEXT NOT NULL,
    "provider_mode" TEXT NOT NULL DEFAULT 'bring_your_own',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tenant_connected_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tenant_connected_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "module_provider_overrides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "connected_service_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "module_provider_overrides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "module_provider_overrides_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "provider_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "module_provider_overrides_connected_service_id_fkey" FOREIGN KEY ("connected_service_id") REFERENCES "tenant_connected_services" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "providers_category_id_idx" ON "providers"("category_id");

-- CreateIndex
CREATE INDEX "tenant_connected_services_tenant_id_idx" ON "tenant_connected_services"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_connected_services_provider_id_idx" ON "tenant_connected_services"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_connected_services_tenant_id_provider_id_key" ON "tenant_connected_services"("tenant_id", "provider_id");

-- CreateIndex
CREATE INDEX "module_provider_overrides_tenant_id_idx" ON "module_provider_overrides"("tenant_id");

-- CreateIndex
CREATE INDEX "module_provider_overrides_category_id_idx" ON "module_provider_overrides"("category_id");

-- CreateIndex
CREATE INDEX "module_provider_overrides_connected_service_id_idx" ON "module_provider_overrides"("connected_service_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_provider_overrides_tenant_id_module_key_category_id_key" ON "module_provider_overrides"("tenant_id", "module_key", "category_id");
