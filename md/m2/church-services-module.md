# Church Services Module

## Description
A dedicated archive and management system for regular church services such as Sunday services and midweek services, separate from general events like conferences and seminars.

## Plain-English Overview
The Church Services Module is dedicated specifically to regular church services, separate from general events. Churches often have recurring Sunday services, midweek services, communion services, prayer services, healing services, thanksgiving services, and other weekly or monthly gatherings. This module allows those services to be created, archived, searched, filtered, replayed, and connected to related media. A missed service can later be found by date, service type, pastor, topic, or archive order. Services may also be connected to livestreams, sermon videos, audio versions, notes, scripture references, salvation responses, attendance, and giving.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Sunday service setup**: Specialized templates and workflows tailored specifically for managing main weekend gatherings.
- **Midweek service setup**: Templates optimized for Bible studies, Wednesday night services, or midweek prayers.
- **Prayer service setup**: Custom configurations for managing dedicated corporate prayer meetings.
- **Communion service setup**: Custom configurations with specific notes and elements for communion services.
- **Healing service setup**: Workflows for special services focusing on healing, deliverance, or special ministration.
- **Thanksgiving service setup**: Specialized service records designed to track testimonies and thanksgiving offerings.
- **Recurring service schedules**: Automates the creation of service records based on a weekly or monthly pattern.
- **Individual service records**: A unique database entry for every single service, acting as a hub for its data.
- **Service archive**: The public-facing catalog where users can browse all past church services.
- **Service replay**: The embedded video recording of the service available for on-demand viewing.
- **Service audio**: The extracted audio-only version of the service for podcast listeners or low-bandwidth users.
- **Service notes**: The official church-provided outline or summary of what was taught during that service.
- **Service scripture references**: A list of all Bible verses mentioned during the service for easy reference.
- **Service thumbnails**: The unique graphical banner or cover image representing that specific service date.
- **Speaker assignment**: Tags the specific pastor or guest minister who preached the main message.
- **Search by date**: A calendar tool allowing users to easily find a service from a specific Sunday months ago.
- **Filter by service type**: Options to hide midweek services and only browse Sunday main services, or vice versa.
- **Sort ascending/descending**: Organizes the service archive from newest to oldest or oldest to newest.
- **Attach livestream**: Links the scheduled livestream module feed directly to this service’s page.
- **Attach sermon media**: Links the edited, polished video file from the Media Module to this service record.
- **Attach giving records**: Connects total offering data to this specific service for financial reporting.
- **Attach salvation responses**: Links the list of people who gave their lives to Christ to the service where it happened.
- **Attach attendance records**: Links the final headcount and check-in roster to this service record.

## Adaptations
- Separates regular services from general events
- Helps churches preserve weekly service history
- Makes missed services easy to find
- Can become the central hub connecting livestream, media, giving, notes, Bible, attendance, and salvation response
- Can support physical, online, and hybrid services

## Relationships & Integrations
### Integrates With
- **Livestream Module**: Services can go live at a scheduled time.
- **Media Module**: Completed services and recordings become archived media, sermons, clips, and playlists.
- **Tithes & Offerings Module**: Each service can have related giving records.
- **Salvation & New Believer Journey Module**: Salvation responses can be tied to a specific service.
- **Check-In & Attendance Management Module**: Physical or online attendance can be connected to the service.
- **Bible & Scripture Engagement Module**: Scriptures used in a service can be attached.
- **Analytics & Reporting Module**: Service attendance, replay views, giving, and responses can be measured.

### Connections / Third-Party Services
- YouTube / Vimeo / Mux
- Cloudinary / S3 / R2
- Google Calendar / Outlook Calendar
- Algolia / Meilisearch
- OpenAI / AI providers

## APIs Needed
- Service Schedule API
- Service Archive API
- Service Type API
- Service Media Attachment API
- Service Attendance API
- Service Analytics API

## System Flow
1. Church admin opens the Church Services Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Church Services Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
church_services_module
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

church_services_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

church_services_module_settings
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
GET    /api/church-services - List all tenant records (paginated, filtered)
POST   /api/church-services - Create a record under X-Tenant-ID
GET    /api/church-services/:id - Fetch single tenant-isolated record
PATCH  /api/church-services/:id - Modify record details securely
DELETE /api/church-services/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Church Services Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Church Services Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- church-services.read
- church-services.create
- church-services.update
- church-services.delete
- church-services.manage_settings
- church-services.view_reports

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
