-- CreateTable
CREATE TABLE "livestreams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" DATETIME,
    "started_at" DATETIME,
    "ended_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "stream_key" TEXT,
    "rtmp_ingest_url" TEXT,
    "thumbnail_url" TEXT,
    "countdown_enabled" BOOLEAN NOT NULL DEFAULT true,
    "chat_enabled" BOOLEAN NOT NULL DEFAULT true,
    "multi_platform_links" TEXT NOT NULL DEFAULT '[]',
    "replay_asset_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "livestreams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "livestreams_replay_asset_id_fkey" FOREIGN KEY ("replay_asset_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestream_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "livestream_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "livestream_chats_livestream_id_fkey" FOREIGN KEY ("livestream_id") REFERENCES "livestreams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "livestream_chats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestream_viewers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "livestream_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    "duration_seconds" INTEGER,
    CONSTRAINT "livestream_viewers_livestream_id_fkey" FOREIGN KEY ("livestream_id") REFERENCES "livestreams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "livestream_viewers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestream_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "livestream_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "livestream_interactions_livestream_id_fkey" FOREIGN KEY ("livestream_id") REFERENCES "livestreams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "livestream_interactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "livestreams_tenant_id_idx" ON "livestreams"("tenant_id");

-- CreateIndex
CREATE INDEX "livestreams_status_idx" ON "livestreams"("status");

-- CreateIndex
CREATE INDEX "livestreams_scheduled_at_idx" ON "livestreams"("scheduled_at");

-- CreateIndex
CREATE INDEX "livestream_chats_livestream_id_idx" ON "livestream_chats"("livestream_id");

-- CreateIndex
CREATE INDEX "livestream_chats_tenant_id_idx" ON "livestream_chats"("tenant_id");

-- CreateIndex
CREATE INDEX "livestream_viewers_livestream_id_idx" ON "livestream_viewers"("livestream_id");

-- CreateIndex
CREATE INDEX "livestream_viewers_tenant_id_idx" ON "livestream_viewers"("tenant_id");

-- CreateIndex
CREATE INDEX "livestream_interactions_livestream_id_idx" ON "livestream_interactions"("livestream_id");

-- CreateIndex
CREATE INDEX "livestream_interactions_tenant_id_idx" ON "livestream_interactions"("tenant_id");

-- CreateIndex
CREATE INDEX "livestream_interactions_type_idx" ON "livestream_interactions"("type");
