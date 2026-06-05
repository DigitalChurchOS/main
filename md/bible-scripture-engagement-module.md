# Bible & Scripture Engagement Module

## Description
Provides Bible reading, scripture search, multiple translations where licensed, reading plans, verse sharing, notes, and scripture engagement tools.

## Plain-English Overview
The Bible & Scripture Engagement Module allows users to read, search, follow, save, and engage with scripture inside the platform. It should support Bible reading plans, scripture bookmarks, verse sharing, scripture notes, devotionals, and multiple Bible translations where licensing allows. This module can integrate with livestreams, services, blogs, LMS lessons, worship sessions, and personal notes so users do not need to leave the platform to open a separate Bible app.

## Section Context
Section E: Salvation, Discipleship & Training

## Core Features (with Tooltips)
- **Bible search**: A built-in tool allowing members to find specific verses or keywords across the entire Bible.
- **Bible reading**: A clean, distraction-free digital interface for reading chapters of scripture natively on the platform.
- **Multiple translations where licensed**: Support for different versions like KJV, NIV, or ESV based on church preferences.
- **Scripture references**: Hyperlinking tools that automatically turn texts like "John 3:16" into hoverable Bible tooltips.
- **Reading plans**: Structured daily schedules guiding members through the whole Bible or specific topical studies.
- **Bookmarks**: Tools allowing users to save their favorite verses to a personal dashboard for later study.
- **Verse sharing**: One-click buttons to instantly generate a beautiful graphic of a verse for Instagram or Facebook.
- **Scripture notes**: A digital journal where members can type personal revelations attached to a specific Bible verse.
- **Daily devotionals**: Short, daily pastoral insights linked directly to the corresponding scripture of the day.
- **Scripture-linked notes**: The ability to view past sermon notes that referenced the specific chapter the user is currently reading.
- **Bible integration in livestream**: The widget allowing viewers to read the preacher’s text without leaving the live video player.
- **Bible integration in LMS**: Tools to seamlessly embed readable scripture passages directly into course lessons.
- **Bible integration in services**: Links that connect the official service records with the specific scriptures taught that day.

## Adaptations
- Can allow users to follow scriptures without leaving the platform
- Can support new believer reading plans
- Can connect scripture references to sermons, services, lessons, and blogs
- Can support language-specific Bible translations where available
- Can help create a deeper devotional experience inside the app

## Relationships & Integrations
### Integrates With
- **Livestream Module**: Users can read scriptures during streams.
- **Church Services Module**: Services can have attached scripture references.
- **LMS & Discipleship Training Module**: Lessons can include Bible references and reading plans.
- **Dynamic Blog & Publishing Engine Module**: Articles can include scripture blocks.
- **Worship Experience Module**: Worship lyrics or devotional worship sessions may include scripture.
- **Salvation & New Believer Journey Module**: New believers can receive scripture reading plans.

### Connections / Third-Party Services
- YouVersion API
- Bible Gateway / Bible API providers
- Digital Bible Platform
- Faithlife / Logos
- OpenAI / AI providers
- Translation licensing providers

## APIs Needed
- Bible Search API
- Translation API
- Scripture Reference API
- Reading Plan API
- Bookmark API
- Scripture Notes API

## System Flow
1. Church admin opens the Bible & Scripture Engagement Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Bible & Scripture Engagement Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
bible_scripture_engagement_module
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

bible_scripture_engagement_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

bible_scripture_engagement_module_settings
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
GET    /api/bible-scripture-engagement - List all tenant records (paginated, filtered)
POST   /api/bible-scripture-engagement - Create a record under X-Tenant-ID
GET    /api/bible-scripture-engagement/:id - Fetch single tenant-isolated record
PATCH  /api/bible-scripture-engagement/:id - Modify record details securely
DELETE /api/bible-scripture-engagement/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Bible & Scripture Engagement Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Bible & Scripture Engagement Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- bible-scripture-engagement.read
- bible-scripture-engagement.create
- bible-scripture-engagement.update
- bible-scripture-engagement.delete
- bible-scripture-engagement.manage_settings
- bible-scripture-engagement.view_reports

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
