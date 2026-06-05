# Live Meetings Module

## Description
Supports interactive video meetings for prayer meetings, cell meetings, counselling, training, Bible study, and group meetings using Jitsi, Zoom, Google Meet, LiveKit, or native meetings.

## Plain-English Overview
The Live Meetings Module supports interactive online meetings such as prayer meetings, cell meetings, Bible studies, counselling sessions, leadership meetings, discipleship classes, and group meetings. It should support video, audio, chat, screen sharing, host controls, waiting rooms, recordings, meeting links, recurring meetings, attendance, reminders, and integration with platforms such as Jitsi, Zoom, Google Meet, LiveKit, or a native meeting system. It should also support launching the Worship Experience Module inside meetings where needed.

## Section Context
Section F: Events, Meetings & Interaction

## Core Features (with Tooltips)
- **Video meetings**: Secure, browser-based video conferencing integrated directly into the church platform.
- **Audio meetings**: Voice-only rooms designed for lower-bandwidth areas or quick pastoral check-ins.
- **Meeting links**: Unique, secure URLs generated instantly for members to click and join a session.
- **Scheduled meetings**: The ability to create a room in advance and send calendar invites to the participants.
- **Recurring meetings**: Setup options for rooms that open every Tuesday at 7 PM for a specific prayer team.
- **Host controls**: Permissions allowing the leader to mute all participants, remove disruptive users, or lock the room.
- **Co-host controls**: Delegated permissions allowing an assistant to manage the chat and waiting room while the host teaches.
- **Waiting room**: A security lobby where the host must manually approve attendees before they enter the main session.
- **Chat**: A real-time text panel within the meeting room for users to share links or ask questions silently.
- **Screen sharing**: The ability for the host to broadcast their PowerPoint or software screen to all participants.
- **Recording**: Tools to securely record the meeting and automatically save it to the church’s media library.
- **Attendance tracking**: Automated logs showing exactly who joined the meeting and how long they stayed.
- **Meeting reminders**: Automated SMS or emails sent to participants 10 minutes before the room opens.
- **Meeting provider integration**: Options to use ChurchOS native video or securely embed an external Zoom license.
- **Worship module integration**: The ability to launch a synced, high-quality worship lyric presentation directly inside the meeting.

## Adaptations
- Can be used for prayer meetings, cell meetings, Bible studies, counselling, leadership meetings, and training
- Can integrate with Jitsi, Zoom, Google Meet, LiveKit, or native meeting tools
- Can launch worship sessions inside meetings
- Can connect to bookings, LMS, cells, CRM, attendance, and communication

## Relationships & Integrations
### Integrates With
- **Worship Experience Module**: Hosts can launch worship sessions inside meetings.
- **Cell / Fellowship Module**: Cell meetings can use live meeting rooms.
- **LMS & Discipleship Training Module**: Classes can be held as live sessions.
- **Booking & Appointment Management Module**: Counselling or prayer appointments can generate meeting links.
- **Communication, Notification & Follow-Up Module**: Sends meeting reminders.
- **Check-In & Attendance Management Module**: Tracks participants.
- **Ministry CRM Module**: Meeting attendance updates member engagement.

### Connections / Third-Party Services
- Jitsi
- LiveKit
- Zoom Meeting SDK
- Zoom Video SDK
- Google Meet API
- Daily.co
- Whereby
- Twilio Programmable Video
- Firebase / FCM

## APIs Needed
- Meeting Room API
- Meeting Provider API
- Meeting Schedule API
- Participant API
- Meeting Recording API
- Worship Meeting Integration API

## System Flow
1. Church admin opens the Live Meetings Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Live Meetings Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
live_meetings_module
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

live_meetings_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

live_meetings_module_settings
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
GET    /api/live-meetings - List all tenant records (paginated, filtered)
POST   /api/live-meetings - Create a record under X-Tenant-ID
GET    /api/live-meetings/:id - Fetch single tenant-isolated record
PATCH  /api/live-meetings/:id - Modify record details securely
DELETE /api/live-meetings/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Live Meetings Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Live Meetings Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- live-meetings.read
- live-meetings.create
- live-meetings.update
- live-meetings.delete
- live-meetings.manage_settings
- live-meetings.view_reports

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
