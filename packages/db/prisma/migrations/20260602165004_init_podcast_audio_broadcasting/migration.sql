/*
  Warnings:

  - You are about to drop the `podcast_shows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `audio_url` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `download_count` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `episode_type` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `explicit` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `file_size` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `mime_type` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `play_count` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `publish_date` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `season` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `show_id` on the `podcast_episodes` table. All the data in the column will be lost.
  - Added the required column `audio_media_id` to the `podcast_episodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channel_id` to the `podcast_episodes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "podcast_shows_tenant_id_slug_key";

-- DropIndex
DROP INDEX "podcast_shows_status_idx";

-- DropIndex
DROP INDEX "podcast_shows_tenant_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_shows";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "podcast_audio_broadcasting_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'hybrid',
    "allow_public_publishing" BOOLEAN NOT NULL DEFAULT true,
    "allow_rss_feed" BOOLEAN NOT NULL DEFAULT true,
    "allow_external_distribution" BOOLEAN NOT NULL DEFAULT true,
    "default_channel_visibility" TEXT NOT NULL DEFAULT 'public',
    "default_episode_visibility" TEXT NOT NULL DEFAULT 'public',
    "default_language" TEXT NOT NULL DEFAULT 'en',
    "default_category" TEXT NOT NULL DEFAULT 'Religion & Spirituality',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_audio_broadcasting_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_media_id" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "owner_name" TEXT,
    "owner_email" TEXT,
    "copyright_text" TEXT,
    "explicit_content" BOOLEAN NOT NULL DEFAULT false,
    "rss_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rss_slug" TEXT NOT NULL,
    "rss_url" TEXT,
    "external_links_json" TEXT NOT NULL DEFAULT '{}',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by" TEXT,
    "updated_by" TEXT,
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_speakers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "photo_media_id" TEXT,
    "external_links_json" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_speakers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_media_id" TEXT,
    "speaker_id" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_series_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_series_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "podcast_speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_media_id" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'active',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_playlists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_playlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_playlist_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "podcast_playlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_playlist_items_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_episode_scriptures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "scripture_reference" TEXT NOT NULL,
    "scripture_translation" TEXT,
    "scripture_text_snapshot" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_episode_scriptures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_episode_scriptures_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_episode_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_episode_resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_episode_resources_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_distribution_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_channel_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "external_url" TEXT,
    "settings_json" TEXT NOT NULL DEFAULT '{}',
    "last_synced_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_distribution_targets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_distribution_targets_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "podcast_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "member_id" TEXT,
    "guest_id" TEXT,
    "channel_id" TEXT,
    "episode_id" TEXT,
    "playlist_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "podcast_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_activity_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "podcast_channels" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "podcast_activity_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "podcast_analytics_daily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "episode_id" TEXT,
    "date" DATETIME NOT NULL,
    "total_plays" INTEGER NOT NULL DEFAULT 0,
    "total_downloads" INTEGER NOT NULL DEFAULT 0,
    "unique_listeners" INTEGER NOT NULL DEFAULT 0,
    "rss_hits" INTEGER NOT NULL DEFAULT 0,
    "external_clicks" INTEGER NOT NULL DEFAULT 0,
    "avg_completion_percentage" REAL NOT NULL DEFAULT 0.0,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_analytics_daily_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_analytics_daily_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "podcast_channels" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "podcast_analytics_daily_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "podcast_episodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_podcast_episodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "show_notes" TEXT,
    "transcript" TEXT,
    "ai_summary" TEXT,
    "audio_media_id" TEXT NOT NULL,
    "cover_image_media_id" TEXT,
    "speaker_id" TEXT,
    "guest_speaker_name" TEXT,
    "series_id" TEXT,
    "season_number" INTEGER,
    "episode_number" INTEGER,
    "duration_seconds" INTEGER,
    "audio_mime_type" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "audio_file_size" INTEGER,
    "publish_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "allow_rss" BOOLEAN NOT NULL DEFAULT true,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_episodes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_episodes_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "podcast_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_episodes_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "podcast_speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "podcast_episodes_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "podcast_series" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_podcast_episodes" ("created_at", "description", "duration_seconds", "episode_number", "id", "slug", "status", "tenant_id", "title", "updated_at") SELECT "created_at", "description", "duration_seconds", "episode_number", "id", "slug", "status", "tenant_id", "title", "updated_at" FROM "podcast_episodes";
DROP TABLE "podcast_episodes";
ALTER TABLE "new_podcast_episodes" RENAME TO "podcast_episodes";
CREATE INDEX "podcast_episodes_tenant_id_idx" ON "podcast_episodes"("tenant_id");
CREATE INDEX "podcast_episodes_channel_id_idx" ON "podcast_episodes"("channel_id");
CREATE INDEX "podcast_episodes_status_idx" ON "podcast_episodes"("status");
CREATE INDEX "podcast_episodes_publish_at_idx" ON "podcast_episodes"("publish_at");
CREATE UNIQUE INDEX "podcast_episodes_tenant_id_channel_id_slug_key" ON "podcast_episodes"("tenant_id", "channel_id", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "podcast_audio_broadcasting_module_settings_tenant_id_idx" ON "podcast_audio_broadcasting_module_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_audio_broadcasting_module_settings_tenant_id_module_key_key" ON "podcast_audio_broadcasting_module_settings"("tenant_id", "module_key");

-- CreateIndex
CREATE INDEX "podcast_channels_tenant_id_idx" ON "podcast_channels"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_channels_status_idx" ON "podcast_channels"("status");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_channels_tenant_id_slug_key" ON "podcast_channels"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "podcast_speakers_tenant_id_idx" ON "podcast_speakers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_speakers_tenant_id_slug_key" ON "podcast_speakers"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "podcast_series_tenant_id_idx" ON "podcast_series"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_series_tenant_id_slug_key" ON "podcast_series"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "podcast_playlists_tenant_id_idx" ON "podcast_playlists"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_playlists_tenant_id_slug_key" ON "podcast_playlists"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "podcast_playlist_items_tenant_id_idx" ON "podcast_playlist_items"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_playlist_items_playlist_id_idx" ON "podcast_playlist_items"("playlist_id");

-- CreateIndex
CREATE INDEX "podcast_playlist_items_episode_id_idx" ON "podcast_playlist_items"("episode_id");

-- CreateIndex
CREATE INDEX "podcast_episode_scriptures_tenant_id_idx" ON "podcast_episode_scriptures"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_episode_scriptures_episode_id_idx" ON "podcast_episode_scriptures"("episode_id");

-- CreateIndex
CREATE INDEX "podcast_episode_resources_tenant_id_idx" ON "podcast_episode_resources"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_episode_resources_episode_id_idx" ON "podcast_episode_resources"("episode_id");

-- CreateIndex
CREATE INDEX "podcast_distribution_targets_tenant_id_idx" ON "podcast_distribution_targets"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_distribution_targets_channel_id_idx" ON "podcast_distribution_targets"("channel_id");

-- CreateIndex
CREATE INDEX "podcast_activity_tenant_id_idx" ON "podcast_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_activity_channel_id_idx" ON "podcast_activity"("channel_id");

-- CreateIndex
CREATE INDEX "podcast_activity_episode_id_idx" ON "podcast_activity"("episode_id");

-- CreateIndex
CREATE INDEX "podcast_analytics_daily_tenant_id_idx" ON "podcast_analytics_daily"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_analytics_daily_tenant_id_channel_id_episode_id_date_key" ON "podcast_analytics_daily"("tenant_id", "channel_id", "episode_id", "date");
