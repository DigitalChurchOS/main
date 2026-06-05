const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read the index.html file
const htmlPath = path.resolve(__dirname, '../apps/tenant-dashboard/public/index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract script content
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
if (!scriptMatch) {
  console.error("Could not find script tag in index.html");
  process.exit(1);
}
const jsContent = scriptMatch[1];

// Create a mocked browser environment
const domListeners = [];
const documentListeners = [];

const mockElement = (tagName = 'div', id = '', className = '') => {
  const children = [];
  const attrs = {};
  const classes = new Set(className.split(' ').filter(Boolean));
  return {
    tagName: tagName.toUpperCase(),
    id,
    getBoundingClientRect() { return { top: 0, left: 0, bottom: 0, right: 0, width: 100, height: 100 }; },
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) { classes.delete(c); return false; }
          else { classes.add(c); return true; }
        } else if (force) {
          classes.add(c); return true;
        } else {
          classes.delete(c); return false;
        }
      }
    },
    get className() { return Array.from(classes).join(' '); },
    set className(val) { classes.clear(); val.split(' ').filter(Boolean).forEach(c => classes.add(c)); },
    style: {
      setProperty: () => {},
      getPropertyValue: () => ''
    },
    dataset: {},
    children,
    parentNode: null,
    appendChild(child) {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      children.push(child);
      child.parentNode = this;
      triggerMutation('childList', this, [child], []);
      return child;
    },
    insertBefore(newChild, refChild) {
      const idx = children.indexOf(refChild);
      if (idx !== -1) {
        if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
        children.splice(idx, 0, newChild);
        newChild.parentNode = this;
        triggerMutation('childList', this, [newChild], []);
      }
      return newChild;
    },
    after(newChild) {
      if (!this.parentNode) return;
      this.parentNode.insertBefore(newChild, this.nextElementSibling);
    },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) {
        children.splice(idx, 1);
        child.parentNode = null;
        triggerMutation('childList', this, [], [child]);
      }
      return child;
    },
    querySelector(sel) {
      // Very primitive selector matching
      if (sel.startsWith('#')) return children.find(c => c.id === sel.slice(1)) || null;
      if (sel.startsWith('.')) return children.find(c => c.classList.contains(sel.slice(1))) || null;
      return children.find(c => c.tagName === sel.toUpperCase()) || null;
    },
    querySelectorAll(sel) {
      const res = [];
      const traverse = (node) => {
        if (sel === 'select' && node.tagName === 'SELECT') res.push(node);
        if (sel.startsWith('.') && node.classList.contains(sel.slice(1))) res.push(node);
        node.children.forEach(traverse);
      };
      children.forEach(traverse);
      return res;
    },
    closest(sel) {
      let curr = this;
      while (curr) {
        if (sel.startsWith('.') && curr.classList.contains(sel.slice(1))) return curr;
        if (sel === 'select' && curr.tagName === 'SELECT') return curr;
        curr = curr.parentNode;
      }
      return null;
    },
    getAttribute(name) { return attrs[name] || ''; },
    setAttribute(name, val) { attrs[name] = val; },
    addEventListener(event, cb) {
      domListeners.push({ el: this, event, cb });
    },
    dispatchEvent(event) {},
    options: [],
    selectedIndex: 0,
    options: []
  };
};

const mockDocument = {
  documentElement: mockElement('html'),
  body: mockElement('body'),
  createElement(tag) { return mockElement(tag); },
  getElementById(id) {
    if (id === 'loginWall') return mockElement('main', 'loginWall');
    if (id === 'appShell') return mockElement('div', 'appShell', 'hidden');
    if (id === 'tenantName') return mockElement('span', 'tenantName');
    if (id === 'metrics') return mockElement('div', 'metrics');
    if (id === 'featuredModules') return mockElement('div', 'featuredModules');
    if (id === 'allModules') return mockElement('div', 'allModules');
    return mockElement('div', id);
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : mockElement();
  },
  querySelectorAll(sel) {
    const res = [];
    const traverse = (node) => {
      if (sel === 'select' && node.tagName === 'SELECT') res.push(node);
      if (sel.includes('.btn') && node.classList.contains('btn')) res.push(node);
      if (sel.includes('data-settings-tab') && node.getAttribute('data-settings-tab')) res.push(node);
      if (sel === '*') res.push(node);
      node.children.forEach(traverse);
    };
    traverse(this.documentElement);
    traverse(this.body);
    return res;
  },
  addEventListener(event, cb) {
    documentListeners.push({ event, cb });
  }
};

const mutationObservers = [];
function triggerMutation(type, target, addedNodes, removedNodes) {
  mutationObservers.forEach(obs => {
    if (obs.options.subtree || obs.target === target) {
      obs.callback([{
        type,
        target,
        addedNodes,
        removedNodes
      }]);
    }
  });
}

class MockMutationObserver {
  constructor(cb) {
    this.callback = cb;
  }
  observe(target, options) {
    this.target = target;
    this.options = options;
    mutationObservers.push(this);
  }
  disconnect() {
    const idx = mutationObservers.indexOf(this);
    if (idx !== -1) mutationObservers.splice(idx, 1);
  }
}

const mockWindow = {
  location: { search: '', pathname: '/admin' },
  localStorage: {
    getItem(key) { return null; },
    setItem() {}
  },
  addEventListener() {},
  setTimeout(cb, delay) { return setTimeout(cb, delay); },
  setInterval(cb, delay) { return setInterval(cb, delay); },
  innerWidth: 1024,
  innerHeight: 768,
  lucide: { createIcons: () => {} },
  document: mockDocument,
  MutationObserver: MockMutationObserver,
  console: {
    log: (...args) => console.log('[Client Log]', ...args),
    warn: (...args) => console.warn('[Client Warn]', ...args),
    error: (...args) => console.error('[Client Error]', ...args)
  }
};

const sandbox = {
  localStorage: mockWindow.localStorage,
  setTimeout: mockWindow.setTimeout,
  MutationObserver: MockMutationObserver,
  Node: { ELEMENT_NODE: 1 },
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  console: mockWindow.console,
  URLSearchParams: class {
    constructor() { return { get: () => null }; }
  },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') })
};

mockDocument.elementFromPoint = () => null;

// Set up window self-reference and expose mockWindow properties to sandbox root
Object.assign(sandbox, mockWindow);
sandbox.window = sandbox;

// Set up a watchdog timeout
const timer = setTimeout(() => {
  console.error("Watchdog triggered: Script is hung!");
  process.exit(1);
}, 3000);

try {
  console.log("Running script inside VM...");
  vm.createContext(sandbox);
  vm.runInContext(jsContent, sandbox);
  
  // Trigger DOMContentLoaded
  console.log("Triggering DOMContentLoaded...");
  documentListeners.forEach(listener => {
    if (listener.event === 'DOMContentLoaded') {
      listener.cb();
    }
  });
  
  console.log("Success! No hang detected in mock environment.");
  clearTimeout(timer);
} catch (err) {
  console.error("Error running script:", err);
  clearTimeout(timer);
}
