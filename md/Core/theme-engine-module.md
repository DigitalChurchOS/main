# Theme Engine Module

## Description
Controls the look and feel of church websites. Churches can install themes, customize colors, layouts, typography, sections, and branding, similar to Shopify themes or WordPress templates.

## Plain-English Overview
The Theme Engine Module controls the visual design and presentation of each church website. Churches should be able to install themes, preview them, customize colors, fonts, logos, page layouts, section styles, and branding elements. The system should allow a church to change the appearance of its website without losing its content. This module should also support future theme marketplaces where internal or third-party developers can build and submit themes that churches can install, purchase, or customize.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Installable themes**: Helps users install free themes or templates from the marketplace to give their church website a unique look and feel.
- **Theme preview**: A safe staging environment to visualize how a new theme will look with existing content before activating it.
- **Theme customization**: Global controls to tweak the layout, spacing, and structural design elements of the active theme.
- **Color settings**: Centralized palettes to define the primary, secondary, and accent colors matching the church’s branding.
- **Font settings**: Typography controls for selecting headings and paragraph fonts from Google Fonts or custom uploads.
- **Logo placement**: Dedicated areas to upload and perfectly position the church’s primary and secondary logos.
- **Header/footer layouts**: Multiple pre-designed options for how the top navigation and bottom footer areas are structured.
- **Page templates**: A library of pre-designed page structures that can be quickly loaded and populated with content.
- **Section templates**: Pre-built layout blocks like hero banners or feature grids that can be mixed and matched.
- **Theme versioning**: Automatic updates ensuring the active theme stays compatible with the latest platform features.
- **Theme switching**: The ability to instantly swap out the entire website design while preserving all underlying content.
- **Theme marketplace support**: Direct integration with a storefront to browse and acquire third-party developer themes.
- **Mobile layout control**: Specific styling adjustments targeting how elements stack and display on smaller screens.
- **Custom CSS option for advanced users**: A code editor enabling technical admins to write custom styling rules for precise design control.

## Adaptations
- Can support free and premium themes
- Can support developer-created themes
- Can allow churches to change design without losing content
- Can provide ministry-specific themes such as modern church, youth ministry, conference, media ministry, or traditional church
- Can integrate with plugin sections and marketplace widgets

## Relationships & Integrations
### Integrates With
- **Core Website & CMS Module**: Themes render CMS content into public pages.
- **Dynamic Blog & Publishing Engine Module**: Themes control article pages, blog layouts, category pages, and author pages.
- **Media Module**: Themes control how videos, audio, playlists, and galleries are displayed.
- **Church Services Module**: Themes control how service archives and individual service pages appear.
- **Tithes & Offerings Module**: Themes control how giving forms, partnership pages, and campaign pages look.
- **Partnerships & Contributions Module**: Themes control how giving forms, partnership pages, and campaign pages look.
- **Campaigns & Causes Module**: Themes control how giving forms, partnership pages, and campaign pages look.
- **Plugin & Extensions Engine Module**: Plugins may provide new theme sections, blocks, layouts, or widgets.

### Connections / Third-Party Services
- Cloudinary
- Unsplash API / Pexels API
- Figma Embed / Figma API
- Zapier

## APIs Needed
- Theme Installation API
- Theme Settings API
- Theme Preview API
- Section Registry API
- Theme Version API

## System Flow
1. Church admin opens the Theme Engine Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Theme Engine Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
theme_engine_module
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

theme_engine_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

theme_engine_module_settings
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
GET    /api/theme-engine - List all tenant records (paginated, filtered)
POST   /api/theme-engine - Create a record under X-Tenant-ID
GET    /api/theme-engine/:id - Fetch single tenant-isolated record
PATCH  /api/theme-engine/:id - Modify record details securely
DELETE /api/theme-engine/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Theme Engine Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Theme Engine Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- theme-engine.read
- theme-engine.create
- theme-engine.update
- theme-engine.delete
- theme-engine.manage_settings
- theme-engine.view_reports

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
