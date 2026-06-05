# Analytics & Reporting Module

## Description
Gives churches insight into website visits, media views, giving, partnerships, event registrations, livestream attendance, funnel conversions, and member activity.

## Plain-English Overview
The Analytics & Reporting Module gives churches insight into how people are engaging with their digital platform. It should track website visits, media views, livestream attendance, service replays, event registrations, giving activity, partnership activity, outreach link clicks, funnel conversions, course progress, member engagement, and communication performance. This module helps church leadership understand what is working, what needs attention, and where members or visitors are most active.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Website traffic reports**: Visual charts showing how many unique visitors are coming to the church website daily.
- **Page views**: Detailed breakdowns revealing which specific pages (like ministries or about) are the most popular.
- **Livestream analytics**: Real-time graphs showing peak concurrent viewers and average watch times during services.
- **Media views**: Play count tracking for sermons, podcasts, and digital library resources.
- **Service replay views**: Tracks engagement data for recorded services watched after the live event has ended.
- **Giving reports**: Aggregated financial charts showing overall donation trends without exposing individual donor details.
- **Partnership reports**: Analytics focusing specifically on the growth and retention of recurring ministry partners.
- **Campaign performance**: Tools to measure the financial success and supporter engagement of specific fundraising drives.
- **Event registrations**: Metrics tracking ticket sales, RSVP rates, and actual attendance conversions for events.
- **Attendance reports**: Visual trends of weekly service and small group check-ins over time.
- **LMS progress reports**: Overviews showing course completion rates and average quiz scores across the academy.
- **Salvation response reports**: Metrics tracking the volume of new believers recorded during specific services or events.
- **Outreach link tracking**: Measures exactly how many clicks and visitors came from members sharing their custom invite links.
- **Funnel conversion tracking**: Identifies where people drop off in landing pages, maximizing sign-up success.
- **Communication delivery reports**: Logs showing open rates, click rates, and bounce rates for email and SMS campaigns.
- **Export reports**: The ability to download all analytical data as CSV or PDF files for offline analysis and board meetings.

## Adaptations
- Can provide church leadership dashboards
- Can show branch-level analytics
- Can show module-specific reports
- Can track online and offline engagement
- Can support weekly, monthly, yearly reports
- Can help churches understand what content or campaigns are producing results

## Relationships & Integrations
### Integrates With
- **Core Website & CMS Module**: Tracks website visits, unique users, and page sessions.
- **Media Module**: Tracks sermon plays, video view duration, and downloads.
- **Livestream Module**: Tracks live viewer counts, watch duration, and interaction rates.
- **Tithes & Offerings Module**: Tracks giving volumes, payment methods, and historical graphs.
- **Partnerships & Contributions Module**: Tracks partnership signup conversions and regular support.
- **Campaigns & Causes Module**: Tracks specific cause contributions and progress targets.
- **Events & Registration Module**: Tracks attendee registration forms and tickets sold.
- **LMS & Discipleship Training Module**: Tracks student retention, course starts, and graduations.
- **Salvation & New Believer Journey Module**: Tracks salvation conversion counts and discipleship outcomes.
- **Member Outreach & Invite Campaign Module**: Tracks invite link clicks, visits, and visitor signups.
- **Worship Experience Module**: Tracks songs played, playlist usage, and lyric clip shares.
- **Live Meetings Module**: Tracks meeting durations and attendee counts.

### Connections / Third-Party Services
- PostHog
- Google Analytics 4
- Plausible Analytics
- Mixpanel
- Amplitude
- Metabase
- Looker Studio

## APIs Needed
- Analytics Event API
- Reporting API
- Dashboard Metrics API
- Conversion Tracking API
- Export Reports API

## System Flow
1. Church admin opens the Analytics & Reporting Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Analytics & Reporting Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
analytics_reporting_module
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

analytics_reporting_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

analytics_reporting_module_settings
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
GET    /api/analytics-reporting - List all tenant records (paginated, filtered)
POST   /api/analytics-reporting - Create a record under X-Tenant-ID
GET    /api/analytics-reporting/:id - Fetch single tenant-isolated record
PATCH  /api/analytics-reporting/:id - Modify record details securely
DELETE /api/analytics-reporting/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Analytics & Reporting Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Analytics & Reporting Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- analytics-reporting.read
- analytics-reporting.create
- analytics-reporting.update
- analytics-reporting.delete
- analytics-reporting.manage_settings
- analytics-reporting.view_reports

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
