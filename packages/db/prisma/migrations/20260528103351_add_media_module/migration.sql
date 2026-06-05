-- CreateTable
CREATE TABLE "media_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "media_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "speakers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "photo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "speakers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "media_series_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL,
    "provider_key" TEXT,
    "source_url" TEXT,
    "thumbnail_url" TEXT,
    "duration_seconds" INTEGER,
    "file_size_bytes" INTEGER,
    "mime_type" TEXT,
    "category_id" TEXT,
    "series_id" TEXT,
    "series_order" INTEGER,
    "speaker_id" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "media_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "media_assets_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "media_series" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "media_assets_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_asset_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "media_asset_tags_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_asset_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "media_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "media_playlists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_playlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlist_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "media_playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "media_playlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_playlist_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "media_categories_tenant_id_idx" ON "media_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "media_categories_parent_id_idx" ON "media_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_categories_tenant_id_slug_key" ON "media_categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "media_tags_tenant_id_idx" ON "media_tags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_tags_tenant_id_slug_key" ON "media_tags"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "speakers_tenant_id_idx" ON "speakers"("tenant_id");

-- CreateIndex
CREATE INDEX "media_series_tenant_id_idx" ON "media_series"("tenant_id");

-- CreateIndex
CREATE INDEX "media_assets_tenant_id_idx" ON "media_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "media_assets_category_id_idx" ON "media_assets"("category_id");

-- CreateIndex
CREATE INDEX "media_assets_series_id_idx" ON "media_assets"("series_id");

-- CreateIndex
CREATE INDEX "media_assets_speaker_id_idx" ON "media_assets"("speaker_id");

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");

-- CreateIndex
CREATE INDEX "media_asset_tags_asset_id_idx" ON "media_asset_tags"("asset_id");

-- CreateIndex
CREATE INDEX "media_asset_tags_tag_id_idx" ON "media_asset_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_tags_asset_id_tag_id_key" ON "media_asset_tags"("asset_id", "tag_id");

-- CreateIndex
CREATE INDEX "media_playlists_tenant_id_idx" ON "media_playlists"("tenant_id");

-- CreateIndex
CREATE INDEX "media_playlist_items_playlist_id_idx" ON "media_playlist_items"("playlist_id");

-- CreateIndex
CREATE INDEX "media_playlist_items_asset_id_idx" ON "media_playlist_items"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_playlist_items_playlist_id_asset_id_key" ON "media_playlist_items"("playlist_id", "asset_id");
