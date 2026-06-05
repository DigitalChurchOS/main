-- CreateTable
CREATE TABLE "church_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "service_date" DATETIME NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "thumbnail_url" TEXT,
    "speaker_id" TEXT,
    "sermon_media_id" TEXT,
    "service_audio_id" TEXT,
    "livestream_id" TEXT,
    "attendance_count" INTEGER,
    "giving_total" REAL,
    "salvation_count" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "church_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "church_services_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "church_services_sermon_media_id_fkey" FOREIGN KEY ("sermon_media_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "church_services_service_audio_id_fkey" FOREIGN KEY ("service_audio_id") REFERENCES "media_assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "church_services_livestream_id_fkey" FOREIGN KEY ("livestream_id") REFERENCES "livestreams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_scriptures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "service_scriptures_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "church_services" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_attachments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "church_services" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "church_services_tenant_id_idx" ON "church_services"("tenant_id");

-- CreateIndex
CREATE INDEX "church_services_service_type_idx" ON "church_services"("service_type");

-- CreateIndex
CREATE INDEX "church_services_service_date_idx" ON "church_services"("service_date");

-- CreateIndex
CREATE INDEX "church_services_speaker_id_idx" ON "church_services"("speaker_id");

-- CreateIndex
CREATE INDEX "church_services_status_idx" ON "church_services"("status");

-- CreateIndex
CREATE INDEX "service_scriptures_service_id_idx" ON "service_scriptures"("service_id");

-- CreateIndex
CREATE INDEX "service_attachments_service_id_idx" ON "service_attachments"("service_id");
