# Salvation & New Believer Journey Module

## Description
Guides people who receive Christ through prayer, registration, follow-up, recommended resources, LMS enrollment, group connection, and discipleship milestones.

## Plain-English Overview
The Salvation & New Believer Journey Module is dedicated to people who respond to the call to receive Christ. It should provide a guided salvation flow, prayer of salvation, confirmation form, new believer profile, welcome messages, recommended resources, follow-up automation, group assignment, LMS enrollment, reminders, and progress milestones. The goal is to move a person from a salvation response into discipleship, connection, training, and church integration with minimal manual oversight.

## Section Context
Section E: Salvation, Discipleship & Training

## Core Features (with Tooltips)
- **Salvation call button**: A highly visible button on the website and livestream for viewers making a decision for Christ.
- **Prayer of salvation flow**: A guided, on-screen text taking the user through the foundational prayer of repentance.
- **Salvation response form**: A minimal, sensitive form asking for the new believer’s name and email for follow-up.
- **New believer profile**: A specialized CRM record tracking the spiritual growth steps of the recent convert.
- **Source tracking**: Logs whether the person got saved during a livestream, at a physical service, or via a funnel.
- **Welcome message**: An immediate, automated email from the Senior Pastor welcoming them to the family of God.
- **Follow-up sequence**: A 30-day automated email drip campaign sending them daily scriptures and encouragement.
- **Resource recommendations**: Automated links providing the new believer with a free digital Bible and foundational study guides.
- **Bible reading plan assignment**: Automatically enrolls the user in a 14-day introductory Bible reading schedule.
- **LMS course enrollment**: Automatically signs the user up for the church’s "Foundation School" online course.
- **Cell/group assignment**: A workflow routing the new believer’s contact info to the nearest small group leader.
- **Progress milestones**: Visual checklists tracking if the person has been baptized, joined a group, and finished class.
- **Reminders**: Automated alerts prompting the pastoral care team to call the new believer at day 7 and day 30.
- **Completion reports**: Analytics showing how many people who click the salvation button actually finish Foundation School.
- **Care team routing**: Logic that automatically assigns the new convert to a specific follow-up agent based on their demographics.

## Adaptations
- Can be triggered from livestreams, services, events, landing pages, chat, or outreach links
- Can automatically move a person into discipleship
- Can reduce the need for manual follow-up
- Can connect to CRM, LMS, digital library, Bible, communication, and cells
- Can track the full journey from salvation response to established member

## Relationships & Integrations
### Integrates With
- **Livestream Module**: Salvation calls can appear during livestreams.
- **Church Services Module**: Salvation responses can be linked to a specific service.
- **Events & Registration Module**: Salvation responses can happen during special events.
- **LMS & Discipleship Training Module**: New believers can be automatically enrolled into foundation courses.
- **Digital Library & Resource Center Module**: Recommended materials can be assigned.
- **Bible & Scripture Engagement Module**: Beginner scriptures and reading plans can be suggested.
- **Cell / Fellowship Module**: New believers can be assigned to a cell or fellowship.
- **Ministry CRM Module**: New believer progress is tracked as a journey.
- **Communication, Notification & Follow-Up Module**: Automated follow-up messages are sent.
- **Live Chat, Pastoral Care & Support Module**: New believers can be connected to pastors or care teams.

### Connections / Third-Party Services
- Twilio / SendGrid / Mailchimp
- Bible API providers
- OpenAI / AI providers
- Google Maps
- Calendly
- Live Chat tools

## APIs Needed
- Salvation Response API
- New Believer Profile API
- Journey Step API
- Resource Recommendation API
- LMS Enrollment API
- Group Assignment API
- Follow-Up Automation API

## System Flow
1. Church admin opens the Salvation & New Believer Journey Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Salvation & New Believer Journey Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
salvation_new_believer_journey_module
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

salvation_new_believer_journey_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

salvation_new_believer_journey_module_settings
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
GET    /api/salvation-new-believer-journey - List all tenant records (paginated, filtered)
POST   /api/salvation-new-believer-journey - Create a record under X-Tenant-ID
GET    /api/salvation-new-believer-journey/:id - Fetch single tenant-isolated record
PATCH  /api/salvation-new-believer-journey/:id - Modify record details securely
DELETE /api/salvation-new-believer-journey/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Salvation & New Believer Journey Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Salvation & New Believer Journey Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- salvation-new-believer-journey.read
- salvation-new-believer-journey.create
- salvation-new-believer-journey.update
- salvation-new-believer-journey.delete
- salvation-new-believer-journey.manage_settings
- salvation-new-believer-journey.view_reports

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
