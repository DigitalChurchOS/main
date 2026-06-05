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
- **Core Website & CMS Module**: Each church website must be loaded based on the tenant domain or subdomain.
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
