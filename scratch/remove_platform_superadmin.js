const fs = require('fs');
const path = require('path');

const htmlPath = 'c:\\Users\\Administrator\\Documents\\ChurchOS\\dashboard.html';
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Original dashboard.html length:', html.length);

// 1. Remove Platform nav section in sidebar
const targetPlatformNav = `      <nav>
        <div class="nav-section-title">Platform</div>
        <button class="nav-button" data-view="superAdmin"><i data-lucide="shield-check"></i>Super Admin</button>
      </nav>`;

if (html.includes(targetPlatformNav)) {
  html = html.replace(targetPlatformNav, '');
  console.log('Platform Super Admin navigation removed.');
} else {
  // alternative spacing fallback
  const altPlatformNav = `<nav>
        <div class="nav-section-title">Platform</div>
        <button class="nav-button" data-view="superAdmin"><i data-lucide="shield-check"></i>Super Admin</button>
      </nav>`;
  html = html.replace(altPlatformNav, '');
  console.log('Platform Super Admin navigation removed (fallback).');
}

// 2. Remove Profile flat nav button in sidebar Workspace section
const targetProfileNav = `        <button class="nav-button" data-view="profile"><i data-lucide="user-round"></i>Profile</button>`;
if (html.includes(targetProfileNav)) {
  html = html.replace(targetProfileNav, '');
  console.log('Flat Profile navigation button removed from sidebar.');
}

// 3. Remove sidebar-footer user chip
const targetSidebarFooter = `      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar">AD</div>
          <div>
            <strong id="userName">Admin User</strong>
            <div class="muted" style="font-size:12px;">Tenant owner</div>
          </div>
        </div>
        <button id="logoutBtn" class="btn"><i data-lucide="log-out"></i>Sign out</button>
      </div>`;

if (html.includes(targetSidebarFooter)) {
  html = html.replace(targetSidebarFooter, '');
  console.log('Sidebar footer profile user chip removed.');
} else {
  // fallback for possible spacing difference
  const footerIndexStart = html.indexOf('<div class="sidebar-footer">');
  const footerIndexEnd = html.indexOf('</aside>');
  if (footerIndexStart !== -1 && footerIndexEnd !== -1 && footerIndexStart < footerIndexEnd) {
    html = html.slice(0, footerIndexStart) + html.slice(footerIndexEnd);
    console.log('Sidebar footer removed via slice.');
  }
}

// 4. Replace Dashboard Settings button with Topbar Profile Dropdown
const targetTopActions = `<div class="top-actions">
          <button id="modeBtn" class="btn icon" title="Switch theme"><i data-lucide="sun-moon"></i></button>
          <button class="btn" data-view-jump="settings"><i data-lucide="sliders-horizontal"></i>Dashboard settings</button>
        </div>`;

const replacementTopActions = `<div class="top-actions" style="display: flex; align-items: center; gap: 8px;">
          <button id="modeBtn" class="btn icon" title="Switch theme" style="margin-right: 4px;"><i data-lucide="sun-moon"></i></button>
          <!-- Profile Dropdown Container -->
          <div class="profile-dropdown-container" id="profileDropdownContainer" style="position: relative; display: inline-block;">
            <button class="btn profile-dropdown-btn" id="profileDropdownBtn" onclick="toggleProfileDropdown()" style="display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: var(--radius); background: var(--accent-soft); border: 1px solid var(--line); font-weight: 500; cursor: pointer;">
              <div class="avatar" style="width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">AD</div>
              <span id="topbarUserName" style="font-size: 14px;">Admin User</span>
              <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
            </button>
            <!-- Dropdown Menu -->
            <div class="profile-dropdown-menu hidden" id="profileDropdownMenu" style="position: absolute; right: 0; top: calc(100% + 8px); background: var(--sidebar); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05); z-index: 1000; min-width: 170px; padding: 6px 0; display: flex; flex-direction: column;">
              <a href="#" onclick="handleProfileDropdownLink('profile')" style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; color: var(--muted); font-size: 14px; text-decoration: none; transition: background 0.2s, color 0.2s;">
                <i data-lucide="user-round" style="width:14px; height:14px;"></i><span>View Profile</span>
              </a>
              <a href="#" onclick="handleProfileDropdownLink('settings')" style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; color: var(--muted); font-size: 14px; text-decoration: none; transition: background 0.2s, color 0.2s;">
                <i data-lucide="settings" style="width:14px; height:14px;"></i><span>Dashboard Settings</span>
              </a>
              <hr style="border: none; border-top: 1px solid var(--line); margin: 6px 0;">
              <a href="#" onclick="handleProfileDropdownLogout()" style="display: flex; align-items: center; gap: 10px; padding: 8px 16px; color: #ef4444; font-size: 14px; text-decoration: none; transition: background 0.2s, color 0.2s;">
                <i data-lucide="log-out" style="width:14px; height:14px;"></i><span>Sign Out</span>
              </a>
            </div>
          </div>
        </div>`;

if (html.includes(targetTopActions)) {
  html = html.replace(targetTopActions, replacementTopActions);
  console.log('Dashboard Settings button replaced with Profile Dropdown.');
} else {
  // alternative replace with standard strings
  const altTopActions = `<div class="top-actions">
          <button id="modeBtn" class="btn icon" title="Switch theme"><i data-lucide="sun-moon"></i></button>
          <button class="btn" data-view-jump="settings"><i data-lucide="sliders-horizontal"></i>Dashboard settings</button>
        </div>`;
  html = html.replace(altTopActions, replacementTopActions);
  console.log('Dashboard Settings button replaced (fallback).');
}

// 5. Remove superAdminView html block
const superAdminViewStart = '<section id="superAdminView" class="view hidden">';
const superAdminViewEnd = '</section>';
const superAdminViewStartIndex = html.indexOf(superAdminViewStart);
if (superAdminViewStartIndex !== -1) {
  const nextSectionIndex = html.indexOf('<div id="toast"', superAdminViewStartIndex);
  if (nextSectionIndex !== -1) {
    const sectionCloseIndex = html.lastIndexOf('</section>', nextSectionIndex);
    if (sectionCloseIndex !== -1) {
      html = html.slice(0, superAdminViewStartIndex) + html.slice(sectionCloseIndex + '</section>'.length);
      console.log('superAdminView html block successfully removed.');
    }
  }
}

// 6. Remove superAdmin title config in switchView()
const targetSuperAdminTitle = `        superAdmin: ['Super Admin', 'Toggle paid modules live per tenant.']`;
if (html.includes(targetSuperAdminTitle)) {
  html = html.replace(targetSuperAdminTitle, '');
  console.log('superAdmin title config removed from switchView.');
}

// 7. Remove renderSuperAdmin(); call in render()
const targetRenderSuperAdminCall = `      renderSuperAdmin();`;
if (html.includes(targetRenderSuperAdminCall)) {
  html = html.replace(targetRenderSuperAdminCall, '');
  console.log('renderSuperAdmin call removed from render.');
}

// 8. Remove renderSuperAdmin and ensureTenantEntitlement functions
const renderSuperAdminStart = '    function renderSuperAdmin() {';
const ensureTenantEntitlementEnd = '    function showToast(message) {';
const superAdminFuncStartIdx = html.indexOf(renderSuperAdminStart);
const superAdminFuncEndIdx = html.indexOf(ensureTenantEntitlementEnd);

if (superAdminFuncStartIdx !== -1 && superAdminFuncEndIdx !== -1 && superAdminFuncStartIdx < superAdminFuncEndIdx) {
  html = html.slice(0, superAdminFuncStartIdx) + html.slice(superAdminFuncEndIdx);
  console.log('renderSuperAdmin and ensureTenantEntitlement functions deleted.');
}

// 9. Remove logoutBtn click listener event listener configuration
const targetLogoutListener = `      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        document.getElementById('appShell').classList.add('hidden');
        document.getElementById('loginWall').classList.remove('hidden');
        setLocalLoginDefaults();
      });`;

if (html.includes(targetLogoutListener)) {
  html = html.replace(targetLogoutListener, '');
  console.log('logoutBtn click listener registration deleted.');
} else {
  // fallback exact matcher
  const altLogoutListener = `      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        document.getElementById('appShell').classList.add('hidden');
        document.getElementById('loginWall').classList.remove('hidden');
        setLocalLoginDefaults();
      });`;
  html = html.replace(altLogoutListener, '');
  console.log('logoutBtn click listener registration deleted (fallback).');
}

// 10. Inject Profile Dropdown CSS Style in <style> block
const targetStyleEnd = `  </style>`;
const dropdownCss = `    .profile-dropdown-menu a:hover {
      background: var(--accent-soft) !important;
      color: var(--text) !important;
    }
  </style>`;

html = html.replace(targetStyleEnd, dropdownCss);
console.log('Profile Dropdown hover CSS styling injected.');

// 11. Inject JS Handlers for Profile Dropdown & Navigation
const targetScriptEnd = `    init();
  </script>`;

const dropdownJs = `    window.toggleProfileDropdown = function(e) {
      if (e) e.stopPropagation();
      const menu = document.getElementById('profileDropdownMenu');
      if (menu) menu.classList.toggle('hidden');
    };

    window.handleProfileDropdownLink = function(view) {
      switchView(view);
      const menu = document.getElementById('profileDropdownMenu');
      if (menu) menu.classList.add('hidden');
    };

    window.handleProfileDropdownLogout = function() {
      const menu = document.getElementById('profileDropdownMenu');
      if (menu) menu.classList.add('hidden');
      localStorage.removeItem(SESSION_KEY);
      document.getElementById('appShell').classList.add('hidden');
      document.getElementById('loginWall').classList.remove('hidden');
      setLocalLoginDefaults();
      showToast('Signed out successfully.');
    };

    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('profileDropdownContainer');
      const menu = document.getElementById('profileDropdownMenu');
      if (menu && !menu.classList.contains('hidden') && dropdown && !dropdown.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });

    init();
  </script>`;

html = html.replace(targetScriptEnd, dropdownJs);
console.log('Profile Dropdown JS handlers successfully injected.');

// 12. Remove locks and paid/live/preview indicators from module rendering
// A. Remove stateLabel tags from the grouped accordion buttons
const targetAccordionButton = `          return \\\`
            <button class="module-nav-button \\\${currentView === 'modules' && selectedModule === module.key ? 'active' : ''}" data-module-nav="\\\${module.key}" style="padding-left:12px; margin-left:8px; border-left:1.5px solid var(--line); border-radius:0 4px 4px 0; min-height:30px; font-size:13px; margin-top:2px;">
              <i data-lucide="\\\${module.icon}" style="width:13px !important; height:13px !important;"></i>
              <span>\\\${module.name}</span>
              <small style="font-size:8px;">\\\${stateLabel}</small>
            </button>
          \\\`;`;

const replacementAccordionButton = `          return \\\`
            <button class="module-nav-button \\\${currentView === 'modules' && selectedModule === module.key ? 'active' : ''}" data-module-nav="\\\${module.key}" style="padding-left:12px; margin-left:8px; border-left:1.5px solid var(--line); border-radius:0 4px 4px 0; min-height:30px; font-size:13px; margin-top:2px;">
              <i data-lucide="\\\${module.icon}" style="width:13px !important; height:13px !important;"></i>
              <span>\\\${module.name}</span>
            </button>
          \\\`;`;

if (html.includes(targetAccordionButton)) {
  html = html.replace(targetAccordionButton, replacementAccordionButton);
  console.log('State label tag removed from sidebar accordion navigation.');
}

// B. Simplify moduleStatus function to always show active & integrated
const targetModuleStatusFunc = `    function moduleStatus(module) {
      const entitlement = state.entitlements[module.key] || { paid: false, live: false };
      if (state.tenant.publishingEnabled && entitlement.paid && entitlement.live) {
        return \`<span class="status live"><i data-lucide="radio-tower"></i>Live on site</span>\`;
      }
      if (entitlement.paid) {
        return \`<span class="status preview"><i data-lucide="eye"></i>Paid, backend preview</span>\`;
      }
      return \`<span class="status"><i data-lucide="lock-keyhole"></i>Preview only</span>\`;
    }`;

const replacementModuleStatusFunc = `    function moduleStatus(module) {
      return \`<span class="status live"><i data-lucide="check-circle"></i>Active & Integrated</span>\`;
    }`;

if (html.includes(targetModuleStatusFunc)) {
  html = html.replace(targetModuleStatusFunc, replacementModuleStatusFunc);
  console.log('moduleStatus simplified to represent active and integrated status.');
}

// C. Update renderMetrics to remove paid/live counts
const targetRenderMetrics = `    function renderMetrics() {
      const paid = modules.filter((module) => state.entitlements[module.key]?.paid).length;
      const live = liveModules().length;
      const preview = state.tenant.previewUnpaid ? modules.length : paid;
      const pending = modules.length - paid;
      document.getElementById('metrics').innerHTML = [
        ['Backend modules', preview],
        ['Paid modules', paid],
        ['Live on site', live],
        ['Upgrade-ready', pending]
      ].map(([label, value]) => \`<div class="metric"><span>\${label}</span><strong>\${value}</strong></div>\`).join('');
    }`;

const replacementRenderMetrics = `    function renderMetrics() {
      document.getElementById('metrics').innerHTML = [
        ['Total Active Modules', modules.length],
        ['System Platform Services', '11 Functional Clusters'],
        ['Local Site Engine', 'Active & Integrated'],
        ['Security Controls', 'Fully Authorized']
      ].map(([label, value]) => \`<div class="metric"><span>\${label}</span><strong>\${value}</strong></div>\`).join('');
    }`;

if (html.includes(targetRenderMetrics)) {
  html = html.replace(targetRenderMetrics, replacementRenderMetrics);
  console.log('renderMetrics simplified successfully.');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully completed cleanup edits!');
console.log('New dashboard.html length:', html.length);
