/*
  Warnings:

  - You are about to drop the `live_meetings_module` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `live_meetings_module_activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `live_meetings_module_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_analytics_daily` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_audio_broadcasting_module_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_channels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_distribution_targets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_episode_resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_episode_scriptures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_playlist_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_playlists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_series` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_speakers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ai_summary` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `allow_rss` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `audio_file_size` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `audio_media_id` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `audio_mime_type` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `channel_id` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `cover_image_media_id` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `guest_speaker_name` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `metadata_json` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `publish_at` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `published_at` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `season_number` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `seo_description` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `seo_title` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `series_id` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `show_notes` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `speaker_id` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `transcript` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `podcast_episodes` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `podcast_episodes` table. All the data in the column will be lost.
  - Added the required column `audio_url` to the `podcast_episodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `show_id` to the `podcast_episodes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "live_meetings_module_visibility_idx";

-- DropIndex
DROP INDEX "live_meetings_module_status_idx";

-- DropIndex
DROP INDEX "live_meetings_module_tenant_id_status_idx";

-- DropIndex
DROP INDEX "live_meetings_module_tenant_id_idx";

-- DropIndex
DROP INDEX "live_meetings_module_activity_action_type_idx";

-- DropIndex
DROP INDEX "live_meetings_module_activity_tenant_id_action_type_idx";

-- DropIndex
DROP INDEX "live_meetings_module_activity_tenant_id_idx";

-- DropIndex
DROP INDEX "live_meetings_module_settings_module_key_idx";

-- DropIndex
DROP INDEX "live_meetings_module_settings_tenant_id_idx";

-- DropIndex
DROP INDEX "live_meetings_module_settings_tenant_id_module_key_key";

-- DropIndex
DROP INDEX "podcast_activity_episode_id_idx";

-- DropIndex
DROP INDEX "podcast_activity_channel_id_idx";

-- DropIndex
DROP INDEX "podcast_activity_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_analytics_daily_tenant_id_channel_id_episode_id_date_key";

-- DropIndex
DROP INDEX "podcast_analytics_daily_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_audio_broadcasting_module_settings_tenant_id_module_key_key";

-- DropIndex
DROP INDEX "podcast_audio_broadcasting_module_settings_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_channels_tenant_id_slug_key";

-- DropIndex
DROP INDEX "podcast_channels_status_idx";

-- DropIndex
DROP INDEX "podcast_channels_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_distribution_targets_channel_id_idx";

-- DropIndex
DROP INDEX "podcast_distribution_targets_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_episode_resources_episode_id_idx";

-- DropIndex
DROP INDEX "podcast_episode_resources_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_episode_scriptures_episode_id_idx";

-- DropIndex
DROP INDEX "podcast_episode_scriptures_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_playlist_items_episode_id_idx";

-- DropIndex
DROP INDEX "podcast_playlist_items_playlist_id_idx";

-- DropIndex
DROP INDEX "podcast_playlist_items_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_playlists_tenant_id_slug_key";

-- DropIndex
DROP INDEX "podcast_playlists_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_series_tenant_id_slug_key";

-- DropIndex
DROP INDEX "podcast_series_tenant_id_idx";

-- DropIndex
DROP INDEX "podcast_speakers_tenant_id_slug_key";

-- DropIndex
DROP INDEX "podcast_speakers_tenant_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "live_meetings_module";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "live_meetings_module_activity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "live_meetings_module_settings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_activity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_analytics_daily";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_audio_broadcasting_module_settings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_channels";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_distribution_targets";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_episode_resources";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_episode_scriptures";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_playlist_items";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_playlists";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_series";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "podcast_speakers";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "podcast_shows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT NOT NULL,
    "email" TEXT,
    "cover_image_url" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "link" TEXT,
    "copyright" TEXT,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_shows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_scripture_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "source_module" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "scripture_reference" TEXT NOT NULL,
    "translation_key" TEXT,
    "book_key" TEXT,
    "start_chapter" INTEGER,
    "start_verse" INTEGER,
    "end_chapter" INTEGER,
    "end_verse" INTEGER,
    "display_text" TEXT,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_scripture_references_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_verse_share_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "member_id" TEXT,
    "scripture_reference" TEXT NOT NULL,
    "translation_key" TEXT NOT NULL,
    "verse_text_snapshot" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "media_asset_id" TEXT,
    "share_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_verse_share_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "member_id" TEXT,
    "guest_id" TEXT,
    "action_type" TEXT NOT NULL,
    "scripture_reference" TEXT,
    "translation_key" TEXT,
    "source_module" TEXT,
    "source_id" TEXT,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bible_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_analytics_daily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "total_searches" INTEGER NOT NULL DEFAULT 0,
    "total_chapter_views" INTEGER NOT NULL DEFAULT 0,
    "total_verse_views" INTEGER NOT NULL DEFAULT 0,
    "total_bookmarks" INTEGER NOT NULL DEFAULT 0,
    "total_notes" INTEGER NOT NULL DEFAULT 0,
    "total_shares" INTEGER NOT NULL DEFAULT 0,
    "total_reading_plan_starts" INTEGER NOT NULL DEFAULT 0,
    "total_reading_plan_completions" INTEGER NOT NULL DEFAULT 0,
    "total_devotional_reads" INTEGER NOT NULL DEFAULT 0,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_analytics_daily_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_podcast_episodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "show_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "audio_url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "file_size" INTEGER,
    "mime_type" TEXT NOT NULL DEFAULT 'audio/mpeg',
    "publish_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "season" INTEGER,
    "episode_number" INTEGER,
    "episode_type" TEXT NOT NULL DEFAULT 'full',
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "podcast_episodes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "podcast_episodes_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "podcast_shows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_podcast_episodes" ("created_at", "description", "duration_seconds", "episode_number", "id", "slug", "status", "tenant_id", "title", "updated_at") SELECT "created_at", "description", "duration_seconds", "episode_number", "id", "slug", "status", "tenant_id", "title", "updated_at" FROM "podcast_episodes";
DROP TABLE "podcast_episodes";
ALTER TABLE "new_podcast_episodes" RENAME TO "podcast_episodes";
CREATE INDEX "podcast_episodes_tenant_id_idx" ON "podcast_episodes"("tenant_id");
CREATE INDEX "podcast_episodes_show_id_idx" ON "podcast_episodes"("show_id");
CREATE INDEX "podcast_episodes_status_idx" ON "podcast_episodes"("status");
CREATE INDEX "podcast_episodes_publish_date_idx" ON "podcast_episodes"("publish_date");
CREATE UNIQUE INDEX "podcast_episodes_tenant_id_show_id_slug_key" ON "podcast_episodes"("tenant_id", "show_id", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "podcast_shows_tenant_id_idx" ON "podcast_shows"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_shows_status_idx" ON "podcast_shows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_shows_tenant_id_slug_key" ON "podcast_shows"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "bible_scripture_references_tenant_id_idx" ON "bible_scripture_references"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_scripture_references_tenant_id_scripture_reference_idx" ON "bible_scripture_references"("tenant_id", "scripture_reference");

-- CreateIndex
CREATE INDEX "bible_scripture_references_source_module_source_id_idx" ON "bible_scripture_references"("source_module", "source_id");

-- CreateIndex
CREATE INDEX "bible_verse_share_assets_tenant_id_idx" ON "bible_verse_share_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_verse_share_assets_tenant_id_scripture_reference_idx" ON "bible_verse_share_assets"("tenant_id", "scripture_reference");

-- CreateIndex
CREATE INDEX "bible_activity_tenant_id_idx" ON "bible_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_activity_tenant_id_action_type_idx" ON "bible_activity"("tenant_id", "action_type");

-- CreateIndex
CREATE INDEX "bible_activity_tenant_id_user_id_idx" ON "bible_activity"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "bible_activity_tenant_id_member_id_idx" ON "bible_activity"("tenant_id", "member_id");

-- CreateIndex
CREATE INDEX "bible_activity_tenant_id_scripture_reference_idx" ON "bible_activity"("tenant_id", "scripture_reference");

-- CreateIndex
CREATE INDEX "bible_analytics_daily_tenant_id_idx" ON "bible_analytics_daily"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_analytics_daily_tenant_id_date_key" ON "bible_analytics_daily"("tenant_id", "date");
