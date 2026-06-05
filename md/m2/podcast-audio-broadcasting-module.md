# Podcast & Audio Broadcasting Module

## Description
Allows churches to publish audio content as podcast-style channels and distribute sermons or teachings through RSS and podcast platforms.

## Plain-English Overview
The Podcast & Audio Broadcasting Module allows churches to distribute audio teachings, sermons, devotional messages, interviews, and ministry content in a podcast-style format. It should support audio channels, playlists, series, RSS feeds, episode descriptions, cover images, speaker information, and publishing to external platforms where possible. This module helps churches reach people who prefer listening rather than watching video.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Podcast channels**: The ability to host multiple distinct shows (e.g., Sunday Sermons, Leadership Podcast).
- **Audio episode uploads**: Secure hosting and streaming distribution for the actual MP3 podcast files.
- **Episode descriptions**: Detailed text summaries explaining what the episode covers, including timestamps.
- **Cover images**: Upload tools for the square artwork representing either the whole show or a specific episode.
- **Audio playlists**: Collections of episodes grouped together for continuous, uninterrupted listening.
- **RSS feed generation**: The critical technical link required to submit the podcast to Apple Podcasts and Spotify.
- **Speaker tagging**: Identifying the specific host or guest featured in that particular episode.
- **Series tagging**: Grouping multiple episodes together as a multi-part teaching series.
- **Show notes**: Formatted text including links, resources, and scriptures referenced during the audio.
- **Podcast analytics**: Tracking data showing total downloads, unique listeners, and listener geographic locations.
- **External distribution support**: Seamless integration ensuring episodes published here appear instantly on external apps.

## Adaptations
- Can convert service audio into podcast episodes
- Can connect to media library
- Can create audio-only ministry channels
- Can connect to Apple Podcasts, Spotify, and other platforms where supported
- Can use AI for transcripts and summaries

## Relationships & Integrations
### Integrates With
- **Media Module**: Audio files are stored and managed through Media.
- **Church Services Module**: Service audio can become podcast episodes.
- **Dynamic Blog & Publishing Engine Module**: Podcast episodes can have written show notes.
- **AI Media & Content Module**: AI can generate transcripts and summaries.
- **Communication, Notification & Follow-Up Module**: New episodes can be announced to subscribers.

### Connections / Third-Party Services
- Spotify for Podcasters
- Apple Podcasts
- RSS.com
- Transistor
- Buzzsprout
- Anchor
- Cloudinary / S3 / R2
- OpenAI / Whisper

## APIs Needed
- Podcast Channel API
- Episode API
- RSS Feed API
- Audio Playback API
- Distribution API

## System Flow
1. Church admin opens the Podcast & Audio Broadcasting Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Podcast & Audio Broadcasting Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
podcast_audio_broadcasting_module
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

podcast_audio_broadcasting_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

podcast_audio_broadcasting_module_settings
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
GET    /api/podcast-audio-broadcasting - List all tenant records (paginated, filtered)
POST   /api/podcast-audio-broadcasting - Create a record under X-Tenant-ID
GET    /api/podcast-audio-broadcasting/:id - Fetch single tenant-isolated record
PATCH  /api/podcast-audio-broadcasting/:id - Modify record details securely
DELETE /api/podcast-audio-broadcasting/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Podcast & Audio Broadcasting Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Podcast & Audio Broadcasting Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- podcast-audio-broadcasting.read
- podcast-audio-broadcasting.create
- podcast-audio-broadcasting.update
- podcast-audio-broadcasting.delete
- podcast-audio-broadcasting.manage_settings
- podcast-audio-broadcasting.view_reports

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
