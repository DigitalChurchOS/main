# Worship Experience Module

## Description
A standalone worship application where churches upload audio, lyrics, backgrounds, and timed lyric slides so members can worship independently or inside meetings without needing a livestream.

## Plain-English Overview
The Worship Experience Module is a standalone interactive worship application within the platform. It is not part of livestreaming and does not require an ongoing service. Churches can upload worship audio, lyrics, timed lyric segments, backgrounds, and playlists. Members can open worship sessions independently and sing along as lyrics move page by page in sync with the audio. The module should support full-screen display, custom aspect ratios, dark and light backgrounds, lyric styling, worship playlists, personal worship mode, meeting worship mode, and social clip generation. It can also be launched inside live meetings as a worship tool, similar to how meeting platforms provide whiteboards or collaborative apps.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Worship song library**: Functional feature supporting worship song library workflows out-of-the-box.
- **Audio uploads**: Functional feature supporting audio uploads workflows out-of-the-box.
- **Lyrics uploads**: Functional feature supporting lyrics uploads workflows out-of-the-box.
- **Timed lyric segments**: Functional feature supporting timed lyric segments workflows out-of-the-box.
- **Page-by-page lyric display**: Functional feature supporting page-by-page lyric display workflows out-of-the-box.
- **Auto-sync lyrics with audio**: Functional feature supporting auto-sync lyrics with audio workflows out-of-the-box.
- **Manual lyric control**: Functional feature supporting manual lyric control workflows out-of-the-box.
- **Worship playlists**: Functional feature supporting worship playlists workflows out-of-the-box.
- **Worship sessions**: Functional feature supporting worship sessions workflows out-of-the-box.
- **Fullscreen mode**: Functional feature supporting fullscreen mode workflows out-of-the-box.
- **Custom aspect ratios**: Functional feature supporting custom aspect ratios workflows out-of-the-box.
- **Background backgrounds**: Functional feature supporting background backgrounds workflows out-of-the-box.
- **Background videos**: Functional feature supporting background videos workflows out-of-the-box.
- **Dark/light worship screen styles**: Functional feature supporting dark/light worship screen styles workflows out-of-the-box.
- **Font size controls**: Functional feature supporting font size controls workflows out-of-the-box.
- **Church branding overlay**: Functional feature supporting church branding overlay workflows out-of-the-box.
- **Personal worship mode**: Functional feature supporting personal worship mode workflows out-of-the-box.
- **Meeting worship mode**: Functional feature supporting meeting worship mode workflows out-of-the-box.
- **Projection mode**: Functional feature supporting projection mode workflows out-of-the-box.
- **Social clip mode**: Functional feature supporting social clip mode workflows out-of-the-box.
- **Shareable worship links**: Functional feature supporting shareable worship links workflows out-of-the-box.
- **Worship clip downloads**: Functional feature supporting worship clip downloads workflows out-of-the-box.

## Adaptations
- Works independently from livestreams
- Can be used for personal worship
- Can be launched inside live meetings
- Can be used by cell leaders before meetings
- Can be projected or screen-shared
- Can generate short shareable worship clips with church links
- Can connect to media storage, meetings, mobile app, digital signage, and analytics

## Relationships & Integrations
### Integrates With
- **Media Module**: Uses uploaded audio, backgrounds, and cover images.
- **Live Meetings Module**: Can be launched inside meetings as a worship tool.
- **Digital Signage & TV Display Module**: Can display worship lyrics on screens.
- **Mobile App Access Module**: Members can open worship sessions on mobile.
- **Member Outreach & Invite Campaign Module**: Worship clips can be shared with church links.
- **Advanced Translation & Multilingual Module**: Future versions may support translated lyrics.
- **Analytics & Reporting Module**: Tracks worship session plays, playlist usage, and shared clips.

### Connections / Third-Party Services
- Cloudinary / S3 / R2
- LiveKit / Jitsi / Zoom / Google Meet
- FFmpeg / Remotion
- Canva API / Figma
- CCLI SongSelect

## APIs Needed
- Worship Song API
- Lyrics Timing API
- Worship Playlist API
- Worship Session API
- Meeting Worship Integration API
- Worship Clip Export API

## System Flow
1. Church admin opens the Worship Experience Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Worship Experience Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
worship_experience_module
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

worship_experience_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

worship_experience_module_settings
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
GET    /api/worship-experience - List all tenant records (paginated, filtered)
POST   /api/worship-experience - Create a record under X-Tenant-ID
GET    /api/worship-experience/:id - Fetch single tenant-isolated record
PATCH  /api/worship-experience/:id - Modify record details securely
DELETE /api/worship-experience/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Worship Experience Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Worship Experience Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- worship-experience.read
- worship-experience.create
- worship-experience.update
- worship-experience.delete
- worship-experience.manage_settings
- worship-experience.view_reports

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
