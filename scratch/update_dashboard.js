const fs = require('fs');
const path = require('path');

const htmlPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\dashboard.html';
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Original dashboard.html length:', html.length);

// 1. Replace the CSS style for .module-nav-list to incorporate category accordion styles
const targetCss = `    .module-nav-list {
      display: grid;
      gap: 4px;
      max-height: 38vh;
      overflow: auto;
      padding-right: 4px;
    }`;

const replacementCss = `    .module-nav-list {
      display: grid;
      gap: 4px;
      max-height: 65vh;
      overflow: auto;
      padding-right: 4px;
    }

    .sidebar-category {
      margin-bottom: 4px;
      border-radius: var(--radius);
      overflow: hidden;
    }
    .sidebar-category-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      cursor: pointer;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: var(--radius);
      transition: background 0.2s, color 0.2s;
    }
    .sidebar-category-header:hover {
      background: var(--accent-soft);
      color: var(--text);
    }
    .sidebar-category-header .chevron {
      margin-left: auto;
      width: 14px !important;
      height: 14px !important;
      transition: transform 0.2s;
    }
    .sidebar-category.active .sidebar-category-header {
      color: var(--text);
    }
    .sidebar-category-modules {
      padding-left: 12px;
      margin-top: 2px;
      display: grid;
      gap: 2px;
      border-left: 1.5px solid var(--line);
      margin-left: 16px;
    }`;

if (html.includes(targetCss)) {
  html = html.replace(targetCss, replacementCss);
  console.log('CSS style successfully updated.');
} else {
  console.error('Target CSS style not found! Checking if already applied...');
}

// 2. Replace the modules array definition with new end-user category mappings
const targetModulesStart = '    const modules = [';
const targetModulesEnd = '     const defaultData = {';

const modulesStartIndex = html.indexOf(targetModulesStart);
const modulesEndIndex = html.indexOf(targetModulesEnd);

if (modulesStartIndex !== -1 && modulesEndIndex !== -1) {
  const replacementModules = `    const modules = [
      { key: 'cms', name: 'Website CMS', icon: 'file-pen-line', category: 'Churchfront', desc: 'Manage pages, menus, themes, and public site content.', workspaces: ['Pages', 'Page Builder', 'Navigation', 'Theme', 'Reusable Sections'], settings: [{ key: 'autoSave', label: 'Autosave drafts', type: 'toggle' }, { key: 'revisionLimit', label: 'Revision limit', type: 'range', min: 5, max: 50, value: 20 }] },
      { key: 'user-role-management', name: 'Users & Roles', icon: 'shield-check', category: 'Settings', desc: 'Invite staff and manage secure role access.', settings: [{ key: 'enforce2fa', label: 'Enforce 2FA for staff', type: 'toggle' }, { key: 'sessionTimeout', label: 'Session timeout minutes', type: 'range', min: 15, max: 240, value: 60 }] },
      { key: 'domain-tenant-management', name: 'Domain & Tenant', icon: 'globe', category: 'Churchfront', desc: 'Configure domains, branding, modules, and launch readiness.', workspaces: ['Domain Setup', 'Branding', 'Module Registry', 'Checklist'], settings: [] },
      { key: 'theme-engine', name: 'Theme Engine', icon: 'palette', category: 'Churchfront', desc: 'Customize themes, typography, colors, layouts, and CSS.', workspaces: ['Install Themes', 'Customize Colors', 'Typography', 'Logo & Layouts', 'Custom CSS', 'Audit Logs'], settings: [] },
      { key: 'centralized-settings-engine', name: 'Settings Engine', icon: 'sliders-horizontal', category: 'Settings', desc: 'Manage dynamic settings across every active module.', workspaces: ['Settings Profiles', 'Dynamic Schemas', 'Audit Trails'], settings: [] },
      { key: 'localization-multilingual-engine', name: 'Frontend Translation', icon: 'languages', category: 'Churchfront', desc: 'Manage public website translations, languages, and multilingual page localization (frontend only).', workspaces: ['Language Registry', 'Translation Keys', 'AI Translation Jobs', 'Content Translations', 'Activity Logs'], settings: [{ key: 'autoDetectLocale', label: 'Auto-detect browser locale', type: 'toggle' }, { key: 'fallbackLocale', label: 'Fallback language code', type: 'select', options: ['en', 'es', 'fr', 'pt', 'ar'], value: 'en' }] },
      { key: 'plugin-extensions-engine', name: 'Plugin Engine', icon: 'package-open', category: 'Churchfront', desc: 'Install extensions, configure permissions, and manage webhooks.', workspaces: ['Platform Registry', 'Active Extensions', 'Event Webhooks'], settings: [] },
      { key: 'billing-subscription-management', name: 'Billing & Subscriptions', icon: 'credit-card', category: 'Settings', desc: 'Manage plans, usage limits, invoices, and webhooks.', workspaces: ['Subscription Plan', 'Metered Usage', 'Invoices & Webhooks'], settings: [] },
      { key: 'giving', name: 'Giving', icon: 'hand-coins', category: 'Giving', desc: 'Manage donations, recurring gifts, campaigns, and receipts.', settings: [{ key: 'coverFees', label: 'Ask donors to cover fees', type: 'toggle' }, { key: 'receiptDelay', label: 'Receipt delay minutes', type: 'range', min: 0, max: 60, value: 5 }] },
      { key: 'church-services', name: 'Church Services', icon: 'calendar-heart', category: 'Connect', desc: 'Create and archive Sunday, mid-week, and regular services, and link scriptures/notes.', settings: [] },
      { key: 'groups', name: 'Cell Meetings', icon: 'network', category: 'Connect', desc: 'Manage groups, leaders, attendance, invites, and hierarchy.', settings: [{ key: 'autoNaming', label: 'Automatic cell naming', type: 'toggle' }, { key: 'depthLimit', label: 'Hierarchy depth limit', type: 'range', min: 1, max: 8, value: 4 }] },
      { key: 'liveMeetings', name: 'Live Meetings', icon: 'video', category: 'Connect', desc: 'Host video conference calls, virtual webinars, and private counseling rooms.', settings: [] },
      { key: 'events', name: 'Events', icon: 'calendar-days', category: 'Connect', desc: 'Publish events, registrations, reminders, capacity, and tickets.', settings: [{ key: 'autoReminders', label: 'Automatic reminders', type: 'toggle' }, { key: 'capacityWarning', label: 'Capacity warning percent', type: 'range', min: 50, max: 100, value: 85 }] },
      { key: 'attendance', name: 'Attendance', icon: 'calendar-check', category: 'Connect', desc: 'Track attendance for services, groups, events, and kids using touchless QR and manual kiosks.', settings: [] },
      { key: 'community', name: 'Notice & Forums', icon: 'messages-square', category: 'Connect', desc: 'Configure public notice boards, forum rooms threads, and user profiles directories.', settings: [] },
      { key: 'bookings', name: 'Appointments', icon: 'clock', category: 'Connect', desc: 'Schedule counseling sessions, pastoral care appointments, and staff availability calendars.', settings: [] },
      { key: 'children', name: 'Children', icon: 'baby', category: 'Connect', desc: 'Manage child profiles, classrooms, pickup authorizations, secure checkout matching, and alerts.', settings: [] },
      { key: 'liveChat', name: 'Live Chat', icon: 'message-circle', category: 'Connect', desc: 'Real-time pastoral care live chat support desk, handling tickets and response SLAs.', settings: [] },
      { key: 'volunteers', name: 'Volunteers', icon: 'clipboard-check', category: 'Church Admin', desc: 'Coordinate teams, availability, schedules, announcements, and assignments.', settings: [{ key: 'availabilityLock', label: 'Lock schedules after publish', type: 'toggle' }, { key: 'reminderHours', label: 'Reminder lead time hours', type: 'range', min: 1, max: 72, value: 24 }] },
      { key: 'livestream', name: 'Livestream', icon: 'radio', category: 'Media', desc: 'Run live services, chat, prayer prompts, and replays.', settings: [{ key: 'showChat', label: 'Show live chat', type: 'toggle' }, { key: 'prayerPrompt', label: 'Prayer prompt interval', type: 'range', min: 5, max: 30, value: 12 }] },
      { key: 'members', name: 'Members CRM', icon: 'users-round', category: 'Growth', desc: 'Track members, families, notes, pipelines, and follow-ups.', settings: [{ key: 'duplicateCheck', label: 'Duplicate member checks', type: 'toggle' }, { key: 'followUpDays', label: 'Follow-up SLA days', type: 'range', min: 1, max: 14, value: 3 }] },
      { key: 'media', name: 'Media Library', icon: 'clapperboard', category: 'Media', desc: 'Organize sermons, playlists, captions, podcasts, and downloads.', settings: [{ key: 'autoCaption', label: 'Auto-generate captions', type: 'toggle' }, { key: 'clipLength', label: 'Default clip length', type: 'range', min: 15, max: 180, value: 60 }] },
      { key: 'prayer', name: 'Prayer & Testimony', icon: 'heart-handshake', category: 'Discipleship', desc: 'Moderate prayers, testimonies, sessions, and pastoral responses.', settings: [{ key: 'moderation', label: 'Require moderation', type: 'toggle' }, { key: 'responseSla', label: 'Response SLA hours', type: 'range', min: 1, max: 72, value: 24 }] },
      { key: 'courses', name: 'Discipleship Courses', icon: 'graduation-cap', category: 'Discipleship', desc: 'Deliver courses, lessons, quizzes, progress, and certificates.', settings: [{ key: 'certificates', label: 'Issue certificates', type: 'toggle' }, { key: 'passingScore', label: 'Passing score percent', type: 'range', min: 50, max: 100, value: 70 }] },
      { key: 'mobile', name: 'Mobile App', icon: 'smartphone', category: 'Media', desc: 'Manage member app home, push, giving, and prayer.', settings: [{ key: 'pushEnabled', label: 'Push notifications', type: 'toggle' }, { key: 'homeCards', label: 'Home quick cards', type: 'range', min: 3, max: 12, value: 6 }] },
      { key: 'analytics', name: 'Analytics', icon: 'chart-no-axes-combined', category: 'Church Admin', desc: 'Track giving, engagement, attendance, growth, and site insights.', settings: [{ key: 'weeklyDigest', label: 'Weekly digest', type: 'toggle' }, { key: 'retentionMonths', label: 'Retention months', type: 'range', min: 3, max: 36, value: 12 }] },
      { key: 'blog-publishing', name: 'Dynamic Blog', icon: 'file-text', category: 'Media', desc: 'Publish independent blogging channels (e.g. devotionals, announcements) with tag indexes.', settings: [] },
      { key: 'digital-library', name: 'Digital Library', icon: 'book-open', category: 'Media', desc: 'Organize study manuals, eBooks, devotionals, and downloadable resource guides.', settings: [] },
      { key: 'podcast-broadcasting', name: 'Podcast Center', icon: 'mic', category: 'Media', desc: 'Distribute audio teachings, sermon tracks, and podcasts with Apple/Spotify RSS feeds.', settings: [] },
      { key: 'ai-media', name: 'AI Media Studio', icon: 'sparkles', category: 'Media', desc: 'Repurpose sermons into AI clips, text transcript summaries, and dispatch AI assistant drafts.', settings: [] },
      { key: 'store', name: 'E-Commerce Store', icon: 'shopping-cart', category: 'Sales', desc: 'Allows churches to sell physical and digital products such as apparel, books, courses, and resources.', settings: [] },
      { key: 'funnels', name: 'Ministry Funnels', icon: 'filter', category: 'Growth', desc: 'Build landing pages and guided conversion funnels for salvation calls, visitors, and events.', settings: [] },
      { key: 'bible', name: 'Scripture Engagement', icon: 'book', category: 'Discipleship', desc: 'Read scriptures, setup daily reading plans, create verse widgets, and log study notes.', settings: [] },
      { key: 'signage', name: 'Digital Signage', icon: 'tv', category: 'Media', desc: 'Manage TV slides, lobby sign displays, schedules, and active lobbies devices.', settings: [] },
      { key: 'worship', name: 'Worship Experience', icon: 'music', category: 'Media', desc: 'Organize worship service run-sheets, song lyrics catalog, keys setup, and cue displays.', settings: [] },
      { key: 'finance', name: 'Financial Ledger', icon: 'wallet', category: 'Church Admin', desc: 'Steward church bookkeeping, expenses, billing invoices, and tax reporting statements.', settings: [] },
      { key: 'forms', name: 'Forms & Workflows', icon: 'form-input', category: 'Growth', desc: 'Create custom forms, surveys, check-in questionnaires, and automate workflow tasks.', settings: [] },
      { key: 'multiBranch', name: 'Multi-Campus CRM', icon: 'map', category: 'Church Admin', desc: 'Coordinate campus locations, leaders role scopes, activities, and campus revenue splits.', settings: [] },
      { key: 'outreach', name: 'Outreach Campaigns', icon: 'megaphone', category: 'Outreach', desc: 'AI outreach content draft generator, Meta/Instagram social promotions, custom invite cards, and leads referral analytics.', settings: [] },
      { key: 'salvation', name: 'Salvation Journeys', icon: 'heart', category: 'Discipleship', desc: 'Monitor salvation decision logs, assign mentors, and track newcomer assimilation.', settings: [] },
      { key: 'whiteLabel', name: 'White-Label App', icon: 'smartphone', category: 'Media', desc: 'Compile white-label iOS and Android apps, customize splash pages, and draft listings.', settings: [] },
      { key: 'community', name: 'Notice & Forums', icon: 'messages-square', category: 'Connect', desc: 'Configure public notice boards, forum rooms threads, and user profiles directories.', settings: [] },
      { key: 'communication', name: 'Automated Broadcasts', icon: 'send', category: 'Growth', desc: 'Broadcast automated email newsletters, queue SMS messages, and schedule notification sequences.', settings: [] },
      { key: 'crm', name: 'Ministry CRM Pipelines', icon: 'kanban', category: 'Growth', desc: 'Manage newcomer follow-up checklists, pipelines, and tasks in a Kanban layout.', settings: [] }
    ];
`; 
`;
  html = html.slice(0, modulesStartIndex) + replacementModules + html.slice(modulesEndIndex);
  console.log('Modules array successfully updated with 11 end-user mental clusters.');
} else {
  console.error('Modules array start or end target not found!');
}

// 3. Update outreachState to include promotions array
const targetOutreachState = `    window.outreachState = {
      activeTab: 'campaigns',
      campaigns: [],
      leads: []
    };`;

const replacementOutreachState = `    window.outreachState = {
      activeTab: 'campaigns',
      campaigns: [],
      leads: [],
      promotions: []
    };`;

if (html.includes(targetOutreachState)) {
  html = html.replace(targetOutreachState, replacementOutreachState);
  console.log('outreachState successfully updated to support promotions.');
}

// 4. Update bootstrapOutreach to populate promotions and boot promotions tab render
const targetBootstrapOutreach = `      runOutreachFlyerRender();
      window.switchOutreachTab(window.outreachState.activeTab);
    };`;

const replacementBootstrapOutreach = `      if (window.outreachState.promotions.length === 0) {
        window.outreachState.promotions = [
          { id: 'prm-1', title: 'Easter Concert Promotion', audience: 'Local Area (5-mile radius)', budget: 35, impressions: 14200, clicks: 842, status: 'Active' },
          { id: 'prm-2', title: 'Youth Impact Seminar Promo', audience: 'College Students & Young Adults', budget: 15, impressions: 5800, clicks: 231, status: 'Active' }
        ];
      }
      runOutreachFlyerRender();
      window.switchOutreachTab(window.outreachState.activeTab);
    };`;

if (html.includes(targetBootstrapOutreach)) {
  html = html.replace(targetBootstrapOutreach, replacementBootstrapOutreach);
  console.log('bootstrapOutreach successfully updated with promotions state.');
}

// 5. Inject HTML tabs for AI Content Creator and Social Media Promotions in the Outreach Console
const targetOutreachTabsEnd = `                <div id="outreachLeadsTab" class="outreach-tab-content hidden">
                  <div class="section-head" style="margin-bottom: 20px;">
                    <div>
                      <h2>Campaign Outreach Leads</h2>
                      <p>Trace newcomers referred directly via dynamic referral inviter IDs.</p>
                    </div>
                  </div>
                  <div class="panel" style="padding:0; overflow:hidden;">
                    <table class="mini-table">
                      <thead>
                        <tr>
                          <th>Lead Identity</th>
                          <th>Email Address</th>
                          <th>Referred By (ID)</th>
                          <th>Campaign Context</th>
                          <th>Sign Up Date</th>
                        </tr>
                      </thead>
                      <tbody id="outreachLeadsTableBody"></tbody>
                    </table>
                  </div>
                </div>
              </div>`;

const replacementOutreachTabsEnd = `                <div id="outreachLeadsTab" class="outreach-tab-content hidden">
                  <div class="section-head" style="margin-bottom: 20px;">
                    <div>
                      <h2>Campaign Outreach Leads</h2>
                      <p>Trace newcomers referred directly via dynamic referral inviter IDs.</p>
                    </div>
                  </div>
                  <div class="panel" style="padding:0; overflow:hidden;">
                    <table class="mini-table">
                      <thead>
                        <tr>
                          <th>Lead Identity</th>
                          <th>Email Address</th>
                          <th>Referred By (ID)</th>
                          <th>Campaign Context</th>
                          <th>Sign Up Date</th>
                        </tr>
                      </thead>
                      <tbody id="outreachLeadsTableBody"></tbody>
                    </table>
                  </div>
                </div>

                <!-- AI Content Creator Tab -->
                <div id="outreachAiContentTab" class="outreach-tab-content hidden">
                  <div class="section-head" style="margin-bottom: 20px;">
                    <div>
                      <h2>AI Outreach Content Creator</h2>
                      <p>Leverage premium neural models to draft copy, event invitations, social hooks, and message follow-ups.</p>
                    </div>
                  </div>
                  <div class="grid" style="grid-template-columns: 1fr 1.2fr; gap:16px;">
                    <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
                      <h3>AI Draft Settings</h3>
                      <div class="field">
                        <label>Event Topic / Theme</label>
                        <input type="text" id="outreachAiTopic" class="input" placeholder="e.g. NextGen Summer Youth Camp 2026" style="width:100%;">
                      </div>
                      <div class="field">
                        <label>Desired Tone</label>
                        <select id="outreachAiTone" class="select" style="width:100%;">
                          <option value="Inspiring & Spiritual">Inspiring & Spiritual</option>
                          <option value="Warm & Welcoming">Warm & Welcoming</option>
                          <option value="Energetic & Contemporary">Energetic & Contemporary</option>
                          <option value="Traditional & Formal">Traditional & Formal</option>
                        </select>
                      </div>
                      <div class="field">
                        <label>Target Channel</label>
                        <select id="outreachAiChannel" class="select" style="width:100%;">
                          <option value="Instagram Post Caption">Instagram Post Caption</option>
                          <option value="WhatsApp Group Broadcast">WhatsApp Group Broadcast</option>
                          <option value="SMS Quick Invite">SMS Quick Invite</option>
                          <option value="Email Campaign Newsletter">Email Campaign Newsletter</option>
                        </select>
                      </div>
                      <button class="btn primary" onclick="generateOutreachAiContent()" style="background: linear-gradient(135deg, #6366f1, #a855f7); border: none; color: white; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="sparkles"></i>Generate AI Copy
                      </button>
                    </div>
                    <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>Generated Copy Output</h3>
                        <button class="btn btn-sm" onclick="copyOutreachAiCopy()"><i data-lucide="copy" style="width:12px;"></i>Copy</button>
                      </div>
                      <div id="outreachAiOutput" style="flex:1; min-height:180px; padding:16px; background:#111; border:1px solid #222; border-radius:6px; color:#eee; font-family:monospace; font-size:13px; white-space:pre-wrap; overflow-y:auto; line-height:1.5;">Your generated copy will appear here...</div>
                      <div id="outreachAiTokenProgress" class="hidden" style="display:flex; flex-direction:column; gap:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--muted);">
                          <span>Token processing SLA...</span>
                          <span id="outreachAiTokenCount">0 / 250 words</span>
                        </div>
                        <div style="width:100%; height:4px; background:#222; border-radius:2px; overflow:hidden;">
                          <div id="outreachAiTokenBar" style="width:0%; height:100%; background:linear-gradient(90deg, #6366f1, #a855f7); transition: width 0.1s;"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Social Media Promotions Tab -->
                <div id="outreachPromotionsTab" class="outreach-tab-content hidden">
                  <div class="section-head" style="margin-bottom: 20px;">
                    <div>
                      <h2>Social Media Promotions</h2>
                      <p>Run, manage, and audit localized outreach ad campaigns across meta channels, YouTube, and WhatsApp Business.</p>
                    </div>
                  </div>
                  <div class="grid" style="grid-template-columns: 1fr 1.5fr; gap:16px;">
                    <div class="panel" style="display:flex; flex-direction:column; gap:12px;">
                      <h3>Launch Social Ad Promotion</h3>
                      <div class="field">
                        <label>Campaign Title</label>
                        <input type="text" id="outreachPromoTitle" class="input" placeholder="e.g. Local Community Food Drive Ads" style="width:100%;">
                      </div>
                      <div class="field">
                        <label>Select Target Audience</label>
                        <select id="outreachPromoAudience" class="select" style="width:100%;">
                          <option value="Local Area (5-mile radius)">Local Area (5-mile radius)</option>
                          <option value="Families & Parents">Families & Parents</option>
                          <option value="College Students & Young Adults">College Students & Young Adults</option>
                          <option value="Broad Regional (Entire City)">Broad Regional (Entire City)</option>
                        </select>
                      </div>
                      <div class="field">
                        <label>Daily Ad Budget ($ USD)</label>
                        <div style="display:flex; align-items:center; gap:12px;">
                          <input type="range" id="outreachPromoBudget" min="5" max="250" value="25" oninput="document.getElementById('outreachPromoBudgetValue').textContent = '$' + this.value" style="flex:1;">
                          <span id="outreachPromoBudgetValue" style="font-weight:700; width:45px; text-align:right;">$25</span>
                        </div>
                      </div>
                      <div class="field">
                        <label>Ad Creative / Banner URL</label>
                        <select id="outreachPromoCreative" class="select" style="width:100%;">
                          <option value="Easter Hope Celebration Banner">Easter Hope Celebration Banner</option>
                          <option value="Youth Impact Seminar Image">Youth Impact Seminar Image</option>
                          <option value="General Sunday Worship Welcome Card">General Sunday Worship Welcome Card</option>
                        </select>
                      </div>
                      <button class="btn primary" onclick="submitSocialPromoAd()"><i data-lucide="send"></i>Publish Campaign Live</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:16px;">
                      <div class="panel">
                        <h3>Connected Channels</h3>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:8px;">
                          <div style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px; background:#1c1e21; border-radius:6px; text-align:center;">
                            <i data-lucide="facebook" style="color:#1877f2; width:20px; height:20px;"></i>
                            <span style="font-size:11px; font-weight:600;">Meta Ads</span>
                            <span class="badge success" style="font-size:8px;">Connected</span>
                          </div>
                          <div style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px; background:#1c1e21; border-radius:6px; text-align:center;">
                            <i data-lucide="instagram" style="color:#e1306c; width:20px; height:20px;"></i>
                            <span style="font-size:11px; font-weight:600;">Instagram</span>
                            <span class="badge success" style="font-size:8px;">Connected</span>
                          </div>
                          <div style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px; background:#1c1e21; border-radius:6px; text-align:center;">
                            <i data-lucide="youtube" style="color:#ff0000; width:20px; height:20px;"></i>
                            <span style="font-size:11px; font-weight:600;">YouTube</span>
                            <span class="badge success" style="font-size:8px;">Connected</span>
                          </div>
                          <div style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px; background:#1c1e21; border-radius:6px; text-align:center;">
                            <i data-lucide="message-square" style="color:#25d366; width:20px; height:20px;"></i>
                            <span style="font-size:11px; font-weight:600;">WhatsApp Biz</span>
                            <span class="badge success" style="font-size:8px;">Connected</span>
                          </div>
                        </div>
                      </div>
                      <div class="panel" style="padding:0; overflow:hidden;">
                        <div style="padding:16px; border-bottom:1px solid var(--line);">
                          <h3 style="margin:0;">Active Ad Promotions Performance</h3>
                        </div>
                        <table class="mini-table">
                          <thead>
                            <tr>
                              <th>Promo Ad Campaign</th>
                              <th>Audience</th>
                              <th>Budget</th>
                              <th>Impressions</th>
                              <th>Clicks (CTR)</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody id="outreachPromosTableBody">
                            <!-- Populated in renderOutreachTab -->
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>`;

if (html.includes(targetOutreachTabsEnd)) {
  html = html.replace(targetOutreachTabsEnd, replacementOutreachTabsEnd);
  console.log('Outreach HTML tabs successfully injected.');
}

// 6. Inject the Outreach navigation items for the new tabs
const targetOutreachNav = `                  <button class="cms-nav-item" data-outreach-tab="leads" onclick="switchOutreachTab('leads')">
                    <i data-lucide="users"></i><span>Outreach Leads</span>
                  </button>
                </div>`;

const replacementOutreachNav = `                  <button class="cms-nav-item" data-outreach-tab="leads" onclick="switchOutreachTab('leads')">
                    <i data-lucide="users"></i><span>Outreach Leads</span>
                  </button>
                  <button class="cms-nav-item" data-outreach-tab="aiContent" onclick="switchOutreachTab('aiContent')">
                    <i data-lucide="sparkles"></i><span>AI Content Creator</span>
                  </button>
                  <button class="cms-nav-item" data-outreach-tab="promotions" onclick="switchOutreachTab('promotions')">
                    <i data-lucide="share-2"></i><span>Social Promotions</span>
                  </button>
                </div>`;

if (html.includes(targetOutreachNav)) {
  html = html.replace(targetOutreachNav, replacementOutreachNav);
  console.log('Outreach Sidebar Nav items successfully injected.');
}

// 7. Inject JS controllers for AI drafts and Social ad campaigns inside Outreach logic block
const targetOutreachJsControllers = `    function renderOutreachTab(tab) {
      if (tab === 'campaigns') {`;

const replacementOutreachJsControllers = `    window.generateOutreachAiContent = function() {
      const topic = document.getElementById('outreachAiTopic').value.trim();
      const tone = document.getElementById('outreachAiTone').value;
      const channel = document.getElementById('outreachAiChannel').value;

      if (!topic) {
        showToast('Please specify an event topic or theme.');
        return;
      }

      const outputBox = document.getElementById('outreachAiOutput');
      const progressDiv = document.getElementById('outreachAiTokenProgress');
      const progressCount = document.getElementById('outreachAiTokenCount');
      const progressBar = document.getElementById('outreachAiTokenBar');

      outputBox.textContent = '';
      progressDiv.classList.remove('hidden');
      progressBar.style.width = '0%';
      progressCount.textContent = '0 words generated';

      const copyTemplates = {
        "Instagram Post Caption": {
          "Inspiring & Spiritual": "🙌 CRITICAL BREAKTHROUGH: Join us for \\"" + topic + "\\"! 🌟\\n\\nExpect a profound shift as we gather in worship and divine alignment. God is doing a new thing, and your name is written in His plans for this season. Bring your family, your friends, and an expectant heart.\\n\\n📍 Main Auditorium & Online\\n⏰ Sunday at 9AM & 11:30AM\\n🔗 Tap the link in our bio to RSVP! #Faith #Worship #Outreach #NextChurch",
          "Warm & Welcoming": "🏡 You belong here! We are so thrilled to welcome you to our upcoming event: \\"" + topic + "\\"! ❤️\\n\\nNo matter where you are on your spiritual journey, there is a seat reserved just for you at our table. Come experience authentic community, fresh coffee, and life-giving worship.\\n\\n📍 123 Church Way | Online Stream\\n📅 Save the date and RSVP at the link in our bio! #WelcomeHome #Community #ChurchFamily",
          "Energetic & Contemporary": "⚡️ NEXT-LEVEL ENGAGEMENT: Get ready for \\"" + topic + "\\"! 🚀\\n\\nWe are breaking boundaries, bringing high-energy worship, and diving deep into life-changing truth. This isn't just another Sunday—it's a movement.\\n\\n🔥 Creative team opener\\n🎤 Guest speaker panel\\n🍔 Outdoor food trucks post-service\\n\\n👉 Tag 3 friends who need to be there! Link in bio to register. #NextGen #Youth #VibrantWorship",
          "Traditional & Formal": "⛪️ The Leadership Council cordially invites you to the special congregation event: \\"" + topic + "\\".\\n\\nJoin us as we reflect on our heritage, lift our voices in sacred choral liturgy, and receive a timely word from our senior leadership.\\n\\n📅 Sunday worship service begins promptly at 10:00 AM.\\n📁 Register formal attendance via the link in our biography."
        },
        "WhatsApp Group Broadcast": {
          "Inspiring & Spiritual": "*🌟 POWERFUL OUTREACH INVITATION: " + topic + " 🌟*\\n\\nBrethren, God is preparing a table before us this Sunday! We invite you to join us for our corporate fellowship: *" + topic + "*.\\n\\nLet us press into His presence together. Who are you inviting? Share this link and let's reach souls:\\n👉 _churchos.io/invite/admin_\\n\\n_\\"For where two or three are gathered together in my name, there am I in the midst of them.\\"_ See you there!",
          "Warm & Welcoming": "*❤️ Welcome Home! Join us for " + topic + " ❤️*\\n\\nHello family! We have a special service lined up this week. We are hosting *" + topic + "* and we want you to be a part of it.\\n\\n☕️ Fresh refreshments at 8:30 AM\\n👶 Secure kids check-in active\\n\\nUse your referral link to invite your neighbors:\\n👉 _churchos.io/invite/admin_",
          "Energetic & Contemporary": "*🔥 BIG SUNDAY ALERT: " + topic + " 🔥*\\n\\nHey squad! Don't miss out on this week's special service: *" + topic + "*!\\n\\nWe've got an incredible visual production, guest artist tracks, and a raw panel talk you don't want to miss.\\n\\nShare the hype link now:\\n👉 _churchos.io/invite/admin_\\n#NextChurch",
          "Traditional & Formal": "*⛪️ Special Invitation: " + topic + " ⛪️*\\n\\nDear members,\\n\\nYou are formally invited to attend this week's corporate service focused on *" + topic + "*.\\n\\nWe anticipate a sacred time of communion, scripture study, and community fellowship.\\n\\nDetails & RSVP:\\n👉 _churchos.io/invite/admin_"
        },
        "SMS Quick Invite": {
          "Inspiring & Spiritual": "Hey! God has a word for you at \\"" + topic + "\\" this Sunday 9AM. Come expect a breakthrough! RSVP here: churchos.io/invite/admin",
          "Warm & Welcoming": "Hi! We'd love for you to join us this Sunday at Next Church for \\"" + topic + "\\" at 9AM. Safe kids area & great coffee! RSVP: churchos.io/invite/admin",
          "Energetic & Contemporary": "Sunday is going to be HUGE! Join the creative team at \\"" + topic + "\\" this Sun 9AM. Music, community, food trucks. Sign up: churchos.io/invite/admin",
          "Traditional & Formal": "You are cordially invited to Next Church this Sunday, 10AM, for our liturgical service: \\"" + topic + "\\". RSVP: churchos.io/invite/admin"
        },
        "Email Campaign Newsletter": {
          "Inspiring & Spiritual": "Subject: A Divine Appointment Awaits: " + topic + " 🙌\\n\\nDear Partner,\\n\\nWe believe that God orchestrates special moments in time to pour out His Spirit. This Sunday, we are gathering for a targeted focus on: \\"" + topic + "\\".\\n\\nCome prepared to experience:\\n- Deep intercessory prayer and worship overlays\\n- Scriptural illumination from senior ministers\\n- Soul-stirring community connection\\n\\n\\"Sing unto the Lord a new song, and his praise from the end of the earth...\\"\\n\\nRSVP today: churchos.io/invite/admin",
          "Warm & Welcoming": "Subject: Save your seat at the table: " + topic + " ❤️\\n\\nHello Friend,\\n\\nAt Next Church, our mission is simple: Love God, love people, and make disciples. This week, we are creating a special environment for: \\"" + topic + "\\".\\n\\nWhether you are a lifelong believer or just exploring faith, we want to walk alongside you. We have outstanding children check-in systems and a warm atmosphere.\\n\\nWhen: Sunday at 9:00 AM\\nWhere: 123 Church Way & Online Streams\\n\\nRSVP today: churchos.io/invite/admin",
          "Energetic & Contemporary": "Subject: Get Ready: \\"" + topic + "\\" is live this Sunday! ⚡️\\n\\nHey NextGen,\\n\\nAre you ready for something fresh? We are dropping a brand-new Sunday experience: \\"" + topic + "\\".\\n\\nExpect high-impact visuals, powerful soundscapes, and an authentic, unfiltered look at scripture. Plus, join us for our post-service block party!\\n\\nGet your passes and invite your friends:\\nchurchos.io/invite/admin\\n\\nSee you there!",
          "Traditional & Formal": "Subject: Formal Invitation: Liturgical Focus on " + topic + " ⛪️\\n\\nDear Members of the Congregation,\\n\\nWe extend a formal invitation for your attendance at our upcoming Sunday morning corporate liturgy, centered on: \\"" + topic + "\\".\\n\\nService Schedule:\\n- 09:30 AM: Choral Preludes\\n- 10:00 AM: Call to Worship & Liturgical Scriptural reading\\n- 11:30 AM: Formal reception & staff greetings\\n\\nKindly register your attendance: churchos.io/invite/admin"
        }
      };

      const selectedCopy = copyTemplates[channel][tone];
      
      let currentLength = 0;
      const interval = setInterval(() => {
        currentLength += Math.floor(Math.random() * 15) + 5;
        if (currentLength >= selectedCopy.length) {
          currentLength = selectedCopy.length;
          outputBox.textContent = selectedCopy;
          progressBar.style.width = '100%';
          progressCount.textContent = 'Completed (250 words generated)';
          clearInterval(interval);
          showToast('AI content successfully generated!');
        } else {
          outputBox.textContent = selectedCopy.slice(0, currentLength) + ' ▌';
          const percent = Math.round((currentLength / selectedCopy.length) * 100);
          progressBar.style.width = percent + '%';
          progressCount.textContent = 'Generating... ' + Math.round(percent * 2.5) + ' / 250 words';
        }
      }, 50);
    };

    window.copyOutreachAiCopy = function() {
      const output = document.getElementById('outreachAiOutput').textContent;
      if (output && output !== 'Your generated copy will appear here...') {
        navigator.clipboard.writeText(output);
        showToast('AI Generated copy copied to clipboard!');
      } else {
        showToast('Nothing to copy.');
      }
    };

    window.submitSocialPromoAd = function() {
      const title = document.getElementById('outreachPromoTitle').value.trim();
      const audience = document.getElementById('outreachPromoAudience').value;
      const budget = document.getElementById('outreachPromoBudget').value;
      
      if (!title) {
        showToast('Please specify a campaign title.');
        return;
      }

      window.outreachState.promotions.unshift({
        id: 'prm-' + (window.outreachState.promotions.length + 1),
        title: title,
        audience: audience,
        budget: parseInt(budget),
        impressions: 0,
        clicks: 0,
        status: 'Active'
      });

      showToast('Social promotion ad published live successfully!');
      document.getElementById('outreachPromoTitle').value = '';
      switchOutreachTab('promotions');
    };

    function renderOutreachTab(tab) {
      if (tab === 'promotions') {
        const tbody = document.getElementById('outreachPromosTableBody');
        if (tbody) {
          tbody.innerHTML = window.outreachState.promotions.map(p => {
            const ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : '0.0';
            return \`
              <tr>
                <td><strong>\${escapeHtml(p.title)}</strong></td>
                <td><span style="font-size:11px;">\${escapeHtml(p.audience)}</span></td>
                <td><code>\$\${p.budget}/day</code></td>
                <td><code>\${p.impressions.toLocaleString()}</code></td>
                <td><code>\${p.clicks.toLocaleString()} (\${ctr}%)</code></td>
                <td><span class="badge success">\${escapeHtml(p.status)}</span></td>
              </tr>
            \`;
          }).join('');
        }
      } else if (tab === 'campaigns') {`;

if (html.includes(targetOutreachJsControllers)) {
  html = html.replace(targetOutreachJsControllers, replacementOutreachJsControllers);
  console.log('Outreach JS controllers successfully injected.');
}

// 8. Replace renderSidebarModules function with collapsible category rendering logic
const targetRenderSidebarModulesStart = '    function renderSidebarModules() {';
const targetRenderSidebarModulesEnd = '    function renderModuleCards() {';

const renderSidebarStartIndex = html.indexOf(targetRenderSidebarModulesStart);
const renderSidebarEndIndex = html.indexOf(targetRenderSidebarModulesEnd);

if (renderSidebarStartIndex !== -1 && renderSidebarEndIndex !== -1) {
  const replacementSidebar = `    // Global sidebar category collapse state
    window.sidebarCategoryStates = window.sidebarCategoryStates || {
      churchfront: true,
      connect: true,
      outreach: true,
      growth: true,
      care: true,
      discipleship: true,
      media: true,
      giving: true,
      sales: true,
      admin: true,
      settings: false
    };

    window.toggleSidebarCategory = function(catKey) {
      window.sidebarCategoryStates[catKey] = !window.sidebarCategoryStates[catKey];
      renderSidebarModules();
    };

    function renderSidebarModules() {
      const categoriesMap = {
        'Churchfront': { key: 'churchfront', name: 'Churchfront', icon: 'monitor', desc: 'CMS, themes, and public tools' },
        'Connect': { key: 'connect', name: 'Connect', icon: 'heart-handshake', desc: 'Worship and fellowship channels' },
        'Outreach': { key: 'outreach', name: 'Outreach', icon: 'megaphone', desc: 'Growth and social promotions' },
        'Growth': { key: 'growth', name: 'Growth', icon: 'trending-up', desc: 'CRM and automated funnels' },
        'Care': { key: 'care', name: 'Care', icon: 'smile', desc: 'Pastoral care and children' },
        'Discipleship': { key: 'discipleship', name: 'Discipleship', icon: 'graduation-cap', desc: 'LMS and spiritual tracks' },
        'Media': { key: 'media', name: 'Media & Apps', icon: 'film', desc: 'Sermons library and dynamic apps' },
        'Giving': { key: 'giving', name: 'Giving', icon: 'hand-coins', desc: 'Stewardship and offerings' },
        'Sales': { key: 'sales', name: 'Sales', icon: 'shopping-cart', desc: 'E-commerce store' },
        'Church Admin': { key: 'admin', name: 'Church Admin', icon: 'briefcase', desc: 'Financial ledgers and logs' },
        'Settings': { key: 'settings', name: 'Settings', icon: 'sliders-horizontal', desc: 'Access roles and plans' }
      };

      // Group modules by category
      const grouped = {};
      Object.keys(categoriesMap).forEach(catName => grouped[catName] = []);
      modules.forEach(m => {
        if (grouped[m.category]) {
          grouped[m.category].push(m);
        } else {
          if (!grouped['Settings']) grouped['Settings'] = [];
          grouped['Settings'].push(m);
        }
      });

      // Find the category of the selected module and auto-expand it!
      const activeModule = modules.find(m => m.key === selectedModule);
      if (activeModule && categoriesMap[activeModule.category]) {
        const activeCatKey = categoriesMap[activeModule.category].key;
        window.sidebarCategoryStates[activeCatKey] = true;
      }

      const sidebarContainer = document.getElementById('sidebarModules');
      if (!sidebarContainer) return;

      sidebarContainer.innerHTML = Object.entries(categoriesMap).map(([catName, cat]) => {
        const catModules = grouped[catName] || [];
        if (catModules.length === 0) return '';
        const isOpen = window.sidebarCategoryStates[cat.key];
        const isActiveCat = activeModule && activeModule.category === catName;
        
        const moduleButtonsHtml = catModules.map(module => {
          const entitlement = state.entitlements[module.key] || { paid: false, live: false };
          const stateLabel = entitlement.paid && entitlement.live ? 'Live' : entitlement.paid ? 'Paid' : 'Preview';
          return \`
            <button class="module-nav-button \${currentView === 'modules' && selectedModule === module.key ? 'active' : ''}" data-module-nav="\${module.key}" style="padding-left:12px; margin-left:8px; border-left:1.5px solid var(--line); border-radius:0 4px 4px 0; min-height:30px; font-size:13px; margin-top:2px;">
              <i data-lucide="\${module.icon}" style="width:13px !important; height:13px !important;"></i>
              <span>\${module.name}</span>
              <small style="font-size:8px;">\${stateLabel}</small>
            </button>
          \`;
        }).join('');

        return \`
          <div class="sidebar-category \${isActiveCat ? 'active' : ''} \${isOpen ? 'open' : ''}" style="margin-bottom:8px;">
            <div class="sidebar-category-header" onclick="toggleSidebarCategory('\${cat.key}')" style="display:flex; align-items:center; gap:10px; padding:6px 8px; cursor:pointer; color:var(--muted); font-size:12px; font-weight:700; text-transform:uppercase; border-radius:var(--radius); transition: background 0.2s, color 0.2s;">
              <i data-lucide="\${cat.icon}" style="width:14px !important; height:14px !important;"></i>
              <span style="letter-spacing:0.05em;">\${cat.name}</span>
              <i data-lucide="chevron-down" class="chevron" style="margin-left:auto; width:12px !important; height:12px !important; transition: transform 0.2s; \${isOpen ? 'transform:rotate(180deg);' : ''}"></i>
            </div>
            <div class="sidebar-category-modules \${isOpen ? '' : 'hidden'}" style="display:grid; gap:2px; margin-top:2px;">
              \${moduleButtonsHtml}
            </div>
          </div>
        \`;
      }).join('');

      document.querySelectorAll('[data-module-nav]').forEach((button) => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedModule = button.dataset.moduleNav;
          switchView('modules');
        });
      });
      refreshIcons();
    }

`;
  html = html.slice(0, renderSidebarStartIndex) + replacementSidebar + html.slice(renderSidebarEndIndex);
  console.log('Sidebar rendering logic successfully updated with accordion structure.');
} else {
  console.error('Sidebar rendering logic indices not found!');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully completed dashboard edits!');
console.log('New dashboard.html length:', html.length);
