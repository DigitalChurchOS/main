// Digital Church OS Client Application Engine
'use strict';

// ── State Management ─────────────────────────────────────────
const STATE = {
  user: null, // Logged in user info
  token: localStorage.getItem('token') || null,
  activeView: 'home', // 'home', 'super-admin', 'admin', 'bedrock'
  activeSubView: 'dashboard', // For admin portals: dashboard, tenants, members, cms, settings, logs
  tenantContext: null, // Current resolved tenant details (for public theme rendering)
  websiteContext: null, // Current resolved website details
  pageContext: {
    slug: '',
    blocks: [],
    theme: {}
  },
  adminData: {
    tenants: [],
    modules: [],
    logs: [],
    members: [],
    settings: {}
  }
};

// Base API URL
const API_BASE = '';

// Helper: Fetch with Authorization and Tenant Context
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (STATE.token) {
    headers['Authorization'] = `Bearer ${STATE.token}`;
  }
  
  // Scoped to current tenant if in tenant dashboard mode
  if (STATE.tenantContext && STATE.tenantContext.id) {
    headers['x-tenant-id'] = STATE.tenantContext.id;
  } else if (localStorage.getItem('tenantId')) {
    headers['x-tenant-id'] = localStorage.getItem('tenantId');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // Session expired
    logout();
    throw new Error('Session expired');
  }

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Something went wrong');
  }
  return json;
}

// ── Authentication Handlers ──────────────────────────────────
function checkAuth() {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if (savedToken && savedUser) {
    STATE.token = savedToken;
    STATE.user = JSON.parse(savedUser);
  }
}

function login(token, user) {
  STATE.token = token;
  STATE.user = user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (user.member && user.member.tenantId) {
    localStorage.setItem('tenantId', user.member.tenantId);
  }
}

function logout() {
  STATE.token = null;
  STATE.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenantId');
  window.location.href = '/';
}

// ── DNS Context Resolver ─────────────────────────────────────
// Resolves subdomains (e.g. grace.localhost) to load public church themes
async function resolveDnsContext() {
  const host = window.location.hostname;
  const parts = host.split('.');
  
  // If subdomain is present (excluding main platform domains)
  if (parts.length > 1 && !['localhost', 'churchos', 'com', 'local'].includes(parts[0])) {
    const subdomain = parts[0];
    try {
      // Fetch dynamic published layout
      const response = await fetch(`${API_BASE}/api/cms/render?slug=${STATE.pageContext.slug}`);
      if (response.ok) {
        const json = await response.json();
        STATE.pageContext = json.data;
        // Resolve tenant details based on website configuration
        STATE.tenantContext = { id: json.data.pageId ? json.data.pageId : null };
        STATE.activeView = 'bedrock';
        return true;
      }
    } catch (e) {
      console.error('Failed to resolve DNS context:', e);
    }
  }
  return false;
}

// ── Application Routing ──────────────────────────────────────
async function initRouter() {
  checkAuth();
  
  const path = window.location.pathname;
  const isTenantSubdomain = await resolveDnsContext();

  if (isTenantSubdomain) {
    STATE.activeView = 'bedrock';
  } else if (path.startsWith('/super-admin')) {
    STATE.activeView = 'super-admin';
    if (!STATE.token) {
      STATE.activeSubView = 'login';
    } else {
      STATE.activeSubView = path.substring(13) || 'tenants';
    }
  } else if (path.startsWith('/admin')) {
    STATE.activeView = 'admin';
    if (!STATE.token) {
      STATE.activeSubView = 'login';
    } else {
      STATE.activeSubView = path.substring(7) || 'dashboard';
    }
  } else {
    // Main platform landing page
    STATE.activeView = 'landing';
  }
  
  renderApp();
}

// ── UI Rendering Core ────────────────────────────────────────
function renderApp() {
  const appNode = document.getElementById('app');
  if (!appNode) return;

  if (STATE.activeView === 'landing') {
    appNode.innerHTML = renderLandingPage();
  } else if (STATE.activeView === 'super-admin') {
    appNode.innerHTML = renderSuperAdminLayout();
    if (STATE.activeSubView === 'login') {
      bindLoginEvent();
    } else {
      bindSuperAdminEvents();
      bindCommonEvents();
    }
  } else if (STATE.activeView === 'admin') {
    appNode.innerHTML = renderTenantAdminLayout();
    if (STATE.activeSubView === 'login') {
      bindLoginEvent();
    } else {
      bindTenantAdminEvents();
      bindCommonEvents();
    }
  } else if (STATE.activeView === 'bedrock') {
    appNode.innerHTML = renderThemeBedrock();
    bindBedrockEvents();
  }

  // Refresh Lucide Icons on DOM update
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ── Screen Rendering: LANDING PAGE ────────────────────────────
function renderLandingPage() {
  return `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;">
      <i data-lucide="church" style="width: 80px; height: 80px; color: var(--accent); margin-bottom: 24px;"></i>
      <h1 style="font-family: var(--font-display); font-size: 3rem; font-weight: 800; color: var(--text-strong); margin-bottom: 16px;">
        Digital Church OS
      </h1>
      <p style="color: var(--text-muted); font-size: 1.25rem; max-width: 600px; margin-bottom: 40px;">
        The next-generation multi-tenant platform powering church management, ministries, media delivery, and automation.
      </p>
      <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
        <a href="/admin" class="btn btn-primary">
          <i data-lucide="shield-check"></i> Tenant Admin Dashboard
        </a>
        <a href="/super-admin" class="btn btn-secondary">
          <i data-lucide="settings"></i> Platform Super Admin
        </a>
      </div>
    </div>
  `;
}

// ── Screen Rendering: SUPER ADMIN LAYOUT ──────────────────────
function renderSuperAdminLayout() {
  if (STATE.activeSubView === 'login') {
    return renderAdminLoginView('Super Admin Portal');
  }

  return `
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <a href="/" class="logo">
            <i data-lucide="cpu"></i>
            <span>ChurchOS Admin</span>
          </a>
        </div>
        <ul class="sidebar-nav">
          <li class="nav-item ${STATE.activeSubView === 'tenants' ? 'active' : ''}">
            <a href="#" data-subview="tenants">
              <i data-lucide="server"></i>
              <span>Tenant Churches</span>
            </a>
          </li>
          <li class="nav-item ${STATE.activeSubView === 'modules' ? 'active' : ''}">
            <a href="#" data-subview="modules">
              <i data-lucide="puzzle"></i>
              <span>Global Modules</span>
            </a>
          </li>
          <li class="nav-item ${STATE.activeSubView === 'logs' ? 'active' : ''}">
            <a href="#" data-subview="logs">
              <i data-lucide="activity"></i>
              <span>System Health Logs</span>
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-strong);">${STATE.user.email}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Super Admin</span>
          </div>
          <button id="logoutBtn" class="btn btn-secondary btn-sm" style="padding: 6px;" title="Logout">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="main-content">
        <header class="top-header">
          <div class="header-left">
            <h2 class="page-title" style="margin-bottom: 0;">Platform Administration</h2>
          </div>
          <div class="header-right">
            <button id="themeToggleBtn" class="btn btn-secondary btn-sm" style="padding: 8px;">
              <i data-lucide="sun-moon"></i>
            </button>
          </div>
        </header>

        <div class="page-container" id="super-admin-content-pane">
          ${renderSuperAdminSubView()}
        </div>
      </main>
    </div>
  `;
}

function renderSuperAdminSubView() {
  if (STATE.activeSubView === 'tenants') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
        <div>
          <h2 class="page-title">Tenant Churches</h2>
          <p class="page-subtitle">Provision, configure, and monitor multi-tenant databases</p>
        </div>
        <button id="createTenantBtn" class="btn btn-primary">
          <i data-lucide="plus"></i> Add New Church
        </button>
      </div>

      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Church Name</th>
              <th>Subdomain</th>
              <th>Custom Domain</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tenants-table-body">
            <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading tenants...</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
  
  if (STATE.activeSubView === 'modules') {
    return `
      <div style="margin-bottom: 32px;">
        <h2 class="page-title">Module Registrations</h2>
        <p class="page-subtitle">Platform-wide microservices available to SaaS clients</p>
      </div>

      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Module Key</th>
              <th>Display Name</th>
              <th>Category</th>
              <th>Dependencies</th>
            </tr>
          </thead>
          <tbody id="modules-table-body">
            <tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Loading modules...</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (STATE.activeSubView === 'logs') {
    return `
      <div style="margin-bottom: 32px;">
        <h2 class="page-title">System Observability Logs</h2>
        <p class="page-subtitle">Real-time health telemetry across the application nodes</p>
      </div>

      <div class="card" style="margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <label class="form-label">Log Level</label>
          <select id="logLevelSelect" class="form-control">
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="fatal">Fatal</option>
          </select>
        </div>
        <div style="flex: 2; min-width: 300px;">
          <label class="form-label">Filter by Scope (e.g. billing, payment)</label>
          <input type="text" id="logScopeInput" class="form-control" placeholder="Search scopes...">
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button id="filterLogsBtn" class="btn btn-primary" style="height: 46px;">
            <i data-lucide="filter"></i> Filter
          </button>
        </div>
      </div>

      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Level</th>
              <th>Scope</th>
              <th>Message</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody id="logs-table-body">
            <tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Loading logs...</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  return '<div>Not Found</div>';
}

// ── Screen Rendering: TENANT ADMIN LAYOUT ─────────────────────
function renderTenantAdminLayout() {
  if (STATE.activeSubView === 'login') {
    return renderAdminLoginView('Church Administrator Console');
  }

  return `
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <a href="/" class="logo">
            <i data-lucide="church"></i>
            <span>Church Console</span>
          </a>
        </div>
        <ul class="sidebar-nav">
          <li class="nav-item ${STATE.activeSubView === 'dashboard' ? 'active' : ''}">
            <a href="#" data-subview="dashboard">
              <i data-lucide="layout-dashboard"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li class="nav-item ${STATE.activeSubView === 'crm' ? 'active' : ''}">
            <a href="#" data-subview="crm">
              <i data-lucide="users"></i>
              <span>CRM & Small Groups</span>
            </a>
          </li>
          <li class="nav-item ${STATE.activeSubView === 'cms' ? 'active' : ''}">
            <a href="#" data-subview="cms">
              <i data-lucide="globe"></i>
              <span>Website Page CMS</span>
            </a>
          </li>
          <li class="nav-item ${STATE.activeSubView === 'settings' ? 'active' : ''}">
            <a href="#" data-subview="settings">
              <i data-lucide="sliders"></i>
              <span>Module Settings</span>
            </a>
          </li>
        </ul>
        <div class="sidebar-footer">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-strong);">${STATE.user.email}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">Pastor / Admin</span>
          </div>
          <button id="logoutBtn" class="btn btn-secondary btn-sm" style="padding: 6px;" title="Logout">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <div class="header-left">
            <h2 class="page-title" style="margin-bottom: 0;">Church OS Console</h2>
          </div>
          <div class="header-right">
            <button id="themeToggleBtn" class="btn btn-secondary btn-sm" style="padding: 8px;">
              <i data-lucide="sun-moon"></i>
            </button>
          </div>
        </header>

        <div class="page-container" id="admin-content-pane">
          ${renderTenantAdminSubView()}
        </div>
      </main>
    </div>
  `;
}

function renderTenantAdminSubView() {
  if (STATE.activeSubView === 'dashboard') {
    return `
      <div style="margin-bottom: 32px;">
        <h2 class="page-title">Dashboard Overview</h2>
        <p class="page-subtitle">Key performance statistics for your ministry</p>
      </div>

      <div class="analytics-grid">
        <div class="card stat-card">
          <div class="stat-icon"><i data-lucide="user-plus"></i></div>
          <div class="stat-info">
            <span class="stat-value">1,482</span>
            <span class="stat-label">Total Members</span>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon" style="background-color: var(--success-soft); color: var(--success);"><i data-lucide="heart-handshake"></i></div>
          <div class="stat-info">
            <span class="stat-value">$12,450</span>
            <span class="stat-label">Weekly Contributions</span>
          </div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon" style="background-color: var(--warning-soft); color: var(--warning);"><i data-lucide="tv"></i></div>
          <div class="stat-info">
            <span class="stat-value">385</span>
            <span class="stat-label">Livestream Viewers</span>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 32px;">
        <h3 style="margin-bottom: 20px; font-family: var(--font-display);">Membership Growth Trend</h3>
        <div style="height: 300px; position: relative;">
          <canvas id="growthChart"></canvas>
        </div>
      </div>
    `;
  }

  if (STATE.activeSubView === 'crm') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
        <div>
          <h2 class="page-title">Congregation Care CRM</h2>
          <p class="page-subtitle">Nurture new believers, small group networks, and workforce department roles</p>
        </div>
        <button id="addCrmContactBtn" class="btn btn-primary">
          <i data-lucide="user-plus"></i> Add Contact
        </button>
      </div>

      <div class="kanban-board">
        <div class="kanban-column">
          <div class="kanban-column-header">
            <span class="kanban-column-title">New Believers</span>
            <span class="kanban-column-count">3</span>
          </div>
          <div class="kanban-cards" id="crm-new-believers">
            <div class="kanban-card">
              <div class="kanban-card-name">Andrew Smith</div>
              <div class="kanban-card-meta">Joined 3 days ago • Follow-up pending</div>
            </div>
            <div class="kanban-card">
              <div class="kanban-card-name">Deborah Jenkins</div>
              <div class="kanban-card-meta">Joined 5 days ago • Responded to altar call</div>
            </div>
          </div>
        </div>
        <div class="kanban-column">
          <div class="kanban-column-header">
            <span class="kanban-column-title">Small Groups / Cells</span>
            <span class="kanban-column-count">2</span>
          </div>
          <div class="kanban-cards" id="crm-cells">
            <div class="kanban-card">
              <div class="kanban-card-name">Samuel Vance</div>
              <div class="kanban-card-meta">Assigned to Master Cell North</div>
            </div>
            <div class="kanban-card">
              <div class="kanban-card-name">Patience Carter</div>
              <div class="kanban-card-meta">Seeking home cell locator</div>
            </div>
          </div>
        </div>
        <div class="kanban-column">
          <div class="kanban-column-header">
            <span class="kanban-column-title">Volunteers / Workforce</span>
            <span class="kanban-column-count">2</span>
          </div>
          <div class="kanban-cards" id="crm-volunteers">
            <div class="kanban-card">
              <div class="kanban-card-name">Gabriel Cole</div>
              <div class="kanban-card-meta">Media usher dept • Active check-in</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (STATE.activeSubView === 'cms') {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
        <div>
          <h2 class="page-title">Website CMS Builder</h2>
          <p class="page-subtitle">Build pages, assign custom layouts, and publish white-labeled sites</p>
        </div>
        <button id="createNewPageBtn" class="btn btn-primary">
          <i data-lucide="plus"></i> Create New Page
        </button>
      </div>

      <div class="card table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Page Title</th>
              <th>Slug / Path</th>
              <th>Home Page</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="cms-pages-table-body">
            <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Loading pages...</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  if (STATE.activeSubView === 'settings') {
    return `
      <div style="margin-bottom: 32px;">
        <h2 class="page-title">Module Config Settings</h2>
        <p class="page-subtitle">Customize dynamic options for active features</p>
      </div>

      <div style="display: grid; grid-template-columns: 260px 1fr; gap: 32px;">
        <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px; align-self: start;">
          <button class="btn btn-secondary active-nav" style="text-align: left; justify-content: flex-start;" data-setting-tab="liveChat">
            <i data-lucide="message-square"></i> Live Chat Care
          </button>
          <button class="btn btn-secondary" style="text-align: left; justify-content: flex-start;" data-setting-tab="giving">
            <i data-lucide="heart-handshake"></i> Tithes & Giving
          </button>
        </div>
        <div class="card" id="settings-fields-card">
          <!-- Dynamic settings fields go here -->
          <h3 style="font-family: var(--font-display); margin-bottom: 24px;" id="settings-tab-title">Loading Schema...</h3>
          <div id="settings-fields-container"></div>
          <hr style="border: 0; border-top: 1px solid var(--border); margin: 24px 0;">
          <div style="display: flex; justify-content: flex-end; gap: 16px;">
            <button id="resetSettingsBtn" class="btn btn-secondary">Reset Defaults</button>
            <button id="saveSettingsBtn" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    `;
  }

  return '<div>Not Found</div>';
}

// ── Screen Rendering: COMMON LOGIN ───────────────────────────
function renderAdminLoginView(titleText) {
  return `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
      <div class="glass-card" style="width: 100%; max-width: 440px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <i data-lucide="church" style="width: 56px; height: 56px; color: var(--accent); margin-bottom: 16px;"></i>
          <h2 style="font-family: var(--font-display); font-weight: 700; color: var(--text-strong);">${titleText}</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px;">Login to manage the Digital Church platform</p>
        </div>
        
        <div id="loginErrorMsg" style="display: none; background-color: var(--danger-soft); color: var(--danger); padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2);"></div>

        <form id="adminLoginForm">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="loginEmail" class="form-control" required placeholder="name@church.com" value="admin@demo.churchos.local">
          </div>
          <div class="form-group" style="margin-bottom: 28px;">
            <label class="form-label">Password</label>
            <input type="password" id="loginPassword" class="form-control" required placeholder="••••••••" value="churchos-demo-password">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; height: 46px;">
            Sign In
          </button>
        </form>
      </div>
    </div>
  `;
}

// ── Screen Rendering: THEME BEDROCK ──────────────────────────
function renderThemeBedrock() {
  const theme = STATE.pageContext.theme || {};
  const settings = theme.settings || {};
  
  // Apply CSS color overrides on root dynamically
  document.body.style.setProperty('--bg-color', settings.backgroundColor || '#0b1020');
  document.body.style.setProperty('--primary-accent', settings.primaryColor || '#6366f1');
  document.body.style.setProperty('--font-family', settings.fontFamily || 'Inter, sans-serif');

  const title = STATE.pageContext.title || 'Church Home';
  const blocks = STATE.pageContext.contentBlocks || [];

  return `
    <div class="theme-bedrock">
      <!-- Bedrock Header -->
      <header class="bedrock-header">
        <a href="#" class="logo" style="font-size: 1.3rem;">
          <i data-lucide="church"></i>
          <span>${STATE.pageContext.title ? STATE.pageContext.title : 'My Church'}</span>
        </a>
        <nav class="bedrock-nav">
          <a href="#" class="bedrock-nav-link active" data-slug="">Home</a>
          <a href="#" class="bedrock-nav-link" data-slug="sermons">Sermons</a>
          <a href="#" class="bedrock-nav-link" data-slug="give">Online Giving</a>
          <a href="#" class="bedrock-nav-link" data-slug="blog">Devotionals</a>
        </nav>
      </header>

      <!-- Main layout blocks builder -->
      <main>
        ${blocks.length > 0 ? renderBlocks(blocks) : renderDefaultMockBlocks(title)}
      </main>

      <footer style="padding: 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 60px; color: var(--text-muted); font-size: 0.85rem;">
        Powered by Digital Church OS Theme Bedrock Engine
      </footer>
    </div>
  `;
}

function renderBlocks(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'HeroSection':
        return `
          <section class="hero-block">
            <h1 class="hero-title">${block.title || 'Welcome'}</h1>
            <p class="hero-subtitle">${block.subtitle || ''}</p>
            ${block.ctaLabel ? `<a href="${block.ctaUrl || '#'}" class="btn btn-primary">${block.ctaLabel}</a>` : ''}
          </section>
        `;
      case 'SermonPlayer':
        return `
          <section class="bedrock-container">
            <h3 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 32px; color: var(--text-strong);">Latest Sermon Streams</h3>
            <div class="grid-3">
              <div class="card">
                <div style="background-color: var(--border); height: 180px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                  <i data-lucide="play-circle" style="width: 48px; height: 48px; color: var(--accent);"></i>
                </div>
                <h4 style="margin-bottom: 8px; color: var(--text-strong);">The Sovereignty of Grace</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Sermon Series: Covenant Love • Pastor Andrew</p>
              </div>
            </div>
          </section>
        `;
      default:
        return '';
    }
  }).join('');
}

function renderDefaultMockBlocks(title) {
  return `
    <section class="hero-block">
      <h1 class="hero-title">${title}</h1>
      <p class="hero-subtitle">Bringing fellowship, discipleship, and spiritual growth online.</p>
      <button class="btn btn-primary" id="bedrock-primary-cta">Learn More</button>
    </section>
    
    <section class="bedrock-container">
      <div class="grid-3">
        <div class="card">
          <i data-lucide="radio" style="color: var(--accent); margin-bottom: 16px;"></i>
          <h4 style="margin-bottom: 8px; color: var(--text-strong);">Interactive Media Player</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Listen to audio archives, watch sermons, and review weekly services.</p>
        </div>
        <div class="card">
          <i data-lucide="heart-handshake" style="color: var(--accent); margin-bottom: 16px;"></i>
          <h4 style="margin-bottom: 8px; color: var(--text-strong);">Secure Contributions</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Support our building campaign, pay tithes, and contribute directly.</p>
        </div>
        <div class="card">
          <i data-lucide="users" style="color: var(--accent); margin-bottom: 16px;"></i>
          <h4 style="margin-bottom: 8px; color: var(--text-strong);">Fellowship Finder</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Connect with a home cell fellowship nearby to experience community.</p>
        </div>
      </div>
    </section>
  `;
}


// ── Event Bindings: SUPER ADMIN PORTAL ────────────────────────
function bindSuperAdminEvents() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => logout();
  }

  // Sidebar navigation links toggle
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-item a');
  navLinks.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const subview = link.getAttribute('data-subview');
      STATE.activeSubView = subview;
      window.history.pushState(null, '', `/super-admin/${subview}`);
      renderApp();
    };
  });

  // Add Tenant Action
  const createBtn = document.getElementById('createTenantBtn');
  if (createBtn) {
    createBtn.onclick = async () => {
      const name = prompt('Enter new Church/Tenant name:');
      if (!name) return;
      const subdomain = prompt('Enter unique routing subdomain (e.g. grace):');
      if (!subdomain) return;
      const customDomain = prompt('Enter custom domain name (optional):') || '';
      
      try {
        await apiFetch('/api/super-admin/tenants', {
          method: 'POST',
          body: JSON.stringify({ name, subdomain, customDomain })
        });
        alert('Tenant workspace created successfully!');
        loadSuperAdminData();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    };
  }

  // Filter Logs Action
  const filterBtn = document.getElementById('filterLogsBtn');
  if (filterBtn) {
    filterBtn.onclick = async () => {
      const level = document.getElementById('logLevelSelect').value;
      const scope = document.getElementById('logScopeInput').value;
      try {
        const queryParams = new URLSearchParams();
        if (level) queryParams.append('level', level);
        if (scope) queryParams.append('scope', scope);
        const res = await apiFetch(`/api/super-admin/logs?${queryParams.toString()}`);
        STATE.adminData.logs = res.data;
        renderLogsTable();
      } catch (e) {
        console.error(e);
      }
    };
  }

  // Load appropriate data for active subview
  loadSuperAdminData();
}

async function loadSuperAdminData() {
  if (STATE.activeSubView === 'tenants') {
    try {
      const res = await apiFetch('/api/super-admin/tenants');
      STATE.adminData.tenants = res.data;
      renderTenantsTable();
    } catch (e) {
      console.error(e);
    }
  } else if (STATE.activeSubView === 'modules') {
    try {
      const res = await apiFetch('/api/super-admin/modules');
      STATE.adminData.modules = res.data;
      renderModulesTable();
    } catch (e) {
      console.error(e);
    }
  } else if (STATE.activeSubView === 'logs') {
    try {
      const res = await apiFetch('/api/super-admin/logs');
      STATE.adminData.logs = res.data;
      renderLogsTable();
    } catch (e) {
      console.error(e);
    }
  }
}

function renderTenantsTable() {
  const tbody = document.getElementById('tenants-table-body');
  if (!tbody) return;

  if (STATE.adminData.tenants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No tenants found.</td></tr>`;
    return;
  }

  tbody.innerHTML = STATE.adminData.tenants.map(tenant => {
    const planName = tenant.subscription && tenant.subscription.plan ? tenant.subscription.plan.name : 'None';
    const statusPillClass = tenant.status === 'active' ? 'pill-active' : 'pill-suspended';
    return `
      <tr>
        <td style="font-weight: 600; color: var(--text-strong);">${tenant.name}</td>
        <td>${tenant.subdomain}</td>
        <td>${tenant.customDomain || '—'}</td>
        <td><span class="pill ${statusPillClass}">${tenant.status}</span></td>
        <td>${planName}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleTenantStatus('${tenant.id}', '${tenant.status}')">
            ${tenant.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleTenantStatus = async function(id, currentStatus) {
  const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
  try {
    await apiFetch(`/api/super-admin/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus })
    });
    loadSuperAdminData();
  } catch (e) {
    alert('Failed to update tenant status: ' + e.message);
  }
};

function renderModulesTable() {
  const tbody = document.getElementById('modules-table-body');
  if (!tbody) return;

  if (STATE.adminData.modules.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No modules registered.</td></tr>`;
    return;
  }

  tbody.innerHTML = STATE.adminData.modules.map(mod => {
    return `
      <tr>
        <td style="font-family: monospace; font-weight: 600; color: var(--text-strong);">${mod.key}</td>
        <td>${mod.name}</td>
        <td>${mod.category}</td>
        <td><span style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${mod.dependencies}</span></td>
      </tr>
    `;
  }).join('');
}

function renderLogsTable() {
  const tbody = document.getElementById('logs-table-body');
  if (!tbody) return;

  if (STATE.adminData.logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No log entries.</td></tr>`;
    return;
  }

  tbody.innerHTML = STATE.adminData.logs.map(log => {
    let levelClass = 'pill-warning';
    if (log.logLevel === 'error' || log.logLevel === 'fatal') levelClass = 'pill-danger';
    if (log.logLevel === 'info') levelClass = 'pill-success';

    return `
      <tr>
        <td><span class="pill ${levelClass}">${log.logLevel}</span></td>
        <td style="font-family: monospace; font-weight: 500;">${log.scope}</td>
        <td style="color: var(--text-strong); font-size: 0.85rem;">${log.message}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(log.createdAt).toLocaleString()}</td>
      </tr>
    `;
  }).join('');
}


// ── Event Bindings: TENANT ADMIN PORTAL ───────────────────────
function bindTenantAdminEvents() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => logout();
  }

  // Sidebar navigation links toggle
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-item a');
  navLinks.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const subview = link.getAttribute('data-subview');
      STATE.activeSubView = subview;
      window.history.pushState(null, '', `/admin/${subview}`);
      renderApp();
    };
  });

  // Settings tab selections
  if (STATE.activeSubView === 'settings') {
    const tabs = document.querySelectorAll('[data-setting-tab]');
    tabs.forEach(tab => {
      tab.onclick = (e) => {
        e.preventDefault();
        const tabKey = tab.getAttribute('data-setting-tab');
        loadSettingsTab(tabKey);
      };
    });
  }

  loadTenantAdminData();
}

async function loadTenantAdminData() {
  if (STATE.activeSubView === 'dashboard') {
    renderDashboardChart();
  } else if (STATE.activeSubView === 'cms') {
    try {
      const res = await apiFetch('/api/cms/pages');
      renderCmsPagesTable(res.data);
    } catch (e) {
      console.error(e);
    }
  } else if (STATE.activeSubView === 'settings') {
    loadSettingsTab('liveChat');
  }
}

function renderDashboardChart() {
  const canvas = document.getElementById('growthChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Active Congregation Members',
        data: [1200, 1280, 1310, 1380, 1420, 1482],
        borderColor: '#6366f1',
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f3f4f6' } }
      }
    }
  });
}

function renderCmsPagesTable(pages) {
  const tbody = document.getElementById('cms-pages-table-body');
  if (!tbody) return;

  if (pages.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No pages found.</td></tr>`;
    return;
  }

  tbody.innerHTML = pages.map(page => {
    const statusPillClass = page.status === 'published' ? 'pill-success' : 'pill-warning';
    return `
      <tr>
        <td style="font-weight: 600; color: var(--text-strong);">${page.title}</td>
        <td style="font-family: monospace;">/${page.slug}</td>
        <td>${page.isHome ? 'Yes' : 'No'}</td>
        <td><span class="pill ${statusPillClass}">${page.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="togglePublishPage('${page.id}', '${page.status}')">
            ${page.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.togglePublishPage = async function(id, currentStatus) {
  const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
  try {
    await apiFetch(`/api/cms/pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus })
    });
    loadTenantAdminData();
  } catch (e) {
    alert('Failed to update page publication status: ' + e.message);
  }
};

// ── Dynamic Form Rendering for Settings Engine ───────────────
const SETTINGS_SCHEMAS = {
  liveChat: {
    title: 'Live Chat Care Settings',
    fields: [
      { key: 'enableAiScreening', label: 'Enable AI Crisis Screening & Response suggestions', type: 'boolean', default: true },
      { key: 'autoEscalateTimer', label: 'Auto Escalate Timer (minutes)', type: 'number', default: 15 },
      { key: 'welcomeMessage', label: 'Interactive Welcome message', type: 'string', default: 'Welcome! How can we care for you?' }
    ]
  },
  giving: {
    title: 'Tithes & Offerings Gateways',
    fields: [
      { key: 'defaultCurrency', label: 'Default Currency (USD, EUR, GBP)', type: 'string', default: 'USD' },
      { key: 'enableRecurringGifts', label: 'Allow recurring seed checks', type: 'boolean', default: true },
      { key: 'minGiftAmount', label: 'Minimum Transaction Amount', type: 'number', default: 5 }
    ]
  }
};

async function loadSettingsTab(moduleKey) {
  // Update active tab styles
  const tabs = document.querySelectorAll('[data-setting-tab]');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-setting-tab') === moduleKey) {
      tab.classList.add('active-nav');
    } else {
      tab.classList.remove('active-nav');
    }
  });

  const schema = SETTINGS_SCHEMAS[moduleKey];
  document.getElementById('settings-tab-title').textContent = schema.title;

  try {
    // Fetch active settings overrides from backend Settings Engine
    const res = await apiFetch(`/api/settings/${moduleKey}`);
    const activeSettings = res.data;

    const fieldsContainer = document.getElementById('settings-fields-container');
    fieldsContainer.innerHTML = schema.fields.map(field => {
      const val = activeSettings[field.key] !== undefined ? activeSettings[field.key] : field.default;
      
      if (field.type === 'boolean') {
        return `
          <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="form-label" style="margin-bottom: 4px;">${field.label}</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="setting-${field.key}" ${val ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        `;
      }
      
      return `
        <div class="form-group">
          <label class="form-label">${field.label}</label>
          <input type="${field.type === 'number' ? 'number' : 'text'}" id="setting-${field.key}" class="form-control" value="${val}">
        </div>
      `;
    }).join('');

    // Rebind save and reset triggers
    document.getElementById('saveSettingsBtn').onclick = () => saveSettings(moduleKey);
    document.getElementById('resetSettingsBtn').onclick = () => resetSettings(moduleKey);
  } catch (e) {
    console.error(e);
  }
}

async function saveSettings(moduleKey) {
  const schema = SETTINGS_SCHEMAS[moduleKey];
  const payload = {};

  schema.fields.forEach(field => {
    const input = document.getElementById(`setting-${field.key}`);
    if (field.type === 'boolean') {
      payload[field.key] = input.checked;
    } else if (field.type === 'number') {
      payload[field.key] = parseFloat(input.value);
    } else {
      payload[field.key] = input.value;
    }
  });

  try {
    await apiFetch(`/api/settings/${moduleKey}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    alert('Settings saved successfully!');
    loadSettingsTab(moduleKey);
  } catch (e) {
    alert('Failed to save settings: ' + e.message);
  }
}

async function resetSettings(moduleKey) {
  if (!confirm('Are you sure you want to reset all overrides to defaults?')) return;
  try {
    await apiFetch(`/api/settings/${moduleKey}/reset`, {
      method: 'POST'
    });
    alert('Settings reset back to defaults.');
    loadSettingsTab(moduleKey);
  } catch (e) {
    alert('Reset failed: ' + e.message);
  }
}

// ── Event Bindings: THEME BEDROCK ────────────────────────────
function bindBedrockEvents() {
  const links = document.querySelectorAll('.bedrock-nav-link');
  links.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const slug = link.getAttribute('data-slug');
      STATE.pageContext.slug = slug;
      window.history.pushState(null, '', `/${slug}`);
      resolveDnsContext().then(() => renderApp());
    };
  });
}

// ── Common Portal Events ─────────────────────────────────────
function bindCommonEvents() {
  // Dynamic light/dark theme toggle
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    themeToggle.onclick = () => {
      document.body.classList.toggle('light-theme');
      document.body.classList.toggle('dark-theme');
    };
  }
}

function bindLoginEvent() {
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorMsg = document.getElementById('loginErrorMsg');

      try {
        // Log in to global endpoint
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Default demo tenant injection for login routing
            'x-tenant-id': localStorage.getItem('tenantId') || 'demo-church-local'
          },
          body: JSON.stringify({ email, password })
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Authentication failed');
        }

        login(json.token, json.user);
        
        // Push router to default dash
        if (STATE.activeView === 'super-admin') {
          STATE.activeSubView = 'tenants';
        } else {
          STATE.activeSubView = 'dashboard';
        }
        renderApp();
      } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.style.display = 'block';
      }
    };
  }
}

// Initial Bootstrap on Page Load
window.addEventListener('DOMContentLoaded', () => {
  initRouter();
  
  // Listen for history popstates (back buttons)
  window.onpopstate = () => {
    initRouter();
  };
});
