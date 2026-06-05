-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "families_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_pipelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "crm_pipelines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "crm_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "member_crm_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assigned_user_id" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "member_crm_stages_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_crm_stages_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "member_crm_stages_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "opt_in_sms" BOOLEAN NOT NULL DEFAULT true,
    "opt_in_email" BOOLEAN NOT NULL DEFAULT true,
    "gdpr_consent" BOOLEAN NOT NULL DEFAULT true,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "consent_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consent_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "communication_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "template_id" TEXT,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_msg" TEXT,
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "communication_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "communication_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "family_id" TEXT,
    "family_role" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "membership_status" TEXT NOT NULL DEFAULT 'visitor',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_members" ("created_at", "first_name", "id", "last_name", "membership_status", "phone", "tenant_id", "updated_at", "user_id") SELECT "created_at", "first_name", "id", "last_name", "membership_status", "phone", "tenant_id", "updated_at", "user_id" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");
CREATE INDEX "members_tenant_id_idx" ON "members"("tenant_id");
CREATE INDEX "members_family_id_idx" ON "members"("family_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "families_tenant_id_idx" ON "families"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_pipelines_tenant_id_idx" ON "crm_pipelines"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_stages_tenant_id_idx" ON "crm_stages"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_stages_pipeline_id_idx" ON "crm_stages"("pipeline_id");

-- CreateIndex
CREATE INDEX "member_crm_stages_tenant_id_idx" ON "member_crm_stages"("tenant_id");

-- CreateIndex
CREATE INDEX "member_crm_stages_member_id_idx" ON "member_crm_stages"("member_id");

-- CreateIndex
CREATE INDEX "member_crm_stages_stage_id_idx" ON "member_crm_stages"("stage_id");

-- CreateIndex
CREATE INDEX "member_crm_stages_assigned_user_id_idx" ON "member_crm_stages"("assigned_user_id");

-- CreateIndex
CREATE INDEX "consent_records_tenant_id_idx" ON "consent_records"("tenant_id");

-- CreateIndex
CREATE INDEX "consent_records_member_id_idx" ON "consent_records"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_records_member_id_key" ON "consent_records"("member_id");

-- CreateIndex
CREATE INDEX "communication_templates_tenant_id_idx" ON "communication_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "communication_logs_tenant_id_idx" ON "communication_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "communication_logs_member_id_idx" ON "communication_logs"("member_id");

-- CreateIndex
CREATE INDEX "communication_logs_template_id_idx" ON "communication_logs"("template_id");
