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
- **Developer Marketplace Module**: Premium marketplace assets are billed through this module.

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
