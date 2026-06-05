const fs = require('fs');
const path = require('path');

const BACKUP_PATH = path.join(__dirname, '..', 'dashboard.html.bak');
const V7_PATH = path.join(__dirname, '..', 'md', 'tenant-dashboard-preview-updated-v7.html');
const OUTPUT_PATH = path.join(__dirname, '..', 'dashboard.html');
const APPS_OUTPUT = path.join(__dirname, '..', 'apps', 'tenant-dashboard', 'public', 'index.html');

console.log('Restoring v7 dashboard...');
const backup = fs.readFileSync(BACKUP_PATH, 'utf8');
const v7 = fs.readFileSync(V7_PATH, 'utf8');

const lines = backup.split('\n');
console.log(`Original backup size: ${lines.length} lines`);

// Keep lines 1-24836 (remove corrupt duplicate)
const cleanLines = lines.slice(0, 24836);
console.log(`Cleaned backup size: ${cleanLines.length} lines`);

// Extract v7 CSS (lines 9-974 of the v7 file, 0-indexed: 8-974. Exclude the </style> on index 974)
const v7Lines = v7.split('\n');
const v7Css = v7Lines.slice(8, 974).join('\n');

// Extract dashboard-specific CSS from cleanLines (lines 11-2194, 0-indexed 10-2194. Exclude </style> on 2194)
const dashCssLines = cleanLines.slice(10, 2194);

// Find and extract login wall CSS
const loginStart = dashCssLines.findIndex(l => l.includes('.login-wall'));
const loginEnd = dashCssLines.findIndex((l, i) => i > loginStart && l.includes('.modal-content .field.floating-field'));
const loginCss = loginStart >= 0 && loginEnd >= 0 
  ? dashCssLines.slice(loginStart, loginEnd).join('\n')
  : '';

// Find and extract floating field CSS
const floatStart = dashCssLines.findIndex(l => l.includes('.modal-content .field.floating-field'));
const floatEnd = dashCssLines.findIndex((l, i) => i > floatStart && l.trim().startsWith('.btn'));
const floatCss = floatStart >= 0 && floatEnd >= 0
  ? dashCssLines.slice(floatStart, floatEnd).join('\n')
  : '';

// Extract all module-specific CSS (index 790 onwards in dashCssLines)
const extendedModuleCss = dashCssLines.slice(790).join('\n');

// Build style block
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

// Build Sidebar HTML
const sidebarHtml = `    <aside class="sidebar" aria-label="Tenant dashboard navigation">
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

// Build Topbar HTML
const topbarHtml = `      <header class="topbar">
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

// Welcome Top HTML Banner
const welcomeBannerHtml = `          <section class="welcome-home-top" aria-label="Tenant welcome overview">
            <div class="welcome-bg-wrapper" id="welcome-bg-wrapper" aria-hidden="true">
              <img src="light.png" class="welcome-bg-image welcome-bg-light" alt="" />
              <img src="dark.png" class="welcome-bg-image welcome-bg-dark" alt="" />
              <div class="welcome-bg-overlay-tint"></div>
            </div>
            <div class="welcome-home-copy">
              <div class="eyebrow"><i data-lucide="sparkles"></i>Tenant Command Center</div>
              <h2 id="overviewWelcomeHeading">Good evening, Lagos Central Campus.</h2>
              <p>Your dashboard gives you a live snapshot of website readiness, members, giving, media, prayer, outreach, and ministry operations.</p>
            </div>
            <div class="welcome-home-actions">
              <button class="btn primary" onclick="switchView('settings')"><i data-lucide="clipboard-check"></i>Finish Setup</button>
              <button class="btn" onclick="selectModule('churchfront')"><i data-lucide="external-link"></i>Preview Site</button>
            </div>
          </section>`;

// Build JS Additions
const jsHelpers = `
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

      if (cat.views && cat.views.length > 0) {
        switchView(cat.views[0].key);
      } else {
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
      state.theme.accent = color;
      const menu = document.getElementById('accentMenu');
      if (menu) menu.classList.remove('show');
      applyTheme();
      saveState(\`Theme accent changed to \${color}\`);
    }

    function toggleProfileMenu() {
      const menu = document.getElementById('profileMenu');
      if (menu) menu.classList.toggle('show');
    }

    function toggleThemeV7() {
      state.theme.mode = state.theme.mode === 'dark' ? 'light' : 'dark';
      applyTheme();
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

    function bindWelcomeParallax() {
      const bgWrapper = document.getElementById('welcome-bg-wrapper');
      if (!bgWrapper) return;
      const updateWelcomeParallax = () => {
        const bgWrapper = document.getElementById('welcome-bg-wrapper');
        if (!bgWrapper) return;
        const y = Math.max(-180, Math.min(0, -window.scrollY * .28));
        bgWrapper.style.transform = \`translate3d(0, \${y.toFixed(2)}px, 0)\`;
      };
      updateWelcomeParallax();
      if (window.__tenantWelcomeParallaxBound) return;
      window.__tenantWelcomeParallaxBound = true;
      window.addEventListener('scroll', updateWelcomeParallax, { passive: true });
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

let result = cleanLines.join('\n');

// 1. Replace style block (from "  <style>" to "  </style>")
const styleStart = result.indexOf('  <style>');
const styleEnd = result.indexOf('  </style>') + '  </style>'.length;
result = result.substring(0, styleStart) + newStyleBlock + result.substring(styleEnd);

// 2. Replace sidebar HTML
const sidebarStart = result.indexOf('    <aside class="sidebar">');
const sidebarEnd = result.indexOf('    </aside>') + '    </aside>'.length;
result = result.substring(0, sidebarStart) + sidebarHtml + result.substring(sidebarEnd);

// 3. Replace topbar HTML
const topbarStart = result.indexOf('      <header class="topbar">');
const topbarEnd = result.indexOf('      </header>') + '      </header>'.length;
result = result.substring(0, topbarStart) + topbarHtml + result.substring(topbarEnd);

// 4. Add mobile backdrop
const appShellPos = result.indexOf('  <main id="appShell"');
result = result.substring(0, appShellPos) + 
  '  <div class="mobile-backdrop" onclick="toggleMobileSidebar(false)"></div>\n' + 
  result.substring(appShellPos);

// 5. Add overlays + toast
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

// 6. Insert welcome-home-top banner HTML inside overviewView
const metricsPos = result.indexOf('          <div id="metrics" class="grid metrics"></div>');
result = result.substring(0, metricsPos) + welcomeBannerHtml + '\n' + result.substring(metricsPos);

// 7. Replace applyTheme()
const applyThemeStart = result.indexOf('    function applyTheme() {');
const applyThemeEnd = result.indexOf('    function hexToRgba(');
const newApplyTheme = `    function applyTheme() {
      const html = document.documentElement;
      html.dataset.theme = state.theme.mode || 'dark';
      document.body.classList.toggle('light', state.theme.mode === 'light');
      
      const savedAccent = localStorage.getItem('tenantAccent');
      if (savedAccent && !html.dataset.accent) {
        html.dataset.accent = savedAccent;
      }
      if (!html.dataset.accent) {
        html.dataset.accent = 'blue';
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

// 8. Replace renderSidebarModules()
const renderSidebarStart = result.indexOf('    function renderSidebarModules() {');
const renderSidebarEnd = result.indexOf('    function renderModuleCards()');
const newRenderSidebar = `    function renderSidebarModules() {
      const subnavTitle = document.getElementById('subnavTitle');
      const subnavList = document.getElementById('subnavList');
      if (!subnavTitle || !subnavList) return;

      const q = (document.getElementById('sidebarSearch')?.value || '').trim().toLowerCase();
      
      if (q) {
        subnavTitle.textContent = 'Search Results';
        const filtered = modules.filter(m => 
          \`\${m.name} \dots \${m.category}\`.toLowerCase().includes(q)
        );
        subnavList.innerHTML = filtered.map(m => \`
          <button class="subnav-item \${currentView === 'modules' && selectedModule === m.key ? 'active' : ''}" onclick="selectModule('\${m.key}')">
            <i data-lucide="\${m.icon}"></i><span>\${m.name}</span><i class="chev" data-lucide="chevron-right"></i>
          </button>
        \`).join('') || \`<div class="list-item"><div class="list-icon"><i data-lucide="search-x"></i></div><div><strong>No results</strong><span>Try searching for prayer, giving, media, or settings.</span></div></div>\`;
      } else {
        const cat = sidebarCategories.find(c => c.key === activeRailCategory);
        if (!cat) return;
        subnavTitle.textContent = cat.label;

        if (cat.views) {
          subnavList.innerHTML = cat.views.map(v => \`
            <button class="subnav-item \${currentView === v.key ? 'active' : ''}" onclick="switchView('\${v.key}')">
              <i data-lucide="\${v.icon}"></i><span>\${v.name}</span><i class="chev" data-lucide="chevron-right"></i>
            </button>
          \`).join('');
        } else {
          const catModules = getModulesForCategory(activeRailCategory);
          subnavList.innerHTML = catModules.map(m => \`
            <button class="subnav-item \${currentView === 'modules' && selectedModule === m.key ? 'active' : ''}" onclick="selectModule('\${m.key}')">
              <i data-lucide="\${m.icon}"></i><span>\${m.name}</span><i class="chev" data-lucide="chevron-right"></i>
            </button>
          \`).join('');
        }
      }
      refreshIcons();
    }

    function selectModule(moduleKey) {
      selectedModule = moduleKey;
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

// 9. Replace switchView()
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

// 10. Replace render() to add greeting and call bindWelcomeParallax()
const renderFuncPos = result.indexOf('    function render() {');
const renderBodyStart = result.indexOf('{', renderFuncPos) + 1;
const renderFirstLine = result.indexOf('\n', renderBodyStart) + 1;
const renderAdditions = `      renderRail();
      applyTheme();
      document.getElementById('tenantName').textContent = state.tenant.name;
      document.getElementById('userName').textContent = state.user.name;
      
      const greetingEl = document.getElementById('overviewWelcomeHeading');
      if (greetingEl) {
        const hr = new Date().getHours();
        const timeOfDay = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
        greetingEl.textContent = \`Good \${timeOfDay}, \${state.tenant.name}.\`;
      }
      bindWelcomeParallax();
`;
// Replace the start of render() body
const renderBodyEndPos = result.indexOf('      renderMetrics();', renderFirstLine);
result = result.substring(0, renderFirstLine) + renderAdditions + result.substring(renderBodyEndPos);

// 11. Replace init() event listeners
result = result.replace(
  "document.getElementById('modeBtn').addEventListener('click', () => {\n        state.theme.mode = state.theme.mode === 'dark' ? 'light' : 'dark';\n        applyTheme();\n        saveState(`Theme switched to ${state.theme.mode} mode`);\n      });",
  "// modeBtn handled via onclick='toggleThemeV7()' in HTML"
);

result = result.replace(
  "document.querySelectorAll('[data-view]').forEach((button) => {\n        button.addEventListener('click', () => switchView(button.dataset.view));\n      });\n      document.querySelectorAll('[data-view-jump]').forEach((button) => {\n        button.addEventListener('click', () => switchView(button.dataset.viewJump));\n      });",
  "document.querySelectorAll('[data-view-jump]').forEach((button) => {\n        button.addEventListener('click', () => switchView(button.dataset.viewJump));\n      });"
);

// 12. Insert helpers before init() call
const initCallPos = result.lastIndexOf('    init();');
result = result.substring(0, initCallPos) + jsHelpers + '\n' + result.substring(initCallPos);

// 13. Set data-theme on html
result = result.replace('<html lang="en">', '<html lang="en" data-theme="dark" data-accent="blue">');

console.log('Writing file contents...');
fs.writeFileSync(OUTPUT_PATH, result, 'utf8');
fs.writeFileSync(APPS_OUTPUT, result, 'utf8');
console.log('Restore complete!');
