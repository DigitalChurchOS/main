const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '..', 'apps', 'tenant-dashboard', 'public', 'index.html');
console.log('Target file path:', targetFilePath);

if (!fs.existsSync(targetFilePath)) {
  console.error('Target file does not exist!');
  process.exit(1);
}

let content = fs.readFileSync(targetFilePath, 'utf8');

// 1. Insert the Setup Welcome HTML panel inside overviewView, before metrics using regex
const regexHtml = /<section id="overviewView" class="view">\s*<div id="metrics" class="grid metrics"><\/div>/;

const setupHtml = `<section id="overviewView" class="view">
          <!-- Setup Welcome & Launch Readiness Panel -->
          <div class="panel setup-welcome-panel" id="setupWelcomePanel" style="margin-bottom: 24px; padding: 24px; background: linear-gradient(135deg, var(--sidebar) 0%, rgba(79, 70, 229, 0.05) 100%); border: 1px solid var(--line); border-radius: var(--radius);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 300px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                  <span style="background: var(--accent); color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;" id="dashboardPlanBadge">Starter Plan</span>
                  <span style="color: var(--muted); font-size: 13px;" id="dashboardDomainLabel">subdomain.churchos.com</span>
                </div>
                <h2 id="setupWelcomeTitle" style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: var(--text);">Welcome to your Digital Church OS!</h2>
                <p style="color: var(--muted); margin-bottom: 16px; font-size: 14px;">Let's get your church platform ready for launch. Complete the checklist below to go live.</p>
                
                <!-- Progress Bar -->
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; font-size: 14px; color: var(--text);" id="setupProgressText">Your church platform is 0% ready</span>
                    <span style="font-weight: 700; font-size: 14px; color: var(--accent);" id="setupProgressPercent">0%</span>
                  </div>
                  <div style="width: 100%; height: 8px; background: var(--line); border-radius: 999px; overflow: hidden;">
                    <div id="setupProgressBar" style="width: 0%; height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.4s ease;"></div>
                  </div>
                </div>
              </div>
              
              <!-- Website Preview Card -->
              <div class="website-preview-card" style="width: 320px; background: var(--sidebar); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #f59e0b;"></div>
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></div>
                  <span style="font-size: 12px; color: var(--muted); margin-left: auto;" id="previewSubdomainText">churchname.churchos.com</span>
                </div>
                <div style="height: 120px; background: var(--accent-soft); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed var(--line); margin-bottom: 12px; text-align: center; padding: 12px;">
                  <i data-lucide="globe" style="width: 28px; height: 28px; color: var(--accent); margin-bottom: 8px;"></i>
                  <span style="font-weight: 600; font-size: 13px; color: var(--text);" id="previewChurchName">My Church Site</span>
                  <span style="font-size: 11px; color: var(--muted);" id="previewThemeName">Christo Theme</span>
                </div>
                <a id="previewWebsiteBtn" href="#" target="_blank" class="btn primary w-full text-center" style="display: flex; justify-content: center; gap: 8px;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> View Public Website
                </a>
              </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid var(--line); margin: 24px 0;">
            
            <!-- Launch Readiness Checklist -->
            <div>
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--text);">
                <i data-lucide="list-todo" style="width: 18px; height: 18px; color: var(--accent);"></i> Launch Readiness Checklist
              </h3>
              <div class="setup-checklist-grid" id="setupChecklistGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                <!-- Checklist items dynamically loaded -->
              </div>
            </div>

            <!-- Quick Actions -->
            <div style="margin-top: 24px;">
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; color: var(--text);">
                <i data-lucide="zap" style="width: 18px; height: 18px; color: var(--accent);"></i> Quick Actions
              </h3>
              <div class="quick-actions-grid" id="quickActionsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                <!-- Quick actions dynamically loaded -->
              </div>
            </div>
          </div>

          <div id="metrics" class="grid metrics"></div>`;

if (content.includes('setupWelcomePanel')) {
  console.log('setupWelcomePanel HTML already exists in file. Skipping insertion.');
} else if (regexHtml.test(content)) {
  content = content.replace(regexHtml, setupHtml);
  console.log('Inserted setupWelcomePanel HTML successfully.');
} else {
  console.error('Could not find target HTML insertion point in index.html!');
  process.exit(1);
}

// 2. Insert JavaScript functions before `function mountApp` or in the script block
const jsCode = `
    async function bootstrapSetupChecklist() {
      const token = localStorage.getItem('churchos.token') || 'local-preview-token';
      const tenantId = localStorage.getItem('churchos.tenantId') || 'tenant-next';
      if (!token || !tenantId) return;

      try {
        // Fetch dashboard home config
        const homeRes = await fetch('/api/dashboard/home', {
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': tenantId
          }
        });
        const homeData = await homeRes.json();
        
        if (homeData.data) {
          const { welcomeHeader, progressPercent, planStatus, domainStatus } = homeData.data;
          
          document.getElementById('setupWelcomeTitle').textContent = welcomeHeader || 'Welcome to your Digital Church OS!';
          document.getElementById('dashboardPlanBadge').textContent = (planStatus?.name || 'Free Trial') + ' Plan';
          
          const domainStr = domainStatus?.customDomain || (domainStatus?.subdomain ? \`\${domainStatus.subdomain}.churchos.com\` : 'No domain configured');
          document.getElementById('dashboardDomainLabel').textContent = domainStr;
          document.getElementById('previewSubdomainText').textContent = domainStr;
          
          // Set preview button href
          const previewBtn = document.getElementById('previewWebsiteBtn');
          if (previewBtn) {
            const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            if (isLocal) {
              previewBtn.href = \`/site/\${domainStatus?.subdomain || 'demo'}\`;
            } else {
              previewBtn.href = domainStatus?.customDomain ? \`https://\${domainStatus.customDomain}\` : \`https://\${domainStatus?.subdomain || 'demo'}.churchos.com\`;
            }
          }
        }

        // Fetch checklist items
        const checklistRes = await fetch('/api/dashboard/setup-checklist', {
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': tenantId
          }
        });
        const checklistData = await checklistRes.json();
        
        if (checklistData.data) {
          const { progressPercent, items } = checklistData.data;
          
          // Update progress bar
          document.getElementById('setupProgressText').textContent = \`Your church platform is \${progressPercent}% ready\`;
          document.getElementById('setupProgressPercent').textContent = \`\${progressPercent}%\`;
          document.getElementById('setupProgressBar').style.width = \`\${progressPercent}%\`;
          
          // Render checklist items
          const grid = document.getElementById('setupChecklistGrid');
          grid.innerHTML = items.map(item => {
            const isDone = item.status === 'completed';
            const icon = isDone ? 'check-circle-2' : 'circle';
            const iconColor = isDone ? '#10b981' : 'var(--muted)';
            const textDecoration = isDone ? 'line-through' : 'none';
            const opacity = isDone ? '0.7' : '1';
            
            return \`
              <div style="background: var(--sidebar); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; opacity: \${opacity}; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s;">
                <div>
                  <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                    <i data-lucide="\${icon}" style="width: 20px; height: 20px; color: \${iconColor}; flex-shrink: 0; cursor: pointer;" onclick="toggleChecklistStep('\${item.key}', '\${item.status === 'completed' ? 'pending' : 'completed'}')"></i>
                    <div>
                      <h4 style="font-size: 14px; font-weight: 600; text-decoration: \${textDecoration}; color: var(--text);">\${item.title}</h4>
                      <p style="font-size: 12px; color: var(--muted); margin-top: 4px;">\${item.description}</p>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 11px; color: var(--muted); border-top: 1px solid var(--line); padding-top: 8px;">
                  <span>Area: \${item.assignedArea}</span>
                  <a href="\${item.actionLink}" style="color: var(--accent); font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                    Go Setup <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i>
                  </a>
                </div>
              </div>
            \`;
          }).join('');
        }

        // Fetch quick actions
        const actionsRes = await fetch('/api/dashboard/quick-actions', {
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': tenantId
          }
        });
        const actionsData = await actionsRes.json();
        
        if (actionsData.data) {
          const grid = document.getElementById('quickActionsGrid');
          grid.innerHTML = actionsData.data.map(act => {
            return \`
              <a href="\${act.url}" onclick="handleQuickActionClick(event, '\${act.view}')" style="background: var(--sidebar); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px; display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); font-size: 13px; font-weight: 500; transition: background 0.2s, transform 0.2s;">
                <i data-lucide="\${act.icon}" style="width: 16px; height: 16px; color: var(--accent);"></i>
                <span>\${act.label}</span>
              </a>
            \`;
          }).join('');
        }

        if (window.lucide) window.lucide.createIcons();
      } catch (err) {
        console.error('Error bootstrapping dashboard checklist:', err);
      }
    }

    async function toggleChecklistStep(stepKey, targetStatus) {
      const token = localStorage.getItem('churchos.token') || 'local-preview-token';
      const tenantId = localStorage.getItem('churchos.tenantId') || 'tenant-next';
      if (!token || !tenantId) return;

      try {
        await fetch(\`/api/dashboard/setup-checklist/\${stepKey}\`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': tenantId
          },
          body: JSON.stringify({ status: targetStatus })
        });
        await bootstrapSetupChecklist();
      } catch (err) {
        console.error('Error toggling step:', err);
      }
    }

    function handleQuickActionClick(event, view) {
      if (typeof switchView === 'function') {
        event.preventDefault();
        switchView(view === 'cms' ? 'modules' : view);
        if (view === 'cms' && typeof selectSidebarCategory === 'function') {
          selectSidebarCategory('Churchfront');
          const modLink = document.querySelector('[data-module-key="cms"]');
          if (modLink) modLink.click();
        }
      }
    }

    window.toggleChecklistStep = toggleChecklistStep;
    window.handleQuickActionClick = handleQuickActionClick;
`;

if (content.includes('bootstrapSetupChecklist')) {
  console.log('bootstrapSetupChecklist JS already exists in file. Skipping insertion.');
} else {
  // We can insert this JS right before `function mountApp()`
  const mountAppIndex = content.indexOf('function mountApp() {');
  if (mountAppIndex === -1) {
    console.error('Could not find function mountApp() declaration in index.html!');
    process.exit(1);
  }
  content = content.slice(0, mountAppIndex) + jsCode + '\n    ' + content.slice(mountAppIndex);
  console.log('Inserted bootstrapSetupChecklist JS successfully.');
}

// 3. Update mountApp() to run bootstrapSetupChecklist()
const mountAppTarget = /function\s+mountApp\(\)\s*\{([^}]*)\brender\(\);/;

if (content.includes('render();\n      bootstrapSetupChecklist();') || content.includes('render();bootstrapSetupChecklist();')) {
  console.log('mountApp already runs bootstrapSetupChecklist. Skipping modification.');
} else if (mountAppTarget.test(content)) {
  content = content.replace(mountAppTarget, (match) => {
    return match + '\n      bootstrapSetupChecklist();';
  });
  console.log('Updated mountApp() to call bootstrapSetupChecklist().');
} else {
  console.error('Could not find mountApp declaration in index.html!');
  process.exit(1);
}

// Write the changes back to index.html
fs.writeFileSync(targetFilePath, content, 'utf8');
console.log('Patch complete.');
