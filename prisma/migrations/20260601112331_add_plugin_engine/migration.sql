-- AlterTable
ALTER TABLE "pages" ADD COLUMN "seo_description" TEXT;
ALTER TABLE "pages" ADD COLUMN "seo_keywords" TEXT;
ALTER TABLE "pages" ADD COLUMN "seo_title" TEXT;

-- CreateTable
CREATE TABLE "branch_regions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "branch_regions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "branch_leaders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "branch_leaders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branch_leaders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branch_leaders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'visitor',
    "lead_source" TEXT,
    "lead_source_detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "engagement_score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "first_contact_at" DATETIME,
    "last_contact_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "crm_contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_contacts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_timeline_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_timeline_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_timeline_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_followup_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "assigned_user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "crm_followup_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_followup_tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "prefer_email" BOOLEAN NOT NULL DEFAULT true,
    "prefer_sms" BOOLEAN NOT NULL DEFAULT false,
    "prefer_push" BOOLEAN NOT NULL DEFAULT true,
    "prefer_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notification_preferences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_preferences_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "audience_type" TEXT NOT NULL DEFAULT 'all',
    "audience_filter" TEXT,
    "scheduled_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" DATETIME,
    "error_msg" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "scheduled_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_executed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "automation_workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow_up_sequences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_event" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "follow_up_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow_up_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sequence_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "delay_days" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_up_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "follow_up_sequences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plugin_engine_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "plugin_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "plugin_engine_instances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plugin_engine_instances_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugin_definitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plugin_engine_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plugin_engine_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plugin_engine_permissions_plugin_engine_id_fkey" FOREIGN KEY ("plugin_engine_id") REFERENCES "plugin_engine_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blog_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blog_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "post_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" DATETIME,
    "cover_image_url" TEXT,
    "author_id" TEXT,
    "category_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blog_posts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_post_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_post_scriptures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "blog_post_scriptures_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_post_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT NOT NULL,
    "email" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blog_post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_post_comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "library_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "library_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "library_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "library_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "library_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_type" TEXT,
    "cover_image_url" TEXT,
    "pricing_type" TEXT NOT NULL DEFAULT 'free',
    "price" REAL NOT NULL DEFAULT 0.0,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "category_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "library_resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "library_resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "library_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "library_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_paid" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "library_purchases_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "library_resources" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "library_purchases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "library_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE TABLE "podcast_episodes" (
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

-- CreateTable
CREATE TABLE "ai_media_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "media_asset_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "job_type" TEXT NOT NULL,
    "target_lang" TEXT,
    "transcript" TEXT,
    "subtitles" TEXT,
    "summary" TEXT,
    "blog_draft" TEXT,
    "devotional_draft" TEXT,
    "social_caption" TEXT,
    "metadata_json" TEXT,
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_media_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_media_jobs_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "display_screens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "location_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "active_playlist_id" TEXT,
    "active_worship_session_id" TEXT,
    "emergency_override_text" TEXT,
    "emergency_override_active" BOOLEAN NOT NULL DEFAULT false,
    "last_ping_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "display_screens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "display_screens_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "display_screens_active_playlist_id_fkey" FOREIGN KEY ("active_playlist_id") REFERENCES "signage_playlists" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "display_screens_active_worship_session_id_fkey" FOREIGN KEY ("active_worship_session_id") REFERENCES "worship_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signage_playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schedule_rules" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "signage_playlists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signage_slides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 10,
    "content" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "signage_slides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signage_playlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlist_id" TEXT NOT NULL,
    "slide_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "signage_playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "signage_playlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "signage_playlist_items_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "signage_slides" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worship_songs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "key" TEXT,
    "tempo_bpm" INTEGER,
    "audio_url" TEXT,
    "background_url" TEXT,
    "lyrics" TEXT NOT NULL,
    "lyrics_timing" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "worship_songs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worship_playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "worship_playlists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worship_playlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlist_id" TEXT NOT NULL,
    "song_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "worship_playlist_items_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "worship_playlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worship_playlist_items_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "worship_songs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "worship_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "playlist_id" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "current_song_id" TEXT,
    "current_slide_index" INTEGER NOT NULL DEFAULT 0,
    "viewMode" TEXT NOT NULL DEFAULT 'fullscreen',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "worship_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "worship_sessions_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "worship_playlists" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "worship_sessions_current_song_id_fkey" FOREIGN KEY ("current_song_id") REFERENCES "worship_songs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "giving_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "giving_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "donor_name" TEXT,
    "donor_email" TEXT,
    "church_service_id" TEXT,
    "transaction_id" TEXT,
    "client_secret" TEXT,
    "recurring_giving_id" TEXT,
    "campaign_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "donations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "donations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "giving_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "donations_recurring_giving_id_fkey" FOREIGN KEY ("recurring_giving_id") REFERENCES "recurring_givings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "donations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recurring_givings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "next_draw_date" DATETIME NOT NULL,
    "donor_name" TEXT,
    "donor_email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recurring_givings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recurring_givings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "giving_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partnership_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "partnership_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partnerships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "partner_name" TEXT,
    "partner_email" TEXT,
    "transaction_id" TEXT,
    "client_secret" TEXT,
    "recurring_partnership_id" TEXT,
    "campaign_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "partnerships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "partnerships_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "partnership_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "partnerships_recurring_partnership_id_fkey" FOREIGN KEY ("recurring_partnership_id") REFERENCES "recurring_partnerships" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "partnerships_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recurring_partnerships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "next_draw_date" DATETIME NOT NULL,
    "partner_name" TEXT,
    "partner_email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recurring_partnerships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recurring_partnerships_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "partnership_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "goal_amount" REAL NOT NULL,
    "current_amount" REAL NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "cover_image_url" TEXT,
    "video_url" TEXT,
    "ends_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "campaign_updates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "campaign_updates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "campaign_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "digital_file_url" TEXT,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "cover_image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_override" REAL,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "product_variants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "store_coupons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discount_value" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "store_coupons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "store_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fulfillment_type" TEXT NOT NULL,
    "shipping_address" TEXT,
    "shipping_cost" REAL NOT NULL DEFAULT 0.0,
    "coupon_id" TEXT,
    "discount_amount" REAL NOT NULL DEFAULT 0.0,
    "transaction_id" TEXT,
    "client_secret" TEXT,
    "campaign_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "store_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "store_orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "store_coupons" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "store_orders_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "financial_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "financial_accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "amount_limit" REAL NOT NULL,
    "spent_amount" REAL NOT NULL DEFAULT 0.0,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "financial_budgets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "financial_budgets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financial_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "financial_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expense_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "budget_id" TEXT,
    "requested_by" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "expense_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expense_requests_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "expense_requests_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "financial_budgets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reconciliation_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "bank_statement_balance" REAL NOT NULL,
    "ledger_balance" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "reconciled_by" TEXT NOT NULL,
    "reconciled_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reconciliation_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reconciliation_records_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ministry_funnels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ministry_funnels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "funnel_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "funnel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "page_id" TEXT,
    "layout_type" TEXT NOT NULL DEFAULT 'landing',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body_content" TEXT,
    "cta_text" TEXT,
    "cta_link" TEXT,
    "form_config" TEXT,
    "countdown_end" DATETIME,
    "video_url" TEXT,
    "testimonial_text" TEXT,
    "testimonial_author" TEXT,
    "scripture_reference" TEXT,
    "scripture_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "funnel_steps_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "ministry_funnels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funnel_steps_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "funnel_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "member_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "submitted_data" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "funnel_submissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funnel_submissions_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "ministry_funnels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funnel_submissions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "funnel_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funnel_submissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "funnel_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "funnel_analytics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funnel_analytics_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "ministry_funnels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funnel_analytics_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "funnel_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "member_check_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "checked_in_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "security_code" TEXT,
    "allergies" TEXT,
    "checked_in_by_id" TEXT,
    "kiosk_id" TEXT,
    CONSTRAINT "member_check_ins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_check_ins_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "member_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "note_text" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "member_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "member_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "member_tag_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "member_tag_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "member_tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "postType" TEXT NOT NULL DEFAULT 'discussion',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "group_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "channel_id" TEXT,
    CONSTRAINT "community_posts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_posts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "community_channels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prayer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'approved',
    "prayed_count" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "assigned_to_id" TEXT,
    "follow_up_reminder_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prayer_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prayer_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prayer_requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "testimonies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "category" TEXT,
    "media_url" TEXT,
    "media_type" TEXT NOT NULL DEFAULT 'text',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "testimonies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "testimonies_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "post_id" TEXT,
    "prayer_request_id" TEXT,
    "testimony_id" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "community_comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_comments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_comments_prayer_request_id_fkey" FOREIGN KEY ("prayer_request_id") REFERENCES "prayer_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_comments_testimony_id_fkey" FOREIGN KEY ("testimony_id") REFERENCES "testimonies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "post_id" TEXT,
    "prayer_request_id" TEXT,
    "testimony_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_reactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_reactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_reactions_prayer_request_id_fkey" FOREIGN KEY ("prayer_request_id") REFERENCES "prayer_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_reactions_testimony_id_fkey" FOREIGN KEY ("testimony_id") REFERENCES "testimonies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "visitor_name" TEXT,
    "visitor_email" TEXT,
    "member_id" TEXT,
    "assigned_agent_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "subject" TEXT,
    "tags" TEXT,
    "internal_notes" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "department_id" TEXT,
    "sentiment" TEXT,
    "safety_alert" BOOLEAN NOT NULL DEFAULT false,
    "ai_suggested_reply" TEXT,
    "ai_suggested_scriptures" TEXT,
    "ai_summary" TEXT,
    "escalated_at" DATETIME,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "chat_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_conversations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "sender_name" TEXT,
    "sender_id" TEXT,
    "body" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "audio_url" TEXT,
    "audio_duration" INTEGER,
    "transcript" TEXT,
    "translated_body" TEXT,
    "translated_lang" TEXT,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "care_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "member_id" TEXT,
    "request_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assigned_agent_id" TEXT,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "care_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "care_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "care_requests_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_replies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "saved_replies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_follow_up_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "assigned_user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "chat_follow_up_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_follow_up_tasks_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "outreach_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "hashtags" TEXT,
    "share_captions" TEXT,
    "cta_label" TEXT,
    "cta_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "outreach_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invite_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT,
    "file_size" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invite_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "outreach_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "personalized_invite_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "personal_message" TEXT,
    "personal_video_url" TEXT,
    "cta_label" TEXT,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "personalized_invite_pages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "personalized_invite_pages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "outreach_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "personalized_invite_pages_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invite_link_clicks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page_id" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invite_link_clicks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "personalized_invite_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "share_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "share_events_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "personalized_invite_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "skills" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "training_status" TEXT NOT NULL DEFAULT 'untrained',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "volunteer_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_profiles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "volunteer_departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "volunteer_teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_teams_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "volunteer_departments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_team_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'volunteer',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_team_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_team_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "volunteer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_team_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "volunteer_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_availabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "blocked_date" DATETIME NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_availabilities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_availabilities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "volunteer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "volunteer_shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "checked_in_at" DATETIME,
    "task_list" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "volunteer_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "volunteer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "volunteer_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "volunteer_shifts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "volunteer_announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "team_id" TEXT,
    "department_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sent_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_announcements_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "volunteer_teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "volunteer_announcements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "volunteer_departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "volunteer_announcements_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_forms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" TEXT NOT NULL,
    "confirmation_message" TEXT NOT NULL DEFAULT 'Thank you for your submission!',
    "status" TEXT NOT NULL DEFAULT 'published',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "custom_forms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "member_id" TEXT,
    "answers" TEXT NOT NULL,
    "file_url" TEXT,
    "tags" TEXT,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by_id" TEXT,
    "approval_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_submissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "custom_forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "form_submissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "form_submissions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "form_workflow_triggers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "condition_field" TEXT,
    "condition_value" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_workflow_triggers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "form_workflow_triggers_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "custom_forms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "form_workflow_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "trigger_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target" TEXT,
    "template_text" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "form_workflow_actions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "form_workflow_actions_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "form_workflow_triggers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prayer_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "leader_id" TEXT,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "recurrence" TEXT,
    "music_url" TEXT,
    "music_volume" INTEGER NOT NULL DEFAULT 50,
    "is_music_paused" BOOLEAN NOT NULL DEFAULT false,
    "is_scrolling_paused" BOOLEAN NOT NULL DEFAULT false,
    "current_prayer_point_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prayer_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prayer_sessions_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prayer_session_participations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    "has_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "audio_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_temp_leader" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "prayer_session_participations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "prayer_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prayer_session_participations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prayer_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "duration" INTEGER,
    "scripture_ref" TEXT,
    "sequence_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "prayer_points_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "prayer_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prayer_session_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "reaction_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prayer_session_reactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "prayer_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prayer_session_reactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prayer_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "media_url" TEXT,
    "media_type" TEXT NOT NULL DEFAULT 'video',
    "category" TEXT NOT NULL DEFAULT 'basics',
    "recommended_for" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prayer_media_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "new_believer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "service_id" TEXT,
    "funnel_id" TEXT,
    "welcome_sent_at" DATETIME,
    "follow_up_started_at" DATETIME,
    "assigned_agent_id" TEXT,
    "cell_id" TEXT,
    "bible_reading_plan_started_at" DATETIME,
    "lms_enrolled_at" DATETIME,
    "lms_completed_at" DATETIME,
    "is_baptized" BOOLEAN NOT NULL DEFAULT false,
    "joined_group" BOOLEAN NOT NULL DEFAULT false,
    "finished_class" BOOLEAN NOT NULL DEFAULT false,
    "baptism_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "new_believer_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_believer_profiles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_believer_profiles_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "new_believer_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profile_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "scheduled_for" DATETIME NOT NULL,
    "completed_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    CONSTRAINT "new_believer_reminders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "new_believer_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lms_courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_modules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "lms_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "video_url" TEXT,
    "audio_url" TEXT,
    "pdf_url" TEXT,
    "sequence_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "lms_lessons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "lms_modules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    CONSTRAINT "lms_quizzes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    CONSTRAINT "lms_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "progress_percent" REAL NOT NULL DEFAULT 0.0,
    "completed_at" DATETIME,
    "certificate_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lms_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_enrollments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_lesson_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    CONSTRAINT "lms_lesson_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "lms_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_quiz_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "selected_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    CONSTRAINT "lms_quiz_answers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_quiz_answers_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "lms_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_quiz_answers_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "lms_quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lms_assignment_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "answer_text" TEXT,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "grade" TEXT,
    "feedback" TEXT,
    "graded_by_id" TEXT,
    "graded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lms_assignment_submissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_assignment_submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "lms_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "lms_assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lms_assignment_submissions_graded_by_id_fkey" FOREIGN KEY ("graded_by_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "is_licensed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_translations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_books" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "testament" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bible_books_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_verses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "translation_code" TEXT NOT NULL,
    "book_slug" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bible_verses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_verses_tenant_id_translation_code_fkey" FOREIGN KEY ("tenant_id", "translation_code") REFERENCES "bible_translations" ("tenant_id", "code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_reading_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "duration_days" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_reading_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_reading_plan_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "readings_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bible_reading_plan_days_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_reading_plan_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bible_reading_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_reading_plan_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "progress_percent" REAL NOT NULL DEFAULT 0.0,
    "completed_days_json" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_reading_plan_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_reading_plan_enrollments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bible_reading_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_reading_plan_enrollments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "translation_code" TEXT NOT NULL,
    "book_slug" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bible_bookmarks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_bookmarks_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_verse_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "book_slug" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_verse_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_verse_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_devotionals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scripture_ref" TEXT NOT NULL,
    "author_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "daily_devotionals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "daily_devotionals_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_verse_highlights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "translation_code" TEXT NOT NULL,
    "book_slug" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bible_verse_highlights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bible_verse_highlights_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bible_audio_tracks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "translation_code" TEXT NOT NULL,
    "book_slug" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "audio_url" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bible_audio_tracks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier_level" INTEGER NOT NULL,
    "max_members_threshold" INTEGER NOT NULL DEFAULT 25,
    "nested_cells_threshold" INTEGER NOT NULL DEFAULT 25,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "group_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "group_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "leader_id" TEXT,
    "co_leader_id" TEXT,
    "host_id" TEXT,
    "location_geocoding" TEXT,
    "online_meeting_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_group_type_id_fkey" FOREIGN KEY ("group_type_id") REFERENCES "group_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "groups_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "groups_co_leader_id_fkey" FOREIGN KEY ("co_leader_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "groups_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "scheduled_at" DATETIME NOT NULL,
    "held_at" DATETIME,
    "topic" TEXT NOT NULL,
    "study_guide_url" TEXT,
    "notes" TEXT,
    "attendance_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_meetings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "checked_in_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_in_by_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'present',
    CONSTRAINT "group_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_attendance_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "group_meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_attendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_attendance_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_invite_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_by_member_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "custom_message" TEXT,
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_invite_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_invite_links_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_invite_links_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_invite_conversions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "invite_link_id" TEXT NOT NULL,
    "visitor_member_id" TEXT NOT NULL,
    "registered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attribution_status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "group_invite_conversions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_invite_conversions_invite_link_id_fkey" FOREIGN KEY ("invite_link_id") REFERENCES "group_invite_links" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_invite_conversions_visitor_member_id_fkey" FOREIGN KEY ("visitor_member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_notice_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "group_notice_boards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_notice_boards_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_notice_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "posted_by_user_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "file_attachments_json" TEXT,
    "external_embeds_json" TEXT,
    "category" TEXT NOT NULL DEFAULT 'announcement',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_notice_posts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_notice_posts_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "group_notice_boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_notice_posts_posted_by_user_id_fkey" FOREIGN KEY ("posted_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_promotions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "scorecard_snapshot_json" TEXT,
    "approved_by_admin_id" TEXT,
    "pastor_authority_verified" BOOLEAN NOT NULL DEFAULT false,
    "executed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_promotions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_promotions_approved_by_admin_id_fkey" FOREIGN KEY ("approved_by_admin_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "cell_size_limit" INTEGER NOT NULL DEFAULT 25,
    "super_cell_size_limit" INTEGER NOT NULL DEFAULT 25,
    "auto_naming_rule_enabled" BOOLEAN NOT NULL DEFAULT true,
    "hierarchy_deep_limit" INTEGER NOT NULL DEFAULT 3,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "group_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "allergies" TEXT,
    "medical_notes" TEXT,
    "consent_waiver_signed" BOOLEAN NOT NULL DEFAULT false,
    "consent_waiver_signed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "child_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "child_profiles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "child_guardians" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "guardian_member_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_authorized_pickup" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "child_guardians_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "child_guardians_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "child_guardians_guardian_member_id_fkey" FOREIGN KEY ("guardian_member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pickup_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "authorized_person_name" TEXT NOT NULL,
    "authorized_person_phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pickup_authorizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pickup_authorizations_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "children_classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_age_months" INTEGER NOT NULL DEFAULT 0,
    "max_age_months" INTEGER NOT NULL DEFAULT 180,
    "room_number" TEXT,
    "capacity_limit" INTEGER NOT NULL DEFAULT 20,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "children_classes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "children_class_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "children_class_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_class_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "children_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_class_enrollments_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "children_class_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "publish_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "children_class_resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_class_resources_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "children_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "children_check_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "check_in_time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_out_time" DATETIME,
    "security_code" TEXT NOT NULL,
    "checked_in_by_member_id" TEXT NOT NULL,
    "checked_out_by_member_id" TEXT,
    "pickup_authorized_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'checked_in',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "children_check_ins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_check_ins_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_check_ins_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "children_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_check_ins_checked_in_by_member_id_fkey" FOREIGN KEY ("checked_in_by_member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_check_ins_checked_out_by_member_id_fkey" FOREIGN KEY ("checked_out_by_member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "event_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image_url" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "pricing_type" TEXT NOT NULL DEFAULT 'free',
    "price" REAL NOT NULL DEFAULT 0.0,
    "capacity_limit" INTEGER,
    "location_type" TEXT NOT NULL DEFAULT 'physical',
    "location" TEXT,
    "livestream_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "member_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "custom_responses_json" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'free',
    "payment_intent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "event_registrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_registrations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "qr_code_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "checked_in_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "event_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_tickets_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "event_registrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'going',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "event_rsvps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_rsvps_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "send_before_hours" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "event_reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "host_member_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meeting_type" TEXT NOT NULL DEFAULT 'video',
    "provider" TEXT NOT NULL DEFAULT 'native',
    "provider_meeting_id" TEXT,
    "meeting_url" TEXT NOT NULL,
    "scheduled_start" DATETIME NOT NULL,
    "scheduled_end" DATETIME,
    "recurrence" TEXT DEFAULT 'none',
    "recurrence_rules" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "enable_waiting_room" BOOLEAN NOT NULL DEFAULT false,
    "active_worship_session_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "recording_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "live_meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_meetings_host_member_id_fkey" FOREIGN KEY ("host_member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_meeting_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "member_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "joinStatus" TEXT NOT NULL DEFAULT 'approved',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "live_meeting_participants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "live_meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_meeting_participants_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_meeting_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "live_meeting_chats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_meeting_chats_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "live_meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_meeting_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "participant_email" TEXT NOT NULL,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    "duration_minutes" INTEGER,
    CONSTRAINT "live_meeting_attendances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_meeting_attendances_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "live_meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_meeting_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "send_before_minutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "live_meeting_reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_meeting_reminders_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "live_meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointment_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointment_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff_availabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "staff_availabilities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "staff_availabilities_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "appointment_type_id" TEXT NOT NULL,
    "host_member_id" TEXT NOT NULL,
    "booker_member_id" TEXT,
    "booker_name" TEXT NOT NULL,
    "booker_email" TEXT NOT NULL,
    "booker_phone" TEXT,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "intake_responses_json" TEXT,
    "private_notes" TEXT,
    "live_meeting_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_appointment_type_id_fkey" FOREIGN KEY ("appointment_type_id") REFERENCES "appointment_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_host_member_id_fkey" FOREIGN KEY ("host_member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_booker_member_id_fkey" FOREIGN KEY ("booker_member_id") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "appointments_live_meeting_id_fkey" FOREIGN KEY ("live_meeting_id") REFERENCES "live_meetings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointment_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "send_before_hours" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointment_reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointment_reminders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mobile_push_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mobile_push_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mobile_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "white_label_apps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL,
    "app_description" TEXT,
    "logo_url" TEXT,
    "app_icon_url" TEXT,
    "splash_screen_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#6200EE',
    "accent_color" TEXT NOT NULL DEFAULT '#03DAC5',
    "ios_bundle_id" TEXT,
    "android_package_name" TEXT,
    "push_certificates_json" TEXT,
    "store_details_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "white_label_apps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "white_label_builds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "build_number" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "logs" TEXT NOT NULL DEFAULT '',
    "download_url" TEXT,
    "store_type" TEXT,
    "submitted_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "white_label_builds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "translation_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "target_language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "translated_content" TEXT,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "translation_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "translated_contents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_keywords" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "translated_contents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "live_translation_feeds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "livestream_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "live_translation_feeds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "live_translation_feeds_livestream_id_fkey" FOREIGN KEY ("livestream_id") REFERENCES "livestreams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_captions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "media_asset_id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "media_captions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_captions_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_assistant_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt_type" TEXT NOT NULL,
    "input_prompt" TEXT NOT NULL,
    "generated_content" TEXT,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_assistant_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_presences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "presence_state" TEXT NOT NULL,
    "custom_presence" TEXT,
    "last_active_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_presences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agent_presences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'public',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "community_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_kb_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "keywords" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "chat_kb_articles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "altar_call_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT,
    "visitor_name" TEXT,
    "visitor_email" TEXT,
    "visitor_phone" TEXT,
    "response_type" TEXT NOT NULL,
    "livestream_id" TEXT,
    "crm_contact_id" TEXT,
    "counselor_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "altar_call_responses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "altar_call_responses_livestream_id_fkey" FOREIGN KEY ("livestream_id") REFERENCES "livestreams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centralized_settings_engine_module" (
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
    CONSTRAINT "centralized_settings_engine_module_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centralized_settings_engine_module_activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "centralized_settings_engine_module_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "centralized_settings_engine_module_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "billing_plan" TEXT NOT NULL DEFAULT 'free',
    "provider_mode" TEXT NOT NULL DEFAULT 'bring_your_own',
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "centralized_settings_engine_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page_revisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "created_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_revisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "page_revisions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "page_revisions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "navigation_menus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "navigation_menus_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "navigation_menus_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cms_footers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "copyright_text" TEXT,
    "social_links" TEXT NOT NULL DEFAULT '[]',
    "secondary_links" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cms_footers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cms_footers_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reusable_blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reusable_blocks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cms_activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action_type" TEXT NOT NULL,
    "page_id" TEXT,
    "metadata_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cms_activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "region_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "branches_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "branch_regions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_branches" ("created_at", "id", "name", "status", "tenant_id", "timezone", "updated_at") SELECT "created_at", "id", "name", "status", "tenant_id", "timezone", "updated_at" FROM "branches";
DROP TABLE "branches";
ALTER TABLE "new_branches" RENAME TO "branches";
CREATE INDEX "branches_tenant_id_idx" ON "branches"("tenant_id");
CREATE INDEX "branches_region_id_idx" ON "branches"("region_id");
CREATE TABLE "new_media_assets" (
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
    "parent_asset_id" TEXT,
    "clip_start_seconds" INTEGER,
    "clip_end_seconds" INTEGER,
    CONSTRAINT "media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "media_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "media_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "media_assets_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "media_series" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "media_assets_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "media_assets_parent_asset_id_fkey" FOREIGN KEY ("parent_asset_id") REFERENCES "media_assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_media_assets" ("category_id", "created_at", "description", "duration_seconds", "file_size_bytes", "id", "mime_type", "provider_key", "provider_type", "published_at", "series_id", "series_order", "source_url", "speaker_id", "status", "tenant_id", "thumbnail_url", "title", "type", "updated_at", "visibility") SELECT "category_id", "created_at", "description", "duration_seconds", "file_size_bytes", "id", "mime_type", "provider_key", "provider_type", "published_at", "series_id", "series_order", "source_url", "speaker_id", "status", "tenant_id", "thumbnail_url", "title", "type", "updated_at", "visibility" FROM "media_assets";
DROP TABLE "media_assets";
ALTER TABLE "new_media_assets" RENAME TO "media_assets";
CREATE INDEX "media_assets_tenant_id_idx" ON "media_assets"("tenant_id");
CREATE INDEX "media_assets_category_id_idx" ON "media_assets"("category_id");
CREATE INDEX "media_assets_series_id_idx" ON "media_assets"("series_id");
CREATE INDEX "media_assets_speaker_id_idx" ON "media_assets"("speaker_id");
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "family_id" TEXT,
    "family_role" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "photo_url" TEXT,
    "gender" TEXT,
    "birthday" DATETIME,
    "address" TEXT,
    "emergency_contact" TEXT,
    "membership_status" TEXT NOT NULL DEFAULT 'visitor',
    "branch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    CONSTRAINT "members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "members_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_members" ("created_at", "family_id", "family_role", "first_name", "id", "last_name", "membership_status", "phone", "preferred_language", "tenant_id", "updated_at", "user_id") SELECT "created_at", "family_id", "family_role", "first_name", "id", "last_name", "membership_status", "phone", "preferred_language", "tenant_id", "updated_at", "user_id" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");
CREATE INDEX "members_tenant_id_idx" ON "members"("tenant_id");
CREATE INDEX "members_family_id_idx" ON "members"("family_id");
CREATE INDEX "members_branch_id_idx" ON "members"("branch_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "branch_regions_tenant_id_idx" ON "branch_regions"("tenant_id");

-- CreateIndex
CREATE INDEX "branch_leaders_tenant_id_idx" ON "branch_leaders"("tenant_id");

-- CreateIndex
CREATE INDEX "branch_leaders_branch_id_idx" ON "branch_leaders"("branch_id");

-- CreateIndex
CREATE INDEX "branch_leaders_user_id_idx" ON "branch_leaders"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_leaders_branch_id_user_id_key" ON "branch_leaders"("branch_id", "user_id");

-- CreateIndex
CREATE INDEX "crm_contacts_tenant_id_idx" ON "crm_contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contacts_member_id_idx" ON "crm_contacts"("member_id");

-- CreateIndex
CREATE INDEX "crm_contacts_tenant_id_status_idx" ON "crm_contacts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "crm_contacts_tenant_id_type_idx" ON "crm_contacts"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "crm_timeline_events_tenant_id_idx" ON "crm_timeline_events"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_timeline_events_contact_id_idx" ON "crm_timeline_events"("contact_id");

-- CreateIndex
CREATE INDEX "crm_timeline_events_contact_id_occurred_at_idx" ON "crm_timeline_events"("contact_id", "occurred_at");

-- CreateIndex
CREATE INDEX "crm_followup_tasks_tenant_id_idx" ON "crm_followup_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_followup_tasks_contact_id_idx" ON "crm_followup_tasks"("contact_id");

-- CreateIndex
CREATE INDEX "crm_followup_tasks_assigned_user_id_idx" ON "crm_followup_tasks"("assigned_user_id");

-- CreateIndex
CREATE INDEX "crm_followup_tasks_tenant_id_status_idx" ON "crm_followup_tasks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "crm_followup_tasks_tenant_id_due_date_idx" ON "crm_followup_tasks"("tenant_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_member_id_key" ON "notification_preferences"("member_id");

-- CreateIndex
CREATE INDEX "notification_preferences_tenant_id_idx" ON "notification_preferences"("tenant_id");

-- CreateIndex
CREATE INDEX "scheduled_messages_tenant_id_idx" ON "scheduled_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "scheduled_messages_tenant_id_status_idx" ON "scheduled_messages"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "scheduled_messages_scheduled_at_idx" ON "scheduled_messages"("scheduled_at");

-- CreateIndex
CREATE INDEX "automation_workflows_tenant_id_idx" ON "automation_workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "automation_workflows_tenant_id_trigger_event_idx" ON "automation_workflows"("tenant_id", "trigger_event");

-- CreateIndex
CREATE INDEX "follow_up_sequences_tenant_id_idx" ON "follow_up_sequences"("tenant_id");

-- CreateIndex
CREATE INDEX "follow_up_steps_sequence_id_idx" ON "follow_up_steps"("sequence_id");

-- CreateIndex
CREATE INDEX "plugin_engine_instances_tenant_id_idx" ON "plugin_engine_instances"("tenant_id");

-- CreateIndex
CREATE INDEX "plugin_engine_instances_plugin_id_idx" ON "plugin_engine_instances"("plugin_id");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_engine_instances_tenant_id_plugin_id_key" ON "plugin_engine_instances"("tenant_id", "plugin_id");

-- CreateIndex
CREATE INDEX "plugin_engine_permissions_plugin_engine_id_idx" ON "plugin_engine_permissions"("plugin_engine_id");

-- CreateIndex
CREATE INDEX "blog_categories_tenant_id_idx" ON "blog_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "blog_categories_parent_id_idx" ON "blog_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_tenant_id_slug_key" ON "blog_categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "blog_tags_tenant_id_idx" ON "blog_tags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_tenant_id_slug_key" ON "blog_tags"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "blog_posts_tenant_id_idx" ON "blog_posts"("tenant_id");

-- CreateIndex
CREATE INDEX "blog_posts_category_id_idx" ON "blog_posts"("category_id");

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_post_type_idx" ON "blog_posts"("post_type");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_tenant_id_slug_key" ON "blog_posts"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "blog_post_tags_post_id_idx" ON "blog_post_tags"("post_id");

-- CreateIndex
CREATE INDEX "blog_post_tags_tag_id_idx" ON "blog_post_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_tags_post_id_tag_id_key" ON "blog_post_tags"("post_id", "tag_id");

-- CreateIndex
CREATE INDEX "blog_post_scriptures_post_id_idx" ON "blog_post_scriptures"("post_id");

-- CreateIndex
CREATE INDEX "blog_post_comments_post_id_idx" ON "blog_post_comments"("post_id");

-- CreateIndex
CREATE INDEX "blog_post_comments_tenant_id_idx" ON "blog_post_comments"("tenant_id");

-- CreateIndex
CREATE INDEX "blog_post_comments_status_idx" ON "blog_post_comments"("status");

-- CreateIndex
CREATE INDEX "library_categories_tenant_id_idx" ON "library_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "library_categories_parent_id_idx" ON "library_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_categories_tenant_id_slug_key" ON "library_categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "library_resources_tenant_id_idx" ON "library_resources"("tenant_id");

-- CreateIndex
CREATE INDEX "library_resources_category_id_idx" ON "library_resources"("category_id");

-- CreateIndex
CREATE INDEX "library_resources_status_idx" ON "library_resources"("status");

-- CreateIndex
CREATE UNIQUE INDEX "library_resources_tenant_id_slug_key" ON "library_resources"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "library_purchases_tenant_id_idx" ON "library_purchases"("tenant_id");

-- CreateIndex
CREATE INDEX "library_purchases_resource_id_idx" ON "library_purchases"("resource_id");

-- CreateIndex
CREATE INDEX "library_purchases_user_id_idx" ON "library_purchases"("user_id");

-- CreateIndex
CREATE INDEX "podcast_shows_tenant_id_idx" ON "podcast_shows"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_shows_status_idx" ON "podcast_shows"("status");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_shows_tenant_id_slug_key" ON "podcast_shows"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "podcast_episodes_tenant_id_idx" ON "podcast_episodes"("tenant_id");

-- CreateIndex
CREATE INDEX "podcast_episodes_show_id_idx" ON "podcast_episodes"("show_id");

-- CreateIndex
CREATE INDEX "podcast_episodes_status_idx" ON "podcast_episodes"("status");

-- CreateIndex
CREATE INDEX "podcast_episodes_publish_date_idx" ON "podcast_episodes"("publish_date");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_episodes_tenant_id_show_id_slug_key" ON "podcast_episodes"("tenant_id", "show_id", "slug");

-- CreateIndex
CREATE INDEX "ai_media_jobs_tenant_id_idx" ON "ai_media_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_media_jobs_media_asset_id_idx" ON "ai_media_jobs"("media_asset_id");

-- CreateIndex
CREATE INDEX "display_screens_tenant_id_idx" ON "display_screens"("tenant_id");

-- CreateIndex
CREATE INDEX "display_screens_branch_id_idx" ON "display_screens"("branch_id");

-- CreateIndex
CREATE INDEX "display_screens_active_playlist_id_idx" ON "display_screens"("active_playlist_id");

-- CreateIndex
CREATE INDEX "display_screens_active_worship_session_id_idx" ON "display_screens"("active_worship_session_id");

-- CreateIndex
CREATE INDEX "signage_playlists_tenant_id_idx" ON "signage_playlists"("tenant_id");

-- CreateIndex
CREATE INDEX "signage_slides_tenant_id_idx" ON "signage_slides"("tenant_id");

-- CreateIndex
CREATE INDEX "signage_playlist_items_playlist_id_idx" ON "signage_playlist_items"("playlist_id");

-- CreateIndex
CREATE INDEX "signage_playlist_items_slide_id_idx" ON "signage_playlist_items"("slide_id");

-- CreateIndex
CREATE UNIQUE INDEX "signage_playlist_items_playlist_id_slide_id_key" ON "signage_playlist_items"("playlist_id", "slide_id");

-- CreateIndex
CREATE INDEX "worship_songs_tenant_id_idx" ON "worship_songs"("tenant_id");

-- CreateIndex
CREATE INDEX "worship_playlists_tenant_id_idx" ON "worship_playlists"("tenant_id");

-- CreateIndex
CREATE INDEX "worship_playlist_items_playlist_id_idx" ON "worship_playlist_items"("playlist_id");

-- CreateIndex
CREATE INDEX "worship_playlist_items_song_id_idx" ON "worship_playlist_items"("song_id");

-- CreateIndex
CREATE UNIQUE INDEX "worship_playlist_items_playlist_id_song_id_key" ON "worship_playlist_items"("playlist_id", "song_id");

-- CreateIndex
CREATE INDEX "worship_sessions_tenant_id_idx" ON "worship_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "worship_sessions_playlist_id_idx" ON "worship_sessions"("playlist_id");

-- CreateIndex
CREATE INDEX "worship_sessions_current_song_id_idx" ON "worship_sessions"("current_song_id");

-- CreateIndex
CREATE INDEX "giving_categories_tenant_id_idx" ON "giving_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "giving_categories_tenant_id_name_key" ON "giving_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "donations_tenant_id_idx" ON "donations"("tenant_id");

-- CreateIndex
CREATE INDEX "donations_category_id_idx" ON "donations"("category_id");

-- CreateIndex
CREATE INDEX "donations_recurring_giving_id_idx" ON "donations"("recurring_giving_id");

-- CreateIndex
CREATE INDEX "donations_campaign_id_idx" ON "donations"("campaign_id");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "recurring_givings_tenant_id_idx" ON "recurring_givings"("tenant_id");

-- CreateIndex
CREATE INDEX "recurring_givings_category_id_idx" ON "recurring_givings"("category_id");

-- CreateIndex
CREATE INDEX "recurring_givings_status_idx" ON "recurring_givings"("status");

-- CreateIndex
CREATE INDEX "partnership_categories_tenant_id_idx" ON "partnership_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "partnership_categories_tenant_id_name_key" ON "partnership_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "partnerships_tenant_id_idx" ON "partnerships"("tenant_id");

-- CreateIndex
CREATE INDEX "partnerships_category_id_idx" ON "partnerships"("category_id");

-- CreateIndex
CREATE INDEX "partnerships_recurring_partnership_id_idx" ON "partnerships"("recurring_partnership_id");

-- CreateIndex
CREATE INDEX "partnerships_campaign_id_idx" ON "partnerships"("campaign_id");

-- CreateIndex
CREATE INDEX "partnerships_status_idx" ON "partnerships"("status");

-- CreateIndex
CREATE INDEX "recurring_partnerships_tenant_id_idx" ON "recurring_partnerships"("tenant_id");

-- CreateIndex
CREATE INDEX "recurring_partnerships_category_id_idx" ON "recurring_partnerships"("category_id");

-- CreateIndex
CREATE INDEX "recurring_partnerships_status_idx" ON "recurring_partnerships"("status");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_idx" ON "campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_tenant_id_slug_key" ON "campaigns"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "campaign_updates_tenant_id_idx" ON "campaign_updates"("tenant_id");

-- CreateIndex
CREATE INDEX "campaign_updates_campaign_id_idx" ON "campaign_updates"("campaign_id");

-- CreateIndex
CREATE INDEX "product_categories_tenant_id_idx" ON "product_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_campaign_id_idx" ON "products"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_slug_key" ON "products"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "product_variants_tenant_id_idx" ON "product_variants"("tenant_id");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "store_coupons_tenant_id_idx" ON "store_coupons"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_coupons_tenant_id_code_key" ON "store_coupons"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "store_orders_transaction_id_key" ON "store_orders"("transaction_id");

-- CreateIndex
CREATE INDEX "store_orders_tenant_id_idx" ON "store_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "store_orders_coupon_id_idx" ON "store_orders"("coupon_id");

-- CreateIndex
CREATE INDEX "store_orders_campaign_id_idx" ON "store_orders"("campaign_id");

-- CreateIndex
CREATE INDEX "order_items_tenant_id_idx" ON "order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE INDEX "financial_accounts_tenant_id_idx" ON "financial_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_accounts_branch_id_idx" ON "financial_accounts"("branch_id");

-- CreateIndex
CREATE INDEX "financial_budgets_tenant_id_idx" ON "financial_budgets"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_budgets_branch_id_idx" ON "financial_budgets"("branch_id");

-- CreateIndex
CREATE INDEX "financial_transactions_tenant_id_idx" ON "financial_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_transactions_account_id_idx" ON "financial_transactions"("account_id");

-- CreateIndex
CREATE INDEX "expense_requests_tenant_id_idx" ON "expense_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "expense_requests_account_id_idx" ON "expense_requests"("account_id");

-- CreateIndex
CREATE INDEX "expense_requests_budget_id_idx" ON "expense_requests"("budget_id");

-- CreateIndex
CREATE INDEX "reconciliation_records_tenant_id_idx" ON "reconciliation_records"("tenant_id");

-- CreateIndex
CREATE INDEX "reconciliation_records_account_id_idx" ON "reconciliation_records"("account_id");

-- CreateIndex
CREATE INDEX "ministry_funnels_tenant_id_idx" ON "ministry_funnels"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ministry_funnels_tenant_id_slug_key" ON "ministry_funnels"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "funnel_steps_funnel_id_idx" ON "funnel_steps"("funnel_id");

-- CreateIndex
CREATE INDEX "funnel_steps_page_id_idx" ON "funnel_steps"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_steps_funnel_id_slug_key" ON "funnel_steps"("funnel_id", "slug");

-- CreateIndex
CREATE INDEX "funnel_submissions_tenant_id_idx" ON "funnel_submissions"("tenant_id");

-- CreateIndex
CREATE INDEX "funnel_submissions_funnel_id_idx" ON "funnel_submissions"("funnel_id");

-- CreateIndex
CREATE INDEX "funnel_submissions_step_id_idx" ON "funnel_submissions"("step_id");

-- CreateIndex
CREATE INDEX "funnel_submissions_member_id_idx" ON "funnel_submissions"("member_id");

-- CreateIndex
CREATE INDEX "funnel_analytics_tenant_id_idx" ON "funnel_analytics"("tenant_id");

-- CreateIndex
CREATE INDEX "funnel_analytics_funnel_id_idx" ON "funnel_analytics"("funnel_id");

-- CreateIndex
CREATE INDEX "funnel_analytics_step_id_idx" ON "funnel_analytics"("step_id");

-- CreateIndex
CREATE UNIQUE INDEX "funnel_analytics_tenant_id_funnel_id_step_id_date_key" ON "funnel_analytics"("tenant_id", "funnel_id", "step_id", "date");

-- CreateIndex
CREATE INDEX "member_check_ins_tenant_id_idx" ON "member_check_ins"("tenant_id");

-- CreateIndex
CREATE INDEX "member_check_ins_member_id_idx" ON "member_check_ins"("member_id");

-- CreateIndex
CREATE INDEX "member_notes_tenant_id_idx" ON "member_notes"("tenant_id");

-- CreateIndex
CREATE INDEX "member_notes_member_id_idx" ON "member_notes"("member_id");

-- CreateIndex
CREATE INDEX "member_notes_author_id_idx" ON "member_notes"("author_id");

-- CreateIndex
CREATE INDEX "member_tags_tenant_id_idx" ON "member_tags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_tags_tenant_id_name_key" ON "member_tags"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "member_tag_assignments_member_id_idx" ON "member_tag_assignments"("member_id");

-- CreateIndex
CREATE INDEX "member_tag_assignments_tag_id_idx" ON "member_tag_assignments"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_tag_assignments_member_id_tag_id_key" ON "member_tag_assignments"("member_id", "tag_id");

-- CreateIndex
CREATE INDEX "community_posts_tenant_id_idx" ON "community_posts"("tenant_id");

-- CreateIndex
CREATE INDEX "community_posts_member_id_idx" ON "community_posts"("member_id");

-- CreateIndex
CREATE INDEX "community_posts_group_id_idx" ON "community_posts"("group_id");

-- CreateIndex
CREATE INDEX "community_posts_channel_id_idx" ON "community_posts"("channel_id");

-- CreateIndex
CREATE INDEX "prayer_requests_tenant_id_idx" ON "prayer_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "prayer_requests_member_id_idx" ON "prayer_requests"("member_id");

-- CreateIndex
CREATE INDEX "prayer_requests_assigned_to_id_idx" ON "prayer_requests"("assigned_to_id");

-- CreateIndex
CREATE INDEX "testimonies_tenant_id_idx" ON "testimonies"("tenant_id");

-- CreateIndex
CREATE INDEX "testimonies_member_id_idx" ON "testimonies"("member_id");

-- CreateIndex
CREATE INDEX "community_comments_tenant_id_idx" ON "community_comments"("tenant_id");

-- CreateIndex
CREATE INDEX "community_comments_member_id_idx" ON "community_comments"("member_id");

-- CreateIndex
CREATE INDEX "community_comments_post_id_idx" ON "community_comments"("post_id");

-- CreateIndex
CREATE INDEX "community_comments_prayer_request_id_idx" ON "community_comments"("prayer_request_id");

-- CreateIndex
CREATE INDEX "community_comments_testimony_id_idx" ON "community_comments"("testimony_id");

-- CreateIndex
CREATE INDEX "community_reactions_tenant_id_idx" ON "community_reactions"("tenant_id");

-- CreateIndex
CREATE INDEX "community_reactions_member_id_idx" ON "community_reactions"("member_id");

-- CreateIndex
CREATE INDEX "community_reactions_post_id_idx" ON "community_reactions"("post_id");

-- CreateIndex
CREATE INDEX "community_reactions_prayer_request_id_idx" ON "community_reactions"("prayer_request_id");

-- CreateIndex
CREATE INDEX "community_reactions_testimony_id_idx" ON "community_reactions"("testimony_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_reactions_member_id_reaction_type_post_id_prayer_request_id_testimony_id_key" ON "community_reactions"("member_id", "reaction_type", "post_id", "prayer_request_id", "testimony_id");

-- CreateIndex
CREATE INDEX "chat_conversations_tenant_id_idx" ON "chat_conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_conversations_tenant_id_status_idx" ON "chat_conversations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "chat_conversations_assigned_agent_id_idx" ON "chat_conversations"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "chat_conversations_member_id_idx" ON "chat_conversations"("member_id");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_idx" ON "chat_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "care_requests_tenant_id_idx" ON "care_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "care_requests_tenant_id_request_type_idx" ON "care_requests"("tenant_id", "request_type");

-- CreateIndex
CREATE INDEX "care_requests_tenant_id_status_idx" ON "care_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "care_requests_assigned_agent_id_idx" ON "care_requests"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "saved_replies_tenant_id_idx" ON "saved_replies"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_follow_up_tasks_tenant_id_idx" ON "chat_follow_up_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_follow_up_tasks_conversation_id_idx" ON "chat_follow_up_tasks"("conversation_id");

-- CreateIndex
CREATE INDEX "chat_follow_up_tasks_assigned_user_id_idx" ON "chat_follow_up_tasks"("assigned_user_id");

-- CreateIndex
CREATE INDEX "outreach_campaigns_tenant_id_idx" ON "outreach_campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "outreach_campaigns_tenant_id_status_idx" ON "outreach_campaigns"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invite_assets_campaign_id_idx" ON "invite_assets"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "personalized_invite_pages_slug_key" ON "personalized_invite_pages"("slug");

-- CreateIndex
CREATE INDEX "personalized_invite_pages_tenant_id_idx" ON "personalized_invite_pages"("tenant_id");

-- CreateIndex
CREATE INDEX "personalized_invite_pages_campaign_id_idx" ON "personalized_invite_pages"("campaign_id");

-- CreateIndex
CREATE INDEX "personalized_invite_pages_member_id_idx" ON "personalized_invite_pages"("member_id");

-- CreateIndex
CREATE INDEX "invite_link_clicks_page_id_idx" ON "invite_link_clicks"("page_id");

-- CreateIndex
CREATE INDEX "share_events_page_id_idx" ON "share_events"("page_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_member_id_key" ON "volunteer_profiles"("member_id");

-- CreateIndex
CREATE INDEX "volunteer_profiles_tenant_id_idx" ON "volunteer_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "volunteer_departments_tenant_id_idx" ON "volunteer_departments"("tenant_id");

-- CreateIndex
CREATE INDEX "volunteer_teams_tenant_id_idx" ON "volunteer_teams"("tenant_id");

-- CreateIndex
CREATE INDEX "volunteer_teams_department_id_idx" ON "volunteer_teams"("department_id");

-- CreateIndex
CREATE INDEX "volunteer_team_assignments_tenant_id_idx" ON "volunteer_team_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "volunteer_team_assignments_team_id_idx" ON "volunteer_team_assignments"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_team_assignments_profile_id_team_id_key" ON "volunteer_team_assignments"("profile_id", "team_id");

-- CreateIndex
CREATE INDEX "volunteer_availabilities_tenant_id_idx" ON "volunteer_availabilities"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_availabilities_profile_id_blocked_date_key" ON "volunteer_availabilities"("profile_id", "blocked_date");

-- CreateIndex
CREATE INDEX "volunteer_shifts_tenant_id_idx" ON "volunteer_shifts"("tenant_id");

-- CreateIndex
CREATE INDEX "volunteer_assignments_tenant_id_idx" ON "volunteer_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "volunteer_assignments_shift_id_idx" ON "volunteer_assignments"("shift_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_assignments_profile_id_shift_id_key" ON "volunteer_assignments"("profile_id", "shift_id");

-- CreateIndex
CREATE INDEX "volunteer_announcements_tenant_id_idx" ON "volunteer_announcements"("tenant_id");

-- CreateIndex
CREATE INDEX "custom_forms_tenant_id_idx" ON "custom_forms"("tenant_id");

-- CreateIndex
CREATE INDEX "form_submissions_tenant_id_idx" ON "form_submissions"("tenant_id");

-- CreateIndex
CREATE INDEX "form_submissions_form_id_idx" ON "form_submissions"("form_id");

-- CreateIndex
CREATE INDEX "form_workflow_triggers_tenant_id_idx" ON "form_workflow_triggers"("tenant_id");

-- CreateIndex
CREATE INDEX "form_workflow_triggers_form_id_idx" ON "form_workflow_triggers"("form_id");

-- CreateIndex
CREATE INDEX "form_workflow_actions_tenant_id_idx" ON "form_workflow_actions"("tenant_id");

-- CreateIndex
CREATE INDEX "form_workflow_actions_trigger_id_idx" ON "form_workflow_actions"("trigger_id");

-- CreateIndex
CREATE INDEX "prayer_sessions_tenant_id_idx" ON "prayer_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "prayer_sessions_leader_id_idx" ON "prayer_sessions"("leader_id");

-- CreateIndex
CREATE INDEX "prayer_session_participations_session_id_idx" ON "prayer_session_participations"("session_id");

-- CreateIndex
CREATE INDEX "prayer_session_participations_member_id_idx" ON "prayer_session_participations"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "prayer_session_participations_session_id_member_id_key" ON "prayer_session_participations"("session_id", "member_id");

-- CreateIndex
CREATE INDEX "prayer_points_session_id_idx" ON "prayer_points"("session_id");

-- CreateIndex
CREATE INDEX "prayer_session_reactions_session_id_idx" ON "prayer_session_reactions"("session_id");

-- CreateIndex
CREATE INDEX "prayer_session_reactions_member_id_idx" ON "prayer_session_reactions"("member_id");

-- CreateIndex
CREATE INDEX "prayer_media_tenant_id_idx" ON "prayer_media"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "new_believer_profiles_member_id_key" ON "new_believer_profiles"("member_id");

-- CreateIndex
CREATE INDEX "new_believer_profiles_tenant_id_idx" ON "new_believer_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "new_believer_profiles_member_id_idx" ON "new_believer_profiles"("member_id");

-- CreateIndex
CREATE INDEX "new_believer_profiles_assigned_agent_id_idx" ON "new_believer_profiles"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "new_believer_reminders_profile_id_idx" ON "new_believer_reminders"("profile_id");

-- CreateIndex
CREATE INDEX "lms_courses_tenant_id_idx" ON "lms_courses"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_courses_tenant_id_slug_key" ON "lms_courses"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "lms_modules_tenant_id_idx" ON "lms_modules"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_modules_course_id_idx" ON "lms_modules"("course_id");

-- CreateIndex
CREATE INDEX "lms_lessons_tenant_id_idx" ON "lms_lessons"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_lessons_module_id_idx" ON "lms_lessons"("module_id");

-- CreateIndex
CREATE INDEX "lms_quizzes_tenant_id_idx" ON "lms_quizzes"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_quizzes_lesson_id_idx" ON "lms_quizzes"("lesson_id");

-- CreateIndex
CREATE INDEX "lms_assignments_tenant_id_idx" ON "lms_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_assignments_lesson_id_idx" ON "lms_assignments"("lesson_id");

-- CreateIndex
CREATE INDEX "lms_enrollments_tenant_id_idx" ON "lms_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_enrollments_course_id_idx" ON "lms_enrollments"("course_id");

-- CreateIndex
CREATE INDEX "lms_enrollments_member_id_idx" ON "lms_enrollments"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_enrollments_course_id_member_id_key" ON "lms_enrollments"("course_id", "member_id");

-- CreateIndex
CREATE INDEX "lms_lesson_progress_tenant_id_idx" ON "lms_lesson_progress"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_lesson_progress_enrollment_id_idx" ON "lms_lesson_progress"("enrollment_id");

-- CreateIndex
CREATE INDEX "lms_lesson_progress_lesson_id_idx" ON "lms_lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_lesson_progress_enrollment_id_lesson_id_key" ON "lms_lesson_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "lms_quiz_answers_tenant_id_idx" ON "lms_quiz_answers"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_quiz_answers_enrollment_id_idx" ON "lms_quiz_answers"("enrollment_id");

-- CreateIndex
CREATE INDEX "lms_quiz_answers_quiz_id_idx" ON "lms_quiz_answers"("quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_quiz_answers_enrollment_id_quiz_id_key" ON "lms_quiz_answers"("enrollment_id", "quiz_id");

-- CreateIndex
CREATE INDEX "lms_assignment_submissions_tenant_id_idx" ON "lms_assignment_submissions"("tenant_id");

-- CreateIndex
CREATE INDEX "lms_assignment_submissions_enrollment_id_idx" ON "lms_assignment_submissions"("enrollment_id");

-- CreateIndex
CREATE INDEX "lms_assignment_submissions_assignment_id_idx" ON "lms_assignment_submissions"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_assignment_submissions_enrollment_id_assignment_id_key" ON "lms_assignment_submissions"("enrollment_id", "assignment_id");

-- CreateIndex
CREATE INDEX "bible_translations_tenant_id_idx" ON "bible_translations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_translations_tenant_id_code_key" ON "bible_translations"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "bible_books_tenant_id_idx" ON "bible_books"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_tenant_id_slug_key" ON "bible_books"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "bible_verses_tenant_id_idx" ON "bible_verses"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_verses_translation_code_idx" ON "bible_verses"("translation_code");

-- CreateIndex
CREATE INDEX "bible_verses_book_slug_idx" ON "bible_verses"("book_slug");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_tenant_id_translation_code_book_slug_chapter_verse_key" ON "bible_verses"("tenant_id", "translation_code", "book_slug", "chapter", "verse");

-- CreateIndex
CREATE INDEX "bible_reading_plans_tenant_id_idx" ON "bible_reading_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_reading_plan_days_tenant_id_idx" ON "bible_reading_plan_days"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_reading_plan_days_plan_id_idx" ON "bible_reading_plan_days"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_reading_plan_days_plan_id_day_number_key" ON "bible_reading_plan_days"("plan_id", "day_number");

-- CreateIndex
CREATE INDEX "bible_reading_plan_enrollments_tenant_id_idx" ON "bible_reading_plan_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_reading_plan_enrollments_plan_id_idx" ON "bible_reading_plan_enrollments"("plan_id");

-- CreateIndex
CREATE INDEX "bible_reading_plan_enrollments_member_id_idx" ON "bible_reading_plan_enrollments"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_reading_plan_enrollments_plan_id_member_id_key" ON "bible_reading_plan_enrollments"("plan_id", "member_id");

-- CreateIndex
CREATE INDEX "bible_bookmarks_tenant_id_idx" ON "bible_bookmarks"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_bookmarks_member_id_idx" ON "bible_bookmarks"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_bookmarks_member_id_translation_code_book_slug_chapter_verse_key" ON "bible_bookmarks"("member_id", "translation_code", "book_slug", "chapter", "verse");

-- CreateIndex
CREATE INDEX "bible_verse_notes_tenant_id_idx" ON "bible_verse_notes"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_verse_notes_member_id_idx" ON "bible_verse_notes"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verse_notes_member_id_book_slug_chapter_verse_key" ON "bible_verse_notes"("member_id", "book_slug", "chapter", "verse");

-- CreateIndex
CREATE INDEX "daily_devotionals_tenant_id_idx" ON "daily_devotionals"("tenant_id");

-- CreateIndex
CREATE INDEX "daily_devotionals_author_id_idx" ON "daily_devotionals"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_devotionals_tenant_id_date_key" ON "daily_devotionals"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "bible_verse_highlights_tenant_id_idx" ON "bible_verse_highlights"("tenant_id");

-- CreateIndex
CREATE INDEX "bible_verse_highlights_member_id_idx" ON "bible_verse_highlights"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verse_highlights_member_id_translation_code_book_slug_chapter_verse_key" ON "bible_verse_highlights"("member_id", "translation_code", "book_slug", "chapter", "verse");

-- CreateIndex
CREATE INDEX "bible_audio_tracks_tenant_id_idx" ON "bible_audio_tracks"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bible_audio_tracks_tenant_id_translation_code_book_slug_chapter_key" ON "bible_audio_tracks"("tenant_id", "translation_code", "book_slug", "chapter");

-- CreateIndex
CREATE INDEX "group_types_tenant_id_idx" ON "group_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_types_tenant_id_name_key" ON "group_types"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "groups_tenant_id_idx" ON "groups"("tenant_id");

-- CreateIndex
CREATE INDEX "groups_parent_id_idx" ON "groups"("parent_id");

-- CreateIndex
CREATE INDEX "groups_group_type_id_idx" ON "groups"("group_type_id");

-- CreateIndex
CREATE INDEX "group_members_tenant_id_idx" ON "group_members"("tenant_id");

-- CreateIndex
CREATE INDEX "group_members_group_id_idx" ON "group_members"("group_id");

-- CreateIndex
CREATE INDEX "group_members_member_id_idx" ON "group_members"("member_id");

-- CreateIndex
CREATE INDEX "group_meetings_tenant_id_idx" ON "group_meetings"("tenant_id");

-- CreateIndex
CREATE INDEX "group_meetings_group_id_idx" ON "group_meetings"("group_id");

-- CreateIndex
CREATE INDEX "group_attendance_tenant_id_idx" ON "group_attendance"("tenant_id");

-- CreateIndex
CREATE INDEX "group_attendance_meeting_id_idx" ON "group_attendance"("meeting_id");

-- CreateIndex
CREATE INDEX "group_attendance_member_id_idx" ON "group_attendance"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_attendance_meeting_id_member_id_key" ON "group_attendance"("meeting_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_invite_links_token_key" ON "group_invite_links"("token");

-- CreateIndex
CREATE INDEX "group_invite_links_tenant_id_idx" ON "group_invite_links"("tenant_id");

-- CreateIndex
CREATE INDEX "group_invite_links_group_id_idx" ON "group_invite_links"("group_id");

-- CreateIndex
CREATE INDEX "group_invite_conversions_tenant_id_idx" ON "group_invite_conversions"("tenant_id");

-- CreateIndex
CREATE INDEX "group_invite_conversions_invite_link_id_idx" ON "group_invite_conversions"("invite_link_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_notice_boards_group_id_key" ON "group_notice_boards"("group_id");

-- CreateIndex
CREATE INDEX "group_notice_boards_tenant_id_idx" ON "group_notice_boards"("tenant_id");

-- CreateIndex
CREATE INDEX "group_notice_posts_tenant_id_idx" ON "group_notice_posts"("tenant_id");

-- CreateIndex
CREATE INDEX "group_notice_posts_board_id_idx" ON "group_notice_posts"("board_id");

-- CreateIndex
CREATE INDEX "group_promotions_tenant_id_idx" ON "group_promotions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_settings_tenant_id_key" ON "group_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "group_settings_tenant_id_idx" ON "group_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_member_id_key" ON "child_profiles"("member_id");

-- CreateIndex
CREATE INDEX "child_profiles_tenant_id_idx" ON "child_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "child_guardians_tenant_id_idx" ON "child_guardians"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_guardians_child_profile_id_guardian_member_id_key" ON "child_guardians"("child_profile_id", "guardian_member_id");

-- CreateIndex
CREATE INDEX "pickup_authorizations_tenant_id_idx" ON "pickup_authorizations"("tenant_id");

-- CreateIndex
CREATE INDEX "pickup_authorizations_child_profile_id_idx" ON "pickup_authorizations"("child_profile_id");

-- CreateIndex
CREATE INDEX "children_classes_tenant_id_idx" ON "children_classes"("tenant_id");

-- CreateIndex
CREATE INDEX "children_class_enrollments_tenant_id_idx" ON "children_class_enrollments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "children_class_enrollments_class_id_child_profile_id_key" ON "children_class_enrollments"("class_id", "child_profile_id");

-- CreateIndex
CREATE INDEX "children_class_resources_tenant_id_idx" ON "children_class_resources"("tenant_id");

-- CreateIndex
CREATE INDEX "children_class_resources_class_id_idx" ON "children_class_resources"("class_id");

-- CreateIndex
CREATE INDEX "children_check_ins_tenant_id_idx" ON "children_check_ins"("tenant_id");

-- CreateIndex
CREATE INDEX "children_check_ins_child_profile_id_idx" ON "children_check_ins"("child_profile_id");

-- CreateIndex
CREATE INDEX "children_check_ins_class_id_idx" ON "children_check_ins"("class_id");

-- CreateIndex
CREATE INDEX "event_categories_tenant_id_idx" ON "event_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "events_tenant_id_idx" ON "events"("tenant_id");

-- CreateIndex
CREATE INDEX "events_category_id_idx" ON "events"("category_id");

-- CreateIndex
CREATE INDEX "event_registrations_tenant_id_idx" ON "event_registrations"("tenant_id");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");

-- CreateIndex
CREATE INDEX "event_registrations_member_id_idx" ON "event_registrations"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_ticket_number_key" ON "event_tickets"("ticket_number");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_qr_code_token_key" ON "event_tickets"("qr_code_token");

-- CreateIndex
CREATE INDEX "event_tickets_tenant_id_idx" ON "event_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "event_tickets_event_id_idx" ON "event_tickets"("event_id");

-- CreateIndex
CREATE INDEX "event_tickets_registration_id_idx" ON "event_tickets"("registration_id");

-- CreateIndex
CREATE INDEX "event_rsvps_tenant_id_idx" ON "event_rsvps"("tenant_id");

-- CreateIndex
CREATE INDEX "event_rsvps_event_id_idx" ON "event_rsvps"("event_id");

-- CreateIndex
CREATE INDEX "event_rsvps_member_id_idx" ON "event_rsvps"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_event_id_member_id_key" ON "event_rsvps"("event_id", "member_id");

-- CreateIndex
CREATE INDEX "event_reminders_tenant_id_idx" ON "event_reminders"("tenant_id");

-- CreateIndex
CREATE INDEX "event_reminders_event_id_idx" ON "event_reminders"("event_id");

-- CreateIndex
CREATE INDEX "live_meetings_tenant_id_idx" ON "live_meetings"("tenant_id");

-- CreateIndex
CREATE INDEX "live_meetings_host_member_id_idx" ON "live_meetings"("host_member_id");

-- CreateIndex
CREATE INDEX "live_meeting_participants_tenant_id_idx" ON "live_meeting_participants"("tenant_id");

-- CreateIndex
CREATE INDEX "live_meeting_participants_meeting_id_idx" ON "live_meeting_participants"("meeting_id");

-- CreateIndex
CREATE INDEX "live_meeting_participants_member_id_idx" ON "live_meeting_participants"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_meeting_participants_meeting_id_email_key" ON "live_meeting_participants"("meeting_id", "email");

-- CreateIndex
CREATE INDEX "live_meeting_chats_tenant_id_idx" ON "live_meeting_chats"("tenant_id");

-- CreateIndex
CREATE INDEX "live_meeting_chats_meeting_id_idx" ON "live_meeting_chats"("meeting_id");

-- CreateIndex
CREATE INDEX "live_meeting_attendances_tenant_id_idx" ON "live_meeting_attendances"("tenant_id");

-- CreateIndex
CREATE INDEX "live_meeting_attendances_meeting_id_idx" ON "live_meeting_attendances"("meeting_id");

-- CreateIndex
CREATE INDEX "live_meeting_reminders_tenant_id_idx" ON "live_meeting_reminders"("tenant_id");

-- CreateIndex
CREATE INDEX "live_meeting_reminders_meeting_id_idx" ON "live_meeting_reminders"("meeting_id");

-- CreateIndex
CREATE INDEX "appointment_types_tenant_id_idx" ON "appointment_types"("tenant_id");

-- CreateIndex
CREATE INDEX "staff_availabilities_tenant_id_idx" ON "staff_availabilities"("tenant_id");

-- CreateIndex
CREATE INDEX "staff_availabilities_member_id_idx" ON "staff_availabilities"("member_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_appointment_type_id_idx" ON "appointments"("appointment_type_id");

-- CreateIndex
CREATE INDEX "appointments_host_member_id_idx" ON "appointments"("host_member_id");

-- CreateIndex
CREATE INDEX "appointments_booker_member_id_idx" ON "appointments"("booker_member_id");

-- CreateIndex
CREATE INDEX "appointments_live_meeting_id_idx" ON "appointments"("live_meeting_id");

-- CreateIndex
CREATE INDEX "appointment_reminders_tenant_id_idx" ON "appointment_reminders"("tenant_id");

-- CreateIndex
CREATE INDEX "appointment_reminders_appointment_id_idx" ON "appointment_reminders"("appointment_id");

-- CreateIndex
CREATE INDEX "mobile_push_tokens_tenant_id_idx" ON "mobile_push_tokens"("tenant_id");

-- CreateIndex
CREATE INDEX "mobile_push_tokens_user_id_idx" ON "mobile_push_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_push_tokens_user_id_token_key" ON "mobile_push_tokens"("user_id", "token");

-- CreateIndex
CREATE UNIQUE INDEX "white_label_apps_tenant_id_key" ON "white_label_apps"("tenant_id");

-- CreateIndex
CREATE INDEX "white_label_apps_tenant_id_idx" ON "white_label_apps"("tenant_id");

-- CreateIndex
CREATE INDEX "white_label_builds_tenant_id_idx" ON "white_label_builds"("tenant_id");

-- CreateIndex
CREATE INDEX "white_label_builds_app_id_idx" ON "white_label_builds"("app_id");

-- CreateIndex
CREATE INDEX "translation_jobs_tenant_id_idx" ON "translation_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "translation_jobs_status_idx" ON "translation_jobs"("status");

-- CreateIndex
CREATE INDEX "translated_contents_tenant_id_idx" ON "translated_contents"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "translated_contents_tenant_id_entity_type_entity_id_locale_key" ON "translated_contents"("tenant_id", "entity_type", "entity_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "translated_contents_tenant_id_locale_slug_key" ON "translated_contents"("tenant_id", "locale", "slug");

-- CreateIndex
CREATE INDEX "live_translation_feeds_tenant_id_idx" ON "live_translation_feeds"("tenant_id");

-- CreateIndex
CREATE INDEX "live_translation_feeds_livestream_id_idx" ON "live_translation_feeds"("livestream_id");

-- CreateIndex
CREATE INDEX "media_captions_tenant_id_idx" ON "media_captions"("tenant_id");

-- CreateIndex
CREATE INDEX "media_captions_media_asset_id_idx" ON "media_captions"("media_asset_id");

-- CreateIndex
CREATE INDEX "ai_assistant_jobs_tenant_id_idx" ON "ai_assistant_jobs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_presences_user_id_key" ON "agent_presences"("user_id");

-- CreateIndex
CREATE INDEX "agent_presences_tenant_id_idx" ON "agent_presences"("tenant_id");

-- CreateIndex
CREATE INDEX "community_channels_tenant_id_idx" ON "community_channels"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_kb_articles_tenant_id_idx" ON "chat_kb_articles"("tenant_id");

-- CreateIndex
CREATE INDEX "altar_call_responses_tenant_id_idx" ON "altar_call_responses"("tenant_id");

-- CreateIndex
CREATE INDEX "module_settings_tenant_id_idx" ON "module_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_settings_tenant_id_module_key_key" ON "module_settings"("tenant_id", "module_key");

-- CreateIndex
CREATE INDEX "centralized_settings_engine_module_tenant_id_idx" ON "centralized_settings_engine_module"("tenant_id");

-- CreateIndex
CREATE INDEX "centralized_settings_engine_module_activity_tenant_id_idx" ON "centralized_settings_engine_module_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "centralized_settings_engine_module_settings_tenant_id_idx" ON "centralized_settings_engine_module_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "centralized_settings_engine_module_settings_tenant_id_module_key_key" ON "centralized_settings_engine_module_settings"("tenant_id", "module_key");

-- CreateIndex
CREATE INDEX "page_revisions_tenant_id_idx" ON "page_revisions"("tenant_id");

-- CreateIndex
CREATE INDEX "page_revisions_page_id_idx" ON "page_revisions"("page_id");

-- CreateIndex
CREATE INDEX "navigation_menus_tenant_id_idx" ON "navigation_menus"("tenant_id");

-- CreateIndex
CREATE INDEX "navigation_menus_website_id_idx" ON "navigation_menus"("website_id");

-- CreateIndex
CREATE INDEX "cms_footers_tenant_id_idx" ON "cms_footers"("tenant_id");

-- CreateIndex
CREATE INDEX "cms_footers_website_id_idx" ON "cms_footers"("website_id");

-- CreateIndex
CREATE INDEX "reusable_blocks_tenant_id_idx" ON "reusable_blocks"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "reusable_blocks_tenant_id_key_key" ON "reusable_blocks"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "cms_activity_logs_tenant_id_idx" ON "cms_activity_logs"("tenant_id");
