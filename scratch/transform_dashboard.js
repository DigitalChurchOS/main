/**
 * Transform dashboard.html to v7 Charcoal Grace design
 * 
 * Strategy:
 * 1. Replace CSS variables + add v7 layout CSS (preserving module-internal styles)
 * 2. Replace sidebar HTML with v7 rail + subnav dual sidebar
 * 3. Replace topbar HTML with v7 topbar
 * 4. Update JS: applyTheme, renderSidebarModules, switchView, init, add helpers
 * 5. Remove corrupt duplicate (lines 24837+)
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, '..', 'dashboard.html');
const V7_PATH = path.join(__dirname, '..', 'md', 'tenant-dashboard-preview-updated-v7.html');
const OUTPUT_PATH = DASHBOARD_PATH;
const APPS_OUTPUT = path.join(__dirname, '..', 'apps', 'tenant-dashboard', 'public', 'index.html');

console.log('Reading files...');
const dashboard = fs.readFileSync(DASHBOARD_PATH, 'utf8');
const v7 = fs.readFileSync(V7_PATH, 'utf8');

const lines = dashboard.split('\n');
console.log(`Dashboard: ${lines.length} lines`);

// ─── Step 0: Remove corrupt duplicate (keep lines 1-24836) ─────────────
console.log('Step 0: Removing corrupt duplicate...');
const cleanLines = lines.slice(0, 24836);
console.log(`Cleaned: ${cleanLines.length} lines`);

// ─── Step 1: Extract and merge CSS ─────────────────────────────────────
console.log('Step 1: Merging CSS...');

// Extract v7 CSS (lines 9-975 of the v7 file, 0-indexed: 8-974)
const v7Lines = v7.split('\n');
const v7Css = v7Lines.slice(8, 975).join('\n');

// From the dashboard, keep:
// - Login wall styles (lines ~111-200 approx)
// - Modal/dialog floating field styles (lines ~266-404)
// - Module-specific inline styles (console container CSS)
// - Everything from line ~800 onwards that's module-specific

// The approach: replace the entire <style> block (lines 11-2195) with:
// 1. The v7 CSS verbatim
// 2. A compatibility mapping section for the dashboard's original variable names
// 3. The dashboard's module-internal CSS that doesn't exist in v7

// Extract dashboard-specific CSS that must be preserved
// These are styles between the end of layout rules and the end of </style>
// Specifically: login wall, modal/dialog float fields, console-internal styles, etc.

const dashCssLines = cleanLines.slice(10, 2195); // lines 11-2195 (0-indexed 10-2194)

// Find sections we need to preserve from dashboard CSS:
// 1. Login wall styles (.login-wall through .login-card)
// 2. Floating field styles (.modal-content .field.floating-field)  
// 3. Module-specific styles (.cms-*, prayer-room, etc.) - these are after line ~800
// 4. Settings/profile styles
// 5. Media queries for dashboard layout

// Let's extract everything from line 800 (0-indexed in dashCssLines) onward 
// These are the module-internal styles not covered by v7
const moduleSpecificStart = dashCssLines.findIndex(l => l.includes('.module-settings-list'));
const moduleSpecificCss = moduleSpecificStart >= 0 
  ? dashCssLines.slice(moduleSpecificStart).join('\n')
  : '';

// Extract login wall CSS (from .login-wall to .field)
const loginStart = dashCssLines.findIndex(l => l.includes('.login-wall'));
const loginEnd = dashCssLines.findIndex((l, i) => i > loginStart && l.includes('.modal-content .field.floating-field'));
const loginCss = loginStart >= 0 && loginEnd >= 0 
  ? dashCssLines.slice(loginStart, loginEnd).join('\n')
  : '';

// Extract floating field CSS
const floatStart = dashCssLines.findIndex(l => l.includes('.modal-content .field.floating-field'));
const floatEnd = dashCssLines.findIndex((l, i) => i > floatStart && l.trim().startsWith('.btn'));
const floatCss = floatStart >= 0 && floatEnd >= 0
  ? dashCssLines.slice(floatStart, floatEnd).join('\n')
  : '';

// Extract all CSS from line 800+ (0-indexed in the CSS block)
// This includes: status styles, table styles, CMS-specific styles, console container styles, etc.
const extendedModuleCss = dashCssLines.slice(790).join('\n');

// Build the new <style> block
const newStyleBlock = `  <style>
${v7Css}

    /* ══════════ COMPATIBILITY BRIDGE ══════════ */
    /* Maps original dashboard variable names to v7 equivalents */
    :root {
      --panel: var(--surface-strong);
      --panel-2: var(--surface-2);
      --soft-surface: var(--surface-2);
      --sidebar: var(--rail-bg);
      --topbar: var(--glass);
      --shadow: var(--shadow-card);
      --radius: var(--radius-sm);
      --select-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23A7AFBC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      --z-system-dialog: 99999;
      --z-dropdown-menu: 100500;
      --status-published: #4ADE80;
      --status-draft: #8A94A6;
    }
    html[data-theme="light"] {
      --status-published: #15803D;
      --status-draft: #68707D;
      --select-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2368707D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    }

    /* ══════════ LOGIN WALL ══════════ */
${loginCss}

    /* ══════════ FLOATING FIELDS ══════════ */
${floatCss}

    /* ══════════ MODULE-INTERNAL STYLES ══════════ */
${extendedModuleCss}

    /* ══════════ LIGHT MODE OVERRIDES (compatibility) ══════════ */
    html[data-theme="light"] .login-brand { background: #F7F8FA; }
    html[data-theme="light"] .panel, html[data-theme="light"] .metric,
    html[data-theme="light"] .module-card, html[data-theme="light"] .settings-card {
      background: var(--surface-strong); box-shadow: none;
    }
    html[data-theme="light"] .brand-mark { box-shadow: none; }
    html[data-theme="light"] input, html[data-theme="light"] select,
    html[data-theme="light"] textarea {
      background: rgba(255,255,255,.78); border-color: rgba(15,23,42,.14);
    }
    html[data-theme="light"] .modal-content select,
    html[data-theme="light"] .system-dialog-card select {
      background-color: rgba(255,255,255,.78) !important;
      border-color: rgba(15,23,42,.14) !important;
    }
    html[data-theme="light"] .modal-content .field.floating-field input,
    html[data-theme="light"] .modal-content .field.floating-field textarea,
    html[data-theme="light"] .system-dialog-card .field.floating-field input,
    html[data-theme="light"] .system-dialog-card .field.floating-field textarea {
      background: rgba(255,255,255,.76) !important;
      border-color: rgba(15,23,42,.16) !important;
    }

    /* ══════════ ADDITIONAL SHELL OVERRIDES ══════════ */
    .nav-button { display: none; }
    .nav-section-title { display: none; }
    .sidebar-footer { display: none; }
    .module-nav-list { display: none; }
    .sidebar-category { display: none; }
  </style>`;

// ─── Step 2: Replace sidebar HTML ──────────────────────────────────────
console.log('Step 2: Building new sidebar...');

const newSidebarHtml = `    <aside class="sidebar" aria-label="Tenant dashboard navigation">
      <section class="rail">
        <button class="rail-logo" title="Digital Church OS" onclick="navigateHome()"><i data-lucide="church"></i></button>
        <div class="rail-main" id="railMain"></div>
        <div class="rail-footer" id="railFooter"></div>
      </section>
      <section class="subnav">
        <div class="subnav-head">
          <button class="context-card" onclick="showToast('Church context switcher coming soon.')">
            <span>
              <small>Church Context</small>
              <strong id="tenantName">Next Church</strong>
            </span>
            <i data-lucide="chevron-right"></i>
          </button>
          <div class="search-box">
            <i data-lucide="search"></i>
            <input id="sidebarSearch" placeholder="Search modules..." oninput="renderSidebarModules()" />
          </div>
        </div>
        <div class="subnav-content">
          <div class="subnav-title" id="subnavTitle">Workspace</div>
          <div class="subnav-list" id="subnavList"></div>
        </div>
      </section>
    </aside>`;

// ─── Step 3: Replace topbar HTML ───────────────────────────────────────
console.log('Step 3: Building new topbar...');

const newTopbarHtml = `      <header class="topbar">
        <div class="topbar-left">
          <button class="btn icon hamburger" onclick="toggleMobileSidebar(true)" title="Open menu"><i data-lucide="menu"></i></button>
          <div class="title-group">
            <h1 id="viewTitle"><i data-lucide="layout-dashboard"></i><span>Tenant Dashboard</span></h1>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="btn icon" onclick="showToast('Quick actions coming soon.')" title="Quick actions"><i data-lucide="sparkles"></i></button>
          <div style="position:relative">
            <button class="btn icon" onclick="toggleAccentMenu()" title="Accent colors"><i data-lucide="palette"></i></button>
            <div class="accent-menu" id="accentMenu">
              <button class="swatch" data-color="orange" onclick="setAccent('orange')"></button>
              <button class="swatch" data-color="blue" onclick="setAccent('blue')"></button>
              <button class="swatch" data-color="purple" onclick="setAccent('purple')"></button>
              <button class="swatch" data-color="green" onclick="setAccent('green')"></button>
              <button class="swatch" data-color="red" onclick="setAccent('red')"></button>
              <button class="swatch" data-color="pink" onclick="setAccent('pink')"></button>
              <button class="swatch" data-color="gray" onclick="setAccent('gray')"></button>
            </div>
          </div>
          <button class="btn icon" id="modeBtn" onclick="toggleThemeV7()" title="Toggle theme"><i data-lucide="sun-moon"></i></button>
          <button class="btn icon" onclick="showToast('3 notifications are ready for review.')" title="Notifications"><i data-lucide="bell"></i></button>
          <div style="position:relative">
            <button class="btn profile-btn" onclick="toggleProfileMenu()">
              <span class="avatar">AD</span>
              <span class="label-text" id="userName">Admin User</span>
              <i data-lucide="chevron-down"></i>
            </button>
            <div class="profile-menu" id="profileMenu">
              <button class="menu-link" onclick="switchView('profile')"><i data-lucide="user-round"></i>View profile</button>
              <button class="menu-link" onclick="switchView('settings')"><i data-lucide="settings"></i>Dashboard settings</button>
              <button class="menu-link" id="logoutBtn"><i data-lucide="log-out"></i>Sign out</button>
            </div>
          </div>
        </div>
      </header>`;

// ─── Step 4: Build the JS additions ────────────────────────────────────
console.log('Step 4: Building new JS helpers...');

// The v7 sidebar categories map our existing dashboard modules
const newJsFunctions = `
    /* ══════════ V7 SHELL HELPERS ══════════ */
    const sidebarCategories = [
      { key: 'workspace', label: 'Workspace', icon: 'layout-dashboard', views: [
        { key: 'overview', name: 'Dashboard', icon: 'layout-dashboard' },
        { key: 'settings', name: 'Settings', icon: 'settings' },
        { key: 'profile', name: 'Profile', icon: 'user-round' }
      ]},
      { key: 'churchfront', label: 'Churchfront', icon: 'monitor', modules: ['churchfront'] },
      { key: 'connect', label: 'Connect', icon: 'heart-handshake' },
      { key: 'outreach', label: 'Outreach', icon: 'megaphone' },
      { key: 'growth', label: 'Growth', icon: 'trending-up' },
      { key: 'care', label: 'Care', icon: 'smile' },
      { key: 'discipleship', label: 'Discipleship', icon: 'graduation-cap' },
      { key: 'media', label: 'Media', icon: 'film' },
      { key: 'giving', label: 'Giving', icon: 'hand-coins' },
      { key: 'sales', label: 'Sales', icon: 'shopping-cart' },
      { key: 'admin', label: 'Church Admin', icon: 'briefcase' },
      { key: 'platform', label: 'Platform', icon: 'shield-check', footer: true, views: [
        { key: 'superAdmin', name: 'Super Admin', icon: 'shield-check' }
      ]},
      { key: 'settingsFooter', label: 'Settings', icon: 'sliders-horizontal', footer: true }
    ];

    let activeRailCategory = 'workspace';

    function getModulesForCategory(catKey) {
      const catMap = {
        'churchfront': ['churchfront'],
        'connect': modules.filter(m => m.category === 'Connect').map(m => m.key),
        'outreach': modules.filter(m => m.category === 'Outreach').map(m => m.key),
        'growth': modules.filter(m => m.category === 'Growth').map(m => m.key),
        'care': modules.filter(m => m.category === 'Care').map(m => m.key),
        'discipleship': modules.filter(m => m.category === 'Discipleship').map(m => m.key),
        'media': modules.filter(m => m.category === 'Media' || m.category === 'Media & Apps').map(m => m.key),
        'giving': modules.filter(m => m.category === 'Giving').map(m => m.key),
        'sales': modules.filter(m => m.category === 'Sales').map(m => m.key),
        'admin': modules.filter(m => m.category === 'Church Admin').map(m => m.key),
        'settingsFooter': modules.filter(m => m.category === 'Settings').map(m => m.key),
      };
      return (catMap[catKey] || []).map(k => modules.find(m => m.key === k)).filter(Boolean);
    }

    function renderRail() {
      const mainEl = document.getElementById('railMain');
      const footerEl = document.getElementById('railFooter');
      if (!mainEl || !footerEl) return;

      const mainCats = sidebarCategories.filter(c => !c.footer);
      const footerCats = sidebarCategories.filter(c => c.footer);

      mainEl.innerHTML = mainCats.map(c => 
        \`<button class="rail-btn \${activeRailCategory === c.key ? 'active' : ''}" onclick="selectRailCategory('\${c.key}')" title="\${c.label}">
          <i data-lucide="\${c.icon}"></i><span>\${c.label}</span>
        </button>\`
      ).join('');

      footerEl.innerHTML = footerCats.map(c =>
        \`<button class="rail-btn \${activeRailCategory === c.key ? 'active' : ''}" onclick="selectRailCategory('\${c.key}')" title="\${c.label}">
          <i data-lucide="\${c.icon}"></i><span>\${c.label}</span>
        </button>\`
      ).join('');
    }

    function selectRailCategory(catKey) {
      activeRailCategory = catKey;
      const cat = sidebarCategories.find(c => c.key === catKey);
      if (!cat) return;

      // If the category has views (workspace, platform), auto-select first view
      if (cat.views && cat.views.length > 0) {
        switchView(cat.views[0].key);
      } else {
        // It's a module category - select first module
        const catModules = getModulesForCategory(catKey);
        if (catModules.length > 0) {
          selectedModule = catModules[0].key;
          switchView('modules');
        }
      }
      document.getElementById('sidebarSearch').value = '';
      renderRail();
      renderSidebarModules();
      refreshIcons();
    }

    function navigateHome() {
      activeRailCategory = 'workspace';
      switchView('overview');
      renderRail();
      renderSidebarModules();
      refreshIcons();
    }

    function toggleAccentMenu() {
      const menu = document.getElementById('accentMenu');
      if (menu) menu.classList.toggle('show');
    }

    function setAccent(color) {
      document.documentElement.dataset.accent = color;
      localStorage.setItem('tenantAccent', color);
      const menu = document.getElementById('accentMenu');
      if (menu) menu.classList.remove('show');
    }

    function toggleProfileMenu() {
      const menu = document.getElementById('profileMenu');
      if (menu) menu.classList.toggle('show');
    }

    function toggleThemeV7() {
      const html = document.documentElement;
      const current = html.dataset.theme;
      html.dataset.theme = current === 'dark' ? 'light' : 'dark';
      state.theme.mode = html.dataset.theme;
      saveState(\`Theme switched to \${state.theme.mode} mode\`);
    }

    function toggleMobileSidebar(show) {
      document.body.classList.toggle('sidebar-open', show);
    }

    function showToast(message) {
      let t = document.getElementById('toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:800;background:var(--surface-strong);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-soft);padding:12px 14px;max-width:360px;font-size:13px;font-weight:750;color:var(--text);transition:opacity .3s ease;';
        document.body.appendChild(t);
      }
      t.textContent = message;
      t.style.opacity = '1';
      t.classList.remove('hidden');
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('hidden'), 300); }, 2800);
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-btn') && !e.target.closest('#profileMenu')) {
        const pm = document.getElementById('profileMenu');
        if (pm) pm.classList.remove('show');
      }
      if (!e.target.closest('#accentMenu') && !e.target.closest('[title="Accent colors"]')) {
        const am = document.getElementById('accentMenu');
        if (am) am.classList.remove('show');
      }
    });
`;

// ─── Now assemble the final file ───────────────────────────────────────
console.log('Assembling final file...');

// Strategy: work with the cleaned lines (1-24836) and do precise replacements

let result = cleanLines.join('\n');

// 1. Replace the <style> block (lines 11-2195, i.e. from "  <style>" to "  </style>")
const styleStart = result.indexOf('  <style>');
const styleEnd = result.indexOf('  </style>') + '  </style>'.length;
result = result.substring(0, styleStart) + newStyleBlock + result.substring(styleEnd);

// 2. Find and replace the sidebar HTML 
// The sidebar is between: <aside class="sidebar"> ... </aside>
const sidebarStart = result.indexOf('    <aside class="sidebar">');
const sidebarEnd = result.indexOf('    </aside>') + '    </aside>'.length;
result = result.substring(0, sidebarStart) + newSidebarHtml + result.substring(sidebarEnd);

// 3. Replace the topbar HTML
const topbarStart = result.indexOf('      <header class="topbar">');
const topbarEnd = result.indexOf('      </header>') + '      </header>'.length;
result = result.substring(0, topbarStart) + newTopbarHtml + result.substring(topbarEnd);

// 4. Add mobile backdrop before <main id="appShell">
const appShellPos = result.indexOf('  <main id="appShell"');
result = result.substring(0, appShellPos) + 
  '  <div class="mobile-backdrop" onclick="toggleMobileSidebar(false)"></div>\n' + 
  result.substring(appShellPos);

// 5. Add toast + drawer/modal overlays before first <script>
const firstScript = result.indexOf('  <script>');
const overlayHtml = `  <div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer(event)">
    <aside class="drawer" id="drawer"></aside>
  </div>
  <div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)">
    <div class="modal" id="modal"></div>
  </div>
  <div id="toast" class="hidden" style="position:fixed;right:22px;bottom:22px;z-index:800;background:var(--surface-strong);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-soft);padding:12px 14px;max-width:360px;font-size:13px;font-weight:750;color:var(--text)"></div>

`;
result = result.substring(0, firstScript) + overlayHtml + result.substring(firstScript);

// 6. Replace applyTheme() function
const applyThemeStart = result.indexOf('    function applyTheme() {');
const applyThemeEnd = result.indexOf('    function hexToRgba(');
const newApplyTheme = `    function applyTheme() {
      const html = document.documentElement;
      // Set data-theme attribute for v7 CSS
      html.dataset.theme = state.theme.mode || 'dark';
      // Legacy body.light support
      document.body.classList.toggle('light', state.theme.mode === 'light');
      
      // Restore accent from localStorage or state
      const savedAccent = localStorage.getItem('tenantAccent');
      if (savedAccent && !html.dataset.accent) {
        html.dataset.accent = savedAccent;
      }
      if (!html.dataset.accent) {
        html.dataset.accent = 'blue'; // default accent
      }
      
      const iframe = document.getElementById('workspaceIframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'themeChange',
          theme: state.theme.mode,
          accent: state.theme.accent
        }, '*');
      }
    }

`;
result = result.substring(0, applyThemeStart) + newApplyTheme + result.substring(applyThemeEnd);

// 7. Replace renderSidebarModules() function 
const renderSidebarStart = result.indexOf('    function renderSidebarModules() {');
const renderSidebarEnd = result.indexOf('    function renderModuleCards()');
const newRenderSidebar = `    function renderSidebarModules() {
      const subnavTitle = document.getElementById('subnavTitle');
      const subnavList = document.getElementById('subnavList');
      if (!subnavTitle || !subnavList) return;

      const q = (document.getElementById('sidebarSearch')?.value || '').trim().toLowerCase();
      
      if (q) {
        // Search mode: search all modules
        subnavTitle.textContent = 'Search Results';
        const filtered = modules.filter(m => 
          \`\${m.name} \${m.desc} \${m.category}\`.toLowerCase().includes(q)
        );
        subnavList.innerHTML = filtered.map(m => \`
          <button class="subnav-item \${currentView === 'modules' && selectedModule === m.key ? 'active' : ''}" onclick="selectModule('\${m.key}')">
            <i data-lucide="\${m.icon}"></i><span>\${m.name}</span><i class="chev" data-lucide="chevron-right"></i>
          </button>
        \`).join('') || \`<div class="list-item"><div class="list-icon"><i data-lucide="search-x"></i></div><div><strong>No results</strong><span>Try searching for prayer, giving, media, or settings.</span></div></div>\`;
      } else {
        // Category mode
        const cat = sidebarCategories.find(c => c.key === activeRailCategory);
        if (!cat) return;
        subnavTitle.textContent = cat.label;

        if (cat.views) {
          // Workspace or platform category - show views
          subnavList.innerHTML = cat.views.map(v => \`
            <button class="subnav-item \${currentView === v.key ? 'active' : ''}" onclick="switchView('\${v.key}')">
              <i data-lucide="\${v.icon}"></i><span>\${v.name}</span><i class="chev" data-lucide="chevron-right"></i>
            </button>
          \`).join('');
        } else {
          // Module category - show modules
          const catModules = getModulesForCategory(activeRailCategory);
          subnavList.innerHTML = catModules.map(m => {
            const entitlement = state.entitlements[m.key] || { paid: false, live: false };
            const stateLabel = entitlement.paid && entitlement.live ? 'Live' : entitlement.paid ? 'Paid' : 'Preview';
            return \`
              <button class="subnav-item \${currentView === 'modules' && selectedModule === m.key ? 'active' : ''}" onclick="selectModule('\${m.key}')">
                <i data-lucide="\${m.icon}"></i><span>\${m.name}</span><i class="chev" data-lucide="chevron-right"></i>
              </button>
            \`;
          }).join('');
        }
      }
      refreshIcons();
    }

    function selectModule(moduleKey) {
      selectedModule = moduleKey;
      // Find which rail category this module belongs to
      const mod = modules.find(m => m.key === moduleKey);
      if (mod) {
        const catMap = {
          'Churchfront': 'churchfront', 'Connect': 'connect', 'Outreach': 'outreach',
          'Growth': 'growth', 'Care': 'care', 'Discipleship': 'discipleship',
          'Media': 'media', 'Media & Apps': 'media', 'Giving': 'giving',
          'Sales': 'sales', 'Church Admin': 'admin', 'Settings': 'settingsFooter'
        };
        if (catMap[mod.category]) activeRailCategory = catMap[mod.category];
      }
      switchView('modules');
      renderRail();
      renderSidebarModules();
    }

`;
result = result.substring(0, renderSidebarStart) + newRenderSidebar + result.substring(renderSidebarEnd);

// 8. Replace switchView() to update topbar with v7 format
const switchViewStart = result.indexOf('    function switchView(view) {');
const switchViewEnd = result.indexOf('    function liveModules(');
const newSwitchView = `    function switchView(view) {
      currentView = view;
      document.querySelectorAll('.view').forEach((item) => item.classList.add('hidden'));
      const viewEl = document.getElementById(\`\${view}View\`);
      if (viewEl) viewEl.classList.remove('hidden');

      if (view === 'settings') {
        if (selectedModule && modules.some(m => m.key === selectedModule)) {
          activeSettingsTab = selectedModule;
        } else {
          activeSettingsTab = 'general';
        }
      }

      // Update topbar title with v7 icon format
      const titleEl = document.getElementById('viewTitle');
      if (titleEl) {
        const icons = { overview: 'layout-dashboard', modules: 'puzzle', settings: 'settings', profile: 'user-round', superAdmin: 'shield-check' };
        const labels = { overview: 'Dashboard', modules: 'Module Hub', settings: 'Settings', profile: 'Profile', superAdmin: 'Super Admin' };
        
        if (view === 'modules') {
          const module = modules.find((m) => m.key === selectedModule) || modules[0];
          titleEl.innerHTML = \`<i data-lucide="\${module.icon}"></i><span>\${module.name}</span>\`;
        } else {
          titleEl.innerHTML = \`<i data-lucide="\${icons[view] || 'layout-dashboard'}"></i><span>\${labels[view] || view}</span>\`;
        }
      }

      // Update rail and subnav to reflect current state
      if (['overview', 'settings', 'profile'].includes(view)) {
        activeRailCategory = 'workspace';
      } else if (view === 'superAdmin') {
        activeRailCategory = 'platform';
      }
      renderRail();
      renderSidebarModules();
      render();
    }

`;
result = result.substring(0, switchViewStart) + newSwitchView + result.substring(switchViewEnd);

// 9. Replace render() to also call renderRail
const renderFuncStr = '    function render() {';
const renderFuncPos = result.indexOf(renderFuncStr);
const renderBodyStart = result.indexOf('{', renderFuncPos) + 1;
// Find the first line of render body
const renderFirstLine = result.indexOf('\n', renderBodyStart) + 1;
// Insert renderRail() call at the top of render()
const renderRailCall = '      renderRail();\n';
result = result.substring(0, renderFirstLine) + renderRailCall + result.substring(renderFirstLine);

// 10. Replace init() event listeners for the new elements
// Replace the modeBtn click handler to use toggleThemeV7
result = result.replace(
  "document.getElementById('modeBtn').addEventListener('click', () => {\n        state.theme.mode = state.theme.mode === 'dark' ? 'light' : 'dark';\n        applyTheme();\n        saveState(`Theme switched to ${state.theme.mode} mode`);\n      });",
  "// modeBtn handled via onclick='toggleThemeV7()' in HTML"
);

// Replace old view-button click handlers
result = result.replace(
  "document.querySelectorAll('[data-view]').forEach((button) => {\n        button.addEventListener('click', () => switchView(button.dataset.view));\n      });\n      document.querySelectorAll('[data-view-jump]').forEach((button) => {\n        button.addEventListener('click', () => switchView(button.dataset.viewJump));\n      });",
  "document.querySelectorAll('[data-view-jump]').forEach((button) => {\n        button.addEventListener('click', () => switchView(button.dataset.viewJump));\n      });"
);

// Move logoutBtn listener to work with the new HTML (it's now inside profile menu)
// The existing init() listener should still work since it uses getElementById

// 11. Insert new JS functions before init(); call
const initCallPos = result.lastIndexOf('    init();');
result = result.substring(0, initCallPos) + newJsFunctions + '\n' + result.substring(initCallPos);

// 12. Set initial data attributes on <html> tag
result = result.replace('<html lang="en">', '<html lang="en" data-theme="dark" data-accent="blue">');

// ─── Write output ──────────────────────────────────────────────────────
console.log('Writing output files...');
fs.writeFileSync(OUTPUT_PATH, result, 'utf8');
console.log(`Written: ${OUTPUT_PATH} (${result.split('\n').length} lines)`);

// Copy to apps directory
try {
  fs.mkdirSync(path.dirname(APPS_OUTPUT), { recursive: true });
  fs.writeFileSync(APPS_OUTPUT, result, 'utf8');
  console.log(`Synced: ${APPS_OUTPUT}`);
} catch (e) {
  console.log(`Warning: Could not sync to apps directory: ${e.message}`);
}

console.log('Done!');
