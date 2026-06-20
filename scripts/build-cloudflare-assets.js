const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'dist', 'public');
const appsRoot = path.join(root, 'apps');
const superAdminPublic = path.join(appsRoot, 'super-admin', 'public');
const tenantDashboardPublic = path.join(appsRoot, 'tenant-dashboard', 'public');
const churchFrontendRoot = path.join(appsRoot, 'church-frontend');
const churchFrontendPublic = path.join(appsRoot, 'church-frontend', 'public');
const churchFrontendDist = path.join(appsRoot, 'church-frontend', 'dist');
const marketplaceFrontend = path.join(appsRoot, 'marketplace', 'frontend');
const marketplaceDeveloper = path.join(appsRoot, 'marketplace', 'developer');
const webPublic = path.join(appsRoot, 'web', 'public');
const themeCustomizerRoot = path.join(root, 'theme-customizer');
const customizerEcclesiaFullTheme = path.join(themeCustomizerRoot, 'public', 'themes', 'ecclesia-full-theme');
const rootEcclesiaFullTheme = path.join(root, 'ecclesia-full-theme');
const ecclesiaFullTheme = fs.existsSync(customizerEcclesiaFullTheme) ? customizerEcclesiaFullTheme : rootEcclesiaFullTheme;
const themeCustomizerDist = path.join(themeCustomizerRoot, 'dist');
const buildThemeCustomizer = /^(1|true|yes)$/i.test(process.env.BUILD_THEME_CUSTOMIZER || '');
const buildChurchFrontend = !/^(0|false|no)$/i.test(process.env.BUILD_CHURCH_FRONTEND || '');

function ensureAppDependencies(appRoot, label) {
  const viteBin = path.join(
    appRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vite.cmd' : 'vite'
  );

  if (fs.existsSync(viteBin)) return;

  console.log(`Installing ${label} dependencies...`);
  execSync('npm ci --include=dev --progress=false', {
    cwd: appRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD || 'true'
    }
  });
}

if (buildThemeCustomizer) {
  console.log('Building Theme Customizer React App...');
  ensureAppDependencies(themeCustomizerRoot, 'Theme Customizer');
  execSync('npm run build', { cwd: themeCustomizerRoot, stdio: 'inherit' });
} else {
  console.log('Skipping Theme Customizer build. Set BUILD_THEME_CUSTOMIZER=true to include /customizer assets.');
}

if (buildChurchFrontend) {
  console.log('Building Church Frontend React App...');
  ensureAppDependencies(churchFrontendRoot, 'Church Frontend');
  execSync('npm run build', { cwd: churchFrontendRoot, stdio: 'inherit' });
} else {
  console.log('Skipping Church Frontend build. Set BUILD_CHURCH_FRONTEND=true or omit BUILD_CHURCH_FRONTEND to include /church assets.');
}

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

// 6. Ecclesia reference theme package under local-compatible theme aliases
copyDirectory(ecclesiaFullTheme, path.join(outputDir, 'themes', 'ecclesia'));
copyFile(path.join(ecclesiaFullTheme, 'index.html'), path.join(outputDir, 'themes', 'ecclesia', 'index.html'));
copyDirectory(ecclesiaFullTheme, path.join(outputDir, 'themes', 'ecclesia-full-theme'));
copyFile(path.join(ecclesiaFullTheme, 'index.html'), path.join(outputDir, 'themes', 'ecclesia-full-theme', 'index.html'));

// 6.5 Theme Customizer under '/customizer'
if (buildThemeCustomizer) {
  copyDirectory(themeCustomizerDist, path.join(outputDir, 'customizer'));
}

// 7. Legacy / compatibility mappings
copyFile(path.join(tenantDashboardPublic, 'index.html'), path.join(outputDir, 'admin.html'));
copyFile(path.join(tenantDashboardPublic, 'index.html'), path.join(outputDir, 'tenant-dashboard', 'index.html'));
copyFile(path.join(superAdminPublic, 'index.html'), path.join(outputDir, 'super-admin', 'index.html'));
if (fs.existsSync(churchFrontendDist)) {
  copyDirectory(churchFrontendDist, path.join(outputDir, 'church'));
} else {
  copyDirectory(churchFrontendPublic, path.join(outputDir, 'church'));
}
copyFile(path.join(marketplaceFrontend, 'index.html'), path.join(outputDir, 'marketplace.html'));
copyDirectory(marketplaceDeveloper, path.join(outputDir, 'marketplace', 'developer'));
copyFile(path.join(root, 'index.html'), path.join(outputDir, 'legacy-index.html'));
copyFile(path.join(root, 'dark.png'), path.join(outputDir, 'dark.png'));
copyFile(path.join(root, 'light.png'), path.join(outputDir, 'light.png'));

console.log(`Cloudflare assets prepared in ${path.relative(root, outputDir)}`);
