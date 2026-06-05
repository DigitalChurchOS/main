# Media Module

## Description
Stores and organizes sermons, audios, videos, short clips, image galleries, downloadable resources, and other church media assets using platform-managed or church-owned providers.

## Plain-English Overview
The Media Module manages sermons, videos, audio messages, short clips, image galleries, downloadable files, thumbnails, and media collections. Churches should be able to organize content by categories, tags, speakers, series, service dates, and playlists. The module should support both platform-managed storage and bring-your-own-provider options such as Cloudinary, AWS S3, Cloudflare R2, Vimeo, YouTube, or other media platforms. It should serve as the church’s main media archive and content library.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Video uploads**: Allows churches to securely host high-quality video files like sermons or promotional clips directly on the platform.
- **Audio uploads**: Infrastructure to store MP3 files for podcasts, sermon audio, or worship tracks.
- **Image galleries**: Tools to upload event photos and organize them into beautiful grids for website display.
- **Short clips**: Dedicated storage and organization for 60-second vertical videos designed for social media.
- **Sermon archive**: A structured, searchable database storing years of past church messages.
- **Media categories**: Folders allowing admins to group related content, like grouping all "Youth Camp" media together.
- **Media tags**: Labels attached to files (like "faith" or "grace") making it easy for users to search for specific topics.
- **Speaker/pastor tagging**: Associates a specific media file with the profile of the person who delivered the message.
- **Series management**: Groups multiple sermons together under a single artwork cover, preserving the chronological order.
- **Playlists**: Custom, sharable collections of media files that auto-play sequentially.
- **Thumbnails**: Custom cover images uploaded to make video or audio files look attractive before they are clicked.
- **Downloadable resources**: Allows admins to attach PDFs or presentation files directly to a sermon for viewers to download.
- **Media search**: A powerful search bar allowing users to find specific media by title, speaker, or date.
- **Media filtering**: Advanced tools letting users narrow down media by category, series, or tags.
- **Media embeds**: Generates code snippets allowing church videos to be placed on external websites.
- **Provider selection**: The choice between using ChurchOS built-in hosting or linking external YouTube/Vimeo URLs.
- **Platform-managed hosting**: A premium storage tier where ChurchOS directly handles the hosting and streaming of files.
- **Bring-your-own-provider hosting**: Allows churches to save money by pasting links from their own external media hosts.
- **Hybrid hosting**: Mixing and matching external YouTube links with internal direct-uploads in the same gallery.

## Adaptations
- Can use platform AWS, Cloudinary, R2, Vimeo, Mux, or other providers
- Can allow churches to connect their own Cloudinary, Vimeo, YouTube, AWS, or storage accounts
- Can store only metadata when church-owned providers are used
- Can connect media to services, LMS, blogs, podcasts, digital library, and AI tools
- Can support different pricing based on storage and bandwidth usage

## Relationships & Integrations
### Integrates With
- **Core Website & CMS Module**: Media can be embedded into pages.
- **Livestream Module**: Livestream replays can be saved into the media library.
- **Church Services Module**: Each service can have attached video replay, audio, clips, notes, and thumbnails.
- **LMS & Discipleship Training Module**: Lessons can use videos, audio, PDFs, and downloads from the Media Module.
- **Digital Library & Resource Center Module**: Some media assets can also be published as resources.
- **AI Media & Content Module**: AI can transcribe, summarize, subtitle, translate, or clip media.
- **Worship Experience Module**: Worship audio and background assets can use media storage infrastructure.

### Connections / Third-Party Services
- Cloudinary
- AWS S3
- Cloudflare R2
- Bunny Storage
- Vimeo
- Mux
- YouTube
- Wasabi
- Backblaze B2

## APIs Needed
- Media Upload API
- Media Library API
- Provider Integration API
- Media Metadata API
- Playback API
- Thumbnail API
- Storage Routing API

## System Flow
1. Church admin opens the Media Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Media Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
media_module
- id
- tenant_id
- title/name
- description
- status
- settings_json
- visibility
- created_by
- created_at
- updated_at

media_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

media_module_settings
- id
- tenant_id
- module_key
- enabled
- billing_plan
- provider_mode
- config_json
- updated_at
```

## API Playground / Suggested Endpoints
```text
GET    /api/media - List all tenant records (paginated, filtered)
POST   /api/media - Create a record under X-Tenant-ID
GET    /api/media/:id - Fetch single tenant-isolated record
PATCH  /api/media/:id - Modify record details securely
DELETE /api/media/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Media Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Media Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- media.read
- media.create
- media.update
- media.delete
- media.manage_settings
- media.view_reports

## Frontend Build Requirements
- Create responsive dashboard pages.
- Create empty states, loading states, and error states.
- Create forms with validation.
- Create listing pages with search/filter/sort.
- Create detail pages.
- Create settings page.
- Use clean modern UI with accessible buttons and readable typography.

## Backend Build Requirements
- Create database tables with tenant_id.
- Create API routes with tenant isolation.
- Add RBAC permission checks.
- Add audit/activity logs.
- Add validation and error handling.
- Add analytics event hooks.
- Add tests for create, read, update, delete, permissions, and tenant isolation.

## Acceptance Criteria
- A church admin can activate and configure the module.
- Records are isolated per tenant.
- Unauthorized users cannot access restricted data.
- Users can create, edit, view, and manage records according to permissions.
- The UI works on desktop and mobile.
- APIs return clear success and error responses.
- Activity is tracked for analytics and reporting.

## AI Agent Instruction
Build this module from database schema to frontend UI, API routes, service logic, validation, permissions, analytics hooks, and tests. Follow a modular architecture so this feature can be enabled, disabled, billed, extended, and integrated with other modules later.
