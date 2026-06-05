# Livestream Module

## Description
Allows churches to broadcast live services and programs online with scheduling, replay archives, chat, analytics, multi-platform distribution, Bible access, notes, and optional language audio support.

## Plain-English Overview
The Livestream Module allows churches to broadcast live services, programs, and ministry sessions online. It should support scheduled streams, countdown pages, replay archives, stream embeds, live chat, viewer analytics, and links to related actions such as giving, prayer requests, salvation response, or service notes. Advanced versions should support integrated Bible access, personal notes, multiple audio interpretation channels, and language selection where the streaming provider or architecture allows it.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Live service streaming**: The core engine that captures an RTMP feed and broadcasts it seamlessly to the church website.
- **Scheduled livestreams**: Allows admins to set a future date and time, creating a waiting room for early viewers.
- **Livestream countdown**: A visual clock displayed over the video player showing exactly when the service begins.
- **Stream page**: A dedicated distraction-free web page built specifically for watching the live broadcast.
- **Stream embed**: Embed code allowing the live video player to be placed on any external website.
- **Live chat**: A real-time chat room next to the video player for online viewers to interact and fellowship.
- **Replay archive**: Automatically saves the live broadcast as an on-demand video once the stream ends.
- **Stream analytics**: Metrics showing peak viewership, total watch time, and where viewers tuned in from.
- **Stream reminders**: Automated SMS and email notifications sent to subscribers 15 minutes before going live.
- **Multi-platform stream links**: Tools to simulcast the feed out to Facebook, YouTube, and ChurchOS simultaneously.
- **Bible panel**: An interactive widget next to the stream allowing viewers to read the scripture being preached.
- **Notes panel**: A digital notepad where viewers can type personal sermon notes and email them to themselves.
- **Prayer request button**: A persistent button allowing viewers to instantly submit prayer needs to the pastoral team.
- **Salvation response button**: A specialized call-to-action button for viewers who want to give their lives to Christ.
- **Giving button**: A direct link to the offering platform enabling viewers to donate without leaving the stream page.
- **Language/audio channel selector**: Options for viewers to switch between different translated audio feeds.
- **Replay attachment to services**: Automatically links the finished livestream video to the correct Sunday service record.

## Adaptations
- Can connect to church services
- Can connect to special events
- Can support YouTube, Vimeo, Mux, Cloudflare Stream, LiveKit, Jitsi, or custom streaming providers
- Can support multiple interpretation audio channels using native multi-audio or parallel audio streams
- Can allow viewers to take notes while watching
- Can connect livestream activity to CRM, analytics, giving, salvation, and care modules

## Relationships & Integrations
### Integrates With
- **Church Services Module**: A livestream can be attached to a specific Sunday service, midweek service, or special service.
- **Events & Registration Module**: A livestream can also be attached to conferences, crusades, seminars, and special events.
- **Live Chat, Pastoral Care & Support Module**: Viewers can request prayer, ask questions, or connect with care agents during a stream.
- **Salvation & New Believer Journey Module**: The livestream can display a salvation response button.
- **Tithes & Offerings Module**: The livestream can display service giving options.
- **Partnerships & Contributions Module**: The livestream can promote partnership opportunities.
- **Bible & Scripture Engagement Module**: Users can open Bible passages during the livestream.
- **Advanced Translation & Multilingual Module**: The livestream may support multiple language audio streams or interpretation channels.
- **Analytics & Reporting Module**: Viewer count, watch time, replays, and engagement are tracked.

### Connections / Third-Party Services
- YouTube Live
- Vimeo Livestream
- Mux Live
- Cloudflare Stream
- AWS IVS
- Bunny Stream
- OBS Studio
- Restream
- StreamYard
- LiveKit
- Jitsi

## APIs Needed
- Livestream Schedule API
- Stream Provider API
- Stream Playback API
- Replay API
- Live Chat API
- Stream Analytics API
- Audio Language Track API
- Livestream Interaction API

## System Flow
1. Church admin opens the Livestream Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Livestream Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
livestream_module
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

livestream_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

livestream_module_settings
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
GET    /api/livestream - List all tenant records (paginated, filtered)
POST   /api/livestream - Create a record under X-Tenant-ID
GET    /api/livestream/:id - Fetch single tenant-isolated record
PATCH  /api/livestream/:id - Modify record details securely
DELETE /api/livestream/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Livestream Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Livestream Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- livestream.read
- livestream.create
- livestream.update
- livestream.delete
- livestream.manage_settings
- livestream.view_reports

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
