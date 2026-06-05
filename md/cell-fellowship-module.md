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
