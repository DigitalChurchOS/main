const fs = require('fs');
const path = require('path');

const dashboardPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\dashboard.html';
const previewPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\md\\tenant-dashboard-preview-updated-v7.html';

let html = fs.readFileSync(dashboardPath, 'utf8');
const preview = fs.readFileSync(previewPath, 'utf8');

console.log('Original dashboard.html length:', html.length);

// 1. STYLE REPLACEMENT
// Extract v7 CSS from the preview file
const styleStartTag = '<style>';
const styleEndTag = '</style>';
const styleStartIdx = preview.indexOf(styleStartTag);
const styleEndIdx = preview.indexOf(styleEndTag);
if (styleStartIdx === -1 || styleEndIdx === -1) {
  throw new Error("Could not find style block in preview file.");
}
let v7Css = preview.substring(styleStartIdx + styleStartTag.length, styleEndIdx);

// Prepend custom login wall styling and old variable compatibility mapping
const additionalCss = `
    /* Compatibility maps for older module markup */
    :root {
      --radius: var(--radius-sm);
    }
    html[data-theme="light"] {
      --panel: var(--surface);
      --panel-2: var(--surface-2);
      --soft-surface: var(--bg-soft);
      --radius: var(--radius-sm);
      --line: rgba(15, 23, 42, .10);
      --line-strong: rgba(15, 23, 42, .16);
      --border: var(--line);
      --border-strong: var(--line-strong);
    }
    html[data-theme="dark"] {
      --panel: var(--surface);
      --panel-2: var(--surface-2);
      --soft-surface: var(--bg-soft);
      --radius: var(--radius-sm);
      --line: rgba(226, 232, 240, .095);
      --line-strong: rgba(226, 232, 240, .16);
      --border: var(--line);
      --border-strong: var(--line-strong);
    }
    /* Fallback variables for body-based theme class */
    body.light {
      --bg: #f7f8fa;
      --bg-soft: #fbfaf8;
      --surface: rgba(255,255,255,.82);
      --surface-strong: #ffffff;
      --surface-2: #f1f3f6;
      --rail-bg: #f0f2f5;
      --subnav-bg: rgba(255,255,255,.88);
      --line: rgba(15, 23, 42, .10);
      --line-strong: rgba(15, 23, 42, .16);
      --text: #151923;
      --muted: #68707d;
      --muted-2: #98a2b3;
      --glass: rgba(255,255,255,.72);
      --backdrop: rgba(15,23,42,.45);
      --panel: var(--surface);
      --panel-2: var(--surface-2);
      --soft-surface: var(--bg-soft);
      --radius: var(--radius-sm);
      --border: var(--line);
      --border-strong: var(--line-strong);
    }
    body:not(.light) {
      --bg: #111723;
      --bg-soft: #151d2b;
      --surface: rgba(24, 33, 48, .84);
      --surface-strong: #182130;
      --surface-2: #202a3a;
      --rail-bg: #0d111b;
      --subnav-bg: rgba(20, 28, 42, .92);
      --line: rgba(226, 232, 240, .095);
      --line-strong: rgba(226, 232, 240, .16);
      --text: #f5f7fb;
      --muted: #a7b0c2;
      --muted-2: #707c91;
      --glass: rgba(24,33,48,.76);
      --backdrop: rgba(0,0,0,.58);
      --shadow-soft: 0 22px 70px rgba(0,0,0,.24);
      --shadow-card: 0 14px 40px rgba(0,0,0,.18);
      --panel: var(--surface);
      --panel-2: var(--surface-2);
      --soft-surface: var(--bg-soft);
      --radius: var(--radius-sm);
      --border: var(--line);
      --border-strong: var(--line-strong);
    }

    /* Login Wall Styles */
    .login-wall {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
    }
    .login-brand {
      padding: 56px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 1px solid var(--line);
      background: var(--bg-soft);
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--accent);
      color: #fff;
    }
    .brand-mark svg, .brand-mark i {
      width: 18px !important;
      height: 18px !important;
      stroke-width: 1.8 !important;
    }
    .brand-copy strong {
      display: block;
      font-size: 16px;
      line-height: 1.1;
      font-weight: 700;
    }
    .brand-copy span {
      display: block;
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .login-brand h1 {
      font-size: 32px;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0 0 16px;
      color: var(--text);
    }
    .login-brand p {
      font-size: 15px;
      line-height: 1.5;
      color: var(--muted);
      margin: 0;
    }
    .login-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background: var(--bg);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 32px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: var(--shadow-card);
    }
    .login-card h2 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    .login-card p {
      margin: 0 0 24px;
      font-size: 14px;
      color: var(--muted);
      line-height: 1.4;
    }
    @media (max-width: 900px) {
      .login-wall {
        grid-template-columns: 1fr;
      }
      .login-brand {
        display: none;
      }
    }
`;
v7Css = v7Css + additionalCss;

const dashStyleStart = html.indexOf('<style>') + '<style>'.length;
const dashStyleEnd = html.indexOf('.module-settings-list {');
if (dashStyleStart === -1 || dashStyleEnd === -1) {
  throw new Error("Could not find style boundary in dashboard.html");
}
html = html.substring(0, dashStyleStart) + "\n" + v7Css + "\n" + html.substring(dashStyleEnd);

// 2. HTML BODY REPLACEMENT (From <body> to right before <section id="modulesView")
const bodyStart = html.indexOf('<body>');
const modulesViewStart = html.indexOf('<section id="modulesView"');
if (bodyStart === -1 || modulesViewStart === -1) {
  throw new Error("Could not find HTML body or modulesView boundary in dashboard.html");
}

const replacementHtml = `<body>
  <div class="mobile-backdrop" onclick="toggleMobileSidebar(false)"></div>
  
  <!-- Login Wall -->
  <main id="loginWall" class="login-wall">
    <section class="login-brand">
      <div class="brand-lockup">
        <div class="brand-mark"><i data-lucide="church"></i></div>
        <div class="brand-copy">
          <strong>ChurchOS</strong>
          <span>Tenant command center</span>
        </div>
      </div>
      <div>
        <h1>One dashboard for every church module.</h1>
        <p>Preview every backend module, manage profile and theme settings centrally, and only publish paid modules to the public church site when the platform admin turns them live.</p>
      </div>
      <p class="muted">Demo login: any email and password.</p>
    </section>

    <section class="login-panel">
      <form id="loginForm" class="login-card">
        <h2>Sign in</h2>
        <p>Access the tenant workspace, module previews, central settings, and super-admin controls.</p>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" value="admin@demo.churchos.local" required>
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" value="demo" required>
        </div>
        <button class="btn primary w-full" type="submit"><i data-lucide="log-in"></i>Enter dashboard</button>
      </form>
    </section>
  </main>

  <!-- App Shell -->
  <main id="appShell" class="app-shell hidden">
    <aside class="sidebar" aria-label="Tenant dashboard navigation">
      <section class="rail">
        <button class="rail-logo" title="Digital Church OS" onclick="selectSidebarCategory('home')">
          <i data-lucide="church"></i>
        </button>
        <div class="rail-main" id="railMain">
          <!-- Populated dynamically -->
        </div>
        <div class="rail-footer" id="railFooter">
          <!-- Populated dynamically -->
        </div>
      </section>
      <section class="subnav">
        <div class="subnav-head">
          <button class="context-card" onclick="openChurchSwitcher()">
            <span>
              <small>Church Context</small>
              <strong id="contextChurchName">Lagos Central Campus</strong>
            </span>
            <i data-lucide="chevron-right"></i>
          </button>
          <div class="search-box">
            <i data-lucide="search"></i>
            <input id="sidebarSearch" placeholder="Search modules..." oninput="handleSidebarSearch(this.value)" />
          </div>
        </div>
        <div class="subnav-content">
          <div class="subnav-title" id="subnavTitle">Workspace</div>
          <div class="subnav-list" id="subnavList">
            <!-- Populated dynamically -->
          </div>
        </div>
      </section>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn icon hamburger" onclick="toggleMobileSidebar(true)" title="Open menu"><i data-lucide="menu"></i></button>
          <div class="title-group">
            <h1 id="pageTitle">
              <i data-lucide="home"></i>
              <span id="viewTitle">Tenant Dashboard</span>
            </h1>
            <p id="viewSubtitle" style="display:none;"></p>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="btn icon" onclick="openQuickAction()" title="Quick actions"><i data-lucide="sparkles"></i></button>
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
          <button class="btn icon" id="modeBtn" title="Toggle theme"><i data-lucide="sun-moon"></i></button>
          <button class="btn icon" onclick="showToast('3 notifications are ready for review.')" title="Notifications"><i data-lucide="bell"></i></button>
          <div style="position:relative">
            <button class="btn profile-btn" onclick="toggleProfileMenu()">
              <span class="avatar">AD</span>
              <span class="label-text" id="topbarUserName">Admin User</span>
              <i data-lucide="chevron-down"></i>
            </button>
            <div class="profile-menu" id="profileMenu">
              <button class="menu-link" onclick="handleProfileDropdownLink('profile')"><i data-lucide="user-round"></i>View profile</button>
              <button class="menu-link" onclick="handleProfileDropdownLink('settings')"><i data-lucide="settings"></i>Dashboard settings</button>
              <button class="menu-link" onclick="handleProfileDropdownLogout()"><i data-lucide="log-out"></i>Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <div class="content" id="mainContent">
        <!-- Overview View -->
        <section id="overviewView" class="view">
          <section class="welcome-home-top" aria-label="Tenant welcome overview">
            <div class="welcome-bg-wrapper" id="welcome-bg-wrapper" aria-hidden="true">
              <img src="light.png" class="welcome-bg-image welcome-bg-light" alt="" />
              <img src="dark.png" class="welcome-bg-image welcome-bg-dark" alt="" />
              <div class="welcome-bg-overlay-tint"></div>
            </div>
            <div class="welcome-home-copy">
              <div class="eyebrow"><i data-lucide="sparkles"></i>Tenant Command Center</div>
              <h2 id="welcomeTenantHeading">Good evening, Lagos Central Campus.</h2>
              <p>Your dashboard gives you a live snapshot of website readiness, members, giving, media, prayer, outreach, and ministry operations.</p>
            </div>
          </section>

          <section class="grid overview-layout">
            <div class="panel">
              <div class="section-head">
                <div>
                  <h2>Ministry Module Directory</h2>
                  <p>Every module is available for preview. Live modules are published to the church site.</p>
                </div>
                <button class="btn small" data-view-jump="modules"><i data-lucide="arrow-right"></i>Manage Directory</button>
              </div>
              <div id="featuredModules" class="grid module-grid"></div>
            </div>
            <div class="panel">
              <div class="section-head">
                <div>
                  <h2>Workspace Overview</h2>
                  <p>Central overview of active settings and entitlements.</p>
                </div>
              </div>
              <div id="settingsSummary" class="settings-list"></div>
            </div>
          </section>
        </section>
`;

html = html.substring(0, bodyStart + '<body>'.length) + "\n" + replacementHtml + "\n" + html.substring(modulesViewStart);

// 3. UI OVERLAYS (drawer and modal overlay injected right before </body>)
const bodyEndIndex = html.lastIndexOf('</body>');
if (bodyEndIndex === -1) {
  throw new Error("Could not find closing body tag in dashboard.html");
}

const overlayHtml = `
  <!-- v7 UI Overlays -->
  <div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer(event)">
    <div class="drawer" id="drawer"></div>
  </div>
  <div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)">
    <div class="modal" id="modal"></div>
  </div>
`;
html = html.substring(0, bodyEndIndex) + overlayHtml + html.substring(bodyEndIndex);

// 4. JS ACCENT COLORS REPLACEMENT
const originalColors = "const accentColors = ['#111827', '#4f46e5', '#0f766e', '#be123c', '#b45309', '#2563eb', '#7c3aed'];";
const v7AccentColors = "const accentColors = ['#f97316', '#2563eb', '#7c3aed', '#16a34a', '#c80d3d', '#db2777', '#475569'];";
if (html.includes(originalColors)) {
  html = html.replace(originalColors, v7AccentColors);
  console.log('Successfully replaced accentColors array.');
}

// 5. JS APPLYTHEME FUNCTION REPLACEMENT
const applyThemeStartStr = '    function applyTheme() {';
const hexToRgbaStr = '    function hexToRgba(';
const applyThemeIdx = html.indexOf(applyThemeStartStr);
const hexToRgbaIdx = html.indexOf(hexToRgbaStr);
if (applyThemeIdx === -1 || hexToRgbaIdx === -1) {
  throw new Error("Could not find applyTheme or hexToRgba boundaries.");
}

const replacementApplyTheme = `    function applyTheme() {
      document.body.classList.toggle('light', state.theme.mode === 'light');
      document.documentElement.dataset.theme = state.theme.mode;
      
      const accentNames = {
        '#f97316': 'orange',
        '#2563eb': 'blue',
        '#7c3aed': 'purple',
        '#16a34a': 'green',
        '#c80d3d': 'red',
        '#db2777': 'pink',
        '#475569': 'gray'
      };
      const accentName = accentNames[state.theme.accent] || 'red';
      document.documentElement.dataset.accent = accentName;

      document.documentElement.style.setProperty('--accent', state.theme.accent);
      document.documentElement.style.setProperty('--accent-strong', state.theme.accent);
      document.documentElement.style.setProperty('--accent-soft', hexToRgba(state.theme.accent, 0.14));
      document.documentElement.style.setProperty('--accent-2', hexToRgba(state.theme.accent, 0.85));
      document.documentElement.style.setProperty('--accent-shadow', hexToRgba(state.theme.accent, 0.28));

      // Sync settings toggle if it exists
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.classList.toggle('on', state.theme.mode === 'light');
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

html = html.substring(0, applyThemeIdx) + replacementApplyTheme + html.substring(hexToRgbaIdx);

// 6. JS RENDER FUNCTION REPLACEMENT
const renderStartStr = '    function render() {';
const renderMetricsStr = '    function renderMetrics() {';
const renderIdx = html.indexOf(renderStartStr);
const renderMetricsIdx = html.indexOf(renderMetricsStr);
if (renderIdx === -1 || renderMetricsIdx === -1) {
  throw new Error("Could not find render or renderMetrics boundaries.");
}

const replacementRender = `    function render() {
      applyTheme();
      
      const contextChurchName = document.getElementById('contextChurchName');
      if (contextChurchName) contextChurchName.textContent = state.tenant.name;
      
      const welcomeTenantHeading = document.getElementById('welcomeTenantHeading');
      if (welcomeTenantHeading) welcomeTenantHeading.textContent = \`Good evening, \${state.tenant.name}.\`;

      const topbarUserEl = document.getElementById('topbarUserName');
      if (topbarUserEl) topbarUserEl.textContent = state.user.name;

      renderSidebarModules();
      renderModuleCards();
      renderSettings();
      renderProfile();

      renderPreview();
      refreshIcons();

      // Trigger v7 Canvas charts & parallax binding
      setTimeout(() => {
        document.querySelectorAll('[data-chart="line"]').forEach(drawLineChart);
        document.querySelectorAll('[data-chart="bars"]').forEach(drawBarsChart);
        document.querySelectorAll('[data-chart="donut"]').forEach(drawDonutChart);
      }, 40);
      bindWelcomeParallax();
      bindModuleParallax();
    }

`;

html = html.substring(0, renderIdx) + replacementRender + html.substring(renderMetricsIdx);

// 7. JS RENDERSIDEBARMODULES FUNCTION REPLACEMENT
const renderSidebarStartStr = '    function renderSidebarModules() {';
const renderModuleCardsStr = '    function renderModuleCards() {';
const renderSidebarIdx = html.indexOf(renderSidebarStartStr);
const renderModuleCardsIdx = html.indexOf(renderModuleCardsStr);
if (renderSidebarIdx === -1 || renderModuleCardsIdx === -1) {
  throw new Error("Could not find renderSidebarModules or renderModuleCards boundaries.");
}

const replacementSidebarLogic = `    const categoriesList = [
      { key: 'home', label: 'Home', icon: 'home', title: 'Workspace' },
      { key: 'churchfront', label: 'Site', icon: 'monitor', title: 'Site' },
      { key: 'connect', label: 'Connect', icon: 'users', title: 'Connect' },
      { key: 'outreach', label: 'Outreach', icon: 'megaphone', title: 'Outreach' },
      { key: 'discipleship', label: 'Growth', icon: 'graduation-cap', title: 'Growth' },
      { key: 'media', label: 'Media', icon: 'film', title: 'Media & Apps' },
      { key: 'giving', label: 'Giving', icon: 'hand-coins', title: 'Giving' },
      { key: 'sales', label: 'Sales', icon: 'shopping-cart', title: 'Sales' },
      { key: 'admin', label: 'Admin', icon: 'briefcase', title: 'Church Admin' },
      { key: 'settings', label: 'Settings', icon: 'settings', title: 'Settings', footer: true }
    ];

    window.selectSidebarCategory = function(categoryKey) {
      window.activeSidebarCategory = categoryKey;
      window.sidebarSearchQuery = '';
      const searchInput = document.getElementById('sidebarSearch');
      if (searchInput) searchInput.value = '';
      
      if (categoryKey === 'home') {
        switchView('overview');
      } else if (categoryKey === 'settings') {
        selectSettingsTab('general');
      } else {
        const categoryKeyMap = {
          'Churchfront': 'churchfront',
          'Connect': 'connect',
          'Outreach': 'outreach',
          'Discipleship': 'discipleship',
          'Media': 'media',
          'Giving': 'giving',
          'Sales': 'sales',
          'Church Admin': 'admin',
          'Admin': 'admin',
          'Growth': 'discipleship',
          'Settings': 'settings'
        };
        const catModules = modules.filter(m => categoryKeyMap[m.category] === categoryKey);
        if (catModules.length > 0) {
          const activeModule = modules.find(m => m.key === selectedModule);
          if (!activeModule || categoryKeyMap[activeModule.category] !== categoryKey) {
            selectedModule = catModules[0].key;
          }
          switchView('modules');
        } else {
          switchView('overview');
        }
      }
      render();
    };

    window.handleSidebarSearch = function(query) {
      window.sidebarSearchQuery = query.toLowerCase().trim();
      renderSidebarModules();
    };

    function renderSidebarModules() {
      // 1. Render Rail Main & Footer
      const railMain = document.getElementById('railMain');
      const railFooter = document.getElementById('railFooter');
      
      if (railMain && railFooter) {
        railMain.innerHTML = categoriesList.filter(c => !c.footer).map(c => \`
          <button class="rail-btn \${window.activeSidebarCategory === c.key ? 'active' : ''}" onclick="selectSidebarCategory('\${c.key}')" title="\${c.label}">
            <i data-lucide="\${c.icon}"></i>
            <span>\${c.label}</span>
          </button>
        \`).join('');
        
        railFooter.innerHTML = categoriesList.filter(c => c.footer).map(c => \`
          <button class="rail-btn \${window.activeSidebarCategory === c.key ? 'active' : ''}" onclick="selectSidebarCategory('\${c.key}')" title="\${c.label}">
            <i data-lucide="\${c.icon}"></i>
            <span>\${c.label}</span>
          </button>
        \`).join('');
      }
      
      // Synchronize activeSidebarCategory based on the current view/module
      const activeModule = modules.find(m => m.key === selectedModule);
      const categoryKeyMap = {
        'Churchfront': 'churchfront',
        'Connect': 'connect',
        'Outreach': 'outreach',
        'Discipleship': 'discipleship',
        'Media': 'media',
        'Giving': 'giving',
        'Sales': 'sales',
        'Church Admin': 'admin',
        'Admin': 'admin',
        'Growth': 'discipleship',
        'Settings': 'settings'
      };
      
      if (currentView === 'overview') {
        window.activeSidebarCategory = 'home';
      } else if (currentView === 'settings') {
        window.activeSidebarCategory = 'settings';
      } else if (currentView === 'profile') {
        window.activeSidebarCategory = 'settings';
      } else if (currentView === 'modules' && activeModule) {
        window.activeSidebarCategory = categoryKeyMap[activeModule.category] || 'churchfront';
      }
      
      // Update Title
      const subnavTitleEl = document.getElementById('subnavTitle');
      if (subnavTitleEl) {
        const activeCat = categoriesList.find(c => c.key === window.activeSidebarCategory);
        subnavTitleEl.textContent = activeCat ? activeCat.title : 'Workspace';
      }

      // Update Topbar Left Category Header
      const activeCat = categoriesList.find(c => c.key === window.activeSidebarCategory);
      const pageTitleEl = document.getElementById('pageTitle');
      if (pageTitleEl && activeCat) {
        let subTitleHtml = '';
        if (currentView === 'modules') {
          const module = modules.find((m) => m.key === selectedModule) || modules[0];
          subTitleHtml = \` — \${module.name}\`;
        }
        pageTitleEl.innerHTML = \`<i data-lucide="\${activeCat.icon}"></i><span>\${activeCat.label}\${subTitleHtml}</span>\`;
      }
      
      // 2. Render Subnav List
      const subnavList = document.getElementById('subnavList');
      if (subnavList) {
        const q = (window.sidebarSearchQuery || '').trim().toLowerCase();
        let contentHtml = '';
        
        if (q) {
          if (subnavTitleEl) subnavTitleEl.textContent = 'Search Results';
          const filteredModules = modules.filter(m => 
            m.name.toLowerCase().includes(q) || 
            m.desc.toLowerCase().includes(q)
          );
          
          contentHtml = filteredModules.map(module => {
            const entitlement = state.entitlements[module.key] || { paid: false, live: false };
            const stateLabel = entitlement.paid && entitlement.live ? 'Live' : entitlement.paid ? 'Paid' : 'Preview';
            const activeClass = currentView === 'modules' && selectedModule === module.key ? 'active' : '';
            return \`
              <button class="subnav-item \${activeClass}" onclick="selectedModule='\${module.key}'; switchView('modules');" title="\${module.name}">
                <i data-lucide="\${module.icon}"></i>
                <span>\${module.name}</span>
                <small style="font-size: 8px; margin-left: auto; opacity: 0.6;">\${stateLabel}</small>
                <i class="chev" data-lucide="chevron-right"></i>
              </button>
            \`;
          }).join('');
          
          if (!contentHtml) {
            contentHtml = \`
              <div class="list-item" style="padding: 12px; color: var(--muted); text-align: center;">
                <strong>No results</strong>
                <span style="display:block; font-size:11px; margin-top:4px;">Try searching for page, media or event.</span>
              </div>
            \`;
          }
        } else if (window.activeSidebarCategory === 'home') {
          const overviewActive = currentView === 'overview' ? 'active' : '';
          const profileActive = currentView === 'profile' ? 'active' : '';
          
          contentHtml = \`
            <button class="subnav-item \${overviewActive}" onclick="switchView('overview')">
              <i data-lucide="layout-dashboard"></i>
              <span>Dashboard Home</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
            <button class="subnav-item" onclick="openQuickAction()">
              <i data-lucide="sparkles"></i>
              <span>Quick Actions</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
            <button class="subnav-item \${profileActive}" onclick="switchView('profile')">
              <i data-lucide="user-round"></i>
              <span>Admin Profile</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
          \`;
        } else if (window.activeSidebarCategory === 'settings') {
          const generalActive = currentView === 'settings' && activeSettingsTab === 'general' ? 'active' : '';
          contentHtml = \`
            <button class="subnav-item \${generalActive}" onclick="selectSettingsTab('general')">
              <i data-lucide="sliders-horizontal"></i>
              <span>General Settings</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
          \`;
          
          const seProfilesActive = currentView === 'modules' && selectedModule === 'centralized-settings-engine' && (centralizedSettingsEngineState.activeTab === 'profiles') ? 'active' : '';
          const seSchemasActive = currentView === 'modules' && selectedModule === 'centralized-settings-engine' && (centralizedSettingsEngineState.activeTab === 'schemas') ? 'active' : '';
          const seLogsActive = currentView === 'modules' && selectedModule === 'centralized-settings-engine' && (centralizedSettingsEngineState.activeTab === 'logs') ? 'active' : '';
          
          contentHtml += \`
            <button class="subnav-item \${seProfilesActive}" onclick="selectSettingsEngineTab('profiles')">
              <i data-lucide="folder-git-2"></i>
              <span>Settings Profiles</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
            <button class="subnav-item \${seSchemasActive}" onclick="selectSettingsEngineTab('schemas')">
              <i data-lucide="sliders-horizontal"></i>
              <span>Dynamic Schemas</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
            <button class="subnav-item \${seLogsActive}" onclick="selectSettingsEngineTab('logs')">
              <i data-lucide="scroll"></i>
              <span>Audit Trails</span>
              <i class="chev" data-lucide="chevron-right"></i>
            </button>
          \`;
        } else {
          const catModules = modules.filter(m => categoryKeyMap[m.category] === window.activeSidebarCategory);
          contentHtml = catModules.map(module => {
            const entitlement = state.entitlements[module.key] || { paid: false, live: false };
            const stateLabel = entitlement.paid && entitlement.live ? 'Live' : entitlement.paid ? 'Paid' : 'Preview';
            const activeClass = currentView === 'modules' && selectedModule === module.key ? 'active' : '';
            return \`
              <button class="subnav-item \${activeClass}" onclick="selectedModule='\${module.key}'; switchView('modules');" title="\${module.name}">
                <i data-lucide="\${module.icon}"></i>
                <span>\${module.name}</span>
                <small style="font-size: 8px; margin-left: auto; opacity: 0.6;">\${stateLabel}</small>
                <i class="chev" data-lucide="chevron-right"></i>
              </button>
            \`;
          }).join('');
        }
        
        subnavList.innerHTML = contentHtml;
      }
      
      refreshIcons();
    }

`;

html = html.substring(0, renderSidebarIdx) + replacementSidebarLogic + html.substring(renderModuleCardsIdx);

// 8. JS MODULECARD FUNCTION REPLACEMENT
const originalModuleCard = `    function moduleCard(module) {
      return \`
        <article class="module-card">
          <div class="module-title">
            <div class="module-icon"><i data-lucide="\${module.icon}"></i></div>
            <div>
              <h3>\${module.name}</h3>
              <p>\${module.category}</p>
            </div>
          </div>
          <p>\${module.desc}</p>
          \${module.resourceKey ? \`<code class="cms-card-slug">\${module.resourceKey}</code>\` : ''}
          \${moduleStatus(module)}
          <div class="module-actions">
            <button class="btn small" data-preview="\${module.key}"><i data-lucide="panel-right-open"></i>Open details</button>
            <button class="btn small" data-configure="\${module.key}"><i data-lucide="sliders-horizontal"></i>Settings</button>
          </div>
        </article>
      \`;
    }`;

const v7ModuleCard = `    function moduleCard(module) {
      const entitlement = state.entitlements[module.key] || { paid: false, live: false };
      const status = entitlement.paid && entitlement.live ? 'Public Active' : entitlement.paid ? 'Preview Only' : 'Add-on Required';
      const tone = entitlement.paid && entitlement.live ? 'success' : entitlement.paid ? 'warning' : 'danger';
      return \`
        <div class="card module-card">
          <div class="module-head">
            <div class="module-title">
              <div class="module-icon"><i data-lucide="\${module.icon}"></i></div>
              <div>
                <h3>\${module.name}</h3>
                <p>\${module.desc}</p>
              </div>
            </div>
            <span class="badge \${tone}">\${status}</span>
          </div>
          <div class="card-actions">
            <button class="btn small primary" onclick="selectedModule='\${module.key}'; switchView('modules');"><i data-lucide="panel-right-open"></i>Open</button>
            <button class="btn small" onclick="openDrawer('\${escapeJs(module.name)}','\${escapeJs(module.desc)}')"><i data-lucide="sliders-horizontal"></i>Manage</button>
          </div>
        </div>
      \`;
    }`;

if (html.includes(originalModuleCard)) {
  html = html.replace(originalModuleCard, v7ModuleCard);
  console.log('Successfully replaced moduleCard implementation.');
}

// Helper: Escape utility
function escapeJs(value) {
  return String(value).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/\\n/g, ' ');
}

// 9. APPEND V7 HELPER FUNCTIONS BEFORE init();
const initCallStr = '    init();';
const initCallIdx = html.lastIndexOf(initCallStr);
if (initCallIdx === -1) {
  throw new Error("Could not find final init(); call in dashboard.html");
}

const v7Helpers = `    // v7 UI Helper Functions
    window.setAccent = function(colorName) {
      const colorMap = {
        orange: '#f97316',
        blue: '#2563eb',
        purple: '#7c3aed',
        green: '#16a34a',
        red: '#c80d3d',
        pink: '#db2777',
        gray: '#475569'
      };
      const hex = colorMap[colorName] || '#c80d3d';
      state.theme.accent = hex;
      applyTheme();
      saveState(\`Accent color changed to \${hex}\`);
      
      const accentMenu = document.getElementById('accentMenu');
      if (accentMenu) accentMenu.classList.remove('show');
    };
    
    window.toggleTheme = function() {
      state.theme.mode = state.theme.mode === 'dark' ? 'light' : 'dark';
      applyTheme();
      saveState(\`Theme switched to \${state.theme.mode} mode\`);
    };
    
    window.toggleAccentMenu = function() {
      const menu = document.getElementById('accentMenu');
      if (menu) menu.classList.toggle('show');
    };
    
    window.toggleProfileMenu = function() {
      const menu = document.getElementById('profileMenu');
      if (menu) menu.classList.toggle('show');
    };

    window.toggleMobileSidebar = function(show) {
      document.body.classList.toggle('sidebar-open', show);
    };

    window.showToast = function(message) {
      const t = document.getElementById('toast');
      if (t) {
        t.textContent = message;
        t.classList.remove('hidden');
        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
      }
    };

    window.openQuickAction = function() {
      showModal('Quick Action', \`
        <div class="grid module-grid" style="grid-template-columns: 1fr 1fr; gap: 12px;">
          <button class="card module-card" onclick="openNewPageModal()" style="text-align:left; padding:16px;">
            <strong>New Page</strong>
            <p style="color:var(--muted); font-size:11px; margin:4px 0 0;">Create a public churchfront page.</p>
          </button>
          <button class="card module-card" style="text-align:left; padding:16px;">
            <strong>Invite Staff</strong>
            <p style="color:var(--muted); font-size:11px; margin:4px 0 0;">Add team member access rights.</p>
          </button>
          <button class="card module-card" style="text-align:left; padding:16px;">
            <strong>Upload Media</strong>
            <p style="color:var(--muted); font-size:11px; margin:4px 0 0;">Add sermons or audio clips.</p>
          </button>
          <button class="card module-card" style="text-align:left; padding:16px;">
            <strong>Finance Report</strong>
            <p style="color:var(--muted); font-size:11px; margin:4px 0 0;">Export weekly ledger audits.</p>
          </button>
        </div>
      \`, 'Done');
    };

    window.openChurchSwitcher = function() {
      showModal('Switch Church Context', \`
        <div class="list" style="display:grid; gap:8px;">
          <button class="list-item" onclick="setChurch('Lagos Central Campus')" style="display:flex; gap:12px; padding:10px; width:100%; border:1px solid var(--line); border-radius:8px; background:var(--surface-2); text-align:left;">
            <div class="list-icon" style="color:var(--accent);"><i data-lucide="church"></i></div>
            <div>
              <strong style="display:block; font-size:13px;">Lagos Central Campus</strong>
              <span style="font-size:10px; color:var(--muted);">Primary tenant workspace</span>
            </div>
          </button>
          <button class="list-item" onclick="setChurch('Abuja Worship Center')" style="display:flex; gap:12px; padding:10px; width:100%; border:1px solid var(--line); border-radius:8px; background:var(--surface-2); text-align:left;">
            <div class="list-icon" style="color:var(--accent);"><i data-lucide="church"></i></div>
            <div>
              <strong style="display:block; font-size:13px;">Abuja Worship Center</strong>
              <span style="font-size:10px; color:var(--muted);">Branch preview workspace</span>
            </div>
          </button>
          <button class="list-item" onclick="setChurch('Nairobi Online Campus')" style="display:flex; gap:12px; padding:10px; width:100%; border:1px solid var(--line); border-radius:8px; background:var(--surface-2); text-align:left;">
            <div class="list-icon" style="color:var(--accent);"><i data-lucide="church"></i></div>
            <div>
              <strong style="display:block; font-size:13px;">Nairobi Online Campus</strong>
              <span style="font-size:10px; color:var(--muted);">Online-only campus</span>
            </div>
          </button>
        </div>
      \`, 'Close');
    };

    window.setChurch = function(name) {
      state.tenant.name = name;
      document.getElementById('contextChurchName').textContent = name;
      const welcomeTenantHeading = document.getElementById('welcomeTenantHeading');
      if (welcomeTenantHeading) welcomeTenantHeading.textContent = \`Good evening, \${name}.\`;
      document.getElementById('modalOverlay').classList.remove('show');
      showToast(\`Church context changed to \${name}.\`);
      saveState(\`Church context changed to \${name}\`);
    };

    window.showModal = function(title, body, action = 'Save') {
      const modalOverlay = document.getElementById('modalOverlay');
      if (modalOverlay) {
        modalOverlay.innerHTML = \`
          <div class="modal">
            <div class="modal-head">
              <h3>\${title}</h3>
              <button class="btn icon" onclick="document.getElementById('modalOverlay').classList.remove('show')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">\${body}</div>
            <div class="modal-foot">
              <button class="btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cancel</button>
              <button class="btn primary" onclick="showToast('\${escapeJs(title)} completed.');document.getElementById('modalOverlay').classList.remove('show')">\${action}</button>
            </div>
          </div>
        \`;
        modalOverlay.classList.add('show');
        lucide.createIcons();
      }
    };

    window.closeModal = function(e) {
      if (e.target.id === 'modalOverlay') e.currentTarget.classList.remove('show');
    };

    window.openDrawer = function(title, desc) {
      const drawerOverlay = document.getElementById('drawerOverlay');
      if (drawerOverlay) {
        drawerOverlay.innerHTML = \`
          <div class="drawer">
            <div class="drawer-head">
              <div>
                <h3>\${title}</h3>
                <p>\${desc}</p>
              </div>
              <button class="btn icon" onclick="closeTutorialDrawer()"><i data-lucide="x"></i></button>
            </div>
            <div class="settings-stack">
              \${setting('Dashboard preview enabled', 'Tenant staff can configure this module before public activation.', true)}
              \${setting('Public website visibility', 'Controls whether this module appears on the live website and mobile app.', false)}
              \${setting('Audit log tracking', 'Record updates, permission changes, and risky actions.', true)}
              \${setting('Notification automation', 'Send reminders, alerts, and digest messages.', true)}
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:22px;">
              <button class="btn" onclick="closeTutorialDrawer()">Cancel</button>
              <button class="btn primary" onclick="showToast('\${title} settings saved.');closeTutorialDrawer()">Save Changes</button>
            </div>
          </div>
        \`;
        drawerOverlay.classList.add('show');
        lucide.createIcons();
      }
    };

    window.closeDrawer = function(e) {
      if (e.target.id === 'drawerOverlay') e.currentTarget.classList.remove('show');
    };

    window.closeTutorialDrawer = function() {
      const drawerOverlay = document.getElementById('drawerOverlay');
      if (drawerOverlay) drawerOverlay.classList.remove('show');
    };

    function setting(title, desc, on) {
      return \`
        <div class="setting-row">
          <div>
            <strong>\${title}</strong>
            <span class="muted">\${desc}</span>
          </div>
          <span class="toggle \${on ? 'on' : ''}" onclick="this.classList.toggle('on')"></span>
        </div>
      \`;
    }

    function checkItem(text, done) {
      return \`
        <div class="list-item">
          <div class="list-icon" style="background:\${done ? 'var(--success-soft)' : 'var(--warning-soft)'}; color:\${done ? 'var(--success)' : 'var(--warning)'}">
            <i data-lucide="\${done ? 'check' : 'circle'}"></i>
          </div>
          <div>
            <strong>\${text}</strong>
            <span>\${done ? 'Ready for launch.' : 'Needs configuration before launch.'}</span>
          </div>
        </div>
      \`;
    }

    function bar(label, value) {
      return \`
        <div class="bar-row">
          <span>\${label}</span>
          <div class="track"><div class="fill" style="--w:\${value}%"></div></div>
          <strong>\${value}%</strong>
        </div>
      \`;
    }

    function kpi(label, value, icon, trend, tone = 'good') {
      return \`
        <div class="card kpi">
          <div class="kpi-top">
            <span>\${label}</span>
            <div class="kpi-icon"><i data-lucide="\${icon}"></i></div>
          </div>
          <strong>\${value}</strong>
          <div class="trend \${tone}">
            <i data-lucide="\${tone === 'bad' ? 'trending-down' : 'trending-up'}"></i>
            \${trend}
          </div>
        </div>
      \`;
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawLineChart(canvas) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      const h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      const width = canvas.offsetWidth, height = canvas.offsetHeight;
      const values = [32, 44, 38, 58, 64, 72, 68, 84, 90, 98, 106, 118];
      ctx.clearRect(0,0,width,height);
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--line-strong'); ctx.lineWidth = 1;
      for (let i=0;i<5;i++){ const y=30+i*(height-55)/4; ctx.beginPath(); ctx.moveTo(12,y); ctx.lineTo(width-16,y); ctx.stroke(); }
      const max = Math.max(...values), min = Math.min(...values); const xStep=(width-44)/(values.length-1);
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const grad = ctx.createLinearGradient(0,20,0,height); grad.addColorStop(0, accent + '66'); grad.addColorStop(1, accent + '00');
      ctx.beginPath();
      values.forEach((v,i)=>{ const x=22+i*xStep; const y=height-28-((v-min)/(max-min))*(height-62); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
      ctx.lineTo(width-22,height-28); ctx.lineTo(22,height-28); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
      ctx.beginPath();
      values.forEach((v,i)=>{ const x=22+i*xStep; const y=height-28-((v-min)/(max-min))*(height-62); i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
      ctx.strokeStyle=accent; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
      values.forEach((v,i)=>{ if (i%2===0 || i===values.length-1){ const x=22+i*xStep; const y=height-28-((v-min)/(max-min))*(height-62); ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle=accent; ctx.fill(); } });
    }

    function drawBarsChart(canvas) {
      const ctx = canvas.getContext('2d'); const w=canvas.width=canvas.offsetWidth*devicePixelRatio; const h=canvas.height=canvas.offsetHeight*devicePixelRatio; ctx.scale(devicePixelRatio,devicePixelRatio);
      const width=canvas.offsetWidth, height=canvas.offsetHeight; const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(); const vals=[78,64,92,53,71,85]; ctx.clearRect(0,0,width,height);
      const barW=(width-70)/vals.length; vals.forEach((v,i)=>{ const x=30+i*barW; const barH=(v/100)*(height-46); const y=height-24-barH; ctx.fillStyle='rgba(148,163,184,.16)'; ctx.fillRect(x,24,barW-14,height-48); ctx.fillStyle=i===2?accent:'rgba(148,163,184,.55)'; roundRect(ctx,x,y,barW-14,barH,8); ctx.fill(); });
    }

    function drawDonutChart(canvas) {
      const ctx=canvas.getContext('2d'); canvas.width=canvas.offsetWidth*devicePixelRatio; canvas.height=canvas.offsetHeight*devicePixelRatio; ctx.scale(devicePixelRatio,devicePixelRatio); const width=canvas.offsetWidth, height=canvas.offsetHeight; const cx=width/2, cy=height/2, r=Math.min(width,height)/2-20; const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(); const colors=[accent,'#38bdf8','#a78bfa','#22c55e','#f59e0b']; const vals=[32,22,18,16,12]; let a=-Math.PI/2; ctx.clearRect(0,0,width,height); vals.forEach((v,i)=>{ const seg=Math.PI*2*(v/100); ctx.beginPath(); ctx.arc(cx,cy,r,a,a+seg); ctx.arc(cx,cy,r-30,a+seg,a,true); ctx.closePath(); ctx.fillStyle=colors[i]; ctx.fill(); a+=seg; }); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--surface-strong'); ctx.beginPath(); ctx.arc(cx,cy,r-42,0,Math.PI*2); ctx.fill(); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--text'); ctx.font='800 24px Inter'; ctx.textAlign='center'; ctx.fillText('100%',cx,cy+4); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted'); ctx.font='700 11px Inter'; ctx.fillText('Engagement',cx,cy+24); }

    function bindWelcomeParallax() {
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

    function bindModuleParallax() {
      const updateScrollParallax = () => {
        const page = document.querySelector('.module-page');
        if (!page) return;
        const s = Math.max(-18, Math.min(42, window.scrollY * .055));
        page.style.setProperty('--scroll-parallax', \`\${s.toFixed(2)}px\`);
      };
      updateScrollParallax();
      if (window.__tenantModuleParallaxBound) return;
      window.__tenantModuleParallaxBound = true;
      window.addEventListener('scroll', updateScrollParallax, { passive: true });
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function getBlueprint(item) {
      const fallback = {
        desc: item?.desc || 'Manage records, settings, workflows, and reports for this module.',
        tabs: ['Overview','Records','Settings','Reports'],
        actionLabel: 'Create Record',
        metrics: [['Records','1,284','database','Updated today','good'],['Public Status','Preview','eye','Requires live access','warn'],['Team Users','12','users-round','3 active now','good'],['Automation','8','zap','4 running','info']],
        records: [['Primary workspace','Module record','Active','Ready for staff','Open'],['Public page block','Website component','Preview','Needs public access','Edit'],['Member workflow','Automation','Draft','Review settings','Manage'],['Reporting view','Analytics','Active','Updated today','View']],
        features: [['Records management','Create, edit, filter, and manage tenant-scoped records.', item?.icon || 'blocks'],['Settings area','Configure module behavior from the central dashboard.','sliders-horizontal'],['Permissions','Respect role-based access and audit every sensitive action.','shield-check'],['Reports','Show analytics, exports, and operational health.','chart-line']],
        workflow: [['Open module','Review current records, status, and readiness.'],['Configure settings','Set visibility, permissions, integrations, and limits.'],['Create first record','Add a real item so staff can test the workflow.'],['Preview then publish','Keep dashboard preview available while public access follows entitlement.']],
        settings: [['Enable dashboard preview','Staff can configure this module before public activation.', true],['Allow public publishing','Public website and app access requires enabled entitlement.', false],['Send activity to audit logs','Track updates, permissions, and sensitive actions.', true],['Use tenant branding','Apply site theme, accent, and localization.', true]],
        integrations: ['Members CRM','Notifications','Settings','Audit Logs']
      };
      return fallback;
    }

`;

html = html.substring(0, initCallIdx) + v7Helpers + "\n" + html.substring(initCallIdx);

fs.writeFileSync(dashboardPath, html, 'utf8');

// Copy output to active tenant dashboard index.html
const publicIndexPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\apps\\tenant-dashboard\\public\\index.html';
fs.writeFileSync(publicIndexPath, html, 'utf8');

console.log('Successfully completed dashboard overhaul to v7!');
console.log('New dashboard.html length:', html.length);
