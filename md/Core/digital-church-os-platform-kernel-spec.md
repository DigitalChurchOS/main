# Digital Church OS - Platform Kernel Specification

This document defines the core shared entities, database schemas, access controls, automation, and privacy compliance layers that form the foundation of the Digital Church OS.
Before implementing any user-facing product modules, developers must build and stabilize this Core Platform Kernel.

## 1. Core System Entities
The fundamental database entities that define tenant scoping, account access, and base membership profiles.

### Entity: Tenant / Church
Represents a standalone church or multi-tenant customer instance. All data tables must include a tenant_id column referencing this entity.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key (generated automatically) |
| `name` | `VARCHAR(255)` | Official church or tenant organization name |
| `subdomain` | `VARCHAR(100)` | Unique subdomain for default routing, e.g., grace |
| `custom_domain` | `VARCHAR(255) (nullable)` | Custom white-label domain name, e.g., gracechurch.com |
| `status` | `ENUM` | Active, Suspended, Trialing |
| `created_at` | `TIMESTAMP` | Creation timestamp |

**Relationships:**
- One Tenant has many Branches/Campuses
- One Tenant has many Users
- One Tenant has many Members
- One Tenant has many Connected Services

### Entity: Branch / Campus
A physical or virtual location belonging to a tenant church. Allows events, checking, and finance tracking to be branch-scoped.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `name` | `VARCHAR(255)` | Campus name, e.g., Downtown Campus |
| `timezone` | `VARCHAR(100)` | Local timezone identifier, e.g., America/New_York |
| `status` | `ENUM` | Active, Inactive |

**Relationships:**
- Belongs to one Tenant
- One Branch has many Members (assigned branch)
- One Branch has many Events

### Entity: User
A security login identity. Users represent anyone with login credentials to the admin portal or member portal.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `email` | `VARCHAR(255)` | Unique email address used for login |
| `password_hash` | `VARCHAR(255)` | Secure password hash |
| `status` | `ENUM` | Active, Invited, Blocked |

**Relationships:**
- Belongs to one Tenant
- Has one linked Member profile (optional)
- Has many Roles via User_Role join table

### Entity: Member
A profile record representing a person in the congregation. A member might or might not have a login User account.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `user_id` | `UUID (nullable)` | Link to User credential if they have portal access |
| `first_name` | `VARCHAR(100)` | First name |
| `last_name` | `VARCHAR(100)` | Last name |
| `phone` | `VARCHAR(50)` | Contact mobile number |
| `membership_status` | `VARCHAR(100)` | e.g., Member, Leader, Visitor |

**Relationships:**
- Belongs to one Tenant
- Has one User account (optional)
- Belongs to many Small Groups (Cells)
- Has many Activity Logs

### Entity: Role & Permission
Controls role-based access control (RBAC). Roles hold permission scopes, and users are assigned one or more roles.

| Field | Type | Description |
|---|---|---|
| `Role Table` | `Schema` | id, tenant_id (nullable for system roles), name, description, is_custom |
| `Permission Table` | `Schema` | id, name (e.g., "media.create", "settings.write"), description |
| `Role_Permission Table` | `Join Schema` | role_id, permission_id (foreign keys) |
| `User_Role Table` | `Join Schema` | user_id, role_id (foreign keys) |

**Relationships:**
- Permissions are platform-wide but assigned locally per Tenant
- Custom roles are tenant-isolated; system roles (e.g., Owner) are shared

**Implementation Guidelines:**
Enforce unique indices on Tenant (subdomain, custom_domain) and User (tenant_id, email). Every query on these entities must filter by tenant_id automatically in the repository or DAO layer.

---

## 2. Connected Services / Integration Hub
Centralized registry mapping third-party providers (Stripe, Twilio, SendGrid, OpenAI) to tenant credentials.

### Entity: Provider Category
Specifies functional integrations groupings, ensuring modules query providers polymorphically.

| Field | Type | Description |
|---|---|---|
| `id` | `VARCHAR(100)` | Key identifier, e.g., media_storage, video_streaming, payment, sms |
| `name` | `VARCHAR(255)` | Readable label, e.g., Payment Gateways |

**Relationships:**
- One Category has many Providers

### Entity: Provider
An integration adapter defined by the platform, containing the driver class or API connector logic.

| Field | Type | Description |
|---|---|---|
| `id` | `VARCHAR(100)` | Unique key, e.g., stripe, paypal, sendgrid, twilio, zoom, livekit |
| `category_id` | `VARCHAR(100)` | Foreign key to Provider Category |
| `name` | `VARCHAR(255)` | e.g., Stripe Payment Engine |

**Relationships:**
- Belongs to one Provider Category
- Has many Tenant Connected Services

### Entity: Tenant Connected Service
Stores connection instances where a specific tenant links their account with a third-party Provider.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `provider_id` | `VARCHAR(100)` | Foreign key to Provider |
| `encrypted_credentials` | `TEXT` | AES-256 encrypted keys, tokens, client secrets, or vault references |
| `provider_mode` | `ENUM` | platform_managed (shared billing), bring_your_own (custom keys), hybrid |
| `is_active` | `BOOLEAN` | Enable/disable switch |

**Relationships:**
- Belongs to one Tenant
- Belongs to one Provider
- Has many Module Provider Overrides

### Entity: Module Provider Override
Allows a specific module to override the tenant default provider for a category.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `module_key` | `VARCHAR(100)` | e.g., media, lms, donation |
| `category_id` | `VARCHAR(100)` | Foreign key to Provider Category |
| `connected_service_id` | `UUID` | Foreign key to Tenant Connected Service to use |

**Relationships:**
- Scopes a specific service connection override per module per tenant

**Implementation Guidelines:**
API keys and secret tokens must NEVER be stored in plain text. Encrypt credentials at rest using a vault driver or AES-256 with a unique tenant salt managed outside the primary database.

---

## 3. Module Registry & Entitlements
Governs platform modularity, billing rules, dependencies, and feature constraints per tenant subscription.

### Entity: Module Definition
The global registry listing all modules available on the platform, their metadata, and developer requirements.

| Field | Type | Description |
|---|---|---|
| `key` | `VARCHAR(100)` | Primary Key (e.g. website-cms, media, analytics) |
| `name` | `VARCHAR(255)` | Clean display name |
| `category` | `VARCHAR(100)` | Functional group (Core, Media, Giving, Engagement...) |
| `dependencies` | `JSON` | List of other module keys required by this module |

**Relationships:**
- Has many Tenant Modules

### Entity: Tenant Module
Activations log recording which modules are currently active, expired, or locked on a tenant account.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `module_key` | `VARCHAR(100)` | Foreign key to Module Definition |
| `status` | `ENUM` | Pending, Active, Suspended, Trialing |
| `billing_rule` | `ENUM` | Free, Flat_Rate, Usage_Based, Tiered |
| `usage_limits` | `JSON` | Custom usage thresholds |

**Relationships:**
- Belongs to one Tenant
- References one Module Definition

**Implementation Guidelines:**
A Tenant Module router middleware must intercept requests to modules and return a 403 Forbidden status if a tenant does not have an active entitlement for the targeted module key.

---

## 4. Workflow & Automation Engine
Powering automated digital pathways, trigger-action mapping, and background retry loops.

### Entity: Workflow Definition
Specifies the automated canvas triggers, filter criteria, and action execution paths.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `name` | `VARCHAR(255)` | e.g., New Believer Follow-up |
| `trigger_event` | `VARCHAR(255)` | Event key that fires this workflow, e.g. "salvation.created" |
| `is_active` | `BOOLEAN` | Toggle status |

**Relationships:**
- One Workflow has many Actions and Conditions

### Entity: Workflow Action & Run
Tracks automated action nodes (e.g. Send SMS, Update CRM) and logs each execution job.

| Field | Type | Description |
|---|---|---|
| `Action Table` | `Schema` | id, workflow_id, step_order, action_type (sms/email/crm), config_json |
| `Run Table` | `Schema` | id, workflow_id, trigger_payload, status (running, completed, failed) |
| `Log Table` | `Schema` | id, run_id, action_id, error_message, executed_at |

**Relationships:**
- Workflows trigger asynchronously off the Event Bus
- Runs support auto-retry and delay timers via the background queue

**Implementation Guidelines:**
Decouple workflow execution from the main API thread. Hand off triggered events to a worker queue (e.g., Redis/BullMQ) to prevent blocking frontend transactions.

---

## 5. Content & Media Entities
Unified storage hierarchy, metadata indexes, and delivery references shared across all media-using modules.

### Entity: Media Asset
The base file registry representing uploaded media (video, audio, image, documents).

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `title` | `VARCHAR(255)` | Display name |
| `file_type` | `VARCHAR(100)` | Mime-type, e.g., video/mp4, image/png |
| `storage_provider_ref` | `VARCHAR(255)` | S3 key, Vimeo ID, Cloudinary public_id |
| `metadata` | `JSON` | Resolution, duration, file size, encoder status |

**Relationships:**
- Belongs to one Tenant
- Has many Subtitles/Transcripts
- Belongs to a Media Folder

### Entity: Media Folder
Enables tenants to organize media assets hierarchically inside a virtual directory tree.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `name` | `VARCHAR(255)` | Folder name |
| `parent_id` | `UUID (nullable)` | Self-referential key for subfolder nesting |

**Relationships:**
- Belongs to one Tenant
- Has many Media Assets

**Implementation Guidelines:**
All files should be organized inside folders. When an asset is deleted, make sure to delete its physically hosted file from the underlying Cloud Provider asynchronously via webhook or event handler.

---

## 6. Access Control & Visibility
Shared filters protecting digital resources based on client roles, branches, languages, or subscriptions.

### Entity: Access Policy
Rules attached to content/records to filter search results and API responses for members.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `entity_type` | `VARCHAR(100)` | Target table name, e.g., media_assets, event_schedules |
| `entity_id` | `UUID` | Target record ID |
| `visibility` | `ENUM` | Public, Members_Only, Leaders_Only, Group_Only, Paid_Access |
| `target_scope_id` | `UUID (nullable)` | Linked Branch ID, Group ID, or Subscription Plan ID |

**Relationships:**
- Interpreted dynamically by Database select queries and ORMs before returning API responses

**Implementation Guidelines:**
Enforce visibility scopes at the SQL or query builder level (using global criteria hooks) to ensure unauthorized resources are never loaded into RAM.

---

## 7. Consent, Privacy & Compliance
Ensures compliance with GDPR, CCPA, and COPPA by logging consent preferences, SMS opt-ins, and data requests.

### Entity: Consent Record
Tracks when and how a member consented to terms, privacy policies, SMS communications, and marketing.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `member_id` | `UUID` | Foreign key to Member |
| `opt_in_sms` | `BOOLEAN` | SMS Consent status |
| `opt_in_email` | `BOOLEAN` | Email Campaigns consent |
| `gdpr_consent` | `BOOLEAN` | General data privacy opt-in |
| `recorded_at` | `TIMESTAMP` | Consent submission timestamp |

**Relationships:**
- Belongs to one Tenant
- Belongs to one Member

### Entity: Compliance Requests
Tracks privacy compliance requests such as data exports or deletions.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `member_id` | `UUID` | Foreign key to Member |
| `request_type` | `ENUM` | Data_Export, Data_Deletion |
| `status` | `ENUM` | Pending, Processing, Completed, Rejected |

**Relationships:**
- Requires manual or automated compliance processing workflows

**Implementation Guidelines:**
Check opt-in statuses before triggering any SMS, Email, or WhatsApp dispatch via the Notification Service. Reject notifications automatically if opt_in is false.

---

## 8. Import & Export Hub
Orchestrates importing legacy spreadsheets (ChMS data, giving logs, media) and executing platform backups.

### Entity: Migration Job
Records batch migration workflows, tracking row counts, successes, failures, and file mapping templates.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `target_entity` | `VARCHAR(100)` | e.g. member, transaction, media |
| `file_ref` | `VARCHAR(255)` | S3 link to uploaded Excel/CSV file |
| `mapping_json` | `JSON` | Database column mapping configs |
| `status` | `ENUM` | Queued, Processing, Completed, Failed |
| `stats_json` | `JSON` | Total rows, imported count, failed row indices |

**Relationships:**
- Belongs to one Tenant

**Implementation Guidelines:**
Validate records in memory in small batches (e.g., 100 rows) before running database bulk inserts. Provide a review stage where admins can resolve column mapping mismatches.

---

## 9. Global Search Index Scopes
Bridges databases to the full-text search engine (e.g. Elasticsearch, Meilisearch) with tenant-isolated index keys.

### Entity: Search Index Mapping
Holds configurations indicating which columns on which tables get pushed to the index cluster.

| Field | Type | Description |
|---|---|---|
| `id` | `VARCHAR(100)` | Identifier, e.g. tenant_members, tenant_media |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `source_table` | `VARCHAR(100)` | Target database table |
| `indexed_fields` | `JSON` | Fields indexed |

**Relationships:**
- Synchronized automatically via DB triggers, Event Bus, or CDC systems

**Implementation Guidelines:**
Strictly append the tenant_id tag to every index search request to prevent results leakage across church databases.

---

## 10. Observability & System Health
Centralized telemetry, tracking API logs, webhook logs, background task failures, and third-party API limits.

### Entity: Observability Log
Base telemetry logs used by developers and admins to debug and monitor background worker states.

| Field | Type | Description |
|---|---|---|
| `id` | `BIGINT` | Primary Key (Auto-incrementing) |
| `tenant_id` | `UUID (nullable)` | Foreign key to Tenant if scoped |
| `log_level` | `ENUM` | Info, Warning, Error, Fatal |
| `scope` | `VARCHAR(100)` | e.g., webhook_delivery, payment_gateway, billing_cron |
| `message` | `TEXT` | Human-readable log text |
| `context_json` | `JSON` | Error trace, request headers, payload dumps |
| `created_at` | `TIMESTAMP` | Log timestamp |

**Relationships:**
- Cleaned up periodically via database pruning policies

**Implementation Guidelines:**
Observability logs write frequently. Use a fast, write-optimized database (like TimescaleDB or OpenSearch) or offload logging via a buffer handler to prevent taxing the primary relational database.

---

## 11. Support & Onboarding Systems
Drives church onboarding checklists, onboarding Wizards, help portals, and ticket escalations.

### Entity: Support Ticket
Tracks technical issues submitted by tenant admins to the platform support team.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `subject` | `VARCHAR(255)` | Ticket summary |
| `status` | `ENUM` | Open, In_Progress, Resolved, Closed |
| `priority` | `ENUM` | Low, Medium, High, Critical |

**Relationships:**
- Belongs to one Tenant
- Has many Ticket Comments

### Entity: Onboarding Step
Displays interactive checklist items to help new tenants configure the platform.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID` | Foreign key to Tenant |
| `step_key` | `VARCHAR(100)` | e.g. connect_stripe, create_first_event |
| `is_completed` | `BOOLEAN` | Completion status indicator |

**Relationships:**
- Belongs to one Tenant

**Implementation Guidelines:**
Inject onboarding steps dynamically as tenant modules are enabled. When a module is activated, append its setup guidelines to the tenant dashboard checklists.

---

## 12. Versioning & Release Management
Saves historical versions of themes, plugins, and app builds, and manages feature flags.

### Entity: Asset Release
Registers available versions of custom files, plugin scripts, themes, or mobile app binaries.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary key |
| `asset_type` | `ENUM` | Plugin, Theme, Mobile_Build |
| `asset_key` | `VARCHAR(100)` | e.g. dark-grace-theme |
| `semver` | `VARCHAR(50)` | Version tag, e.g. 1.2.4 |
| `manifest_json` | `JSON` | Settings, custom options, script entrypoints |

**Relationships:**
- Used by the marketplace and deployment engines to update active installations

### Entity: Feature Flag
Enables selective canary releases, beta trials, or pricing-tier entitlements dynamically.

| Field | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key |
| `tenant_id` | `UUID (nullable)` | If set, limits flag to a specific tenant |
| `flag_key` | `VARCHAR(100)` | e.g. ai-transcription-v2 |
| `is_enabled` | `BOOLEAN` | Global active switch |

**Relationships:**
- Queried at API runtime to conditionally expose endpoints

**Implementation Guidelines:**
Feature flag queries must be heavily cached in memory (e.g., Redis) since they are checked on almost every request.

---
