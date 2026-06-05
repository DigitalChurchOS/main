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
