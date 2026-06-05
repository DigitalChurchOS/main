# Digital Church OS Documentation

# Core Platform & Foundation

# Content Management Module

## Description
The main website builder and content control center. It lets a church create pages, update information, manage navigation, publish content, and keep its public website active without needing a technical person.

## Plain-English Overview
The Content Management Module is the foundation of every church’s online presence. It allows each church to create, manage, and update its own website without depending on a developer for every change. The module should support pages such as Home, About, Ministries, Contact, Service Times, Leadership, Locations, and custom landing pages. It should include page creation, content editing, navigation menu management, SEO settings, draft and publish workflows, reusable content blocks, and mobile-responsive layouts. This module is the central place where the church controls what the public sees on its website.

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
1. Church admin opens the Content Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Content Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
content_management_module
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

content_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

content_management_module_settings
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
GET    /api/content-management - List all tenant records (paginated, filtered)
POST   /api/content-management - Create a record under X-Tenant-ID
GET    /api/content-management/:id - Fetch single tenant-isolated record
PATCH  /api/content-management/:id - Modify record details securely
DELETE /api/content-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Content Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Content Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- content-management.read
- content-management.create
- content-management.update
- content-management.delete
- content-management.manage_settings
- content-management.view_reports

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


---

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
- **Content Management Module**: Themes render CMS content into public pages.
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


---

# User & Role Management Module

## Description
Manages who can access the platform and what they are allowed to do. This includes admins, pastors, editors, finance managers, care agents, media teams, and ordinary members.

## Plain-English Overview
The User & Role Management Module controls access to the platform. It allows churches to create users, invite staff members, assign permissions, and determine what each person can see or manage. For example, a pastor may access sermons and member care records, a finance officer may access giving reports, a media manager may manage videos and images, and an event coordinator may manage registrations. This module is essential for security, accountability, and organized church administration.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **User registration**: Secure sign-up portals allowing staff and members to create personal accounts on the platform.
- **Admin invitations**: Tools to send secure email links inviting new staff members to access the backend system.
- **Role-based access control**: A security framework that restricts users to specific modules based on their assigned job role.
- **Permission groups**: Customizable bundles of access rights that can be assigned to multiple users at once.
- **Church owner role**: The highest administrative tier with unrestricted access to billing, domains, and core settings.
- **Pastor role**: Elevated access tailored for pastoral oversight, member data, and reporting, without system billing controls.
- **Finance role**: Specialized access strictly limited to giving, accounting, and financial reporting modules.
- **Media manager role**: Focused access to upload, edit, and manage media files, livestreams, and website content.
- **Event manager role**: Targeted access to create events, manage registrations, and scan tickets.
- **Care agent role**: Access limited to CRM interactions, prayer requests, and following up with members in need.
- **LMS instructor role**: Permission to create courses, grade quizzes, and manage students in the discipleship academy.
- **Volunteer coordinator role**: Access to manage teams, schedules, and volunteer check-ins.
- **Member role**: The default access level allowing users to update their profile, view giving history, and access public features.
- **Guest/visitor access**: Limited, temporary access configurations for non-members interacting with public-facing pages.
- **Password reset**: Automated workflows enabling users to securely recover their accounts without admin intervention.
- **Social login**: Options allowing users to authenticate quickly using their Google, Apple, or Facebook accounts.
- **Two-factor authentication**: An extra layer of security requiring a secondary code (like SMS) during login.
- **Activity logs**: Detailed audit trails tracking what changes users made and when they made them.

## Adaptations
- Can control access per module
- Can restrict finance features to finance users
- Can allow media teams to manage only media
- Can allow pastors to access care and follow-up tools
- Can support multi-branch role structures
- Can support developer accounts for marketplace users

## Relationships & Integrations
### Integrates With
- **Tithes & Offerings Module**: Finance users access giving and tithes records.
- **Partnerships & Contributions Module**: Finance users access partnership records.
- **Campaigns & Causes Module**: Finance users access campaign contributions.
- **Financial Management & Accounting Module**: Finance users access bookkeeping and reports.
- **Media Module**: Media users manage videos, audio, and resource assets.
- **Livestream Module**: Media users manage live streaming setups and chats.
- **Worship Experience Module**: Media and worship leaders manage lyric slides and songs.
- **Church Services Module**: Media and pastors archive service recordings and scripts.
- **Salvation & New Believer Journey Module**: Pastoral care agents assign and follow up new believers.
- **Ministry CRM Module**: Pastoral care and staff manage member touchpoints and history.
- **Live Chat, Pastoral Care & Support Module**: Care agents participate in chat and prayer rooms.
- **Communication, Notification & Follow-Up Module**: Pastors and editors schedule notifications and email lists.
- **Member Management Module**: Pastors and staff view database directories and households.
- **LMS & Discipleship Training Module**: Teachers build courses and review student records.
- **Bible & Scripture Engagement Module**: Teachers link Bible studies and scriptures.
- **Plugin & Extensions Engine Module**: Developers access plugin development tools.
- **Marketplace Module**: Developers access marketplace listings.

### Connections / Third-Party Services
- Clerk
- Auth0
- Firebase Auth
- Supabase Auth
- Google OAuth
- Microsoft OAuth
- Apple Sign-In

## APIs Needed
- Auth API
- Role API
- Permission API
- Session API
- Invite User API
- Access Control Middleware

## System Flow
1. Church admin opens the User & Role Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates User & Role Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
user_role_management_module
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

user_role_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

user_role_management_module_settings
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
GET    /api/user-role-management - List all tenant records (paginated, filtered)
POST   /api/user-role-management - Create a record under X-Tenant-ID
GET    /api/user-role-management/:id - Fetch single tenant-isolated record
PATCH  /api/user-role-management/:id - Modify record details securely
DELETE /api/user-role-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for User & Role Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with User & Role Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- user-role-management.read
- user-role-management.create
- user-role-management.update
- user-role-management.delete
- user-role-management.manage_settings
- user-role-management.view_reports

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


---

# Domain & Tenant Management Module

## Description
Handles each church as its own workspace with its own subdomain or custom domain, keeping church data, branding, modules, and settings separated from other churches.

## Plain-English Overview
The Domain & Tenant Management Module handles the multi-tenant structure of the platform. Each church operates as its own independent workspace with separate branding, content, users, media, settings, and modules. Churches should receive a default subdomain such as `churchname.platform.com`, while also having the option to connect their own custom domain such as `www.churchname.org`. This module manages tenant provisioning, domain connection instructions, SSL, DNS verification, and tenant isolation.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Church tenant creation**: The automated provisioning process that generates a fresh, isolated workspace for a new church.
- **Default subdomain**: A free, instantly available web address (e.g., yourchurch.churchos.com) assigned upon signup.
- **Custom domain connection**: Tools to link the church’s own purchased domain name (e.g., yourchurch.org) to their workspace.
- **DNS instructions**: Step-by-step guides showing admins how to configure their domain registrar records correctly.
- **SSL support**: Automatic provisioning of security certificates ensuring the church website is encrypted and safe.
- **Tenant settings**: Global configuration options for the church’s localization, timezones, and primary contact details.
- **Tenant branding**: Core identity settings like the organization name and global logos used across the system.
- **Tenant module registry**: The master list tracking exactly which software modules the specific church has activated.
- **Tenant isolation**: Deep architectural security ensuring one church’s data can never bleed into another church’s workspace.
- **Tenant status management**: Controls for suspending, archiving, or deleting a church workspace based on billing status.
- **Tenant onboarding workflow**: A guided setup wizard helping new churches configure their system for the first time.

## Adaptations
- Can support churchname.platform.com
- Can support custom domains like churchname.org
- Can support multi-branch tenants
- Can support parent-child ministry structures
- Can determine which church loads based on domain
- Can isolate all users, content, media, and billing per church

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Each church website must be loaded based on the tenant domain or subdomain.
- **Theme Engine Module**: Each tenant has its own active theme.
- **Billing & Subscription Management Module**: Tenant plan determines what modules are enabled.
- **Media Module**: Each tenant can connect its own BYOP storage (AWS S3, Vimeo, Cloudinary, etc.).
- **Mobile App Access Module**: Each church app must know which tenant it belongs to.

### Connections / Third-Party Services
- Vercel Domains API
- Cloudflare DNS / Cloudflare API
- Namecheap / GoDaddy
- Let’s Encrypt

## APIs Needed
- Tenant API
- Domain Verification API
- Custom Domain API
- Tenant Settings API
- Tenant Module Registry API

## System Flow
1. Church admin opens the Domain & Tenant Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Domain & Tenant Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
domain_tenant_management_module
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

domain_tenant_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

domain_tenant_management_module_settings
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
GET    /api/domain-tenant-management - List all tenant records (paginated, filtered)
POST   /api/domain-tenant-management - Create a record under X-Tenant-ID
GET    /api/domain-tenant-management/:id - Fetch single tenant-isolated record
PATCH  /api/domain-tenant-management/:id - Modify record details securely
DELETE /api/domain-tenant-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Domain & Tenant Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Domain & Tenant Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- domain-tenant-management.read
- domain-tenant-management.create
- domain-tenant-management.update
- domain-tenant-management.delete
- domain-tenant-management.manage_settings
- domain-tenant-management.view_reports

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


---

# Billing & Subscription Management Module

## Description
Controls platform pricing, subscription plans, add-on modules, usage billing, invoices, coupons, and paid feature access for each church tenant.

## Plain-English Overview
The Billing & Subscription Management Module controls how churches pay for the platform and its optional features. Since the platform is modular, churches should be able to subscribe to a base plan and then add extra modules such as Media, Worship, LMS, Commerce, or Live Meetings as needed. This module should support subscriptions, add-ons, usage billing, invoices, plan upgrades, plan downgrades, coupons, trial periods, and module-based billing rules.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Subscription plans**: Allows churches to choose between different feature tiers like basic, pro, or enterprise plans.
- **Free trial**: Provides a set timeframe for new users to test the platform before a credit card is charged.
- **Add-on modules**: The ability to purchase specialized extra tools that aren’t included in the core subscription plan.
- **Usage billing**: A flexible pricing model that scales costs dynamically based on the volume of active members or traffic.
- **Storage billing**: Tracks the total gigabytes of media hosted and bills the church automatically for overages.
- **SMS/email usage billing**: Meters outbound communication volumes to ensure churches only pay for what they send.
- **Video bandwidth billing**: Calculates streaming and playback data to accurately bill for heavy media usage.
- **AI usage billing**: Monitors the execution of AI generation tasks and applies token-based pricing to the monthly invoice.
- **Meeting participant-hour billing**: Bills for live video meetings based on the duration and number of active attendees.
- **Invoices**: Automatically generated, downloadable PDF receipts for every monthly or annual transaction.
- **Coupons**: Discount codes that can be applied during checkout to reduce the cost of subscriptions or add-ons.
- **Payment status**: A real-time dashboard displaying whether the church’s account is active, past due, or suspended.
- **Plan upgrade/downgrade**: Self-service tools allowing the church admin to switch between subscription tiers instantly.
- **Module entitlement checks**: Security gates that ensure users cannot access premium features their church hasn’t paid for.
- **Billing reports**: Comprehensive financial summaries showing exactly where the church is spending money on the platform.

## Adaptations
- Can support base plans plus optional modules
- Can charge extra for managed media hosting
- Can charge lower fees for bring-your-own-provider setup
- Can support marketplace plugin/theme payments
- Can restrict module access based on subscription
- Can support enterprise church contracts

## Relationships & Integrations
### Integrates With
- **Media Module**: Controls access to premium video and audio storage add-ons.
- **Worship Experience Module**: Controls access to the Worship standalone application.
- **LMS & Discipleship Training Module**: Controls access to discipleship LMS school builder.
- **Live Meetings Module**: Controls access to Live prayer and fellowship meeting rooms.
- **E-Commerce / Church Store Module**: Controls access to product listing and digital stores.
- **Communication, Notification & Follow-Up Module**: Tracks usage fees for outbound SMS, email, and WhatsApp.
- **Dedicated White-Label Church App Module**: Controls access and billing for custom branded mobile apps.
- **Marketplace Module**: Premium marketplace assets are billed through this module.

### Connections / Third-Party Services
- Stripe Billing
- PayPal Subscriptions
- Flutterwave
- Paystack
- Paddle
- RevenueCat

## APIs Needed
- Subscription API
- Module Entitlement API
- Usage Metering API
- Invoice API
- Add-On Billing API
- Plan Upgrade/Downgrade API

## System Flow
1. Church admin opens the Billing & Subscription Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Billing & Subscription Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
billing_subscription_management_module
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

billing_subscription_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

billing_subscription_management_module_settings
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
GET    /api/billing-subscription-management - List all tenant records (paginated, filtered)
POST   /api/billing-subscription-management - Create a record under X-Tenant-ID
GET    /api/billing-subscription-management/:id - Fetch single tenant-isolated record
PATCH  /api/billing-subscription-management/:id - Modify record details securely
DELETE /api/billing-subscription-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Billing & Subscription Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Billing & Subscription Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- billing-subscription-management.read
- billing-subscription-management.create
- billing-subscription-management.update
- billing-subscription-management.delete
- billing-subscription-management.manage_settings
- billing-subscription-management.view_reports

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


---

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
- **Content Management Module**: Tracks website visits, unique users, and page sessions.
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


---

# Plugin & Extensions Engine Module

## Description
Allows the platform to support installable plugins and extensions so new functionality can be added without rebuilding the whole platform.

## Plain-English Overview
The Plugin & Extensions Engine Module allows the platform to be expanded through installable features. Instead of building everything directly into the core system, this module provides a structure where additional functionality can be installed, enabled, disabled, configured, and billed per church. Plugins should have permissions, settings, APIs, versioning, and tenant-level controls. This creates the foundation for a future app ecosystem similar to WordPress plugins or Shopify apps.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Plugin installation**: A safe deployment system that adds new functional code extensions into the church workspace.
- **Plugin removal**: Cleanly uninstalls third-party extensions and safely drops their associated database tables.
- **Plugin activation/deactivation**: Toggle switches to quickly turn a plugin’s functionality on or off without deleting it.
- **Plugin permissions**: Granular security controls dictating exactly what system data a third-party plugin is allowed to access.
- **Plugin settings**: Dedicated configuration screens injected into the admin panel by the installed plugin.
- **Plugin API access**: Secure architectural bridges allowing plugins to pull or push data to the core platform.
- **Plugin versioning**: Compatibility checks ensuring the installed plugin version works seamlessly with the current OS version.
- **Plugin update management**: One-click tools to fetch and install the latest bug fixes and features from plugin developers.
- **Plugin webhooks**: Event listeners that notify the plugin when core actions happen, like a new member registering.
- **Plugin billing support**: Infrastructure allowing developers to charge churches subscription fees for using their plugins.
- **Plugin marketplace integration**: Direct links to the ecosystem storefront to discover and acquire new extensions.

## Adaptations
- Can support free plugins
- Can support premium plugins
- Can allow third-party developers to extend the platform
- Can allow plugins to add admin pages, public widgets, workflows, or integrations
- Can enforce security permissions before plugins access church data

## Relationships & Integrations
### Integrates With
- **Theme Engine Module**: Plugins can add new sections, widgets, and blocks.
- **Marketplace Module**: Marketplace distributes approved plugins.
- **Billing & Subscription Management Module**: Premium plugins require billing and revenue sharing.
- **User & Role Management Module**: Plugins require permission scopes.

### Connections / Third-Party Services
- Stripe Connect
- GitHub
- Sentry
- Zapier Platform

## APIs Needed
- Plugin Install API
- Plugin Uninstall API
- Plugin Settings API
- Plugin Permission API
- Plugin Webhook API
- Plugin Registry API

## System Flow
1. Church admin opens the Plugin & Extensions Engine Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Plugin & Extensions Engine Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
plugin_extensions_engine_module
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

plugin_extensions_engine_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

plugin_extensions_engine_module_settings
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
GET    /api/plugin-extensions-engine - List all tenant records (paginated, filtered)
POST   /api/plugin-extensions-engine - Create a record under X-Tenant-ID
GET    /api/plugin-extensions-engine/:id - Fetch single tenant-isolated record
PATCH  /api/plugin-extensions-engine/:id - Modify record details securely
DELETE /api/plugin-extensions-engine/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Plugin & Extensions Engine Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Plugin & Extensions Engine Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- plugin-extensions-engine.read
- plugin-extensions-engine.create
- plugin-extensions-engine.update
- plugin-extensions-engine.delete
- plugin-extensions-engine.manage_settings
- plugin-extensions-engine.view_reports

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


---

# Marketplace Module

## Description
Creates a controlled marketplace where approved developers can submit themes, plugins, integrations, and tools for churches to install.

## Plain-English Overview
The Marketplace Module allows approved developers to build themes, plugins, integrations, and extensions for the platform. Developers should have access to documentation, sandbox environments, submission tools, review workflows, and revenue-sharing options. This module turns the platform into an ecosystem where outside developers can contribute useful tools while churches gain access to more specialized features.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Developer accounts**: Specialized portals allowing third-party software engineers to build and submit tools for the platform.
- **Developer dashboard**: A central hub for developers to track the active installs, revenue, and reviews of their products.
- **Theme submissions**: The pipeline for designers to upload custom website templates for marketplace approval.
- **Plugin submissions**: The pipeline for engineers to upload custom functional code extensions for review.
- **Review workflow**: An internal quality-assurance process ensuring all third-party submissions meet security standards.
- **Sandbox tenants**: Free, temporary church workspaces granted to developers to safely build and test their integrations.
- **API documentation**: Comprehensive, developer-facing guides explaining how to interact with the platform’s endpoints.
- **SDK access**: Pre-written software libraries to help developers integrate their tools faster and more securely.
- **Marketplace listings**: Public product pages showcasing screenshots, features, and pricing of approved themes and plugins.
- **Ratings/reviews**: A community feedback system allowing churches to rate the quality of the plugins they’ve installed.
- **Developer payouts**: Automated financial systems that distribute earnings to developers based on their monthly sales.
- **Revenue sharing**: The configurable split where the platform retains a percentage of third-party marketplace sales.
- **Version approval**: A streamlined review process for pushing updates to existing, already-approved plugins.

## Adaptations
- Can create a developer ecosystem
- Can allow approved developers to sell tools to churches
- Can support internal and external developers
- Can help the platform grow beyond what the core team builds
- Can support free and paid marketplace assets

## Relationships & Integrations
### Integrates With
- **Plugin & Extensions Engine Module**: Developers submit plugins.
- **Theme Engine Module**: Developers submit themes.
- **Billing & Subscription Management Module**: Premium assets require payment and revenue sharing.
- **User & Role Management Module**: Developer accounts need separate permissions.
- **Domain & Tenant Management Module**: Developers need sandbox tenants for testing.

### Connections / Third-Party Services
- GitHub
- Stripe Connect
- PayPal Payouts
- Sentry
- Linear / Jira
- Zapier

## APIs Needed
- Developer Account API
- Submission API
- Review API
- Marketplace Listing API
- Revenue Share API
- Sandbox Tenant API

## System Flow
1. Church admin opens the Marketplace Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Marketplace Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
marketplace_module
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

marketplace_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

marketplace_module_settings
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
GET    /api/marketplace - List all tenant records (paginated, filtered)
POST   /api/marketplace - Create a record under X-Tenant-ID
GET    /api/marketplace/:id - Fetch single tenant-isolated record
PATCH  /api/marketplace/:id - Modify record details securely
DELETE /api/marketplace/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Marketplace Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Marketplace Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- marketplace.read
- marketplace.create
- marketplace.update
- marketplace.delete
- marketplace.manage_settings
- marketplace.view_reports

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


---

# Localization & Multilingual Engine Module

## Description
Core platform service enabling SaaS dashboard translations, locale detection, and theme/plugin localization keys.

## Plain-English Overview
The Localization & Multilingual Engine Module is a core shared platform service built into the foundation of the Digital Church OS. It handles platform-wide localization files (such as en.json, fr.json, es.json), user language preference storage, theme translation keys, plugin translation manifests, and auto-detects browser locale settings. This ensures the entire system is translation-ready and customizable for international churches from day one without hardcoded layout labels.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Language registry**: A core directory of all supported languages, locales, and writing directions (LTR/RTL).
- **Interface language switcher**: A one-click toggle enabling dashboard users to switch the SaaS interface language.
- **Locale detection**: Automatic system detection of the user’s browser language to pre-select their native locale.
- **Theme translation keys**: An engine parsing template translation tags like t("button.give_now") rather than using hardcoded text.
- **Plugin translation support**: Dynamic translation manifest registration for third-party extensions in the marketplace.
- **User language preference**: Core profile data storing the user’s selected language to maintain consistency across sessions.

## Adaptations
- Adapts dynamically based on active tenant subscriptions and configurations.

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Provides translation file parser and site settings integration.
- **Theme Engine Module**: Injects locale-specific rendering tags into theme templates.
- **Plugin & Extensions Engine Module**: Allows extensions to declare and register their custom translation files.
- **User & Role Management Module**: Associates language preferences with member and staff accounts.

### Connections / Third-Party Services
- JSON locale files
- Browser language headers
- Theme template engines
- Database configuration tables

## APIs Needed
- Language Registry API
- Locale Detection API
- Translation Key Loader API
- User Language Preference API

## System Flow
1. Church admin opens the Localization & Multilingual Engine Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Localization & Multilingual Engine Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
localization_multilingual_engine_module
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

localization_multilingual_engine_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

localization_multilingual_engine_module_settings
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
GET    /api/localization-multilingual-engine - List all tenant records (paginated, filtered)
POST   /api/localization-multilingual-engine - Create a record under X-Tenant-ID
GET    /api/localization-multilingual-engine/:id - Fetch single tenant-isolated record
PATCH  /api/localization-multilingual-engine/:id - Modify record details securely
DELETE /api/localization-multilingual-engine/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Localization & Multilingual Engine Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Localization & Multilingual Engine Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- localization-multilingual-engine.read
- localization-multilingual-engine.create
- localization-multilingual-engine.update
- localization-multilingual-engine.delete
- localization-multilingual-engine.manage_settings
- localization-multilingual-engine.view_reports

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


---

# Centralized Settings Engine Module

## Description
Allows dynamic settings management for all active modules, enabling toggles, sliders, select dropdowns, and role-based configuration control.

## Plain-English Overview
The Centralized Settings Engine Module is a core, standalone application controller that serves as the central nervous system for configuring all platform modules. Each module registers its setting fields (defining metadata like labels, tooltips, types, defaults, and bounds) into a Dynamic Settings Schema. The settings engine exposes these controls (including toggles for boolean options, inputs for text values, and sliders/input bounds for numeric ranges) in a unified settings panel. All settings changes are secured with role-based access gates (strictly requiring the tenant.settings permission key) and isolated on a per-tenant database level.

## Section Context
Section A: Core Platform & Foundation

## Core Features (with Tooltips)
- **Central settings dashboard**: A unified administrative control center that displays settings for all active modules.
- **Feature toggle switches**: Clean, accessible toggle buttons to instantly turn specific modular capabilities on or off.
- **SLA and numeric input sliders**: Dynamic slider controls with bounds validations to adjust numeric configuration limits.
- **Dropdown preference selectors**: Form selection elements loaded with schema options to set default system behaviors.
- **Module settings schema registry**: A dynamic registration layer that compiles config schemas from all modules.
- **Multi-tenant isolated settings**: Complete isolation of module settings per tenant_id inside the database.
- **Settings validation middleware**: Validates setting updates on the server against definitions (rejections of wrong types).
- **Global settings resets**: Reverts customized module configurations back to registry default settings.
- **Granular RBAC locks**: Controls settings updates using role-based locks requiring the tenant.settings permission key.

## Adaptations
- Can scale down to serve single-campus setups with basic toggles
- Can support multi-campus branches with localized configuration overrides
- Can dynamically load and render settings configurations for newly installed plugins
- Can validate and secure global system preferences against arbitrary administrative inputs
- Can render customized color variables or font settings dynamically

## Relationships & Integrations
### Integrates With
- **User & Role Management Module**: Checks role permissions before allowing settings updates.
- **Plugin & Extensions Engine Module**: Allows newly installed plugins to register custom config schemas.
- **Live Chat, Pastoral Care & Support Module**: Saves dynamic AI screening toggles and SLA escalation timer settings.
- **Cell / Fellowship Module**: Manages dynamic Cell size limits and maximum hierarchy depths.

### Connections / Third-Party Services
- Prisma schema overrides
- Database configuration tables
- Dynamic validation logic

## APIs Needed
- Dynamic Settings Schema API
- Tenant Module Settings API
- Module Preference API
- Settings Validation API
- Global Settings Reset API

## System Flow
1. Church admin opens the Centralized Settings Engine Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Centralized Settings Engine Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
centralized_settings_engine_module
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

centralized_settings_engine_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

centralized_settings_engine_module_settings
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
GET    /api/centralized-settings-engine - List all tenant records (paginated, filtered)
POST   /api/centralized-settings-engine - Create a record under X-Tenant-ID
GET    /api/centralized-settings-engine/:id - Fetch single tenant-isolated record
PATCH  /api/centralized-settings-engine/:id - Modify record details securely
DELETE /api/centralized-settings-engine/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Centralized Settings Engine Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Centralized Settings Engine Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- centralized-settings-engine.read
- centralized-settings-engine.create
- centralized-settings-engine.update
- centralized-settings-engine.delete
- centralized-settings-engine.manage_settings
- centralized-settings-engine.view_reports

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


---

# Content, Media & Worship

# Media Module

## Description
Stores and organizes sermons, audios, videos, short clips, image galleries, downloadable resources, and other church media assets using platform-managed or church-owned providers.

## Plain-English Overview
The Media Module manages sermons, videos, audio messages, short clips, image galleries, downloadable files, thumbnails, and media collections. Churches should be able to organize content by categories, tags, speakers, series, service dates, and playlists. The module should support both platform-managed storage and bring-your-own-provider options such as Cloudinary, AWS S3, Cloudflare R2, Vimeo, YouTube, or other media platforms. It should serve as the church’s main media archive and content library.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Video uploads**: Allows churches to securely host high-quality video files like sermons or promotional clips directly on the platform.
- **Audio uploads**: Infrastructure to store MP3 files for podcasts, sermon audio, or worship tracks.
- **Image galleries**: Tools to upload event photos and organize them into beautiful grids for website display.
- **Short clips**: Dedicated storage and organization for 60-second vertical videos designed for social media.
- **Sermon archive**: A structured, searchable database storing years of past church messages.
- **Media categories**: Folders allowing admins to group related content, like grouping all "Youth Camp" media together.
- **Media tags**: Labels attached to files (like "faith" or "grace") making it easy for users to search for specific topics.
- **Speaker/pastor tagging**: Associates a specific media file with the profile of the person who delivered the message.
- **Series management**: Groups multiple sermons together under a single artwork cover, preserving the chronological order.
- **Playlists**: Custom, sharable collections of media files that auto-play sequentially.
- **Thumbnails**: Custom cover images uploaded to make video or audio files look attractive before they are clicked.
- **Downloadable resources**: Allows admins to attach PDFs or presentation files directly to a sermon for viewers to download.
- **Media search**: A powerful search bar allowing users to find specific media by title, speaker, or date.
- **Media filtering**: Advanced tools letting users narrow down media by category, series, or tags.
- **Media embeds**: Generates code snippets allowing church videos to be placed on external websites.
- **Provider selection**: The choice between using ChurchOS built-in hosting or linking external YouTube/Vimeo URLs.
- **Platform-managed hosting**: A premium storage tier where ChurchOS directly handles the hosting and streaming of files.
- **Bring-your-own-provider hosting**: Allows churches to save money by pasting links from their own external media hosts.
- **Hybrid hosting**: Mixing and matching external YouTube links with internal direct-uploads in the same gallery.

## Adaptations
- Can use platform AWS, Cloudinary, R2, Vimeo, Mux, or other providers
- Can allow churches to connect their own Cloudinary, Vimeo, YouTube, AWS, or storage accounts
- Can store only metadata when church-owned providers are used
- Can connect media to services, LMS, blogs, podcasts, digital library, and AI tools
- Can support different pricing based on storage and bandwidth usage

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Media can be embedded into pages.
- **Livestream Module**: Livestream replays can be saved into the media library.
- **Church Services Module**: Each service can have attached video replay, audio, clips, notes, and thumbnails.
- **LMS & Discipleship Training Module**: Lessons can use videos, audio, PDFs, and downloads from the Media Module.
- **Digital Library & Resource Center Module**: Some media assets can also be published as resources.
- **AI Media & Content Module**: AI can transcribe, summarize, subtitle, translate, or clip media.
- **Worship Experience Module**: Worship audio and background assets can use media storage infrastructure.

### Connections / Third-Party Services
- Cloudinary
- AWS S3
- Cloudflare R2
- Bunny Storage
- Vimeo
- Mux
- YouTube
- Wasabi
- Backblaze B2

## APIs Needed
- Media Upload API
- Media Library API
- Provider Integration API
- Media Metadata API
- Playback API
- Thumbnail API
- Storage Routing API

## System Flow
1. Church admin opens the Media Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Media Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
media_module
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

media_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

media_module_settings
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
GET    /api/media - List all tenant records (paginated, filtered)
POST   /api/media - Create a record under X-Tenant-ID
GET    /api/media/:id - Fetch single tenant-isolated record
PATCH  /api/media/:id - Modify record details securely
DELETE /api/media/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Media Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Media Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- media.read
- media.create
- media.update
- media.delete
- media.manage_settings
- media.view_reports

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


---

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


---

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


---

# Dynamic Blog & Publishing Engine Module

## Description
A publishing system where churches can create multiple independent blogs such as devotionals, faith articles, health, youth updates, testimonies, and announcements, each with its own categories and tags.

## Plain-English Overview
The Dynamic Blog & Publishing Engine Module allows churches to publish written content through multiple independent blogs or content channels. Instead of having only one general blog, churches can create separate blogs such as Faith, Health, Daily Devotionals, Youth Updates, Testimonies, Everyday Life, Pastor’s Desk, or Announcements. Each blog can have its own categories, tags, authors, SEO settings, featured images, layouts, and publishing schedule. This gives churches a flexible WordPress-style and Shopify-style publishing system.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Multiple independent blogs**: The ability to run separate blogs (e.g., Pastor’s Blog, Youth Blog) under the same church.
- **Blog-specific categories**: Organizational folders that only apply to one specific blog, keeping topics clean.
- **Blog-specific tags**: Detailed labels allowing readers to find specific topics within a single blog ecosystem.
- **Article creation**: A dedicated interface for authors to write, format, and publish text-based posts.
- **Rich text editor**: A powerful text box with bolding, italics, bullet points, and hyperlinking capabilities.
- **Featured images**: The main cover photo displayed at the top of the article and on social media previews.
- **Authors**: Author profiles ensuring the correct writer gets credit and has their bio displayed on the post.
- **Drafts**: The ability to save works-in-progress without publishing them to the public website.
- **Scheduled posts**: Tools to write an article today but instruct the system to automatically publish it next Tuesday.
- **SEO metadata**: Custom titles and descriptions used when the article appears on Google or is shared on Facebook.
- **Article revisions**: A backup system allowing authors to undo mistakes and revert to older versions of their text.
- **Related articles**: An automated widget suggesting 3 similar articles at the bottom of the post to keep users reading.
- **Social sharing**: One-click buttons allowing readers to share the article on their personal social media accounts.
- **Comments optional**: A toggle to allow or disable public discussion and feedback at the bottom of an article.
- **Member-only articles optional**: Security gates that require the reader to log in before they can view the content.

## Adaptations
- Can support blogs like Faith, Health, Devotionals, Youth, Testimonies, Announcements, Pastor’s Desk
- Each blog can have separate taxonomy
- Can connect to CMS pages
- Can use AI to help generate summaries, captions, and article drafts
- Can trigger communication notifications when new articles are published

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Blogs can be displayed on public pages.
- **Theme Engine Module**: Themes control blog layout and article design.
- **Media Module**: Articles can embed images, videos, audio, and galleries.
- **Bible & Scripture Engagement Module**: Articles can include scripture references.
- **AI Assistant / Ministry Copilot Module**: AI can help draft articles, summaries, titles, and captions.
- **Communication, Notification & Follow-Up Module**: New articles can trigger email or push notifications.
- **Ministry Funnels & Landing Pages Module**: Blog articles can become funnel entry points.

### Connections / Third-Party Services
- Cloudinary
- Algolia / Meilisearch
- OpenAI / Claude / Gemini
- Grammarly API / LanguageTool
- Mailchimp / Klaviyo

## APIs Needed
- Blog API
- Article API
- Category API
- Tag API
- Author API
- SEO API
- Publishing Schedule API

## System Flow
1. Church admin opens the Dynamic Blog & Publishing Engine Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Dynamic Blog & Publishing Engine Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
dynamic_blog_publishing_engine_module
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

dynamic_blog_publishing_engine_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

dynamic_blog_publishing_engine_module_settings
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
GET    /api/dynamic-blog-publishing-engine - List all tenant records (paginated, filtered)
POST   /api/dynamic-blog-publishing-engine - Create a record under X-Tenant-ID
GET    /api/dynamic-blog-publishing-engine/:id - Fetch single tenant-isolated record
PATCH  /api/dynamic-blog-publishing-engine/:id - Modify record details securely
DELETE /api/dynamic-blog-publishing-engine/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Dynamic Blog & Publishing Engine Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Dynamic Blog & Publishing Engine Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- dynamic-blog-publishing-engine.read
- dynamic-blog-publishing-engine.create
- dynamic-blog-publishing-engine.update
- dynamic-blog-publishing-engine.delete
- dynamic-blog-publishing-engine.manage_settings
- dynamic-blog-publishing-engine.view_reports

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


---

# Digital Library & Resource Center Module

## Description
A central resource hub for PDFs, eBooks, study materials, notes, devotionals, manuals, and other downloadable or readable ministry resources.

## Plain-English Overview
The Digital Library & Resource Center Module provides a central place for churches to organize and share spiritual resources. These may include PDFs, eBooks, manuals, study guides, devotionals, sermon notes, training materials, ministry documents, and downloadable resources. The library can be free, member-only, course-linked, or connected to specific groups. This module helps churches preserve and distribute teaching materials in an organized and searchable way.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **PDF uploads**: Secure storage for distributing written documents, policies, or printable materials.
- **eBook uploads**: Hosting for digital books (ePub or PDF format) written by the church leadership.
- **Devotional resources**: Specific organization for daily reading plans and short devotional guides.
- **Study guides**: Workbooks and discussion questions designed to be downloaded by cell group leaders.
- **Training manuals**: Core materials used by the LMS module to train volunteers and workers.
- **Sermon notes**: Downloadable outlines and transcripts attached to past messages.
- **Download management**: Tracks exactly how many times a specific file has been downloaded by users.
- **Resource categories**: Broad folders grouping similar resources (like "Leadership" or "New Believers").
- **Resource tags**: Specific keywords attached to files making them easily searchable in the library.
- **Search/filter**: Powerful tools helping users find exactly the document they need in a large library.
- **Member-only resources**: Files locked behind a login screen, ensuring only verified church members can download them.
- **Course-linked resources**: Files specifically attached to a training course, unlocked only when the student reaches that lesson.
- **Salvation journey resources**: Foundational materials automatically emailed to new converts.
- **Access permissions**: Granular controls restricting certain files to specific roles (like only Pastors can view).

## Adaptations
- Can provide free resources
- Can restrict resources to members, students, partners, or course participants
- Can act as a lead magnet for funnels
- Can connect to LMS, salvation, blogs, media, and communication follow-ups
- Can support downloadable and view-only resources

## Relationships & Integrations
### Integrates With
- **Media Module**: Uses uploaded PDFs, videos, audio files, and images.
- **LMS & Discipleship Training Module**: Courses can reference library resources.
- **Salvation & New Believer Journey Module**: New believers can receive recommended resources.
- **Member Management Module**: Resources can be member-only.
- **Ministry Funnels & Landing Pages Module**: Free resources can be used as funnel lead magnets.
- **Communication, Notification & Follow-Up Module**: Resource downloads can trigger follow-up messages.

### Connections / Third-Party Services
- Cloudinary
- AWS S3 / Cloudflare R2 / Wasabi
- Google Drive
- Dropbox
- Box
- DocuSign / Adobe Sign
- Algolia / Meilisearch

## APIs Needed
- Resource API
- Download API
- Access Control API
- Resource Category API
- Resource Recommendation API

## System Flow
1. Church admin opens the Digital Library & Resource Center Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Digital Library & Resource Center Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
digital_library_resource_center_module
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

digital_library_resource_center_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

digital_library_resource_center_module_settings
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
GET    /api/digital-library-resource-center - List all tenant records (paginated, filtered)
POST   /api/digital-library-resource-center - Create a record under X-Tenant-ID
GET    /api/digital-library-resource-center/:id - Fetch single tenant-isolated record
PATCH  /api/digital-library-resource-center/:id - Modify record details securely
DELETE /api/digital-library-resource-center/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Digital Library & Resource Center Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Digital Library & Resource Center Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- digital-library-resource-center.read
- digital-library-resource-center.create
- digital-library-resource-center.update
- digital-library-resource-center.delete
- digital-library-resource-center.manage_settings
- digital-library-resource-center.view_reports

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


---

# Podcast & Audio Broadcasting Module

## Description
Allows churches to publish audio content as podcast-style channels and distribute sermons or teachings through RSS and podcast platforms.

## Plain-English Overview
The Podcast & Audio Broadcasting Module allows churches to distribute audio teachings, sermons, devotional messages, interviews, and ministry content in a podcast-style format. It should support audio channels, playlists, series, RSS feeds, episode descriptions, cover images, speaker information, and publishing to external platforms where possible. This module helps churches reach people who prefer listening rather than watching video.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Podcast channels**: The ability to host multiple distinct shows (e.g., Sunday Sermons, Leadership Podcast).
- **Audio episode uploads**: Secure hosting and streaming distribution for the actual MP3 podcast files.
- **Episode descriptions**: Detailed text summaries explaining what the episode covers, including timestamps.
- **Cover images**: Upload tools for the square artwork representing either the whole show or a specific episode.
- **Audio playlists**: Collections of episodes grouped together for continuous, uninterrupted listening.
- **RSS feed generation**: The critical technical link required to submit the podcast to Apple Podcasts and Spotify.
- **Speaker tagging**: Identifying the specific host or guest featured in that particular episode.
- **Series tagging**: Grouping multiple episodes together as a multi-part teaching series.
- **Show notes**: Formatted text including links, resources, and scriptures referenced during the audio.
- **Podcast analytics**: Tracking data showing total downloads, unique listeners, and listener geographic locations.
- **External distribution support**: Seamless integration ensuring episodes published here appear instantly on external apps.

## Adaptations
- Can convert service audio into podcast episodes
- Can connect to media library
- Can create audio-only ministry channels
- Can connect to Apple Podcasts, Spotify, and other platforms where supported
- Can use AI for transcripts and summaries

## Relationships & Integrations
### Integrates With
- **Media Module**: Audio files are stored and managed through Media.
- **Church Services Module**: Service audio can become podcast episodes.
- **Dynamic Blog & Publishing Engine Module**: Podcast episodes can have written show notes.
- **AI Media & Content Module**: AI can generate transcripts and summaries.
- **Communication, Notification & Follow-Up Module**: New episodes can be announced to subscribers.

### Connections / Third-Party Services
- Spotify for Podcasters
- Apple Podcasts
- RSS.com
- Transistor
- Buzzsprout
- Anchor
- Cloudinary / S3 / R2
- OpenAI / Whisper

## APIs Needed
- Podcast Channel API
- Episode API
- RSS Feed API
- Audio Playback API
- Distribution API

## System Flow
1. Church admin opens the Podcast & Audio Broadcasting Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Podcast & Audio Broadcasting Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
podcast_audio_broadcasting_module
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

podcast_audio_broadcasting_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

podcast_audio_broadcasting_module_settings
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
GET    /api/podcast-audio-broadcasting - List all tenant records (paginated, filtered)
POST   /api/podcast-audio-broadcasting - Create a record under X-Tenant-ID
GET    /api/podcast-audio-broadcasting/:id - Fetch single tenant-isolated record
PATCH  /api/podcast-audio-broadcasting/:id - Modify record details securely
DELETE /api/podcast-audio-broadcasting/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Podcast & Audio Broadcasting Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Podcast & Audio Broadcasting Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- podcast-audio-broadcasting.read
- podcast-audio-broadcasting.create
- podcast-audio-broadcasting.update
- podcast-audio-broadcasting.delete
- podcast-audio-broadcasting.manage_settings
- podcast-audio-broadcasting.view_reports

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


---

# AI Media & Content Module

## Description
Uses AI to help with sermon transcription, subtitles, summaries, translations, clip generation, and turning long media into usable content pieces.

## Plain-English Overview
The AI Media & Content Module uses artificial intelligence to help churches repurpose and manage content. It can support sermon transcription, subtitle generation, language translation, sermon summaries, short clip suggestions, quote extraction, social media captions, blog drafts, and content recommendations. This module should reduce the manual work required to turn one sermon or event into multiple useful content pieces for the website, app, social media, and member engagement.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Sermon transcription**: AI automatically converts uploaded sermon audio or video into accurate written text.
- **Auto subtitles**: Generates timed subtitle files (VTT/SRT) making videos accessible to deaf viewers or those on mute.
- **Sermon summaries**: The AI reads the full transcript and writes a concise 3-paragraph summary of the message.
- **Short clip suggestions**: The AI analyzes a 2-hour sermon and identifies the 3 most impactful 60-second moments for social media.
- **Quote extraction**: Automatically pulls out the most powerful, shareable sentences spoken during the message.
- **Social captions**: Generates engaging text, emojis, and hashtags to accompany videos posted on Instagram or Facebook.
- **Blog drafts**: The AI transforms a spoken sermon transcript into a well-structured, readable blog article draft.
- **Devotional drafts**: Extracts key themes from a message and formats them into a 5-day daily devotional guide.
- **Translation assistance**: Uses AI to instantly translate transcripts or blog posts into Spanish, French, or other languages.
- **Content repurposing**: The overall engine designed to turn one Sunday sermon into 20 pieces of weekly digital content.
- **Metadata generation**: AI automatically writes YouTube titles, descriptions, and tags based on the video content.
- **Title suggestions**: The AI brainstorms 5 catchy, engaging title options for a sermon based on its transcript.

## Adaptations
- Can help turn one sermon into many content pieces
- Can support media teams with faster publishing
- Can generate outreach text and captions
- Can summarize livestream replays
- Can generate LMS lesson outlines from teaching content
- Can be billed by usage

## Relationships & Integrations
### Integrates With
- **Media Module**: Transcribes, summarizes, clips, translates, and subtitles videos/audio.
- **Livestream Module**: Can process livestream replays.
- **Church Services Module**: Can create service summaries and sermon notes.
- **Dynamic Blog & Publishing Engine Module**: Can create article drafts from sermons.
- **Communication, Notification & Follow-Up Module**: Can generate announcements and follow-up messages.
- **Member Outreach & Invite Campaign Module**: Can generate captions, invite texts, and short video scripts.
- **Advanced Translation & Multilingual Module**: Can support multilingual content workflows.

### Connections / Third-Party Services
- OpenAI API
- Anthropic Claude API
- Google Gemini API
- Deepgram
- AssemblyAI
- ElevenLabs
- Rev.ai
- Cloudinary AI

## APIs Needed
- AI Transcription API
- AI Summary API
- AI Clip Suggestion API
- AI Translation API
- AI Subtitle API
- AI Content Generation API

## System Flow
1. Church admin opens the AI Media & Content Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates AI Media & Content Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
ai_media_content_module
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

ai_media_content_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

ai_media_content_module_settings
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
GET    /api/ai-media-content - List all tenant records (paginated, filtered)
POST   /api/ai-media-content - Create a record under X-Tenant-ID
GET    /api/ai-media-content/:id - Fetch single tenant-isolated record
PATCH  /api/ai-media-content/:id - Modify record details securely
DELETE /api/ai-media-content/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for AI Media & Content Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with AI Media & Content Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- ai-media-content.read
- ai-media-content.create
- ai-media-content.update
- ai-media-content.delete
- ai-media-content.manage_settings
- ai-media-content.view_reports

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


---

# Digital Signage & TV Display Module

## Description
Allows churches to display announcements, countdowns, schedules, slides, and promotional content on screens inside church buildings or events.

## Plain-English Overview
The Digital Signage & TV Display Module allows churches to display announcements, countdowns, schedules, event promotions, welcome messages, service information, and media on screens inside the church building. It can be used for lobby displays, auditorium screens, children’s ministry screens, conference signage, and service countdowns. The module should allow admins to prepare display playlists and control what appears on church screens.

## Section Context
Section B: Content, Media & Worship

## Core Features (with Tooltips)
- **Announcement screens**: Clean, bold templates designed to display upcoming church events on lobby TVs.
- **Countdown timers**: Digital clocks showing how many minutes remain until the next service begins.
- **Event slides**: Specific promotional graphics for upcoming conferences or special meetings displayed in rotation.
- **Service schedules**: Dynamic lists showing the times and locations of all activities happening in the building today.
- **Lobby displays**: Configurations specifically optimized for high-traffic entryways and welcome centers.
- **Auditorium displays**: Configurations optimized for the main sanctuary screens before and after the service.
- **Playlist scheduling**: Tools to set which slides play at what time (e.g., play Youth graphics only on Friday nights).
- **Image/video display**: Support for both static graphic slides and silently looping promotional videos.
- **Remote screen control**: Allows the admin in the office to update or refresh the TVs in the lobby over the network.
- **Worship lyric display optional**: The ability to route the live worship lyrics to the lobby screens for overflow seating.
- **Emergency notices**: A system to instantly override all screens with an urgent message (like severe weather alerts).
- **Branch-specific displays**: Allows a central admin to push different screen content to different physical church campuses.

## Adaptations
- Can be used inside church buildings
- Can display upcoming services and events
- Can pull content from CMS, media, events, and services
- Can be used for conferences and special programs
- Can support TV screens, projectors, and browser-based display devices

## Relationships & Integrations
### Integrates With
- **Events & Registration Module**: Displays event schedules and announcements.
- **Church Services Module**: Displays service countdowns and service information.
- **Media Module**: Displays promotional videos, slides, and images.
- **Content Management Module**: Can pull announcements from website content.
- **Worship Experience Module**: May display lyrics during physical meetings or worship sessions.

### Connections / Third-Party Services
- ScreenCloud
- Yodeck
- OptiSigns
- Google Chromecast
- Amazon Fire TV
- Apple AirPlay
- Cloudinary
- YouTube / Vimeo

## APIs Needed
- Signage Playlist API
- Display Screen API
- Announcement API
- Countdown API
- Remote Display API

## System Flow
1. Church admin opens the Digital Signage & TV Display Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Digital Signage & TV Display Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
digital_signage_tv_display_module
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

digital_signage_tv_display_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

digital_signage_tv_display_module_settings
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
GET    /api/digital-signage-tv-display - List all tenant records (paginated, filtered)
POST   /api/digital-signage-tv-display - Create a record under X-Tenant-ID
GET    /api/digital-signage-tv-display/:id - Fetch single tenant-isolated record
PATCH  /api/digital-signage-tv-display/:id - Modify record details securely
DELETE /api/digital-signage-tv-display/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Digital Signage & TV Display Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Digital Signage & TV Display Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- digital-signage-tv-display.read
- digital-signage-tv-display.create
- digital-signage-tv-display.update
- digital-signage-tv-display.delete
- digital-signage-tv-display.manage_settings
- digital-signage-tv-display.view_reports

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


---

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


---

# Giving, Partnership & Commerce

# Tithes & Offerings Module

## Description
Handles standard church giving such as tithes, offerings, first fruits, thanksgiving offerings, seeds, recurring giving, receipts, and giving history.

## Plain-English Overview
The Tithes & Offerings Module handles standard church giving. It is designed for regular church practices such as tithes, offerings, first fruits, seeds, thanksgiving offerings, and recurring giving. This module should provide quick giving pages, saved giving preferences, receipts, member giving history, anonymous giving where allowed, QR code giving, mobile giving, and reporting for church finance teams. It should be clearly separated from partnerships, campaigns, and commerce.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Tithe giving**: A dedicated workflow allowing members to securely submit their standard 10% tithes online.
- **Offering giving**: General donation options for members to give freewill offerings during or outside of service.
- **First fruits**: Specialized financial campaigns tracking dedicated "first fruit" seasonal giving.
- **Seeds**: Categorized giving options for members sowing specific financial seeds into the ministry.
- **Thanksgiving offerings**: Custom forms for members to attach testimonies and notes to their thanksgiving donations.
- **Special offerings**: Temporary giving funds set up for specific immediate needs, like visiting guest speakers.
- **Recurring giving**: An automated system allowing members to set up weekly or monthly automatic card deductions.
- **One-time giving**: Quick checkout flows for fast, non-recurring donations without requiring an account.
- **Giving categories**: The master list of all active funds (e.g., Building Fund, Youth Fund) members can donate towards.
- **Giving history**: A private dashboard where members can view a chronological list of all their past donations.
- **Receipts**: Automated, compliant email receipts instantly generated and sent out after every successful transaction.
- **QR giving**: Scannable codes displayed on church screens that instantly open the giving form on a smartphone.
- **Mobile giving**: Highly optimized, fast-loading donation pages specifically designed for mobile devices.
- **Anonymous giving option**: A toggle allowing donors to give financially without associating their name with the gift.
- **Finance reports**: Internal dashboards for the accounting team showing overall revenue trends across all funds.
- **Payment gateway integration**: The secure backend link connecting the platform to Stripe, PayPal, or Paystack.

## Adaptations
- Separate from partnerships, campaigns, and commerce
- Can be linked to a service
- Can appear during livestreams
- Can be available in mobile apps
- Can support Stripe, Flutterwave, Paystack, PayPal, MTN Mobile Money, Airtel Money, or other gateways
- Can support bring-your-own-payment-provider

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Giving history can be linked to member profiles.
- **Church Services Module**: Giving can be linked to a specific service.
- **Livestream Module**: Giving options can appear during live services.
- **Mobile App Access Module**: Members can give from the app.
- **Analytics & Reporting Module**: Reports tithes, offerings, recurring giving, and giving trends.
- **Communication, Notification & Follow-Up Module**: Sends receipts and giving confirmations.

### Connections / Third-Party Services
- Stripe
- PayPal
- Flutterwave
- Paystack
- MTN Mobile Money
- Airtel Money
- Square
- Plaid
- QuickBooks / Xero

## APIs Needed
- Giving Category API
- Payment Checkout API
- Recurring Giving API
- Receipt API
- Giving History API
- Giving Report API

## System Flow
1. Church admin opens the Tithes & Offerings Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Tithes & Offerings Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
tithes_offerings_module
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

tithes_offerings_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

tithes_offerings_module_settings
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
GET    /api/tithes-offerings - List all tenant records (paginated, filtered)
POST   /api/tithes-offerings - Create a record under X-Tenant-ID
GET    /api/tithes-offerings/:id - Fetch single tenant-isolated record
PATCH  /api/tithes-offerings/:id - Modify record details securely
DELETE /api/tithes-offerings/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Tithes & Offerings Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Tithes & Offerings Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- tithes-offerings.read
- tithes-offerings.create
- tithes-offerings.update
- tithes-offerings.delete
- tithes-offerings.manage_settings
- tithes-offerings.view_reports

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


---

# Partnerships & Contributions Module

## Description
Lets people partner with the church or ministry vision through recurring or one-time support without using donation language. It presents giving as shared ministry partnership.

## Plain-English Overview
The Partnerships & Contributions Module allows people to join forces with the church or ministry in supporting specific areas of the vision. Instead of generic fundraising language, this module uses partnership language to reflect shared responsibility and ministry alignment. Partnership categories may include media partnership, missions partnership, outreach partnership, welfare partnership, youth ministry partnership, building partnership, or training partnership. The module should support one-time partnerships, recurring partnerships, partner profiles, partnership history, receipts, reports, and impact updates.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Partnership categories**: Distinct groupings allowing the church to segment partners (e.g., Media Partners, Campus Partners).
- **One-time partnership**: A workflow for donors making a single large financial commitment toward a partnership goal.
- **Recurring partnership**: The system managing ongoing, monthly financial commitments from dedicated partners.
- **Partner profiles**: Specialized CRM records specifically tracking the engagement and financial history of a partner.
- **Partnership history**: A chronological ledger showing all historical contributions from a specific partner.
- **Partnership receipts**: Official financial statements and tax documents generated specifically for partnership giving.
- **Partnership impact updates**: Automated email workflows that send project updates showing partners how their money is being used.
- **Partnership tiers**: Gamified or structured levels (e.g., Silver, Gold) based on the partner’s monthly contribution amount.
- **Partner dashboard**: A private portal where partners can log in to view their giving goals, history, and exclusive updates.
- **Partner reports**: Admin analytics showing the health, retention, and growth rate of the partnership program.
- **Ministry support pages**: Dedicated landing pages explaining the vision behind different partnership opportunities.

## Adaptations
- Uses “partnership” language instead of “donation”
- Supports ministry-specific support areas
- Can connect to campaigns and causes
- Can trigger communication updates
- Can support recurring ministry partners
- Can integrate with CRM and analytics

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Partners can have records and contribution history.
- **Campaigns & Causes Module**: Partnerships can support specific causes.
- **Communication, Notification & Follow-Up Module**: Sends updates to partners.
- **Ministry CRM Module**: Tracks partner engagement.
- **Analytics & Reporting Module**: Reports active partners, recurring partnerships, and support trends.

### Connections / Third-Party Services
- Stripe
- PayPal
- Flutterwave
- Paystack
- Mailchimp / Klaviyo
- QuickBooks / Xero
- HubSpot

## APIs Needed
- Partnership Category API
- Partner Profile API
- Partnership Checkout API
- Recurring Partnership API
- Partnership Report API

## System Flow
1. Church admin opens the Partnerships & Contributions Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Partnerships & Contributions Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
partnerships_contributions_module
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

partnerships_contributions_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

partnerships_contributions_module_settings
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
GET    /api/partnerships-contributions - List all tenant records (paginated, filtered)
POST   /api/partnerships-contributions - Create a record under X-Tenant-ID
GET    /api/partnerships-contributions/:id - Fetch single tenant-isolated record
PATCH  /api/partnerships-contributions/:id - Modify record details securely
DELETE /api/partnerships-contributions/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Partnerships & Contributions Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Partnerships & Contributions Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- partnerships-contributions.read
- partnerships-contributions.create
- partnerships-contributions.update
- partnerships-contributions.delete
- partnerships-contributions.manage_settings
- partnerships-contributions.view_reports

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


---

# Campaigns & Causes Module

## Description
Supports goal-based initiatives such as building projects, outreaches, equipment needs, missions, community support, and other specific causes with progress tracking.

## Plain-English Overview
The Campaigns & Causes Module supports goal-based initiatives. These may include building projects, equipment needs, missions trips, community outreaches, church buses, conference support, emergency support, or special ministry causes. Each campaign should have a clear goal, progress indicator, story, media, updates, sharing links, supporter records, and reporting. This module is different from standard tithes and offerings because it focuses on specific initiatives with measurable goals.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Campaign pages**: Beautiful, distraction-free landing pages dedicated entirely to promoting a specific fundraising cause.
- **Campaign goals**: The financial target set by the church (e.g., $50,000 for a new roof) displayed publicly.
- **Progress bars**: Visual thermometers on the campaign page showing how close the church is to reaching its goal.
- **Campaign story**: A rich-text area for pastors to explain the vision, need, and impact of the specific cause.
- **Campaign images/videos**: Media galleries embedded directly on the cause page to show visual proof of the need.
- **Supporter records**: A database list tracking exactly who donated to this specific campaign and how much.
- **Campaign updates**: A blog-like timeline on the cause page where admins can post progress reports and milestones.
- **Shareable links**: Easy-to-copy URLs and social buttons empowering members to share the campaign on their timelines.
- **Campaign analytics**: Internal charts showing daily donation momentum and measuring the most effective traffic sources.
- **Product-linked campaign support**: Allows the church to sell physical items (like T-shirts) where proceeds go to the campaign.
- **Partnership-linked campaign support**: Allows recurring partners to pledge a temporary extra amount toward this cause.
- **Campaign closing/reporting**: The workflow to officially end a campaign, hide the donation form, and generate final financial reports.

## Adaptations
- Can support building projects, missions, outreach, church bus, welfare, equipment, conferences, and special causes
- Can use funnels for high-converting pages
- Can be promoted through member outreach
- Can receive support through partnerships or product sales
- Can send progress updates through communication module

## Relationships & Integrations
### Integrates With
- **Partnerships & Contributions Module**: Supporters can partner with a cause.
- **Tithes & Offerings Module**: Some churches may link special giving categories to campaigns.
- **E-Commerce / Church Store Module**: Product sales can contribute to campaign totals.
- **Member Outreach & Invite Campaign Module**: Members can share campaign invite links.
- **Ministry Funnels & Landing Pages Module**: Campaigns can have landing pages and conversion flows.
- **Communication, Notification & Follow-Up Module**: Campaign updates can be sent to supporters.
- **Analytics & Reporting Module**: Tracks progress, conversions, and share performance.

### Connections / Third-Party Services
- Stripe / PayPal / Flutterwave / Paystack
- Cloudinary
- Mailchimp / Klaviyo
- Bitly / Rebrandly
- Google Analytics / PostHog
- QuickBooks / Xero

## APIs Needed
- Campaign API
- Campaign Goal API
- Campaign Contribution API
- Campaign Progress API
- Campaign Update API
- Campaign Share Tracking API

## System Flow
1. Church admin opens the Campaigns & Causes Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Campaigns & Causes Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
campaigns_causes_module
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

campaigns_causes_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

campaigns_causes_module_settings
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
GET    /api/campaigns-causes - List all tenant records (paginated, filtered)
POST   /api/campaigns-causes - Create a record under X-Tenant-ID
GET    /api/campaigns-causes/:id - Fetch single tenant-isolated record
PATCH  /api/campaigns-causes/:id - Modify record details securely
DELETE /api/campaigns-causes/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Campaigns & Causes Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Campaigns & Causes Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- campaigns-causes.read
- campaigns-causes.create
- campaigns-causes.update
- campaigns-causes.delete
- campaigns-causes.manage_settings
- campaigns-causes.view_reports

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


---

# E-Commerce / Church Store Module

## Description
Allows churches to sell physical and digital products such as T-shirts, caps, books, Bibles, courses, sermon series, and event merchandise.

## Plain-English Overview
The E-Commerce / Church Store Module allows churches to sell physical and digital products. Products may include T-shirts, caps, hoodies, Bibles, books, sermon series, eBooks, devotionals, course materials, conference resources, worship materials, and promotional items. The module should support product categories, variants, inventory, digital downloads, cart, checkout, receipts, order tracking, pickup, delivery, shipping options, coupon codes, and product-linked campaigns.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Product listings**: The catalog interface displaying all items currently available for purchase in the church store.
- **Physical products**: Support for selling tangible items like books, apparel, or CDs that require shipping or pickup.
- **Digital products**: Support for selling downloadable files like MP3 teachings or PDF study guides.
- **Product categories**: Folders organizing the store inventory (e.g., "Sermon Series", "Apparel", "Books").
- **Product tags**: Searchable keywords attached to items (like "youth" or "summer") for easier filtering.
- **Product variants**: Options allowing users to select different sizes (S, M, L) or colors for a specific product.
- **Inventory**: Stock tracking that automatically hides a product or marks it "Sold Out" when quantities hit zero.
- **Product images**: Upload tools to display multiple high-quality photos for each product from different angles.
- **Cart**: A virtual shopping basket allowing users to accumulate multiple products before paying.
- **Checkout**: The secure, final payment screen where users enter shipping details and credit card information.
- **Orders**: The internal database where admins can view, manage, and fulfill all incoming purchases.
- **Receipts**: Automated order confirmations sent to the customer’s email immediately after purchase.
- **Coupons**: Discount codes (like "SUMMER20") that users can apply at checkout to reduce their total cost.
- **Shipping**: Configuration tools to set flat-rate or weight-based delivery costs for physical products.
- **Pickup options**: A checkout toggle allowing local members to skip shipping fees and collect their item at church.
- **Digital downloads**: The secure, automated delivery of download links for digital products immediately after payment.
- **Order status**: A tracking system allowing admins to mark orders as "Pending", "Processing", or "Shipped".
- **Customer history**: A profile view showing every order a specific member has placed in the store over time.

## Adaptations
- Can sell T-shirts, caps, books, Bibles, eBooks, sermon series, course materials, event merchandise
- Can connect product sales to campaigns
- Can use media module for product images and digital files
- Can support mobile app commerce
- Can support different payment providers

## Relationships & Integrations
### Integrates With
- **Media Module**: Product images, digital files, and previews are stored in Media.
- **Campaigns & Causes Module**: Products can be linked to campaigns.
- **Member Management Module**: Orders can be linked to members.
- **Communication, Notification & Follow-Up Module**: Sends order confirmations, receipts, delivery updates.
- **Analytics & Reporting Module**: Reports sales, revenue, products, and customer activity.
- **Mobile App Access Module**: The store can be available in the app.

### Connections / Third-Party Services
- Stripe / PayPal / Flutterwave / Paystack
- Shippo / EasyPost
- Avalara / TaxJar
- Cloudinary
- Printful / Printify
- QuickBooks / Xero
- Mailchimp / Klaviyo

## APIs Needed
- Product API
- Cart API
- Checkout API
- Order API
- Inventory API
- Coupon API
- Digital Download API

## System Flow
1. Church admin opens the E-Commerce / Church Store Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates E-Commerce / Church Store Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
e_commerce_church_store_module
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

e_commerce_church_store_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

e_commerce_church_store_module_settings
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
GET    /api/e-commerce-church-store - List all tenant records (paginated, filtered)
POST   /api/e-commerce-church-store - Create a record under X-Tenant-ID
GET    /api/e-commerce-church-store/:id - Fetch single tenant-isolated record
PATCH  /api/e-commerce-church-store/:id - Modify record details securely
DELETE /api/e-commerce-church-store/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for E-Commerce / Church Store Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with E-Commerce / Church Store Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- e-commerce-church-store.read
- e-commerce-church-store.create
- e-commerce-church-store.update
- e-commerce-church-store.delete
- e-commerce-church-store.manage_settings
- e-commerce-church-store.view_reports

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


---

# Financial Management & Accounting Module

## Description
A future advanced module for budgets, expenses, financial reporting, reconciliation, payroll support, and branch-level financial tracking.

## Plain-English Overview
The Financial Management & Accounting Module is an advanced administrative module for handling financial records beyond giving and commerce. It can include expense tracking, budgets, financial reports, reconciliations, branch-level financial summaries, payroll support, and internal accounting workflows. This module should be introduced carefully because financial management is complex and requires strong permissions, audit trails, and reporting accuracy.

## Section Context
Section C: Giving, Partnership & Commerce

## Core Features (with Tooltips)
- **Expense tracking**: A basic ledger for admins to record church outflows, vendor payments, and operational costs.
- **Budgeting**: Tools to set monthly financial limits for different departments and track actual spending against those goals.
- **Revenue summaries**: High-level dashboard charts combining tithes, store sales, and event tickets into total income.
- **Giving summaries**: Analytics focused strictly on donation revenue separated by funds and categories.
- **Partnership summaries**: Reports specifically analyzing the financial health of the recurring partnership program.
- **Campaign financial reports**: Breakdowns showing the total ROI and transaction history of specific fundraising drives.
- **Store revenue reports**: Analytics showing product sales trends, best-selling items, and total e-commerce income.
- **Branch accounting**: Tools allowing multi-campus churches to separate and track the finances of individual locations.
- **Reconciliation**: Workflows to match platform transactions against the church’s actual bank account statements.
- **Finance approvals**: A security workflow requiring a senior pastor to sign off on large expense requests.
- **Payroll support optional**: Basic tracking of staff hours and salaries, integrating with external payroll providers.
- **Audit logs**: Un-editable historical records showing exactly which admin altered or deleted financial data.
- **Export reports**: Options to download all financial ledgers as CSV files for use in external accounting software.

## Adaptations
- Best suited for advanced or enterprise plans
- Can receive data from giving, partnerships, campaigns, commerce, and billing
- Can support branch-level financial reporting
- Can be restricted to finance users only
- Requires strong audit trails and permissions

## Relationships & Integrations
### Integrates With
- **Tithes & Offerings Module**: Receives giving summaries.
- **Partnerships & Contributions Module**: Receives partnership totals.
- **Campaigns & Causes Module**: Receives campaign financial reports.
- **E-Commerce / Church Store Module**: Receives sales and revenue data.
- **Billing & Subscription Management Module**: May track platform payments from churches.
- **Multi-Branch / Multi-Campus Management Module**: Supports branch-level financial reports.

### Connections / Third-Party Services
- QuickBooks Online
- Xero
- Sage
- Zoho Books
- Stripe reporting
- PayPal reporting
- Google Sheets
- Excel

## APIs Needed
- Ledger API
- Expense API
- Budget API
- Reconciliation API
- Financial Report API
- Branch Finance API

## System Flow
1. Church admin opens the Financial Management & Accounting Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Financial Management & Accounting Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
financial_management_accounting_module
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

financial_management_accounting_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

financial_management_accounting_module_settings
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
GET    /api/financial-management-accounting - List all tenant records (paginated, filtered)
POST   /api/financial-management-accounting - Create a record under X-Tenant-ID
GET    /api/financial-management-accounting/:id - Fetch single tenant-isolated record
PATCH  /api/financial-management-accounting/:id - Modify record details securely
DELETE /api/financial-management-accounting/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Financial Management & Accounting Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Financial Management & Accounting Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- financial-management-accounting.read
- financial-management-accounting.create
- financial-management-accounting.update
- financial-management-accounting.delete
- financial-management-accounting.manage_settings
- financial-management-accounting.view_reports

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


---

# Member, Community & Engagement

# Ministry Funnels & Landing Pages Module

## Description
A high-converting landing page and funnel builder for salvation, events, new visitors, partnerships, resources, courses, and outreach campaigns.

## Plain-English Overview
The Ministry Funnels & Landing Pages Module allows churches to create high-converting pages and guided journeys for specific ministry goals. These funnels may be used for salvation calls, new visitors, event registration, service invitations, partnership campaigns, course enrollment, free resource access, livestream promotion, cell group joining, or prayer requests. A funnel can connect multiple steps together, such as invite link, landing page, registration form, reminder message, service attendance, salvation response, follow-up sequence, LMS enrollment, and cell group assignment.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Landing page builder**: A specialized drag-and-drop editor designed to build high-converting, single-purpose pages.
- **Funnel step builder**: Tools to link multiple pages together (e.g., Ad -> Landing Page -> Form -> Thank You Page).
- **CTA buttons**: Highly visible, customizable buttons designed to drive a specific action like "Register Now".
- **Form capture**: Integrated data collection tools that feed visitor emails directly into the church CRM.
- **Thank-you pages**: Automated redirect pages displaying confirmation messages and next steps after a form submission.
- **Countdown timers**: Urgency-driving widgets showing the exact time remaining before an event or registration closes.
- **Video sections**: High-impact layout blocks specifically designed to feature promotional videos or pastor invites.
- **Testimonials**: Pre-styled quotation blocks highlighting stories of life change to encourage new sign-ups.
- **Scripture blocks**: Beautiful, readable layout elements designed to prominently display a foundational Bible verse.
- **QR codes**: Automatically generated scannable codes linking directly to the specific landing page or funnel.
- **A/B testing later**: Future capability to run two different designs simultaneously to see which converts better.
- **Conversion tracking**: Analytics measuring exactly what percentage of visitors actually filled out the form.
- **Funnel analytics**: Detailed breakdown of traffic sources, drop-off rates, and overall funnel health.
- **Follow-up automation**: Links the funnel directly to the communication module to instantly email new leads.
- **Event funnels**: Specialized templates designed specifically to drive ticket sales and conference registrations.
- **Salvation funnels**: Gentle, highly sensitive templates guiding seekers to make a decision for Christ.
- **Partnership funnels**: Long-form sales-letter style pages explaining the vision to secure recurring donors.
- **Course funnels**: Templates designed to recruit students into the LMS discipleship academy.
- **Livestream funnels**: Pages designed to capture emails in exchange for a reminder link to the upcoming broadcast.
- **New visitor funnels**: Welcoming, informative pages designed specifically for first-time guests planning a visit.

## Adaptations
- Can connect member invite links to landing pages
- Can guide visitors from interest to action
- Can trigger CRM, communication, LMS, salvation, event registration, or partnership workflows
- Can help churches create high-converting pages without external tools
- Can support campaigns for services, events, resources, or causes

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Funnels can use website pages or custom landing pages.
- **Member Outreach & Invite Campaign Module**: Invite links can send visitors into funnels.
- **Salvation & New Believer Journey Module**: Salvation funnels can trigger new believer journeys.
- **Events & Registration Module**: Event funnels can register attendees.
- **LMS & Discipleship Training Module**: Course funnels can enroll students.
- **Partnerships & Contributions Module**: Partnership funnels can create partner records.
- **Campaigns & Causes Module**: Campaign funnels can drive support toward a cause.
- **Communication, Notification & Follow-Up Module**: Funnels trigger follow-up emails, SMS, and push notifications.
- **Analytics & Reporting Module**: Tracks funnel conversion rates.

### Connections / Third-Party Services
- Stripe / PayPal / Flutterwave / Paystack
- Mailchimp / Klaviyo
- Twilio / SendGrid
- Google Analytics / PostHog / Mixpanel
- Meta Pixel / TikTok Pixel / Google Ads
- Typeform
- Zapier / Make

## APIs Needed
- Funnel API
- Landing Page API
- Form Capture API
- CTA API
- Conversion Tracking API
- Funnel Step API
- Automation Trigger API

## System Flow
1. Church admin opens the Ministry Funnels & Landing Pages Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Ministry Funnels & Landing Pages Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
ministry_funnels_landing_pages_module
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

ministry_funnels_landing_pages_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

ministry_funnels_landing_pages_module_settings
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
GET    /api/ministry-funnels-landing-pages - List all tenant records (paginated, filtered)
POST   /api/ministry-funnels-landing-pages - Create a record under X-Tenant-ID
GET    /api/ministry-funnels-landing-pages/:id - Fetch single tenant-isolated record
PATCH  /api/ministry-funnels-landing-pages/:id - Modify record details securely
DELETE /api/ministry-funnels-landing-pages/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Ministry Funnels & Landing Pages Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Ministry Funnels & Landing Pages Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- ministry-funnels-landing-pages.read
- ministry-funnels-landing-pages.create
- ministry-funnels-landing-pages.update
- ministry-funnels-landing-pages.delete
- ministry-funnels-landing-pages.manage_settings
- ministry-funnels-landing-pages.view_reports

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


---

# Member Management Module

## Description
Manages church members, profiles, contact details, households, attendance, membership status, notes, and basic records.

## Plain-English Overview
The Member Management Module stores and manages member information. It should include member profiles, contact details, family or household relationships, membership status, attendance history, group involvement, notes, follow-up history, and activity records. It becomes the foundation for knowing who belongs to the church, how they are connected, and how they are participating in church life.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Member profiles**: The central hub storing a member’s name, photo, demographics, and contact information.
- **Contact details**: Secure fields storing phone numbers, emails, physical addresses, and emergency contacts.
- **Family/household grouping**: Links individual profiles together (e.g., parents and children) under a single household unit.
- **Membership status**: Tags indicating if someone is a first-time guest, regular attendee, or official church member.
- **Attendance history**: A chronological list of every service, class, or event the member has checked into.
- **Giving history link**: A secure connection allowing authorized finance admins to view the member’s donation records.
- **Partnership history link**: Connects the member’s profile to their recurring ministry partnership commitments.
- **Group membership**: Displays all the cells, departments, or volunteer teams the member is currently part of.
- **Course enrollments**: Shows the student’s progress through the LMS discipleship academy.
- **Notes**: A private text area where pastors and care agents can log counseling sessions or important updates.
- **Follow-up history**: An audit trail showing all the emails, SMS messages, and calls logged against this member.
- **Member tags**: Custom labels (like "choir" or "needs baptism") used to quickly organize and segment the database.
- **Member search**: A fast, global search bar to instantly pull up a specific member’s profile.
- **Member segmentation**: Advanced filtering tools to create lists (e.g., "All single females under 30 in New York").
- **Import/export**: Tools to bulk-upload members via CSV from an old system, or download the database for backup.

## Adaptations
- Can serve as the main people database
- Can connect to CRM, cells, LMS, giving, events, attendance, and communication
- Can help identify active, inactive, new, or follow-up-needed members
- Can support multi-branch member structures

## Relationships & Integrations
### Integrates With
- **Ministry CRM Module**: Member data powers relationship tracking.
- **Cell / Fellowship Module**: Members can be assigned to cells or fellowships.
- **LMS & Discipleship Training Module**: Members can be enrolled in courses.
- **Tithes & Offerings Module**: Giving and partnership history can be linked to members.
- **Events & Registration Module**: Event registration can connect to member records.
- **Check-In & Attendance Management Module**: Check-ins update member participation.
- **Communication, Notification & Follow-Up Module**: Messages are sent to member segments.

### Connections / Third-Party Services
- Google Contacts
- HubSpot
- Salesforce
- Airtable
- Google Sheets
- Mailchimp / Klaviyo
- Twilio

## APIs Needed
- Member Profile API
- Household API
- Member Status API
- Member Activity API
- Member Search API
- Member Segmentation API

## System Flow
1. Church admin opens the Member Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Member Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
member_management_module
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

member_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

member_management_module_settings
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
GET    /api/member-management - List all tenant records (paginated, filtered)
POST   /api/member-management - Create a record under X-Tenant-ID
GET    /api/member-management/:id - Fetch single tenant-isolated record
PATCH  /api/member-management/:id - Modify record details securely
DELETE /api/member-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Member Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Member Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- member-management.read
- member-management.create
- member-management.update
- member-management.delete
- member-management.manage_settings
- member-management.view_reports

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


---

# Community & Engagement Module

## Description
Creates social and spiritual interaction tools such as prayer requests, testimonies, discussions, community feeds, reactions, and group engagement.

## Plain-English Overview
The Community & Engagement Module creates interactive spaces for members and visitors to participate beyond simply reading content or watching videos. It can include prayer requests, testimonies, group discussions, reactions, comments, ministry feeds, and community updates. The goal is to make the church platform feel alive, relational, and participatory rather than static.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Prayer requests**: A secure board where members can post their needs, allowing others to click "I prayed for this".
- **Testimony submissions**: A workflow for members to share praise reports of what God has done in their lives.
- **Discussion posts**: Forums or message boards allowing members to discuss the recent sermon or share scriptures.
- **Community feeds**: A social-media style scrolling wall displaying the latest updates from the church and members.
- **Comments**: Tools allowing members to reply to and engage with articles, testimonies, or discussion posts.
- **Reactions**: Quick interaction buttons (like a heart or praying hands) members can use on posts.
- **Group posts**: Private discussion feeds isolated specifically to the members of a certain cell or volunteer team.
- **Moderation tools**: Controls for admins to delete inappropriate comments, ban users, or approve posts before they go live.
- **Member interactions**: Tracks the engagement metrics of how often a member posts or comments in the community.
- **Public/private engagement spaces**: Configurations to make some discussions open to the internet, and others locked to members.
- **Approval workflows**: A security gateway ensuring testimonies or prayer requests are vetted by a pastor before public display.

## Adaptations
- Can make the platform feel relational and alive
- Can connect prayer requests to pastoral care
- Can publish approved testimonies
- Can trigger notifications for community activity
- Can support ministry groups, youth groups, women’s groups, and cell groups

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Community posts and activity are tied to member accounts.
- **Live Chat, Pastoral Care & Support Module**: Prayer requests can become care cases.
- **Communication, Notification & Follow-Up Module**: Community updates can trigger notifications.
- **Ministry CRM Module**: Engagement can contribute to member relationship history.

### Connections / Third-Party Services
- Stream Chat
- Pusher
- Ably
- Firebase Realtime Database / Firestore
- Twilio Conversations
- Perspective API
- Cloudinary

## APIs Needed
- Community Post API
- Prayer Request API
- Testimony API
- Comment API
- Reaction API
- Moderation API

## System Flow
1. Church admin opens the Community & Engagement Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Community & Engagement Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
community_engagement_module
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

community_engagement_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

community_engagement_module_settings
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
GET    /api/community-engagement - List all tenant records (paginated, filtered)
POST   /api/community-engagement - Create a record under X-Tenant-ID
GET    /api/community-engagement/:id - Fetch single tenant-isolated record
PATCH  /api/community-engagement/:id - Modify record details securely
DELETE /api/community-engagement/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Community & Engagement Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Community & Engagement Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- community-engagement.read
- community-engagement.create
- community-engagement.update
- community-engagement.delete
- community-engagement.manage_settings
- community-engagement.view_reports

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


---

# Ministry CRM Module

## Description
Tracks visitors, members, follow-up pipelines, pastoral care history, communication records, engagement scores, and ministry journeys.

## Plain-English Overview
The Ministry CRM Module helps churches manage relationships, follow-ups, and member journeys. It can track visitors, new members, salvation responses, pastoral care interactions, communication history, engagement levels, group assignments, and follow-up pipelines. This module turns church administration into a guided relationship management system where people are not forgotten after their first interaction.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Contact profiles**: Detailed records for non-members, first-time guests, or external vendors interacting with the church.
- **Visitor tracking**: Systems logging the source and date of a first-time guest’s initial connection with the church.
- **Follow-up pipelines**: Visual, Kanban-style boards tracking where a person is in their journey (e.g., New -> Contacted -> Enrolled).
- **Engagement history**: A unified timeline showing every email opened, event attended, and form submitted by the contact.
- **Pastoral notes**: Highly secure, encrypted text fields where pastors can log sensitive counseling or care information.
- **Care timeline**: A chronological tracking of hospital visits, bereavements, and pastoral support given to a family.
- **Salvation journey tracking**: A specific pipeline monitoring a new believer’s progress from the altar call to water baptism.
- **New member tracking**: Workflows ensuring recent guests complete the necessary integration classes to become full members.
- **Lead source tracking**: Analytics identifying whether a new contact came from Facebook, a Google Ad, or a friend’s invite.
- **Engagement scoring**: An automated algorithm that assigns points to contacts based on their activity to find highly engaged leaders.
- **Task assignment**: Tools allowing a pastor to assign a specific follow-up call to a specific volunteer agent.
- **Follow-up reminders**: Automated alerts prompting a care agent to reach back out to a contact on a specific date.
- **CRM reports**: Administrative dashboards showing the overall effectiveness of the church’s follow-up and retention efforts.

## Adaptations
- Can track a person’s journey from visitor to member to worker
- Can connect to salvation, forms, live chat, events, LMS, communication, and member management
- Can help pastors and care teams follow up intentionally
- Can support automation so people are not forgotten

## Relationships & Integrations
### Integrates With
- **Member Management Module**: CRM uses member and visitor records.
- **Salvation & New Believer Journey Module**: New believer journeys create CRM records.
- **Live Chat, Pastoral Care & Support Module**: Chats and pastoral care conversations are logged in CRM.
- **Communication, Notification & Follow-Up Module**: Follow-up messages are driven by CRM stages.
- **Ministry Funnels & Landing Pages Module**: Funnel leads enter CRM pipelines.
- **Events & Registration Module**: Event attendance can update CRM engagement.
- **LMS & Discipleship Training Module**: Course progress can update CRM milestones.

### Connections / Third-Party Services
- HubSpot
- Salesforce
- Pipedrive
- Airtable
- Google Sheets
- Mailchimp
- Klaviyo
- Twilio

## APIs Needed
- CRM Contact API
- Pipeline API
- Follow-Up Stage API
- Pastoral Note API
- Engagement Score API
- CRM Timeline API

## System Flow
1. Church admin opens the Ministry CRM Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Ministry CRM Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
ministry_crm_module
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

ministry_crm_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

ministry_crm_module_settings
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
GET    /api/ministry-crm - List all tenant records (paginated, filtered)
POST   /api/ministry-crm - Create a record under X-Tenant-ID
GET    /api/ministry-crm/:id - Fetch single tenant-isolated record
PATCH  /api/ministry-crm/:id - Modify record details securely
DELETE /api/ministry-crm/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Ministry CRM Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Ministry CRM Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- ministry-crm.read
- ministry-crm.create
- ministry-crm.update
- ministry-crm.delete
- ministry-crm.manage_settings
- ministry-crm.view_reports

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


---

# Communication, Notification & Follow-Up Module

## Description
Manages email, SMS, push notifications, WhatsApp follow-ups, reminders, campaigns, automated journeys, and communication preferences.

## Plain-English Overview
The Communication, Notification & Follow-Up Module manages messages sent through email, SMS, push notifications, WhatsApp, and in-app alerts. Churches can send reminders for services, events, livestreams, meetings, courses, giving, partnership updates, birthdays, anniversaries, and follow-up journeys. The module should support templates, scheduled messages, automated workflows, audience segmentation, delivery reports, opt-out preferences, and usage billing for channels like SMS or WhatsApp.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Email campaigns**: A drag-and-drop newsletter builder for sending beautiful, mass emails to the congregation.
- **SMS campaigns**: Tools to broadcast short text messages, alerts, or links directly to members’ phones.
- **Push notifications**: Instant alerts sent to the home screens of members who have the church’s mobile app installed.
- **WhatsApp integration**: The ability to send automated or bulk messages through the WhatsApp Business API.
- **In-app notifications**: Alerts that appear as a red dot or bell icon when the user logs into the web platform.
- **Message templates**: Pre-written, saveable email or SMS layouts (like "Welcome First Time Guest") for quick reuse.
- **Scheduled messages**: The ability to write a communication today but delay its delivery until a specific future date and time.
- **Automated workflows**: Triggers that send an email automatically when a specific action happens (e.g., someone registers for an event).
- **Audience segmentation**: Tools to filter the database and send a message only to a specific group (e.g., "All Youth Parents").
- **Delivery logs**: Detailed tracking showing exactly which messages were successfully delivered, opened, or bounced.
- **Failed message retry**: Automated logic that attempts to resend an email or SMS if the first attempt experienced a network error.
- **Unsubscribe/opt-out**: Automated compliance links allowing members to remove themselves from marketing or notification lists.
- **Notification preferences**: A user dashboard where members can choose if they prefer emails, texts, or app notifications.
- **Birthday/anniversary messages**: Automated, personalized greetings sent exactly on the member’s special dates.
- **Event reminders**: Automated messages sent a few days before an event to everyone who RSVP’d.
- **Service reminders**: Weekly automated pings reminding members of upcoming service times or special guest speakers.
- **Livestream reminders**: Notifications sent 15 minutes before the broadcast begins with a direct link to watch.
- **Course reminders**: Automated nudges sent to LMS students who haven’t logged in recently to complete their coursework.
- **Follow-up sequences**: A multi-step "drip" campaign sending a series of emails to a new visitor over their first 30 days.

## Adaptations
- Can use platform-managed communication providers
- Can allow churches to connect their own SendGrid, Twilio, Mailgun, Africa’s Talking, WhatsApp Business, or other providers
- Can be usage-billed
- Can be triggered by actions across almost every module
- Can support pastoral follow-up automation

## Relationships & Integrations
### Integrates With
- **Events & Registration Module**: Sends event updates and QR check-in codes.
- **Church Services Module**: Sends service reminders.
- **Livestream Module**: Sends live notifications.
- **LMS & Discipleship Training Module**: Sends lesson reminders.
- **Salvation & New Believer Journey Module**: Sends new believer follow-ups.
- **Tithes & Offerings Module**: Sends giving receipts and confirmations.
- **Partnerships & Contributions Module**: Sends partnership updates.
- **Campaigns & Causes Module**: Sends campaign updates.
- **Booking & Appointment Management Module**: Sends appointment confirmations and reminders.
- **Live Meetings Module**: Sends meeting reminders.
- **Member Outreach & Invite Campaign Module**: Sends campaign invitations.

### Connections / Third-Party Services
- Twilio
- SendGrid
- Mailchimp
- Klaviyo
- Firebase Cloud Messaging
- Africa’s Talking
- WhatsApp Business Platform
- OneSignal

## APIs Needed
- Message Template API
- Email API
- SMS API
- Push Notification API
- WhatsApp API
- Automation Workflow API
- Delivery Log API
- Notification Preference API

## System Flow
1. Church admin opens the Communication, Notification & Follow-Up Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Communication, Notification & Follow-Up Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
communication_notification_follow_up_module
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

communication_notification_follow_up_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

communication_notification_follow_up_module_settings
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
GET    /api/communication-notification-follow-up - List all tenant records (paginated, filtered)
POST   /api/communication-notification-follow-up - Create a record under X-Tenant-ID
GET    /api/communication-notification-follow-up/:id - Fetch single tenant-isolated record
PATCH  /api/communication-notification-follow-up/:id - Modify record details securely
DELETE /api/communication-notification-follow-up/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Communication, Notification & Follow-Up Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Communication, Notification & Follow-Up Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- communication-notification-follow-up.read
- communication-notification-follow-up.create
- communication-notification-follow-up.update
- communication-notification-follow-up.delete
- communication-notification-follow-up.manage_settings
- communication-notification-follow-up.view_reports

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


---

# Live Chat, Pastoral Care & Support Module

## Description
Provides real-time care through live chat, prayer requests, counselling requests, salvation follow-ups, care agents, and support conversations.

## Plain-English Overview
The Live Chat, Pastoral Care & Support Module provides real-time and structured care for online visitors, members, and event attendees. It allows people to ask questions, request prayer, submit testimonies, request counselling, ask for follow-up, or speak with a church representative. Church staff can manage conversations, assign care agents, tag conversations, add internal notes, and create follow-up tasks. This module helps online church engagement feel personal and pastoral.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Website live chat**: A floating chat bubble on the church website allowing visitors to instantly ask questions.
- **Livestream chat support**: Private, 1-on-1 direct messaging tools for pastors to counsel viewers during a live broadcast.
- **Mobile app chat**: In-app messaging allowing members to securely text the church office from their phones.
- **Prayer request intake**: A specialized workflow routing incoming prayer needs directly to the intercessory team.
- **Testimony intake**: Tools to collect, review, and approve praise reports submitted by members via chat.
- **Counselling requests**: Secure forms for members to request an appointment or call from a pastoral counselor.
- **Salvation follow-up chat**: A prioritized chat queue specifically for new believers needing immediate guidance.
- **Agent assignment**: Routing logic that assigns a specific incoming chat to an available volunteer or pastor.
- **Conversation tags**: Labels (like "Needs Prayer" or "First Time Guest") attached to a chat to organize the inbox.
- **Internal notes**: Private comments that staff can leave on a chat thread that the visitor cannot see.
- **Saved replies**: Pre-written answers (like service times or location directions) that agents can insert with one click.
- **Offline message capture**: A form that appears when no agents are online, converting the chat into an email ticket.
- **Priority levels**: Visual indicators showing agents which chats are urgent (like counselling) vs general questions.
- **Follow-up tasks**: To-do items generated directly from a chat conversation to ensure the person gets a phone call later.
- **Conversation history**: An archived log showing every past chat the church has ever had with a specific member.

## Adaptations
- Can make online viewers feel personally cared for
- Can connect chat activity to CRM
- Can turn prayer requests into care cases
- Can turn counselling requests into bookings
- Can route salvation responses to care agents
- Can support live event and livestream support

## Relationships & Integrations
### Integrates With
- **Livestream Module**: Live viewers can chat, request prayer, or ask questions.
- **Salvation & New Believer Journey Module**: People who respond to salvation can be routed to care agents.
- **Ministry CRM Module**: Conversations are stored in relationship history.
- **Communication, Notification & Follow-Up Module**: Care follow-ups can trigger SMS, email, or push messages.
- **Member Management Module**: Known members can be identified in chat.
- **Booking & Appointment Management Module**: A chat can lead to a counselling or prayer appointment.

### Connections / Third-Party Services
- Intercom
- Crisp
- Tawk.to
- Zendesk
- Freshdesk
- Twilio Conversations
- Pusher / Ably
- WhatsApp Business Platform

## APIs Needed
- Chat Conversation API
- Chat Message API
- Care Request API
- Agent Assignment API
- Prayer Request API
- Testimony Submission API
- Follow-Up Task API

## System Flow
1. Church admin opens the Live Chat, Pastoral Care & Support Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Live Chat, Pastoral Care & Support Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
live_chat_pastoral_care_support_module
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

live_chat_pastoral_care_support_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

live_chat_pastoral_care_support_module_settings
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
GET    /api/live-chat-pastoral-care-support - List all tenant records (paginated, filtered)
POST   /api/live-chat-pastoral-care-support - Create a record under X-Tenant-ID
GET    /api/live-chat-pastoral-care-support/:id - Fetch single tenant-isolated record
PATCH  /api/live-chat-pastoral-care-support/:id - Modify record details securely
DELETE /api/live-chat-pastoral-care-support/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Live Chat, Pastoral Care & Support Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Live Chat, Pastoral Care & Support Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- live-chat-pastoral-care-support.read
- live-chat-pastoral-care-support.create
- live-chat-pastoral-care-support.update
- live-chat-pastoral-care-support.delete
- live-chat-pastoral-care-support.manage_settings
- live-chat-pastoral-care-support.view_reports

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


---

# Member Outreach & Invite Campaign Module

## Description
Allows members to share church-approved invite materials, create personal invitation pages, record invite videos, and track outreach responses.

## Plain-English Overview
The Member Outreach & Invite Campaign Module allows church members to participate in digital evangelism and invitation campaigns. Church admins can upload approved graphics, videos, captions, hashtags, and campaign links. Members can download assets, share them on WhatsApp, Facebook, Instagram, TikTok, and other channels, or create personalized invite pages with their own photo, video, and message. These pages can point visitors to a service, event, livestream, resource, campaign, course, or church page. The system should track clicks, responses, registrations, and conversions connected to each member’s invite link.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Church-created invite campaigns**: Centralized marketing drives designed to empower members to invite their friends to church.
- **Invite graphics**: Pre-designed square and vertical images members can easily download and post on social media.
- **Invite videos**: Short, high-quality promotional clips provided by the church for members to share.
- **Share captions**: Pre-written text suggestions that members can copy/paste when posting an invite.
- **Hashtags**: Church-approved social tags provided to track the global reach of the congregation’s posts.
- **Social share links**: One-click buttons allowing members to instantly post the invite to Facebook, Twitter, or WhatsApp.
- **Downloadable assets**: Zipped folders of high-res graphics available for members who want to print flyers.
- **Personalized invite pages**: Unique landing pages generated for each member (e.g., church.com/invite/john) to share.
- **Member photo/video upload**: Tools for members to record a 30-second personal invite video to display on their unique page.
- **Personal message**: A text area where the member can write a personal welcome note to their specific friends.
- **CTA button selection**: Options for the member to choose the primary call-to-action on their page, like "Plan a Visit".
- **Unique tracking links**: Special URLs that log exactly how many people clicked John’s specific invite link.
- **QR codes**: Scannable graphics that John can save to his phone and have friends scan in person to visit his page.
- **Click tracking**: Analytics showing the member how much traffic their personal outreach link has generated.
- **Conversion tracking**: Metrics showing the member exactly how many of their friends filled out the "Plan a Visit" form.
- **Leaderboards optional**: Gamification features displaying which members have brought in the most new guests.

## Adaptations
- Can help members invite friends and family
- Can connect to services, events, livestreams, campaigns, resources, or courses
- Can generate member-specific pages under the church domain
- Can track which members are driving engagement
- Can feed new visitors into funnels and CRM

## Relationships & Integrations
### Integrates With
- **Ministry Funnels & Landing Pages Module**: Invite links often lead to landing pages.
- **Events & Registration Module**: Members can invite people to events.
- **Church Services Module**: Members can invite people to Sunday or midweek services.
- **Livestream Module**: Members can invite people to watch a livestream.
- **Campaigns & Causes Module**: Members can promote causes.
- **Media Module**: Members can download graphics and videos.
- **Ministry CRM Module**: New leads from invite links can enter CRM.
- **Analytics & Reporting Module**: Tracks clicks, responses, and conversions.

### Connections / Third-Party Services
- Bitly / Rebrandly
- Cloudinary
- Meta Pixel
- TikTok Pixel
- Google Analytics
- WhatsApp Share Links
- Canva
- OpenAI / AI providers

## APIs Needed
- Outreach Campaign API
- Invite Asset API
- Personalized Invite Page API
- Invite Link Tracking API
- Share Tracking API
- Conversion Attribution API

## System Flow
1. Church admin opens the Member Outreach & Invite Campaign Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Member Outreach & Invite Campaign Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
member_outreach_invite_campaign_module
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

member_outreach_invite_campaign_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

member_outreach_invite_campaign_module_settings
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
GET    /api/member-outreach-invite-campaign - List all tenant records (paginated, filtered)
POST   /api/member-outreach-invite-campaign - Create a record under X-Tenant-ID
GET    /api/member-outreach-invite-campaign/:id - Fetch single tenant-isolated record
PATCH  /api/member-outreach-invite-campaign/:id - Modify record details securely
DELETE /api/member-outreach-invite-campaign/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Member Outreach & Invite Campaign Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Member Outreach & Invite Campaign Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- member-outreach-invite-campaign.read
- member-outreach-invite-campaign.create
- member-outreach-invite-campaign.update
- member-outreach-invite-campaign.delete
- member-outreach-invite-campaign.manage_settings
- member-outreach-invite-campaign.view_reports

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


---

# Check-In & Attendance Management Module

## Description
Tracks attendance for services, events, groups, children, volunteers, and classes using QR codes, manual check-ins, or automatic digital records.

## Plain-English Overview
The Check-In & Attendance Management Module tracks attendance across services, events, classes, volunteer activities, children’s ministry, cell meetings, and courses. It should support QR check-ins, manual check-ins, mobile check-ins, attendance reports, and history per person. This module gives churches a clearer view of participation and helps identify people who may need follow-up.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **QR check-in**: Fast, touchless attendance logging where members scan their phone at a kiosk upon arrival.
- **Manual check-in**: An administrative view where staff can search for a name and manually mark a member as present.
- **Mobile check-in**: Allows parents to check their kids in from the car using the church app before walking inside.
- **Service attendance**: The core system tracking how many adults attended the main Sunday gathering.
- **Event attendance**: Specific rosters and check-in tools designed for conferences, youth camps, or paid events.
- **Cell attendance**: Mobile-friendly check-in lists for small group leaders to log who attended their mid-week meeting.
- **LMS class attendance**: Tools tracking which students physically or virtually attended the discipleship training session.
- **Children check-in**: Highly secure workflows generating matching parent/child name tags with allergy alerts.
- **Volunteer check-in**: Tracking systems verifying that the scheduled usher or camera operator actually arrived for their shift.
- **Attendance reports**: Charts showing the historical growth or decline of service numbers over months and years.
- **Absence tracking**: Automated alerts that notify a pastor if a previously consistent member misses three weeks in a row.
- **Attendance export**: Tools to download raw check-in data as an Excel file for internal church records.

## Adaptations
- Can work for physical and online attendance
- Can connect to services, events, cells, LMS, children’s ministry, and volunteers
- Can update CRM engagement scores
- Can trigger follow-up messages for absences
- Can support branch-specific attendance

## Relationships & Integrations
### Integrates With
- **Church Services Module**: Tracks service attendance.
- **Events & Registration Module**: Tracks event check-ins.
- **Cell / Fellowship Module**: Tracks cell meeting attendance.
- **Children & Family Ministry Module**: Tracks children check-in and pickup.
- **LMS & Discipleship Training Module**: Tracks class attendance.
- **Ministry CRM Module**: Attendance affects engagement scores and follow-up.
- **Communication, Notification & Follow-Up Module**: Absence can trigger follow-up messages.

### Connections / Third-Party Services
- QR code generation library
- Google Maps / Places
- NFC / RFID hardware
- Apple Wallet / Google Wallet
- Google Sheets export

## APIs Needed
- Check-In API
- QR Code API
- Attendance API
- Attendance Report API
- Location Check-In API
- Attendance Export API

## System Flow
1. Church admin opens the Check-In & Attendance Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Check-In & Attendance Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
check_in_attendance_management_module
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

check_in_attendance_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

check_in_attendance_management_module_settings
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
GET    /api/check-in-attendance-management - List all tenant records (paginated, filtered)
POST   /api/check-in-attendance-management - Create a record under X-Tenant-ID
GET    /api/check-in-attendance-management/:id - Fetch single tenant-isolated record
PATCH  /api/check-in-attendance-management/:id - Modify record details securely
DELETE /api/check-in-attendance-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Check-In & Attendance Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Check-In & Attendance Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- check-in-attendance-management.read
- check-in-attendance-management.create
- check-in-attendance-management.update
- check-in-attendance-management.delete
- check-in-attendance-management.manage_settings
- check-in-attendance-management.view_reports

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


---

# Volunteer & Workforce Management Module

## Description
Helps churches schedule and manage workers, departments, rosters, availability, service assignments, and volunteer communication.

## Plain-English Overview
The Volunteer & Workforce Management Module helps churches manage workers, departments, ministry teams, and service assignments. It should support volunteer profiles, department structures, duty rosters, availability, shift scheduling, check-ins, reminders, task assignments, and team communication. This is useful for media teams, ushering teams, choir, children’s ministry, prayer teams, protocol teams, security, and other departments.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Volunteer profiles**: Specialized CRM records detailing a worker’s skills, department, and training status.
- **Department management**: Organizational folders grouping volunteers into teams like "Media", "Kids", or "Ushers".
- **Team structures**: Hierarchical setups defining team leaders, assistants, and general volunteers within a department.
- **Availability tracking**: A calendar where volunteers can block out dates they are out of town or unable to serve.
- **Duty rosters**: Visual schedules showing exactly who is serving in what position for the upcoming month.
- **Service assignments**: Tools to schedule a specific volunteer to run the soundboard for the 9 AM Sunday service.
- **Event assignments**: Scheduling tools mapping volunteers to specific shifts for a multi-day conference.
- **Shift scheduling**: Tools to divide a long Sunday into multiple overlapping volunteer timeframes.
- **Volunteer reminders**: Automated text messages and emails sent on Thursday reminding volunteers of their Sunday shift.
- **Check-in tracking**: Systems ensuring the scheduled volunteer actually arrived, replacing them with a backup if they no-show.
- **Task lists**: Checklists provided to a volunteer (e.g., "Turn on projector, test mics") for their specific role.
- **Team announcements**: A private broadcast tool allowing the Head Usher to message all ushers at once.
- **Volunteer reports**: Analytics showing which volunteers serve the most hours and which departments need more recruitment.

## Adaptations
- Can support media, ushering, choir, prayer, children’s ministry, security, protocol, welfare, and other teams
- Can connect to church services and events
- Can notify volunteers automatically
- Can track worker participation
- Can support salaried or volunteer workforce structures later

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Volunteers are members with assigned roles.
- **Events & Registration Module**: Volunteers can be scheduled for events.
- **Church Services Module**: Volunteers can be assigned to services.
- **Communication, Notification & Follow-Up Module**: Sends reminders and roster notifications.
- **Check-In & Attendance Management Module**: Tracks volunteer check-in.
- **Ministry CRM Module**: Volunteer participation becomes part of member engagement.

### Connections / Third-Party Services
- Google Calendar
- Microsoft Outlook Calendar
- Slack
- Microsoft Teams
- Twilio / SendGrid
- Trello / Asana / Monday.com
- Google Sheets

## APIs Needed
- Volunteer Profile API
- Department API
- Roster API
- Availability API
- Assignment API
- Volunteer Check-In API

## System Flow
1. Church admin opens the Volunteer & Workforce Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Volunteer & Workforce Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
volunteer_workforce_management_module
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

volunteer_workforce_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

volunteer_workforce_management_module_settings
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
GET    /api/volunteer-workforce-management - List all tenant records (paginated, filtered)
POST   /api/volunteer-workforce-management - Create a record under X-Tenant-ID
GET    /api/volunteer-workforce-management/:id - Fetch single tenant-isolated record
PATCH  /api/volunteer-workforce-management/:id - Modify record details securely
DELETE /api/volunteer-workforce-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Volunteer & Workforce Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Volunteer & Workforce Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- volunteer-workforce-management.read
- volunteer-workforce-management.create
- volunteer-workforce-management.update
- volunteer-workforce-management.delete
- volunteer-workforce-management.manage_settings
- volunteer-workforce-management.view_reports

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


---

# Forms & Workflow Automation Module

## Description
Lets churches create custom forms and automated workflows for registrations, applications, approvals, follow-ups, and internal ministry processes.

## Plain-English Overview
The Forms & Workflow Automation Module allows churches to create custom forms and connect them to automated actions. Forms may be used for visitor cards, baptism registration, volunteer applications, event signups, counselling requests, prayer requests, testimony submissions, course enrollment, and ministry applications. Workflows can route submissions to the right team, send confirmation messages, trigger follow-ups, create CRM records, or require approval.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Custom form builder**: A drag-and-drop tool to create digital applications, surveys, and registration forms.
- **Form fields**: Standard inputs like text boxes, dropdowns, checkboxes, and date selectors used to collect data.
- **Conditional fields**: Smart logic that hides or shows follow-up questions based on how the user answered previous ones.
- **File uploads**: Allows members to attach PDFs or images (like a resume or ID) directly to their form submission.
- **Form submissions**: The secure backend database where admins can review all the data submitted by members.
- **Approval workflows**: A routing system that sends a submitted application to a pastor for a "Yes/No" decision.
- **Automated routing**: Logic that automatically emails the Youth Pastor if someone selects "Youth Ministry" on a form.
- **Confirmation messages**: The customizable "Thank You" screen displayed to the user immediately after hitting submit.
- **Submission tags**: Labels automatically applied to the form data to keep the backend database organized.
- **Workflow triggers**: The initial event (like a form submission) that kicks off an automated chain of actions.
- **Workflow actions**: The automated steps (like sending an email or assigning a task) that happen after a trigger.
- **Task creation**: Automation that instantly generates a "Call this person" to-do list item when a specific form is filled out.
- **CRM record creation**: Automatically builds a new profile in the database if the person submitting the form is a new guest.
- **Notification triggers**: Alerts sent to staff phones or emails notifying them that a high-priority form was just received.

## Adaptations
- Can power visitor forms, baptism forms, volunteer applications, counselling forms, prayer forms, testimony forms, event forms, and course forms
- Can connect to almost every module
- Can reduce manual admin work
- Can support simple and advanced workflow automation

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Forms collect member directory data.
- **Ministry CRM Module**: Forms feed contacts and follow-ups to CRM pipelines.
- **Salvation & New Believer Journey Module**: Forms capture salvation responses and new believers.
- **Events & Registration Module**: Forms capture event registrations.
- **LMS & Discipleship Training Module**: Forms serve as assessments or quizzes.
- **Booking & Appointment Management Module**: Forms collect pre-appointment details.
- **Community & Engagement Module**: Forms capture prayer and testimony submissions.
- **Volunteer & Workforce Management Module**: Forms collect volunteer applications.
- **Partnerships & Contributions Module**: Forms capture partner profiles.
- **Campaigns & Causes Module**: Forms collect supporter info.

### Connections / Third-Party Services
- Typeform
- Jotform
- Google Forms
- Zapier
- Make
- Airtable
- DocuSign / Adobe Sign
- Google Sheets

## APIs Needed
- Form Builder API
- Form Submission API
- Workflow API
- Workflow Trigger API
- Approval API
- Automation Action API

## System Flow
1. Church admin opens the Forms & Workflow Automation Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Forms & Workflow Automation Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
forms_workflow_automation_module
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

forms_workflow_automation_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

forms_workflow_automation_module_settings
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
GET    /api/forms-workflow-automation - List all tenant records (paginated, filtered)
POST   /api/forms-workflow-automation - Create a record under X-Tenant-ID
GET    /api/forms-workflow-automation/:id - Fetch single tenant-isolated record
PATCH  /api/forms-workflow-automation/:id - Modify record details securely
DELETE /api/forms-workflow-automation/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Forms & Workflow Automation Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Forms & Workflow Automation Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- forms-workflow-automation.read
- forms-workflow-automation.create
- forms-workflow-automation.update
- forms-workflow-automation.delete
- forms-workflow-automation.manage_settings
- forms-workflow-automation.view_reports

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


---

# Prayer & Testimony Module

## Description
Provides a dedicated prayer and testimony environment where churches can organize corporate prayer sessions, manage individual prayer requests, collect testimonies, moderate public prayer engagement, assign pastoral follow-up, and track member participation.

## Plain-English Overview
The Prayer & Testimony Module is a dedicated spiritual engagement module designed to help churches organize, guide, monitor, and strengthen prayer participation across the church community. It gives prayer and testimony their own visible structure within the platform. It allows churches to create corporate prayer sessions, schedule repeated prayer times, notify members, load scripture-based prayer points, guide live prayer participation, receive personal prayer requests, assign pastoral care follow-up, and publish testimonies in an organized and moderated way.

## Section Context
Section D: Member, Community & Engagement

## Core Features (with Tooltips)
- **Corporate prayer sessions**: Allows churches to create organized prayer gatherings that members can join from the website or mobile app.
- **Dedicated prayer room interface**: A custom prayer environment designed specifically for prayer, separate from normal meetings or livestreams.
- **Multiple prayer times**: Allows churches to schedule prayer sessions at different times, such as 5:00 AM daily or weekly chains.
- **Recurring prayer schedules**: Supports daily, weekly, monthly, or custom recurring prayer patterns.
- **Prayer reminders**: Sends reminders before prayer begins through push notifications, SMS, email, WhatsApp, or in-app alerts.
- **Prayer alarms**: Allows members to receive stronger alarm-style alerts for prayer times.
- **Live prayer participation counter**: Shows how many people are currently connected and praying.
- **“I Prayed” button**: Allows participants to confirm that they actually participated or completed the prayer session.
- **Prayer reactions**: Allows members to respond with simple engagement reactions such as Amen, I’m praying, or Praise God.
- **Prayer completion tracking**: Distinguishes between users who only joined the prayer room and users who confirmed participation.
- **Public / Private visibility control**: Allows members to hide their public presence while still allowing admins to view participation.
- **Prayer session leader**: Allows an admin to assign a prayer leader for a session.
- **Leader audio broadcast**: Allows the prayer leader to speak to all connected participants during a prayer session.
- **Leader video broadcast**: Allows the prayer leader’s video to appear on screen when guiding the session.
- **Leader flow control**: Allows the leader to pause background music, mute participant audio, pause prayer point scrolling, and address participants.
- **Temporary leader delegation**: Allows admins to delegate prayer leadership to a specific member and revoke it.
- **Participant audio option**: Allows participants to enable audio so voices of people praying can be heard.
- **Participant audio privacy control**: Requires user-side activation before participant audio can be heard.
- **Mute all participants**: Allows the leader or admin to mute participant audio during instructions or scripture reading.
- **Prayer session moderation**: Allows admins or leaders to manage disruptive participation, mute users, or remove participants.
- **Prayer point creation**: Allows admins or prayer leaders to create prayer points before or during a session.
- **Scripture-based prayer points**: Every prayer point can be linked to one or more Bible scriptures.
- **Prayer point categories**: Organizes prayer points by theme such as healing, salvation, family, finances, or missions.
- **Prayer point display**: Displays prayer points on screen during an active prayer session.
- **Scrolling prayer points**: Prayer points can scroll like credits, move side-to-side, fade in and out, or appear as slides.
- **Manual prayer point control**: Users or leaders can manually scroll through prayer points during the session.
- **Leader-controlled prayer points**: A prayer leader can control which prayer point is currently displayed for everyone.
- **Prayer point timing**: Assigns durations or time blocks to prayer points within a session.
- **Prayer point scripture pop-up**: Members can open the linked scripture without leaving the prayer room.
- **Preset background music library**: Allows churches to choose from approved instrumental worship or prayer background tracks.
- **Custom background music upload**: Allows churches to upload their own prayer background music.
- **Music volume control**: Allows users or leaders to adjust background music volume.
- **Leader music control**: Allows the prayer leader to pause, resume, or lower music volume when speaking.
- **Session-level music settings**: Allows each prayer session to define its own background audio.
- **Prayer request submission**: Allows members or visitors to submit prayer needs.
- **Private prayer requests**: Sends the request only to approved pastoral care or prayer teams.
- **Public prayer requests**: Allows the request to appear on a moderated prayer wall.
- **Anonymous prayer requests**: Allows a user to submit a request without public identity display.
- **Prayer request categories**: Organizes requests by healing, family, salvation, finances, or direction.
- **Care team assignment**: Assigns prayer requests to pastors, prayer team members, or care agents.
- **Pastoral oversight**: Allows pastors or assigned leaders to monitor prayer requests and follow-up status.
- **Follow-up reminders**: Sends reminders to assigned care agents to follow up on prayer requests.
- **Prayer request status**: Tracks whether a request is new, assigned, followed up, answered, or archived.
- **Testimony submission**: Allows members to submit written, audio, or video testimonies.
- **Text testimonies**: Supports written testimonies.
- **Audio testimonies**: Allows users to upload or record audio testimonies.
- **Video testimonies**: Allows users to upload or record video testimonies.
- **Testimony moderation**: Allows admins to review, approve, reject, edit, or request changes before publishing.
- **Testimony categories**: Organizes testimonies by healing, salvation, provision, protection, or family.
- **Testimony archive**: Stores testimonies in an organized searchable archive.
- **Testimony wall**: Displays selected testimonies in a public or member-facing wall.
- **Featured testimonies**: Highlights specific testimonies on the homepage, app, or service page.
- **Testimony media library**: Stores approved testimony audio/video content in connection with the Media Module.
- **Prayer media library**: A collection of short teachings, videos, clips, and resources about prayer.
- **Prayer training videos**: Helps members learn about the power, purpose, and practice of prayer.
- **Prayer resource categories**: Organizes media by prayer basics, intercession, fasting, or praying with scripture.
- **Recommended prayer media**: Suggests relevant media based on prayer session theme or user activity.

## Adaptations
- Can serve as a simple prayer request and testimony wall for small churches
- Can become a full corporate prayer room system for larger churches
- Can support daily prayer programs, fasting campaigns, prayer chains, and special prayer seasons
- Can connect corporate prayer sessions to church-wide notifications and alarms
- Can connect individual prayer requests to pastoral care workflows
- Can connect testimonies to public encouragement, media archives, and worship/service pages
- Can support privacy-sensitive prayer requests while still giving admins proper oversight
- Can support online prayer meetings without using a generic meeting UI
- Can support prayer leaders with temporary delegation and session flow control
- Can support cell groups, departments, branches, and global prayer sessions
- Can track spiritual engagement through participation, prayer confirmations, testimonies, and answered prayer reports

## Relationships & Integrations
### Integrates With
- **Live Chat, Pastoral Care & Support Module**: Private prayer requests can become pastoral care cases assigned to care agents.
- **Communication, Notification & Follow-Up Module**: Sends reminders, alerts, alarms, notifications, and care reminders.
- **Ministry CRM Module**: Prayer requests, testimonies, answered prayers, and follow-up activities are logged in CRM timelines.
- **Member Management Module**: Prayer participation, requests, testimonies, and group involvement are connected to member profiles.
- **Bible & Scripture Engagement Module**: Prayer points are scripture-based and link to Bible references.
- **Media Module**: Prayer background music, teachings, and testimony media are stored and played through Media.
- **Live Meetings Module**: Uses underlying meeting/audio/video infrastructure while maintaining a prayer-specific UI.
- **Worship Experience Module**: Background worship music or instrumental tracks are consumed from worship libraries.
- **Cell / Fellowship Module**: Cells and groups can create group prayer sessions and track participation.
- **Church Services Module**: Prayer sessions can be linked to pre-service, post-service, or altar call prayers.
- **Livestream Module**: Livestream viewers can be invited into prayer sessions or submit prayer requests.
- **Salvation & New Believer Journey Module**: New believers receive prayer follow-up, join prayer rooms, and submit requests.
- **Analytics & Reporting Module**: Tracks prayer participation, request volume, confirmations, and answered prayer trends.
- **Mobile App Access Module**: Members join prayer sessions, receive alarms, and view testimonies from the mobile app.

### Connections / Third-Party Services
- LiveKit
- Jitsi
- Zoom SDK
- Daily.co
- Twilio Conversations
- Twilio Voice
- Agora
- Pusher
- Ably
- Firebase Cloud Messaging
- OneSignal
- SendGrid
- Mailgun
- Resend
- WhatsApp Business Platform
- Cloudinary
- AWS S3
- Cloudflare R2
- Mux
- Vimeo
- YouTube
- OpenAI

## APIs Needed
- Prayer Session API
- Corporate Prayer Room API
- Prayer Schedule API
- Prayer Reminder API
- Prayer Alarm API
- Prayer Point API
- Prayer Point Scripture API
- Prayer Participant API
- Prayer Participation Confirmation API
- “I Prayed” API
- Prayer Reaction API
- Prayer Leader Delegation API
- Prayer Leader Broadcast API
- Participant Audio Permission API
- Background Music API
- Prayer Request API
- Prayer Request Assignment API
- Prayer Request Follow-Up API
- Testimony Submission API
- Testimony Moderation API
- Testimony Wall API
- Prayer Media Library API
- Prayer Analytics API
- Prayer Notification API

## System Flow
1. Church admin activates the Prayer & Testimony Module and configures global settings (visibility, moderation, reminder channels).
2. Admin or prayer leader creates corporate prayer sessions with recurrence rules, timezone, background music, and display settings.
3. Admin or prayer leader builds scripture-based prayer points for the session, linking them to Bible references.
4. The Communication Module schedules and sends reminders and alarms to the target audience via push notifications, SMS, or WhatsApp.
5. Members and visitors open the prayer room natively via the website or mobile app as the scheduled session begins.
6. The prayer room interface loads the real-time connected participant counter, preset background music, and initial prayer points.
7. The assigned prayer leader guides the session through audio/video broadcast, controls background music volume, and manages displayed prayer points.
8. Participants can enable their audio (if permitted), respond with reactions (Amen, I agree, Praise God), or open linked scriptures in pop-ups.
9. At the end of the session, participants click the “I Prayed” confirmation button to record their complete participation.
10. Members submit private or public prayer requests; private ones route to pastoral care, while public ones go to the moderated prayer wall.
11. Members submit testimonies (text, audio, or video) which enter a moderation queue for admin approval before wall publication.
12. The Analytics Module tracks participant counts, confirmations, reactions, and requests, updating CRM timelines and member profiles.

## Use Cases / Functional Scenarios
• **Daily Morning Prayer**: A church schedules a recurring "5:00 AM Morning Prayer" session. Members receive automated alarms before it starts, join the prayer room to pray along with scrolling scripture-based prayer points and background music, and click "I Prayed" at the end.
• **Prayer Leader Guides a Session**: An assigned leader hosts a live session. They use leader controls to pause background music, read scriptures over audio, scroll prayer points manually for all participants, and mute all participant audio during instruction.
• **Participant Audio Prayer**: The church allows participant voices in a corporate session. Members activate their microphones natively to pray together in the background, while the leader retains mute-all capability.
• **Scripture-Based Prayer Points**: During a session, a prayer point linked to James 5:16 is displayed. A member clicks the scripture reference, opening the Bible passage in a pop-up without exiting the active prayer room.
• **Private Prayer Request**: A member submits a sensitive private request. The system routes it directly to the pastoral care team and generates follow-up reminders for assigned care agents.
• **Public Prayer Request**: A member submits a request for healing. After moderation approval, it is published on the public prayer wall where other members can click "I prayed" or react with "Amen".
• **Testimony Submission**: A member records and submits a video testimony of physical healing. The testimony enters the moderation queue, where an admin reviews, approves, and features it on the Testimony Wall.
• **Featured Testimony Wall**: Admins select five powerful breakthrough testimonies to feature weekly, displaying them prominently on the homepage, mobile app, and service pages.
• **Cell Group Prayer**: A cell group leader schedules a dedicated fellowship prayer session. Cell members receive alerts and join the group-scoped prayer room natively from the cell page.
• **Fasting and Prayer Program**: A church schedules a 7-day fasting program. The system delivers daily custom prayer points, reminders, and background audio settings to participants while tracking daily "I Prayed" check-ins.

## Data Model
```text
prayer_testimony_module_settings
- id (UUID, PK)
- tenant_id (UUID, FK)
- module_key (VARCHAR)
- enabled (BOOLEAN)
- visibility_default (VARCHAR)
- allow_public_prayer_requests (BOOLEAN)
- allow_private_prayer_requests (BOOLEAN)
- require_prayer_request_moderation (BOOLEAN)
- require_testimony_moderation (BOOLEAN)
- allow_anonymous_prayer_requests (BOOLEAN)
- allow_participant_audio (BOOLEAN)
- allow_participant_video (BOOLEAN)
- default_background_music_id (UUID, FK)
- default_reminder_channels (JSON)
- config_json (JSON)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_sessions
- id (UUID, PK)
- tenant_id (UUID, FK)
- title (VARCHAR)
- slug (VARCHAR)
- description (TEXT)
- session_type (VARCHAR)
- visibility (VARCHAR)
- audience_type (VARCHAR)
- status (VARCHAR)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- duration_minutes (INT)
- timezone (VARCHAR)
- recurrence_rule (VARCHAR)
- prayer_leader_id (UUID, FK)
- created_by (UUID, FK)
- background_music_id (UUID, FK)
- prayer_point_display_mode (VARCHAR)
- allow_participant_audio (BOOLEAN)
- allow_participant_video (BOOLEAN)
- require_i_prayed_confirmation (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_session_leaders
- id (UUID, PK)
- tenant_id (UUID, FK)
- prayer_session_id (UUID, FK)
- leader_user_id (UUID, FK)
- delegated_by_user_id (UUID, FK)
- role (VARCHAR)
- can_broadcast_audio (BOOLEAN)
- can_broadcast_video (BOOLEAN)
- can_mute_participants (BOOLEAN)
- can_control_music (BOOLEAN)
- can_control_prayer_points (BOOLEAN)
- can_remove_participants (BOOLEAN)
- delegation_status (VARCHAR)
- starts_at (TIMESTAMP)
- ends_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_points
- id (UUID, PK)
- tenant_id (UUID, FK)
- prayer_session_id (UUID, FK)
- title (VARCHAR)
- body (TEXT)
- scripture_reference (VARCHAR)
- scripture_translation (VARCHAR)
- scripture_text_snapshot (TEXT)
- category_id (UUID, FK)
- display_order (INT)
- duration_seconds (INT)
- status (VARCHAR)
- created_by (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_point_categories
- id (UUID, PK)
- tenant_id (UUID, FK)
- name (VARCHAR)
- slug (VARCHAR)
- description (TEXT)
- color (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_session_participants
- id (UUID, PK)
- tenant_id (UUID, FK)
- prayer_session_id (UUID, FK)
- user_id (UUID, FK, nullable)
- member_id (UUID, FK, nullable)
- guest_id (UUID, FK, nullable)
- visibility_mode (VARCHAR)
- joined_at (TIMESTAMP)
- left_at (TIMESTAMP, nullable)
- duration_seconds (INT)
- audio_enabled (BOOLEAN)
- video_enabled (BOOLEAN)
- i_prayed (BOOLEAN)
- i_prayed_at (TIMESTAMP, nullable)
- participation_status (VARCHAR)
- device_type (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_reactions
- id (UUID, PK)
- tenant_id (UUID, FK)
- prayer_session_id (UUID, FK, nullable)
- prayer_request_id (UUID, FK, nullable)
- testimony_id (UUID, FK, nullable)
- user_id (UUID, FK)
- reaction_type (VARCHAR)
- created_at (TIMESTAMP)

prayer_background_music
- id (UUID, PK)
- tenant_id (UUID, FK)
- title (VARCHAR)
- media_asset_id (UUID, FK)
- source_type (VARCHAR)
- duration_seconds (INT)
- loop_enabled (BOOLEAN)
- visibility (VARCHAR)
- uploaded_by (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_requests
- id (UUID, PK)
- tenant_id (UUID, FK)
- submitted_by_user_id (UUID, FK, nullable)
- submitted_by_member_id (UUID, FK, nullable)
- submitted_by_guest_id (UUID, FK, nullable)
- title (VARCHAR)
- body (TEXT)
- category_id (UUID, FK)
- privacy_level (VARCHAR)
- is_anonymous_publicly (BOOLEAN)
- status (VARCHAR)
- urgency_level (VARCHAR)
- assigned_team_id (UUID, FK, nullable)
- assigned_user_id (UUID, FK, nullable)
- source_type (VARCHAR)
- source_id (UUID, nullable)
- follow_up_required (BOOLEAN)
- follow_up_status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_request_followups
- id (UUID, PK)
- tenant_id (UUID, FK)
- prayer_request_id (UUID, FK)
- assigned_user_id (UUID, FK)
- follow_up_type (VARCHAR)
- notes (TEXT)
- status (VARCHAR)
- reminder_at (TIMESTAMP)
- completed_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

testimonies
- id (UUID, PK)
- tenant_id (UUID, FK)
- submitted_by_user_id (UUID, FK, nullable)
- submitted_by_member_id (UUID, FK, nullable)
- title (VARCHAR)
- body (TEXT)
- testimony_type (VARCHAR)
- media_asset_id (UUID, FK, nullable)
- category_id (UUID, FK)
- visibility (VARCHAR)
- status (VARCHAR)
- featured (BOOLEAN)
- featured_until (TIMESTAMP, nullable)
- approved_by (UUID, FK, nullable)
- approved_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

testimony_categories
- id (UUID, PK)
- tenant_id (UUID, FK)
- name (VARCHAR)
- slug (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

testimony_wall_items
- id (UUID, PK)
- tenant_id (UUID, FK)
- testimony_id (UUID, FK)
- display_order (INT)
- wall_section (VARCHAR)
- starts_at (TIMESTAMP)
- ends_at (TIMESTAMP)
- status (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_media_items
- id (UUID, PK)
- tenant_id (UUID, FK)
- title (VARCHAR)
- description (TEXT)
- media_asset_id (UUID, FK)
- category_id (UUID, FK)
- visibility (VARCHAR)
- status (VARCHAR)
- created_by (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

prayer_session_analytics
- id (UUID, PK)
- tenant_id (UUID, FK)
- prayer_session_id (UUID, FK)
- total_joined (INT)
- total_i_prayed (INT)
- total_reactions (INT)
- total_prayer_requests (INT)
- total_duration_seconds (INT)
- peak_connected (INT)
- analytics_json (JSON)
- created_at (TIMESTAMP)
```

## API Playground / Suggested Endpoints
```text
GET    /api/prayer-testimony - List all tenant records (paginated, filtered)
POST   /api/prayer-testimony - Create a record under X-Tenant-ID
GET    /api/prayer-testimony/:id - Fetch single tenant-isolated record
PATCH  /api/prayer-testimony/:id - Modify record details securely
DELETE /api/prayer-testimony/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
**Admin Experience:**
• **Module Control**: Toggle the module status and configure settings (e.g. require moderation, visibility rules, reminder channels).
• **Prayer Schedules**: Build corporate prayer schedules, set recurring times, and assign leaders.
• **Prayer Points & Music**: Upload background tracks and create scripture-based prayer points with time allocations and pop-up Bible verses.
• **Review & Moderation**: Approve/reject public prayer requests and testimony submissions (text, audio, or video) before publication.
• **Follow-Up & CRM**: Assign sensitive prayer cases to care teams, configure alerts, and log interactions on member CRM timelines.
• **Featured Testimony Wall**: Drag and drop testimonies to organize the Featured Testimony Wall.
• **Analytics Dashboards**: Review participation metrics, reaction volume, peak connected counts, and answered prayer trends.

**Prayer Leader Experience:**
• **Live Broadcast Room**: Speak to participants and broadcast video directly inside the native digital prayer room.
• **Flow Control**: Pause or adjust background music volume, mute all participant audio, and control scrolling or slides of displayed prayer points.
• **Participant Overview**: Monitor connected users, see real-time reactions (Amen, Praise God), and encourage prayer flow.

### Member Experience
**Member Experience:**
• **Join Live Prayer Rooms**: Access a custom native interface to participate in scheduled prayer meetings with soft instrumental music, scrolling prayer points, and scripture overlays.
• **Live Reactions & Audio**: Click "Amen", "Praise God", or "I agree" during prayer. Toggle microphone on (if leader-allowed) to add voices to corporate prayer with absolute privacy controls.
• **Confirmation**: Confirm participation using the "I Prayed" button at the end of sessions.
• **Prayer Wall**: Submit public or anonymous prayer requests, browse the community prayer wall, and click "I Prayed" on others requests.
• **Testimony Submission & Wall**: Share written, audio, or video testimonies, and view inspiring featured stories on the Testimony Wall.
• **Prayer Teachings**: Watch or listen to short teachings and resource materials from the prayer media library.

**Public / Visitor Experience:**
• **Submit Prayer Needs**: Quickly submit requests and contact details for pastoral support and prayer team follow-up.
• **View Public Walls**: Browse approved testimonies and public prayer requests to see what God is doing.
• **Flexible Room Entry**: Join public rooms freely or register to enter based on the church settings.

## Permissions
- prayer-testimony.read
- prayer-testimony.create
- prayer-testimony.update
- prayer-testimony.delete
- prayer-testimony.manage_settings
- prayer-testimony.view_reports

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


---

# Salvation, Discipleship & Training

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


---

# LMS & Discipleship Training Module

## Description
Allows churches to build structured courses with lessons, videos, quizzes, tests, progress tracking, certificates, and graduation workflows.

## Plain-English Overview
The LMS & Discipleship Training Module allows churches to create structured courses for new members, discipleship, foundational classes, leadership training, ministry school, volunteer onboarding, and other teaching programs. It should support courses, modules, lessons, videos, audio, PDFs, quizzes, tests, assignments, progress tracking, certificates, graduation status, and integration with member records. This module is especially important for taking new believers and new members through a complete training journey.

## Section Context
Section E: Salvation, Discipleship & Training

## Core Features (with Tooltips)
- **Course creation**: Tools for the church to build their own online curriculum like Foundation School or Leadership Training.
- **Course modules**: Broad folders organizing a 12-week course into smaller, logical sections.
- **Lessons**: The individual learning pages containing the actual teaching content for the student to consume.
- **Video lessons**: Support for embedding 20-minute teaching videos as the primary requirement for completing a lesson.
- **Audio lessons**: Support for podcast-style teaching files for students who prefer to listen while commuting.
- **PDFs**: Downloadable worksheets, reading materials, or syllabi attached directly to the course.
- **Quizzes**: Short, multiple-choice tests at the end of a lesson to verify the student understood the material.
- **Tests**: Longer, comprehensive exams required to pass the module or graduate the overall course.
- **Assignments**: Homework tasks requiring the student to write an essay or upload a file for the instructor to review.
- **Progress tracking**: Visual percentage bars showing the student exactly how much of the course they have completed.
- **Course enrollment**: The process of adding a member to a class, either manually by an admin or via self-registration.
- **Certificates**: Beautiful, automatically generated PDF diplomas awarded to the student upon successful graduation.
- **Graduation status**: A tag added to the member’s CRM profile proving they have completed the required training.
- **Instructor dashboard**: A portal for teachers to grade assignments, message students, and track class completion rates.
- **Student dashboard**: A private hub where the learner can see their active courses, grades, and upcoming lessons.
- **Course reminders**: Automated emails nudging students who haven’t logged in to finish their remaining lessons.
- **Completion reports**: High-level analytics showing the church how many members are actually finishing the discipleship track.

## Adaptations
- Can be used for new member classes, foundation school, discipleship, leadership training, volunteer onboarding, ministry school, and youth training
- Can connect to salvation journey
- Can use media and digital library content
- Can update member and CRM milestones
- Can issue certificates after completion

## Relationships & Integrations
### Integrates With
- **Media Module**: Lessons can use videos, audio, PDFs, and downloads.
- **Member Management Module**: Students are members or registered users.
- **Salvation & New Believer Journey Module**: New believers can be automatically enrolled.
- **Bible & Scripture Engagement Module**: Lessons can include scripture reading.
- **Communication, Notification & Follow-Up Module**: Sends reminders, progress updates, and completion notices.
- **Ministry CRM Module**: Course progress updates member journey stages.

### Connections / Third-Party Services
- Vimeo / Mux / YouTube
- Cloudinary / S3 / R2
- Zoom / Google Meet / LiveKit / Jitsi
- OpenAI / AI providers
- DocuSign / PDF generation
- SCORM/xAPI tools

## APIs Needed
- Course API
- Lesson API
- Enrollment API
- Progress API
- Quiz API
- Certificate API
- Graduation API

## System Flow
1. Church admin opens the LMS & Discipleship Training Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates LMS & Discipleship Training Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
lms_discipleship_training_module
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

lms_discipleship_training_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

lms_discipleship_training_module_settings
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
GET    /api/lms-discipleship-training - List all tenant records (paginated, filtered)
POST   /api/lms-discipleship-training - Create a record under X-Tenant-ID
GET    /api/lms-discipleship-training/:id - Fetch single tenant-isolated record
PATCH  /api/lms-discipleship-training/:id - Modify record details securely
DELETE /api/lms-discipleship-training/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for LMS & Discipleship Training Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with LMS & Discipleship Training Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- lms-discipleship-training.read
- lms-discipleship-training.create
- lms-discipleship-training.update
- lms-discipleship-training.delete
- lms-discipleship-training.manage_settings
- lms-discipleship-training.view_reports

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


---

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


---

# Cell / Fellowship Module

## Description
Manages cell groups, home fellowships, and small groups either as standalone units or through a structured 3-level parent-child hierarchy (Master, Super Cell, Cell / PCU / PCF) featuring secure Member-Only Notice Boards, LMS course training prerequisites, strict single-cell exclusivity, and automated cross-platform giving attribution.

## Plain-English Overview
The Cell / Fellowship Module allows churches to create, organize, and manage cell groups, fellowship groups, small groups, and home fellowships either as standalone groups or inside a structured 3-level parent-child hierarchy. It implements three levels of organization: 1. Master Cell (Pastoral Care Unit / Fellowship - PCU/PCF), 2. Super Cell (previously Senior Cell), and 3. Cell (previously Regular/Subcell), enabling group leaders and assistants to advance through pioneering metrics (Cell -> Super -> Master) validated by an Accreditation Scorecard based on Cell Attendance, Giving Records, and Outreach Activities. It also enforces strict single-cell exclusivity, dynamic cross-platform giving-to-cell attribution, and secure Member-Only Cell Notice Boards with multi-level read/write permission routing and administrative delegation.

## Section Context
Section E: Salvation, Discipleship & Training

## Core Features (with Tooltips)
- **Cell creation**: Tools to officially register a new small group, setting its name, location, and meeting times.
- **Cell leader assignment**: Formally tagging a specific member as the pastoral head of a cell group.
- **Member assignment**: Routing logic that adds congregants into the roster of a specific local cell.
- **Cell meeting schedules**: Calendars showing exactly when the cell gathers weekly or monthly.
- **Physical location**: Address data and Google Maps links showing where an in-person cell meets.
- **Online meeting link**: Integrated Zoom or Jitsi URLs for cells that gather virtually.
- **Cell attendance**: Mobile-friendly rosters allowing leaders to instantly log who showed up to the meeting.
- **Cell reports**: Administrative dashboards showing the health, growth, and consistency of the small group network.
- **Cell communication**: Internal messaging tools allowing the leader to email or text their specific members.
- **Cell growth tracking**: Analytics measuring how many new visitors are joining and staying in the cell.
- **Cell resources**: A private file area where leaders can download weekly study guides or training PDFs.
- **Cell invite links**: Unique URLs leaders can share to help new people find and join their specific group.
- **Cell worship integration**: Built-in tools allowing the cell to launch a worship session directly from their portal.
- **3-level group hierarchy setup (Master, Super Cell, Cell / PCU / PCF)**: The overarching structure allowing cells to multiply into larger zones and districts.
- **Optional single-level standalone Cell configuration support**: A simpler setup allowing churches to run basic small groups without complex hierarchies.
- **Auto-numbered cell naming rules (e.g. Dunamis Cell 1, Dunamis Cell 2)**: Automated logic that neatly labels new cells as they split from a parent group.
- **Custom group naming overrides (e.g. Impact Cell)**: Allows admins to manually assign unique, un-numbered names to specific special groups.
- **Cell Leader & Assistant Cell Leader role assignment**: Permissions granting the primary and backup leaders access to manage their group’s roster.
- **Super Cell Leader & Assistant Super Cell Leader role assignment**: Elevated access allowing regional leaders to oversee multiple nested cells.
- **Master Cell Leader & Assistant Master Cell Leader role assignment**: Top-tier access allowing district pastors to oversee entire zones of super cells.
- **LMS Cell Ministry Leadership Course completion validation gate**: Security rules preventing a member from becoming a leader until they pass their required training.
- **Cell Leader certified eligibility status tracking**: Visual badges showing which members are fully qualified to pioneer a new group.
- **Cell member strict single-cell exclusivity validation**: Data rules ensuring a member can only belong to one primary cell at a time.
- **Automatic cross-platform giving-to-cell attribution engine**: Logic that automatically credits a member’s Sunday tithe toward their cell’s financial scorecard.
- **Secure Member-Only Cell Notice Board interface**: A private digital bulletin board where only verified cell members can see announcements.
- **Notice Board announcement, alert, and messaging threads**: Communication tools for the leader to post urgent updates or weekly recaps.
- **Digital Library Cell outline file distribution (PDF study guides)**: The secure delivery of the weekly sermon discussion questions to the leader’s dashboard.
- **Core Media Module sermon video and audio embedding**: Tools to watch or listen to the previous Sunday’s message directly inside the cell portal.
- **External resource embedding (YouTube, Vimeo, custom urls)**: Allows leaders to post supplementary third-party videos to their group’s notice board.
- **Cell Member Read-Only notice board access enforcement**: Security ensuring regular members can view but not alter the official group announcements.
- **Super Cell Leader Read/Write access over nested cell boards**: Allows regional overseers to post messages into the notice boards of all cells under them.
- **Master Cell Leader Read/Write access over regional cell boards**: Allows district pastors to broadcast announcements down to all cells in their zone.
- **Delegated Administrator notice board write permission overrides**: Allows central church staff to post mandatory global updates to all cell boards simultaneously.
- **Cell level attendance logging & check-in triggers**: The interface where leaders submit their weekly headcount, feeding data back to the central CRM.
- **Cell meeting minutes and report submission wizard**: A structured form where the leader types a summary of how the meeting went.
- **Weekly / monthly cell meeting scheduler**: Automated tools that generate the upcoming meeting events on the church calendar.
- **Physical cell venue geocoding and interactive maps**: Processes that convert a host’s address into map pins so new visitors can easily find the house.
- **Online virtual cell meeting rooms (Zoom, LiveKit, Jitsi integration)**: The technology bridge allowing a cell to host their fellowship via video call natively.
- **Unique cell invite link generation with member attribution**: Links that track exactly which cell member invited a new guest.
- **Visitor invite link click tracking and signup conversions**: Analytics showing how effective a cell’s digital outreach efforts have been.
- **Automatic cell placement on visitor invitation registration**: Logic that instantly adds a new guest to the roster of the cell that invited them.
- **Cell Attendance Accreditation Scorecard metrics (>75% rate)**: An algorithm that calculates if the cell is healthy enough to qualify for leader promotion.
- **Cell Giving Accreditation Scorecard consistency check**: Analytics ensuring the cell members are financially contributing, used as a health metric.
- **Cell Outreach Accreditation Scorecard conversion counts**: Metrics tracking how many souls the cell has won, used for leadership evaluations.
- **Automatic "Eligible for Promotion" recommendation flags**: System alerts notifying the central pastor when a leader has met all multiplication requirements.
- **Dedicated Pastor-authorized System Administrator promotion wizard**: The secure workflow used to officially upgrade a leader’s rank in the system.
- **Cell Leader to Super Cell Leader promotion metric (25 Cells x 25 Members)**: The hard-coded growth target required before a cell leader can oversee a region.
- **Super Cell Leader to Master Cell Leader promotion metric (25 Super Cells x 25 Cells)**: The massive growth target required before an overseer becomes a district master.
- **Historical group lineage tree and multiplication lines visualization**: A visual family tree showing how one original cell split and birthed dozens of others over time.
- **Inactive cell member notification warnings**: Alerts sent to the leader when a specific member misses three meetings in a row.
- **Central regional cell directory searching & filtering**: A tool for central admins to easily find and audit any cell group in the global network.
- **Household and family cell group grouping supports**: Logic ensuring husbands and wives are mapped correctly within the same fellowship group.
- **Central admin hierarchical cell tree dashboard mapping**: The top-level bird’s-eye view allowing the Senior Pastor to see the entire organization.
- **Geographical cell location density heatmaps**: Visual maps showing where the church has a high concentration of cells and where they need to plant more.

## Adaptations
- Can assign new believers to nearby or online cells
- Can launch live meetings for cell groups
- Can use Worship Experience Module during cell meetings
- Can track cell attendance and reports
- Can help churches grow through smaller groups
- Can support small startup ministries with simple standalone cells
- Can scale to international ministries with thousands of hierarchical cell networks
- Can consolidates multi-level attendance, giving, and outreach analytics automatically
- Can allow custom naming conventions (Master/Super/Cell or PCU/PCF) per branch or campus
- Can configure custom auto-naming rules (numbered or descriptive) per tenant
- Can support localized privacy controls for group leaders and members
- Can delegate approval workflows for cell multiplication and promotion to local branch admins
- Can integrate with bring-your-own-video-provider for virtual cell meetings
- Can override standard growth metrics (25 members, 25 cells) based on local regional sizes

## Relationships & Integrations
### Integrates With
- **Member Management Module**: Provides strict single-cell exclusivity: members belong to exactly one cell or none, forming clear local fellowship links.
- **LMS & Discipleship Training Module**: Validates LMS "Cell Ministry Leadership Course" completion before certifying members as eligible Cell Leaders.
- **Member Outreach & Invite Campaign Module**: Attributes visitor conversions via member invite links, automatically placing new signups into the inviting Cell.
- **Tithes & Offerings Module**: Automatically attributes member donations, tithes, and offerings to their active Cell across all services, events, or livestreams.
- **Check-In & Attendance Management Module**: Tracks cell check-ins and logs weekly meeting attendance for the promotion Accreditation Scorecard.
- **Live Meetings Module**: Launches virtual cell meetings directly using integrated interactive video and audio rooms.
- **Worship Experience Module**: Allows cell leaders to stream synchronized lyrics and backing tracks during fellowship worship.
- **Ministry CRM Module**: Feeds attendance milestones, giving records, and outreach activities into member engagement scores.
- **Communication, Notification & Follow-Up Module**: Sends automated cell alerts, notice board notifications, and outline downloads to cell members.
- **Salvation & New Believer Journey Module**: Recommends and automatically connects new converts to the nearest geographical or virtual Cell.
- **Multi-Branch / Multi-Campus Management Module**: Coordinates regional Master Cell structures, regional naming standards, and local branch leader assignments.
- **Analytics & Reporting Module**: Consolidates hierarchical attendance, giving consistency, and outreach metrics for Pastor-authorized promotion reviews.

### Connections / Third-Party Services
- Google Maps Platform
- Zoom / Google Meet / Jitsi / LiveKit
- Twilio / SendGrid / WhatsApp
- Google Calendar / Outlook Calendar
- Worship Experience integration
- Analytics tools

## APIs Needed
- Group API
- Group Type API
- Group Member API
- Group Meeting API
- Group Attendance API
- Group Invite Link API
- Group Invite Conversion API
- Group Hierarchy API
- Master Cell API
- Super Cell API
- Cell API
- Leadership Promotion API
- Notice Board API
- Accreditation Scorecard API

## System Flow
1. Church Admin enables the Cell / Fellowship Module in settings.
2. Admin defines the group structure types corresponding to the 3-level hierarchy (Master Cell / PCU / PCF, Super Cell, Cell) or selects a simple single-level Cell configuration.
3. Admin configures tenant-level naming rules (auto-numbered e.g. "Dunamis Cell {N}" or custom name overrides).
4. Church members register, enroll in, and pass the "Cell Ministry Leadership Course" in the LMS Module to certify their leadership eligibility.
5. Eligible certified Cell Leaders and Assistant Leaders are assigned to their respective Groups.
6. Master Cells (PCU/PCF) and Super Cells are provisioned, establishing parent-child links (parent_id) in the hierarchy.
7. Leaders assign members to Cells, ensuring strict single-cell exclusivity (exactly one active cell per member).
8. The system provisions a secure, member-only Notice Board for each Cell, pre-populating it with outline downloads and external video links.
9. Unique cell-specific invite links are generated with member attribution tokens for outreach campaigns.
10. Members share invite links; a visitor clicks an invite link, opening a personalized invitation page.
11. Visitor registers, and the system records conversion attribution under the outreach scorecard.
12. System automatically places the visitor in the inviting Cell group and sends a notification alert to the leader.
13. Weekly cell fellowships take place (virtual meetings launch via Jitsi/LiveKit, loading lyrics via the Worship Experience).
14. Attendance is logged (QR check-in or manual roster), updating the cell's average attendance rate.
15. Member donations made anywhere on the platform (livestream, services, events) are automatically attributed to their active Cell giving history.
16. System continuously analyzes the Cell's Accreditation Scorecard (growth counts, attendance rate, giving records, outreach conversions).
17. When a Cell meets growth metrics (25 members for Cell, 25 cells for Super Cell) and accreditation thresholds, the system flags it as "Accredited & Recommended for Promotion", allowing a dedicated System Administrator to approve and execute the promotion on the authority of the Pastor.

## Use Cases / Functional Scenarios
• **Pioneering and Promoting a Cell Leader**: A Cell Leader successfully pioneers 25 new cells (each with at least 25 members) under their network. The system flags their eligibility, and a Pastor-authorized administrator executes their promotion to a Super Cell Leader.
• **Advancing a Super Cell Leader to Master Cell**: A Super Cell Leader successfully pioneers 25 super cells (each containing at least 25 cells) under their network. The system registers the metric, and the administrator executes their promotion to a Master Cell Leader.
• **Verifying LMS Course Prerequisites**: A Pastor attempts to assign a member as a Cell Leader. The system checks LMS completion records, blocks the assignment due to a missing certification, and prompts the member to complete the "Cell Ministry Leadership Course" first.
• **Attributing Member Outreach Invites**: A cell member shares a personalized invite QR code. A friend signs up, and the system automatically routes the new visitor into the member's Cell and logs an outreach conversion in the scorecard.
• **Tracking the Promotion Accreditation Scorecard**: A cell hits 25 members, but its average attendance is under 75% and giving consistency is low. The system holds the promotion recommendations, displaying a scorecard warning to the leader until the quality benchmarks are satisfied.
• **Executing Automatic Cross-Platform Giving Attribution**: A cell member gives an offering while watching the Sunday service livestream. The system resolves their member account, identifies their active Cell, and attributes the transaction to that Cell's giving records.
• **Configuring Simple Standalone Cells**: A smaller church activates the module but toggles off the 3-level structure. The platform adapts seamlessly, allowing them to manage standard standalone "Cells" [subcells] without parent hierarchies.
• **Accessing the Member-Only Secure Notice Board**: A member logs in to view cell notices. They download the weekly cell outline file and watch an embedded sermon recap video, while having read-only permissions on the notice board.
• **Hierarchical Write Permissions for Super Cell Leaders**: A Super Cell Leader accesses the notice boards of the 25 cell groups underneath their Super Cell, writing announcements and pinning alerts directly on their behalf.
• **Administrative Write Access Delegation**: A busy Cell Leader delegates notice board management to the cell secretary. The system updates the board's access control records, granting the secretary write access to post weekly cell outline updates.

## Data Model
```text
groups
- id (UUID, PK)
- tenant_id (UUID, FK)
- parent_id (UUID, FK, self-referential - PCU/Super/Cell hierarchy links)
- group_type_id (UUID, FK - Master, Super Cell, Cell)
- name (VARCHAR - e.g. Dunamis Cell 1)
- description (TEXT)
- status (VARCHAR - Active, Merged, Disbanded)
- leader_id (UUID, FK - active Cell/Super/Master leader)
- co_leader_id (UUID, FK - assistant leader)
- host_id (UUID, FK - venue host)
- location_geocoding (JSON - lat, lng, address)
- online_meeting_url (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

group_types
- id (UUID, PK)
- tenant_id (UUID, FK)
- name (VARCHAR - Master Cell [PCU/PCF], Super Cell, Cell)
- tier_level (INT - 1, 2, 3)
- max_members_threshold (INT - default 25)
- nested_cells_threshold (INT - default 25)
- created_at (TIMESTAMP)

group_members
- id (UUID, PK)
- tenant_id (UUID, FK)
- group_id (UUID, FK)
- user_id (UUID, FK - strict 1-to-many: at most one active cell per member)
- role (VARCHAR - Leader, Assistant, Host, Secretary, Member)
- joined_at (TIMESTAMP)
- status (VARCHAR - Active, Inactive, Transferred)

group_meetings
- id (UUID, PK)
- tenant_id (UUID, FK)
- group_id (UUID, FK)
- scheduled_at (TIMESTAMP)
- held_at (TIMESTAMP)
- topic (VARCHAR)
- study_guide_url (VARCHAR - PDF outlined files)
- notes (TEXT)
- attendance_count (INT)

group_attendance
- id (UUID, PK)
- tenant_id (UUID, FK)
- meeting_id (UUID, FK)
- user_id (UUID, FK)
- checked_in_at (TIMESTAMP)
- checked_in_by (UUID, FK)
- status (VARCHAR - Present, Absent, Excused)

group_invite_links
- id (UUID, PK)
- tenant_id (UUID, FK)
- group_id (UUID, FK)
- created_by_member_id (UUID, FK)
- token (VARCHAR, UNIQUE)
- custom_message (TEXT)
- clicks_count (INT)
- active (BOOLEAN)

group_invite_conversions
- id (UUID, PK)
- tenant_id (UUID, FK)
- invite_link_id (UUID, FK)
- visitor_user_id (UUID, FK)
- registered_at (TIMESTAMP)
- attribution_status (VARCHAR - Pending, Verified, Established)

group_notice_boards
- id (UUID, PK)
- tenant_id (UUID, FK)
- group_id (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

group_notice_posts
- id (UUID, PK)
- tenant_id (UUID, FK)
- board_id (UUID, FK)
- posted_by_user_id (UUID, FK)
- title (VARCHAR)
- content (TEXT)
- file_attachments_json (JSON - study guide PDFs, local resources)
- external_embeds_json (JSON - YouTube, Vimeo, Spotify audio)
- category (VARCHAR - Announcement, Alert, Sermon Outline, Video, Audio)
- created_at (TIMESTAMP)

group_promotions
- id (UUID, PK)
- tenant_id (UUID, FK)
- target_id (UUID, FK - group_id or user_id)
- type (VARCHAR - GroupLevelUp, LeaderLevelUp)
- old_value (VARCHAR)
- new_value (VARCHAR)
- scorecard_snapshot_json (JSON - attendance, giving, outreach stats)
- approved_by_admin_id (UUID, FK)
- pastor_authority_verified (BOOLEAN)
- executed_at (TIMESTAMP)

group_settings
- id (UUID, PK)
- tenant_id (UUID, FK)
- cell_size_limit (INT - default 25)
- super_cell_size_limit (INT - default 25)
- auto_naming_rule_enabled (BOOLEAN)
- hierarchy_deep_limit (INT - default 3)
```

## API Playground / Suggested Endpoints
```text
GET    /api/cell-fellowship - List all tenant records (paginated, filtered)
POST   /api/cell-fellowship - Create a record under X-Tenant-ID
GET    /api/cell-fellowship/:id - Fetch single tenant-isolated record
PATCH  /api/cell-fellowship/:id - Modify record details securely
DELETE /api/cell-fellowship/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Cell / Fellowship Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Cell / Fellowship Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- cell-fellowship.read
- cell-fellowship.create
- cell-fellowship.update
- cell-fellowship.delete
- cell-fellowship.manage_settings
- cell-fellowship.view_reports

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


---

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


---

# Events, Meetings & Interaction

# Events & Registration Module

## Description
Handles non-regular activities such as conferences, seminars, workshops, crusades, concerts, retreats, special programs, RSVPs, and tickets.

## Plain-English Overview
The Events & Registration Module handles special activities that are not regular weekly services. These may include conferences, seminars, crusades, workshops, retreats, leadership meetings, trainings, concerts, special programs, and ministry gatherings. The module should support event pages, RSVPs, registration forms, tickets, reminders, QR check-ins, event media, event reports, and optional links to livestreams or meetings.

## Section Context
Section F: Events, Meetings & Interaction

## Core Features (with Tooltips)
- **Event pages**: Beautiful landing pages detailing the date, location, speakers, and schedule of an upcoming conference.
- **Event categories**: Organizational folders grouping events (e.g., "Youth Events", "Leadership Trainings").
- **Registration forms**: Customizable data collection flows asking attendees for meal preferences or t-shirt sizes.
- **RSVP**: Simple 1-click confirmation buttons for free, internal meetings where no complex registration is required.
- **Ticketing**: The generation of unique PDF tickets with scannable QR codes for entry verification.
- **Free/paid events**: Configuration options allowing the church to sell access or offer it complimentary.
- **QR check-ins**: The door management tool allowing ushers to scan tickets using their smartphones to mark people present.
- **Event reminders**: Automated emails sent 24 hours before the event with parking instructions and schedule details.
- **Event calendar**: A global, searchable schedule displaying all upcoming church activities on the website.
- **Event media**: Photo galleries and promo videos attached directly to the event’s registration page.
- **Event livestream link**: Tools to attach a private, ticketed livestream broadcast exclusively for paid virtual attendees.
- **Event meeting link**: Integrated Zoom URLs for smaller, interactive workshops or webinars.
- **Attendee lists**: Administrative dashboards showing exactly who has registered, paid, or cancelled.
- **Event reports**: Financial and attendance analytics showing the overall success and ROI of the conference.

## Adaptations
- Used for conferences, seminars, crusades, workshops, concerts, retreats, and special programs
- Separate from regular church services
- Can connect to funnels, payments, communication, media, attendance, livestream, meetings, and CRM
- Can support both physical and online events

## Relationships & Integrations
### Integrates With
- **Ministry Funnels & Landing Pages Module**: Events can have high-converting registration pages.
- **Media Module**: Events can include promotional images, videos, and replays.
- **Livestream Module**: Events can have livestreams.
- **Live Meetings Module**: Events can create meeting links.
- **Communication, Notification & Follow-Up Module**: Sends confirmations and reminders.
- **Check-In & Attendance Management Module**: Handles QR check-in.
- **Ministry CRM Module**: Event attendance updates contact history.

### Connections / Third-Party Services
- Google Calendar / Outlook Calendar
- Zoom / Google Meet / Jitsi / LiveKit
- Stripe / PayPal / Flutterwave / Paystack
- Eventbrite
- Twilio / SendGrid / Mailchimp
- Google Maps
- QR code scanning
- Cloudinary

## APIs Needed
- Event API
- Registration API
- Ticket API
- RSVP API
- Event Reminder API
- Event Check-In API

## System Flow
1. Church admin opens the Events & Registration Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Events & Registration Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
events_registration_module
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

events_registration_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

events_registration_module_settings
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
GET    /api/events-registration - List all tenant records (paginated, filtered)
POST   /api/events-registration - Create a record under X-Tenant-ID
GET    /api/events-registration/:id - Fetch single tenant-isolated record
PATCH  /api/events-registration/:id - Modify record details securely
DELETE /api/events-registration/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Events & Registration Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Events & Registration Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- events-registration.read
- events-registration.create
- events-registration.update
- events-registration.delete
- events-registration.manage_settings
- events-registration.view_reports

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


---

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


---

# Booking & Appointment Management Module

## Description
Allows members or visitors to book counselling, prayer, leadership, pastoral appointments, and other scheduled sessions.

## Plain-English Overview
The Booking & Appointment Management Module allows members, visitors, or staff to schedule appointments with pastors, counsellors, prayer teams, leaders, or ministry leaders. It should support availability calendars, appointment types, booking forms, confirmations, reminders, cancellation rules, meeting links, and private notes. This module is useful for pastoral care, prayer sessions, leadership, counselling, and administrative meetings.

## Section Context
Section F: Events, Meetings & Interaction

## Core Features (with Tooltips)
- **Appointment booking**: A calendar interface allowing members to self-schedule time with a pastor without calling the office.
- **Pastor/counsellor availability**: Tools for staff to block out specific hours (e.g., Tuesdays 1PM-4PM) for counseling.
- **Appointment types**: Pre-configured options like "Pre-Marital Counseling (60 min)" or "Quick Check-in (15 min)".
- **Booking forms**: Intake questionnaires requiring the member to explain the reason for the meeting before confirming.
- **Calendar view**: The internal admin dashboard showing a pastor’s daily, weekly, or monthly schedule at a glance.
- **Confirmation messages**: Automated emails sent instantly when the appointment is locked in.
- **Reminders**: Automated text messages sent 24 hours prior to reduce no-shows.
- **Cancellation rules**: Settings dictating how close to the meeting time a member is allowed to cancel or reschedule.
- **Rescheduling**: Easy, 1-click links empowering the member to pick a new time if an emergency arises.
- **Meeting link generation**: Automatically creates a Zoom or LiveKit URL if the appointment is marked as virtual.
- **Private notes**: Secure text fields where the pastor can review previous counseling history before the meeting begins.
- **Appointment status**: Tracking tags marking a session as "Completed", "No-Show", or "Follow-up Required".
- **Appointment reports**: Analytics showing which pastoral services are most requested by the congregation.

## Adaptations
- Can be used for counselling, leadership, prayer, pastoral meetings, and admin appointments
- Can connect to Live Meetings for online appointments
- Can connect to CRM and pastoral care
- Can trigger communication reminders
- Can restrict appointment types to specific staff roles

## Relationships & Integrations
### Integrates With
- **Live Meetings Module**: Online appointments can generate meeting links.
- **Live Chat, Pastoral Care & Support Module**: Care requests and chats can lead to scheduled appointments.
- **Ministry CRM Module**: Appointments become part of relationship history.
- **Communication, Notification & Follow-Up Module**: Sends appointment confirmations and reminders.
- **User & Role Management Module**: Only certain pastors or staff can accept appointment types.

### Connections / Third-Party Services
- Calendly
- Google Calendar
- Microsoft Outlook Calendar
- Zoom / Google Meet / LiveKit / Jitsi
- Twilio / SendGrid
- Stripe / PayPal

## APIs Needed
- Booking API
- Availability API
- Appointment Type API
- Calendar API
- Reminder API
- Appointment Status API

## System Flow
1. Church admin opens the Booking & Appointment Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Booking & Appointment Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
booking_appointment_management_module
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

booking_appointment_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

booking_appointment_management_module_settings
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
GET    /api/booking-appointment-management - List all tenant records (paginated, filtered)
POST   /api/booking-appointment-management - Create a record under X-Tenant-ID
GET    /api/booking-appointment-management/:id - Fetch single tenant-isolated record
PATCH  /api/booking-appointment-management/:id - Modify record details securely
DELETE /api/booking-appointment-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Booking & Appointment Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Booking & Appointment Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- booking-appointment-management.read
- booking-appointment-management.create
- booking-appointment-management.update
- booking-appointment-management.delete
- booking-appointment-management.manage_settings
- booking-appointment-management.view_reports

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


---

# Mobile & App Ecosystem

# Mobile App Access Module

## Description
Gives members access to the church platform through a mobile app, including media, giving, events, notifications, courses, and member features.

## Plain-English Overview
The Mobile App Access Module allows members to access the church platform through a mobile application. The app should provide access to sermons, livestreams, services, worship sessions, Bible tools, giving, partnerships, events, courses, notifications, prayer requests, groups, and member features. The first version can be a general platform app where users select their church, while advanced versions can support dedicated branded apps.

## Section Context
Section G: Mobile & App Ecosystem

## Core Features (with Tooltips)
- **Member login**: Secure authentication allowing users to sign into the church app using their phone number or email.
- **Church selection**: The initial screen where users search for and connect to their specific local church workspace.
- **Sermon access**: A mobile-optimized media player for watching or listening to past messages on the go.
- **Livestream access**: The ability to watch the live Sunday broadcast directly inside the app, complete with chat.
- **Service archive**: Easy navigation to browse past services and download study notes directly to the phone.
- **Worship sessions**: The portable worship engine allowing users to play synced lyrics and audio during their personal devotion time.
- **Bible access**: A native, offline-capable scripture reader integrated seamlessly into the app interface.
- **Notes**: A personal digital journal where users can type sermon notes and sync them to their cloud account.
- **Giving**: A frictionless, 1-click payment flow allowing members to securely tithe using Apple Pay or Google Pay.
- **Partnerships**: Portals for members to view their recurring giving goals and manage their payment methods.
- **Events**: A mobile calendar where users can browse upcoming conferences and buy tickets instantly.
- **Courses**: The mobile LMS interface allowing students to watch training videos and take quizzes from anywhere.
- **Push notifications**: Direct alerts sent to the user’s home screen, overriding email clutter for urgent updates.
- **Prayer requests**: Forms allowing users to quickly submit intercessory needs right from their pocket.
- **Chat**: Integrated messaging allowing members to contact the pastoral team or chat with their small group.
- **Groups/cells**: The mobile dashboard for small group leaders to take attendance and message their members.
- **Member profile**: Tools for the user to update their own address, photo, and notification preferences.
- **Deep links**: Specialized URLs that, when clicked in an email, automatically open the specific page inside the app.

## Adaptations
- Can begin as one main platform app where users select their church
- Can later support branded apps
- Can access the same APIs as the website
- Can provide a stronger daily engagement channel
- Can support mobile-first churches and members

## Relationships & Integrations
### Integrates With
- **Media Module**: Stream sermons and view media galleries.
- **Livestream Module**: Watch livestreams directly inside the app.
- **Church Services Module**: Access service archives and sermon series.
- **Worship Experience Module**: Open lyric singing and interactive playlists.
- **Bible & Scripture Engagement Module**: Read translations and complete reading plans.
- **Tithes & Offerings Module**: Give securely directly inside the mobile app.
- **Partnerships & Contributions Module**: Support specific ministry causes and partner levels.
- **Events & Registration Module**: Register for events and present QR tickets.
- **LMS & Discipleship Training Module**: Access discipleship academy and answer quizzes.
- **Communication, Notification & Follow-Up Module**: Receive real-time push notifications.
- **Live Chat, Pastoral Care & Support Module**: Ask questions and chat with care agents.
- **Cell / Fellowship Module**: Find local cells and fellowships.
- **Live Meetings Module**: Join Jitsi/LiveKit meetings directly from the app.
- **Member Outreach & Invite Campaign Module**: Share outreach invite links on social media.

### Connections / Third-Party Services
- Expo EAS Build
- Firebase Cloud Messaging
- Apple Push Notification Service
- Google Play Developer API
- Apple App Store Connect API
- RevenueCat
- Sentry
- PostHog / Firebase Analytics

## APIs Needed
- Mobile Auth API
- Tenant Config API
- Mobile Content API
- Push Notification API
- Mobile Module Access API
- Deep Link API

## System Flow
1. Church admin opens the Mobile App Access Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Mobile App Access Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
mobile_app_access_module
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

mobile_app_access_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

mobile_app_access_module_settings
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
GET    /api/mobile-app-access - List all tenant records (paginated, filtered)
POST   /api/mobile-app-access - Create a record under X-Tenant-ID
GET    /api/mobile-app-access/:id - Fetch single tenant-isolated record
PATCH  /api/mobile-app-access/:id - Modify record details securely
DELETE /api/mobile-app-access/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Mobile App Access Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Mobile App Access Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- mobile-app-access.read
- mobile-app-access.create
- mobile-app-access.update
- mobile-app-access.delete
- mobile-app-access.manage_settings
- mobile-app-access.view_reports

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


---

# Dedicated White-Label Church App Module

## Description
Creates a dedicated branded mobile app for a specific church using the same codebase but customized logo, colors, app icon, splash screen, and tenant settings.

## Plain-English Overview
The Dedicated White-Label Church App Module allows a church to have its own branded mobile app. The app should use the same underlying codebase but carry the church’s name, logo, colors, app icon, splash screen, tenant configuration, and church-specific content. This module should support Android and iOS builds, store-ready packages, push notifications, app configuration, and future app submission support.

## Section Context
Section G: Mobile & App Ecosystem

## Core Features (with Tooltips)
- **Dedicated branded app**: A completely standalone application published exclusively under the church’s own name on the App Store.
- **Church app name**: The specific title (e.g., "Grace Church Official") that appears on a user’s phone screen.
- **Church logo**: The custom graphics used universally throughout the app’s interface instead of ChurchOS branding.
- **App icon**: The graphical square users tap on their phone to open the application.
- **Splash screen**: The full-screen, branded loading image displayed for 2 seconds while the app boots up.
- **Custom colors**: Deep styling configuration ensuring the app’s buttons and menus perfectly match the church’s hex codes.
- **Tenant configuration**: The backend hard-coding that locks this specific app exclusively to the church’s database.
- **Push notification setup**: The developer certificates required to route alerts directly to this custom-branded app.
- **Android build**: The automated compilation of the .APK or .AAB file required for the Google Play Store.
- **iOS build**: The automated compilation of the .IPA file required for the Apple App Store.
- **Store listing metadata**: The text descriptions, screenshots, and privacy policies required to get the app approved by reviewers.
- **App build history**: A developer log showing previous versions of the app in case a rollback is needed.
- **App submission support**: Guided workflows helping the church navigate the complex Apple and Google review processes.
- **App update management**: The pipeline used to push new features or bug fixes to all users who have downloaded the app.

## Adaptations
- Uses one shared codebase but different tenant branding
- Can generate store-ready Android AAB/APK and iOS IPA packages
- Can be charged as a premium add-on
- Can allow churches to publish under their own developer accounts
- Can connect to mobile app access and notification systems

## Relationships & Integrations
### Integrates With
- **Domain & Tenant Management Module**: Each app is tied to a specific church tenant.
- **Theme Engine Module**: Uses church logo, colors, app icon, and splash screen.
- **Mobile App Access Module**: Uses the same core mobile app codebase.
- **Billing & Subscription Management Module**: White-label apps are premium paid subscription add-ons.
- **Communication, Notification & Follow-Up Module**: Branded push notification credentials (FCM/APNS).

### Connections / Third-Party Services
- Expo EAS Build
- Apple App Store Connect API
- Google Play Developer API
- Firebase Cloud Messaging
- Sentry
- RevenueCat
- Fastlane

## APIs Needed
- App Config API
- App Build API
- App Branding API
- Push Key API
- App Submission Metadata API

## System Flow
1. Church admin opens the Dedicated White-Label Church App Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Dedicated White-Label Church App Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
dedicated_white_label_church_app_module
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

dedicated_white_label_church_app_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

dedicated_white_label_church_app_module_settings
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
GET    /api/dedicated-white-label-church-app - List all tenant records (paginated, filtered)
POST   /api/dedicated-white-label-church-app - Create a record under X-Tenant-ID
GET    /api/dedicated-white-label-church-app/:id - Fetch single tenant-isolated record
PATCH  /api/dedicated-white-label-church-app/:id - Modify record details securely
DELETE /api/dedicated-white-label-church-app/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Dedicated White-Label Church App Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Dedicated White-Label Church App Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- dedicated-white-label-church-app.read
- dedicated-white-label-church-app.create
- dedicated-white-label-church-app.update
- dedicated-white-label-church-app.delete
- dedicated-white-label-church-app.manage_settings
- dedicated-white-label-church-app.view_reports

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


---

# Multi-Branch & Global Infrastructure

# Multi-Branch / Multi-Campus Management Module

## Description
Allows ministries to manage many branches, campuses, regions, or countries under one organization while keeping local branch data and leadership separate.

## Plain-English Overview
The Multi-Branch / Multi-Campus Management Module supports churches and ministries with multiple locations, campuses, regions, or countries. It allows central leadership to manage the overall ministry while each branch can have its own members, leaders, services, events, media, reports, and local settings. This module is important for growing churches, networks, and international ministries.

## Section Context
Section H: Multi-Branch & Global Infrastructure

## Core Features (with Tooltips)
- **Parent ministry structure**: The overarching architectural design allowing one headquarters to govern multiple child locations.
- **Branch profiles**: Unique sub-workspaces containing specific details, contact info, and branding for a local campus.
- **Campus profiles**: Profiles defining physical locations that might share the same digital workspace but have different service times.
- **Branch leaders**: Elevated access roles allowing a local pastor to manage their specific branch without seeing the headquarters’ data.
- **Branch-specific members**: Database rules mapping a member exclusively to their home campus for accurate localized reporting.
- **Branch-specific services**: Isolated service records and livestreams so the London branch doesn’t overlap with the Paris branch.
- **Branch-specific events**: Registration flows limited to one specific physical location’s calendar.
- **Branch-specific media**: Content silos allowing a local pastor to upload their own sermon without cluttering the global headquarters’ feed.
- **Branch analytics**: Filterable reports showing exactly how fast a specific campus is growing compared to others.
- **Central admin dashboard**: The master bird’s-eye view allowing the Senior Pastor to monitor the health of all branches globally.
- **Branch permissions**: Security rules determining if a local branch is allowed to change its own website design or if headquarters enforces it.
- **Branch financial reports**: Segmented accounting ensuring the tithes from Campus A are not mixed with the tithes from Campus B.
- **Regional grouping**: Organizational folders allowing massive churches to group dozens of branches under "North America" or "Europe".

## Adaptations
- Can support one ministry with many churches
- Can support local and global branches
- Can allow central leadership to see overall reports
- Can allow each branch to manage local content
- Can connect to giving, services, events, members, analytics, and communication

## Relationships & Integrations
### Integrates With
- **Domain & Tenant Management Module**: A parent ministry owns multiple branch sub-tenants.
- **Member Management Module**: Members and profiles belong to specific branches.
- **Church Services Module**: Each branch schedules its own local services.
- **Events & Registration Module**: Events can be branch-specific or global parent-level.
- **Tithes & Offerings Module**: Financial records can be branch-level or centrally consolidated.
- **Partnerships & Contributions Module**: Partners can contribute to specific branch projects.
- **Campaigns & Causes Module**: Campaigns can target specific branch objectives.
- **Analytics & Reporting Module**: Leadership can compare campus growth rates and activity.
- **Communication, Notification & Follow-Up Module**: Target messages to specific campus populations.

### Connections / Third-Party Services
- Google Maps Platform
- QuickBooks / Xero
- Mailchimp / Klaviyo
- Twilio
- Google Calendar
- Looker Studio / Metabase
- Algolia / Meilisearch

## APIs Needed
- Branch API
- Campus API
- Branch User API
- Branch Member API
- Branch Report API
- Parent Organization API

## System Flow
1. Church admin opens the Multi-Branch / Multi-Campus Management Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Multi-Branch / Multi-Campus Management Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
multi_branch_multi_campus_management_module
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

multi_branch_multi_campus_management_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

multi_branch_multi_campus_management_module_settings
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
GET    /api/multi-branch-multi-campus-management - List all tenant records (paginated, filtered)
POST   /api/multi-branch-multi-campus-management - Create a record under X-Tenant-ID
GET    /api/multi-branch-multi-campus-management/:id - Fetch single tenant-isolated record
PATCH  /api/multi-branch-multi-campus-management/:id - Modify record details securely
DELETE /api/multi-branch-multi-campus-management/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Multi-Branch / Multi-Campus Management Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Multi-Branch / Multi-Campus Management Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- multi-branch-multi-campus-management.read
- multi-branch-multi-campus-management.create
- multi-branch-multi-campus-management.update
- multi-branch-multi-campus-management.delete
- multi-branch-multi-campus-management.manage_settings
- multi-branch-multi-campus-management.view_reports

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


---

# Advanced Translation & Multilingual Module

## Description
Optional paid add-on enabling AI-assisted page translation, multilingual website publishing, bulk workflows, and localized SEO routing.

## Plain-English Overview
The Advanced Translation & Multilingual Module is an optional paid add-on that sits on top of the Core Localization Engine. It provides advanced tools for churches to translate and publish their public websites, blog articles, and LMS courses into multiple languages. It features AI-assisted translation workflows, manual translator draft-review dashboards, multilingual SEO configuration (such as language-specific URL routing like church.org/es), and live audio interpretation channel mapping for stream services.

## Section Context
Section H: Multi-Branch & Global Infrastructure

## Core Features (with Tooltips)
- **AI-assisted translation**: Automatic page and article drafts translation using providers like DeepL, Google Cloud, or OpenAI.
- **Multilingual website publishing**: Ability to compile and host separate language-specific variations of CMS website pages.
- **Translator review dashboard**: Administrative workflow allowing human translators to review, edit, and approve AI drafts before publish.
- **Language-specific URL routing**: Advanced web servers path structure support (e.g. /en, /fr) for search engines compliance.
- **Multilingual SEO settings**: Isolated meta titles, keywords, and sitemaps configuration per active language.
- **Livestream interpretation routing**: Audio channel mapping allowing online attendees to select secondary audio translation feeds.
- **Resource folder translations**: Support for cataloging and delivering language-specific PDF outlines and study files.

## Adaptations
- Adapts dynamically based on active tenant subscriptions and configurations.

## Relationships & Integrations
### Integrates With
- **Content Management Module**: Compiles multilingual pages and manages custom slugs.
- **Dynamic Blog & Publishing Engine Module**: Allows articles and devotionals to exist in multiple languages.
- **LMS & Discipleship Training Module**: Renders courses, lessons, and quizzes in local language versions.
- **Media Module**: Integrates multi-language subtitle tracks and caption overlays.
- **Livestream Module**: Supports secondary audio feeds and real-time subtitle broadcasts.
- **AI Assistant / Ministry Copilot Module**: Triggers automated AI translation pipelines for user-generated content.

### Connections / Third-Party Services
- Google Cloud Translation
- DeepL API
- Microsoft Translator
- OpenAI / Gemini / Claude
- SRT/VTT subtitle files
- Mux/Vimeo audio track streams
- Bible translation licensing

## APIs Needed
- AI Content Translation API
- Multilingual Slugs API
- Media Caption Integration API
- Live Translation Audio Feed API
- SEO Translation API

## System Flow
1. Church admin opens the Advanced Translation & Multilingual Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates Advanced Translation & Multilingual Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
advanced_translation_multilingual_module
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

advanced_translation_multilingual_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

advanced_translation_multilingual_module_settings
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
GET    /api/advanced-translation-multilingual - List all tenant records (paginated, filtered)
POST   /api/advanced-translation-multilingual - Create a record under X-Tenant-ID
GET    /api/advanced-translation-multilingual/:id - Fetch single tenant-isolated record
PATCH  /api/advanced-translation-multilingual/:id - Modify record details securely
DELETE /api/advanced-translation-multilingual/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for Advanced Translation & Multilingual Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with Advanced Translation & Multilingual Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- advanced-translation-multilingual.read
- advanced-translation-multilingual.create
- advanced-translation-multilingual.update
- advanced-translation-multilingual.delete
- advanced-translation-multilingual.manage_settings
- advanced-translation-multilingual.view_reports

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


---

# AI & Intelligence Layer

# AI Assistant / Ministry Copilot Module

## Description
An AI helper for creating announcements, captions, sermon summaries, outreach copy, notifications, FAQs, and ministry content.

## Plain-English Overview
The AI Assistant / Ministry Copilot Module provides intelligent support for church teams. It can help generate announcements, captions, email drafts, SMS messages, sermon summaries, blog posts, event descriptions, outreach messages, course outlines, FAQs, and ministry content. It should operate as an assistant inside the platform, helping church staff create content faster, communicate better, and repurpose ministry materials more effectively.

## Section Context
Section I: AI & Intelligence Layer

## Core Features (with Tooltips)
- **Announcement drafting**: The AI generates engaging, professional text for Sunday bulletin announcements based on brief bullet points.
- **Email drafting**: The AI helps pastors write compassionate follow-up emails or exciting newsletter copy in seconds.
- **SMS drafting**: The AI condenses long messages into punchy, effective 160-character texts perfect for mobile alerts.
- **Push notification drafting**: The AI suggests catchy, urgent headlines designed to maximize open rates on the church app.
- **Sermon summaries**: The AI analyzes a full transcript and instantly writes a 3-paragraph synopsis of the message.
- **Social captions**: The AI generates creative Instagram or Facebook captions complete with relevant emojis and trending hashtags.
- **Blog drafts**: The AI transforms a raw sermon transcript into a readable, formatted blog post ready for human review.
- **Event descriptions**: The AI writes compelling promotional copy for upcoming conferences to boost registration numbers.
- **Outreach message generation**: The AI creates personalized, sensitive templates for members to use when inviting friends to church.
- **Course outline generation**: The AI brainstorms a 6-week curriculum structure for a new discipleship class based on a topic.
- **Quiz generation**: The AI reads a course lesson and automatically creates 5 multiple-choice test questions for students.
- **FAQ assistant**: The AI analyzes church policies and instantly drafts clear, polite answers to common member questions.
- **Follow-up message suggestions**: The AI recommends the perfect tone and scripture to use when texting a first-time visitor.
- **Content repurposing**: The workflow where AI slices one long sermon into quotes, blogs, devotionals, and social posts.
- **Ministry workflow suggestions**: The AI acts as a consultant, analyzing church data and suggesting areas where automation could save time.

## Adaptations
- Can assist pastors, media teams, admins, and care teams
- Can connect to media, blogs, LMS, communication, outreach, events, and CRM
- Can reduce time spent writing repetitive content
- Can be usage-billed
- Can serve as an internal assistant rather than a public chatbot only

## Relationships & Integrations
### Integrates With
- **Dynamic Blog & Publishing Engine Module**: Generates articles, devotionals, titles, and summaries.
- **Media Module**: Creates summaries, captions, clips, transcripts, and content ideas.
- **Communication, Notification & Follow-Up Module**: Drafts emails, SMS, push notifications, and announcements.
- **Member Outreach & Invite Campaign Module**: Generates invite text, social captions, and scripts.
- **LMS & Discipleship Training Module**: Creates lesson outlines, quizzes, and summaries.
- **Ministry CRM Module**: Suggests follow-up messages.
- **Events & Registration Module**: Creates event descriptions and promotional copy.
- **Worship Experience Module**: Worship session summaries and descriptions.

### Connections / Third-Party Services
- OpenAI API
- Anthropic Claude
- Google Gemini
- Deepgram / AssemblyAI
- ElevenLabs
- Pinecone / Supabase Vector
- Zapier / Make

## APIs Needed
- AI Prompt API
- AI Content Generation API
- AI Summary API
- AI Caption API
- AI Workflow Assistant API
- AI Usage Billing API

## System Flow
1. Church admin opens the AI Assistant / Ministry Copilot Module settings.
2. Admin configures the module according to the church's ministry needs.
3. The system stores all records under the correct tenant_id.
4. Members, visitors, or staff interact with the module through the website, dashboard, or mobile app.
5. The system tracks activity for reporting, automation, notifications, and follow-up.
6. Related modules such as CRM, analytics, billing, notifications, member records, and workflows receive the outcome where applicable.

## Use Cases / Functional Scenarios
• A church activates AI Assistant / Ministry Copilot Module as an add-on or included feature.
• A church admin creates content, settings, or workflows for the module.
• A member or visitor interacts with the module on the website or mobile app.
• The system records the activity and can trigger notifications, analytics, or follow-up.
• Church leadership reviews reports to understand engagement and outcomes.
• The module can later be expanded through APIs, permissions, integrations, and marketplace extensions.

## Data Model
```text
ai_assistant_ministry_copilot_module
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

ai_assistant_ministry_copilot_module_activity
- id
- tenant_id
- user_id/member_id
- action_type
- metadata_json
- created_at

ai_assistant_ministry_copilot_module_settings
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
GET    /api/ai-assistant-ministry-copilot - List all tenant records (paginated, filtered)
POST   /api/ai-assistant-ministry-copilot - Create a record under X-Tenant-ID
GET    /api/ai-assistant-ministry-copilot/:id - Fetch single tenant-isolated record
PATCH  /api/ai-assistant-ministry-copilot/:id - Modify record details securely
DELETE /api/ai-assistant-ministry-copilot/:id - Delete record or toggle status
```

## User Experiences
### Admin Experience
Admins should be able to configure settings, create records, edit content, review activity, manage permissions, and view reports for AI Assistant / Ministry Copilot Module. The interface should avoid technical language and guide church staff step by step.

### Member Experience
Members and visitors should interact with AI Assistant / Ministry Copilot Module through simple pages, buttons, forms, media players, dashboards, or guided journeys depending on the module type. The experience should feel warm, clear, and church-friendly.

## Permissions
- ai-assistant-ministry-copilot.read
- ai-assistant-ministry-copilot.create
- ai-assistant-ministry-copilot.update
- ai-assistant-ministry-copilot.delete
- ai-assistant-ministry-copilot.manage_settings
- ai-assistant-ministry-copilot.view_reports

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
