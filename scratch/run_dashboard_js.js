const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('dashboard.html', 'utf8');

// Extract the main script block
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let code = '';
while ((match = scriptRegex.exec(html)) !== null) {
  const content = match[1];
  if (content.includes('modules =') || content.includes('renderSidebarModules')) {
    code = content;
    break;
  }
}

if (!code) {
  console.error("Could not find the main script block!");
  process.exit(1);
}

// Mock browser globals
const elements = {};
const mockElement = (id) => ({
  id,
  classList: {
    add: (...classes) => console.log(`[DOM] Add class to #${id}:`, ...classes),
    remove: (...classes) => console.log(`[DOM] Remove class to #${id}:`, ...classes),
    toggle: (cls, force) => console.log(`[DOM] Toggle class for #${id}:`, cls, force),
  },
  style: {},
  addEventListener: (event, handler) => {
    console.log(`[DOM] Add event listener to #${id}:`, event);
  },
  appendChild: (child) => {
    console.log(`[DOM] Append child to #${id}`);
  },
  querySelector: (sel) => {
    console.log(`[DOM] querySelector on #${id} for:`, sel);
    return null;
  },
  querySelectorAll: (sel) => {
    console.log(`[DOM] querySelectorAll on #${id} for:`, sel);
    return [];
  }
});

const getEl = (id) => {
  if (!elements[id]) {
    elements[id] = mockElement(id);
  }
  return elements[id];
};

const domWindow = {
  location: { search: '', hostname: 'localhost' },
  localStorage: {
    getItem: (key) => {
      if (key.includes('session')) return 'active';
      return null;
    },
    setItem: (key, val) => console.log(`[Storage] Set key: ${key}`),
  },
  document: {
    getElementById: getEl,
    querySelectorAll: (sel) => {
      console.log(`[DOM] document.querySelectorAll:`, sel);
      // Return a button or list element to prevent errors if iterated
      return [];
    },
    querySelector: (sel) => {
      console.log(`[DOM] document.querySelector:`, sel);
      // For querySelector('.topbar') or similar, return a mock element
      if (sel === '.topbar') return mockElement('topbar');
      return null;
    },
    body: {
      classList: {
        toggle: (cls, force) => console.log(`[DOM] Toggle body class:`, cls, force),
      }
    },
    documentElement: {
      style: {
        setProperty: (p, v) => console.log(`[DOM] setProperty:`, p, v),
      }
    },
    addEventListener: (event, handler) => {
      console.log(`[DOM] document.addEventListener:`, event);
    }
  },
  console: console,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  },
  Event: class {
    constructor() {}
  },
  MutationObserver: class {
    constructor() {}
    observe() {}
  },
  requestAnimationFrame: (cb) => cb(),
  setTimeout: setTimeout,
  setInterval: setInterval,
  lucide: {
    createIcons: () => console.log(`[Lucide] createIcons called`),
  }
};

domWindow.window = domWindow;

// Contextualize vm
const context = vm.createContext(domWindow);

try {
  vm.runInContext(code, context);
  console.log("Script executed successfully. Running init()...");
  context.init();
  console.log("init() finished successfully!");
} catch (err) {
  console.error("CRITICAL RUNTIME ERROR IN DASHBOARD JS:", err);
}
