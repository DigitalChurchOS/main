const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'dist', 'public');
const appsRoot = path.join(root, 'apps');
const superAdminPublic = path.join(appsRoot, 'super-admin', 'public');
const tenantDashboardPublic = path.join(appsRoot, 'tenant-dashboard', 'public');
const tenantDashboardBuilder = path.join(appsRoot, 'tenant-dashboard', 'src');
const churchFrontendPublic = path.join(appsRoot, 'church-frontend', 'public');
const marketplaceFrontend = path.join(appsRoot, 'marketplace', 'frontend');
const marketplaceDeveloper = path.join(appsRoot, 'marketplace', 'developer');
const webPublic = path.join(appsRoot, 'web', 'public');

function copyFile(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// 1. Landing page to root '/'
copyDirectory(webPublic, outputDir);

// 2. Tenant dashboard under '/admin'
copyDirectory(tenantDashboardPublic, path.join(outputDir, 'admin'));
copyFile(path.join(tenantDashboardPublic, 'index.html'), path.join(outputDir, 'admin', 'index.html'));

// 3. Super Admin under '/central'
copyDirectory(superAdminPublic, path.join(outputDir, 'central'));
copyFile(path.join(superAdminPublic, 'index.html'), path.join(outputDir, 'central', 'index.html'));

// 4. Marketplace under '/marketplace'
copyDirectory(marketplaceFrontend, path.join(outputDir, 'marketplace'));
copyFile(path.join(marketplaceFrontend, 'index.html'), path.join(outputDir, 'marketplace', 'index.html'));

// 5. Developer under '/developer'
copyDirectory(marketplaceDeveloper, path.join(outputDir, 'developer'));
copyFile(path.join(marketplaceDeveloper, 'index.html'), path.join(outputDir, 'developer', 'index.html'));

// 6. Legacy / compatibility mappings
copyFile(path.join(tenantDashboardPublic, 'index.html'), path.join(outputDir, 'admin.html'));
copyFile(path.join(tenantDashboardPublic, 'index.html'), path.join(outputDir, 'dashboard.html'));
copyFile(path.join(tenantDashboardPublic, 'index.html'), path.join(outputDir, 'tenant-dashboard', 'index.html'));
copyFile(path.join(superAdminPublic, 'index.html'), path.join(outputDir, 'super-admin', 'index.html'));
copyFile(path.join(churchFrontendPublic, 'index.html'), path.join(outputDir, 'churchos.html'));
copyFile(path.join(churchFrontendPublic, 'live.html'), path.join(outputDir, 'live.html'));
copyDirectory(churchFrontendPublic, path.join(outputDir, 'church'));
copyFile(path.join(marketplaceFrontend, 'index.html'), path.join(outputDir, 'marketplace.html'));
copyDirectory(marketplaceDeveloper, path.join(outputDir, 'marketplace', 'developer'));
copyFile(path.join(root, 'index.html'), path.join(outputDir, 'legacy-index.html'));
copyFile(path.join(root, 'dark.png'), path.join(outputDir, 'dark.png'));
copyFile(path.join(root, 'light.png'), path.join(outputDir, 'light.png'));
copyDirectory(tenantDashboardBuilder, path.join(outputDir, 'page-builder'));

console.log(`Cloudflare assets prepared in ${path.relative(root, outputDir)}`);

