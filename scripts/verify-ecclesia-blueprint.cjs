const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const catalogPath = path.join(root, 'apps', 'church-frontend', 'src', 'themes', 'ecclesia', 'blueprint', 'surfaceCatalog.ts');

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadCatalog() {
  const source = fs.readFileSync(catalogPath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require,
    console,
    Set,
    Map,
    Date,
    Math,
  }, { filename: catalogPath });
  return module.exports;
}

const catalog = loadCatalog();
const surfaces = catalog.SURFACE_CATALOG;

assert(Array.isArray(surfaces), 'SURFACE_CATALOG must export an array');
assert(surfaces.length === 88, `Expected 88 surfaces, found ${surfaces.length}`);

const keys = new Set();
const slugs = new Set();
for (const surface of surfaces) {
  assert(surface.key && !keys.has(surface.key), `Duplicate or missing surface key: ${surface.key}`);
  keys.add(surface.key);
  assert(typeof surface.endpoint === 'string' && surface.endpoint.startsWith('/api/'), `${surface.key} must use a tenant API endpoint`);
  const slugKey = surface.slug || '(home)';
  assert(!slugs.has(`${surface.phase}:${slugKey}`), `Duplicate phase slug: ${surface.phase}:${slugKey}`);
  slugs.add(`${surface.phase}:${slugKey}`);
}

const phaseCounts = surfaces.reduce((counts, surface) => {
  counts[surface.phase] = (counts[surface.phase] || 0) + 1;
  return counts;
}, {});
assert(phaseCounts.I === 10, `Phase I count mismatch: ${phaseCounts.I}`);
assert(phaseCounts.II === 13, `Phase II count mismatch: ${phaseCounts.II}`);
assert(phaseCounts.III === 7, `Phase III count mismatch: ${phaseCounts.III}`);
assert(phaseCounts.IV === 24, `Phase IV count mismatch: ${phaseCounts.IV}`);
assert(phaseCounts.V === 5, `Phase V count mismatch: ${phaseCounts.V}`);
assert(phaseCounts.VI === 4, `Phase VI count mismatch: ${phaseCounts.VI}`);
assert(phaseCounts.VII === 4, `Phase VII count mismatch: ${phaseCounts.VII}`);
assert(phaseCounts.VIII === 6, `Phase VIII count mismatch: ${phaseCounts.VIII}`);
assert(phaseCounts.IX === 15, `Phase IX count mismatch: ${phaseCounts.IX}`);

const headerPaths = new Set(catalog.HEADER_BLUEPRINT_NAV.map((item) => item.url));
const railPaths = new Set(catalog.RAIL_BLUEPRINT_NAV.map((item) => item.path));
const overlap = [...headerPaths].filter((item) => railPaths.has(item));
assert(overlap.length === 0, `Header/rail navigation overlap: ${overlap.join(', ')}`);

const httpSource = read(path.join('apps', 'church-frontend', 'src', 'http.ts'));
assert(httpSource.includes('DEFAULT_REQUEST_TIMEOUT_MS = 8000'), 'http.ts must keep an 8-second timeout');
assert(httpSource.includes('X-Tenant-ID'), 'http.ts must emit X-Tenant-ID');
assert(httpSource.includes('Authorization'), 'http.ts must emit Authorization when a member token exists');

const activeSources = [
  path.join('apps', 'church-frontend', 'src'),
  'ecclesia-full-theme',
  path.join('theme-customizer', 'public', 'themes', 'ecclesia-full-theme'),
];
const nativeDialogPattern = /\b(?:alert|confirm|prompt)\s*\(/;
const requiredAttrPattern = /<[^>]*\srequired(?=[\s/>])/i;

function scan(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(rel);
      continue;
    }
    if (!/\.(tsx?|jsx?|html|css)$/.test(entry.name)) continue;
    const text = read(rel);
    assert(!nativeDialogPattern.test(text), `Native browser dialog call found in ${rel}`);
    assert(!requiredAttrPattern.test(text), `Native required attribute found in ${rel}`);
  }
}

activeSources.forEach(scan);

const appSource = read(path.join('apps', 'church-frontend', 'src', 'App.tsx'));
assert(appSource.includes('BlueprintSurfacePage'), 'App.tsx must route blueprint surfaces');
const layoutSource = read(path.join('apps', 'church-frontend', 'src', 'themes', 'ecclesia', 'EcclesiaLayout.tsx'));
assert(layoutSource.includes('EcclesiaGlobalUI'), 'EcclesiaLayout must mount global overlays');

console.log('Ecclesia blueprint verification passed: 88 surfaces, no native dialogs, no nav overlap, API standards present.');
