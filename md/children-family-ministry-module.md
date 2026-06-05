# Children & Family Ministry Module

## Description
Manages children, guardians, family groupings, child check-in, secure pickup, children classes, and family ministry records.

## Plain-English Overview
The Children & Family Ministry Module helps churches manage children, guardians, family groupings, children’s classes, secure check-ins, pickup permissions, and children’s ministry records. It should allow churches to connect children to parents or guardians, manage class attendance, track participation, and keep children’s ministry organized and secure.

## Section Context
Section E: Salvation, Discipleship & Training

## Core Features (with Tooltips)
- **Child profiles**: Specialized CRM records that hide contact information and link directly to a parent’s profile.
- **Parent/guardian profiles**: The primary household account responsible for checking the child in and out.
- **Household connection**: The database relationship ensuring only authorized adults can view or update a child’s data.
- **Children's class management**: Tools to organize kids into specific rooms based on their age or grade level.
- **Secure check-in**: The highly restrictive workflow generating matching security tags for parents and children at the door.
- **Pickup authorization**: A list of approved adults (like grandparents) who are legally allowed to collect the child.
- **Allergies/important notes**: Critical medical alerts (e.g., "Peanut Allergy") printed in bold red on the child’s name tag.
- **Children's attendance**: Rosters tracking exactly which kids are in which room for fire safety and capacity limits.
- **Parent notifications**: Instant SMS alerts (e.g., "Please come to Room 3, your baby is crying") sent discreetly to parents during service.
- **Children's events**: Specialized registration flows for VBS or kids camps requiring parental consent waivers.
- **Children's curriculum**: A dedicated library for Sunday school teachers to download their weekly lesson plans and crafts.
- **Family reports**: Analytics showing the growth rate of the children’s ministry compared to adult attendance.

## Adaptations
- Can connect with attendance and check-in
- Can support children’s LMS content
- Can notify parents or guardians
- Can support secure pickup processes
- Can help larger churches manage children’s ministry safely

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Children are connected to guardians and households.
- **Check-In & Attendance Management Module**: Secure check-in and pickup are managed.
- **Events & Registration Module**: Children’s events and classes can be registered.
- **Communication, Notification & Follow-Up Module**: Parents receive notifications.
- **LMS & Discipleship Training Module**: Children’s curriculum can be delivered through courses.

### Connections / Third-Party Services
- Check-in hardware providers
- Label printers / QR scanners
- Twilio / SendGrid
- Google Calendar
- Background check providers

## APIs Needed
- Child Profile API
- Guardian API
- Family API
- Children Check-In API
- Pickup Authorization API
- Children Class API

## System Flow
1. Church admin opens the Children & Family Ministry Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Children & Family Ministry Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
children_family_ministry_module
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

children_family_ministry_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

children_family_ministry_module_settings
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
GET    /api/children-family-ministry - List all tenant records (paginated, filtered)
POST   /api/children-family-ministry - Create a record under X-Tenant-ID
GET    /api/children-family-ministry/:id - Fetch single tenant-isolated record
PATCH  /api/children-family-ministry/:id - Modify record details securely
DELETE /api/children-family-ministry/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Children & Family Ministry Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Children & Family Ministry Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- children-family-ministry.read
- children-family-ministry.create
- children-family-ministry.update
- children-family-ministry.delete
- children-family-ministry.manage_settings
- children-family-ministry.view_reports

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
