# Core Website & CMS Module

## Description
The main website builder and content control center. It lets a church create pages, update information, manage navigation, publish content, and keep its public website active without needing a technical person.

## Plain-English Overview
The Core Website & CMS Module is the foundation of every church’s online presence. It allows each church to create, manage, and update its own website without depending on a developer for every change. The module should support pages such as Home, About, Ministries, Contact, Service Times, Leadership, Locations, and custom landing pages. It should include page creation, content editing, navigation menu management, SEO settings, draft and publish workflows, reusable content blocks, and mobile-responsive layouts. This module is the central place where the church controls what the public sees on its website.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Website page builder**: A drag-and-drop interface allowing church admins to easily construct and customize web pages without writing code.
- **Homepage management**: Tools to organize the layout, banners, and featured content displayed specifically on the main landing page.
- **About page**: A dedicated template to showcase the church’s history, mission, vision, and core values.
- **Contact page**: Integrated forms and map components helping visitors reach out and find the physical location.
- **Ministries page**: Pre-built structures to highlight various church departments like youth, women, and men’s ministries.
- **Leadership/team page**: A directory template designed to present church pastors, staff, and leadership profiles.
- **Service times page**: A dynamic schedule displaying weekly service times and gathering information.
- **Location page**: Maps and directions helping members and newcomers navigate to branch campuses.
- **Custom page creation**: The ability to generate an unlimited number of blank pages tailored to unique church needs.
- **Navigation menu builder**: A visual tool to organize the header links and create dropdown menus for the site.
- **Footer builder**: A visual editor to manage copyright text, secondary links, and social media icons at the bottom of the site.
- **SEO settings**: Options to configure meta titles, descriptions, and keywords to improve visibility on search engines.
- **Draft and publish workflow**: Controls allowing content creators to save their work privately before making it live to the public.
- **Page revisions**: A version history system allowing admins to roll back to previously saved versions of a page.
- **Reusable content blocks**: Saveable sections like call-to-action banners that can be instantly dropped into multiple pages.
- **Mobile responsive pages**: Automatic layout adjustments ensuring the website looks perfect on smartphones and tablets.
- **Image/video embeds**: Native support for inserting media files and YouTube/Vimeo links directly into page content.
- **Forms integration**: A system to build and embed contact forms, prayer requests, and feedback forms directly on pages.
- **Landing page support**: Specialized distraction-free layouts designed specifically for marketing campaigns and sign-ups.

## Adaptations
- Can serve small churches with simple websites
- Can serve large churches with many pages and departments
- Can connect to themes, blogs, funnels, media, services, events, and giving pages
- Can display only the modules a church has enabled
- Can support public pages, member-only pages, and password-protected pages

## Relationships & Integrations
### Integrates With
- **Theme Engine Module**: The CMS provides the content, while the Theme Engine controls how that content is displayed visually.
- **Media Module**: Pages can display sermon videos, images, short clips, galleries, and downloadable resources.
- **Dynamic Blog & Publishing Engine Module**: CMS pages can link to blogs, articles, devotionals, announcements, and content channels.
- **Events & Registration Module**: Church pages can show upcoming events, registrations, and event landing pages.
- **Tithes & Offerings Module**: The website can include giving buttons, giving pages, and quick giving sections.
- **Partnerships & Contributions Module**: Pages can promote ministry partnership opportunities.
- **Campaigns & Causes Module**: Campaign pages can be embedded or linked from the website.
- **Ministry Funnels & Landing Pages Module**: CMS pages can link into funnels or be used as funnel destinations.

### Connections / Third-Party Services
- Cloudinary
- Google Maps Platform
- Algolia / Meilisearch
- Zapier / Make

## APIs Needed
- Page API
- Navigation API
- SEO API
- Content Block API
- Public Website Rendering API

## System Flow
1. Church admin opens the Core Website & CMS Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Core Website & CMS Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
core_website_cms_module
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

core_website_cms_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

core_website_cms_module_settings
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
GET    /api/core-website-cms - List all tenant records (paginated, filtered)
POST   /api/core-website-cms - Create a record under X-Tenant-ID
GET    /api/core-website-cms/:id - Fetch single tenant-isolated record
PATCH  /api/core-website-cms/:id - Modify record details securely
DELETE /api/core-website-cms/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Core Website & CMS Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Core Website & CMS Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- core-website-cms.read
- core-website-cms.create
- core-website-cms.update
- core-website-cms.delete
- core-website-cms.manage_settings
- core-website-cms.view_reports

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
